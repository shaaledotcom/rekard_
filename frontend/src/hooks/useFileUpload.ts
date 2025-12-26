"use client";

import { useState, useCallback } from "react";
import { config } from "@/lib/config";

export type UploadCategory = "events" | "tickets" | "platform" | "users" | "chat";

export interface UploadedFile {
  key: string;
  url: string;
  originalName: string;
  mimeType: string;
  size: number;
  uploadedAt: string;
}

export interface UploadResult {
  success: boolean;
  file?: UploadedFile;
  error?: string;
}

export interface UseFileUploadOptions {
  category?: UploadCategory;
  onProgress?: (progress: number) => void;
}

export function useFileUpload(options: UseFileUploadOptions = {}) {
  const { category = "tickets", onProgress } = options;
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  /**
   * Upload a single file to S3
   */
  const uploadFile = useCallback(
    async (
      file: File,
      accessToken: string,
      uploadCategory?: UploadCategory
    ): Promise<UploadResult> => {
      setIsUploading(true);
      setProgress(0);
      setError(null);

      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("category", uploadCategory || category);

        // Use XMLHttpRequest for progress tracking
        return new Promise((resolve) => {
          const xhr = new XMLHttpRequest();

          xhr.upload.addEventListener("progress", (event) => {
            if (event.lengthComputable) {
              const percentComplete = Math.round((event.loaded / event.total) * 100);
              setProgress(percentComplete);
              onProgress?.(percentComplete);
            }
          });

          xhr.addEventListener("load", () => {
            setIsUploading(false);
            
            if (xhr.status >= 200 && xhr.status < 300) {
              const response = JSON.parse(xhr.responseText);
              if (response.success) {
                resolve({ success: true, file: response.data });
              } else {
                const errorMsg = response.message || "Upload failed";
                setError(errorMsg);
                resolve({ success: false, error: errorMsg });
              }
            } else {
              let errorMsg = "Upload failed";
              try {
                const response = JSON.parse(xhr.responseText);
                errorMsg = response.message || response.error || errorMsg;
              } catch {
                // Ignore parse error
              }
              setError(errorMsg);
              resolve({ success: false, error: errorMsg });
            }
          });

          xhr.addEventListener("error", () => {
            setIsUploading(false);
            const errorMsg = "Network error during upload";
            setError(errorMsg);
            resolve({ success: false, error: errorMsg });
          });

          xhr.addEventListener("abort", () => {
            setIsUploading(false);
            const errorMsg = "Upload aborted";
            setError(errorMsg);
            resolve({ success: false, error: errorMsg });
          });

          xhr.open("POST", `${config.apiUrl}/v1/uploads/image`);
          xhr.setRequestHeader("Authorization", `Bearer ${accessToken}`);
          xhr.setRequestHeader("X-Service", "producer");
          xhr.withCredentials = true;
          xhr.send(formData);
        });
      } catch (err) {
        setIsUploading(false);
        const errorMsg = err instanceof Error ? err.message : "Upload failed";
        setError(errorMsg);
        return { success: false, error: errorMsg };
      }
    },
    [category, onProgress]
  );

  /**
   * Upload multiple files to S3
   */
  const uploadFiles = useCallback(
    async (
      files: File[],
      accessToken: string,
      uploadCategory?: UploadCategory
    ): Promise<UploadResult[]> => {
      const results: UploadResult[] = [];
      
      for (const file of files) {
        const result = await uploadFile(file, accessToken, uploadCategory);
        results.push(result);
      }
      
      return results;
    },
    [uploadFile]
  );

  /**
   * Upload a file using fetch (simpler, no progress tracking)
   */
  const uploadFileSimple = useCallback(
    async (
      file: File,
      accessToken: string,
      uploadCategory?: UploadCategory
    ): Promise<UploadResult> => {
      setIsUploading(true);
      setError(null);

      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("category", uploadCategory || category);

        const response = await fetch(`${config.apiUrl}/v1/uploads/image`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "X-Service": "producer",
          },
          credentials: "include",
          body: formData,
        });

        const data = await response.json();

        if (response.ok && data.success) {
          setIsUploading(false);
          return { success: true, file: data.data };
        } else {
          const errorMsg = data.message || data.error || "Upload failed";
          setError(errorMsg);
          setIsUploading(false);
          return { success: false, error: errorMsg };
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Upload failed";
        setError(errorMsg);
        setIsUploading(false);
        return { success: false, error: errorMsg };
      }
    },
    [category]
  );

  /**
   * Upload media for video files
   */
  const uploadMedia = useCallback(
    async (
      file: File,
      accessToken: string,
      uploadCategory?: UploadCategory
    ): Promise<UploadResult> => {
      setIsUploading(true);
      setProgress(0);
      setError(null);

      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("category", uploadCategory || category);

        const response = await fetch(`${config.apiUrl}/v1/uploads/media`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "X-Service": "producer",
          },
          credentials: "include",
          body: formData,
        });

        const data = await response.json();

        if (response.ok && data.success) {
          setIsUploading(false);
          return { success: true, file: data.data };
        } else {
          const errorMsg = data.message || data.error || "Upload failed";
          setError(errorMsg);
          setIsUploading(false);
          return { success: false, error: errorMsg };
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Upload failed";
        setError(errorMsg);
        setIsUploading(false);
        return { success: false, error: errorMsg };
      }
    },
    [category]
  );

  return {
    uploadFile,
    uploadFiles,
    uploadFileSimple,
    uploadMedia,
    isUploading,
    progress,
    error,
  };
}

