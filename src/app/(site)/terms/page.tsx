import type { Metadata } from "next";
import { siteConfig } from "@/config/site";
import { getT } from "@/i18n/server";
import { alternatesFor } from "@/lib/seo";
import { fmt } from "@/i18n/format";
import { LegalPage } from "@/components/site/LegalPage";
import { getWhatsAppContacts } from "@/lib/contacts";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t.legal.termsTitle, alternates: await alternatesFor("/terms") };
}

export default async function TermsPage() {
  const t = await getT();
  const vars = { name: siteConfig.name, email: siteConfig.email, whatsapp: getWhatsAppContacts().map((c) => c.phone).join(", ") };
  return <LegalPage title={t.legal.termsTitle} updated="01.11.2026" sections={t.legal.terms.map((s) => ({ h: s.h, p: fmt(s.p, vars) }))} />;
}
