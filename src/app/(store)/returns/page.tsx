import Link from "next/link";
import { RotateCcw, ShieldCheck, CheckCircle2, ArrowLeft } from "lucide-react";

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
            Гарантия и сервис <span className="font-brand tracking-[0.15em]">SABYR</span>
          </div>
          <h1 className="font-serif text-3xl md:text-5xl font-light tracking-wide mb-3 text-white">
            Возврат и обмен
          </h1>
          <p className="text-white/75 text-sm md:text-base max-w-xl mx-auto leading-relaxed font-light">
            Мы гарантируем безупречное качество каждого изделия. Если вещь вам не подошла, вы можете легко вернуть её в течение 14 дней.
          </p>
        </div>
      </section>

      <div className="container max-w-4xl pt-10 space-y-10">
        {/* Key Points */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-card border border-border rounded-2xl p-6 space-y-2">
            <span className="text-2xl font-serif text-[hsl(var(--accent))]">14 дней</span>
            <h3 className="font-semibold text-sm">Срок на возврат</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Вы можете оформить возврат или обмен в течение 14 календарных дней с момента получения заказа.
            </p>
          </div>

          <div className="bg-card border border-border rounded-2xl p-6 space-y-2">
            <ShieldCheck className="w-7 h-7 text-[hsl(var(--accent))]" />
            <h3 className="font-semibold text-sm">Сохранение товарного вида</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Изделие не должно иметь следов носки, со всеми оригинальными бирками, ярлыками и в фирменном чехле.
            </p>
          </div>

          <div className="bg-card border border-border rounded-2xl p-6 space-y-2">
            <RotateCcw className="w-7 h-7 text-[hsl(var(--accent))]" />
            <h3 className="font-semibold text-sm">Быстрый возврат средств</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Возврат денежных средств осуществляется на ту же карту в течение 1-3 рабочих дней после получения товара на складе.
            </p>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-card border border-border rounded-3xl p-6 md:p-8 space-y-6">
          <h2 className="text-lg font-bold">Как оформить возврат:</h2>
          <div className="space-y-4 text-xs text-muted-foreground leading-relaxed">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-4 h-4 text-foreground mt-0.5 shrink-0" />
              <p><strong className="text-foreground">Шаг 1:</strong> Напишите в нашу службу заботы через WhatsApp или Telegram с номером вашего заказа.</p>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-4 h-4 text-foreground mt-0.5 shrink-0" />
              <p><strong className="text-foreground">Шаг 2:</strong> Менеджер согласует удобное время для курьера или вызовет СДЭК за наш счет.</p>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-4 h-4 text-foreground mt-0.5 shrink-0" />
              <p><strong className="text-foreground">Шаг 3:</strong> После осмотра изделия в течение 24 часов вам будет отправлен полный возврат денежных средств.</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
