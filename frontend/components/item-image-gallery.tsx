'use client';

import { useEffect, useState } from 'react';

type Props = {
  title: string;
  images: string[];
};

export default function ItemImageGallery({ title, images }: Props) {
  const [selectedImage, setSelectedImage] = useState(images[0] ?? '');

  useEffect(() => {
    setSelectedImage(images[0] ?? '');
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
      {images.length > 1 ? (
        <div className="detail-thumb-row">
          {images.map((image, index) => (
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
