import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/** Курсы валют к корейской воне (бесплатный API open.er-api.com, без ключа). */
export async function GET() {
  try {
    const res = await fetch("https://open.er-api.com/v6/latest/KRW", { next: { revalidate: 1800 } });
    const data = (await res.json()) as { result: string; rates: Record<string, number>; time_last_update_unix: number };
    if (data.result !== "success") throw new Error("rates error");
    const per = (c: string) => (data.rates[c] ? 1 / data.rates[c] : null);
    return NextResponse.json({
      USD: per("USD"),
      EUR: per("EUR"),
      CNY: per("CNY"),
      RUB: per("RUB"),
      KRW: 1,
      updated: data.time_last_update_unix * 1000,
    });
  } catch {
    return NextResponse.json({ error: "unavailable" }, { status: 503 });
  }
}
