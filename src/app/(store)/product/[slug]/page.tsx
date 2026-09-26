"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Heart,
  ShoppingBag,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Plus,
  Minus,
  Ruler,
  Check,
  Sparkles,
  Truck,
  RotateCcw,
  ShieldCheck,
  Crown,
  Bell,
  X
} from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { useCartStore } from "@/store/cart";
import { useFavoritesStore } from "@/store/favorites";
import { ProductItem, PRODUCTS as INITIAL_PRODUCTS } from "@/data/mockData";

const SIZE_GUIDE = [
  { size: "S", ru: "46", bust: "90-94", waist: "76-80", hips: "94-98" },
  { size: "M", ru: "48", bust: "95-98", waist: "81-84", hips: "99-102" },
  { size: "L", ru: "50", bust: "99-102", waist: "85-88", hips: "103-106" },
  { size: "XL", ru: "52", bust: "103-106", waist: "89-92", hips: "107-110" },
  { size: "2XL", ru: "54", bust: "107-110", waist: "93-96", hips: "111-114" },
  { size: "3XL", ru: "56", bust: "111-115", waist: "97-102", hips: "115-119" },
];

export default function ProductPage() {
  const params = useParams();
  const slug = params?.slug as string;

  const [products, setProducts] = useState<ProductItem[]>(INITIAL_PRODUCTS);
  const [activeImage, setActiveImage] = useState(0);
  const [userColor, setUserColor] = useState<string | null>(null);
  const [userSize, setUserSize] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [showSizeGuide, setShowSizeGuide] = useState(false);
  const [showWaitlistModal, setShowWaitlistModal] = useState(false);
  const [waitlistContact, setWaitlistContact] = useState("");
  const [waitlistStatus, setWaitlistStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [waitlistMessage, setWaitlistMessage] = useState("");
  const [addedToCart, setAddedToCart] = useState(false);

  const { addItem, openCart } = useCartStore();
  const { toggleFavorite, isFavorite } = useFavoritesStore();

  useEffect(() => {
    fetch("/api/products")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.products) && data.products.length > 0) {
          setProducts(data.products);
        }
      })
      .catch((err) => console.error("Error loading product db:", err));
  }, []);

  const product = products.find((p) => p.slug === slug) || products.find((p) => p.id === slug) || products[0];

  const defaultColor = product?.variants?.[0]?.color || "";
  const selectedColor = userColor ?? defaultColor;

  const defaultSize = product?.variants?.find((v) => v.stock > 0)?.size || product?.variants?.[0]?.size || "S";
  const selectedSize = userSize ?? defaultSize;

  const colors = Array.from(new Set(product.variants?.map((v) => v.color) || []));

  const availableSizes = (product.variants || [])
    .filter((v) => !selectedColor || v.color === selectedColor)
    .map((v) => ({
      size: v.size,
      inStock: v.stock > 0,
      stock: v.stock,
      variantId: v.id,
      colorHex: v.colorHex
    }));

  const selectedVariant = product.variants?.find(
    (v) => (colors.length === 0 || v.color === selectedColor) && v.size === selectedSize
  ) || product.variants?.[0];


  const similarProducts = products
    .filter((p) => p.id !== product.id && (p.category === product.category || p.styleTags?.some((t) => product.styleTags?.includes(t))))
    .slice(0, 4);

  const handleAddToCart = useCallback(() => {
    if (!selectedSize || !selectedVariant) return;

    addItem({
      id: product.id,
      productId: product.id,
      variantId: selectedVariant.id,
      name: product.name,
      price: product.price,
      image: product.images[0] || "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=600&q=80",
      color: selectedColor || selectedVariant.color,
      size: selectedSize,
      quantity,
      slug: product.slug,
    });

    setAddedToCart(true);
    setTimeout(() => {
      setAddedToCart(false);
      openCart();
    }, 600);
  }, [selectedSize, selectedVariant, selectedColor, quantity, product, addItem, openCart]);

  const handleWaitlistSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!waitlistContact) return;
    setWaitlistStatus("loading");
    try {
      const isEmail = waitlistContact.includes("@");
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product.id,
          variantId: selectedVariant?.id,
          phone: isEmail ? null : waitlistContact,
          email: isEmail ? waitlistContact : null,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setWaitlistStatus("success");
        setWaitlistMessage(data.message || "Мы уведомим вас о поступлении изделия!");
      } else {
        setWaitlistStatus("error");
        setWaitlistMessage(data.error || "Ошибка регистрации запроса");
      }
    } catch {
      setWaitlistStatus("error");
      setWaitlistMessage("Не удалось отправить запрос. Попробуйте позже.");
    }
  };

  return (
    <main className="min-h-screen pb-24">
      {/* Breadcrumb */}
      <div className="container py-4 border-b border-border/40">
        <div className="flex items-center gap-2 text-xs text-muted-foreground min-w-0">
          <Link href="/catalog" className="hover:text-foreground transition-colors flex items-center gap-1 flex-shrink-0">
            <ArrowLeft className="w-3 h-3 flex-shrink-0" />
            <span>Каталог</span>
          </Link>
          <span className="flex-shrink-0">/</span>
          <span className="truncate max-w-[120px] sm:max-w-none">{product.category}</span>
          <span className="flex-shrink-0">/</span>
          <span className="text-foreground truncate min-w-0 flex-1 max-w-xs">{product.name}</span>
        </div>
      </div>

      <div className="container pt-8 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* ==================== GALLERY (7 cols) ==================== */}
          <div className="lg:col-span-7 space-y-4">
            <div className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-secondary border border-border/60">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeImage}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="absolute inset-0"
                >
                  <Image
                    src={product.images[activeImage] || "/example-product.svg"}
                    alt={product.name}
                    fill
                    unoptimized={
                      (product.images[activeImage] || "").startsWith("data:") ||
                      (product.images[activeImage] || "").endsWith(".svg")
                    }
                    sizes="(max-width: 1024px) 100vw, 58vw"
                    className="object-cover"
                    priority
                  />
                </motion.div>
              </AnimatePresence>

              {/* Badges */}
              <div className="absolute top-4 left-4 flex flex-col gap-2 z-dropdown max-w-[calc(100%-64px)]">
                {product.isClubOnly && (
                  <span className="px-3 py-1 bg-black/90 text-[#C9A84C] text-[10px] font-semibold tracking-[0.2em] uppercase rounded-sm border border-[#C9A84C]/40 flex items-center gap-1.5 backdrop-blur-md shadow-xs truncate">
                    <Crown className="w-3 h-3 flex-shrink-0" />
                    <span className="truncate">Members Only</span>
                  </span>
                )}
                {product.isNew && (
                  <span className="px-3 py-1 bg-background/90 text-foreground text-[10px] font-semibold tracking-[0.2em] uppercase rounded-sm border border-border/60 backdrop-blur-md shadow-xs truncate">
                    New Collection
                  </span>
                )}
              </div>

              {/* Favorite Button */}
              <button
                onClick={() => toggleFavorite(product.id)}
                className={`absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-full transition-all z-dropdown shadow-sm ${
                  isFavorite(product.id)
                    ? "bg-foreground text-background"
                    : "bg-background/80 backdrop-blur-sm hover:bg-background text-foreground"
                }`}
                aria-label="В избранное"
              >
                <Heart className={`w-4 h-4 ${isFavorite(product.id) ? "fill-current" : ""}`} />
              </button>

              {/* Mobile Arrows */}
              {product.images.length > 1 && (
                <>
                  <button
                    onClick={() => setActiveImage((prev) => Math.max(0, prev - 1))}
                    disabled={activeImage === 0}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center disabled:opacity-30 transition-opacity"
                    aria-label="Предыдущее фото"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setActiveImage((prev) => Math.min(product.images.length - 1, prev + 1))}
                    disabled={activeImage === product.images.length - 1}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center disabled:opacity-30 transition-opacity"
                    aria-label="Следующее фото"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>

            {/* Thumbnail selector */}
            {product.images.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-2">
                {product.images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImage(idx)}
                    className={`relative w-20 h-24 rounded-xl overflow-hidden border-2 transition-all shrink-0 ${
                      activeImage === idx ? "border-foreground scale-105" : "border-border/60 opacity-60 hover:opacity-100"
                    }`}
                  >
                    <Image
                      src={img}
                      alt={`${product.name} ${idx + 1}`}
                      fill
                      sizes="80px"
                      className="object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ==================== PRODUCT DETAILS (5 cols) ==================== */}
          <div className="lg:col-span-5 space-y-6 min-w-0">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-semibold mb-1">
                {product.category}
              </p>
              <h1 className="font-serif text-3xl md:text-4xl font-normal tracking-wide mb-3 text-foreground leading-tight">
                {product.name}
              </h1>

              <div className="flex flex-wrap items-baseline gap-3 min-w-0">
                <span className="text-2xl md:text-3xl font-normal tracking-normal text-foreground tabular-nums whitespace-nowrap">
                  {formatPrice(product.price)}
                </span>
                {product.comparePrice && (
                  <span className="text-base text-muted-foreground line-through font-light tabular-nums whitespace-nowrap">
                    {formatPrice(product.comparePrice)}
                  </span>
                )}
              </div>
            </div>

            {/* Color Selector */}
            {colors.length > 0 && (
              <div className="space-y-2.5 pt-2 border-t border-border">
                <div className="flex items-center justify-between gap-2 text-xs">
                  <span className="font-semibold uppercase tracking-wider text-muted-foreground flex-shrink-0">Цвет</span>
                  <span className="font-medium text-foreground truncate">{selectedColor}</span>
                </div>
                <div className="flex flex-wrap gap-2.5">
                  {colors.map((color) => {
                    const variant = product.variants?.find((v) => v.color === color);
                    return (
                      <button
                        key={color}
                        onClick={() => {
                          setUserColor(color);
                          setActiveImage(0);
                        }}
                        className={`group relative p-1 rounded-full border-2 transition-all ${
                          selectedColor === color ? "border-foreground" : "border-transparent hover:border-border"
                        }`}
                        title={color}
                      >
                        <div
                          className="w-6 h-6 rounded-full border border-border/40 shadow-inner"
                          style={{ backgroundColor: variant?.colorHex || "#0A0A0A" }}
                        />
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Size Selector & Guide */}
            <div className="space-y-2.5 pt-2 border-t border-border">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <span className="font-semibold uppercase tracking-wider text-muted-foreground">Размер</span>
                <button
                  onClick={() => setShowSizeGuide(true)}
                  className="text-muted-foreground hover:text-foreground flex items-center gap-1 underline underline-offset-4 flex-shrink-0"
                >
                  <Ruler className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>Таблица размеров</span>
                </button>
              </div>

              <div className="grid grid-cols-5 gap-2">
                {["XS", "S", "M", "L", "XL"].map((size) => {
                  const sizeInfo = availableSizes.find((s) => s.size === size);
                  const isAvailable = sizeInfo ? sizeInfo.inStock : true;
                  const isSelected = selectedSize === size;

                  return (
                    <button
                      key={size}
                      onClick={() => setUserSize(size)}
                      disabled={!isAvailable}
                      className={`h-11 rounded-xl text-xs font-semibold border transition-all relative ${
                        isSelected
                          ? "bg-foreground text-background border-foreground shadow-sm"
                          : isAvailable
                          ? "border-border hover:border-foreground/50 bg-card"
                          : "border-border/40 text-muted-foreground/40 bg-secondary/30 cursor-not-allowed line-through"
                      }`}
                    >
                      {size}
                    </button>
                  );
                })}
              </div>

              {selectedVariant && (
                <div className="text-xs text-muted-foreground pt-1 flex flex-wrap items-center justify-between gap-1.5">
                  <span>
                    {selectedVariant.stock > 0 ? (
                      <span className="text-emerald-600 font-medium">В наличии на складе ({selectedVariant.stock} шт.)</span>
                    ) : (
                      <span className="text-red-500 font-medium">Раскуплено в выбранном размере</span>
                    )}
                  </span>
                  <span>Быстрая отправка по Казахстану</span>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="space-y-3 pt-4">
              <div className="flex gap-3">
                {/* Quantity */}
                <div className="flex items-center border border-border rounded-full p-1 bg-card">
                  <button
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-secondary text-foreground"
                    aria-label="Уменьшить"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="w-8 text-center text-xs font-semibold">{quantity}</span>
                  <button
                    onClick={() => setQuantity((q) => q + 1)}
                    className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-secondary text-foreground"
                    aria-label="Увеличить"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Add to Cart or Waitlist */}
                {selectedVariant && selectedVariant.stock <= 0 ? (
                  <button
                    type="button"
                    onClick={() => {
                      setWaitlistStatus("idle");
                      setWaitlistMessage("");
                      setShowWaitlistModal(true);
                    }}
                    className="flex-1 h-11 px-6 rounded-full text-xs font-semibold flex items-center justify-center gap-2 transition-all bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 border border-amber-500/30"
                  >
                    <Bell className="w-4 h-4" />
                    Сообщить о поступлении
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleAddToCart}
                    disabled={!selectedSize}
                    className={`flex-1 h-11 px-6 rounded-full text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                      addedToCart
                        ? "bg-emerald-600 text-white"
                        : !selectedSize
                        ? "bg-secondary text-muted-foreground cursor-not-allowed"
                        : "bg-foreground text-background hover:opacity-90 shadow-sm"
                    }`}
                  >
                    {addedToCart ? (
                      <>
                        <Check className="w-4 h-4" />
                        Добавлено в корзину
                      </>
                    ) : (
                      <>
                        <ShoppingBag className="w-4 h-4" />
                        {!selectedSize ? "Выберите размер" : "Добавить в корзину"}
                      </>
                    )}
                  </button>
                )}
              </div>

              {/* AI Try-On Shortcut */}
              <Link
                href="/ai-tryon"
                className="w-full h-11 border border-foreground/20 hover:border-foreground/60 rounded-full text-xs font-semibold flex items-center justify-center gap-2 transition-colors bg-secondary/30 hover:bg-secondary"
              >
                <Sparkles className="w-3.5 h-3.5 text-[hsl(var(--accent))]" />
                Примерить на своей фотографии в AI
              </Link>
            </div>

            {/* Value Props */}
            <div className="grid grid-cols-3 gap-2 py-4 border-y border-border text-center text-[11px] text-muted-foreground">
              <div className="flex flex-col items-center gap-1.5">
                <Truck className="w-4 h-4 text-foreground stroke-[1.5]" />
                <span>Доставка 1-3 дня</span>
              </div>
              <div className="flex flex-col items-center gap-1.5">
                <RotateCcw className="w-4 h-4 text-foreground stroke-[1.5]" />
                <span>Примерка и возврат 14 дней</span>
              </div>
              <div className="flex flex-col items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-foreground stroke-[1.5]" />
                <span>100% оригинал SABYR</span>
              </div>
            </div>

            {/* Description & Composition */}
            <div className="space-y-4 text-xs leading-relaxed">
              <div>
                <h3 className="font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Описание модели</h3>
                <p className="text-foreground leading-relaxed">{product.description}</p>
              </div>

              {product.composition && (
                <div>
                  <h3 className="font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Состав и материалы</h3>
                  <p className="text-foreground">{product.composition}</p>
                </div>
              )}

              {product.care && (
                <div>
                  <h3 className="font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Уход за изделием</h3>
                  <p className="text-foreground">{product.care}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Similar Products */}
        {similarProducts.length > 0 && (
          <div className="mt-24 pt-12 border-t border-border">
            <h2 className="text-xl md:text-2xl font-bold tracking-tight mb-8">
              Рекомендации к этому образу
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {similarProducts.map((item) => (
                <Link key={item.id} href={`/product/${item.slug}`} className="group block min-w-0">
                  <div className="relative product-aspect rounded-xl overflow-hidden bg-secondary mb-3 border border-border/40">
                    <Image
                      src={item.images?.[0] || "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=400&q=80"}
                      alt={item.name}
                      fill
                      sizes="(max-width: 640px) 50vw, 25vw"
                      className="object-cover product-image-hover"
                    />
                  </div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider truncate">{item.category}</p>
                  <h3 className="text-xs md:text-sm font-medium group-hover:underline underline-offset-4 mt-0.5 line-clamp-2 min-h-[2.5rem] leading-snug">
                    {item.name}
                  </h3>
                  <div className="flex flex-wrap items-baseline gap-1.5 min-w-0 mt-1">
                    <span className="text-xs md:text-sm font-semibold tabular-nums whitespace-nowrap">{formatPrice(item.price)}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Size Guide Modal */}
      <AnimatePresence>
        {showSizeGuide && (
          <div className="fixed inset-0 z-modal flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSizeGuide(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />

            {/* Modal Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.2 }}
              className="relative z-dropdown bg-white dark:bg-[#141414] text-neutral-900 dark:text-neutral-50 border border-neutral-200 dark:border-neutral-800 rounded-3xl max-w-lg w-full p-6 md:p-8 shadow-2xl space-y-5"
            >
              <div className="flex items-center justify-between gap-3 pb-3 border-b border-neutral-200 dark:border-neutral-800">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <Ruler className="w-5 h-5 text-[hsl(var(--accent))] flex-shrink-0" />
                  <h3 className="text-base md:text-lg font-bold tracking-tight truncate">Таблица размеров SABYR</h3>
                </div>
                <button
                  onClick={() => setShowSizeGuide(false)}
                  className="w-8 h-8 flex-shrink-0 rounded-full bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 flex items-center justify-center text-neutral-600 dark:text-neutral-300 transition-colors"
                  aria-label="Закрыть"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
                Все параметры указаны в сантиметрах (см). Изделия Atelier SABYR скроены по европейским лекалам с естественной свободой облегания.
              </p>

              <div className="overflow-x-auto rounded-xl border border-neutral-200 dark:border-neutral-800">
                <table className="w-full text-xs text-left">
                  <thead className="bg-neutral-50 dark:bg-neutral-900/80 text-neutral-600 dark:text-neutral-400 border-b border-neutral-200 dark:border-neutral-800">
                    <tr>
                      <th className="py-3 px-3.5 font-semibold">Размер</th>
                      <th className="py-3 px-3 font-semibold">RU</th>
                      <th className="py-3 px-3 font-semibold">Обхват груди</th>
                      <th className="py-3 px-3 font-semibold">Талия</th>
                      <th className="py-3 px-3 font-semibold">Бёдра</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                    {SIZE_GUIDE.map((row) => (
                      <tr key={row.size} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/40 transition-colors">
                        <td className="py-2.5 px-3.5 font-bold text-neutral-950 dark:text-white">{row.size}</td>
                        <td className="py-2.5 px-3 text-neutral-600 dark:text-neutral-400">{row.ru}</td>
                        <td className="py-2.5 px-3 whitespace-nowrap">{row.bust} см</td>
                        <td className="py-2.5 px-3 whitespace-nowrap">{row.waist} см</td>
                        <td className="py-2.5 px-3 whitespace-nowrap">{row.hips} см</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="p-3 bg-neutral-50 dark:bg-neutral-900/60 rounded-xl text-[11px] text-neutral-600 dark:text-neutral-400 space-y-1">
                <p className="font-semibold text-neutral-800 dark:text-neutral-200">Как правильно снять мерки:</p>
                <p>• Грудь — по наиболее выступающим точкам груди горизонтально полу.</p>
                <p>• Талия — по самой узкой части туловища без утягивания ленты.</p>
                <p>• Бёдра — по наиболее выступающим точкам ягодиц.</p>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => setShowSizeGuide(false)}
                  className="w-full py-3 bg-neutral-950 dark:bg-white text-white dark:text-neutral-950 text-xs font-semibold rounded-full hover:opacity-90 transition-opacity shadow-sm"
                >
                  Понятно, вернуться к выбору
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Waitlist Modal */}
        {showWaitlistModal && (
          <div className="fixed inset-0 z-modal flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowWaitlistModal(false)}
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative z-dropdown w-full max-w-md bg-card border border-border rounded-2xl p-6 shadow-2xl space-y-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5 min-w-0 flex-1">
                  <div className="w-8 h-8 flex-shrink-0 rounded-full bg-amber-500/10 text-amber-600 flex items-center justify-center mt-0.5">
                    <Bell className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-serif text-lg font-semibold text-foreground leading-snug">Сообщить о поступлении</h3>
                    <p className="text-[11px] text-muted-foreground break-words mt-0.5">{product.name} ({selectedColor}, размер {selectedSize})</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowWaitlistModal(false)}
                  className="w-8 h-8 flex-shrink-0 rounded-full hover:bg-secondary flex items-center justify-center text-muted-foreground"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {waitlistStatus === "success" ? (
                <div className="py-6 text-center space-y-3">
                  <div className="w-12 h-12 bg-emerald-500/10 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                    <Check className="w-6 h-6" />
                  </div>
                  <p className="text-xs text-foreground font-medium">{waitlistMessage}</p>
                  <button
                    type="button"
                    onClick={() => setShowWaitlistModal(false)}
                    className="px-6 py-2 bg-foreground text-background text-xs font-semibold rounded-full hover:opacity-90"
                  >
                    Закрыть
                  </button>
                </div>
              ) : (
                <form onSubmit={handleWaitlistSubmit} className="space-y-4 pt-1">
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Оставьте контактные данные. Мы уведомим вас по SMS или email, как только изделие в вашем размере вернётся в наличие.
                  </p>

                  <div>
                    <label className="block text-xs font-medium mb-1.5 text-foreground">
                      Телефон или Email
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="+7 (701) 000-00-00 или email@example.com"
                      value={waitlistContact}
                      onChange={(e) => setWaitlistContact(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs border border-border rounded-xl bg-background focus:outline-none focus:border-foreground"
                    />
                  </div>

                  {waitlistStatus === "error" && (
                    <p className="text-xs text-red-500">{waitlistMessage}</p>
                  )}

                  <div className="pt-2 flex gap-3">
                    <button
                      type="button"
                      onClick={() => setShowWaitlistModal(false)}
                      className="flex-1 py-2.5 border border-border rounded-full text-xs font-semibold hover:bg-secondary transition-colors"
                    >
                      Отмена
                    </button>
                    <button
                      type="submit"
                      disabled={waitlistStatus === "loading" || !waitlistContact}
                      className="flex-1 py-2.5 bg-foreground text-background rounded-full text-xs font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 shadow-sm"
                    >
                      {waitlistStatus === "loading" ? "Отправка..." : "Подписаться"}
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </main>
  );
}
