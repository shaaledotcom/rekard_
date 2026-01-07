"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Hls from "hls.js";
import { SkipBack, SkipForward, Play, Pause, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import ProgressBar from "./ProgressBar";
import PlayPauseButton from "./PlayPauseButton";
import VolumeControl from "./VolumeControl";
import PlaybackRateSelector from "./PlaybackRateSelector";
import ResolutionSelector from "./ResolutionSelector";
import SubtitleSelector from "./SubtitleSelector";
import FullscreenButton from "./FullscreenButton";
import LoadingIndicator from "./LoadingIndicator";
import PlayPauseAnimation from "./PlayPauseAnimation";
import OverlayIcon from "./OverlayIcon";
import VideoLoop from "./VideoLoop";
import { useFullscreenHandler } from "./useFullscreenHandler";

interface VideoPlayerProps {
  src: string;
  thumbnailSrc?: string;
  onEnded: () => void;
  videoData?: {
    type?: "video" | "audio";
  };
  initialTime?: number;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({
  src,
  thumbnailSrc,
  onEnded,
  videoData,
  initialTime = 0,
}) => {
  const { containerRef, videoRef, isFullscreen, handleFullscreen } =
    useFullscreenHandler();
  const hlsRef = useRef<Hls | null>(null);

  // Playback state
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isBuffering, setIsBuffering] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [bufferedTime, setBufferedTime] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isLooping, setIsLooping] = useState(false);

  // HLS state
  const [availableResolutions, setAvailableResolutions] = useState<string[]>([]);
  const [selectedResolution, setSelectedResolution] = useState<string>("");
  const [availableSubtitles, setAvailableSubtitles] = useState<string[]>([]);
  const [selectedSubtitle, setSelectedSubtitle] = useState<string>("off");

  // UI state
  const [showControls, setShowControls] = useState(true);
  const [showPlayPauseAnimation, setShowPlayPauseAnimation] = useState(false);
  const [overlayIcon, setOverlayIcon] = useState<React.ReactNode>(null);
  const [showOverlay, setShowOverlay] = useState(false);

  const hideControlsTimer = useRef<NodeJS.Timeout | null>(null);

  // Check if source is HLS stream
  const isHlsStream = (source: string): boolean => {
    if (!source) return false;
    // Check if it's an HLS manifest file (.m3u8)
    return source.includes('.m3u8') || source.includes('application/vnd.apple.mpegurl');
  };

  // Initialize HLS
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src || !src.trim()) return;

    const initializeHls = () => {
      // Only use HLS.js for HLS streams, use native player for MP4 and other formats
      if (isHlsStream(src)) {
        if (Hls.isSupported()) {
          const hls = new Hls({
            enableWorker: true,
            lowLatencyMode: true,
          });

          hls.loadSource(src);
          hls.attachMedia(video);

          hls.on(Hls.Events.MANIFEST_PARSED, (_, data) => {
            setIsLoading(false);
            // Get available resolutions
            const levels = data.levels.map((level) => `${level.height}p`);
            setAvailableResolutions(levels);
            if (levels.length > 0) {
              setSelectedResolution(levels[0]);
            }
          });

          hls.on(Hls.Events.SUBTITLE_TRACKS_UPDATED, (_, data) => {
            const tracks = data.subtitleTracks.map((track) => track.name);
            setAvailableSubtitles(tracks);
          });

          hls.on(Hls.Events.ERROR, (_, data) => {
            if (data.fatal) {
              console.error("HLS fatal error:", data);
              switch (data.type) {
                case Hls.ErrorTypes.NETWORK_ERROR:
                  hls.startLoad();
                  break;
                case Hls.ErrorTypes.MEDIA_ERROR:
                  hls.recoverMediaError();
                  break;
                default:
                  break;
              }
            }
          });

          hlsRef.current = hls;
        } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
          video.src = src;
          setIsLoading(false);
        }
      } else {
        // Use native HTML5 video player for MP4 and other formats
        video.src = src;
        setIsLoading(false);
      }
    };

    const handleLoadStart = () => setIsLoading(true);
    const handleDurationChange = () => setDuration(video.duration);
    const handleTimeUpdate = () => setCurrentTime(video.currentTime);
    const handleLoadedData = () => {
      setIsLoading(false);
      if (initialTime > 0) {
        video.currentTime = initialTime;
      }
    };
    const handleWaiting = () => setIsBuffering(true);
    const handlePlaying = () => {
      setIsBuffering(false);
      setIsPlaying(true);
    };
    const handlePlay = () => {
      setIsPlaying(true);
      triggerOverlayIcon(<Play className="h-8 w-8 text-white fill-white" />);
    };
    const handlePause = () => {
      setIsPlaying(false);
      triggerOverlayIcon(<Pause className="h-8 w-8 text-white fill-white" />);
    };
    const handleProgress = () => {
      if (video.buffered.length > 0) {
        setBufferedTime(video.buffered.end(video.buffered.length - 1));
      }
    };
    const handleEnded = () => {
      if (isLooping) {
        video.currentTime = 0;
        video.play();
      } else {
        onEnded();
      }
    };

    initializeHls();

    video.addEventListener("loadstart", handleLoadStart);
    video.addEventListener("loadeddata", handleLoadedData);
    video.addEventListener("waiting", handleWaiting);
    video.addEventListener("playing", handlePlaying);
    video.addEventListener("play", handlePlay);
    video.addEventListener("pause", handlePause);
    video.addEventListener("durationchange", handleDurationChange);
    video.addEventListener("timeupdate", handleTimeUpdate);
    video.addEventListener("progress", handleProgress);
    video.addEventListener("ended", handleEnded);

    return () => {
      video.removeEventListener("loadstart", handleLoadStart);
      video.removeEventListener("durationchange", handleDurationChange);
      video.removeEventListener("timeupdate", handleTimeUpdate);
      video.removeEventListener("loadeddata", handleLoadedData);
      video.removeEventListener("waiting", handleWaiting);
      video.removeEventListener("playing", handlePlaying);
      video.removeEventListener("play", handlePlay);
      video.removeEventListener("pause", handlePause);
      video.removeEventListener("progress", handleProgress);
      video.removeEventListener("ended", handleEnded);

      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [src, initialTime, isLooping, onEnded]);

  // Update video loop state
  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      video.loop = isLooping;
    }
  }, [isLooping, videoRef]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const video = videoRef.current;
      if (!video) return;

      // Ignore if typing in input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      switch (e.key) {
        case " ":
        case "k":
          e.preventDefault();
          handlePlayPause();
          break;
        case "ArrowRight":
          e.preventDefault();
          handleForward();
          break;
        case "ArrowLeft":
          e.preventDefault();
          handleBackward();
          break;
        case "ArrowUp":
          e.preventDefault();
          handleVolumeChange(Math.min(volume + 0.1, 1));
          break;
        case "ArrowDown":
          e.preventDefault();
          handleVolumeChange(Math.max(volume - 0.1, 0));
          break;
        case "m":
          e.preventDefault();
          handleMuteUnmute();
          break;
        case "f":
          e.preventDefault();
          handleFullscreen();
          break;
        case "l":
          e.preventDefault();
          setIsLooping((prev) => !prev);
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [volume, handleFullscreen]);

  // Update video volume
  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      video.volume = volume;
    }
  }, [volume, videoRef]);

  // Auto-hide controls
  useEffect(() => {
    if (!isPlaying || !showControls) return;

    if (hideControlsTimer.current) {
      clearTimeout(hideControlsTimer.current);
    }

    hideControlsTimer.current = setTimeout(() => {
      setShowControls(false);
    }, 3000);

    return () => {
      if (hideControlsTimer.current) {
        clearTimeout(hideControlsTimer.current);
      }
    };
  }, [showControls, isPlaying]);

  const triggerOverlayIcon = (icon: React.ReactNode) => {
    setOverlayIcon(icon);
    setShowOverlay(true);
    setTimeout(() => setShowOverlay(false), 600);
  };

  const triggerPlayPauseAnimation = () => {
    setShowPlayPauseAnimation(true);
    setTimeout(() => setShowPlayPauseAnimation(false), 500);
  };

  const handlePlayPause = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play();
    } else {
      video.pause();
    }
    triggerPlayPauseAnimation();
  };

  const handleMuteUnmute = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setIsMuted(video.muted);
    triggerOverlayIcon(
      video.muted ? (
        <VolumeX className="h-8 w-8 text-white" />
      ) : (
        <Volume2 className="h-8 w-8 text-white" />
      )
    );
  };

  const handleVolumeChange = (newVolume: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.volume = newVolume;
    setVolume(newVolume);
    if (newVolume === 0) {
      video.muted = true;
      setIsMuted(true);
    } else if (video.muted) {
      video.muted = false;
      setIsMuted(false);
    }
  };

  const handleForward = () => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = Math.min(video.currentTime + 10, duration);
    triggerOverlayIcon(<SkipForward className="h-8 w-8 text-white" />);
  };

  const handleBackward = () => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = Math.max(video.currentTime - 10, 0);
    triggerOverlayIcon(<SkipBack className="h-8 w-8 text-white" />);
  };

  const handleSeek = (time: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = time;
    setCurrentTime(time);
  };

  const handlePlaybackRateChange = (rate: string) => {
    const video = videoRef.current;
    if (!video) return;
    const numericRate = parseFloat(rate);
    video.playbackRate = numericRate;
    setPlaybackRate(numericRate);
  };

  const handleResolutionChange = (resolution: string) => {
    setSelectedResolution(resolution);
    if (hlsRef.current && resolution !== "auto") {
      const levelIndex = availableResolutions.indexOf(resolution);
      if (levelIndex !== -1) {
        hlsRef.current.currentLevel = levelIndex;
      }
    } else if (hlsRef.current) {
      hlsRef.current.currentLevel = -1; // Auto
    }
  };

  const handleSubtitleChange = (subtitle: string) => {
    setSelectedSubtitle(subtitle);
    if (hlsRef.current) {
      if (subtitle === "off") {
        hlsRef.current.subtitleTrack = -1;
      } else {
        const subtitleIndex = availableSubtitles.indexOf(subtitle);
        if (subtitleIndex !== -1) {
          hlsRef.current.subtitleTrack = subtitleIndex;
        }
      }
    }
  };

  const formatTime = useCallback((time: number): string => {
    if (isNaN(time) || !isFinite(time)) return "0:00";
    const hours = Math.floor(time / 3600);
    const minutes = Math.floor((time % 3600) / 60);
    const seconds = Math.floor(time % 60);
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds
        .toString()
        .padStart(2, "0")}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full bg-black select-none"
      onMouseMove={() => setShowControls(true)}
      onMouseLeave={() => isPlaying && setShowControls(false)}
    >
      <video
        ref={videoRef}
        className="w-full h-full object-contain"
        controls={false}
        onClick={handlePlayPause}
        onDoubleClick={handleFullscreen}
        autoPlay
        playsInline
        poster={thumbnailSrc}
      />

      {/* Loading/Buffering Indicator */}
      {(isLoading || isBuffering) && <LoadingIndicator />}

      {/* Play/Pause Animation */}
      <PlayPauseAnimation isPlaying={isPlaying} show={showPlayPauseAnimation} />

      {/* Overlay Icon */}
      {showOverlay && overlayIcon && <OverlayIcon icon={overlayIcon} />}

      {/* Controls Overlay */}
      <div
        className={`absolute bottom-0 left-0 right-0 flex flex-col p-2 sm:p-4 bg-gradient-to-t from-black/80 via-black/40 to-transparent transition-opacity duration-300 ${
          showControls ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      >
        {/* Progress Bar */}
        <ProgressBar
          currentTime={currentTime}
          duration={duration}
          bufferedTime={bufferedTime}
          onSeek={handleSeek}
          videoRef={videoRef as React.RefObject<HTMLVideoElement>}
        />

        {/* Controls Row */}
        <div className="flex items-center justify-between">
          {/* Left Controls */}
          <div className="flex items-center gap-0.5 sm:gap-1">
            <PlayPauseButton isPlaying={isPlaying} onPlayPause={handlePlayPause} />

            <VideoLoop isLooping={isLooping} onToggleLoop={() => setIsLooping(!isLooping)} />

            <VolumeControl
              isMuted={isMuted}
              volume={volume}
              onMuteUnmute={handleMuteUnmute}
              onVolumeChange={handleVolumeChange}
            />

            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20 h-8 w-8 sm:h-10 sm:w-10"
              onClick={handleBackward}
              title="Rewind 10s"
            >
              <SkipBack className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20 h-8 w-8 sm:h-10 sm:w-10"
              onClick={handleForward}
              title="Forward 10s"
            >
              <SkipForward className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>

            {/* Time Display */}
            <span className="text-white text-xs sm:text-sm ml-2 tabular-nums">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-0.5 sm:gap-1">
            <PlaybackRateSelector
              currentRate={playbackRate}
              onRateChange={handlePlaybackRateChange}
            />

            {videoData?.type === "video" && availableResolutions.length > 0 && (
              <ResolutionSelector
                currentResolution={selectedResolution}
                availableResolutions={availableResolutions}
                onResolutionChange={handleResolutionChange}
              />
            )}

            {availableSubtitles.length > 0 && (
              <SubtitleSelector
                currentSubtitle={selectedSubtitle}
                availableSubtitles={availableSubtitles}
                onSubtitleChange={handleSubtitleChange}
              />
            )}

            <FullscreenButton
              isFullscreen={isFullscreen}
              onFullscreenToggle={handleFullscreen}
            />
          </div>
        </div>
      </div>

      {/* Center Play Button (when paused and not loading) */}
      {!isPlaying && !isLoading && !isBuffering && (
        <div
          className="absolute inset-0 flex items-center justify-center cursor-pointer"
          onClick={handlePlayPause}
        >
          <div className="bg-black/50 rounded-full p-4 hover:bg-black/70 transition-colors">
            <Play className="h-12 w-12 text-white fill-white" />
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoPlayer;

