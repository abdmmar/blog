import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useRef, useState } from "react";
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
  current: number;
  onPrev: () => void;
  onNext: () => void;
  /** Fallback alt text when image.alt is empty */
  fallbackAlt?: string;
};

const SWIPE_THRESHOLD = 50;

const slideVariants = {
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

export default function ImageViewer({
  images,
  current,
  onPrev,
  onNext,
  fallbackAlt = "",
}: Props) {
  const [direction, setDirection] = useState(0);
  const [prevIndex, setPrevIndex] = useState(current);
  const pointerStartX = useRef<number | null>(null);

  // Track direction from index changes
  if (current !== prevIndex) {
    setDirection(current > prevIndex ? 1 : -1);
    setPrevIndex(current);
  }

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    // Only track single-finger touch or mouse
    if (e.pointerType === "touch" || e.pointerType === "mouse") {
      pointerStartX.current = e.clientX;
    }
  }, []);

  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (pointerStartX.current === null) return;
      const delta = e.clientX - pointerStartX.current;
      pointerStartX.current = null;
      if (Math.abs(delta) < SWIPE_THRESHOLD) return;
      if (delta < 0) onNext();
      else onPrev();
    },
    [onNext, onPrev],
  );

  const img = images[current];
  if (!img) return null;

  return (
    <div
      className="flex-1 relative flex items-center justify-center overflow-hidden px-14 sm:px-4"
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
    >
      {/* Prev button */}
      {current > 0 && (
        <button
          onClick={onPrev}
          className="absolute left-2 z-10 p-2 text-white/50 hover:text-white transition-colors sm:hidden"
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
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.2, ease: "easeInOut" }}
          className="flex flex-col items-center gap-3 max-h-full w-full"
        >
          <Zoom>
            <ResponsiveImg
              src={img.src}
              alt={img.alt || fallbackAlt}
              className="max-h-[calc(100vh-180px)] max-w-full object-contain mx-auto block"
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
          onClick={onNext}
          className="absolute right-2 z-10 p-2 text-white/50 hover:text-white transition-colors sm:hidden"
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
  );
}
