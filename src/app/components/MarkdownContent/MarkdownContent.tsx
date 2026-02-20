// src/app/components/MarkdownContent/MarkdownContent.tsx
import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';

interface MarkdownContentProps {
     content: string;
     onImageClick?: (url: string) => void;
}

// Mention component - highlighted @username
const Mention = ({ name }: { name: string }) => (
     <span className="inline-flex items-center rounded-md bg-brand-100 px-2 py-1 text-xs font-semibold text-brand-800 ring-1 ring-inset ring-brand-700/10">@{name}</span>
);

const MarkdownContent = ({ content, onImageClick }: MarkdownContentProps) => {
     return (
          <div className="prose prose-sm max-w-none prose-invert prose-headings:text-gray-100 prose-p:text-gray-300 prose-a:text-brand-400 prose-a:underline hover:prose-a:text-brand-300 prose-strong:text-gray-100 prose-em:text-gray-200 prose-code:text-brand-300 prose-code:bg-gray-800 prose-code:px-1 prose-code:rounded prose-pre:bg-gray-900 prose-pre:p-0 prose-blockquote:border-l-brand-500 prose-blockquote:text-gray-400 prose-li:text-gray-300 prose-table:text-gray-300">
               <ReactMarkdown
                    remarkPlugins={[remarkGfm, remarkBreaks]}
                    components={{
                         // Custom image renderer - clickable preview
                         img: (props) => {
                              const src = typeof props.src === 'string' ? props.src : '';
                              const alt = typeof props.alt === 'string' ? props.alt : 'image';
                              return (
                                   // eslint-disable-next-line @next/next/no-img-element
                                   <img
                                        src={src}
                                        alt={alt}
                                        className="max-w-full rounded-lg cursor-pointer hover:opacity-90 transition-opacity mt-3 mb-4 shadow-md"
                                        onClick={() => src && onImageClick?.(src)}
                                   />
                              );
                         },

                         // Links open in new tab
                         a: (props) => (
                              <a href={props.href || '#'} target="_blank" rel="noopener noreferrer" className="text-brand-400 underline hover:text-brand-300 transition">
                                   {props.children}
                              </a>
                         ),

                         // Override text elements to inject mention highlighting
                         p: ({ children }) => <p className="mb-3">{renderWithMentions(children)}</p>,
                         li: ({ children }) => <li className="ml-6 mb-1">{renderWithMentions(children)}</li>,
                         blockquote: ({ children }) => <blockquote className="border-l-4 border-brand-500 pl-4 italic my-4">{renderWithMentions(children)}</blockquote>,
                         h1: ({ children }) => <h1 className="text-2xl font-bold mt-6 mb-3">{renderWithMentions(children)}</h1>,
                         h2: ({ children }) => <h2 className="text-xl font-bold mt-5 mb-2">{renderWithMentions(children)}</h2>,
                         h3: ({ children }) => <h3 className="text-lg font-bold mt-4 mb-2">{renderWithMentions(children)}</h3>,
                    }}
               >
                    {content}
               </ReactMarkdown>
          </div>
     );
};

const renderWithMentions = (node: React.ReactNode): React.ReactNode => {
     if (typeof node === 'string') {
          const fullMentionRegex = /@\{([^}]+)\}/g;
          const parts = node.split(fullMentionRegex);

          if (parts.length > 1) {
               return parts.map((part, i) => {
                    if (i % 2 === 1) {
                         return <Mention key={i} name={part.trim()} />;
                    }
                    return fallbackMention(part);
               });
          }

          return fallbackMention(node);
     }

     if (Array.isArray(node)) {
          return node.map((child, i) => <React.Fragment key={i}>{renderWithMentions(child)}</React.Fragment>);
     }

     if (React.isValidElement(node)) {
          const element = node as React.ReactElement<{ children?: React.ReactNode }>;
          if ('children' in element.props) {
               return React.cloneElement(element, {}, renderWithMentions(element.props.children));
          }
     }

     return node;
};

// Fallback dla starych mentionów @nazwa (bez nawiasów)
const fallbackMention = (text: string) => {
     const simpleRegex = /@([\p{L}\p{N}_-]+)/gu;
     const parts = text.split(simpleRegex);

     if (parts.length === 1) return text;

     return parts.map((part, i) => {
          if (i % 2 === 1) {
               return <Mention key={i} name={part} />;
          }
          return part;
     });
};

export default MarkdownContent;
