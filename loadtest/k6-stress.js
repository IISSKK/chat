// Поиск точки отказа: ступенчато увеличиваем нагрузку, пока не начнутся ошибки / p95 > 3 c.
// k6 run -e BASE_URL=https://staging.example.com loadtest/k6-stress.js
// Точка отказа = число VU на последней ступени, где http_req_failed < 1% и p95 приемлем.
import http from "k6/http";
import { check, sleep } from "k6";

const BASE = __ENV.BASE_URL || "http://localhost:3000";

export const options = {
  stages: [50, 100, 200, 400, 600, 800, 1000].flatMap((t) => [
    { duration: "1m", target: t },
    { duration: "2m", target: t },
  ]),
  thresholds: {
    http_req_failed: [{ threshold: "rate<0.05", abortOnFail: true }],
    http_req_duration: [{ threshold: "p(95)<5000", abortOnFail: true }],
  },
};

export default function () {
  const paths = ["/", "/catalog/cars", "/catalog/engines", `/item/${1 + Math.floor(Math.random() * 30)}`];
  const r = http.get(`${BASE}${paths[Math.floor(Math.random() * paths.length)]}`);
  check(r, { ok: (x) => x.status < 500 });
  sleep(1 + Math.random() * 2);
}
