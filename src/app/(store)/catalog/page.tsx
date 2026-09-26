"use client";

import { useState, useEffect, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { X, ChevronDown, Heart, SlidersHorizontal, Crown } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { useFavoritesStore } from "@/store/favorites";
import { ProductItem, PRODUCTS as INITIAL_PRODUCTS } from "@/data/mockData";

const SIZES = ["S", "M", "L", "XL", "2XL", "3XL"];
const SORT_OPTIONS = [
  { value: "newest", label: "Сначала новые" },
  { value: "price_asc", label: "По возрастанию цены" },
  { value: "price_desc", label: "По убыванию цены" },
  { value: "bestsellers", label: "Бестселлеры" },
];

function CatalogContent() {
  const searchParams = useSearchParams();
  const urlCategory = searchParams.get("category");
  const filterParam = searchParams.get("filter");

  const [products, setProducts] = useState<ProductItem[]>(INITIAL_PRODUCTS);
  const [apiCategories, setApiCategories] = useState<string[]>([
    "Костюмы и комплекты",
    "Рубашки и поло",
    "Футболки и лонгсливы",
    "Брюки и джоггеры",
    "Худи и свитшоты",
    "Верхняя одежда и куртки",
    "Аксессуары",
  ]);
  const [userCategory, setUserCategory] = useState<string | null>(null);
  const activeCategory = userCategory ?? (urlCategory || "Все");
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState("newest");
  const [showFilters, setShowFilters] = useState(false);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 100000]);

  const { toggleFavorite, isFavorite } = useFavoritesStore();

  useEffect(() => {
    fetch("/api/products")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.products) && data.products.length > 0) {
          setProducts(data.products);
        }
      })
      .catch(() => {});

    fetch("/api/categories")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.categories) && data.categories.length > 0) {
          setApiCategories(data.categories.map((c: { name: string }) => c.name).filter(Boolean));
        }
      })
      .catch(() => {});
  }, []);

  const categories = [
    "Все",
    ...Array.from(
      new Set([
        ...apiCategories,
        ...products.map((p) => p.category).filter(Boolean),
      ])
    ),
  ];

  const availableColors = Array.from(
    new Map(
      products
        .flatMap((p) => p.variants || [])
        .map((v) => [v.color, { color: v.color, colorHex: v.colorHex || "#0D0D0D" }])
    ).values()
  );

  const filtered = products
    .filter((p) => {
      if (filterParam === "new" && !p.isNew) return false;
      if (filterParam === "sale" && (!p.comparePrice || p.comparePrice <= p.price)) return false;
      if (activeCategory !== "Все" && p.category !== activeCategory) return false;
      if (selectedSizes.length > 0) {
        const hasSize = p.variants?.some(
          (v) => selectedSizes.includes(v.size) && v.stock > 0
        );
        if (!hasSize) return false;
      }
      if (selectedColors.length > 0) {
        const hasColor = p.variants?.some(
          (v) => selectedColors.includes(v.color) && v.stock > 0
        );
        if (!hasColor) return false;
      }
      if (p.price < priceRange[0] || p.price > priceRange[1]) return false;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === "price_asc") return a.price - b.price;
      if (sortBy === "price_desc") return b.price - a.price;
      if (sortBy === "bestsellers") return (b.isBestSeller ? 1 : 0) - (a.isBestSeller ? 1 : 0);
      return (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0);
    });

  const toggleSize = (size: string) => {
    setSelectedSizes((prev) =>
      prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size]
    );
  };

  const toggleColor = (color: string) => {
    setSelectedColors((prev) =>
      prev.includes(color) ? prev.filter((c) => c !== color) : [...prev, color]
    );
  };

  const activeFilterCount = selectedSizes.length + selectedColors.length;

  return (
    <main className="min-h-screen pb-32 bg-background text-foreground">
      {/* Editorial Header */}
      <div className="container max-w-7xl pt-12 md:pt-16 pb-10 border-b border-border/60">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-[#C9A84C]" />
            <p className="text-[11px] uppercase tracking-[0.25em] text-muted-foreground font-medium">
              SABYR • ПЕРВОЕ ВПЕЧАТЛЕНИЕ БЕЗ СЛОВ
            </p>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-light tracking-[-0.02em] leading-tight mb-3">
            {filterParam === "new"
              ? "Новые поступления"
              : filterParam === "sale"
              ? "Архивные модели"
              : activeCategory !== "Все"
              ? activeCategory
              : "Каталог коллекции"}
          </h1>
          <p className="text-xs md:text-sm text-muted-foreground font-light leading-relaxed">
            Современная повседневная одежда • г. Астана • Доставка по всему Казахстану ({filtered.length} изделий).
          </p>
        </div>
      </div>

      <div className="container max-w-7xl pt-8">
        {/* Categories Bar */}
        <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-none -mx-6 px-6 md:mx-0 md:px-0 mb-8">
          {categories.map((cat) => {
            const isActive = activeCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setUserCategory(cat)}
                className={`flex-shrink-0 px-5 py-2.5 rounded-full text-xs uppercase tracking-[0.12em] transition-all font-medium ${
                  isActive
                    ? "bg-foreground text-background shadow-xs font-semibold"
                    : "bg-secondary/70 text-muted-foreground hover:text-foreground hover:bg-secondary"
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* Toolbar (Filters & Sort) */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-8 pb-4 border-b border-border/40">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`inline-flex items-center gap-2 px-4 py-2 border rounded-full text-xs uppercase tracking-[0.1em] font-medium transition-colors ${
              showFilters || activeFilterCount > 0
                ? "border-foreground bg-foreground text-background"
                : "border-border hover:border-foreground/50 text-foreground"
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5 flex-shrink-0" />
            <span>Фильтры</span>
            {activeFilterCount > 0 && (
              <span className="min-w-[17px] h-[17px] px-1 bg-background text-foreground text-[9px] leading-none tabular-nums rounded-full flex items-center justify-center font-bold">
                {activeFilterCount}
              </span>
            )}
          </button>

          <div className="relative min-w-0">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="appearance-none pl-4 pr-9 py-2 border border-border rounded-full text-xs uppercase tracking-[0.1em] font-medium bg-background text-foreground focus:outline-none cursor-pointer hover:border-foreground/60 transition-colors max-w-full truncate"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
          </div>
        </div>

        {/* Filters Drawer Panel */}
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="border border-border/80 rounded-2xl p-6 mb-10 bg-card/60 backdrop-blur-sm grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 shadow-xs"
          >
            {/* Size Filter */}
            <div>
              <h3 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground mb-3">
                Размер в наличии
              </h3>
              <div className="flex flex-wrap gap-2">
                {SIZES.map((size) => {
                  const isSelected = selectedSizes.includes(size);
                  return (
                    <button
                      key={size}
                      onClick={() => toggleSize(size)}
                      className={`w-10 h-9 text-xs font-semibold uppercase tracking-wider border rounded-lg transition-all ${
                        isSelected
                          ? "bg-foreground text-background border-foreground shadow-xs"
                          : "border-border hover:border-foreground/50 text-foreground bg-background"
                      }`}
                    >
                      {size}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Color Filter */}
            <div>
              <h3 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground mb-3">
                Оттенок
              </h3>
              <div className="flex flex-wrap gap-2">
                {availableColors.map((item) => {
                  const isSelected = selectedColors.includes(item.color);
                  return (
                    <button
                      key={item.color}
                      onClick={() => toggleColor(item.color)}
                      className={`inline-flex items-center gap-2 px-2.5 py-1.5 rounded-full text-[11px] border transition-all ${
                        isSelected
                          ? "border-foreground bg-foreground text-background font-semibold"
                          : "border-border hover:border-foreground/50 bg-background text-foreground"
                      }`}
                    >
                      <span
                        className="w-3 h-3 rounded-full border border-border/80 flex-shrink-0"
                        style={{ backgroundColor: item.colorHex }}
                      />
                      <span className="truncate max-w-[110px]">{item.color}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Price Filter */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Стоимость
                </h3>
                <span className="text-xs font-semibold text-foreground tabular-nums">
                  до {formatPrice(priceRange[1])}
                </span>
              </div>
              <input
                type="range"
                min={10000}
                max={100000}
                step={2000}
                value={priceRange[1]}
                onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])}
                className="w-full accent-foreground cursor-pointer"
              />
              <div className="flex justify-between text-[11px] text-muted-foreground font-mono mt-1.5">
                <span>{formatPrice(10000)}</span>
                <span>{formatPrice(100000)}</span>
              </div>
            </div>

            {/* Reset Controls */}
            <div className="flex items-end lg:justify-end">
              <button
                onClick={() => {
                  setSelectedSizes([]);
                  setSelectedColors([]);
                  setPriceRange([0, 100000]);
                  setUserCategory("Все");
                }}
                className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.12em] text-muted-foreground hover:text-foreground transition-colors py-2.5 px-4 border border-border rounded-full hover:bg-secondary font-medium"
              >
                <X className="w-3.5 h-3.5" />
                Сбросить фильтры
              </button>
            </div>
          </motion.div>
        )}

        {/* Empty State */}
        {filtered.length === 0 ? (
          <div className="py-24 text-center max-w-md mx-auto border border-dashed border-border rounded-2xl p-10">
            <h3 className="text-base font-medium mb-2">Изделия не найдены</h3>
            <p className="text-xs text-muted-foreground mb-6 leading-relaxed">
              Попробуйте изменить параметры фильтра или выберите другую категорию.
            </p>
            <button
              onClick={() => {
                setUserCategory("Все");
                setSelectedSizes([]);
                setSelectedColors([]);
                setPriceRange([0, 100000]);
              }}
              className="px-6 py-3 bg-foreground text-background text-xs uppercase tracking-[0.12em] font-semibold rounded-full hover:opacity-90 transition-opacity"
            >
              Сбросить все параметры
            </button>
          </div>
        ) : (
          /* Luxury Grid: Strictly 2 columns mobile, 4 columns desktop */
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
            {filtered.map((product) => {
              const uniqueColors = Array.from(
                new Map(product.variants?.map((v) => [v.color, v]) || []).values()
              );

              return (
                <div key={product.id} className="group">
                  {/* Card Image 3:4 Aspect Ratio */}
                  <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-secondary mb-3.5 border border-border/30">
                    <Link href={`/product/${product.slug}`} className="relative block w-full h-full">
                      <Image
                        src={
                          product.images?.[0] ||
                          "/example-product.svg"
                        }
                        alt={product.name}
                        fill
                        unoptimized={
                          (product.images?.[0] || "").startsWith("data:") ||
                          (product.images?.[0] || "").endsWith(".svg")
                        }
                        className="object-cover product-image-hover"
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                      />
                    </Link>

                    {/* Quiet Luxury Badges */}
                    <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-dropdown pointer-events-none max-w-[calc(100%-48px)]">
                      {product.comparePrice && product.comparePrice > product.price && (
                        <span className="px-2 py-0.5 bg-red-600 text-white text-[9px] font-bold tracking-[0.12em] uppercase rounded-sm shadow-xs truncate w-fit">
                          -{Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100)}%
                        </span>
                      )}
                      {product.isClubOnly && (
                        <span className="px-2.5 py-1 bg-black/90 text-[#C9A84C] text-[9px] font-semibold tracking-[0.2em] uppercase rounded-sm border border-[#C9A84C]/40 flex items-center gap-1 backdrop-blur-md shadow-xs truncate">
                          <Crown className="w-2.5 h-2.5 flex-shrink-0" />
                          <span className="truncate">CLUB</span>
                        </span>
                      )}
                      {product.isNew && (
                        <span className="px-2.5 py-1 bg-background/90 text-foreground text-[9px] font-semibold tracking-[0.2em] uppercase rounded-sm border border-border/60 backdrop-blur-md shadow-xs truncate">
                          NEW
                        </span>
                      )}
                    </div>

                    {/* Wishlist Button */}
                    <button
                      onClick={() => toggleFavorite(product.id)}
                      className={`absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full transition-all z-dropdown ${
                        isFavorite(product.id)
                          ? "bg-foreground text-background opacity-100 shadow-sm"
                          : "bg-background/80 backdrop-blur-md text-foreground opacity-0 group-hover:opacity-100 hover:bg-background"
                      }`}
                      aria-label="В избранное"
                    >
                      <Heart
                        className={`w-3.5 h-3.5 ${
                          isFavorite(product.id) ? "fill-current text-background" : "text-foreground"
                        }`}
                      />
                    </button>

                    {/* Color Swatches on Hover */}
                    {uniqueColors.length > 1 && (
                      <div className="absolute bottom-3 left-3 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity z-dropdown bg-background/85 backdrop-blur-md px-2 py-1 rounded-full border border-border/60">
                        {uniqueColors.slice(0, 4).map((variant, ci) => (
                          <div
                            key={ci}
                            className="w-2.5 h-2.5 rounded-full border border-border/80"
                            style={{ backgroundColor: variant.colorHex || "#0A0A0A" }}
                            title={variant.color}
                          />
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Product Typography & Info */}
                  <div className="space-y-1 min-w-0">
                    <p className="text-[11px] text-muted-foreground uppercase tracking-[0.1em] font-medium truncate">
                      {product.category}
                    </p>
                    <Link href={`/product/${product.slug}`} className="block">
                      <h3 className="text-xs md:text-sm font-medium tracking-normal text-foreground group-hover:underline underline-offset-4 decoration-1 transition-all line-clamp-2 min-h-[2.5rem] leading-snug">
                        {product.name}
                      </h3>
                    </Link>
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
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}

export default function CatalogPage() {
  return (
    <Suspense
      fallback={
        <div className="container max-w-7xl py-32 text-center text-xs text-muted-foreground uppercase tracking-widest font-mono">
          Загрузка каталога SABYR...
        </div>
      }
    >
      <CatalogContent />
    </Suspense>
  );
}
