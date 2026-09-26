import Link from "next/link";
import { MapPin, Phone, Mail, Clock, ArrowLeft } from "lucide-react";

export default function ContactsPage() {
  return (
    <main className="min-h-screen pb-24 bg-background">
      {/* Header Banner */}
      <section className="bg-sabyr-black text-white pt-14 pb-16 border-b border-white/10">
        <div className="container max-w-4xl text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-white/60 hover:text-white transition-colors mb-6"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            На главную
          </Link>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-[#C9A84C] text-xs font-semibold uppercase tracking-wider mb-4 mx-auto block w-fit">
            <MapPin className="w-3.5 h-3.5" />
            Бутики и консьерж-сервис <span className="font-brand tracking-[0.15em]">SABYR</span>
          </div>
          <h1 className="font-serif text-3xl md:text-5xl font-light tracking-wide mb-3 text-white">
            Контакты
          </h1>
          <p className="text-white/75 text-sm md:text-base max-w-xl mx-auto leading-relaxed font-light">
            Мы всегда на связи для индивидуальной консультации стилиста и записи на примерку.
          </p>
        </div>
      </section>

      <div className="container max-w-4xl pt-10 space-y-10">
        {/* Boutiques Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-card border border-border rounded-3xl p-6 md:p-8 space-y-4">
            <span className="text-xs font-bold uppercase tracking-wider text-[hsl(var(--accent))]">
              Флагманский бутик
            </span>
            <h2 className="text-lg font-bold">Алматы, Самал-2</h2>
            <div className="space-y-2 text-xs text-muted-foreground leading-relaxed">
              <p className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-foreground shrink-0" />
                пр. Достык 180, ТЦ Dostyk Plaza, 2 этаж
              </p>
              <p className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-foreground shrink-0" />
                Ежедневно: 10:00 — 22:00
              </p>
              <p className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-foreground shrink-0" />
                +7 (777) 100-20-30
              </p>
            </div>
          </div>

          <div className="bg-card border border-border rounded-3xl p-6 md:p-8 space-y-4">
            <span className="text-xs font-bold uppercase tracking-wider text-[hsl(var(--accent))]">
              Бутик & Шоурум
            </span>
            <h2 className="text-lg font-bold">Астана, Есиль</h2>
            <div className="space-y-2 text-xs text-muted-foreground leading-relaxed">
              <p className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-foreground shrink-0" />
                ул. Достык 16, Talan Gallery, 1 этаж
              </p>
              <p className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-foreground shrink-0" />
                Ежедневно: 10:00 — 22:00
              </p>
              <p className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-foreground shrink-0" />
                +7 (777) 200-30-40
              </p>
            </div>
          </div>
        </div>

        {/* Concierge & Support */}
        <div className="bg-secondary/30 border border-border rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2">
            <h3 className="font-bold text-base">Персональный консьерж SABYR</h3>
            <p className="text-xs text-muted-foreground max-w-md leading-relaxed">
              Задайте любой вопрос по заказу, доставке, размерам или наличию изделий в Direct или по почте.
            </p>
          </div>

          <div className="flex gap-3">
            <a
              href="https://www.instagram.com/sabyr.wear/?utm_source=ig_web_button_share_sheet"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-foreground text-background text-xs font-medium rounded-full hover:opacity-90 transition-opacity shadow-sm"
            >
              Instagram @sabyr.wear
            </a>
            <a
              href="mailto:concierge@sabyr.kz"
              className="inline-flex items-center gap-2 px-5 py-2.5 border border-border bg-card text-foreground text-xs font-medium rounded-full hover:bg-secondary transition-colors"
            >
              <Mail className="w-3.5 h-3.5" />
              Email
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}
