import { getResponsiveVariants } from "@/lib/responsive-image";

type Props = {
  src: string;
  alt: string;
  className?: string;
  loading?: "lazy" | "eager";
  decoding?: "async" | "sync" | "auto";
  sizes?: string;
  style?: React.CSSProperties;
};

export default function ResponsiveImg({
  src,
  alt,
  className,
  loading = "lazy",
  decoding = "async",
  sizes = "(max-width: 640px) 640px, (max-width: 1024px) 1024px, 1920px",
  style,
}: Props) {
  const { srcsetWebp, srcsetJpeg, fallbackSrc } = getResponsiveVariants(src);

  return (
    <picture>
      <source type="image/webp" srcSet={srcsetWebp} sizes={sizes} />
      <source type="image/jpeg" srcSet={srcsetJpeg} sizes={sizes} />
      <img
        src={fallbackSrc}
        alt={alt}
        className={className}
        loading={loading}
        decoding={decoding}
        style={style}
      />
    </picture>
  );
}
