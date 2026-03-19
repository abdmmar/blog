import { useCallback, useEffect, useRef, useState } from "react";
import ImageLightbox, { type LightboxImage } from "./ImageLightbox";

/**
 * Mounts on journal pages to make all content images clickable.
 * Collects images from #journal-content via DOM queries and opens
 * the shared ImageLightbox modal when any image is clicked.
 */
export default function JournalLightbox() {
  const [images, setImages] = useState<LightboxImage[]>([]);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const imgElementsRef = useRef<HTMLImageElement[]>([]);

  useEffect(() => {
    function collectImages() {
      const container = document.getElementById("journal-content");
      if (!container) return;

      // Query all images inside figures (ImageWithCaption, ImageGallery, FullWidthImage)
      // and also standalone images. Exclude parallax overlay images.
      const imgElements = Array.from(
        container.querySelectorAll<HTMLImageElement>(
          "figure img, .parallax-breakout img"
        )
      );

      imgElementsRef.current = imgElements;

      const collected: LightboxImage[] = imgElements.map((img) => {
        // Find caption from nearest figcaption sibling
        const figure = img.closest("figure");
        const figcaption = figure?.querySelector("figcaption");
        const caption = figcaption?.textContent?.trim() || undefined;

        // Use the highest-res source available
        const picture = img.closest("picture");
        // Get the original src from the srcset (largest variant) or fallback to img.src
        const jpegSource = picture?.querySelector(
          'source[type="image/jpeg"]'
        ) as HTMLSourceElement | null;
        let src = img.src;
        if (jpegSource?.srcset) {
          // Extract the largest URL from srcset
          const parts = jpegSource.srcset.split(",").map((s) => s.trim());
          const last = parts[parts.length - 1];
          if (last) {
            src = last.split(/\s+/)[0] || src;
          }
        }

        return {
          src,
          alt: img.alt || undefined,
          caption,
        };
      });

      setImages(collected);

      // Add click handlers and cursor styles
      imgElements.forEach((img, index) => {
        img.style.cursor = "zoom-in";
        img.dataset.lightboxIndex = String(index);
      });
    }

    collectImages();

    // Re-collect after Astro page transitions
    const handleSwap = () => {
      setTimeout(collectImages, 100);
    };
    document.addEventListener("astro:after-swap", handleSwap);
    return () => document.removeEventListener("astro:after-swap", handleSwap);
  }, []);

  // Use event delegation on the container for click handling
  useEffect(() => {
    const container = document.getElementById("journal-content");
    if (!container) return;

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const img = target.closest("img") as HTMLImageElement | null;
      if (!img || img.dataset.lightboxIndex === undefined) return;

      e.preventDefault();
      e.stopPropagation();
      setActiveIndex(Number(img.dataset.lightboxIndex));
      setOpen(true);
    };

    container.addEventListener("click", handleClick);
    return () => container.removeEventListener("click", handleClick);
  }, []);

  const handleClose = useCallback(() => setOpen(false), []);

  if (images.length === 0) return null;

  return (
    <ImageLightbox
      images={images}
      initialIndex={activeIndex}
      open={open}
      onClose={handleClose}
    />
  );
}
