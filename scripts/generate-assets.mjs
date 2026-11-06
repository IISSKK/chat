/**
 * Генерирует демо-изображения (public/demo/*.jpg), OG-картинку по умолчанию и PDF-руководства (public/guides/*.pdf).
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
  ["#FF8A3D", "#D64541", "#FFC857"],
  ["#B5482F", "#FFB547", "#7A2E3A"],
  ["#E8467C", "#FF8A5C", "#FFD089"],
  ["#5A3420", "#D9824B", "#FFB547"],
  ["#C9A15D", "#8C3B2A", "#FFC857"],
  ["#FF6B35", "#7A2E3A", "#F2C14E"],
];
const bodyColors = ["#F3E3CF", "#2B211B", "#FFB547", "#D64541", "#8C3B2A", "#B8A99A", "#FAECDA", "#1C130D", "#E8553D", "#C9A15D", "#7A2E3A", "#F2C14E"];

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
  return `<svg viewBox="0 0 1000 500" width="78%"><ellipse cx="500" cy="465" rx="430" ry="22" fill="rgba(0,0,0,.35)"/>
    <path d="${bodies[style]}" fill="${color}" stroke="rgba(0,0,0,.25)" stroke-width="3"/>${windows[style]}
    <rect x="860" y="320" width="45" height="18" rx="6" fill="#FFE27A"/><rect x="95" y="320" width="35" height="16" rx="6" fill="#ff5f6d"/>
    ${wheel(250)}${wheel(750)}</svg>`;
};

const engine = (color) => `<svg viewBox="0 0 1000 600" width="70%">
  <ellipse cx="500" cy="560" rx="380" ry="22" fill="rgba(0,0,0,.35)"/>
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
    return `<svg viewBox="0 0 1000 600" width="60%"><ellipse cx="500" cy="560" rx="300" ry="20" fill="rgba(0,0,0,.35)"/>
    <circle cx="430" cy="310" r="200" fill="#2b2f3a"/><circle cx="430" cy="310" r="130" fill="#9aa3b2"/>
    ${Array.from({ length: 10 }, (_, i) => `<path d="M430 310 L${430 + 125 * Math.cos(i * 0.628)} ${310 + 125 * Math.sin(i * 0.628)}" stroke="#4b5260" stroke-width="18"/>`).join("")}
    <circle cx="430" cy="310" r="36" fill="${color}"/><rect x="600" y="250" width="260" height="120" rx="30" fill="${color}"/></svg>`;
  if (kind === 1) // gear
    return `<svg viewBox="0 0 1000 600" width="55%"><ellipse cx="500" cy="560" rx="280" ry="20" fill="rgba(0,0,0,.35)"/>
    <g transform="translate(500 300)">${Array.from({ length: 12 }, (_, i) => `<rect x="-30" y="-245" width="60" height="80" rx="10" fill="#3a3f4c" transform="rotate(${i * 30})"/>`).join("")}
    <circle r="190" fill="#3a3f4c"/><circle r="120" fill="${color}"/><circle r="50" fill="#1f232c"/></g></svg>`;
  return `<svg viewBox="0 0 1000 600" width="72%"><ellipse cx="500" cy="560" rx="380" ry="20" fill="rgba(0,0,0,.35)"/>
    <rect x="140" y="200" width="720" height="240" rx="30" fill="#3a3f4c"/><rect x="170" y="160" width="660" height="70" rx="20" fill="${color}"/>
    ${[0, 1, 2, 3].map((i) => `<circle cx="${270 + i * 150}" cy="330" r="55" fill="#1f232c"/><circle cx="${270 + i * 150}" cy="330" r="30" fill="#9aa3b2"/>`).join("")}</svg>`;
};

const page = (svg, [a, b, c], label) => `<!doctype html><html><body style="margin:0">
<div style="width:1200px;height:800px;position:relative;overflow:hidden;display:flex;align-items:center;justify-content:center;
background:radial-gradient(circle at 15% 20%, ${a} 0, transparent 45%),radial-gradient(circle at 85% 30%, ${b} 0, transparent 45%),radial-gradient(circle at 60% 110%, ${c} 0, transparent 50%),#120C08;">
<div style="position:absolute;inset:0;background:repeating-linear-gradient(90deg,rgba(255,230,200,.04) 0 1px,transparent 1px 80px),repeating-linear-gradient(0deg,rgba(255,230,200,.04) 0 1px,transparent 1px 80px)"></div>
<div style="position:relative;width:100%;display:flex;justify-content:center">${svg}</div>
<div style="position:absolute;left:40px;bottom:30px;font:700 28px DejaVu Sans,sans-serif;color:rgba(250,236,218,.6);letter-spacing:4px">DEMO · ${label}</div>
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
for (let i = 0; i < 6; i++) await shot(page(part(i % 3, bodyColors[(i * 5 + 3) % 12]), palettes[(i + 4) % 6], "PARTS"), `public/demo/part-${i + 1}.jpg`);

// OG image по умолчанию
await shot(`<!doctype html><html><body style="margin:0"><div style="width:1200px;height:630px;display:flex;flex-direction:column;justify-content:center;padding:0 80px;box-sizing:border-box;
background:radial-gradient(circle at 10% 10%,#D64541 0,transparent 45%),radial-gradient(circle at 90% 20%,#FF8A3D 0,transparent 40%),radial-gradient(circle at 70% 120%,#FFB547 0,transparent 45%),#120C08;color:#FAECDA;font-family:DejaVu Sans,sans-serif">
<div style="font-size:30px;letter-spacing:6px;opacity:.8">B2B EXPORT · SOUTH KOREA</div>
<div style="font-size:110px;font-weight:800;line-height:1;margin-top:20px">KORIDA<span style="color:#FFB547">.</span></div>
<div style="font-size:42px;margin-top:24px;max-width:900px">Автомобили, двигатели и запчасти из Кореи</div></div></body></html>`, "public/og-default.jpg", 1200, 630);

// PDF-руководства
const guides = {
  ru: { lang: "ru", title: "Руководство покупателя", sub: "Как купить автомобиль, двигатель или запчасти из Южной Кореи", steps: [
    ["Выбор", "Выберите позицию на сайте или пришлите запрос в WhatsApp: марку, модель, год, бюджет и страну назначения."],
    ["Проверка", "Мы отправим дополнительные фото и видео, отчёт об осмотре, историю по VIN и подтвердим наличие."],
    ["Контракт и инвойс", "Подписываем экспортный контракт, выставляем проформу. Оплата — банковский перевод на корпоративный счёт в Корее."],
    ["Документы", "Снятие с учёта (Export Deregistration Certificate), коммерческий инвойс, упаковочный лист, коносамент (B/L)."],
    ["Отгрузка", "Контейнер или RoRo из портов Инчхон/Пусан. Сообщаем номер судна и трекинг."],
    ["Таможня", "Консультируем по пакету документов для растаможки в вашей стране и рекомендуем брокеров."]] },
  en: { lang: "en", title: "Buyer's Guide", sub: "How to buy vehicles, engines and parts from South Korea", steps: [
    ["Selection", "Pick an item on the website or send a WhatsApp request: make, model, year, budget and destination country."],
    ["Inspection", "We send extra photos and videos, an inspection report, VIN history and confirm availability."],
    ["Contract & invoice", "We sign an export contract and issue a proforma invoice. Payment by bank transfer to our corporate account in Korea."],
    ["Documents", "Export Deregistration Certificate, commercial invoice, packing list, bill of lading (B/L)."],
    ["Shipping", "Container or RoRo from Incheon/Busan. We share the vessel name and tracking."],
    ["Customs", "We advise on the document set for customs clearance in your country and recommend brokers."]] },
  ko: { lang: "ko", title: "구매자 가이드", sub: "한국에서 차량, 엔진 및 부품을 구매하는 방법", steps: [
    ["선택", "웹사이트에서 상품을 선택하거나 WhatsApp으로 문의하세요."],
    ["검사", "추가 사진, 영상, 점검 보고서 및 VIN 이력을 보내드립니다."],
    ["계약 및 인보이스", "수출 계약 체결 후 견적 인보이스를 발행합니다."],
    ["서류", "수출 말소 증명서, 상업 송장, 포장 명세서, 선하증권(B/L)."],
    ["선적", "인천/부산항에서 컨테이너 또는 RoRo로 선적합니다."],
    ["통관", "귀국 통관에 필요한 서류를 안내해 드립니다."]] },
  ar: { lang: "ar", dir: "rtl", title: "دليل المشتري", sub: "كيفية شراء السيارات والمحركات وقطع الغيار من كوريا الجنوبية", steps: [
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
  .hero{background:linear-gradient(120deg,#8C3B2A,#FF8A3D);color:#FFF4E6;padding:48px 56px}
  h1{font-size:40px;margin:0 0 8px} .sub{font-size:18px;opacity:.9} .brand{font-weight:800;letter-spacing:3px;margin-bottom:24px}
  .step{display:flex;gap:18px;padding:18px 56px;border-bottom:1px solid #eee} .n{flex:none;width:44px;height:44px;border-radius:50%;background:#FFB547;font-weight:800;display:flex;align-items:center;justify-content:center;font-size:20px}
  h3{margin:4px 0 6px;font-size:20px} p{margin:0;line-height:1.5;color:#333} .foot{padding:28px 56px;color:#555;font-size:14px}</style></head><body>
  <div class="hero"><div class="brand">KORIDA EXPORT</div><h1>${g.title}</h1><div class="sub">${g.sub}</div></div>
  ${g.steps.map(([h, t], i) => `<div class="step"><div class="n">${i + 1}</div><div><h3>${h}</h3><p>${t}</p></div></div>`).join("")}
  <div class="foot">WhatsApp: +82 10-0000-0000 · sales@korida-export.com · Incheon, Republic of Korea</div></body></html>`);
  await p.pdf({ path: out(`public/guides/buyer-guide-${code}.pdf`), format: "A4", printBackground: true });
}

// Баннеры главной (1920×1000): закат с авто, двигатель в студии, порт отгрузки
fs.mkdirSync(out("public/banners"), { recursive: true });
const sky = (a, b, c) => `background:linear-gradient(180deg,${a} 0%,${b} 55%,${c} 100%)`;
const grain = `<div style="position:absolute;inset:0;background:repeating-linear-gradient(90deg,rgba(255,230,200,.025) 0 1px,transparent 1px 6px);mix-blend-mode:overlay"></div>`;
const hills = (y, color, amp = 60) => `<svg viewBox="0 0 1920 400" preserveAspectRatio="none" style="position:absolute;left:0;right:0;bottom:${y}px;width:100%;height:300px"><path d="M0 ${200 - amp} C 300 ${120 - amp} 520 ${260 - amp} 860 ${170 - amp} S 1500 ${90 - amp} 1920 ${190 - amp} L1920 400 L0 400 Z" fill="${color}"/></svg>`;
const bannerPage = (inner, style) => `<!doctype html><html><body style="margin:0"><div style="width:1920px;height:1000px;position:relative;overflow:hidden;${style}">${inner}${grain}</div></body></html>`;

// 1. Трасса на закате + большой SUV
await shot(bannerPage(`
  <div style="position:absolute;left:1180px;top:330px;width:520px;height:520px;border-radius:50%;background:radial-gradient(circle,#FFE1A0 0,#FFB547 35%,#FF6B35 60%,transparent 70%);filter:blur(2px)"></div>
  <div style="position:absolute;left:900px;top:120px;width:1100px;height:900px;border-radius:50%;background:radial-gradient(circle,rgba(255,150,60,.45),transparent 60%)"></div>
  ${hills(250, "#6E2A22", 40)}${hills(190, "#4A1C17", 10)}${hills(120, "#2A120E", -20)}
  <div style="position:absolute;left:0;right:0;bottom:0;height:260px;background:linear-gradient(180deg,#24120C,#120C08)"></div>
  <svg viewBox="0 0 1920 260" style="position:absolute;left:0;bottom:0;width:1920px;height:260px"><path d="M760 0 L1160 0 L1920 260 L0 260 Z" fill="#1A0F0A"/>
    ${[0, 1, 2, 3, 4].map((i) => `<rect x="${955 - i * 6}" y="${20 + i * 48}" width="${10 + i * 6}" height="${18 + i * 8}" fill="#FFB547" opacity="${0.5 + i * 0.1}"/>`).join("")}</svg>
  <div style="position:absolute;left:880px;bottom:120px;width:1000px;transform:scaleX(-1)">${car("suv", "#2A1A14").replace('width="78%"', 'width="100%"')}</div>
  <div style="position:absolute;left:880px;bottom:180px;width:1000px;height:120px;background:linear-gradient(90deg,transparent,rgba(255,181,71,.25),transparent);filter:blur(30px)"></div>
`, sky("#2A0F12", "#8C2F23", "#E06A2C")), "public/banners/banner-1.jpg", 1920, 1000);

// 2. Двигатель в тёплой студии
await shot(bannerPage(`
  <div style="position:absolute;left:1000px;top:60px;width:900px;height:900px;border-radius:50%;background:radial-gradient(circle,rgba(255,170,80,.55),rgba(214,69,65,.25) 45%,transparent 70%)"></div>
  <div style="position:absolute;left:0;right:0;bottom:0;height:280px;background:linear-gradient(180deg,transparent,#0E0906)"></div>
  <div style="position:absolute;left:940px;top:190px;width:900px">${engine("#FFB547").replace('width="70%"', 'width="100%"')}</div>
  ${Array.from({ length: 14 }, (_, i) => `<div style="position:absolute;left:${980 + (i * 137) % 820}px;top:${120 + (i * 89) % 700}px;width:${4 + (i % 3) * 2}px;height:${4 + (i % 3) * 2}px;border-radius:50%;background:#FFC877;opacity:${0.25 + (i % 4) * 0.15};box-shadow:0 0 12px #FFB547"></div>`).join("")}
`, "background:radial-gradient(ellipse at 70% 40%,#3A1E14 0,#1A0F0A 55%,#0E0906 100%)"), "public/banners/banner-2.jpg", 1920, 1000);

// 3. Порт: контейнеровоз и краны на закате
const containers = Array.from({ length: 28 }, (_, i) => {
  const cols = ["#B5482F", "#D9824B", "#8C3B2A", "#C9A15D", "#6E2A22", "#E8553D"];
  return `<rect x="${1000 + (i % 14) * 56}" y="${560 - Math.floor(i / 14) * 34}" width="52" height="30" rx="2" fill="${cols[(i * 7) % 6]}"/>`;
}).join("");
const crane = (x, h) => `<g fill="#1A0D09"><rect x="${x}" y="${640 - h}" width="16" height="${h}"/><rect x="${x + 70}" y="${640 - h}" width="16" height="${h}"/><rect x="${x - 120}" y="${640 - h - 20}" width="380" height="22"/><rect x="${x + 30}" y="${640 - h - 70}" width="12" height="60"/><path d="M${x + 36} ${640 - h - 68} L${x - 110} ${640 - h - 20} M${x + 36} ${640 - h - 68} L${x + 250} ${640 - h - 20}" stroke="#1A0D09" stroke-width="5"/></g>`;
await shot(bannerPage(`
  <div style="position:absolute;left:1250px;top:250px;width:420px;height:420px;border-radius:50%;background:radial-gradient(circle,#FFE3A8 0,#FFB547 40%,#FF7A2F 62%,transparent 72%)"></div>
  <svg viewBox="0 0 1920 1000" style="position:absolute;inset:0;width:1920px;height:1000px">
    ${crane(820, 330)}${crane(1680, 300)}
    <path d="M940 600 L1830 600 L1780 690 L990 690 Z" fill="#2A1510"/>
    <rect x="1700" y="520" width="90" height="80" fill="#2A1510"/><rect x="1720" y="490" width="20" height="30" fill="#2A1510"/>
    ${containers}
    <rect x="0" y="690" width="1920" height="310" fill="#3A1A12"/>
    ${Array.from({ length: 18 }, (_, i) => `<rect x="${1150 + (i % 6) * 60 - i * 8}" y="${700 + i * 16}" width="${200 - i * 6}" height="3" fill="#FFB547" opacity="${0.6 - i * 0.03}"/>`).join("")}
  </svg>
  <div style="position:absolute;left:0;right:0;bottom:0;height:320px;background:linear-gradient(180deg,rgba(18,12,8,0),#120C08)"></div>
`, sky("#2B1018", "#9A3A25", "#F08A3A")), "public/banners/banner-3.jpg", 1920, 1000);

await browser.close();
console.log("assets generated");
