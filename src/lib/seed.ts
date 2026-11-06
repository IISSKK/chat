import { transaction, type DB } from "./db";
import { slugify } from "./utils";

/** Демо-данные: 24 автомобиля (по 8 в каждой подкатегории) и 8 двигателей. */

let seed = 7;
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const pick = <T,>(arr: readonly T[]) => arr[Math.floor(rnd() * arr.length)];
const CHARS = "ABCDEFGHJKLMNPRSTUVWXYZ0123456789";
const vin = (wmi: string) => wmi + Array.from({ length: 14 }, () => pick(CHARS.split(""))).join("");
const serial = (p: string) => `${p}${Math.floor(100000 + rnd() * 899999)}`;

type Seed = {
  title: string; brand: string; model: string; year: number; engine_code: string; displacement: number;
  transmission: string; fuel: string; mileage: number; notes: string;
};

const cars: Seed[] = [
  { title: "Hyundai Sonata DN8 2.0", brand: "Hyundai", model: "Sonata", year: 2021, engine_code: "G4NA", displacement: 1999, transmission: "automatic", fuel: "gasoline", mileage: 42000, notes: "Один владелец, сервисная книжка, без ДТП." },
  { title: "Kia K5 DL3 1.6T", brand: "Kia", model: "K5", year: 2022, engine_code: "G4FP", displacement: 1598, transmission: "automatic", fuel: "gasoline", mileage: 31000, notes: "Комплектация Signature, панорама, вентиляция сидений." },
  { title: "Hyundai Santa Fe TM 2.2 CRDi", brand: "Hyundai", model: "Santa Fe", year: 2020, engine_code: "D4HB", displacement: 2199, transmission: "automatic", fuel: "diesel", mileage: 78000, notes: "Полный привод HTRAC, 7 мест." },
  { title: "Kia Sorento MQ4 Hybrid", brand: "Kia", model: "Sorento", year: 2022, engine_code: "G4FT", displacement: 1598, transmission: "automatic", fuel: "hybrid", mileage: 25000, notes: "Гибрид 1.6T, 4WD, комплектация Gravity." },
  { title: "Hyundai Palisade 3.8 V6", brand: "Hyundai", model: "Palisade", year: 2021, engine_code: "G6DN", displacement: 3778, transmission: "automatic", fuel: "gasoline", mileage: 54000, notes: "Calligraphy, 8 мест, Bose." },
  { title: "Kia Carnival KA4 2.2D", brand: "Kia", model: "Carnival", year: 2021, engine_code: "D4HE", displacement: 2151, transmission: "automatic", fuel: "diesel", mileage: 66000, notes: "9 мест, электродвери." },
  { title: "Genesis G80 2.5T AWD", brand: "Genesis", model: "G80", year: 2022, engine_code: "G4KP", displacement: 2497, transmission: "automatic", fuel: "gasoline", mileage: 19000, notes: "Пакет Sport, HUD, полный привод." },
  { title: "Hyundai Tucson NX4 1.6T", brand: "Hyundai", model: "Tucson", year: 2022, engine_code: "G4FP", displacement: 1598, transmission: "dct", fuel: "gasoline", mileage: 28000, notes: "Inspiration, цифровая панель." },
  { title: "Kia Sportage NQ5 2.0 LPi", brand: "Kia", model: "Sportage", year: 2023, engine_code: "L4NA", displacement: 1999, transmission: "automatic", fuel: "lpg", mileage: 15000, notes: "Газ с завода, экономичный." },
  { title: "Hyundai Grandeur IG 3.0 LPi", brand: "Hyundai", model: "Grandeur", year: 2019, engine_code: "L6DB", displacement: 2999, transmission: "automatic", fuel: "lpg", mileage: 112000, notes: "Бывшее такси, полное ТО." },
  { title: "Kia Morning JA 1.0", brand: "Kia", model: "Morning", year: 2020, engine_code: "G3LA", displacement: 998, transmission: "automatic", fuel: "gasoline", mileage: 47000, notes: "Городской хэтчбек, экономичный." },
  { title: "Hyundai Avante CN7 1.6", brand: "Hyundai", model: "Avante", year: 2021, engine_code: "G4FM", displacement: 1598, transmission: "cvt", fuel: "gasoline", mileage: 39000, notes: "Smartstream, IVT." },
  { title: "Kia Seltos 1.6T AWD", brand: "Kia", model: "Seltos", year: 2021, engine_code: "G4FJ", displacement: 1591, transmission: "dct", fuel: "gasoline", mileage: 44000, notes: "Полный привод, комплектация Noblesse." },
  { title: "Hyundai Porter II 2.5 CRDi", brand: "Hyundai", model: "Porter", year: 2019, engine_code: "D4CB", displacement: 2497, transmission: "manual", fuel: "diesel", mileage: 135000, notes: "Бортовой, двойная кабина." },
  { title: "Kia Bongo III 2.5 CRDi 4WD", brand: "Kia", model: "Bongo", year: 2018, engine_code: "D4CB", displacement: 2497, transmission: "manual", fuel: "diesel", mileage: 148000, notes: "Полный привод, тент." },
  { title: "SsangYong Rexton G4 2.2D", brand: "SsangYong", model: "Rexton", year: 2020, engine_code: "D22DTR", displacement: 2157, transmission: "automatic", fuel: "diesel", mileage: 71000, notes: "Рамный SUV, 4WD." },
  { title: "Renault Samsung QM6 2.0 LPe", brand: "Renault Samsung", model: "QM6", year: 2020, engine_code: "M4R", displacement: 1998, transmission: "cvt", fuel: "lpg", mileage: 63000, notes: "Газ, тороидальный баллон." },
  { title: "Genesis GV80 3.0D AWD", brand: "Genesis", model: "GV80", year: 2021, engine_code: "D6HA", displacement: 2959, transmission: "automatic", fuel: "diesel", mileage: 38000, notes: "Рядная шестёрка, максималка." },
  { title: "Hyundai Staria 2.2 CRDi", brand: "Hyundai", model: "Staria", year: 2022, engine_code: "D4HE", displacement: 2199, transmission: "automatic", fuel: "diesel", mileage: 34000, notes: "Lounge 9 мест." },
  { title: "Kia K8 2.5 GDI", brand: "Kia", model: "K8", year: 2022, engine_code: "G4KN", displacement: 2497, transmission: "automatic", fuel: "gasoline", mileage: 22000, notes: "Бизнес-седан, Meridian." },
  { title: "Hyundai Kona Electric 64 kWh", brand: "Hyundai", model: "Kona", year: 2021, engine_code: "EM16", displacement: 0, transmission: "automatic", fuel: "electric", mileage: 36000, notes: "SOH батареи 96%." },
  { title: "Kia Ray 1.0", brand: "Kia", model: "Ray", year: 2019, engine_code: "G3LA", displacement: 998, transmission: "automatic", fuel: "gasoline", mileage: 58000, notes: "Сдвижная дверь, компактный." },
  { title: "SsangYong Korando C300 1.5T", brand: "SsangYong", model: "Korando", year: 2020, engine_code: "G15DTF", displacement: 1497, transmission: "automatic", fuel: "gasoline", mileage: 49000, notes: "Кроссовер, комплектация C7." },
  { title: "Hyundai Ioniq 5 Long Range", brand: "Hyundai", model: "Ioniq 5", year: 2022, engine_code: "EM17", displacement: 0, transmission: "automatic", fuel: "electric", mileage: 27000, notes: "AWD, батарея 77,4 кВт·ч." },
];

const engines: Seed[] = [
  { title: "Двигатель G4KE 2.4 Theta II", brand: "Hyundai", model: "Sonata / Santa Fe", year: 2016, engine_code: "G4KE", displacement: 2359, transmission: "automatic", fuel: "gasoline", mileage: 68000, notes: "В сборе с навесным, компрессия проверена." },
  { title: "Двигатель G4FD 1.6 GDI Gamma", brand: "Hyundai", model: "Avante / Tucson", year: 2018, engine_code: "G4FD", displacement: 1591, transmission: "automatic", fuel: "gasoline", mileage: 54000, notes: "Без навесного, видео работы." },
  { title: "Двигатель D4HB 2.2 CRDi R-line", brand: "Kia", model: "Sorento / Santa Fe", year: 2019, engine_code: "D4HB", displacement: 2199, transmission: "automatic", fuel: "diesel", mileage: 82000, notes: "С ТНВД и форсунками." },
  { title: "Двигатель G6DH 3.3 Lambda II", brand: "Hyundai", model: "Grandeur / K7", year: 2017, engine_code: "G6DH", displacement: 3342, transmission: "automatic", fuel: "gasoline", mileage: 91000, notes: "V6, в сборе." },
  { title: "Двигатель D4CB 2.5 A2 CRDi", brand: "Hyundai", model: "Porter / Bongo / Starex", year: 2019, engine_code: "D4CB", displacement: 2497, transmission: "manual", fuel: "diesel", mileage: 120000, notes: "Euro 5, с турбиной." },
  { title: "Двигатель L4KA 2.0 LPi", brand: "Kia", model: "K5 / Sonata LPi", year: 2018, engine_code: "L4KA", displacement: 1999, transmission: "automatic", fuel: "lpg", mileage: 140000, notes: "Газовый, после такси, проверен." },
  { title: "Двигатель G4KJ 2.4 GDI", brand: "Kia", model: "Optima / Sportage", year: 2017, engine_code: "G4KJ", displacement: 2359, transmission: "automatic", fuel: "gasoline", mileage: 73000, notes: "Прямой впрыск, в сборе." },
  { title: "Двигатель G4NA 2.0 MPi Nu", brand: "Hyundai", model: "Elantra / Tucson", year: 2020, engine_code: "G4NA", displacement: 1999, transmission: "automatic", fuel: "gasoline", mileage: 39000, notes: "Низкий пробег, гарантия на запуск." },
];


const wmiByBrand: Record<string, string> = {
  Hyundai: "KMH", Kia: "KNA", Genesis: "KMT", SsangYong: "KPT", "Renault Samsung": "KNM",
};

const IMG = { car: 12, engine: 6 } as const;

export function seedDemoData(db: DB) {
  seed = 7;
  const insert = db.prepare(`INSERT INTO items
    (type, category, slug, title, brand, model, year, first_registration, vin, serial, engine_code, displacement,
     transmission, mileage, fuel, notes, status, created_at, updated_at)
    VALUES (@type, @category, @slug, @title, @brand, @model, @year, @first_registration, @vin, @serial, @engine_code,
     @displacement, @transmission, @mileage, @fuel, @notes, @status, @ts, @ts)`);
  const photo = db.prepare("INSERT INTO photos (item_id, filename, position) VALUES (?, ?, ?)");
  const categories = ["standby", "listing", "running"] as const;
  let minutes = 0;

  const add = (type: "car" | "engine", s: Seed, index: number) => {
    minutes += 37;
    const ts = new Date(Date.now() - minutes * 60000).toISOString().replace("T", " ").slice(0, 19);
    const res = insert.run({
      ...s,
      type,
      category: type === "car" ? categories[index % 3] : index % 3 === 0 ? "standby" : "listing",
      slug: slugify(s.title),
      first_registration: `${s.year}-${String(1 + Math.floor(rnd() * 12)).padStart(2, "0")}`,
      vin: vin(wmiByBrand[s.brand] ?? "KMH"),
      serial: serial(s.engine_code.slice(0, 2)),
      displacement: s.displacement || null,
      status: index % 7 === 5 ? "sold" : "available",
      ts,
    });
    const id = Number(res.lastInsertRowid);
    const n = IMG[type];
    for (let k = 0; k < 3; k++) photo.run(id, `demo/${type}-${((index + k * 5) % n) + 1}.jpg`, k);
  };

  transaction(db, () => {
    cars.forEach((s, i) => add("car", s, i));
    engines.forEach((s, i) => add("engine", s, i));
  });
}
