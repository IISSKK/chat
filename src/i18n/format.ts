/** Подстановка значений в строку словаря: fmt("Фото {n}", { n: 2 }) → "Фото 2" */
export function fmt(template: string, vars: Record<string, string | number>) {
  return template.replace(/\{(\w+)\}/g, (_, k) => (k in vars ? String(vars[k]) : `{${k}}`));
}

/** Множественное число по правилам языка (Intl.PluralRules): forms = { one, few, many, other } */
export function plural(n: number, forms: { one: string; few: string; many: string; other: string }, intl: string) {
  const cat = new Intl.PluralRules(intl).select(n) as keyof typeof forms;
  return forms[cat] ?? forms.other;
}

export function formatNum(n: number | null | undefined, intl: string) {
  if (n === null || n === undefined) return "";
  return new Intl.NumberFormat(intl).format(n);
}
