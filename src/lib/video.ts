/**
 * Видео в объявлении: только YouTube и Vimeo (строгая проверка адреса — чужие сайты и скрипты не пройдут).
 * Хранится нормализованная ссылка; на странице показывается кнопка-заглушка, плеер грузится только по нажатию.
 */
export interface VideoInfo {
  provider: "youtube" | "vimeo";
  id: string;
  /** нормализованная ссылка для хранения */
  url: string;
  /** адрес плеера для iframe */
  embed: string;
}

const YT_ID = /^[A-Za-z0-9_-]{11}$/;
const VIMEO_ID = /^\d{6,12}$/;

export function parseVideoUrl(raw: string): VideoInfo | null {
  const input = raw.trim();
  if (!input) return null;
  let u: URL;
  try {
    u = new URL(/^https?:\/\//i.test(input) ? input : `https://${input}`);
  } catch {
    return null;
  }
  if (u.protocol !== "https:" && u.protocol !== "http:") return null;
  const host = u.hostname.toLowerCase().replace(/^www\./, "");
  let id = "";
  if (host === "youtu.be") id = u.pathname.slice(1).split("/")[0];
  else if (host === "youtube.com" || host === "m.youtube.com" || host === "youtube-nocookie.com") {
    if (u.pathname === "/watch") id = u.searchParams.get("v") ?? "";
    else {
      const m = /^\/(?:shorts|embed|live)\/([^/?#]+)/.exec(u.pathname);
      if (m) id = m[1];
    }
  }
  if (id && YT_ID.test(id)) {
    return { provider: "youtube", id, url: `https://www.youtube.com/watch?v=${id}`, embed: `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&modestbranding=1` };
  }
  if (host === "vimeo.com" || host === "player.vimeo.com") {
    const m = /(?:^|\/)(\d{6,12})(?:\/|$)/.exec(u.pathname);
    if (m && VIMEO_ID.test(m[1])) return { provider: "vimeo", id: m[1], url: `https://vimeo.com/${m[1]}`, embed: `https://player.vimeo.com/video/${m[1]}?autoplay=1&dnt=1` };
  }
  return null;
}
