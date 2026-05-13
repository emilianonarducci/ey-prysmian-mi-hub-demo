/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        "ey-navy": "#1E2A4A",
        "ey-navy-dark": "#0D1A33",
        "ey-yellow": "#FFE600",
        "insight-bg": "#F0F2F8",
      }
    }
  },
  plugins: [],
};
