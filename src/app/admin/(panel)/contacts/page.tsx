import { ContactsEditor } from "@/components/admin/ContactsEditor";
import { getWhatsAppContacts, MAX_WA_CONTACTS } from "@/lib/contacts";
import { requirePagePermission } from "@/lib/admin-guard";

export default async function ContactsPage() {
  await requirePagePermission("contacts");
  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl font-bold">Контакты</h1>
        <p className="text-sm text-slate-500">
          Номера WhatsApp на сайте. Если номеров несколько, посетитель при нажатии на кнопку WhatsApp выбирает, кому написать.
          Первый номер в списке — основной.
        </p>
      </div>
      <ContactsEditor initial={getWhatsAppContacts()} max={MAX_WA_CONTACTS} />
    </div>
  );
}
