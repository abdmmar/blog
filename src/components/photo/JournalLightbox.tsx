import { useCallback, useEffect, useRef, useState } from "react";
import ImageLightbox, { type LightboxImage } from "./ImageLightbox";

/**
 * Collects lightbox-eligible images from journal content via explicit
 * `data-lightbox-src` attributes set by each image component.
 *
 * This avoids fragile DOM scraping — each image component opts in by
 * adding data-lightbox-* attributes at render time.
 */
export default function JournalLightbox() {
  const [images, setImages] = useState<LightboxImage[]>([]);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const clickedElementRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const container = document.getElementById("journal-content");
    if (!container) return;

    function collectImages() {
      if (!container) return;

      const elements = container.querySelectorAll<HTMLElement>(
        "[data-lightbox-src]",
      );

      // Deduplicate by src — same photo may appear in multiple components
      const seen = new Set<string>();
      const collected: LightboxImage[] = [];
      const srcToIndex = new Map<string, number>();

      elements.forEach((el) => {
        const src = el.dataset.lightboxSrc!;
        if (seen.has(src)) return;
        seen.add(src);

        const index = collected.length;
        srcToIndex.set(src, index);

        collected.push({
          src,
          alt: el.dataset.lightboxAlt || undefined,
          caption: el.dataset.lightboxCaption || undefined,
        });
      });

      // Set resolved index on each element (including duplicates)
      // so click handler can look up the deduplicated position.
      elements.forEach((el) => {
        const src = el.dataset.lightboxSrc!;
        el.dataset.lightboxIndex = String(srcToIndex.get(src));
        el.style.cursor = "zoom-in";
      });

      setImages(collected);
    }

    collectImages();

    // Handle clicks via event delegation
    function handleClick(e: MouseEvent) {
      const target = (e.target as HTMLElement).closest<HTMLElement>(
        "[data-lightbox-index]",
      );
      if (!target) return;

      e.preventDefault();
      e.stopPropagation();
      clickedElementRef.current = target;
      setActiveIndex(Number(target.dataset.lightboxIndex));
      setOpen(true);
    }

    container.addEventListener("click", handleClick);
    return () => container.removeEventListener("click", handleClick);
  }, []);

  const handleOpenChange = useCallback((next: boolean) => {
    setOpen(next);
  }, []);

  if (images.length === 0) return null;

  return (
    <ImageLightbox
      images={images}
      initialIndex={activeIndex}
      open={open}
      onOpenChange={handleOpenChange}
    />
  );
}
