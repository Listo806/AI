import { useState, useRef, useEffect } from 'react';
import './ImageCarousel.css';

/**
 * Airbnb-style image carousel for listing cards.
 * - Left/right arrow buttons (only show on hover)
 * - Dot indicators at bottom
 * - "1/N" counter (hidden when single image)
 * - Stops event propagation so card click still works normally for arrows
 *
 * Props:
 *   images: string[]  (required, at least 1 expected — if empty renders placeholder)
 *   alt?: string
 *   onClickImage?: (e) => void  (fired when user clicks the image area itself, not the arrows)
 *   className?: string
 */
export default function ImageCarousel({ images = [], alt = '', onClickImage, className = '' }) {
  const safe = Array.isArray(images) ? images.filter(Boolean) : [];
  const [index, setIndex] = useState(0);
  const containerRef = useRef(null);

  useEffect(() => {
    if (index >= safe.length) setIndex(0);
  }, [safe.length, index]);

  if (safe.length === 0) {
    return (
      <div
        className={`ic-wrap ic-empty ${className}`}
        onClick={onClickImage}
        role={onClickImage ? 'button' : undefined}
      >
        <div className="ic-placeholder" aria-hidden />
      </div>
    );
  }

  const goPrev = (e) => {
    e?.stopPropagation();
    e?.preventDefault();
    setIndex((i) => (i - 1 + safe.length) % safe.length);
  };

  const goNext = (e) => {
    e?.stopPropagation();
    e?.preventDefault();
    setIndex((i) => (i + 1) % safe.length);
  };

  const hasMany = safe.length > 1;

  return (
    <div
      className={`ic-wrap ${className}`}
      ref={containerRef}
      onClick={onClickImage}
      role={onClickImage ? 'button' : undefined}
    >
      {/* Image stack */}
      <div className="ic-slides">
        {safe.map((src, i) => (
          <img
            key={`${src}-${i}`}
            src={src}
            alt={alt}
            loading="lazy"
            draggable={false}
            className={`ic-slide ${i === index ? 'ic-slide-active' : ''}`}
          />
        ))}
      </div>

      {/* Arrows */}
      {hasMany && (
        <>
          <button
            type="button"
            aria-label="Previous image"
            className="ic-arrow ic-arrow-prev"
            onClick={goPrev}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <button
            type="button"
            aria-label="Next image"
            className="ic-arrow ic-arrow-next"
            onClick={goNext}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </>
      )}

      {/* Dots */}
      {hasMany && (
        <div className="ic-dots" aria-hidden>
          {safe.map((_, i) => (
            <span
              key={i}
              className={`ic-dot ${i === index ? 'ic-dot-active' : ''}`}
            />
          ))}
        </div>
      )}

      {/* Counter */}
      {hasMany && (
        <div className="ic-counter" aria-live="polite">
          {index + 1} / {safe.length}
        </div>
      )}
    </div>
  );
}
