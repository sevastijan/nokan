"use client";

import React from "react";

interface MarkdownContentProps {
  content: string;
  onImageClick: (url: string) => void;
}

const MarkdownContent = ({ content, onImageClick }: MarkdownContentProps) => {
  const imageRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
  const parts = content.split(imageRegex);

  const elements = [];
  for (let i = 0; i < parts.length; i += 3) {
    if (parts[i]) {
      elements.push(
        <span key={`text-${i}`} className="whitespace-pre-wrap">
          {parts[i]}
        </span>
      );
    }

    if (parts[i + 1] && parts[i + 2]) {
      elements.push(
        <img
          key={`img-${i}`}
          src={parts[i + 2]}
          alt={parts[i + 1]}
          className="max-w-full h-auto rounded-lg mt-2 mb-2 cursor-pointer border border-gray-600 hover:border-gray-500 transition-colors"
          onClick={() => onImageClick(parts[i + 2])}
          onError={(e) => console.error("Image load error:", e)}
        />
      );
    }
  }

  return <>{elements.length > 0 ? elements : content}</>;
};

export default MarkdownContent;
