"use client";

import React from "react";
import { Loader2 } from "lucide-react";

const LoadingIndicator: React.FC = () => {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-black/40 z-10">
      <div className="flex flex-col items-center gap-2">
        <Loader2 className="h-12 w-12 animate-spin text-white" />
        <span className="text-white text-sm">Loading...</span>
      </div>
    </div>
  );
};

export default LoadingIndicator;

