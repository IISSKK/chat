import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Курсы валют онлайн: USD, EUR, KGS (сом), KRW (вона).
 * Источник — публичный API Coinbase (без ключа, обновляется в течение дня),
 * запасной — open.er-api.com. Ответ кешируется в памяти сервера на 60 секунд.
 */
const CODES = ["USD", "EUR", "KGS", "KRW"] as const;
type Rates = Record<(typeof CODES)[number], number>; // сколько единиц валюты за 1 USD

const g = globalThis as unknown as { __rates?: { at: number; data: { rates: Rates; updated: number; source: string } } };
const TTL = 60_000;

async function fromCoinbase() {
  const r = await fetch("https://api.coinbase.com/v2/exchange-rates?currency=USD", { cache: "no-store", signal: AbortSignal.timeout(5000) });
  const j = (await r.json()) as { data: { rates: Record<string, string> } };
  const rates = Object.fromEntries(CODES.map((c) => [c, Number(j.data.rates[c])])) as Rates;
  if (CODES.some((c) => !rates[c])) throw new Error("incomplete");
  return { rates, updated: Date.now(), source: "coinbase" };
}

async function fromErApi() {
  const r = await fetch("https://open.er-api.com/v6/latest/USD", { cache: "no-store", signal: AbortSignal.timeout(5000) });
  const j = (await r.json()) as { result: string; rates: Record<string, number>; time_last_update_unix: number };
  if (j.result !== "success") throw new Error("er-api");
  const rates = Object.fromEntries(CODES.map((c) => [c, j.rates[c]])) as Rates;
  return { rates, updated: j.time_last_update_unix * 1000, source: "open.er-api" };
}

export async function GET() {
  const cached = g.__rates;
  if (cached && Date.now() - cached.at < TTL) return NextResponse.json(cached.data);
  try {
    const data = await fromCoinbase().catch(fromErApi);
    g.__rates = { at: Date.now(), data };
    return NextResponse.json(data, { headers: { "Cache-Control": "public, max-age=30" } });
  } catch {
    if (cached) return NextResponse.json(cached.data);
    return NextResponse.json({ error: "unavailable" }, { status: 503 });
  }
}
