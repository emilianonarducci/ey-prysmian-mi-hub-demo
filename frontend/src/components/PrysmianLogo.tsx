/**
 * Renders the Prysmian brand logo using the official PNG asset
 * at /public/prysmian-logo.png (3840×897, aspect ratio ≈ 4.28:1).
 *
 * `variant`:
 *   - "full" (default): full logo (mark + wordmark)
 *   - "mark": shows only the leftmost portion (the "p" mark) via CSS clipping
 *
 * `onDark`: when placed on a dark background, applies a brightness/contrast/
 *   saturate filter so the dark-navy wordmark lifts and stays readable while
 *   the mark gradient is preserved. No background wrapper — fully transparent
 *   so the logo blends into the surface.
 */
interface PrysmianLogoProps {
  variant?: "full" | "mark";
  height?: number;
  onDark?: boolean;
  className?: string;
}

const FULL_ASPECT = 3840 / 897;
const MARK_VIEWPORT_RATIO = 0.21;
const DARK_BG_FILTER = "brightness(1.6) contrast(0.95) saturate(0.85)";

export default function PrysmianLogo({
  variant = "full",
  height = 32,
  onDark = false,
  className = "",
}: PrysmianLogoProps) {
  const imgFilter = onDark ? DARK_BG_FILTER : undefined;
  if (variant === "mark") {
    const clipWidth = Math.round(height * FULL_ASPECT * MARK_VIEWPORT_RATIO);
    return (
      <span
        className={`inline-block overflow-hidden ${className}`}
        style={{ width: clipWidth, height }}
        aria-label="Prysmian"
      >
        <img
          src="/prysmian-logo.png"
          alt="Prysmian"
          style={{ height, width: "auto", maxWidth: "none", filter: imgFilter }}
        />
      </span>
    );
  }
  return (
    <span className={`inline-flex items-center ${className}`} aria-label="Prysmian">
      <img
        src="/prysmian-logo.png"
        alt="Prysmian"
        style={{ height, width: "auto", filter: imgFilter }}
      />
    </span>
  );
}
