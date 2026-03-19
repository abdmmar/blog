import * as Dialog from "@radix-ui/react-dialog";
import { useCallback, useEffect, useRef, useState } from "react";
import ImageViewer, { type LightboxImage } from "./ImageViewer";

export type { LightboxImage };

type Props = {
  images: LightboxImage[];
  initialIndex?: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export default function ImageLightbox({
  images,
  initialIndex = 0,
  open,
  onOpenChange,
}: Props) {
  const [current, setCurrent] = useState(initialIndex);
  const triggerRef = useRef<HTMLElement | null>(null);

  // Reset index when opening; capture the element that triggered the open
  // so Radix can restore focus to it on close.
  useEffect(() => {
    if (open) {
      setCurrent(initialIndex);
      triggerRef.current = document.activeElement as HTMLElement;
    }
  }, [open, initialIndex]);

  const goNext = useCallback(() => {
    setCurrent((c) => Math.min(c + 1, images.length - 1));
  }, [images.length]);

  const goPrev = useCallback(() => {
    setCurrent((c) => Math.max(c - 1, 0));
  }, []);

  // Arrow key navigation — Radix handles Escape → onOpenChange(false)
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") {
        e.preventDefault();
        goNext();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        goPrev();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, goNext, goPrev]);

  const img = images[current];

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/95 z-50" />
        <Dialog.Content
          className="fixed inset-0 z-50 flex flex-col outline-none"
          aria-label={
            img
              ? `Image viewer: ${img.alt || img.caption || "photo"}`
              : "Image viewer"
          }
          // Restore focus to the element that triggered the lightbox.
          // Radix auto-restores to Dialog.Trigger, but we open programmatically
          // so we point it at the clicked image's container.
          onCloseAutoFocus={(e) => {
            e.preventDefault();
            triggerRef.current?.focus();
          }}
        >
          {/* Top bar */}
          <div className="flex items-center justify-between px-6 py-4 text-white/80 shrink-0">
            <span className="text-sm tabular-nums" aria-live="polite">
              {images.length > 1 ? `${current + 1} / ${images.length}` : ""}
            </span>
            <Dialog.Close
              className="p-1 hover:text-white transition-colors"
              aria-label="Close image viewer"
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
            </Dialog.Close>
          </div>

          {/* Image viewer */}
          <ImageViewer
            images={images}
            current={current}
            onPrev={goPrev}
            onNext={goNext}
          />
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
