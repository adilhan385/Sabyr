"use client";

import Link from "next/link";
import { useState, useEffect, useSyncExternalStore } from "react";
import {
  ShoppingBag,
  Search,
  User,
  Heart,
  Menu,
  X,
  Sparkles,
  SlidersHorizontal,
  ChevronRight,
  Crown,
  Gift,
  Camera,
  Compass,
  Ruler,
  Truck,
  RotateCcw,
  Phone,
  Info,
  LogOut,
  LogIn,
} from "lucide-react";
import { useCartStore } from "@/store/cart";
import { useFavoritesStore } from "@/store/favorites";
import { useSabySession } from "@/hooks/useSabySession";
import { ThemeToggle } from "@/components/common/ThemeToggle";
import { SabyrLogo, SabyrAvatar } from "@/components/ui/SabyrLogo";

function emptySubscribe() {
  return () => {};
}

const NAV_LINKS = [
  { href: "/catalog", label: "Каталог", isSpecial: false },
  { href: "/club", label: "SABYR CLUB", isSpecial: false },
  { href: "/ai-stylist", label: "AI Стилист", isSpecial: true },
  { href: "/ai-tryon", label: "Примерочная", isSpecial: false },
  { href: "/gift-cards", label: "Сертификаты", isSpecial: false },
];

const DRAWER_MAIN_LINKS = [
  { href: "/", label: "Главная страница", icon: Compass },
  { href: "/catalog", label: "Весь каталог", icon: ShoppingBag },
  { href: "/catalog/new", label: "Новинки сезона", icon: Sparkles },
  { href: "/catalog/sale", label: "Sale & Архив", icon: Gift },
  { href: "/club", label: "Закрытый клуб SABYR CLUB", icon: Crown, accent: true },
  { href: "/ai-stylist", label: "AI-Стилист • Только в CLUB", icon: Sparkles, accent: true },
  { href: "/ai-tryon", label: "AI-Примерочная • Только в CLUB", icon: Camera, accent: true },
  { href: "/gift-cards", label: "Подарочные сертификаты", icon: Gift },
];

const DRAWER_CATEGORIES = [
  "Пиджаки и жакеты",
  "Пальто и тренчи",
  "Брюки и палаццо",
  "Платья",
  "Рубашки и блузы",
  "Трикотаж",
];

const DRAWER_SERVICE_LINKS = [
  { href: "/size-guide", label: "Таблица размеров", icon: Ruler },
  { href: "/delivery", label: "Доставка и оплата", icon: Truck },
  { href: "/returns", label: "Возврат и обмен", icon: RotateCcw },
  { href: "/about", label: "О бренде SABYR", icon: Info },
  { href: "/contacts", label: "Бутики и контакты", icon: Phone },
];

export function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  const cartStore = useCartStore();
  const favStore = useFavoritesStore();
  const { user, isGuest, logout } = useSabySession();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const cartCount = mounted ? cartStore.totalItems() : 0;
  const favoritesCount = mounted ? favStore.count() : 0;

  useEffect(() => {
    if (isDrawerOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isDrawerOpen]);

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-sticky transition-all duration-300 ${
          isScrolled
            ? "bg-background/95 backdrop-blur-md border-b border-border/80 shadow-xs"
            : "bg-background/90 backdrop-blur-md border-b border-border/40"
        }`}
      >
        <div className="w-full px-3 sm:px-5 lg:px-7">
          <div className="flex items-center justify-between h-16 md:h-20 gap-2">
            {/* Left Hamburger Menu Button (Pinned to far left edge) + Desktop Quick Links */}
            <div className="flex items-center gap-4 md:gap-6">
              <button
                type="button"
                onClick={() => setIsDrawerOpen(true)}
                className="inline-flex items-center gap-2 px-2.5 py-2 -ml-1 hover:bg-secondary/70 rounded-full transition-colors text-foreground"
                aria-label="Открыть боковое меню"
              >
                <Menu className="w-5 h-5 stroke-[1.7]" />
                <span className="hidden sm:inline text-xs uppercase tracking-[0.14em] font-semibold">
                  Меню
                </span>
              </button>

              <nav className="hidden xl:flex items-center gap-6">
                {NAV_LINKS.slice(0, 3).map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="text-xs uppercase tracking-[0.12em] font-medium text-foreground/80 hover:text-foreground transition-colors link-underline flex items-center gap-1.5"
                  >
                    {link.isSpecial && (
                      <Sparkles className="w-3 h-3 text-[hsl(var(--accent))]" />
                    )}
                    {link.label}
                  </Link>
                ))}
              </nav>
            </div>

            {/* Logo Center */}
            <Link
              href="/"
              className="inline-flex items-center gap-2.5 text-foreground hover:opacity-85 transition-opacity"
              aria-label="SABYR — На главную"
            >
              <SabyrAvatar className="w-8 h-8 md:w-9 md:h-9 rounded-full border border-border/40 shadow-xs flex-shrink-0" />
              <SabyrLogo className="h-3.5 sm:h-4 md:h-[18px] w-auto" />
            </Link>

            {/* Right Nav + Actions */}
            <div className="flex items-center gap-1.5 md:gap-3.5">
              <nav className="hidden xl:flex items-center gap-6 mr-2">
                {NAV_LINKS.slice(3).map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="text-xs uppercase tracking-[0.12em] font-medium text-foreground/80 hover:text-foreground transition-colors link-underline"
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>

              {/* Theme Toggle */}
              <ThemeToggle />

              {/* Search Toggle */}
              <button
                onClick={() => setIsSearchOpen(true)}
                className="w-9 h-9 flex items-center justify-center hover:bg-secondary/70 rounded-full transition-colors text-foreground"
                aria-label="Поиск"
              >
                <Search className="w-4 h-4 stroke-[1.5]" />
              </button>

              {/* Favorites */}
              <Link
                href="/account"
                className="relative w-9 h-9 flex items-center justify-center hover:bg-secondary/70 rounded-full transition-colors text-foreground"
                aria-label="Избранное"
              >
                <Heart className="w-4 h-4 stroke-[1.5]" />
                {favoritesCount > 0 && (
                  <span className="absolute top-0.5 right-0.5 min-w-[17px] h-[17px] px-1 bg-foreground text-background text-[9px] font-bold leading-none tabular-nums rounded-full flex items-center justify-center">
                    {favoritesCount > 9 ? "9+" : favoritesCount}
                  </span>
                )}
              </Link>

              {/* Cart */}
              <Link
                href="/cart"
                className="relative w-9 h-9 flex items-center justify-center hover:bg-secondary/70 rounded-full transition-colors text-foreground"
                aria-label="Корзина"
              >
                <ShoppingBag className="w-4 h-4 stroke-[1.5]" />
                {cartCount > 0 && (
                  <span className="absolute top-0.5 right-0.5 min-w-[17px] h-[17px] px-1 bg-foreground text-background text-[9px] font-bold leading-none tabular-nums rounded-full flex items-center justify-center">
                    {cartCount > 9 ? "9+" : cartCount}
                  </span>
                )}
              </Link>

              {/* Account / Login */}
              <Link
                href="/account"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 hover:bg-secondary/70 border border-border/60 rounded-full transition-colors text-foreground"
                aria-label="Личный кабинет"
              >
                <User className="w-4 h-4 stroke-[1.5]" />
                <span className="text-[11px] uppercase tracking-wider font-semibold">
                  {isGuest ? "Войти" : "Кабинет"}
                </span>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Left Slide-Out Sidebar Drawer (All-in-One User & Navigation Panel) */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-modal flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/55 backdrop-blur-xs transition-opacity"
            onClick={() => setIsDrawerOpen(false)}
          />

          {/* Left Drawer Panel */}
          <aside className="relative z-10 w-[86vw] max-w-sm bg-background border-r border-border h-full flex flex-col shadow-2xl overflow-hidden">
            {/* Drawer Header */}
            <div className="h-16 px-5 border-b border-border flex items-center justify-between gap-2 flex-shrink-0">
              <Link
                href="/"
                onClick={() => setIsDrawerOpen(false)}
                className="inline-flex items-center gap-2 text-foreground"
              >
                <SabyrAvatar className="w-7 h-7 rounded-full border border-border/40" />
                <SabyrLogo className="h-3.5 w-auto" />
              </Link>
              <button
                type="button"
                onClick={() => setIsDrawerOpen(false)}
                className="w-8 h-8 rounded-full hover:bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Закрыть меню"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-6">
              {/* 1. User Profile Card */}
              <div className="p-4 rounded-2xl border border-border bg-secondary/40 space-y-3">
                {mounted && !isGuest ? (
                  <>
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-full bg-foreground text-background flex items-center justify-center text-xs font-bold flex-shrink-0">
                          {user.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold truncate">{user.name}</p>
                          <p className="text-[11px] text-muted-foreground truncate">{user.phone}</p>
                        </div>
                      </div>
                      {user.clubMembership.isActive && (
                        <span className="px-2 py-0.5 rounded-full bg-black text-[hsl(var(--accent))] text-[9px] font-bold uppercase tracking-wider flex items-center gap-1 flex-shrink-0">
                          <Crown className="w-2.5 h-2.5" /> VIP
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
                      <div className="p-2.5 rounded-xl bg-background border border-border">
                        <span className="text-[10px] text-muted-foreground block">Бонусы</span>
                        <span className="font-bold tabular-nums">
                          {user.bonusBalance.toLocaleString()} ₸
                        </span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-background border border-border">
                        <span className="text-[10px] text-muted-foreground block">Статус</span>
                        <span className="font-semibold truncate block">{user.bonusLevel.name}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <Link
                        href="/account"
                        onClick={() => setIsDrawerOpen(false)}
                        className="flex-1 py-2 bg-foreground text-background text-[11px] font-semibold uppercase tracking-wider rounded-full text-center hover:opacity-90"
                      >
                        Личный кабинет
                      </Link>
                      <button
                        type="button"
                        onClick={() => {
                          logout();
                          setIsDrawerOpen(false);
                        }}
                        title="Выйти"
                        className="p-2 rounded-full border border-border hover:bg-background text-muted-foreground hover:text-foreground"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="space-y-2.5">
                    <div className="flex items-center gap-2 text-xs font-semibold">
                      <User className="w-4 h-4 text-[hsl(var(--accent))]" />
                      <span>Личный кабинет SABYR</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      Войдите по номеру телефона, чтобы копить бонусы до 10% и отслеживать заказы.
                    </p>
                    <Link
                      href="/account"
                      onClick={() => setIsDrawerOpen(false)}
                      className="w-full py-2.5 bg-foreground text-background text-[11px] font-semibold uppercase tracking-wider rounded-full flex items-center justify-center gap-1.5 hover:opacity-90"
                    >
                      <LogIn className="w-3.5 h-3.5" /> Войти / Регистрация
                    </Link>
                  </div>
                )}
              </div>

              {/* 2. Quick Counters (Cart & Favorites) */}
              <div className="grid grid-cols-2 gap-2.5 text-xs">
                <Link
                  href="/cart"
                  onClick={() => setIsDrawerOpen(false)}
                  className="p-3 rounded-xl border border-border hover:bg-secondary/60 flex items-center justify-between transition-colors"
                >
                  <span className="flex items-center gap-2 font-medium">
                    <ShoppingBag className="w-4 h-4" /> Корзина
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-secondary text-[10px] font-bold tabular-nums">
                    {cartCount}
                  </span>
                </Link>
                <Link
                  href="/account"
                  onClick={() => setIsDrawerOpen(false)}
                  className="p-3 rounded-xl border border-border hover:bg-secondary/60 flex items-center justify-between transition-colors"
                >
                  <span className="flex items-center gap-2 font-medium">
                    <Heart className="w-4 h-4" /> Избранное
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-secondary text-[10px] font-bold tabular-nums">
                    {favoritesCount}
                  </span>
                </Link>
              </div>

              {/* 3. Main Sections */}
              <div className="space-y-1">
                <p className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground font-semibold px-2 pb-1">
                  Навигация и сервисы
                </p>
                {DRAWER_MAIN_LINKS.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsDrawerOpen(false)}
                      className="flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl text-xs font-medium hover:bg-secondary transition-colors"
                    >
                      <span className="flex items-center gap-2.5 min-w-0">
                        <Icon
                          className={`w-4 h-4 flex-shrink-0 ${
                            item.accent ? "text-[hsl(var(--accent))]" : "text-muted-foreground"
                          }`}
                        />
                        <span className="truncate">{item.label}</span>
                      </span>
                      <ChevronRight className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                    </Link>
                  );
                })}
              </div>

              {/* 4. Catalog Categories */}
              <div className="space-y-1.5">
                <p className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground font-semibold px-2 pb-1">
                  Категории коллекции
                </p>
                <div className="grid grid-cols-2 gap-1.5">
                  {DRAWER_CATEGORIES.map((cat) => (
                    <Link
                      key={cat}
                      href={`/catalog?category=${encodeURIComponent(cat)}`}
                      onClick={() => setIsDrawerOpen(false)}
                      className="px-3 py-2 rounded-lg border border-border/60 hover:bg-secondary text-[11px] font-medium truncate transition-colors"
                    >
                      {cat}
                    </Link>
                  ))}
                </div>
              </div>

              {/* 5. Customer Care & Info */}
              <div className="space-y-1 pt-2 border-t border-border">
                <p className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground font-semibold px-2 pb-1">
                  Покупателям
                </p>
                {DRAWER_SERVICE_LINKS.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsDrawerOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                    >
                      <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
                <Link
                  href="/admin"
                  onClick={() => setIsDrawerOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>Панель управления (Admin)</span>
                </Link>
              </div>
            </div>

            {/* Drawer Footer */}
            <div className="p-4 border-t border-border flex items-center justify-between text-xs bg-secondary/20 flex-shrink-0">
              <span className="text-muted-foreground font-medium">Тема оформления</span>
              <ThemeToggle />
            </div>
          </aside>
        </div>
      )}

      {/* Search Overlay */}
      {isSearchOpen && (
        <div className="fixed inset-0 z-modal bg-background/98 backdrop-blur-lg flex flex-col">
          <div className="container">
            <div className="flex items-center h-16 md:h-20 gap-3 sm:gap-4 border-b border-border">
              <Search className="w-5 h-5 text-muted-foreground flex-shrink-0" />
              <input
                autoFocus
                type="search"
                placeholder="Поиск по коллекции SABYR (пиджак, шелк, платье, кашемир)..."
                className="flex-1 min-w-0 bg-transparent text-base md:text-lg outline-none placeholder:text-muted-foreground/70 text-foreground"
              />
              <button
                onClick={() => setIsSearchOpen(false)}
                className="w-9 h-9 flex-shrink-0 flex items-center justify-center hover:bg-secondary rounded-full transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="container mt-8 max-w-2xl">
            <p className="text-xs uppercase tracking-wider text-muted-foreground mb-3">
              Популярные запросы
            </p>
            <div className="flex flex-wrap gap-2">
              {[
                "Шерстяной жакет",
                "Брюки палаццо",
                "Шелковая блуза",
                "Кашемировое пальто",
                "SABYR CLUB",
                "Платье Column Noir",
              ].map((q) => (
                <Link
                  key={q}
                  href={`/catalog`}
                  onClick={() => setIsSearchOpen(false)}
                  className="px-4 py-2 border border-border rounded-full text-xs font-medium hover:bg-secondary transition-colors"
                >
                  {q}
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
