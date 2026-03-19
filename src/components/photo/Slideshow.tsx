import { useCallback, useEffect, useState } from "react";
import ImageViewer, { type LightboxImage } from "./ImageViewer";

type ExifData = {
  iso?: string;
  shutterspeed?: string;
  aperture?: string;
  lens?: string;
  author?: string;
};

type Props = {
  images: LightboxImage[];
  title: string;
  exif?: ExifData;
};

export default function Slideshow({ images, title, exif }: Props) {
  const [current, setCurrent] = useState(0);

  const goNext = useCallback(() => {
    setCurrent((c) => Math.min(c + 1, images.length - 1));
  }, [images.length]);

  const goPrev = useCallback(() => {
    setCurrent((c) => Math.max(c - 1, 0));
  }, []);

  const goBack = useCallback(() => {
    window.location.href = "/photo";
  }, []);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") goNext();
      else if (e.key === "ArrowLeft") goPrev();
      else if (e.key === "Escape") goBack();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [goNext, goPrev, goBack]);

  return (
    <div className="fixed inset-0 bg-black flex flex-col z-50">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-4 text-white/80">
        <button
          onClick={goBack}
          className="flex items-center gap-2 hover:text-white transition-colors"
          aria-label="Back to gallery"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-5 h-5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
            />
          </svg>
          <span className="text-sm">Back</span>
        </button>
        <span className="text-sm font-medium">{title}</span>
        <span className="text-sm tabular-nums">
          {images.length > 1 ? `${current + 1} / ${images.length}` : ""}
        </span>
      </div>

      {/* Shared image viewer */}
      <ImageViewer
        images={images}
        current={current}
        onPrev={goPrev}
        onNext={goNext}
        fallbackAlt={title}
      />

      {/* EXIF metadata panel */}
      {exif && (exif.iso || exif.aperture || exif.shutterspeed || exif.lens) && (
        <div className="px-6 py-3 flex items-center justify-center gap-6 text-white/50 text-xs">
          {exif.lens && <span>{exif.lens}</span>}
          {exif.aperture && <span>{exif.aperture}</span>}
          {exif.shutterspeed && <span>{exif.shutterspeed}</span>}
          {exif.iso && <span>ISO {exif.iso}</span>}
        </div>
      )}
    </div>
  );
}
