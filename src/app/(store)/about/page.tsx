import Link from "next/link";
import { Sparkles, ArrowLeft, ArrowRight } from "lucide-react";

export default function AboutPage() {
  return (
    <main className="min-h-screen pb-24 bg-background">
      {/* Header Banner */}
      <section className="bg-sabyr-black text-white pt-14 pb-20 border-b border-white/10">
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
            Философия дома моды <span className="font-brand tracking-[0.15em]">SABYR</span>
          </div>
          <h1 className="font-serif text-3xl md:text-6xl font-light tracking-wide mb-4 text-white">
            Казахстанский премиум с мировым взглядом
          </h1>
          <p className="text-white/75 text-sm md:text-base max-w-2xl mx-auto leading-relaxed font-light">
            SABYR — это союз многовековой кочевой эстетики, монументального минимализма и кутюрных технологий пошива.
          </p>
        </div>
      </section>

      <div className="container max-w-4xl pt-14 space-y-16">
        {/* Story Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
          <div className="space-y-4">
            <span className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">
              Идея и миссия
            </span>
            <h2 className="text-2xl md:text-3xl font-serif">
              Одежда как форма архитектурного самовыражения
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Мы основали SABYR, чтобы доказать: современный казахстанский fashion-бренд способен создавать вещи вне времени. Каждая линия, каждый лацкан и шов выверены до миллиметра.
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Мы отбираем исключительно натуральные ткани из Италии и Японии: кашемир высокой плотности, шелковистый мерсеризованный хлопок и шерсть с благородным блеском.
            </p>
          </div>

          <div className="bg-secondary/40 border border-border rounded-3xl p-8 space-y-6">
            <div className="border-b border-border pb-4">
              <span className="text-3xl font-serif text-[hsl(var(--accent))]">100%</span>
              <p className="text-xs text-muted-foreground mt-1">Собственное производство в Казахстане</p>
            </div>
            <div className="border-b border-border pb-4">
              <span className="text-3xl font-serif text-[hsl(var(--accent))]">0%</span>
              <p className="text-xs text-muted-foreground mt-1">Синтетических компромиссов в основных линейках</p>
            </div>
            <div>
              <span className="text-3xl font-serif text-[hsl(var(--accent))]">12+</span>
              <p className="text-xs text-muted-foreground mt-1">Проверок качества каждого сшитого изделия</p>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="bg-card border border-border rounded-3xl p-8 text-center space-y-4">
          <h3 className="text-xl font-bold">Познакомьтесь с актуальной коллекцией</h3>
          <p className="text-xs text-muted-foreground max-w-md mx-auto">
            Оцените качество материалов и безупречность силуэтов в нашем онлайн-каталоге или флагманских бутиках.
          </p>
          <Link
            href="/catalog"
            className="inline-flex items-center gap-2 px-6 py-3 bg-foreground text-background text-xs font-semibold rounded-full hover:opacity-90 transition-opacity"
          >
            Смотреть каталог
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </main>
  );
}
