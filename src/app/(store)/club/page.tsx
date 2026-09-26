"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Crown, Sparkles, Check, Lock, ArrowRight, Star } from "lucide-react";
import { ProductItem } from "@/data/mockData";
import { formatPrice } from "@/lib/utils";
import { SabyrLogo } from "@/components/ui/SabyrLogo";
import { useSabySession } from "@/hooks/useSabySession";

const CLUB_BENEFITS = [
  {
    icon: Sparkles,
    title: "AI-Стилист и AI-Подбор (Эксклюзив)",
    desc: "Закрытый доступ к нейросетевому AI-Стилисту и виртуальной AI-Примерочной по вашему фото.",
  },
  {
    icon: Lock,
    title: "Закрытые изделия Members Only",
    desc: "Доступ к уникальным позициям ручной работы и дропам за 48 часов до релиза.",
  },
  {
    icon: Star,
    title: "Повышенный кешбэк бонусами",
    desc: "До 10% бонусов с каждой покупки вместо базовых 3%.",
  },
  {
    icon: Crown,
    title: "Приглашения на закрытые вечера",
    desc: "Камерные показы в Алматы и Астане, закрытые дегустации и встречи с дизайнерами.",
  },
];

export default function ClubPage() {
  const { user, refreshSession } = useSabySession();
  const [selectedPlan, setSelectedPlan] = useState<"annual" | "monthly">("annual");
  const [isJoined, setIsJoined] = useState(false);
  const [joining, setJoining] = useState(false);
  const [products, setProducts] = useState<ProductItem[]>([]);

  useEffect(() => {
    fetch("/api/products")
      .then((r) => r.json())
      .then((data) => {
        if (data.success && Array.isArray(data.products)) {
          setProducts(data.products);
        }
      })
      .catch((err) => console.error("Error fetching club products:", err));
  }, []);

  const handleJoinClub = async () => {
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

  const clubActive = isJoined || user.clubMembership.isActive;
  const clubProducts = products.filter((p) => p.isClubOnly);

  return (
    <main className="min-h-screen pb-24">
      {/* Hero Banner */}
      <section className="relative overflow-hidden bg-sabyr-black text-white pt-20 pb-28">
        <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/90 to-sabyr-black z-dropdown" />
        <div
          className="absolute inset-0 bg-cover bg-center opacity-30"
          style={{
            backgroundImage:
              "url(https://images.unsplash.com/photo-1509631179647-0177331693ae?w=1600&q=80)",
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
            Закрытый клуб для тех, кто разделяет философию осознанной роскоши, безупречного кроя и эксклюзивного сервиса.
          </p>

          <div className="pt-4 flex flex-wrap justify-center gap-4">
            <a
              href="#membership"
              className="px-8 py-4 bg-[hsl(var(--accent))] text-black font-semibold rounded-full hover:opacity-90 transition-all text-sm shadow-xl flex items-center gap-2"
            >
              Вступить в клуб
              <ArrowRight className="w-4 h-4 flex-shrink-0" />
            </a>
            <a
              href="#exclusive"
              className="px-8 py-4 border border-white/20 text-white rounded-full hover:bg-white/10 transition-colors text-sm"
            >
              Смотреть закрытые дропы
            </a>
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
            {CLUB_BENEFITS.map((b, i) => {
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
                    <Image src={p.images[0]} alt={p.name} fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover" />
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
                        Подробнее →
                      </Link>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-3 text-center py-12 text-sm text-muted-foreground">
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
              Станьте резидентом клуба уже сегодня и откройте все привилегии моментально
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
                Годовая карта (Выгодно -25%)
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
                  {selectedPlan === "annual" ? "99 000 ₸" : "12 000 ₸"}
                </span>
                <span className="text-muted-foreground text-sm ml-2">
                  {selectedPlan === "annual" ? "/ год" : "/ месяц"}
                </span>
              </div>

              <div className="space-y-3 max-w-md mx-auto text-left text-sm">
                {[
                  "Включен приветственный сертификат на 25 000 ₸",
                  "10% бонусный кешбэк на любые покупки",
                  "Ранний доступ ко всем новым капсулам",
                  "Персональный консьерж и резерв нужных размеров",
                  "Бесплатная курьерская доставка без ограничений по чеку",
                ].map((text, idx) => (
                  <div key={idx} className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-[hsl(var(--accent))] flex-shrink-0" />
                    <span>{text}</span>
                  </div>
                ))}
              </div>

              <div className="pt-4">
                {clubActive ? (
                  <div className="p-4 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 rounded-2xl text-sm font-semibold flex items-center justify-center gap-2">
                    <Check className="w-4 h-4 text-green-600" />
                    Поздравляем! Ваше членство в SABYR CLUB активировано.
                  </div>
                ) : (
                  <button
                    onClick={handleJoinClub}
                    disabled={joining}
                    className="w-full h-14 bg-foreground text-background font-semibold rounded-full hover:opacity-90 transition-opacity text-sm shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {joining ? "Активация..." : "Оформить членство в SABYR CLUB"}
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
