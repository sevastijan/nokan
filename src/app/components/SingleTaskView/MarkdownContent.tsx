"use client";

interface MarkdownContentProps {
  /**
   * Markdown content string, which may contain images in format ![alt](url)
   */
  content: string;
  /**
   * Callback function triggered when an image is clicked, receiving the image URL
   */
  onImageClick: (url: string) => void;
}

/**
 * Component rendering markdown content with support for images.
 * Images are extracted and rendered as <img> elements that can be clicked.
 * Non-image text parts are rendered inside <span> elements preserving whitespace.
 *
 * @param {MarkdownContentProps} props - Component props
 * @returns React element displaying parsed markdown with clickable images
 */
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
