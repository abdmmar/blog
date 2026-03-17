/**
 * Utility to derive responsive image variant URLs from a base image URL.
 *
 * Convention: given a URL like `https://media.abdmmar.com/DSCF0192_lg.jpg`,
 * the responsive variants are:
 *   - DSCF0192_sm.jpg (640w), DSCF0192_md.jpg (1024w), DSCF0192_lg.jpg (1920w)
 *   - DSCF0192_sm.webp (640w), DSCF0192_md.webp (1024w), DSCF0192_lg.webp (1920w)
 *
 * Also supports legacy `_resized` URLs by falling back gracefully.
 */

export type ImageVariants = {
  srcsetWebp: string;
  srcsetJpeg: string;
  fallbackSrc: string;
};

const SIZE_SUFFIXES = ["_sm", "_md", "_lg"] as const;
const SIZE_WIDTHS = { _sm: 640, _md: 1024, _lg: 1920 } as const;

/**
 * Extract the base stem and extension from an image URL.
 * Removes size suffixes (_sm, _md, _lg) and _resized.
 */
function parseImageUrl(src: string): { base: string; isResponsive: boolean } {
  // Remove extension
  const lastDot = src.lastIndexOf(".");
  if (lastDot === -1) return { base: src, isResponsive: false };

  const withoutExt = src.substring(0, lastDot);

  // Check if it has a responsive suffix
  for (const suffix of SIZE_SUFFIXES) {
    if (withoutExt.endsWith(suffix)) {
      return {
        base: withoutExt.substring(0, withoutExt.length - suffix.length),
        isResponsive: true,
      };
    }
  }

  // Check for legacy _resized suffix
  if (withoutExt.endsWith("_resized")) {
    return {
      base: withoutExt.substring(0, withoutExt.length - "_resized".length),
      isResponsive: false,
    };
  }

  return { base: withoutExt, isResponsive: false };
}

/**
 * Generate responsive image variants from a source URL.
 * Returns srcset strings for WebP and JPEG, plus a fallback src.
 *
 * If the URL doesn't follow the responsive naming convention,
 * returns the original URL as-is for the fallback.
 */
export function getResponsiveVariants(src: string): ImageVariants {
  const { base, isResponsive } = parseImageUrl(src);

  // For legacy _resized URLs or non-standard URLs, still try to generate variants
  // The component will use these URLs; if the files don't exist on the CDN,
  // the browser will fall back to the main src via the <img> tag.
  const webpParts = SIZE_SUFFIXES.map(
    (suffix) => `${base}${suffix}.webp ${SIZE_WIDTHS[suffix]}w`,
  );

  const jpegParts = SIZE_SUFFIXES.map(
    (suffix) => `${base}${suffix}.jpg ${SIZE_WIDTHS[suffix]}w`,
  );

  return {
    srcsetWebp: webpParts.join(", "),
    srcsetJpeg: jpegParts.join(", "),
    // Use the _lg.jpg as the fallback, or original src if not responsive
    fallbackSrc: isResponsive ? `${base}_lg.jpg` : src,
  };
}
