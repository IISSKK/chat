/** Выполняется один раз при запуске сервера Next.js */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs" && process.env.NODE_ENV === "production") {
    const { startMaintenance } = await import("./lib/maintenance");
    startMaintenance();
  }
}
