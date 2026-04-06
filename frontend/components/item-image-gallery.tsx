'use client';

import { useEffect, useState } from 'react';

import { DEFAULT_ITEM_IMAGE_URL } from '@/lib/default-item-image';

type Props = {
  title: string;
  images: string[];
};

export default function ItemImageGallery({ title, images }: Props) {
  const displayImages = images.length > 0 ? images : [DEFAULT_ITEM_IMAGE_URL];
  const [selectedImage, setSelectedImage] = useState(displayImages[0] ?? DEFAULT_ITEM_IMAGE_URL);

  useEffect(() => {
    const next = images.length > 0 ? images : [DEFAULT_ITEM_IMAGE_URL];
    setSelectedImage(next[0] ?? DEFAULT_ITEM_IMAGE_URL);
  }, [images]);

  if (!selectedImage) {
    return null;
  }

  return (
    <div className="detail-gallery">
      <div
        className="detail-image"
        style={{ backgroundImage: `url(${selectedImage})` }}
        aria-label={title}
      />
      {displayImages.length > 1 ? (
        <div className="detail-thumb-row">
          {displayImages.map((image, index) => (
            <button
              key={`${image}-${index}`}
              type="button"
              className={`detail-thumb ${selectedImage === image ? 'active' : ''}`}
              style={{ backgroundImage: `url(${image})` }}
              onClick={() => setSelectedImage(image)}
              aria-label={`${title} 이미지 ${index + 1}`}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
