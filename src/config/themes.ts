/**
 * Тёплые тёмные темы сайта. Палитры — в src/app/themes.css (атрибут data-theme на <html>).
 * Тему по умолчанию меняйте в siteConfig.defaultTheme; showThemeSwitcher — показывать ли посетителям переключатель.
 */
export const THEMES = [
  { id: "amber", name: "Янтарь", hint: "Тёплый мёд и апельсин", swatch: ["#120C08", "#FFB547", "#FF6B35", "#D64541"] },
  { id: "sunset", name: "Закат", hint: "Коралл, роза и слива", swatch: ["#170A10", "#FF8A5C", "#E8467C", "#B0458C"] },
  { id: "copper", name: "Медь", hint: "Эспрессо, медь и бронза", swatch: ["#100D0B", "#E0925A", "#B5482F", "#C9A15D"] },
  { id: "desert", name: "Пустыня", hint: "Песок, терракота, шоколад", swatch: ["#1E1610", "#E8C578", "#CD5C3C", "#C47850"] },
] as const;

export type ThemeId = (typeof THEMES)[number]["id"];
export const THEME_STORAGE_KEY = "korida-theme";
