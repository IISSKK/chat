"use client";

import Link from "next/link";
import type { ComponentProps } from "react";
import { localePath } from "@/i18n/config";
import { useLocale } from "@/i18n/client";

/** next/link, который сам добавляет префикс языка (/en, /ko, /zh) к внутренним ссылкам. */
export default function LocLink({ href, ...props }: ComponentProps<typeof Link>) {
  const locale = useLocale();
  return <Link href={typeof href === "string" ? localePath(locale, href) : href} {...props} />;
}
