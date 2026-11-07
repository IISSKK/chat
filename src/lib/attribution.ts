"use client";

/** Откуда пришёл посетитель: запоминаем один раз за сессию (реферер и utm_source) — для заявок и аналитики */
export function getAttribution(): { ref: string; utm: string } {
  try {
    const saved = sessionStorage.getItem("bk-attr");
    if (saved) return JSON.parse(saved);
    const attr = { ref: document.referrer || "", utm: new URLSearchParams(location.search).get("utm_source") || "" };
    sessionStorage.setItem("bk-attr", JSON.stringify(attr));
    return attr;
  } catch {
    return { ref: "", utm: "" };
  }
}
