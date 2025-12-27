"use client";

import React from "react";

interface OverlayIconProps {
  icon: React.ReactNode;
}

const OverlayIcon: React.FC<OverlayIconProps> = ({ icon }) => {
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
      <div className="bg-black/60 rounded-full p-4 animate-ping-once">
        {icon}
      </div>
    </div>
  );
};

export default OverlayIcon;

