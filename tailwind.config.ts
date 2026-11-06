import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    container: { center: true, padding: { DEFAULT: "1rem", sm: "1.5rem", lg: "2rem" }, screens: { "2xl": "1320px" } },
    extend: {
      colors: {
        ink: { DEFAULT: "#0A0A12", 900: "#0A0A12", 800: "#11111C", 700: "#181826", 600: "#222234", 500: "#2E2E44" },
        lime: { DEFAULT: "#C8FF2E", 400: "#D6FF5C", 600: "#A6E000" },
        hot: { DEFAULT: "#FF3D81", 400: "#FF6A9F" },
        violet: { DEFAULT: "#7B5CFF", 400: "#9A82FF" },
        aqua: { DEFAULT: "#2EE6D6" },
        sun: { DEFAULT: "#FF9F1C" },
      },
      fontFamily: {
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      borderRadius: { "4xl": "2rem" },
      keyframes: {
        blob: {
          "0%,100%": { transform: "translate(0,0) scale(1)" },
          "33%": { transform: "translate(8vw,-6vh) scale(1.15)" },
          "66%": { transform: "translate(-6vw,5vh) scale(0.9)" },
        },
        "fade-up": { from: { opacity: "0", transform: "translateY(16px)" }, to: { opacity: "1", transform: "none" } },
        "fade-in": { from: { opacity: "0" }, to: { opacity: "1" } },
        shimmer: { from: { backgroundPosition: "200% 0" }, to: { backgroundPosition: "-200% 0" } },
        marquee: { from: { transform: "translateX(0)" }, to: { transform: "translateX(-50%)" } },
      },
      animation: {
        blob: "blob 22s ease-in-out infinite",
        "fade-up": "fade-up .5s cubic-bezier(.2,.7,.2,1) both",
        "fade-in": "fade-in .35s ease both",
        shimmer: "shimmer 2.2s linear infinite",
        marquee: "marquee 40s linear infinite",
      },
    },
  },
  plugins: [],
} satisfies Config;
