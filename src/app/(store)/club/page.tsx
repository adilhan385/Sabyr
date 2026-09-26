"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Crown, Sparkles, Check, Lock, ArrowRight, Star, Camera } from "lucide-react";
import { ProductItem } from "@/data/mockData";
import { formatPrice } from "@/lib/utils";
import { SabyrLogo } from "@/components/ui/SabyrLogo";
import { useSabySession } from "@/hooks/useSabySession";

export default function ClubPage() {
  const router = useRouter();
  const { user, isGuest, refreshSession } = useSabySession();
  const [selectedPlan, setSelectedPlan] = useState<"annual" | "monthly">("annual");
  const [isJoined, setIsJoined] = useState(false);
  const [joining, setJoining] = useState(false);
  const [products, setProducts] = useState<ProductItem[]>([]);

  // Dynamic settings controlled by Admin
  const [annualPrice, setAnnualPrice] = useState("99 000 ₸");
  const [monthlyPrice, setMonthlyPrice] = useState("12 000 ₸");
  const [welcomeDeposit, setWelcomeDeposit] = useState("25 000 ₸");
  const [cashbackPercent, setCashbackPercent] = useState("10");
  const [clubSubtitle, setClubSubtitle] = useState(
    "Закрытый клуб для тех, кто разделяет философию осознанной роскоши, безупречного кроя и эксклюзивного сервиса."
  );

  useEffect(() => {
    fetch("/api/products")
      .then((r) => r.json())
      .then((data) => {
        if (data.success && Array.isArray(data.products)) {
          setProducts(data.products);
        }
      })
      .catch((err) => console.error("Error fetching club products:", err));

    fetch("/api/admin/settings")
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.club) {
          if (data.club.annual_price) setAnnualPrice(data.club.annual_price);
          if (data.club.monthly_price) setMonthlyPrice(data.club.monthly_price);
          if (data.club.welcome_deposit) setWelcomeDeposit(data.club.welcome_deposit);
          if (data.club.cashback_percent) setCashbackPercent(data.club.cashback_percent);
          if (data.club.club_subtitle) setClubSubtitle(data.club.club_subtitle);
        }
      })
      .catch(() => {});
  }, []);

  const handleJoinClub = async () => {
    if (isGuest) {
      router.push("/account");
      return;
    }
    setJoining(true);
    try {
      const res = await fetch("/api/club/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: selectedPlan === "annual" ? "ANNUAL" : "MONTHLY" }),
      });
      const data = await res.json();
      if (data.success) {
        setIsJoined(true);
        await refreshSession();
      }
    } finally {
      setJoining(false);
    }
  };

  const clubActive = isJoined || user.clubMembership.isActive || user.role === "ADMIN";
  const clubProducts = products.filter((p) => p.isClubOnly);

  const clubBenefits = [
    {
      icon: Sparkles,
      title: "AI-Стилист и AI-Примерочная (Только в CLUB)",
      desc: "Эксклюзивный доступ к нейросетевому AI-Стилисту и виртуальной AI-Примерочной по вашей фотографии.",
    },
    {
      icon: Lock,
      title: "Закрытые изделия Members Only",
      desc: "Доступ к лимитированным позициям SABYR и закрытым дропам за 48 часов до официального релиза.",
    },
    {
      icon: Star,
      title: `Повышенный кешбэк ${cashbackPercent}% бонусами`,
      desc: `До ${cashbackPercent}% бонусов с каждой покупки вместо базовых 3% для оплаты следующих заказов.`,
    },
    {
      icon: Crown,
      title: "Приглашения на закрытые презентации",
      desc: "Закрытые показы в Астане, приоритетный резерв размеров и персональное сопровождение.",
    },
  ];

  return (
    <main className="min-h-screen pb-24">
      {/* Hero Banner */}
      <section className="relative overflow-hidden bg-sabyr-black text-white pt-20 pb-28">
        <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/90 to-sabyr-black z-dropdown" />
        <div
          className="absolute inset-0 bg-cover bg-center opacity-30"
          style={{
            backgroundImage: "url(/products/black-suit-1.jpg)",
          }}
        />

        <div className="container max-w-4xl relative z-sticky text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[hsl(var(--accent))]/40 bg-[hsl(var(--accent))]/10 text-[hsl(var(--accent))] text-xs font-semibold uppercase tracking-widest">
            <Crown className="w-4 h-4 flex-shrink-0" />
            Привилегированное сообщество
          </div>

          <h1 className="font-brand text-3xl sm:text-5xl md:text-6xl font-semibold tracking-wider text-white drop-shadow-sm flex flex-wrap items-center justify-center gap-4">
            <SabyrLogo className="h-7 sm:h-10 md:h-12 w-auto text-white" />
            <span>CLUB</span>
          </h1>

          <p className="text-white/80 text-base md:text-xl max-w-2xl mx-auto leading-relaxed font-light drop-shadow-sm">
            {clubSubtitle}
          </p>

          <div className="pt-4 flex flex-wrap justify-center gap-4">
            <a
              href="#membership"
              className="px-8 py-4 bg-[hsl(var(--accent))] text-black font-semibold rounded-full hover:opacity-90 transition-all text-sm shadow-xl flex items-center gap-2"
            >
              {clubActive ? "Ваш статус активен" : "Вступить в клуб"}
              <ArrowRight className="w-4 h-4 flex-shrink-0" />
            </a>
            <Link
              href="/ai-stylist"
              className="px-8 py-4 border border-white/20 text-white rounded-full hover:bg-white/10 transition-colors text-sm flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-[hsl(var(--accent))]" />
              Открыть AI-Стилист
            </Link>
          </div>
        </div>
      </section>

      {/* Privileges Grid */}
      <section className="py-20 border-b border-border bg-card">
        <div className="container max-w-5xl">
          <div className="text-center mb-16 space-y-2">
            <p className="text-xs uppercase tracking-widest text-[hsl(var(--accent))] font-bold">
              Привилегии резидентов
            </p>
            <h2 className="font-serif text-3xl md:text-4xl font-normal tracking-wide">
              Что даёт членство в <span className="font-brand tracking-[0.16em]">SABYR</span> CLUB
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {clubBenefits.map((b, i) => {
              const Icon = b.icon;
              return (
                <div
                  key={i}
                  className="p-8 rounded-2xl border border-border bg-secondary/20 hover:border-foreground/30 transition-all space-y-4"
                >
                  <div className="w-12 h-12 rounded-xl bg-foreground text-background flex items-center justify-center">
                    <Icon className="w-6 h-6 text-[hsl(var(--accent))]" />
                  </div>
                  <h3 className="text-lg font-bold">{b.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{b.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Exclusive Products Section */}
      <section id="exclusive" className="py-20">
        <div className="container max-w-5xl">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-[hsl(var(--accent))] font-bold mb-1">
                <Lock className="w-3.5 h-3.5 flex-shrink-0" /> Members Only
              </div>
              <h2 className="text-3xl font-bold tracking-tight">Закрытая коллекция</h2>
            </div>
            <p className="text-xs text-muted-foreground max-w-sm">
              Эти изделия создаются ограниченным тиражом в ателье SABYR и доступны только членам клуба.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {clubProducts.length > 0 ? (
              clubProducts.map((p) => (
                <div key={p.id} className="group border border-border rounded-2xl overflow-hidden bg-card">
                  <div className="relative aspect-[3/4] bg-secondary">
                    <Image
                      src={p.images[0] || "/products/black-suit-1.jpg"}
                      alt={p.name}
                      fill
                      sizes="(max-width: 768px) 100vw, 33vw"
                      className="object-cover"
                    />
                    <div className="absolute top-3 left-3 px-2.5 py-1 bg-black/80 text-[hsl(var(--accent))] text-[10px] font-bold tracking-widest uppercase rounded flex items-center gap-1.5 backdrop-blur-md">
                      <Crown className="w-3 h-3 flex-shrink-0" /> CLUB ONLY
                    </div>
                  </div>
                  <div className="p-5 space-y-2">
                    <h3 className="font-semibold text-sm line-clamp-2 min-h-[2.5rem] leading-snug">{p.name}</h3>
                    <p className="text-xs text-muted-foreground line-clamp-2">{p.description}</p>
                    <div className="flex items-center justify-between gap-2 pt-2">
                      <span className="font-bold text-sm tabular-nums whitespace-nowrap">{formatPrice(p.price)}</span>
                      <Link
                        href={`/product/${p.slug}`}
                        className="text-xs font-semibold link-underline flex-shrink-0"
                      >
                        Подробнее
                      </Link>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-3 text-center py-12 text-sm text-muted-foreground border border-dashed border-border rounded-2xl">
                Закрытые дропы обновляются каждый сезон.
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Pricing & Join */}
      <section id="membership" className="py-20 bg-secondary/40 border-t border-border">
        <div className="container max-w-3xl text-center space-y-10">
          <div>
            <h2 className="text-3xl font-bold tracking-tight mb-2">Выберите формат участия</h2>
            <p className="text-sm text-muted-foreground">
              Станьте резидентом клуба уже сегодня и откройте доступ к AI-Стилисту, AI-Примерочной и закрытым дропам
            </p>
          </div>

          <div className="flex justify-center">
            <div className="bg-card border border-border p-1 rounded-full flex flex-wrap justify-center gap-1">
              <button
                onClick={() => setSelectedPlan("annual")}
                className={`px-4 sm:px-6 py-2 rounded-full text-xs font-semibold transition-all ${
                  selectedPlan === "annual" ? "bg-foreground text-background" : "text-muted-foreground"
                }`}
              >
                Годовая карта (Выгодно)
              </button>
              <button
                onClick={() => setSelectedPlan("monthly")}
                className={`px-4 sm:px-6 py-2 rounded-full text-xs font-semibold transition-all ${
                  selectedPlan === "monthly" ? "bg-foreground text-background" : "text-muted-foreground"
                }`}
              >
                Месячная подписка
              </button>
            </div>
          </div>

          <div className="border-2 border-[hsl(var(--accent))] rounded-3xl p-6 sm:p-8 md:p-10 bg-card shadow-2xl relative">
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 bg-[hsl(var(--accent))] text-black font-bold text-[10px] tracking-widest uppercase rounded-full whitespace-nowrap">
              Рекомендуемый выбор
            </div>

            <div className="space-y-6">
              <div>
                <span className="text-4xl md:text-5xl font-bold tabular-nums whitespace-nowrap">
                  {selectedPlan === "annual" ? annualPrice : monthlyPrice}
                </span>
                <span className="text-muted-foreground text-sm ml-2">
                  {selectedPlan === "annual" ? "/ год" : "/ месяц"}
                </span>
              </div>

              <div className="space-y-3 max-w-md mx-auto text-left text-sm">
                {[
                  `Безлимитный доступ к AI-Стилисту и AI-Примерочной по фото`,
                  `Включен приветственный сертификат на ${welcomeDeposit}`,
                  `${cashbackPercent}% бонусный кешбэк на любые покупки`,
                  "Ранний доступ ко всем новым капсулам и изделиям CLUB ONLY",
                  "Приоритетный резерв размеров и бесплатная доставка",
                ].map((text, idx) => (
                  <div key={idx} className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-[hsl(var(--accent))] flex-shrink-0" />
                    <span>{text}</span>
                  </div>
                ))}
              </div>

              <div className="pt-4 space-y-3">
                {clubActive ? (
                  <div className="space-y-4">
                    <div className="p-4 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 rounded-2xl text-sm font-semibold flex items-center justify-center gap-2">
                      <Check className="w-4 h-4 text-green-600" />
                      Ваше членство в SABYR CLUB активно. Все AI-сервисы разблокированы.
                    </div>
                    <div className="flex flex-wrap justify-center gap-3">
                      <Link
                        href="/ai-stylist"
                        className="px-6 py-3 rounded-full bg-foreground text-background text-xs font-semibold uppercase tracking-wider inline-flex items-center gap-2 hover:opacity-90"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-[hsl(var(--accent))]" />
                        Открыть AI-Стилист
                      </Link>
                      <Link
                        href="/ai-tryon"
                        className="px-6 py-3 rounded-full border border-border text-foreground text-xs font-semibold uppercase tracking-wider inline-flex items-center gap-2 hover:bg-secondary"
                      >
                        <Camera className="w-3.5 h-3.5 text-[hsl(var(--accent))]" />
                        AI-Примерочная
                      </Link>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={handleJoinClub}
                    disabled={joining}
                    className="w-full h-14 bg-foreground text-background font-semibold rounded-full hover:opacity-90 transition-opacity text-sm shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {joining
                      ? "Активация..."
                      : isGuest
                      ? "Войти и оформить членство в SABYR CLUB"
                      : "Оформить членство в SABYR CLUB"}
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
