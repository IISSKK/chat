import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    container: { center: true, padding: { DEFAULT: "1rem", sm: "1.5rem", lg: "2rem" }, screens: { "2xl": "1320px" } },
    extend: {
      /* Цвета берутся из CSS-переменных активной темы (src/app/themes.css) */
      colors: {
        ink: { DEFAULT: "rgb(var(--c-ink-900) / <alpha-value>)", 900: "rgb(var(--c-ink-900) / <alpha-value>)", 800: "rgb(var(--c-ink-800) / <alpha-value>)", 700: "rgb(var(--c-ink-700) / <alpha-value>)", 600: "rgb(var(--c-ink-600) / <alpha-value>)", 500: "rgb(var(--c-ink-500) / <alpha-value>)" },
        white: "rgb(var(--c-cream) / <alpha-value>)",
        brand: { DEFAULT: "rgb(var(--c-brand) / <alpha-value>)", 400: "rgb(var(--c-brand-400) / <alpha-value>)", 600: "rgb(var(--c-brand-600) / <alpha-value>)" },
        flame: { DEFAULT: "rgb(var(--c-flame) / <alpha-value>)", 400: "rgb(var(--c-flame-400) / <alpha-value>)" },
        ember: { DEFAULT: "rgb(var(--c-ember) / <alpha-value>)", 400: "rgb(var(--c-ember-400) / <alpha-value>)" },
        glow: { DEFAULT: "rgb(var(--c-glow) / <alpha-value>)" },
        sun: { DEFAULT: "rgb(var(--c-sun) / <alpha-value>)" },
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
        ken: { from: { transform: "scale(1.02)" }, to: { transform: "scale(1.14) translate(-1.5%, -1%)" } },
        progress: { from: { transform: "scaleX(0)" }, to: { transform: "scaleX(1)" } },
        "slide-in": { from: { opacity: "0", transform: "translateY(40px)", filter: "blur(6px)" }, to: { opacity: "1", transform: "none", filter: "none" } },
        glow: { "0%,100%": { opacity: ".55" }, "50%": { opacity: ".9" } },
      },
      animation: {
        blob: "blob 22s ease-in-out infinite",
        "fade-up": "fade-up .5s cubic-bezier(.2,.7,.2,1) both",
        "fade-in": "fade-in .35s ease both",
        shimmer: "shimmer 2.2s linear infinite",
        marquee: "marquee 40s linear infinite",
        ken: "ken 9s ease-out both",
        "slide-in": "slide-in .9s cubic-bezier(.2,.7,.2,1) both",
        glow: "glow 6s ease-in-out infinite",
        progress: "progress linear both",
      },
    },
  },
  plugins: [],
} satisfies Config;
