// «Запуск рекламы»: резкий наплыв на главную и объявления за 30 секунд.
// k6 run -e BASE_URL=https://staging.example.com -e PEAK=500 loadtest/k6-spike.js
import http from "k6/http";
import { check, sleep } from "k6";

const BASE = __ENV.BASE_URL || "http://localhost:3000";
const PEAK = Number(__ENV.PEAK || 500);

export const options = {
  stages: [
    { duration: "30s", target: 20 },
    { duration: "30s", target: PEAK }, // всплеск
    { duration: "3m", target: PEAK },
    { duration: "1m", target: 0 }, // восстановление: ошибки должны исчезнуть
  ],
  thresholds: { http_req_failed: ["rate<0.02"], http_req_duration: ["p(95)<3000"] },
};

export default function () {
  const r = http.get(`${BASE}/`);
  check(r, { "200": (x) => x.status === 200 });
  sleep(1 + Math.random() * 3);
  http.get(`${BASE}/item/${1 + Math.floor(Math.random() * 30)}`);
  sleep(5 + Math.random() * 10);
}
