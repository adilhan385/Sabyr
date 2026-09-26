"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Sparkles,
  Camera,
  Upload,
  Check,
  RefreshCw,
  ShoppingBag,
  Eye,
  Layers,
  X,
  Crown,
  Lock,
} from "lucide-react";
import { PRODUCTS, ProductItem } from "@/data/mockData";
import { formatPrice } from "@/lib/utils";
import { useCartStore } from "@/store/cart";
import { useSabySession } from "@/hooks/useSabySession";

interface FitAnalysis {
  fitScore: number;
  verdict: string;
  shoulders: string;
  drape: string;
  fabricFeel: string;
  recommendation: string;
  stylingAdvice?: string;
}

export default function AiTryonPage() {
  const [mode, setMode] = useState<"single" | "outfit">("single");
  const [customPhoto, setCustomPhoto] = useState<string | null>(null);
  const [photoBase64, setPhotoBase64] = useState<string | null>(null);
  const [photoDragOver, setPhotoDragOver] = useState(false);

  // Dynamic products from catalog database (including admin created products)
  const [products, setProducts] = useState<ProductItem[]>(PRODUCTS);
  const [selectedProductId, setSelectedProductId] = useState<string>(PRODUCTS[0]?.id || "");
  const [selectedCategory, setSelectedCategory] = useState<string>("Все");
  const [userSize, setUserSize] = useState<string | null>(null);

  const [isProcessing, setIsProcessing] = useState(false);
  const [tryOnReady, setTryOnReady] = useState(false);
  const [fitAnalysis, setFitAnalysis] = useState<FitAnalysis | null>(null);
  const [addedNotice, setAddedNotice] = useState(false);

  const [aiClubOnly, setAiClubOnly] = useState(true);
  const [clubAnnualPrice, setClubAnnualPrice] = useState("99 000 ₸");
  const [clubMonthlyPrice, setClubMonthlyPrice] = useState("12 000 ₸");

  const { addItem, openCart } = useCartStore();
  const { user, isLoading, isGuest } = useSabySession();
  const hasClubAccess = Boolean(!aiClubOnly || user.clubMembership?.isActive || user.role === "ADMIN");

  useEffect(() => {
    fetch("/api/products")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.products) && data.products.length > 0) {
          setProducts(data.products);
          setSelectedProductId((prev) => prev || data.products[0].id);
        }
      })
      .catch(() => {});

    fetch("/api/admin/settings")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.club) {
          if (data.club.ai_club_only === "false") setAiClubOnly(false);
          if (data.club.annual_price) setClubAnnualPrice(data.club.annual_price);
          if (data.club.monthly_price) setClubMonthlyPrice(data.club.monthly_price);
        }
      })
      .catch(() => {});
  }, []);

  const activeProduct = products.find((p) => p.id === selectedProductId) || products[0];
  const selectedSize = userSize ?? (activeProduct?.variants?.[0]?.size || "S");
  const selectedColor = activeProduct?.variants?.[0]?.color || "";

  const categories = ["Все", ...Array.from(new Set(products.map((p) => p.category).filter(Boolean)))];

  const filteredProducts = selectedCategory === "Все"
    ? products
    : products.filter((p) => p.category === selectedCategory);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setCustomPhoto(url);
      setTryOnReady(false);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoBase64(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setPhotoDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) {
      const url = URL.createObjectURL(file);
      setCustomPhoto(url);
      setTryOnReady(false);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoBase64(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSimulateTryOn = async () => {
    if (!activeProduct) return;
    setIsProcessing(true);
    try {
      const res = await fetch("/api/ai/tryon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: activeProduct.id,
          size: selectedSize,
          userPhotoBase64: photoBase64,
          mode,
        }),
      });
      const data = await res.json();
      if (data.success && data.fitAnalysis) {
        setFitAnalysis(data.fitAnalysis);
        setTryOnReady(true);
      }
    } catch (err) {
      console.error("Error executing try-on:", err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAddToCart = () => {
    if (!activeProduct) return;
    const variant = activeProduct.variants?.find((v) => v.size === selectedSize) || activeProduct.variants?.[0] || { id: "default", color: "Стандарт", size: "S" };
    addItem({
      id: activeProduct.id,
      productId: activeProduct.id,
      variantId: variant.id,
      name: activeProduct.name,
      price: activeProduct.price,
      image: activeProduct.images[0],
      color: selectedColor || variant.color,
      size: selectedSize || variant.size,
      quantity: 1,
      slug: activeProduct.slug,
    });
    setAddedNotice(true);
    setTimeout(() => {
      setAddedNotice(false);
      openCart();
    }, 600);
  };

  if (isLoading) {
    return (
      <main className="min-h-screen pb-24 bg-[#0A0A0A] text-white flex items-center justify-center px-4 pt-20">
        <div className="text-center space-y-3">
          <Crown className="w-8 h-8 text-[#C9A84C] mx-auto animate-pulse" />
          <p className="text-xs uppercase tracking-[0.2em] text-white/60">
            Проверка членства SABYR CLUB...
          </p>
        </div>
      </main>
    );
  }

  if (!hasClubAccess) {
    return (
      <main className="min-h-screen pb-24 bg-[#0A0A0A] text-white flex items-center justify-center px-4 pt-20">
        <div className="max-w-xl w-full rounded-3xl border border-[#C9A84C]/30 bg-gradient-to-b from-[#141414] to-[#0A0A0A] p-8 md:p-12 text-center space-y-6 shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-[#C9A84C]/15 border border-[#C9A84C]/40 flex items-center justify-center mx-auto">
            <Crown className="w-8 h-8 text-[#C9A84C]" />
          </div>
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/5 border border-[#C9A84C]/30 text-[#C9A84C] text-[11px] font-semibold uppercase tracking-[0.18em]">
            <Lock className="w-3 h-3" />
            Только в закрытом клубе SABYR CLUB
          </div>
          <h1 className="font-serif text-3xl md:text-4xl font-light tracking-wide text-white">
            AI Виртуальная Примерочная по фото
          </h1>
          <p className="text-white/70 text-sm md:text-base leading-relaxed font-light">
            Виртуальная примерка изделий на вашу фотографию и AI-анализ посадки доступны исключительно резидентам закрытого клуба <strong className="text-[#C9A84C] font-semibold">SABYR CLUB</strong>.
          </p>
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-xs text-white/80 space-y-1">
            <p className="font-semibold text-[#C9A84C] uppercase tracking-wider">Тарифы членства SABYR CLUB</p>
            <p>Месячная подписка: <strong className="text-white">{clubMonthlyPrice}</strong> · Годовая карта: <strong className="text-white">{clubAnnualPrice}</strong></p>
          </div>
          <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/club"
              className="px-7 py-3.5 rounded-full bg-[#C9A84C] text-black text-xs font-bold uppercase tracking-[0.14em] hover:opacity-90 transition-opacity"
            >
              Вступить в SABYR CLUB
            </Link>
            {isGuest && (
              <Link
                href="/account"
                className="px-7 py-3.5 rounded-full border border-white/20 text-white text-xs font-semibold uppercase tracking-[0.14em] hover:bg-white/10 transition-colors"
              >
                Войти в аккаунт
              </Link>
            )}
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen pb-24 bg-background">
      {/* Header Banner */}
      <section className="bg-sabyr-black text-white pt-12 pb-14 border-b border-white/10">
        <div className="container max-w-4xl text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-[hsl(var(--accent))] text-xs font-semibold uppercase tracking-wider mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            AI Виртуальная Примерка <span className="font-brand tracking-[0.15em]">SABYR</span>
          </div>
          <h1 className="font-serif text-3xl md:text-5xl lg:text-6xl font-light tracking-wide mb-3 text-white">
            Примерьте коллекцию на себе
          </h1>
          <p className="text-white/75 text-sm md:text-base max-w-2xl mx-auto leading-relaxed font-light">
            Загрузите вашу фотографию и выберите любое изделие из актуального каталога.
            Нейросеть смоделирует посадку, драпировку ткани и пропорции с точностью до 98%.
          </p>
        </div>
      </section>

      <div className="container max-w-6xl pt-8">
        {/* Mode switcher */}
        <div className="flex justify-center mb-8">
          <div className="bg-secondary p-1 rounded-full flex gap-1 border border-border">
            <button
              onClick={() => setMode("single")}
              className={`px-5 py-2 rounded-full text-xs font-medium transition-colors flex items-center gap-1.5 ${
                mode === "single" ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              Примерка вещи
            </button>
            <button
              onClick={() => setMode("outfit")}
              className={`px-5 py-2 rounded-full text-xs font-medium transition-colors flex items-center gap-1.5 ${
                mode === "outfit" ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              Капсульный образ
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: User Photo & Catalog Picker */}
          <div className="lg:col-span-5 space-y-6">
            {/* Step 1: User Photo */}
            <div className="border border-border rounded-2xl p-5 bg-card space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-sm">1. Ваша фотография</h3>
                  <p className="text-xs text-muted-foreground">Загрузите снимок в полный рост или по пояс</p>
                </div>
                {customPhoto && (
                  <button
                    onClick={() => {
                      setCustomPhoto(null);
                      setTryOnReady(false);
                    }}
                    className="text-xs text-muted-foreground hover:text-red-500 transition-colors flex items-center gap-1"
                  >
                    <X className="w-3.5 h-3.5" />
                    Удалить
                  </button>
                )}
              </div>

              {customPhoto ? (
                <div className="space-y-3">
                  <div className="relative aspect-[3/4] rounded-xl overflow-hidden border border-border bg-secondary/30">
                    <Image src={customPhoto} alt="Ваше фото" fill className="object-cover" />
                  </div>
                  <label className="block w-full py-2.5 text-xs text-center border border-border rounded-xl hover:bg-secondary transition-colors cursor-pointer font-medium">
                    Заменить фотографию
                    <input type="file" accept="image/*" className="hidden" onChange={handleUpload} />
                  </label>
                </div>
              ) : (
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setPhotoDragOver(true);
                  }}
                  onDragLeave={() => setPhotoDragOver(false)}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center transition-colors cursor-pointer bg-secondary/20 ${
                    photoDragOver ? "border-foreground bg-secondary/50" : "border-border hover:border-foreground/40"
                  }`}
                >
                  <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center mb-3">
                    <Upload className="w-5 h-5 text-foreground stroke-[1.5]" />
                  </div>
                  <p className="text-sm font-semibold mb-1">Перетащите сюда фото или выберите файл</p>
                  <p className="text-xs text-muted-foreground mb-4 max-w-xs">
                    Для точного моделирования рекомендуем фото при нейтральном освещении и в прилегающей одежде
                  </p>
                  <label className="cursor-pointer px-5 py-2 rounded-full bg-foreground text-background text-xs font-medium hover:opacity-90 transition-opacity">
                    Загрузить снимок
                    <input type="file" accept="image/*" className="hidden" onChange={handleUpload} />
                  </label>
                </div>
              )}
            </div>

            {/* Step 2: Live Garment Selector from Database */}
            <div className="border border-border rounded-2xl p-5 bg-card space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm">2. Изделие из каталога SABYR</h3>
                <span className="text-xs text-muted-foreground">{filteredProducts.length} доступно</span>
              </div>

              {/* Category Filter Chips */}
              <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1 rounded-full text-[11px] font-medium transition-colors whitespace-nowrap ${
                      selectedCategory === cat
                        ? "bg-foreground text-background"
                        : "bg-secondary text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Garments List */}
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {filteredProducts.map((prod) => {
                  const isSelected = selectedProductId === prod.id;
                  return (
                    <button
                      key={prod.id}
                      onClick={() => {
                        setSelectedProductId(prod.id);
                        setTryOnReady(false);
                      }}
                      className={`w-full p-2.5 rounded-xl border flex items-center gap-3 text-left transition-all ${
                        isSelected
                          ? "border-foreground bg-secondary/50 shadow-sm"
                          : "border-border hover:bg-secondary/30 bg-card"
                      }`}
                    >
                      <div className="relative w-12 h-14 rounded-lg overflow-hidden bg-secondary flex-shrink-0 border border-border">
                        <Image
                          src={prod.images?.[0] || "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=600&q=80"}
                          alt={prod.name}
                          fill
                          sizes="48px"
                          className="object-cover"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <h4 className="text-xs font-medium truncate">{prod.name}</h4>
                          {isSelected && <Check className="w-3.5 h-3.5 text-foreground shrink-0" />}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">{prod.category}</p>
                        <p className="text-xs font-semibold mt-1">{formatPrice(prod.price)}</p>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Selected Garment Options: Size & Color */}
              {activeProduct && (
                <div className="pt-2 border-t border-border space-y-3">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground block mb-1.5">
                      Размер для примерки:
                    </label>
                    <div className="flex gap-2">
                      {["XS", "S", "M", "L", "XL"].map((s) => (
                        <button
                          key={s}
                          onClick={() => setUserSize(s)}
                          className={`w-9 h-8 rounded-lg text-xs font-medium border transition-colors ${
                            selectedSize === s
                              ? "bg-foreground text-background border-foreground"
                              : "border-border hover:border-foreground/50"
                          }`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Interactive Try-On Canvas & Fit Analysis */}
          <div className="lg:col-span-7 space-y-6">
            <div className="border border-border rounded-2xl p-6 bg-card">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <div className="min-w-0">
                  <h3 className="font-bold text-base">Интерактивная проекция силуэта</h3>
                  <p className="text-xs text-muted-foreground">
                    Нейросетевая симуляция драпировки и посадки на вашей фигуре
                  </p>
                </div>

                <button
                  onClick={handleSimulateTryOn}
                  disabled={!customPhoto || isProcessing}
                  className="px-5 py-2.5 bg-foreground text-background text-xs font-medium rounded-full hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 transition-all shadow-sm flex-shrink-0"
                >
                  {isProcessing ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin flex-shrink-0" />
                      Моделирование...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5 text-[hsl(var(--accent))] flex-shrink-0" />
                      {tryOnReady ? "Обновить примерку" : "Выполнить примерку"}
                    </>
                  )}
                </button>
              </div>

              {/* Main Canvas */}
              <div className="relative aspect-[3/4] md:aspect-[4/5] rounded-xl overflow-hidden bg-secondary/30 border border-border flex items-center justify-center">
                {customPhoto ? (
                  <>
                    <Image
                      src={customPhoto}
                      alt="User photo"
                      fill
                      sizes="(max-width: 1024px) 100vw, 55vw"
                      className="object-cover brightness-95"
                    />

                    {/* Try-On Result Overlay */}
                    {tryOnReady && activeProduct && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5 }}
                        className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent flex flex-col justify-between p-3 sm:p-6"
                      >
                        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/80 text-white backdrop-blur-md text-xs self-start border border-white/10">
                          <Check className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                          <span>Симуляция завершена: совпадение кроя {fitAnalysis?.fitScore || 98}%</span>
                        </div>

                        {/* Fit Card */}
                        <div className="bg-background/95 backdrop-blur-md p-3.5 sm:p-5 rounded-2xl border border-border max-w-md shadow-2xl text-foreground">
                          <div className="flex items-start justify-between gap-3 mb-2">
                            <div className="min-w-0 flex-1">
                              <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold block">
                                Анализ посадки SABYR AI
                              </span>
                              <h4 className="font-bold text-sm text-foreground mt-0.5 line-clamp-2">{activeProduct.name}</h4>
                            </div>
                            <span className="text-sm font-bold text-foreground flex-shrink-0 whitespace-nowrap tabular-nums">
                              {formatPrice(activeProduct.price)}
                            </span>
                          </div>

                          <p className="text-xs text-muted-foreground leading-relaxed mb-3">
                            {fitAnalysis?.recommendation || `Размер ${selectedSize} идеально ложится по плечевой линии. Длина рукава и драпировка спинки соответствуют премиальному крою изделия.`}
                          </p>

                          <div className="grid grid-cols-3 gap-2 py-2 border-y border-border mb-3 text-center">
                            <div className="min-w-0">
                              <span className="text-[10px] text-muted-foreground block">Посадка</span>
                              <span className="text-xs font-semibold text-emerald-600 block truncate">
                                {fitAnalysis?.verdict || "Идеальная"}
                              </span>
                            </div>
                            <div className="min-w-0">
                              <span className="text-[10px] text-muted-foreground block">Размер</span>
                              <span className="text-xs font-semibold block truncate">{selectedSize} (В размер)</span>
                            </div>
                            <div className="min-w-0">
                              <span className="text-[10px] text-muted-foreground block">Фактура</span>
                              <span className="text-xs font-semibold block truncate px-1">
                                {fitAnalysis?.fabricFeel || "Плотная"}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={handleAddToCart}
                              className="flex-1 min-w-0 py-2.5 px-3 bg-foreground text-background text-xs font-medium rounded-full hover:opacity-90 flex items-center justify-center gap-1.5 transition-all"
                            >
                              <ShoppingBag className="w-3.5 h-3.5 flex-shrink-0" />
                              <span className="truncate">{addedNotice ? "Добавлено в корзину!" : `Купить размер ${selectedSize}`}</span>
                            </button>
                            <Link
                              href={`/product/${activeProduct.slug}`}
                              className="px-4 py-2.5 border border-border text-xs rounded-full hover:bg-secondary transition-colors flex-shrink-0 whitespace-nowrap"
                            >
                              О товаре
                            </Link>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {/* Processing spinner */}
                    {isProcessing && (
                      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center text-white gap-3 p-6 text-center">
                        <div className="w-10 h-10 rounded-full border-2 border-white/20 border-t-white animate-spin" />
                        <p className="text-sm font-medium">Анализ геометрии силуэта...</p>
                        <p className="text-xs text-white/60">Моделирование распределения складок и пропорций изделия</p>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center p-8 text-center max-w-sm">
                    <div className="w-14 h-14 rounded-full bg-secondary/80 flex items-center justify-center mb-3 text-muted-foreground">
                      <Camera className="w-6 h-6 stroke-[1.5]" />
                    </div>
                    <h4 className="font-semibold text-sm mb-1">Здесь появится ваша примерка</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed mb-4">
                      Загрузите снимок слева в блоке «Ваша фотография», выберите понравившуюся вещь и нажмите «Выполнить примерку».
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
