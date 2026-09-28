"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { X, Tag, Gift, Sparkles, ChevronRight, Minus, Plus, Trash2, ShoppingBag, Check } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { useCartStore } from "@/store/cart";
import { useSabySession } from "@/hooks/useSabySession";

export default function CartPage() {
  const {
    items,
    removeItem,
    updateQuantity,
    totalItems,
    totalPrice,
    appliedPromo: promoApplied,
    setAppliedPromo: setPromoApplied,
    appliedGiftCard: certApplied,
    setAppliedGiftCard: setCertApplied,
    bonusesUsed,
    setBonusesUsed,
  } = useCartStore();
  const { user } = useSabySession();

  const [promoCode, setPromoCode] = useState("");
  const [promoError, setPromoError] = useState("");
  const [certificate, setCertificate] = useState("");
  const [certError, setCertError] = useState("");

  const userBonuses = user.bonusBalance;
  const subtotal = totalPrice();
  const promoDiscount = promoApplied ? promoApplied.discountAmount : 0;
  const certDiscount = certApplied ? Math.min(certApplied.amount, Math.max(0, subtotal - promoDiscount)) : 0;
  const bonusDiscount = Math.min(bonusesUsed, Math.floor(subtotal * 0.3), userBonuses);
  const deliveryCost = subtotal > 30000 ? 0 : 1500;
  const total = Math.max(0, subtotal - promoDiscount - certDiscount - bonusDiscount + deliveryCost);

  const handlePromo = async () => {
    if (!promoCode.trim()) return;
    setPromoError("");
    try {
      const res = await fetch("/api/promo/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: promoCode.trim(), subtotal }),
      });
      const data = await res.json();
      if (data.success) {
        setPromoApplied({
          code: data.code,
          discountAmount: data.discountAmount,
          description: data.description,
        });
        setPromoCode("");
      } else {
        setPromoError(data.error || "Промокод не найден или истёк");
      }
    } catch {
      setPromoError("Ошибка проверки промокода");
    }
  };

  const handleCertificate = async () => {
    if (!certificate.trim()) return;
    setCertError("");
    try {
      const res = await fetch("/api/gift-cards/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: certificate.trim() }),
      });
      const data = await res.json();
      if (data.success && data.balance > 0) {
        setCertApplied({ code: data.code, amount: data.balance });
        setCertificate("");
      } else {
        setCertError(data.error || "Сертификат не найден или использован");
      }
    } catch {
      setCertError("Ошибка проверки сертификата");
    }
  };

  const handleBonuses = (amount: number) => {
    const max = Math.min(userBonuses, Math.round(subtotal * 0.3));
    setBonusesUsed(Math.min(amount, max));
  };

  if (items.length === 0) {
    return (
      <main className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
        <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-6">
          <ShoppingBag className="w-8 h-8 text-muted-foreground stroke-[1.25]" />
        </div>
        <h1 className="font-serif text-3xl font-normal tracking-wide mb-2">Ваша корзина пока пуста</h1>
        <p className="text-muted-foreground text-sm mb-8 font-light">Добавьте понравившиеся изделия из коллекции SABYR, чтобы продолжить</p>
        <Link
          href="/catalog"
          className="px-6 py-3 bg-foreground text-background rounded-full font-medium hover:opacity-90 transition-opacity text-sm"
        >
          Перейти в каталог
        </Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen">
      <div className="container py-8 md:py-12 pb-20">
        <h1 className="font-serif text-3xl md:text-4xl font-normal tracking-wide mb-8">
          Корзина <span className="font-sans text-muted-foreground text-xl md:text-2xl font-light">({totalItems()})</span>
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
          {/* ==================== ITEMS ==================== */}
          <div className="lg:col-span-2 space-y-4">
            <AnimatePresence initial={false}>
              {items.map((item) => (
                <motion.div
                  key={item.variantId}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -50, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="flex gap-4 p-4 border border-border rounded-xl"
                >
                  {/* Image */}
                  <Link href={`/product/${item.slug}`} className="flex-shrink-0">
                    <div className="relative w-24 h-32 md:w-28 md:h-36 rounded-lg overflow-hidden bg-secondary">
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        sizes="(max-width: 768px) 96px, 112px"
                        className="object-cover"
                      />
                    </div>
                  </Link>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <Link
                        href={`/product/${item.slug}`}
                        className="min-w-0 flex-1 font-medium hover:underline underline-offset-2 line-clamp-2"
                      >
                        {item.name}
                      </Link>
                      <button
                        onClick={() => removeItem(item.variantId)}
                        className="flex-shrink-0 w-8 h-8 flex items-center justify-center hover:bg-secondary rounded-full transition-colors text-muted-foreground hover:text-foreground"
                        aria-label="Удалить"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 mt-2 text-xs sm:text-sm text-muted-foreground">
                      <span>{item.color}</span>
                      <span>·</span>
                      <span>Размер {item.size}</span>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 mt-3">
                      {/* Quantity */}
                      <div className="flex-shrink-0 flex items-center border border-border rounded-lg overflow-hidden">
                        <button
                          onClick={() => updateQuantity(item.variantId, item.quantity - 1)}
                          className="w-8 h-8 flex items-center justify-center hover:bg-secondary transition-colors"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-8 text-center text-sm tabular-nums">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.variantId, item.quantity + 1)}
                          className="w-8 h-8 flex items-center justify-center hover:bg-secondary transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Price */}
                      <p className="font-semibold tabular-nums whitespace-nowrap flex-shrink-0">{formatPrice(item.price * item.quantity)}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* ==================== ORDER SUMMARY ==================== */}
          <div className="space-y-4">
            <div className="border border-border rounded-xl p-5 space-y-5 sticky top-24">
              <h2 className="font-semibold text-lg">Итого</h2>

              {/* Promo code */}
              <div>
                <p className="text-sm font-medium mb-2 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 flex-shrink-0" /> Промокод
                </p>
                {promoApplied ? (
                  <div className="flex items-center justify-between gap-2 p-2.5 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg text-sm">
                    <span className="text-green-700 dark:text-green-400 font-medium min-w-0 truncate">
                      {promoApplied.code} ({promoApplied.description})
                    </span>
                    <button
                      onClick={() => setPromoApplied(null)}
                      className="text-muted-foreground hover:text-foreground flex-shrink-0"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={promoCode}
                      onChange={(e) => { setPromoCode(e.target.value); setPromoError(""); }}
                      placeholder="Введите промокод"
                      className="flex-1 min-w-0 px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:border-foreground transition-colors bg-background"
                      onKeyDown={(e) => e.key === "Enter" && handlePromo()}
                    />
                    <button
                      onClick={handlePromo}
                      className="flex-shrink-0 px-3 py-2 bg-secondary text-sm font-medium rounded-lg hover:bg-secondary/80 transition-colors whitespace-nowrap"
                    >
                      Применить
                    </button>
                  </div>
                )}
                {promoError && <p className="text-xs text-red-500 mt-1">{promoError}</p>}
              </div>

              {/* Gift certificate */}
              <div>
                <p className="text-sm font-medium mb-2 flex items-center gap-1.5">
                  <Gift className="w-3.5 h-3.5 flex-shrink-0" /> Подарочный сертификат
                </p>
                {certApplied ? (
                  <div className="flex items-center justify-between gap-2 p-2.5 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg text-sm">
                    <span className="text-green-700 dark:text-green-400 font-medium min-w-0 truncate">
                      {certApplied.code} (-{formatPrice(certDiscount)})
                    </span>
                    <button onClick={() => setCertApplied(null)} className="flex-shrink-0">
                      <X className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground" />
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={certificate}
                      onChange={(e) => { setCertificate(e.target.value); setCertError(""); }}
                      placeholder="Код сертификата"
                      className="flex-1 min-w-0 px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:border-foreground transition-colors bg-background"
                      onKeyDown={(e) => e.key === "Enter" && handleCertificate()}
                    />
                    <button
                      onClick={handleCertificate}
                      className="flex-shrink-0 px-3 py-2 bg-secondary text-sm font-medium rounded-lg hover:bg-secondary/80 transition-colors whitespace-nowrap"
                    >
                      Применить
                    </button>
                  </div>
                )}
                {certError && <p className="text-xs text-red-500 mt-1">{certError}</p>}
              </div>

              {/* Bonuses */}
              <div>
                <p className="text-sm font-medium mb-2 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[hsl(var(--accent))] flex-shrink-0" />
                  <span>Бонусы (у вас: {userBonuses.toLocaleString()})</span>
                </p>
                {bonusesUsed > 0 ? (
                  <div className="flex items-center justify-between gap-2 p-2.5 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg text-sm">
                    <span className="text-amber-700 dark:text-amber-400 font-medium min-w-0 break-words">
                      -{bonusesUsed.toLocaleString()} бонусов (-{formatPrice(bonusesUsed)})
                    </span>
                    <button onClick={() => setBonusesUsed(0)} className="flex-shrink-0">
                      <X className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => handleBonuses(Math.min(userBonuses, Math.round(subtotal * 0.3)))}
                    className="w-full px-3 py-2 border border-border rounded-lg text-sm hover:bg-secondary transition-colors text-left"
                  >
                    Использовать до {Math.min(userBonuses, Math.round(subtotal * 0.3)).toLocaleString()} бонусов
                  </button>
                )}
              </div>

              {/* Price breakdown */}
              <div className="border-t border-border pt-4 space-y-2.5 text-sm">
                <div className="flex justify-between gap-2">
                  <span className="text-muted-foreground">Товары ({totalItems()})</span>
                  <span className="tabular-nums whitespace-nowrap flex-shrink-0">{formatPrice(subtotal)}</span>
                </div>
                {promoDiscount > 0 && (
                  <div className="flex justify-between gap-2 text-green-600">
                    <span>Промокод</span>
                    <span className="tabular-nums whitespace-nowrap flex-shrink-0">-{formatPrice(promoDiscount)}</span>
                  </div>
                )}
                {certDiscount > 0 && (
                  <div className="flex justify-between gap-2 text-green-600">
                    <span>Сертификат</span>
                    <span className="tabular-nums whitespace-nowrap flex-shrink-0">-{formatPrice(certDiscount)}</span>
                  </div>
                )}
                {bonusDiscount > 0 && (
                  <div className="flex justify-between gap-2 text-amber-600">
                    <span>Бонусы</span>
                    <span className="tabular-nums whitespace-nowrap flex-shrink-0">-{formatPrice(bonusDiscount)}</span>
                  </div>
                )}
                <div className="flex justify-between gap-2">
                  <span className="text-muted-foreground">Доставка</span>
                  <span className="tabular-nums whitespace-nowrap flex-shrink-0">{deliveryCost === 0 ? "Бесплатно" : formatPrice(deliveryCost)}</span>
                </div>
                {deliveryCost === 0 && (
                  <p className="text-xs text-green-600 flex items-center gap-1">
                    <Check className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>Бесплатная доставка от 30 000 ₸</span>
                  </p>
                )}
              </div>

              {/* Total */}
              <div className="border-t border-border pt-4 flex justify-between items-center gap-2">
                <span className="font-semibold">Итого</span>
                <span className="text-xl font-bold tabular-nums whitespace-nowrap flex-shrink-0">{formatPrice(Math.max(0, total))}</span>
              </div>

              {/* Checkout button */}
              <Link
                href="/checkout"
                className="flex items-center justify-center gap-2 w-full h-12 bg-foreground text-background font-medium rounded-full hover:opacity-90 transition-opacity"
              >
                Оформить заказ
                <ChevronRight className="w-4 h-4" />
              </Link>

              <p className="text-xs text-muted-foreground text-center">
                После оформления заказа вам начислятся бонусы SABYR
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
