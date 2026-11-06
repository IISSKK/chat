import type { Metadata } from "next";
import { siteConfig } from "@/config/site";
import { getT } from "@/i18n/server";
import { fmt } from "@/i18n/format";
import { LegalPage } from "@/components/site/LegalPage";
import { getWhatsAppContacts } from "@/lib/contacts";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t.legal.privacyTitle };
}

export default async function PrivacyPage() {
  const t = await getT();
  const vars = { name: siteConfig.name, email: siteConfig.email, whatsapp: getWhatsAppContacts().map((c) => c.phone).join(", ") };
  return <LegalPage title={t.legal.privacyTitle} updated="01.11.2026" sections={t.legal.privacy.map((s) => ({ h: s.h, p: fmt(s.p, vars) }))} />;
}
