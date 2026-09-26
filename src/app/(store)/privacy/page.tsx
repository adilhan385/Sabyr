import Link from "next/link";
import { ShieldCheck, ArrowLeft } from "lucide-react";

export default function PrivacyPage() {
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
            <ShieldCheck className="w-3.5 h-3.5" />
            Конфиденциальность
          </div>
          <h1 className="font-serif text-3xl md:text-5xl font-light tracking-wide mb-3 text-white">
            Политика конфиденциальности
          </h1>
          <p className="text-white/75 text-sm max-w-xl mx-auto leading-relaxed font-light">
            Защита персональных данных клиентов и биометрической информации Atelier SABYR.
          </p>
        </div>
      </section>

      <div className="container max-w-3xl pt-10 text-xs text-muted-foreground leading-relaxed space-y-6">
        <p>
          ТОО «SABYR FASHION GROUP» (далее — «SABYR») соблюдает законодательство Республики Казахстан о персональных данных и их защите. Настоящая Политика регламентирует порядок обработки и обеспечения безопасности личных сведений клиентов.
        </p>

        <h2 className="text-sm font-bold text-foreground">1. Сбор и использование данных</h2>
        <p>
          Мы собираем персональные данные (ФИО, телефон, адрес доставки, e-mail), предоставленные пользователем при оформлении заказа, регистрации в SABYR CLUB или согласии на получение уведомлений о новых дропах и акциях.
        </p>

        <h2 className="text-sm font-bold text-foreground">2. Биометрические данные и AI Виртуальная Примерка</h2>
        <p>
          Фотографии, загруженные пользователем для работы функции AI Виртуальной Примерки (Try-On), используются исключительно для разового генеративного моделирования силуэта. Фотографии не передаются третьим лицам и автоматически удаляются из временного кэша через 24 часа.
        </p>

        <h2 className="text-sm font-bold text-foreground">3. Платежная безопасность</h2>
        <p>
          Данные банковских карт обрабатываются платежными провайдерами (CloudPayments KZ, Kaspi) в защищенном шлюзе, соответствующем стандарту PCI DSS Level 1. SABYR не сохраняет номера и CVV/CVC коды банковских карт.
        </p>
      </div>
    </main>
  );
}
