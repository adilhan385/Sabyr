import Link from "next/link";
import { RotateCcw, ShieldCheck, CheckCircle2, ArrowLeft, RefreshCw } from "lucide-react";

export default function ReturnsPage() {
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
            <RotateCcw className="w-3.5 h-3.5" />
            Правила обмена и возврата <span className="font-brand tracking-[0.15em]">SABYR</span>
          </div>
          <h1 className="font-serif text-3xl md:text-5xl font-light tracking-wide mb-3 text-white">
            Возврат и обмен
          </h1>
          <p className="text-white/75 text-sm md:text-base max-w-xl mx-auto leading-relaxed font-light">
            Если размер или фасон повседневной одежды SABYR вам не подошел, вы можете легко обменять изделие на другой размер или оформить возврат в течение 14 дней.
          </p>
        </div>
      </section>

      <div className="container max-w-4xl pt-10 space-y-10">
        {/* Key Points */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-card border border-border rounded-2xl p-6 space-y-2">
            <span className="text-2xl font-serif text-[hsl(var(--accent))]">14 дней</span>
            <h3 className="font-semibold text-sm">Срок на обмен и возврат</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Согласно Закону РК «О защите прав потребителей», обмен или возврат возможен в течение 14 календарных дней со дня получения заказа.
            </p>
          </div>

          <div className="bg-card border border-border rounded-2xl p-6 space-y-2">
            <ShieldCheck className="w-7 h-7 text-[hsl(var(--accent))]" />
            <h3 className="font-semibold text-sm">Условия товарного вида</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Вещь не должна быть в носке или стирке. Обязательно сохранение всех фабричных бирок, ярлыков и оригинальной упаковки SABYR.
            </p>
          </div>

          <div className="bg-card border border-border rounded-2xl p-6 space-y-2">
            <RefreshCw className="w-7 h-7 text-[hsl(var(--accent))]" />
            <h3 className="font-semibold text-sm">Быстрый обмен размера</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              По г. Астана обмен размера возможен курьером в день обращения. По регионам Казахстана — отправка нового размера сразу после приема возврата.
            </p>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-card border border-border rounded-3xl p-6 md:p-8 space-y-6">
          <h2 className="text-lg font-bold">Как оформить обмен или возврат:</h2>
          <div className="space-y-4 text-xs text-muted-foreground leading-relaxed">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-4 h-4 text-foreground mt-0.5 shrink-0" />
              <p>
                <strong className="text-foreground">Шаг 1 — Напишите нам в Direct:</strong> Свяжитесь с нами в Instagram{" "}
                <a
                  href="https://www.instagram.com/sabyr.wear/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-foreground underline font-semibold"
                >
                  @sabyr.wear
                </a>{" "}
                и укажите номер заказа (или номер телефона) и причину обмена/возврата.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-4 h-4 text-foreground mt-0.5 shrink-0" />
              <p>
                <strong className="text-foreground">Шаг 2 — Передача изделия (Астана и РК):</strong> В г. Астана вы можете передать вещь курьером. Из других городов Казахстана отправка осуществляется через СДЭК или Казпочту до нашего склада в г. Астана.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-4 h-4 text-foreground mt-0.5 shrink-0" />
              <p>
                <strong className="text-foreground">Шаг 3 — Возврат средств или отправка обмена:</strong> После проверки товарного вида изделия возврат средств на Kaspi или банковскую карту производится в течение 1–3 рабочих дней.
              </p>
            </div>
          </div>

          <div className="pt-4 border-t border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <p className="text-xs text-muted-foreground">
              Нужна помощь с обменом размера или возвратом? Напишите нам напрямую:
            </p>
            <a
              href="https://www.instagram.com/sabyr.wear/?utm_source=ig_web_button_share_sheet"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-foreground text-background text-xs font-semibold rounded-full hover:opacity-90 transition-opacity"
            >
              Написать в Direct @sabyr.wear
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}
