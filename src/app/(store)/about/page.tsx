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
            О бренде <span className="font-brand tracking-[0.15em]">SABYR</span>
          </div>
          <h1 className="font-serif text-3xl md:text-6xl font-light tracking-wide mb-4 text-white">
            Первое впечатление без слов.
          </h1>
          <p className="text-white/75 text-sm md:text-base max-w-2xl mx-auto leading-relaxed font-light">
            SABYR (@sabyr.wear) — бренд современной повседневной одежды из Астаны для тех, кто выбирает уверенный минимализм, комфорт и качество в каждой детали.
          </p>
        </div>
      </section>

      <div className="container max-w-4xl pt-14 space-y-16">
        {/* Story Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
          <div className="space-y-4">
            <span className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">
              Философия SABYR
            </span>
            <h2 className="text-2xl md:text-3xl font-serif">
              Современная повседневная одежда с характером
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Название SABYR отражает внутреннее спокойствие, выдержку и уверенность, которая не нуждается в громких словах. Мы создаем базовые и акцентные вещи на каждый день: худи, свитшоты, футболки, костюмы, брюки и верхнюю одежду.
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Каждая модель разрабатывается с акцентом на правильную посадку, плотные износостойкие ткани и чистые линии, которые легко сочетаются между собой в повседневном гардеробе.
            </p>
          </div>

          <div className="bg-secondary/40 border border-border rounded-3xl p-8 space-y-6">
            <div className="border-b border-border pb-4">
              <span className="text-2xl font-serif text-[hsl(var(--accent))]">Астана • Казахстан</span>
              <p className="text-xs text-muted-foreground mt-1">Локальный бренд с быстрой доставкой по всей стране</p>
            </div>
            <div className="border-b border-border pb-4">
              <span className="text-2xl font-serif text-[hsl(var(--accent))]">Плотные ткани</span>
              <p className="text-xs text-muted-foreground mt-1">Материалы, которые держат форму после множества стирок</p>
            </div>
            <div>
              <span className="text-2xl font-serif text-[hsl(var(--accent))]">Выверенный крой</span>
              <p className="text-xs text-muted-foreground mt-1">Актуальные силуэты для повседневного комфорта</p>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="bg-card border border-border rounded-3xl p-8 text-center space-y-4">
          <h3 className="text-xl font-bold">Познакомьтесь с коллекцией SABYR</h3>
          <p className="text-xs text-muted-foreground max-w-md mx-auto">
            Выберите свои базовые изделия в каталоге на сайте или следите за новыми дропами в нашем Instagram @sabyr.wear.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href="/catalog"
              className="inline-flex items-center gap-2 px-6 py-3 bg-foreground text-background text-xs font-semibold rounded-full hover:opacity-90 transition-opacity"
            >
              Смотреть каталог
              <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href="https://www.instagram.com/sabyr.wear/?utm_source=ig_web_button_share_sheet"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 border border-border bg-background text-foreground text-xs font-semibold rounded-full hover:bg-secondary transition-colors"
            >
              Instagram @sabyr.wear
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}
