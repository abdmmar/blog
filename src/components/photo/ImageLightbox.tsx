import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useState } from "react";
import Zoom from "react-medium-image-zoom";
import "react-medium-image-zoom/dist/styles.css";
import ResponsiveImg from "./ResponsiveImg";

export type LightboxImage = {
  src: string;
  alt?: string;
  caption?: string;
};

type Props = {
  images: LightboxImage[];
  initialIndex?: number;
  open: boolean;
  onClose: () => void;
};

export default function ImageLightbox({
  images,
  initialIndex = 0,
  open,
  onClose,
}: Props) {
  const [current, setCurrent] = useState(initialIndex);
  const [direction, setDirection] = useState(0);

  // Reset to initialIndex when modal opens
  useEffect(() => {
    if (open) {
      setCurrent(initialIndex);
      setDirection(0);
    }
  }, [open, initialIndex]);

  // Lock body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
  }, [open]);

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

  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") goNext();
      else if (e.key === "ArrowLeft") goPrev();
      else if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, goNext, goPrev, onClose]);

  if (!open || images.length === 0) return null;

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
    <div
      className="fixed inset-0 bg-black/95 flex flex-col z-50"
      onClick={(e) => {
        // Close when clicking the backdrop (not image/buttons)
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-4 text-white/80">
        <span className="text-sm tabular-nums">
          {images.length > 1 ? `${current + 1} / ${images.length}` : ""}
        </span>
        <button
          onClick={onClose}
          className="p-1 hover:text-white transition-colors"
          aria-label="Close lightbox"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-6 h-6"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      {/* Image area */}
      <div
        className="flex-1 relative flex items-center justify-center overflow-hidden px-16 sm:px-4"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
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
              <ResponsiveImg
                src={img.src}
                alt={img.alt || ""}
                className="max-h-[calc(100vh-160px)] max-w-full object-contain"
                loading="eager"
                sizes="100vw"
              />
            </Zoom>
            {img.caption && (
              <p className="text-white/60 text-sm text-center max-w-[70ch] px-4">
                {img.caption}
              </p>
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
    </div>
  );
}
