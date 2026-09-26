import Link from "next/link";
import { Sparkles, ArrowLeft } from "lucide-react";

export default function CarePage() {
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
            <Sparkles className="w-3.5 h-3.5" />
            Рекомендации <span className="font-brand tracking-[0.15em]">SABYR</span>
          </div>
          <h1 className="font-serif text-3xl md:text-5xl font-light tracking-wide mb-3 text-white">
            Уход за одеждой
          </h1>
          <p className="text-white/75 text-sm md:text-base max-w-xl mx-auto leading-relaxed font-light">
            Простые правила ухода за повседневной одеждой SABYR, чтобы ткани сохраняли плотность, цвет и посадку как можно дольше.
          </p>
        </div>
      </section>

      <div className="container max-w-4xl pt-10 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-card border border-border rounded-2xl p-6 space-y-3">
            <h3 className="font-bold text-base">Худи, свитшоты и костюмы (плотный футер)</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Стирать при температуре не выше 30°C на деликатном режиме (отжим до 600–800 об/мин), предварительно вывернув изделие наизнанку. Не использовать отбеливатели и машинную сушку.
            </p>
          </div>

          <div className="bg-card border border-border rounded-2xl p-6 space-y-3">
            <h3 className="font-bold text-base">Футболки, лонгсливы и поло (хлопок)</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Деликатная стирка при 30°C с вещами близких оттенков. Гладить или отпаривать с изнаночной стороны при средней температуре, избегая прямого нагрева принтов и вышивки.
            </p>
          </div>

          <div className="bg-card border border-border rounded-2xl p-6 space-y-3">
            <h3 className="font-bold text-base">Брюки и джоггеры</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Перед стиркой застегните все молнии и пуговицы и выверните изделие наизнанку. Сушите в расправленном виде вдали от отопительных приборов и прямых солнечных лучей.
            </p>
          </div>

          <div className="bg-card border border-border rounded-2xl p-6 space-y-3">
            <h3 className="font-bold text-base">Верхняя одежда и куртки</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Локальные загрязнения удаляйте влажной мягкой салфеткой. Для глубокой чистки курток и верхней одежды рекомендуется профессиональная деликатная химчистка.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
