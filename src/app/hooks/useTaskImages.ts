import { useState, useCallback, useMemo } from 'react';
import { LightboxImage } from '@/app/types/globalTypes';

export const useTaskImages = (descriptionHtml: string) => {
     const [lightboxOpen, setLightboxOpen] = useState(false);
     const [currentImageIndex, setCurrentImageIndex] = useState(0);

     const extractImages = useCallback((html: string): LightboxImage[] => {
          if (!html) return [];

          const parser = new DOMParser();
          const doc = parser.parseFromString(html, 'text/html');
          const images = doc.querySelectorAll('img');

          return Array.from(images).map((img, index) => ({
               src: img.src,
               alt: img.alt || `Task image ${index + 1}`,
               title: img.alt || `Task image ${index + 1}`,
          }));
     }, []);

     const images = useMemo(() => extractImages(descriptionHtml), [descriptionHtml, extractImages]);

     const handleImageClick = useCallback(
          (imageUrl: string) => {
               const imageIndex = images.findIndex((img) => img.src === imageUrl);
               if (imageIndex !== -1) {
                    setCurrentImageIndex(imageIndex);
                    setLightboxOpen(true);
               }
          },
          [images],
     );

     const handleClose = useCallback(() => {
          setLightboxOpen(false);
     }, []);

     const handleNavigate = useCallback((index: number) => {
          setCurrentImageIndex(index);
     }, []);

     return {
          images,
          lightboxOpen,
          currentImageIndex,
          handleImageClick,
          handleClose,
          handleNavigate,
     };
};
