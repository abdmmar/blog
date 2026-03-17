import { useEffect, useState } from "react";
import ResponsiveImg from "./ResponsiveImg";

type Props = {
  src: string;
  alt: string;
  overlayText?: string;
  height?: string;
};

/**
 * Semplice5-style stacked parallax: the image sticks to the viewport
 * while subsequent content scrolls over it, creating a layered effect.
 */
export default function ParallaxImage({
  src,
  alt,
  overlayText,
  height = "100vh",
}: Props) {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const isMobile = window.innerWidth < 640;
    setEnabled(!prefersReduced && !isMobile);
  }, []);

  return (
    <div
      className="parallax-breakout parallax-stack-wrapper"
      style={{ height }}
    >
      <div
        className="parallax-stack-sticky"
        style={{
          position: enabled ? "sticky" : "relative",
          top: 0,
          height,
          overflow: "hidden",
        }}
      >
        <ResponsiveImg
          src={src}
          alt={alt}
          sizes="100vw"
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(to top, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.15) 40%, rgba(0,0,0,0.1) 100%)",
          }}
        />
        {overlayText && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "2.5rem",
            }}
          >
            <p
              style={{
                color: "white",
                fontSize: "clamp(1.25rem, 3vw, 2rem)",
                fontWeight: 500,
                textAlign: "center",
                lineHeight: 1.5,
                maxWidth: "600px",
                textShadow: "0 2px 20px rgba(0,0,0,0.3)",
              }}
            >
              {overlayText}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
