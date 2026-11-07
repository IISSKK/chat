/**
 * Надпись, залитая флагом Республики Корея.
 * Строка очень вытянутая, поэтому флаг адаптирован под неё: в центре красно-синий круг (тегук),
 * по бокам — по две триграммы. Белые участки обведены тонким тёмным контуром, чтобы буквы читались.
 */
const bar = (x: number, broken: boolean) =>
  broken
    ? `<rect x="${x - 14}" y="8" width="28" height="34"/><rect x="${x - 14}" y="58" width="28" height="34"/>`
    : `<rect x="${x - 14}" y="8" width="28" height="84"/>`;
const tri = (cx: number, p: boolean[]) => `<g fill="#111">${p.map((b, i) => bar(cx - 48 + i * 48, b)).join("")}</g>`;

const SVG =
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 100" preserveAspectRatio="xMidYMid slice">` +
  `<rect width="1200" height="100" fill="#fff"/>` +
  `<g transform="translate(600 50) rotate(-33.69)">` +
  `<path d="M-190 0a190 190 0 0 1 380 0z" fill="#CD2E3A"/><path d="M-190 0a190 190 0 0 0 380 0z" fill="#0047A0"/>` +
  `<circle cx="-95" r="95" fill="#CD2E3A"/><circle cx="95" r="95" fill="#0047A0"/></g>` +
  tri(190, [false, false, false]) + tri(330, [false, true, false]) + tri(870, [true, false, true]) + tri(1010, [true, true, true]) +
  `</svg>`;

const URL_BG = `url("data:image/svg+xml,${encodeURIComponent(SVG)}")`;

export function FlagText({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="inline-block max-w-full px-[0.04em]"
      style={{
        backgroundImage: URL_BG,
        backgroundSize: "100% 100%",
        backgroundRepeat: "no-repeat",
        WebkitBackgroundClip: "text",
        backgroundClip: "text",
        WebkitTextFillColor: "transparent",
        color: "transparent",
        WebkitTextStroke: "1.3px #0B1220",
        filter: "drop-shadow(0 6px 14px rgba(11,18,32,.18))",
      }}
    >
      {children}
    </span>
  );
}
