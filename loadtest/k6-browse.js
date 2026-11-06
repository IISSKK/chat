// Сценарий «обычный посетитель» Barakat Auto: главная → каталог → объявление → поиск,
// плюс фоновые запросы, которые делает открытая вкладка (курсы, «онлайн», просмотр).
// Запуск:  k6 run -e BASE_URL=https://staging.example.com loadtest/k6-browse.js
// Профиль: плавный рост до TARGET_VUS «одновременных людей», удержание, спад.
import http from "k6/http";
import { check, group, sleep } from "k6";

const BASE = __ENV.BASE_URL || "http://localhost:3000";
const TARGET = Number(__ENV.TARGET_VUS || 200);
const LANGS = ["ru", "en", "ko", "zh"];
const QUERIES = ["Sonata", "KMH", "2021", "D4HB", "G4KE", "Palisade"];

export const options = {
  stages: [
    { duration: "2m", target: Math.round(TARGET / 2) },
    { duration: "3m", target: TARGET },
    { duration: "5m", target: TARGET }, // плато — смотрим метрики сервера здесь
    { duration: "1m", target: 0 },
  ],
  thresholds: {
    http_req_failed: ["rate<0.01"], // < 1% ошибок
    "http_req_duration{kind:page}": ["p(95)<1500"], // HTML-страницы
    "http_req_duration{kind:api}": ["p(95)<500"], // API
  },
};

const pick = (a) => a[Math.floor(Math.random() * a.length)];

export default function () {
  const lang = pick(LANGS);
  const jar = http.cookieJar();
  jar.set(BASE, "bk_lang", lang);
  const page = { tags: { kind: "page" } };
  const api = { tags: { kind: "api" } };

  group("home", () => {
    const r = http.get(`${BASE}/`, page);
    check(r, { "home 200": (x) => x.status === 200 });
    http.post(`${BASE}/api/visit`, null, api);
    http.post(`${BASE}/api/presence`, null, api);
    http.get(`${BASE}/api/rates`, api);
  });
  sleep(2 + Math.random() * 4);

  group("catalog", () => {
    const path = pick(["/catalog/cars", "/catalog/cars/standby", "/catalog/cars/running", "/catalog/engines"]);
    const r = http.get(`${BASE}${path}?page=${1 + Math.floor(Math.random() * 2)}`, page);
    check(r, { "catalog 200": (x) => x.status === 200 });
  });
  sleep(2 + Math.random() * 5);

  group("item", () => {
    const id = 1 + Math.floor(Math.random() * 30);
    const r = http.get(`${BASE}/item/${id}`, { ...page, redirects: 5 });
    check(r, { "item 200/404": (x) => x.status === 200 || x.status === 404 });
    http.post(`${BASE}/api/items/${id}/view`, null, api);
    // кнопка «Узнать цену»: проверяем только редирект, на wa.me не ходим
    const wa = http.get(`${BASE}/api/wa?id=${id}&kind=price`, { ...api, redirects: 0 });
    check(wa, { "wa 302": (x) => x.status === 302 });
  });
  sleep(3 + Math.random() * 5);

  group("search", () => {
    const q = pick(QUERIES);
    http.get(`${BASE}/api/search/suggest?q=${encodeURIComponent(q)}`, api);
    const r = http.get(`${BASE}/search?q=${encodeURIComponent(q)}`, page);
    check(r, { "search 200": (x) => x.status === 200 });
  });
  sleep(3 + Math.random() * 6);
}
