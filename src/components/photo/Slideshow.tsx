import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useState } from "react";
import Zoom from "react-medium-image-zoom";
import "react-medium-image-zoom/dist/styles.css";

type ImageItem = {
  src: string;
  alt?: string;
  caption?: string;
};

type ExifData = {
  iso?: string;
  shutterspeed?: string;
  aperture?: string;
  lens?: string;
  author?: string;
};

type Props = {
  images: ImageItem[];
  title: string;
  exif?: ExifData;
};

export default function Slideshow({ images, title, exif }: Props) {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(0);

  const goNext = useCallback(() => {
    if (current < images.length - 1) {
      setDirection(1);
      setCurrent((c) => c + 1);
    }
  }, [current, images.length]);

  const goPrev = useCallback(() => {
    if (current > 0) {
      setDirection(-1);
      setCurrent((c) => c - 1);
    }
  }, [current]);

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

  const img = images[current];

  const variants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 100 : -100,
      opacity: 0,
    }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({
      x: dir < 0 ? 100 : -100,
      opacity: 0,
    }),
  };

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

      {/* Image area */}
      <div className="flex-1 relative flex items-center justify-center overflow-hidden px-16 sm:px-4">
        {/* Prev button */}
        {current > 0 && (
          <button
            onClick={goPrev}
            className="absolute left-4 z-10 p-2 text-white/50 hover:text-white transition-colors"
            aria-label="Previous image"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-8 h-8"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 19.5L8.25 12l7.5-7.5"
              />
            </svg>
          </button>
        )}

        <AnimatePresence initial={false} custom={direction} mode="wait">
          <motion.div
            key={current}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="flex flex-col items-center gap-3 max-h-full"
          >
            <Zoom>
              <img
                src={img.src}
                alt={img.alt || title}
                className="max-h-[calc(100vh-180px)] max-w-full object-contain"
                loading="eager"
              />
            </Zoom>
            {img.caption && (
              <p className="text-white/60 text-sm text-center">{img.caption}</p>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Next button */}
        {current < images.length - 1 && (
          <button
            onClick={goNext}
            className="absolute right-4 z-10 p-2 text-white/50 hover:text-white transition-colors"
            aria-label="Next image"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-8 h-8"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8.25 4.5l7.5 7.5-7.5 7.5"
              />
            </svg>
          </button>
        )}
      </div>

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
