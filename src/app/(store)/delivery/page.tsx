import Link from "next/link";
import { Truck, CreditCard, ShieldCheck, Clock, ArrowLeft, MapPin } from "lucide-react";

export default function DeliveryPage() {
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
            <Truck className="w-3.5 h-3.5" />
            Астана • Доставка по Казахстану <span className="font-brand tracking-[0.15em]">SABYR</span>
          </div>
          <h1 className="font-serif text-3xl md:text-5xl font-light tracking-wide mb-3 text-white">
            Доставка и оплата
          </h1>
          <p className="text-white/75 text-sm md:text-base max-w-xl mx-auto leading-relaxed font-light">
            Оперативная доставка современной повседневной одежды SABYR по г. Астана и во все города Казахстана.
          </p>
        </div>
      </section>

      <div className="container max-w-4xl pt-10 space-y-12">
        {/* Delivery Options */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold tracking-tight">Варианты доставки</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-card border border-border rounded-2xl p-6 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-[hsl(var(--accent))]" />
                  <h3 className="font-semibold text-sm">Курьерская доставка по г. Астана</h3>
                </div>
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">В день заказа</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Быстрая доставка курьером (Яндекс Доставка / курьерская служба) до двери по г. Астана. Отправка сразу после подтверждения заказа.
              </p>
              <div className="text-[11px] text-muted-foreground pt-2 border-t border-border flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" /> Срок: в день заказа или на следующий день
              </div>
            </div>

            <div className="bg-card border border-border rounded-2xl p-6 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Truck className="w-4 h-4 text-[hsl(var(--accent))]" />
                  <h3 className="font-semibold text-sm">Доставка по всему Казахстану</h3>
                </div>
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">Все регионы РК</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Отправка из Астаны во все города Казахстана (Алматы, Шымкент, Караганда, Актобе, Атырау, Актау, Павлодар и др.) через СДЭК и Казпочту с трек-номером для отслеживания.
              </p>
              <div className="text-[11px] text-muted-foreground pt-2 border-t border-border flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" /> Срок: 2–5 рабочих дней в зависимости от региона
              </div>
            </div>
          </div>
        </section>

        {/* Payment Methods */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold tracking-tight">Способы оплаты</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-card border border-border rounded-2xl p-5 space-y-2">
              <ShieldCheck className="w-5 h-5 text-[hsl(var(--accent))]" />
              <h3 className="font-semibold text-sm">Kaspi Pay / Kaspi QR</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Удобная и быстрая оплата через приложение Kaspi.kz (QR, перевод по счету или Kaspi Red).
              </p>
            </div>

            <div className="bg-card border border-border rounded-2xl p-5 space-y-2">
              <CreditCard className="w-5 h-5 text-[hsl(var(--accent))]" />
              <h3 className="font-semibold text-sm">Банковские карты</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Оплата картами Visa и MasterCard любых банков Республики Казахстан при оформлении заказа на сайте.
              </p>
            </div>

            <div className="bg-card border border-border rounded-2xl p-5 space-y-2">
              <Clock className="w-5 h-5 text-[hsl(var(--accent))]" />
              <h3 className="font-semibold text-sm">Заказ через Direct</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Вы также можете оформить заказ и уточнить замеры напрямую в Instagram{" "}
                <a
                  href="https://www.instagram.com/sabyr.wear/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-foreground underline font-semibold"
                >
                  @sabyr.wear
                </a>
                .
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
