'use client';

import { useEffect, useCallback, useState } from 'react';
import Image from 'next/image';
import { FaTimes, FaChevronLeft, FaChevronRight, FaDownload, FaExpand, FaCompress } from 'react-icons/fa';

export interface LightboxImage {
     src: string;
     alt?: string;
     title?: string;
     downloadUrl?: string;
}

interface LightboxProps {
     images: LightboxImage[];
     currentIndex: number;
     isOpen: boolean;
     onClose: () => void;
     onNavigate?: (index: number) => void;
}

const Lightbox = ({ images, currentIndex, isOpen, onClose, onNavigate }: LightboxProps) => {
     const [imageIndex, setImageIndex] = useState(currentIndex);
     const [isZoomed, setIsZoomed] = useState(false);
     const [imageLoaded, setImageLoaded] = useState(false);

     useEffect(() => {
          setImageIndex(currentIndex);
          setImageLoaded(false);
          setIsZoomed(false);
     }, [currentIndex]);

     const handlePrevious = useCallback(() => {
          const newIndex = imageIndex > 0 ? imageIndex - 1 : images.length - 1;
          setImageIndex(newIndex);
          setImageLoaded(false);
          setIsZoomed(false);
          onNavigate?.(newIndex);
     }, [imageIndex, images.length, onNavigate]);

     const handleNext = useCallback(() => {
          const newIndex = imageIndex < images.length - 1 ? imageIndex + 1 : 0;
          setImageIndex(newIndex);
          setImageLoaded(false);
          setIsZoomed(false);
          onNavigate?.(newIndex);
     }, [imageIndex, images.length, onNavigate]);

     const handleKeyDown = useCallback(
          (e: KeyboardEvent) => {
               if (!isOpen) return;

               switch (e.key) {
                    case 'Escape':
                         onClose();
                         break;
                    case 'ArrowLeft':
                         if (images.length > 1) handlePrevious();
                         break;
                    case 'ArrowRight':
                         if (images.length > 1) handleNext();
                         break;
                    default:
                         break;
               }
          },
          [isOpen, images.length, onClose, handlePrevious, handleNext],
     );

     useEffect(() => {
          if (isOpen) {
               document.body.style.overflow = 'hidden';
               document.addEventListener('keydown', handleKeyDown);
          }

          return () => {
               document.body.style.overflow = '';
               document.removeEventListener('keydown', handleKeyDown);
          };
     }, [isOpen, handleKeyDown]);

     const handleDownload = async () => {
          const currentImage = images[imageIndex];
          const downloadUrl = currentImage.downloadUrl || currentImage.src;

          try {
               const response = await fetch(downloadUrl);
               const blob = await response.blob();
               const url = URL.createObjectURL(blob);
               const a = document.createElement('a');
               a.href = url;
               a.download = currentImage.title || `image-${imageIndex + 1}`;
               document.body.appendChild(a);
               a.click();
               document.body.removeChild(a);
               URL.revokeObjectURL(url);
          } catch (error) {
               console.error('Download failed:', error);
          }
     };

     const toggleZoom = () => {
          setIsZoomed(!isZoomed);
     };

     if (!isOpen || images.length === 0) return null;

     const currentImage = images[imageIndex];

     return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Image lightbox" onClick={onClose}>
               <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4 bg-gradient-to-b from-black/60 to-transparent">
                    <div className="flex-1 min-w-0">
                         {currentImage.title && <h2 className="text-white text-lg font-semibold truncate">{currentImage.title}</h2>}
                         {images.length > 1 && (
                              <p className="text-slate-300 text-sm">
                                   {imageIndex + 1} / {images.length}
                              </p>
                         )}
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                         <button
                              onClick={(e) => {
                                   e.stopPropagation();
                                   handleDownload();
                              }}
                              className="p-2 text-white hover:bg-white/10 rounded-lg transition-colors"
                              aria-label="Download image"
                              title="Download"
                         >
                              <FaDownload className="w-5 h-5" />
                         </button>

                         <button
                              onClick={(e) => {
                                   e.stopPropagation();
                                   toggleZoom();
                              }}
                              className="p-2 text-white hover:bg-white/10 rounded-lg transition-colors"
                              aria-label={isZoomed ? 'Zoom out' : 'Zoom in'}
                              title={isZoomed ? 'Zoom out' : 'Zoom in'}
                         >
                              {isZoomed ? <FaCompress className="w-5 h-5" /> : <FaExpand className="w-5 h-5" />}
                         </button>

                         <button
                              onClick={(e) => {
                                   e.stopPropagation();
                                   onClose();
                              }}
                              className="p-2 text-white hover:bg-white/10 rounded-lg transition-colors"
                              aria-label="Close lightbox"
                              title="Close (Esc)"
                         >
                              <FaTimes className="w-6 h-6" />
                         </button>
                    </div>
               </div>

               {images.length > 1 && (
                    <>
                         <button
                              onClick={(e) => {
                                   e.stopPropagation();
                                   handlePrevious();
                              }}
                              className="absolute left-4 top-1/2 -translate-y-1/2 z-10 p-3 text-white bg-black/50 hover:bg-black/70 rounded-full transition-all hover:scale-110 focus:outline-none focus:ring-2 focus:ring-white/50"
                              aria-label="Previous image"
                              title="Previous (←)"
                         >
                              <FaChevronLeft className="w-6 h-6" />
                         </button>

                         <button
                              onClick={(e) => {
                                   e.stopPropagation();
                                   handleNext();
                              }}
                              className="absolute right-4 top-1/2 -translate-y-1/2 z-10 p-3 text-white bg-black/50 hover:bg-black/70 rounded-full transition-all hover:scale-110 focus:outline-none focus:ring-2 focus:ring-white/50"
                              aria-label="Next image"
                              title="Next (→)"
                         >
                              <FaChevronRight className="w-6 h-6" />
                         </button>
                    </>
               )}

               <div className="relative flex items-center justify-center w-full h-full p-4 md:p-8 lg:p-16" onClick={(e) => e.stopPropagation()}>
                    {!imageLoaded && (
                         <div className="absolute inset-0 flex items-center justify-center">
                              <div className="w-12 h-12 border-4 border-slate-600 border-t-white rounded-full animate-spin" />
                         </div>
                    )}

                    <div className="relative w-full h-full flex items-center justify-center">
                         <Image
                              src={currentImage.src}
                              alt={currentImage.alt || currentImage.title || `Image ${imageIndex + 1}`}
                              fill
                              className={`object-contain transition-all duration-300 ${isZoomed ? 'cursor-zoom-out scale-150' : 'cursor-zoom-in'} ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
                              onLoad={() => setImageLoaded(true)}
                              onClick={toggleZoom}
                              draggable={false}
                              sizes="100vw"
                              quality={100}
                              unoptimized
                         />
                    </div>
               </div>

               {images.length > 1 && (
                    <div className="absolute bottom-0 left-0 right-0 z-10 p-4 bg-gradient-to-t from-black/60 to-transparent">
                         <div className="flex items-center justify-center gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-transparent">
                              {images.map((img, idx) => (
                                   <button
                                        key={idx}
                                        onClick={(e) => {
                                             e.stopPropagation();
                                             setImageIndex(idx);
                                             setImageLoaded(false);
                                             setIsZoomed(false);
                                             onNavigate?.(idx);
                                        }}
                                        className={`flex-shrink-0 w-16 h-16 md:w-20 md:h-20 rounded-lg overflow-hidden border-2 transition-all ${
                                             idx === imageIndex ? 'border-white scale-110' : 'border-slate-600 hover:border-slate-400 opacity-60 hover:opacity-100'
                                        }`}
                                        aria-label={`View image ${idx + 1}`}
                                        aria-current={idx === imageIndex ? 'true' : 'false'}
                                   >
                                        <div className="relative w-full h-full">
                                             <Image src={img.src} alt={img.alt || `Thumbnail ${idx + 1}`} fill className="object-cover" draggable={false} sizes="80px" />
                                        </div>
                                   </button>
                              ))}
                         </div>
                    </div>
               )}

               <div className="absolute bottom-20 left-1/2 -translate-x-1/2 text-slate-400 text-xs opacity-50 pointer-events-none hidden md:block">Use ← → to navigate • ESC to close</div>
          </div>
     );
};

export default Lightbox;
