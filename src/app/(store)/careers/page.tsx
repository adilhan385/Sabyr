import Link from "next/link";
import { Briefcase, ArrowLeft, Mail } from "lucide-react";

export default function CareersPage() {
  return (
    <main className="min-h-screen pb-24 bg-background">
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
            <Briefcase className="w-3.5 h-3.5" />
            Команда <span className="font-brand tracking-[0.15em]">SABYR</span>
          </div>
          <h1 className="font-serif text-3xl md:text-5xl font-light tracking-wide mb-3 text-white">
            Карьера в доме моды
          </h1>
          <p className="text-white/75 text-sm md:text-base max-w-xl mx-auto leading-relaxed font-light">
            Присоединяйтесь к созданию новой эпохи казахстанского fashion-премиума.
          </p>
        </div>
      </section>

      <div className="container max-w-4xl pt-10 space-y-6">
        <div className="bg-card border border-border rounded-3xl p-8 space-y-4">
          <h2 className="text-xl font-bold">Открытые направления</h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Мы постоянно ищем талантливых конструкторов одежды, портных премиального пошива, стилистов-консультантов для флагманских бутиков в Алматы и Астане, а также e-commerce специалистов.
          </p>
          <div className="pt-2">
            <a
              href="mailto:hr@sabyr.kz"
              className="inline-flex items-center gap-2 px-6 py-3 bg-foreground text-background text-xs font-semibold rounded-full hover:opacity-90 transition-opacity"
            >
              <Mail className="w-4 h-4" />
              Отправить резюме: hr@sabyr.kz
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}
