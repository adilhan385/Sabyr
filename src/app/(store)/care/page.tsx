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
            Памятка Atelier <span className="font-brand tracking-[0.15em]">SABYR</span>
          </div>
          <h1 className="font-serif text-3xl md:text-5xl font-light tracking-wide mb-3 text-white">
            Уход за изделиями
          </h1>
          <p className="text-white/75 text-sm md:text-base max-w-xl mx-auto leading-relaxed font-light">
            Как продлить жизнь натуральным тканям и сохранить первозданную форму вещей на десятилетия.
          </p>
        </div>
      </section>

      <div className="container max-w-4xl pt-10 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-card border border-border rounded-2xl p-6 space-y-3">
            <h3 className="font-bold text-base">Шерсть и кашемир</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Рекомендуется исключительно сухая деликатная химчистка. Между сезонами храните вещи на широких плечиках в воздухопроницаемых тканевых чехлах SABYR с саше из кедра.
            </p>
          </div>

          <div className="bg-card border border-border rounded-2xl p-6 space-y-3">
            <h3 className="font-bold text-base">Натуральный шелк</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Ручная стирка в прохладной воде (до 30°C) с мягкими средствами для шелка без отжима. Сушить в горизонтальном положении вдали от прямых солнечных лучей.
            </p>
          </div>

          <div className="bg-card border border-border rounded-2xl p-6 space-y-3">
            <h3 className="font-bold text-base">Мерсеризованный хлопок</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Деликатная стирка при температуре 30-40°C. Гладить с изнаночной стороны или использовать вертикальное отпаривание для сохранения гладкости волокон.
            </p>
          </div>

          <div className="bg-card border border-border rounded-2xl p-6 space-y-3">
            <h3 className="font-bold text-base">Кожа и замша</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Избегать длительного контакта с влагой. При попадании воды промокнуть сухой мягкой салфеткой. Доверять чистку только специализированным эко-химчисткам.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
