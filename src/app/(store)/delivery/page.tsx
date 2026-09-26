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
            Логистика и сервис <span className="font-brand tracking-[0.15em]">SABYR</span>
          </div>
          <h1 className="font-serif text-3xl md:text-5xl font-light tracking-wide mb-3 text-white">
            Доставка и оплата
          </h1>
          <p className="text-white/75 text-sm md:text-base max-w-xl mx-auto leading-relaxed font-light">
            Бережная доставка заказов в фирменной подарочной упаковке по всему Казахстану и миру.
          </p>
        </div>
      </section>

      <div className="container max-w-4xl pt-10 space-y-12">
        {/* Delivery Options */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold tracking-tight">Варианты доставки</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-card border border-border rounded-2xl p-6 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-[hsl(var(--accent))]" />
                  <h3 className="font-semibold text-sm">Курьером до двери (Алматы и Астана)</h3>
                </div>
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">Бесплатно от 30 000 ₸</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Доставка в день заказа или на следующий рабочий день. Включает опцию примерки перед покупкой (15 минут ожидания курьера).
              </p>
              <div className="text-[11px] text-muted-foreground pt-2 border-t border-border flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" /> Срок: 1-2 рабочих дня (2 000 ₸ при заказе до 30 000 ₸)
              </div>
            </div>

            <div className="bg-card border border-border rounded-2xl p-6 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Truck className="w-4 h-4 text-[hsl(var(--accent))]" />
                  <h3 className="font-semibold text-sm">Экспресс-доставка по Казахстану</h3>
                </div>
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">Бесплатно от 50 000 ₸</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Отправка надежными курьерскими службами СДЭК и DPD во все областные центры и города РК (Шымкент, Караганда, Актобе и др.).
              </p>
              <div className="text-[11px] text-muted-foreground pt-2 border-t border-border flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" /> Срок: 2-4 рабочих дня (3 000 ₸ при заказе до 50 000 ₸)
              </div>
            </div>
          </div>
        </section>

        {/* Payment Methods */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold tracking-tight">Способы оплаты</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-card border border-border rounded-2xl p-5 space-y-2">
              <CreditCard className="w-5 h-5 text-[hsl(var(--accent))]" />
              <h3 className="font-semibold text-sm">Банковские карты</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Visa, MasterCard, Мир любых банков. Безопасные онлайн-платежи через CloudPayments KZ с 3D-Secure.
              </p>
            </div>

            <div className="bg-card border border-border rounded-2xl p-5 space-y-2">
              <ShieldCheck className="w-5 h-5 text-[hsl(var(--accent))]" />
              <h3 className="font-semibold text-sm">Kaspi Pay / Kaspi QR</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Оплата по QR-коду через приложение Kaspi.kz. Также доступна беспроцентная рассрочка Kaspi Red.
              </p>
            </div>

            <div className="bg-card border border-border rounded-2xl p-5 space-y-2">
              <Clock className="w-5 h-5 text-[hsl(var(--accent))]" />
              <h3 className="font-semibold text-sm">Оплата при получении</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Оплата наличными или картой курьеру после примерки в Алматы и Астане.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
