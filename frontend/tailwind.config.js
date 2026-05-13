/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Helvetica Neue', 'Arial', 'sans-serif'],
        display: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      colors: {
        "ey-navy": "#0F1B3D",
        "ey-navy-dark": "#0A1530",
        "ey-yellow": "#FFE600",
        "insight-bg": "#F4F6FB",
        "prysmian-green": "#00875A",
        "prysmian-green-light": "#1FB37A",
        "prysmian-green-dark": "#005F3F",
        surface: {
          DEFAULT: "#FFFFFF",
          muted: "#F7F8FB",
          subtle: "#EEF1F6",
          inverted: "#0F1B3D",
        },
        ink: {
          DEFAULT: "#0F1B3D",
          muted: "#4A5573",
          subtle: "#7B8497",
          faint: "#A5ACBE",
          inverted: "#FFFFFF",
        },
        line: {
          DEFAULT: "#E4E8F0",
          subtle: "#EEF1F6",
          strong: "#CFD5E2",
        },
        accent: {
          green: "#00875A",
          "green-light": "#E6F4EE",
          blue: "#2563EB",
          "blue-light": "#E7EEFE",
          amber: "#D97706",
          "amber-light": "#FEF3E2",
          red: "#DC2626",
          "red-light": "#FDECEC",
        },
      },
      boxShadow: {
        "card": "0 1px 2px 0 rgba(15,27,61,0.04), 0 1px 3px 0 rgba(15,27,61,0.06)",
        "card-hover": "0 2px 6px -1px rgba(15,27,61,0.08), 0 4px 10px -2px rgba(15,27,61,0.06)",
        "elevated": "0 10px 30px -8px rgba(15,27,61,0.18)",
        "ring-green": "0 0 0 3px rgba(0,135,90,0.15)",
      },
      borderRadius: {
        xl: "0.875rem",
        "2xl": "1.125rem",
      },
      keyframes: {
        "pulse-soft": { "0%, 100%": { opacity: 1 }, "50%": { opacity: 0.55 } },
        "fade-in": { "0%": { opacity: 0, transform: "translateY(4px)" }, "100%": { opacity: 1, transform: "translateY(0)" } },
      },
      animation: {
        "pulse-soft": "pulse-soft 2s ease-in-out infinite",
        "fade-in": "fade-in 220ms ease-out",
      },
    }
  },
  plugins: [],
};
