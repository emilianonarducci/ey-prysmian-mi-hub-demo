/**
 * Renders the Prysmian brand logo using the official PNG asset
 * at /public/prysmian-logo.png (3840×897, aspect ratio ≈ 4.28:1).
 *
 * `variant`:
 *   - "full" (default): full logo (mark + wordmark)
 *   - "mark": shows only the leftmost portion (the "p" mark) via CSS clipping
 *
 * `onDark`: when the logo is placed on a dark background, the dark-navy
 *   wordmark loses contrast. Setting `onDark` wraps the image in a white
 *   rounded card so the brand-faithful asset stays readable.
 */
interface PrysmianLogoProps {
  variant?: "full" | "mark";
  height?: number;
  onDark?: boolean;
  className?: string;
}

const FULL_ASPECT = 3840 / 897;
const MARK_VIEWPORT_RATIO = 0.21;

export default function PrysmianLogo({
  variant = "full",
  height = 32,
  onDark = false,
  className = "",
}: PrysmianLogoProps) {
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
          style={{ height, width: "auto", maxWidth: "none" }}
        />
      </span>
    );
  }
  const wrapperClasses = onDark
    ? "inline-flex items-center bg-white rounded-md px-2 py-1"
    : "inline-flex items-center";
  return (
    <span className={`${wrapperClasses} ${className}`} aria-label="Prysmian">
      <img src="/prysmian-logo.png" alt="Prysmian" style={{ height, width: "auto" }} />
    </span>
  );
}
