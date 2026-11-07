/** Флаг Республики Корея (Тегук-ги) в виде SVG — используется как мягкий фон надписи. */
export function KoreaFlag({ className = "" }: { className?: string }) {
  const bar = (y: number, broken: boolean) =>
    broken ? (
      <>
        <rect x={-75} y={y} width={60} height={25} />
        <rect x={15} y={y} width={60} height={25} />
      </>
    ) : (
      <rect x={-75} y={y} width={150} height={25} />
    );
  // трет – три черты; сверху вниз: true = прерывистая
  const tri = (angle: number, pattern: boolean[]) => (
    <g transform={`translate(450 300) rotate(${angle}) translate(0 -245)`} fill="#111">
      {pattern.map((b, i) => <g key={i}>{bar(-62.5 + i * 50, b)}</g>)}
    </g>
  );
  return (
    <svg viewBox="0 0 900 600" preserveAspectRatio="xMidYMid meet" className={className} aria-hidden focusable="false">
      <rect width="900" height="600" fill="#fff" />
      <g transform="rotate(-33.69 450 300)">
        <path d="M300 300a150 150 0 0 1 300 0z" fill="#CD2E3A" />
        <path d="M300 300a150 150 0 0 0 300 0z" fill="#0047A0" />
        <circle cx="375" cy="300" r="75" fill="#CD2E3A" />
        <circle cx="525" cy="300" r="75" fill="#0047A0" />
      </g>
      {tri(-56.31, [false, false, false])}
      {tri(56.31, [true, false, true])}
      {tri(-123.69, [false, true, false])}
      {tri(123.69, [true, true, true])}
    </svg>
  );
}
