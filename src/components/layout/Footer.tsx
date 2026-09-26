import Link from "next/link";
import { SabyrLogo, SabyrAvatar } from "@/components/ui/SabyrLogo";

const FOOTER_LINKS = {
  Магазин: [
    { href: "/catalog", label: "Каталог" },
    { href: "/catalog/new", label: "Новые поступления" },
    { href: "/catalog/sale", label: "Sale" },
    { href: "/ai-stylist", label: "AI Стилист" },
  ],
  Клиентам: [
    { href: "/delivery", label: "Доставка и оплата" },
    { href: "/returns", label: "Возврат и обмен" },
    { href: "/size-guide", label: "Таблица размеров" },
    { href: "/care", label: "Уход за одеждой" },
  ],
  "О бренде": [
    { href: "/about", label: "О SABYR" },
    { href: "/club", label: "SABYR CLUB" },
    { href: "/contacts", label: "Контакты и заказ" },
    { href: "/careers", label: "Работа у нас" },
  ],
};

export function Footer() {
  return (
    <footer className="bg-foreground text-background">
      <div className="container py-16 md:py-20">
        {/* Top section */}
        <div className="flex flex-col md:flex-row justify-between gap-12">
          {/* Brand */}
          <div className="flex-shrink-0">
            <Link href="/" className="inline-flex items-center gap-3 text-background hover:opacity-85 transition-opacity" aria-label="SABYR">
              <SabyrAvatar className="w-10 h-10 rounded-full border border-background/20 flex-shrink-0" />
              <SabyrLogo className="h-4 md:h-5 w-auto" />
            </Link>
            <p className="mt-3 text-background/80 text-sm max-w-xs leading-relaxed font-medium">
              Первое впечатление без слов.
            </p>
            <p className="mt-1 text-background/60 text-xs max-w-xs leading-relaxed">
              Современная повседневная одежда • г. Астана • Доставка по всему Казахстану.
            </p>
            {/* Social */}
            <div className="flex gap-3 mt-6">
              <a
                href="https://www.instagram.com/sabyr.wear/?utm_source=ig_web_button_share_sheet"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-3.5 h-9 border border-background/20 rounded-full hover:bg-background/10 transition-colors text-xs text-background/90"
                aria-label="Instagram @sabyr.wear"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
                <span>@sabyr.wear</span>
              </a>
            </div>
          </div>

          {/* Links */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-8 md:gap-12">
            {Object.entries(FOOTER_LINKS).map(([category, links]) => (
              <div key={category}>
                <h3 className="text-xs font-semibold tracking-widest uppercase text-background/40 mb-4">
                  {category}
                </h3>
                <ul className="flex flex-col gap-2.5">
                  {links.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className="text-sm text-background/70 hover:text-background transition-colors link-underline"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>


        {/* Bottom */}
        <div className="border-t border-background/10 mt-10 pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-background/40">
          <p>© 2026 SABYR (@sabyr.wear). Все права защищены.</p>
          <div className="flex flex-wrap justify-center gap-4 sm:gap-6">
            <Link href="/privacy" className="hover:text-background/60 transition-colors">
              Политика конфиденциальности
            </Link>
            <Link href="/terms" className="hover:text-background/60 transition-colors">
              Условия использования
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
