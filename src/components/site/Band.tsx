/**
 * Широкая полоса страницы на всю ширину экрана. Чередование светлых, голубых и тёмных полос
 * даёт контраст между блоками: tint — фон страницы, white — белая, blue — голубая, dark — тёмно-синяя.
 */
const TONES = {
  tint: "",
  white: "border-y border-fg/[0.08] bg-white",
  blue: "border-y border-brand/15 bg-[#D9E6F8]",
  dark: "relative overflow-hidden bg-[#0B1220] text-white",
} as const;

export function Band({ tone = "tint", id, children, className = "" }: { tone?: keyof typeof TONES; id?: string; children: React.ReactNode; className?: string }) {
  return (
    <section id={id} className={`cv-auto scroll-mt-28 py-14 sm:py-20 ${TONES[tone]} ${className}`}>
      {tone === "dark" && (
        <>
          <div className="pointer-events-none absolute -right-24 -top-28 h-96 w-96 rounded-full bg-brand/30 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-32 -left-20 h-96 w-96 rounded-full bg-flame/25 blur-3xl" />
        </>
      )}
      <div className="container relative">{children}</div>
    </section>
  );
}
