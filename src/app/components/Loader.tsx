"use client";

import { JSX } from "react";

interface LoaderProps {
  text?: string;
}

/**
 * Custom Loader with glow spinner, animated dots, and logo watermark
 */
const Loader = ({ text = "Loading..." }: LoaderProps): JSX.Element => {
  return (
    <div className="fixed inset-0 bg-gray-900/95 backdrop-blur-sm flex items-center justify-center z-50 select-none">
      <div className="relative z-10 flex flex-col items-center">
        {/* Glowing spinner */}
        <div className="relative mb-4">
          <span className="block h-14 w-14 rounded-full border-4 border-blue-500/30 border-t-blue-400 animate-spin shadow-lg" />
          <span className="absolute inset-0 rounded-full blur-md bg-blue-600/20 animate-pulse" />
        </div>
        <p className="text-white font-semibold text-lg tracking-wide drop-shadow-md mb-1">
          {text}
        </p>
        {/* Animated dots */}
        <div className="flex justify-center items-center gap-1 mt-1">
          <span
            className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"
            style={{ animationDelay: "0s" }}
          />
          <span
            className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"
            style={{ animationDelay: "0.15s" }}
          />
          <span
            className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"
            style={{ animationDelay: "0.3s" }}
          />
        </div>
      </div>
    </div>
  );
};

export default Loader;
