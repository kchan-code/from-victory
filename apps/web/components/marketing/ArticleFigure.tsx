// ArticleFigure (FV-416) — editorial image treatment for blog/article pages.
//
// Design-system rules applied here (docs/Claude Design System/README.md):
// hairline border (no drop shadows on dark surfaces), --r-md radius,
// photography served self-hosted from public/images/blog. Alt text is plain
// and factual per docs/gtm/voice-and-guardrails.md.
//
// Server Component.

import Image from "next/image";

type ArticleFigureProps = {
  src: string;
  alt: string;
  width: number;
  height: number;
  /** "photo" = full-column editorial photograph; "screen" = app-UI capture,
   *  rendered narrower and centered so it reads as a phone, not a banner. */
  variant?: "photo" | "screen";
  priority?: boolean;
};

export function ArticleFigure({
  src,
  alt,
  width,
  height,
  variant = "photo",
  priority = false,
}: ArticleFigureProps) {
  if (variant === "screen") {
    return (
      <figure className="my-2 flex justify-center">
        <Image
          src={src}
          alt={alt}
          width={width}
          height={height}
          priority={priority}
          sizes="(max-width: 640px) 70vw, 300px"
          className="w-full max-w-[300px] rounded-[22px] border border-hairline"
        />
      </figure>
    );
  }

  return (
    <figure className="my-2 overflow-hidden rounded-[14px] border border-hairline">
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        priority={priority}
        sizes="(max-width: 800px) 100vw, 600px"
        className="w-full h-auto"
      />
    </figure>
  );
}
