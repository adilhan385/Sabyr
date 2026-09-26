"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles, Crown, Truck, RotateCcw, ShieldCheck } from "lucide-react";
import { useState, useEffect } from "react";
import { formatPrice } from "@/lib/utils";
import { ProductItem } from "@/data/mockData";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { SabyrLogo, SabyrAvatar } from "@/components/ui/SabyrLogo";

// Initial placeholder product while dynamic API loads
const INITIAL_FEATURED = [
  {
    id: "example-1",
    name: "Пример",
    price: 50000,
    comparePrice: 65000,
    image: "/example-product.svg",
    slug: "example-item",
    isNew: true,
    color: "Пример изделия",
  },
];

const CATEGORIES = [
  { name: "Верхняя одежда", slug: "outerwear", image: "https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=800&q=85" },
  { name: "Пиджаки", slug: "blazers", image: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=800&q=85" },
  { name: "Брюки", slug: "pants", image: "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=800&q=85" },
  { name: "Платья", slug: "dresses", image: "https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=800&q=85" },
  { name: "Рубашки", slug: "shirts", image: "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=800&q=85" },
];

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, ease: [0.25, 0.1, 0.25, 1] },
};

const stagger = {
  animate: {
    transition: {
      staggerChildren: 0.08,
    },
  },
};

export default function HomePage() {
  const [featuredProducts, setFeaturedProducts] = useState(INITIAL_FEATURED);

  useEffect(() => {
    fetch("/api/products")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.products) && data.products.length > 0) {
          const mapped = data.products.slice(0, 4).map((p: ProductItem) => ({
            id: p.id,
            name: p.name,
            price: p.price,
            comparePrice: p.comparePrice,
            image: p.images?.[0] || "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=1000&q=85",
            slug: p.slug,
            isNew: p.isNew ?? false,
            color: p.variants?.[0]?.color || "Базовый оттенок",
          }));
          setFeaturedProducts(mapped);
        }
      })
      .catch((err) => console.error("Error loading products for homepage:", err));
  }, []);

  return (
    <>
      <Header />
      <main className="min-h-screen bg-background text-foreground">
        {/* ==================== HERO SECTION ==================== */}
        <section className="relative min-h-[92vh] md:min-h-screen flex items-center justify-start pt-32 pb-20 md:pt-40 md:pb-28 overflow-hidden">
          {/* LCP Optimized Background Image with Next/Image */}
          <div className="absolute inset-0 bg-[#0A0A0A]">
            <Image
              src="https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=2000&q=85"
              alt="SABYR New Collection Editorial"
              fill
              priority
              quality={90}
              sizes="100vw"
              className="object-cover object-center opacity-65 select-none"
            />
            {/* Architectural Fashion Vignette & Gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/50 to-black/65" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/45 to-transparent" />
          </div>

          {/* Hero Content */}
          <div className="relative container max-w-7xl px-6 md:px-12 py-12 md:py-16">
            <motion.div
              initial={{ opacity: 0, y: 25 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1], delay: 0.1 }}
              className="max-w-2xl"
            >
              <div className="inline-flex items-center gap-3 pr-4 pl-1.5 py-1.5 rounded-full bg-white/10 border border-white/15 backdrop-blur-md mb-7">
                <SabyrAvatar className="w-8 h-8 rounded-full border border-white/20 shadow-md flex-shrink-0" />
                <span className="w-1.5 h-1.5 rounded-full bg-[#C9A84C] flex-shrink-0" />
                <p className="text-white/90 text-[11px] md:text-xs tracking-[0.25em] uppercase font-medium">
                  Atelier Collection 2026
                </p>
              </div>

              <div className="mb-5">
                <SabyrLogo className="h-9 sm:h-12 md:h-16 lg:h-20 w-auto text-white drop-shadow-md" />
              </div>

              <h1 className="font-brand text-white text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-semibold uppercase tracking-[0.06em] leading-[1.2] drop-shadow-sm mb-6">
                Архитектура силуэта.
              </h1>

              <p className="text-white/85 text-base md:text-lg max-w-lg mb-10 leading-relaxed font-light drop-shadow-xs">
                Безупречный крой, премиальные натуральные ткани и интеллектуальный минимализм казахстанского модного дома.
              </p>

              <div className="flex flex-wrap items-center gap-4">
                <Link
                  href="/catalog"
                  className="inline-flex items-center gap-2.5 px-8 py-4 bg-white text-black text-xs uppercase tracking-[0.14em] font-semibold rounded-full hover:bg-[#E8E2D9] transition-all shadow-xl"
                >
                  Смотреть коллекцию
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
                <Link
                  href="/ai-stylist"
                  className="inline-flex items-center gap-2 px-7 py-4 border border-white/30 text-white text-xs uppercase tracking-[0.14em] font-semibold rounded-full hover:bg-white/10 transition-all backdrop-blur-sm"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#C9A84C]" />
                  AI Стилист
                </Link>
              </div>
            </motion.div>
          </div>

          {/* Minimalist Scroll Accent */}
          <div className="absolute bottom-10 right-10 hidden md:flex items-center gap-3 select-none pointer-events-none text-white/40">
            <span className="text-[10px] tracking-[0.3em] uppercase font-mono">SCROLL</span>
            <div className="w-12 h-px bg-white/30" />
          </div>
        </section>

        {/* ==================== CATEGORIES SECTION ==================== */}
        <section className="py-24 md:py-32">
          <div className="container max-w-7xl px-6 md:px-12">
            <motion.div
              initial="initial"
              whileInView="animate"
              viewport={{ once: true, margin: "-60px" }}
              variants={stagger}
            >
              <div className="flex items-end justify-between mb-12">
                <div>
                  <p className="text-muted-foreground text-[11px] tracking-[0.25em] uppercase font-medium mb-2">
                    Навигация по каталогу
                  </p>
                  <h2 className="font-serif text-3xl md:text-5xl font-light tracking-[-0.01em]">
                    Категории
                  </h2>
                </div>
                <Link
                  href="/catalog"
                  className="hidden md:inline-flex items-center gap-2 text-xs uppercase tracking-[0.15em] text-muted-foreground hover:text-foreground transition-colors link-underline font-medium"
                >
                  Все категории
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {/* Responsive Category Grid: 2 col mobile, 5 col desktop */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3.5 md:gap-5">
                {CATEGORIES.map((cat) => (
                  <motion.div key={cat.slug} variants={fadeInUp}>
                    <Link
                      href={`/catalog?category=${encodeURIComponent(cat.name)}`}
                      className="group block"
                    >
                      <div className="relative aspect-[3/4] overflow-hidden rounded-xl bg-secondary mb-3 shadow-xs">
                        <Image
                          src={cat.image}
                          alt={cat.name}
                          fill
                          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                          className="object-cover product-image-hover"
                        />
                        <div className="absolute inset-0 bg-black/15 group-hover:bg-black/25 transition-colors duration-500" />
                      </div>
                      <p className="text-xs md:text-sm font-medium tracking-wide text-foreground/90 group-hover:text-foreground transition-colors text-center">
                        {cat.name}
                      </p>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* ==================== CURATED NEW ARRIVALS ==================== */}
        <section className="py-24 md:py-32 bg-secondary/25 border-y border-border/60">
          <div className="container max-w-7xl px-6 md:px-12">
            <motion.div
              initial="initial"
              whileInView="animate"
              viewport={{ once: true, margin: "-60px" }}
              variants={stagger}
            >
              <div className="flex items-end justify-between mb-12">
                <div>
                  <p className="text-muted-foreground text-[11px] tracking-[0.25em] uppercase font-medium mb-2">
                    Избранные изделия
                  </p>
                  <h2 className="font-serif text-3xl md:text-5xl font-light tracking-[-0.01em]">
                    Новые поступления
                  </h2>
                </div>
                <Link
                  href="/catalog?filter=new"
                  className="hidden md:inline-flex items-center gap-2 text-xs uppercase tracking-[0.15em] text-muted-foreground hover:text-foreground transition-colors link-underline font-medium"
                >
                  Смотреть новинки
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {/* Luxury Grid: Strictly 2 columns on mobile, 4 columns on desktop */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
                {featuredProducts.map((product) => (
                  <motion.div key={product.id} variants={fadeInUp}>
                    <EditorialProductCard product={product} />
                  </motion.div>
                ))}
              </div>

              <div className="mt-10 text-center md:hidden">
                <Link
                  href="/catalog?filter=new"
                  className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.15em] font-medium link-underline"
                >
                  Смотреть все новинки
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </motion.div>
          </div>
        </section>

        {/* ==================== AI STYLIST EDITORIAL BANNER ==================== */}
        <section className="py-24 md:py-32">
          <div className="container max-w-7xl px-6 md:px-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5 }}
            >
              <Link href="/ai-stylist" className="block group">
                <div className="relative overflow-hidden rounded-2xl md:rounded-3xl bg-[#0C0C0C] text-white min-h-[460px] md:min-h-[500px] flex items-center border border-white/10 shadow-2xl">
                  {/* Background Editorial Image */}
                  <div className="absolute inset-0">
                    <Image
                      src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1600&q=85"
                      alt="SABYR AI Stylist Studio"
                      fill
                      sizes="(max-width: 1024px) 100vw, 1200px"
                      className="object-cover object-center opacity-30 group-hover:scale-[1.02] transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-[#0C0C0C] via-[#0C0C0C]/85 to-transparent" />
                    <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-[#C9A84C]/10 blur-3xl pointer-events-none" />
                  </div>

                  {/* Content */}
                  <div className="relative p-8 sm:p-12 md:p-16 max-w-xl">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/15 backdrop-blur-md mb-6">
                      <Sparkles className="w-3.5 h-3.5 text-[#C9A84C]" />
                      <span className="text-white/90 text-[11px] tracking-[0.2em] uppercase font-medium">
                        Personal AI Capsule
                      </span>
                    </div>

                    <h2 className="font-serif text-white text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-light tracking-[-0.01em] mb-4 leading-[1.15]">
                      Персональный
                      <br />
                      AI Стилист
                    </h2>

                    <p className="text-white/75 text-sm md:text-base mb-8 leading-relaxed font-light">
                      Опишите повод или загрузите свой силуэт. Нейросеть составит сбалансированную капсулу исключительно из изделий текущей коллекции SABYR.
                    </p>

                    <div className="inline-flex items-center gap-2.5 px-8 py-4 bg-white text-black text-xs font-semibold uppercase tracking-[0.14em] rounded-full group-hover:bg-[#C9A84C] transition-all shadow-lg">
                      Подобрать образ
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>

                  {/* Right Side Monogram */}
                  <div className="hidden lg:block absolute right-16 top-1/2 -translate-y-1/2 text-white/5 font-brand text-[160px] font-bold select-none pointer-events-none">
                    AI
                  </div>
                </div>
              </Link>
            </motion.div>
          </div>
        </section>

        {/* ==================== SABYR CLUB EXCLUSIVE ==================== */}
        <section className="pb-24 md:pb-32">
          <div className="container max-w-7xl px-6 md:px-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5 }}
            >
              <Link href="/club" className="block group">
                <div className="relative overflow-hidden rounded-2xl md:rounded-3xl bg-gradient-to-br from-[#14120E] via-[#1C1811] to-[#0A0A0A] text-white border border-[#C9A84C]/35 min-h-[340px] flex items-center shadow-2xl">
                  {/* Subtle Gold Aura */}
                  <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-[#C9A84C]/10 blur-3xl pointer-events-none" />

                  <div className="relative p-8 sm:p-12 md:p-16 flex flex-col md:flex-row items-start md:items-center justify-between gap-8 w-full">
                    <div className="max-w-2xl">
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#C9A84C]/15 border border-[#C9A84C]/30 mb-4">
                        <Crown className="w-3.5 h-3.5 text-[#C9A84C]" />
                        <span className="text-[#C9A84C] text-[11px] font-semibold tracking-[0.2em] uppercase">
                          Закрытый клуб привилегий
                        </span>
                      </div>

                      <h2 className="font-brand text-white text-2xl sm:text-3xl md:text-4xl font-semibold tracking-[0.08em] mb-4 leading-tight flex flex-wrap items-center gap-3">
                        <SabyrLogo className="h-5 sm:h-6 md:h-7 w-auto text-[#C9A84C]" />
                        <span>CLUB</span>
                      </h2>

                      <p className="text-white/75 text-sm md:text-base leading-relaxed font-light">
                        Ранний доступ к закрытым дропам, индивидуальный пошив, выездной консьерж-сервис и приглашения на закрытые показы.
                      </p>
                    </div>

                    <div className="flex-shrink-0">
                      <div className="inline-flex items-center gap-2.5 px-8 py-4 bg-[#C9A84C] text-black text-xs font-semibold uppercase tracking-[0.14em] rounded-full group-hover:bg-[#dfbe63] transition-all shadow-lg">
                        Вступить в клуб
                        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          </div>
        </section>

        {/* ==================== ATELIER VALUES & SERVICES ==================== */}
        <section className="py-20 md:py-28 border-t border-border/80 bg-secondary/15">
          <div className="container max-w-6xl px-6 md:px-12">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8 text-center">
              {[
                {
                  icon: Truck,
                  title: "Персональная доставка",
                  desc: "Бесплатная курьерская доставка по Алматы и Казахстану с возможностью предварительной примерки.",
                },
                {
                  icon: RotateCcw,
                  title: "14 дней на примерку",
                  desc: "Комфортный возврат или обмен в бутике либо через курьерскую службу дома.",
                },
                {
                  icon: ShieldCheck,
                  title: "Стандарты Atelier SABYR",
                  desc: "Европейские ткани высшей категории, премиальная фурнитура и контроль ручной сборки каждого шва.",
                },
              ].map((item, idx) => {
                const Icon = item.icon;
                return (
                  <div key={idx} className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 rounded-full border border-border/80 bg-card flex items-center justify-center text-foreground shadow-xs">
                      <Icon className="w-5 h-5 stroke-[1.4]" />
                    </div>
                    <h3 className="font-semibold text-sm tracking-tight">{item.title}</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed max-w-xs">{item.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

// ==================== EDITORIAL PRODUCT CARD ====================

interface EditorialProductCardProps {
  product: {
    id: string;
    name: string;
    price: number;
    comparePrice: number | null;
    image: string;
    slug: string;
    isNew: boolean;
    color: string;
  };
}

function EditorialProductCard({ product }: EditorialProductCardProps) {
  return (
    <Link href={`/product/${product.slug}`} className="group block">
      {/* Editorial 3:4 Aspect Image */}
      <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-secondary mb-3.5">
        <Image
          src={product.image || "/example-product.svg"}
          alt={product.name}
          fill
          unoptimized={
            (product.image || "").startsWith("data:") ||
            (product.image || "").endsWith(".svg")
          }
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className="object-cover product-image-hover"
        />

        <div className="absolute top-3 left-3 z-dropdown flex flex-col gap-1.5 max-w-[calc(100%-48px)]">
          {product.comparePrice && product.comparePrice > product.price && (
            <span className="block truncate w-fit px-2 py-0.5 bg-red-600 text-white text-[9px] font-bold tracking-[0.12em] uppercase rounded-sm shadow-xs">
              -{Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100)}%
            </span>
          )}
          {product.isNew && (
            <span className="block truncate w-fit px-2.5 py-1 bg-background/90 text-foreground backdrop-blur-md text-[9px] font-semibold tracking-[0.2em] uppercase rounded-sm border border-border/60 shadow-xs">
              NEW
            </span>
          )}
        </div>
      </div>

      {/* Product Details */}
      <div className="space-y-1 min-w-0">
        <p className="text-[11px] text-muted-foreground uppercase tracking-[0.1em] font-medium truncate">
          {product.color}
        </p>
        <h3 className="text-xs md:text-sm font-medium tracking-normal text-foreground group-hover:underline underline-offset-4 decoration-1 transition-all line-clamp-2 min-h-[2.5rem] leading-snug">
          {product.name}
        </h3>
        <div className="flex flex-wrap items-baseline gap-1.5 min-w-0 pt-0.5">
          <span className="text-xs md:text-sm font-semibold tracking-tight text-foreground tabular-nums whitespace-nowrap">
            {formatPrice(product.price)}
          </span>
          {product.comparePrice && product.comparePrice > product.price && (
            <span className="text-[11px] text-muted-foreground line-through tabular-nums whitespace-nowrap">
              {formatPrice(product.comparePrice)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
