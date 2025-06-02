"use client";

import { JSX } from "react";

interface LoaderProps {
  text?: string;
}

/**
 * Loading spinner component with animated dots
 * @param {string} [text="Loading..."] - Custom loading text to display
 * @returns JSX element containing the loading interface
 */
const Loader = ({ text = "Loading..." }: LoaderProps): JSX.Element => {
  return (
    <div className="fixed inset-0 bg-gray-900 flex items-center justify-center z-50">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        <p className="text-white mt-4 text-lg">{text}</p>
        <div className="flex justify-center mt-2 space-x-1">
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
          <div
            className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
            style={{ animationDelay: "0.1s" }}
          ></div>
          <div
            className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
            style={{ animationDelay: "0.2s" }}
          ></div>
        </div>
      </div>
    </div>
  );
};

export default Loader;
