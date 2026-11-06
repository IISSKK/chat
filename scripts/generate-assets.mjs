/**
 * Генерирует демо-изображения (public/demo/*.jpg), OG-картинку по умолчанию и PDF-руководства (public/guides/*.pdf).
 * Стиль Barakat Auto: светлый фон, синий и оранжевый.
 * Запуск: node scripts/generate-assets.mjs   (нужен playwright с chromium)
 */
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const out = (p) => path.join(root, p);

const palettes = [
  ["#7FB8FF", "#FFC46B", "#E8F1FF"],
  ["#5AA2FF", "#FFE08A", "#F3F7FF"],
  ["#9CC9FF", "#FFB25C", "#EEF4FF"],
  ["#6FB0FF", "#FFD36B", "#FFFFFF"],
  ["#8EC2FF", "#FFA94D", "#F5F9FF"],
  ["#A9D0FF", "#FFCF70", "#EAF2FF"],
];
const bodyColors = ["#FFFFFF", "#1C2A44", "#007AFF", "#FF9500", "#2D55D7", "#B8C2D3", "#F4F6FA", "#0B1220", "#FF6B2C", "#5AC8FA", "#3A4A66", "#FFCC00"];

const car = (style, color) => {
  const bodies = {
    sedan: "M90 330 C110 300 170 290 230 285 L330 220 C360 202 420 195 520 195 C600 195 650 205 700 240 L780 285 C850 290 900 300 915 330 L920 380 C920 395 905 400 890 400 L110 400 C95 400 85 392 85 378 Z",
    suv: "M90 300 C95 280 120 270 160 265 L250 190 C270 175 300 170 420 168 C560 166 650 170 700 190 L800 265 C860 272 900 285 910 310 L915 385 C915 397 905 402 890 402 L110 402 C97 402 88 395 88 382 Z",
    van: "M100 260 C100 200 130 160 190 150 L640 145 C700 145 740 160 770 200 L840 270 C880 280 905 295 910 320 L912 388 C912 398 902 403 890 403 L112 403 C102 403 95 396 95 386 Z",
    truck: "M95 250 L95 160 C95 148 105 140 118 140 L330 140 C350 140 365 150 375 170 L410 250 L905 250 L912 388 C912 398 902 403 890 403 L110 403 C100 403 94 396 94 386 Z",
  };
  const windows = {
    sedan: '<path d="M270 282 L345 228 C370 214 410 210 470 210 L470 282 Z" fill="#0b1020" opacity=".85"/><path d="M490 210 C580 210 630 220 670 248 L720 282 L490 282 Z" fill="#0b1020" opacity=".85"/>',
    suv: '<path d="M280 262 L330 205 C345 190 370 185 450 184 L450 262 Z" fill="#0b1020" opacity=".85"/><path d="M470 184 C570 183 640 188 680 205 L760 262 L470 262 Z" fill="#0b1020" opacity=".85"/>',
    van: '<path d="M190 250 L195 175 C198 168 205 165 215 165 L420 162 L420 250 Z" fill="#0b1020" opacity=".85"/><path d="M440 162 L640 160 C690 160 720 175 745 205 L790 255 L440 250 Z" fill="#0b1020" opacity=".85"/>',
    truck: '<path d="M120 240 L120 165 L320 165 C335 165 343 172 350 185 L380 240 Z" fill="#0b1020" opacity=".85"/><rect x="430" y="205" width="470" height="45" rx="6" fill="rgba(0,0,0,.18)"/>',
  };
  const wheel = (cx) => `<circle cx="${cx}" cy="400" r="62" fill="#0b0b12"/><circle cx="${cx}" cy="400" r="36" fill="#cfd3dc"/><circle cx="${cx}" cy="400" r="12" fill="#6b7280"/>`;
  return `<svg viewBox="0 0 1000 500" width="78%"><ellipse cx="500" cy="465" rx="430" ry="22" fill="rgba(11,18,32,.18)"/>
    <path d="${bodies[style]}" fill="${color}" stroke="rgba(0,0,0,.25)" stroke-width="3"/>${windows[style]}
    <rect x="860" y="320" width="45" height="18" rx="6" fill="#FFE27A"/><rect x="95" y="320" width="35" height="16" rx="6" fill="#ff5f6d"/>
    ${wheel(250)}${wheel(750)}</svg>`;
};

const engine = (color) => `<svg viewBox="0 0 1000 600" width="70%">
  <ellipse cx="500" cy="560" rx="380" ry="22" fill="rgba(11,18,32,.18)"/>
  <rect x="220" y="230" width="560" height="270" rx="28" fill="#2b2f3a"/>
  <rect x="250" y="150" width="500" height="110" rx="22" fill="${color}"/>
  ${[0, 1, 2, 3].map((i) => `<rect x="${285 + i * 115}" y="172" width="80" height="66" rx="14" fill="rgba(0,0,0,.25)"/>`).join("")}
  <circle cx="200" cy="420" r="90" fill="#1f232c"/><circle cx="200" cy="420" r="55" fill="#9aa3b2"/><circle cx="200" cy="420" r="16" fill="#1f232c"/>
  <circle cx="830" cy="330" r="55" fill="#1f232c"/><circle cx="830" cy="330" r="30" fill="#9aa3b2"/>
  <rect x="300" y="300" width="400" height="26" rx="13" fill="#454b5a"/><rect x="300" y="350" width="400" height="26" rx="13" fill="#454b5a"/>
  <rect x="300" y="400" width="400" height="26" rx="13" fill="#454b5a"/>
  <path d="M780 420 C860 420 880 470 900 520" stroke="${color}" stroke-width="22" fill="none" stroke-linecap="round"/></svg>`;

const part = (kind, color) => {
  if (kind === 0) // turbo
    return `<svg viewBox="0 0 1000 600" width="60%"><ellipse cx="500" cy="560" rx="300" ry="20" fill="rgba(11,18,32,.18)"/>
    <circle cx="430" cy="310" r="200" fill="#2b2f3a"/><circle cx="430" cy="310" r="130" fill="#9aa3b2"/>
    ${Array.from({ length: 10 }, (_, i) => `<path d="M430 310 L${430 + 125 * Math.cos(i * 0.628)} ${310 + 125 * Math.sin(i * 0.628)}" stroke="#4b5260" stroke-width="18"/>`).join("")}
    <circle cx="430" cy="310" r="36" fill="${color}"/><rect x="600" y="250" width="260" height="120" rx="30" fill="${color}"/></svg>`;
  if (kind === 1) // gear
    return `<svg viewBox="0 0 1000 600" width="55%"><ellipse cx="500" cy="560" rx="280" ry="20" fill="rgba(11,18,32,.18)"/>
    <g transform="translate(500 300)">${Array.from({ length: 12 }, (_, i) => `<rect x="-30" y="-245" width="60" height="80" rx="10" fill="#3a3f4c" transform="rotate(${i * 30})"/>`).join("")}
    <circle r="190" fill="#3a3f4c"/><circle r="120" fill="${color}"/><circle r="50" fill="#1f232c"/></g></svg>`;
  return `<svg viewBox="0 0 1000 600" width="72%"><ellipse cx="500" cy="560" rx="380" ry="20" fill="rgba(11,18,32,.18)"/>
    <rect x="140" y="200" width="720" height="240" rx="30" fill="#3a3f4c"/><rect x="170" y="160" width="660" height="70" rx="20" fill="${color}"/>
    ${[0, 1, 2, 3].map((i) => `<circle cx="${270 + i * 150}" cy="330" r="55" fill="#1f232c"/><circle cx="${270 + i * 150}" cy="330" r="30" fill="#9aa3b2"/>`).join("")}</svg>`;
};

const page = (svg, [a, b, c], label) => `<!doctype html><html><body style="margin:0">
<div style="width:1200px;height:800px;position:relative;overflow:hidden;display:flex;align-items:center;justify-content:center;
background:radial-gradient(circle at 15% 20%, ${a} 0, transparent 45%),radial-gradient(circle at 85% 30%, ${b} 0, transparent 45%),radial-gradient(circle at 60% 110%, ${c} 0, transparent 50%),#EEF3FA;">
<div style="position:absolute;inset:0;background:repeating-linear-gradient(90deg,rgba(11,18,32,.04) 0 1px,transparent 1px 80px),repeating-linear-gradient(0deg,rgba(11,18,32,.04) 0 1px,transparent 1px 80px)"></div>
<div style="position:relative;width:100%;display:flex;justify-content:center">${svg}</div>
<div style="position:absolute;left:40px;bottom:30px;font:700 28px DejaVu Sans,sans-serif;color:rgba(11,18,32,.35);letter-spacing:4px">DEMO · ${label}</div>
</div></body></html>`;

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1200, height: 800 } });
const p = await ctx.newPage();
const shot = async (html, file, w = 1200, h = 800) => {
  await p.setViewportSize({ width: w, height: h });
  await p.setContent(html);
  await p.screenshot({ path: out(file), type: "jpeg", quality: 74 });
};

fs.mkdirSync(out("public/demo"), { recursive: true });
const styles = ["sedan", "suv", "van", "truck"];
for (let i = 0; i < 12; i++) await shot(page(car(styles[i % 4], bodyColors[i]), palettes[i % 6], "VEHICLE"), `public/demo/car-${i + 1}.jpg`);
for (let i = 0; i < 6; i++) await shot(page(engine(bodyColors[(i * 3 + 2) % 12]), palettes[(i + 2) % 6], "ENGINE"), `public/demo/engine-${i + 1}.jpg`);

// OG image по умолчанию
await shot(`<!doctype html><html><body style="margin:0"><div style="width:1200px;height:630px;display:flex;flex-direction:column;justify-content:center;padding:0 80px;box-sizing:border-box;
background:radial-gradient(circle at 0% 0%,rgba(0,122,255,.30) 0,transparent 50%),radial-gradient(circle at 100% 10%,rgba(255,149,0,.28) 0,transparent 45%),radial-gradient(circle at 70% 120%,rgba(255,204,0,.25) 0,transparent 50%),#F0F4FA;color:#0B1220;font-family:DejaVu Sans,sans-serif">
<div style="display:flex;align-items:center;gap:22px"><div style="width:96px;height:96px;border-radius:24px;background:linear-gradient(135deg,#409CFF,#007AFF 55%,#2D55D7);display:flex;align-items:center;justify-content:center;color:#fff;font-size:60px;font-weight:800;position:relative">B<span style="position:absolute;right:14px;bottom:14px;width:12px;height:12px;border-radius:50%;background:#FF9500"></span></div>
<div style="font-size:84px;font-weight:800;letter-spacing:-2px">Barakat <span style="color:#007AFF">Auto</span></div></div>
<div style="font-size:40px;margin-top:34px;max-width:980px;color:#334155">Автомобили и двигатели из Южной Кореи — B2B экспорт под ключ</div>
<div style="margin-top:30px;display:flex;gap:14px;font-size:24px;font-weight:700"><span style="background:#007AFF;color:#fff;padding:10px 22px;border-radius:99px">WhatsApp</span><span style="background:rgba(255,149,0,.15);color:#C25E00;padding:10px 22px;border-radius:99px">VIN · документы · таможня</span></div></div></body></html>`, "public/og-default.jpg", 1200, 630);

// PDF-руководства
const guides = {
  ru: { lang: "ru", title: "Руководство покупателя", sub: "Как купить автомобиль или двигатель из Южной Кореи", steps: [
    ["Выбор", "Выберите позицию на сайте или пришлите запрос в WhatsApp: марку, модель, год, бюджет и страну назначения."],
    ["Проверка", "Мы отправим дополнительные фото и видео, отчёт об осмотре, историю по VIN и подтвердим наличие."],
    ["Контракт и инвойс", "Подписываем экспортный контракт, выставляем проформу. Оплата — банковский перевод на корпоративный счёт в Корее."],
    ["Документы", "Снятие с учёта (Export Deregistration Certificate), коммерческий инвойс, упаковочный лист, коносамент (B/L)."],
    ["Отгрузка", "Контейнер или RoRo из портов Инчхон/Пусан. Сообщаем номер судна и трекинг."],
    ["Таможня", "Консультируем по пакету документов для растаможки в вашей стране и рекомендуем брокеров."]] },
  en: { lang: "en", title: "Buyer's Guide", sub: "How to buy vehicles and engines from South Korea", steps: [
    ["Selection", "Pick an item on the website or send a WhatsApp request: make, model, year, budget and destination country."],
    ["Inspection", "We send extra photos and videos, an inspection report, VIN history and confirm availability."],
    ["Contract & invoice", "We sign an export contract and issue a proforma invoice. Payment by bank transfer to our corporate account in Korea."],
    ["Documents", "Export Deregistration Certificate, commercial invoice, packing list, bill of lading (B/L)."],
    ["Shipping", "Container or RoRo from Incheon/Busan. We share the vessel name and tracking."],
    ["Customs", "We advise on the document set for customs clearance in your country and recommend brokers."]] },
  ko: { lang: "ko", title: "구매자 가이드", sub: "한국에서 차량 및 엔진을 구매하는 방법", steps: [
    ["선택", "웹사이트에서 상품을 선택하거나 WhatsApp으로 문의하세요."],
    ["검사", "추가 사진, 영상, 점검 보고서 및 VIN 이력을 보내드립니다."],
    ["계약 및 인보이스", "수출 계약 체결 후 견적 인보이스를 발행합니다."],
    ["서류", "수출 말소 증명서, 상업 송장, 포장 명세서, 선하증권(B/L)."],
    ["선적", "인천/부산항에서 컨테이너 또는 RoRo로 선적합니다."],
    ["통관", "귀국 통관에 필요한 서류를 안내해 드립니다."]] },
  zh: { lang: "zh", title: "买家指南", sub: "如何从韩国购买汽车和发动机", steps: [
    ["选车", "在网站上选择车源，或通过 WhatsApp 发送需求：品牌、车型、年份、预算及目的国。"],
    ["检验", "我们会发送更多照片和视频、检测报告及车架号历史记录，并确认车源在库。"],
    ["合同与发票", "签订出口合同并开具形式发票。通过银行转账支付至我们在韩国的公司账户。"],
    ["单证", "出口注销证明、商业发票、装箱单、提单 (B/L)。"],
    ["装运", "从仁川/釜山港以集装箱或滚装船 (RoRo) 发运，并提供船名和跟踪信息。"],
    ["清关", "我们为您所在国家的清关提供单证咨询，并推荐报关行。"]] },
  ar: { lang: "ar", dir: "rtl", title: "دليل المشتري", sub: "كيفية شراء السيارات والمحركات من كوريا الجنوبية", steps: [
    ["الاختيار", "اختر المنتج من الموقع أو أرسل طلبك عبر واتساب."],
    ["الفحص", "نرسل صوراً وفيديو إضافية وتقرير الفحص وسجل رقم الشاصي."],
    ["العقد والفاتورة", "نوقع عقد التصدير ونصدر فاتورة مبدئية. الدفع بتحويل بنكي."],
    ["المستندات", "شهادة إلغاء التسجيل للتصدير، الفاتورة التجارية، قائمة التعبئة، بوليصة الشحن."],
    ["الشحن", "حاويات أو RoRo من موانئ إنتشون/بوسان."],
    ["الجمارك", "نقدم الاستشارة حول مستندات التخليص الجمركي في بلدك."]] },
};
fs.mkdirSync(out("public/guides"), { recursive: true });
for (const [code, g] of Object.entries(guides)) {
  await p.setContent(`<!doctype html><html lang="${g.lang}" dir="${g.dir || "ltr"}"><head><meta charset="utf-8"><style>
  body{font-family:"DejaVu Sans","Noto Sans CJK KR","Noto Sans Arabic",sans-serif;margin:0;color:#111}
  .hero{background:linear-gradient(120deg,#007AFF,#2D55D7);color:#fff;padding:48px 56px}
  h1{font-size:40px;margin:0 0 8px} .sub{font-size:18px;opacity:.9} .brand{font-weight:800;letter-spacing:3px;margin-bottom:24px}
  .step{display:flex;gap:18px;padding:18px 56px;border-bottom:1px solid #eee} .n{flex:none;width:44px;height:44px;border-radius:50%;background:#FF9500;color:#fff;font-weight:800;display:flex;align-items:center;justify-content:center;font-size:20px}
  h3{margin:4px 0 6px;font-size:20px} p{margin:0;line-height:1.5;color:#333} .foot{padding:28px 56px;color:#555;font-size:14px}</style></head><body>
  <div class="hero"><div class="brand">BARAKAT AUTO</div><h1>${g.title}</h1><div class="sub">${g.sub}</div></div>
  ${g.steps.map(([h, t], i) => `<div class="step"><div class="n">${i + 1}</div><div><h3>${h}</h3><p>${t}</p></div></div>`).join("")}
  <div class="foot">WhatsApp: +82 10-0000-0000 · sales@barakat-auto.com · Incheon, Republic of Korea</div></body></html>`);
  await p.pdf({ path: out(`public/guides/buyer-guide-${code}.pdf`), format: "A4", printBackground: true });
}

await browser.close();
console.log("assets generated");
