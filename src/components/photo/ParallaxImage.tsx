import { useEffect, useRef, useState } from "react";

type Props = {
  src: string;
  alt: string;
  overlayText?: string;
  height?: string;
};

export default function ParallaxImage({
  src,
  alt,
  overlayText,
  height = "100vh",
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState(0);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const isMobile = window.innerWidth < 640;
    setEnabled(!prefersReduced && !isMobile);
  }, []);

  useEffect(() => {
    if (!enabled) return;

    let ticking = false;
    const handleScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        if (!containerRef.current) {
          ticking = false;
          return;
        }
        const rect = containerRef.current.getBoundingClientRect();
        const windowH = window.innerHeight;
        // Progress: 0 when bottom of viewport hits top of container,
        //           1 when top of viewport passes bottom of container
        const progress =
          (windowH - rect.top) / (windowH + rect.height);
        // Map to a parallax offset range
        setOffset((progress - 0.5) * 100);
        ticking = false;
      });
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, [enabled]);

  return (
    <div
      ref={containerRef}
      className="parallax-breakout"
      style={{ height, position: "relative", overflow: "hidden" }}
    >
      <img
        src={src}
        alt={alt}
        loading="lazy"
        decoding="async"
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          width: "100%",
          height: "140%",
          objectFit: "cover",
          top: "-20%",
          transform: enabled ? `translateY(${offset}px)` : "none",
          willChange: enabled ? "transform" : "auto",
          transition: "transform 0.05s linear",
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
  );
}
