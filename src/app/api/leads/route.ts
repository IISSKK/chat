import { NextResponse, type NextRequest } from "next/server";
import { getItem } from "@/lib/items";
import { createLead, validateLead } from "@/lib/leads";
import { allowRequest } from "@/lib/ratelimit";
import { classifySource, isBot, recordEvent } from "@/lib/events";
import { sendTelegram, tgEscape } from "@/lib/telegram";
import { isLocale } from "@/i18n/config";
import { siteConfig } from "@/config/site";
import { itemUrl } from "@/lib/utils";

export const dynamic = "force-dynamic";

/**
 * Заявка с сайта. Защита: проверка Origin (middleware), скрытое поле-ловушка (website), минимальное время заполнения,
 * лимит 4 заявки в час с одного IP, ограничение длины и ссылок.
 */
export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return NextResponse.json({ error: "bad request" }, { status: 400 });

  // Боты заполняют все поля, в том числе скрытое, и отправляют форму мгновенно — молча «принимаем», но не сохраняем
  const trap = String(body.website ?? "").trim() !== "";
  const tooFast = Number(body.elapsed) < 1500;
  if (trap || tooFast || isBot(req)) return NextResponse.json({ ok: true });

  if (!allowRequest(req, "lead", 4, 60 * 60_000)) return NextResponse.json({ error: "rate" }, { status: 429 });

  const v = validateLead(body);
  if (!v.data) return NextResponse.json({ error: v.error }, { status: 400 });

  const lang = isLocale(body.lang) ? body.lang : "";
  const itemId = Number(body.itemId);
  const item = Number.isInteger(itemId) && itemId > 0 ? getItem(itemId) : null;
  const source = classifySource(String(body.ref ?? "").slice(0, 500), String(body.utm ?? ""), req.headers.get("host") || "");

  const id = createLead({ ...v.data, itemId: item?.id ?? null, itemTitle: item?.title ?? "", lang, source });
  recordEvent(req, { type: "lead", itemId: item?.id ?? null, lang });

  const lines = [
    `📩 <b>Новая заявка #${id}</b>`,
    `Имя: <b>${tgEscape(v.data.name)}</b>`,
    `Контакт: <b>${tgEscape(v.data.contact)}</b>`,
    v.data.country && `Страна: ${tgEscape(v.data.country)}`,
    item && `Объявление: ${tgEscape(item.title)}\n${itemUrl(item)}`,
    v.data.message && `Сообщение: ${tgEscape(v.data.message.slice(0, 500))}`,
    lang && `Язык сайта: ${lang.toUpperCase()}`,
    `${siteConfig.url}/admin/leads`,
  ].filter(Boolean);
  void sendTelegram(lines.join("\n"));

  return NextResponse.json({ ok: true, id });
}
