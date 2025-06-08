import { useState } from 'react';

export const useImagePreview = () => {
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const openImagePreview = (imageUrl: string) => {
    setImagePreview(imageUrl);
  };

  const closeImagePreview = () => {
    setImagePreview(null);
  };

  return {
    imagePreview,
    openImagePreview,
    closeImagePreview,
  };
};