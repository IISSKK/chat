import "server-only";

/**
 * Уведомления в Telegram. Настройка (в .env):
 *   TELEGRAM_BOT_TOKEN=123456:ABC...   — токен бота от @BotFather
 *   TELEGRAM_CHAT_ID=123456789         — ваш chat id (можно несколько через запятую; группа — отрицательное число)
 */
export function telegramConfigured() {
  return !!process.env.TELEGRAM_BOT_TOKEN && !!process.env.TELEGRAM_CHAT_ID;
}

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
export { esc as tgEscape };

/** Отправляет сообщение (HTML). Не бросает исключений: сайт не должен ломаться из-за Telegram. Возвращает true при успехе. */
export async function sendTelegram(html: string): Promise<boolean> {
  if (!telegramConfigured()) return false;
  const token = process.env.TELEGRAM_BOT_TOKEN!;
  const chats = process.env.TELEGRAM_CHAT_ID!.split(",").map((s) => s.trim()).filter(Boolean);
  let ok = false;
  await Promise.all(
    chats.map(async (chat) => {
      try {
        const res = await fetch(`${process.env.TELEGRAM_API_BASE || "https://api.telegram.org"}/bot${token}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ chat_id: chat, text: html.slice(0, 3900), parse_mode: "HTML", disable_web_page_preview: true }),
          signal: AbortSignal.timeout(8000),
        });
        if (res.ok) ok = true;
      } catch {}
    }),
  );
  return ok;
}
