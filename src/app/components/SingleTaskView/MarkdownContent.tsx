'use client';

import Image from 'next/image';

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
 * Images are extracted and rendered using next/image for optimization.
 * Non-image text parts are rendered inside <span> elements preserving whitespace.
 */
const MarkdownContent = ({ content, onImageClick }: MarkdownContentProps) => {
     const imageRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
     const parts = content.split(imageRegex);
     const elements = [];

     for (let i = 0; i < parts.length; i += 3) {
          // Text part before/next image
          if (parts[i]) {
               elements.push(
                    <span key={`text-${i}`} className="whitespace-pre-wrap">
                         {parts[i]}
                    </span>,
               );
          }

          // Image part: parts[i+1] = alt, parts[i+2] = url
          if (parts[i + 1] !== undefined && parts[i + 2]) {
               const alt = parts[i + 1] || 'Image';
               const src = parts[i + 2];

               elements.push(
                    <div key={`img-wrapper-${i}`} className="my-4">
                         <div className="relative max-w-full h-auto cursor-pointer rounded-lg overflow-hidden border border-gray-600 hover:border-gray-500 transition-colors">
                              <Image
                                   src={src}
                                   alt={alt}
                                   width={800}
                                   height={600}
                                   sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 800px"
                                   className="w-full h-auto object-contain"
                                   onClick={() => onImageClick(src)}
                                   priority={false}
                              />
                         </div>
                    </div>,
               );
          }
     }

     return <>{elements.length > 0 ? elements : <span className="whitespace-pre-wrap">{content}</span>}</>;
};

export default MarkdownContent;
