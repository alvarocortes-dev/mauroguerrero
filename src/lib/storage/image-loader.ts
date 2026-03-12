import type { ImageLoaderProps } from "next/image";

const normalizeSrc = (src: string) => {
  if (src.startsWith("http")) {
    return src;
  }
  return src.startsWith("/") ? src.slice(1) : src;
};

const cdnBase = process.env.NEXT_PUBLIC_CDN_URL;

const imageLoader = ({ src, width, quality }: ImageLoaderProps) => {
  const normalized = normalizeSrc(src);
  if (!cdnBase || normalized.startsWith("http")) {
    return src;
  }

  const url = new URL(normalized, cdnBase);
  url.searchParams.set("w", width.toString());
  url.searchParams.set("q", (quality ?? 75).toString());
  return url.toString();
};

export default imageLoader;
