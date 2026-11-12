import type { Config } from "tailwindcss";

export default {
  // hover-стили только там, где есть мышь: на сенсорных экранах после касания карточки не остаются «приподнятыми»
  future: { hoverOnlyWhenSupported: true },
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    container: { center: true, padding: { DEFAULT: "1rem", sm: "1.5rem", lg: "2rem" }, screens: { "2xl": "1320px" } },
    extend: {
      /* Цвета берутся из CSS-переменных (src/app/themes.css) */
      colors: {
        ink: { DEFAULT: "rgb(var(--c-ink-900) / <alpha-value>)", 900: "rgb(var(--c-ink-900) / <alpha-value>)", 800: "rgb(var(--c-ink-800) / <alpha-value>)", 700: "rgb(var(--c-ink-700) / <alpha-value>)", 600: "rgb(var(--c-ink-600) / <alpha-value>)", 500: "rgb(var(--c-ink-500) / <alpha-value>)" },
        fg: "rgb(var(--c-fg) / <alpha-value>)",
        brand: { DEFAULT: "rgb(var(--c-brand) / <alpha-value>)", 400: "rgb(var(--c-brand-400) / <alpha-value>)", 600: "rgb(var(--c-brand-600) / <alpha-value>)" },
        flame: { DEFAULT: "rgb(var(--c-flame) / <alpha-value>)", 400: "rgb(var(--c-flame-400) / <alpha-value>)" },
        ember: { DEFAULT: "rgb(var(--c-ember) / <alpha-value>)", 400: "rgb(var(--c-ember-400) / <alpha-value>)" },
        glow: { DEFAULT: "rgb(var(--c-glow) / <alpha-value>)" },
        sun: { DEFAULT: "rgb(var(--c-sun) / <alpha-value>)" },
      },
      fontFamily: {
        display: ["var(--font-display)", "system-ui", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "Apple SD Gothic Neo", "Malgun Gothic", "PingFang SC", "Microsoft YaHei", "Noto Sans CJK SC", "Noto Sans KR", "system-ui", "sans-serif"],
        sans: ["system-ui", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "Helvetica Neue", "Arial", "Apple SD Gothic Neo", "Malgun Gothic", "PingFang SC", "Microsoft YaHei", "Noto Sans CJK SC", "Noto Sans KR", "system-ui", "sans-serif"],
      },
      borderRadius: { "4xl": "2rem" },
      keyframes: {
        "fade-up": { from: { opacity: "0", transform: "translateY(12px)" }, to: { opacity: "1", transform: "none" } },
        "fade-in": { from: { opacity: "0" }, to: { opacity: "1" } },
        "pop-in": { from: { opacity: "0", transform: "scale(.94) translateY(6px)" }, to: { opacity: "1", transform: "none" } },
        pulse2: { "0%,100%": { opacity: "1" }, "50%": { opacity: ".35" } },
        flash: { "0%": { backgroundColor: "rgb(var(--c-brand) / .18)" }, "100%": { backgroundColor: "transparent" } },
      },
      animation: {
        "fade-up": "fade-up .45s cubic-bezier(.2,.7,.2,1) both",
        "fade-in": "fade-in .3s ease both",
        "pop-in": "pop-in .28s cubic-bezier(.2,.8,.2,1) both",
        pulse2: "pulse2 1.6s ease-in-out infinite",
        flash: "flash 1.2s ease-out both",
      },
    },
  },
  plugins: [],
} satisfies Config;
