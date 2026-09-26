import Link from "next/link";
import { FileText, ArrowLeft } from "lucide-react";

export default function TermsPage() {
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
            <FileText className="w-3.5 h-3.5" />
            Правовая информация
          </div>
          <h1 className="font-serif text-3xl md:text-5xl font-light tracking-wide mb-3 text-white">
            Условия использования
          </h1>
          <p className="text-white/75 text-sm max-w-xl mx-auto leading-relaxed font-light">
            Публичная оферта и регламент обслуживания клиентов онлайн-бутика SABYR.
          </p>
        </div>
      </section>

      <div className="container max-w-3xl pt-10 text-xs text-muted-foreground leading-relaxed space-y-6">
        <h2 className="text-sm font-bold text-foreground">1. Общие положения</h2>
        <p>
          Настоящий документ является официальным предложением (публичной офертой) интернет-магазина SABYR о заключении договора купли-продажи товаров дистанционным способом на территории Республики Казахстан.
        </p>

        <h2 className="text-sm font-bold text-foreground">2. Оформление заказа и цены</h2>
        <p>
          Все цены на сайте указаны в казахстанских тенге (₸) с учетом всех применимых налогов. Оформление заказа является подтверждением согласия Покупателя с условиями оферты, характеристиками и стоимостью выбранного товара.
        </p>

        <h2 className="text-sm font-bold text-foreground">3. Программа лояльности SABYR CLUB</h2>
        <p>
          Бонусные баллы, начисленные за покупки, не подлежат обналичиванию и могут быть использованы исключительно для оплаты до 30% стоимости последующих заказов в интернет-магазине или бутиках SABYR.
        </p>
      </div>
    </main>
  );
}
