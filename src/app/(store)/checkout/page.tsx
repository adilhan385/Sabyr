"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ShieldCheck, Truck, CreditCard, Sparkles, CheckCircle2, ArrowRight, ArrowLeft, Building2, MapPin } from "lucide-react";
import { useCartStore } from "@/store/cart";
import { formatPrice, generateOrderNumber } from "@/lib/utils";
import { useSabySession } from "@/hooks/useSabySession";

const CITIES = [
  "Алматы",
  "Астана",
  "Шымкент",
  "Караганда",
  "Актобе",
  "Атырау",
  "Актау",
  "Павлодар",
  "Усть-Каменогорск",
  "Костанай",
];

export default function CheckoutPage() {
  const { items, totalPrice, clearCart } = useCartStore();
  const { user } = useSabySession();

  const [step, setStep] = useState<"checkout" | "success">("checkout");
  const [createdOrderNumber, setCreatedOrderNumber] = useState("");

  // Customer info (pre-filled from session when available)
  const [firstName, setFirstName] = useState(user.name.split(" ")[0] ?? "");
  const [lastName, setLastName] = useState(user.name.split(" ").slice(1).join(" ") ?? "");
  const [phone, setPhone] = useState(user.phone ?? "");
  const [email, setEmail] = useState(user.email ?? "");
  const [marketingConsent, setMarketingConsent] = useState(true);

  // Delivery info
  const [deliveryType, setDeliveryType] = useState<"courier" | "boutique" | "post">("courier");
  const [city, setCity] = useState("Алматы");
  const [street, setStreet] = useState("");
  const [comments, setComments] = useState("");

  // Payment
  const [paymentMethod, setPaymentMethod] = useState<"kaspi" | "card" | "cash">("kaspi");

  // Bonuses & Discounts
  const [useBonuses, setUseBonuses] = useState(false);
  // TODO (Phase 7): bonusBalance will come from real session once auth is wired
  const bonusBalance = user.bonusBalance;

  // Promo code
  const [promoCode, setPromoCode] = useState("");
  const [promoStatus, setPromoStatus] = useState<"idle" | "loading" | "valid" | "error">("idle");
  const [promoDiscount, setPromoDiscount] = useState(0);
  const [promoMessage, setPromoMessage] = useState("");

  // Gift card
  const [giftCardCode, setGiftCardCode] = useState("");
  const [giftCardStatus, setGiftCardStatus] = useState<"idle" | "loading" | "valid" | "error">("idle");
  const [giftCardBalance, setGiftCardBalance] = useState(0);
  const [giftCardMessage, setGiftCardMessage] = useState("");

  const rawSubtotal = totalPrice();
  const deliveryCost = rawSubtotal > 30000 || deliveryType === "boutique" ? 0 : 1500;
  const maxBonusDiscount = Math.min(bonusBalance, Math.floor(rawSubtotal * 0.3));
  const bonusDiscount = useBonuses ? maxBonusDiscount : 0;
  const effectiveGiftCardDiscount =
    giftCardStatus === "valid"
      ? Math.min(giftCardBalance, Math.max(0, rawSubtotal - bonusDiscount - promoDiscount))
      : 0;
  const finalTotal = Math.max(
    0,
    rawSubtotal - bonusDiscount - promoDiscount - effectiveGiftCardDiscount + deliveryCost
  );
  const willEarnBonuses = Math.round(finalTotal * (user.bonusLevel.percent / 100));

  const handleApplyPromo = async () => {
    if (!promoCode.trim()) return;
    setPromoStatus("loading");
    setPromoMessage("");
    try {
      const res = await fetch("/api/promo/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: promoCode.trim(), subtotal: rawSubtotal }),
      });
      const data = await res.json();
      if (data.success) {
        setPromoDiscount(data.discountAmount);
        setPromoStatus("valid");
        setPromoMessage(data.description);
      } else {
        setPromoDiscount(0);
        setPromoStatus("error");
        setPromoMessage(data.error ?? "Промокод не найден");
      }
    } catch {
      setPromoStatus("error");
      setPromoMessage("Ошибка сети. Попробуйте ещё раз.");
    }
  };

  const handleApplyGiftCard = async () => {
    if (!giftCardCode.trim()) return;
    setGiftCardStatus("loading");
    setGiftCardMessage("");
    try {
      const res = await fetch("/api/gift-cards/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: giftCardCode.trim() }),
      });
      const data = await res.json();
      if (data.success && data.balance > 0) {
        setGiftCardBalance(data.balance);
        setGiftCardStatus("valid");
        setGiftCardMessage(`Баланс сертификата: ${formatPrice(data.balance)}`);
      } else {
        setGiftCardBalance(0);
        setGiftCardStatus("error");
        setGiftCardMessage(data.error ?? "Сертификат не найден");
      }
    } catch {
      setGiftCardStatus("error");
      setGiftCardMessage("Ошибка проверки сертификата");
    }
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer: {
            name: `${firstName} ${lastName}`.trim() || user.name || "Покупатель",
            phone: phone || user.phone,
            email: email || user.email || undefined,
            city,
            address: street,
          },
          items: items.map((it) => ({
            productId: it.productId,
            variantId: it.variantId,
            name: it.name,
            price: it.price,
            quantity: it.quantity,
            color: it.color,
            size: it.size,
          })),
          deliveryType:
            deliveryType === "boutique"
              ? "PICKUP"
              : deliveryType === "post"
              ? "POSTAL"
              : "COURIER",
          paymentMethod:
            paymentMethod === "kaspi"
              ? "KASPI_QR"
              : paymentMethod === "card"
              ? "CARD_CLOUDPAYMENTS"
              : "CASH_ON_DELIVERY",
          subtotal: rawSubtotal,
          discount: bonusDiscount + promoDiscount + effectiveGiftCardDiscount,
          bonusUsed: useBonuses ? maxBonusDiscount : 0,
          promoCode: promoStatus === "valid" ? promoCode : undefined,
          promoDiscount: promoStatus === "valid" ? promoDiscount : 0,
          giftCardCode: giftCardStatus === "valid" ? giftCardCode : undefined,
          giftCardAmount: effectiveGiftCardDiscount,
          deliveryCost,
          total: finalTotal,
          notes: comments,
        }),
      });
      const data = await res.json();
      if (data.success && data.orderNumber) {
        setCreatedOrderNumber(data.orderNumber);
      } else {
        setCreatedOrderNumber(generateOrderNumber());
      }
    } catch {
      setCreatedOrderNumber(generateOrderNumber());
    } finally {
      setStep("success");
      clearCart();
    }
  };

  if (step === "success") {
    return (
      <main className="min-h-[75vh] flex items-center justify-center px-4 py-16">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-card border border-border rounded-2xl p-8 text-center shadow-xl space-y-6"
        >
          <div className="w-16 h-16 bg-green-50 dark:bg-green-950 text-green-600 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-bold tracking-tight">Заказ успешно оформлен!</h1>
            <p className="text-sm text-muted-foreground">
              Номер вашего заказа: <span className="font-mono font-semibold text-foreground">{createdOrderNumber}</span>
            </p>
          </div>

          <div className="p-4 bg-secondary/60 rounded-xl text-left space-y-2 text-xs">
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-muted-foreground flex-shrink-0">Получатель:</span>
              <span className="font-medium text-right break-words min-w-0">{firstName} {lastName}</span>
            </div>
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-muted-foreground flex-shrink-0">Город и адрес:</span>
              <span className="font-medium text-right break-words min-w-0">{city}{street ? `, ${street}` : ""}</span>
            </div>
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-muted-foreground flex-shrink-0">Способ оплаты:</span>
              <span className="font-medium text-right break-words min-w-0">
                {paymentMethod === "kaspi" ? "Kaspi QR" : paymentMethod === "card" ? "Банковская карта" : "При получении"}
              </span>
            </div>
            <div className="flex items-baseline justify-between gap-3 pt-2 border-t border-border font-semibold text-sm">
              <span className="flex-shrink-0">Сумма к оплате:</span>
              <span className="tabular-nums whitespace-nowrap flex-shrink-0">{formatPrice(finalTotal)}</span>
            </div>
          </div>

          <div className="p-3 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-xl flex items-center gap-2 text-xs text-amber-800 dark:text-amber-300 text-left">
            <Sparkles className="w-4 h-4 flex-shrink-0 text-amber-600" />
            <span>Вам начислено <strong>+{willEarnBonuses} бонусов SABYR</strong> за эту покупку!</span>
          </div>

          <div className="space-y-3 pt-2">
            <Link
              href="/account"
              className="block w-full py-3 bg-foreground text-background font-medium rounded-full text-sm hover:opacity-90 transition-opacity"
            >
              Перейти в личный кабинет
            </Link>
            <Link
              href="/catalog"
              className="block text-xs text-muted-foreground hover:text-foreground link-underline"
            >
              Вернуться к покупкам
            </Link>
          </div>
        </motion.div>
      </main>
    );
  }

  if (items.length === 0) {
    return (
      <main className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
        <h1 className="text-xl font-bold mb-3">В вашей корзине нет товаров для оформления</h1>
        <Link href="/catalog" className="px-6 py-2.5 bg-foreground text-background text-sm rounded-full font-medium">
          Перейти в каталог
        </Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen pb-24">
      <div className="container max-w-5xl py-8">
        {/* Navigation back */}
        <Link
          href="/cart"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Назад в корзину
        </Link>

        <h1 className="font-serif text-3xl md:text-4xl font-normal tracking-wide mb-8">Оформление заказа</h1>

        <form onSubmit={handleSubmitOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Main Form (Left) */}
          <div className="lg:col-span-7 space-y-8">
            {/* Step 1: Customer info */}
            <div className="border border-border rounded-2xl p-6 bg-card space-y-4">
              <h2 className="text-base font-semibold flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-foreground text-background text-xs flex items-center justify-center font-medium">
                  1
                </span>
                Данные покупателя
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium mb-1.5">Имя</label>
                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm border border-border rounded-lg bg-background focus:outline-none focus:border-foreground"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5">Фамилия</label>
                  <input
                    type="text"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm border border-border rounded-lg bg-background focus:outline-none focus:border-foreground"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5">Номер телефона</label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm border border-border rounded-lg bg-background focus:outline-none focus:border-foreground"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5">Электронная почта</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm border border-border rounded-lg bg-background focus:outline-none focus:border-foreground"
                  />
                </div>
                <div className="sm:col-span-2 pt-2">
                  <label className="flex items-start gap-2.5 cursor-pointer text-xs text-muted-foreground hover:text-foreground transition-colors select-none">
                    <input
                      type="checkbox"
                      checked={marketingConsent}
                      onChange={(e) => setMarketingConsent(e.target.checked)}
                      className="mt-0.5 w-4 h-4 accent-foreground rounded cursor-pointer"
                    />
                    <span>
                      Согласен получать уведомления о новых дропах, закрытых распродажах и персональных предложениях SABYR по SMS и Email
                    </span>
                  </label>
                </div>
              </div>
            </div>

            {/* Step 2: Delivery */}
            <div className="border border-border rounded-2xl p-6 bg-card space-y-4">
              <h2 className="text-base font-semibold flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-foreground text-background text-xs flex items-center justify-center font-medium">
                  2
                </span>
                Способ доставки
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setDeliveryType("courier")}
                  className={`p-4 rounded-xl border text-left transition-all ${
                    deliveryType === "courier" ? "border-foreground bg-secondary/50" : "border-border hover:border-foreground/30"
                  }`}
                >
                  <Truck className="w-5 h-5 mb-2" />
                  <div className="text-xs font-bold">Курьер SABYR</div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">До двери за 1-2 дня</p>
                </button>

                <button
                  type="button"
                  onClick={() => setDeliveryType("boutique")}
                  className={`p-4 rounded-xl border text-left transition-all ${
                    deliveryType === "boutique" ? "border-foreground bg-secondary/50" : "border-border hover:border-foreground/30"
                  }`}
                >
                  <Building2 className="w-5 h-5 mb-2" />
                  <div className="text-xs font-bold">Самовывоз</div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">Из бутика (Бесплатно)</p>
                </button>

                <button
                  type="button"
                  onClick={() => setDeliveryType("post")}
                  className={`p-4 rounded-xl border text-left transition-all ${
                    deliveryType === "post" ? "border-foreground bg-secondary/50" : "border-border hover:border-foreground/30"
                  }`}
                >
                  <MapPin className="w-5 h-5 mb-2" />
                  <div className="text-xs font-bold">Казпочта</div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">В любой регион РК</p>
                </button>
              </div>

              {deliveryType !== "boutique" ? (
                <div className="space-y-4 pt-2">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-medium mb-1.5">Город</label>
                      <select
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background"
                      >
                        {CITIES.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-medium mb-1.5">Улица, дом, квартира</label>
                      <input
                        type="text"
                        required
                        value={street}
                        onChange={(e) => setStreet(e.target.value)}
                        className="w-full px-3.5 py-2.5 text-sm border border-border rounded-lg bg-background"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1.5">Комментарий для курьера</label>
                    <input
                      type="text"
                      placeholder="Код домофона, этаж, пожелания по времени"
                      value={comments}
                      onChange={(e) => setComments(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-sm border border-border rounded-lg bg-background"
                    />
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-secondary/50 rounded-xl text-xs space-y-1">
                  <p className="font-semibold">Адрес бутика в Алматы:</p>
                  <p className="text-muted-foreground">пр. Достык 180, ТРЦ Koktobe City, 1 этаж, Флагман SABYR</p>
                  <p className="text-muted-foreground">Ежедневно с 10:00 до 22:00</p>
                </div>
              )}
            </div>

            {/* Step 3: Payment Method */}
            <div className="border border-border rounded-2xl p-6 bg-card space-y-4">
              <h2 className="text-base font-semibold flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-foreground text-background text-xs flex items-center justify-center font-medium">
                  3
                </span>
                Способ оплаты (Казахстан)
              </h2>

              <div className="space-y-2.5">
                <label className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all ${
                  paymentMethod === "kaspi" ? "border-foreground bg-secondary/40" : "border-border hover:bg-secondary/20"
                }`}>
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="payment"
                      checked={paymentMethod === "kaspi"}
                      onChange={() => setPaymentMethod("kaspi")}
                      className="accent-foreground"
                    />
                    <div>
                      <div className="text-sm font-semibold flex items-center gap-2">
                        <span className="w-4 h-4 rounded-full bg-red-600 text-white text-[10px] font-bold flex items-center justify-center">
                          K
                        </span>
                        Kaspi QR / Kaspi Pay
                      </div>
                      <p className="text-xs text-muted-foreground">Быстрая и безопасная оплата через приложение Kaspi.kz</p>
                    </div>
                  </div>
                </label>

                <label className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all ${
                  paymentMethod === "card" ? "border-foreground bg-secondary/40" : "border-border hover:bg-secondary/20"
                }`}>
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="payment"
                      checked={paymentMethod === "card"}
                      onChange={() => setPaymentMethod("card")}
                      className="accent-foreground"
                    />
                    <div>
                      <div className="text-sm font-semibold flex items-center gap-2">
                        <CreditCard className="w-4 h-4" />
                        Банковская карта онлайн
                      </div>
                      <p className="text-xs text-muted-foreground">Visa, Mastercard любого банка (CloudPayments KZ)</p>
                    </div>
                  </div>
                </label>

                <label className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all ${
                  paymentMethod === "cash" ? "border-foreground bg-secondary/40" : "border-border hover:bg-secondary/20"
                }`}>
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="payment"
                      checked={paymentMethod === "cash"}
                      onChange={() => setPaymentMethod("cash")}
                      className="accent-foreground"
                    />
                    <div>
                      <div className="text-sm font-semibold">Оплата при получении</div>
                      <p className="text-xs text-muted-foreground">Наличными или картой курьеру при вручении</p>
                    </div>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Order Summary (Right) */}
          <div className="lg:col-span-5">
            <div className="border border-border rounded-2xl p-6 bg-card space-y-5 sticky top-24 shadow-sm">
              <h3 className="font-bold text-base">Состав заказа ({items.length})</h3>

              {/* Items List */}
              <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                {items.map((it) => (
                  <div key={it.variantId} className="flex gap-3 items-center text-xs">
                    <div className="relative w-12 h-14 rounded-md overflow-hidden bg-secondary flex-shrink-0">
                      <Image
                        src={it.image}
                        alt={it.name}
                        fill
                        sizes="48px"
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{it.name}</p>
                      <p className="text-muted-foreground mt-0.5">{it.color} · Размер {it.size} · {it.quantity} шт.</p>
                    </div>
                    <span className="font-semibold flex-shrink-0 whitespace-nowrap tabular-nums">{formatPrice(it.price * it.quantity)}</span>
                  </div>
                ))}
              </div>

              {/* Bonus checkbox */}
              {bonusBalance > 0 && (
                <div className="p-3 bg-secondary/60 rounded-xl border border-border">
                  <label className="flex items-center justify-between gap-2 cursor-pointer">
                    <div className="flex items-center gap-2 min-w-0">
                      <input
                        type="checkbox"
                        checked={useBonuses}
                        onChange={(e) => setUseBonuses(e.target.checked)}
                        className="accent-foreground flex-shrink-0"
                      />
                      <span className="text-xs font-medium">Списать бонусы SABYR</span>
                    </div>
                    <span className="text-xs font-bold text-amber-700 dark:text-amber-400 flex-shrink-0 whitespace-nowrap tabular-nums">
                      -{formatPrice(maxBonusDiscount)}
                    </span>
                  </label>
                  <p className="text-[10px] text-muted-foreground mt-1 ml-5">
                    Доступно: {bonusBalance.toLocaleString()} бонусов (макс. 30% от чека)
                  </p>
                </div>
              )}

              {/* Promo Code Input */}
              <div className="border border-border rounded-xl p-3 space-y-2">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Промокод</p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={promoCode}
                    onChange={(e) => {
                      setPromoCode(e.target.value.toUpperCase());
                      if (promoStatus !== "idle") { setPromoStatus("idle"); setPromoDiscount(0); setPromoMessage(""); }
                    }}
                    placeholder="SABYR10"
                    className="flex-1 min-w-0 h-9 px-3 rounded-lg border border-border bg-background text-xs font-mono focus:outline-none focus:ring-1 focus:ring-foreground/30"
                  />
                  <button
                    type="button"
                    onClick={handleApplyPromo}
                    disabled={promoStatus === "loading" || !promoCode.trim()}
                    className="px-4 h-9 bg-foreground text-background text-xs font-semibold rounded-lg hover:opacity-90 disabled:opacity-40 transition-opacity flex-shrink-0"
                  >
                    {promoStatus === "loading" ? "..." : "Применить"}
                  </button>
                </div>
                {promoMessage && (
                  <p className={`text-[11px] ${promoStatus === "valid" ? "text-green-600" : "text-red-500"}`}>
                    {promoStatus === "valid" ? `✓ ${promoMessage}` : `✕ ${promoMessage}`}
                  </p>
                )}
              </div>

              {/* Gift Card Input */}
              <div className="border border-border rounded-xl p-3 space-y-2">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Подарочный сертификат
                </p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={giftCardCode}
                    onChange={(e) => {
                      setGiftCardCode(e.target.value.toUpperCase());
                      if (giftCardStatus !== "idle") {
                        setGiftCardStatus("idle");
                        setGiftCardBalance(0);
                        setGiftCardMessage("");
                      }
                    }}
                    placeholder="SABYR-GIFT-8942-2026"
                    className="flex-1 min-w-0 h-9 px-3 rounded-lg border border-border bg-background text-xs font-mono focus:outline-none focus:ring-1 focus:ring-foreground/30"
                  />
                  <button
                    type="button"
                    onClick={handleApplyGiftCard}
                    disabled={giftCardStatus === "loading" || !giftCardCode.trim()}
                    className="px-4 h-9 bg-foreground text-background text-xs font-semibold rounded-lg hover:opacity-90 disabled:opacity-40 transition-opacity flex-shrink-0"
                  >
                    {giftCardStatus === "loading" ? "..." : "Применить"}
                  </button>
                </div>
                {giftCardMessage && (
                  <p className={`text-[11px] ${giftCardStatus === "valid" ? "text-green-600" : "text-red-500"}`}>
                    {giftCardStatus === "valid" ? `✓ ${giftCardMessage}` : `✕ ${giftCardMessage}`}
                  </p>
                )}
              </div>

              {/* Calculation */}
              <div className="space-y-2 text-xs border-t border-border pt-4">
                <div className="flex justify-between gap-2">
                  <span className="text-muted-foreground">Сумма товаров:</span>
                  <span className="whitespace-nowrap tabular-nums">{formatPrice(rawSubtotal)}</span>
                </div>
                {bonusDiscount > 0 && (
                  <div className="flex justify-between gap-2 text-amber-600 font-medium">
                    <span>Оплата бонусами:</span>
                    <span className="whitespace-nowrap tabular-nums">-{formatPrice(bonusDiscount)}</span>
                  </div>
                )}
                {promoDiscount > 0 && (
                  <div className="flex justify-between gap-2 text-green-600 font-medium">
                    <span className="min-w-0 truncate">Промокод {promoCode}:</span>
                    <span className="flex-shrink-0 whitespace-nowrap tabular-nums">-{formatPrice(promoDiscount)}</span>
                  </div>
                )}
                {effectiveGiftCardDiscount > 0 && (
                  <div className="flex justify-between gap-2 text-green-600 font-medium">
                    <span className="min-w-0 truncate">Сертификат {giftCardCode}:</span>
                    <span className="flex-shrink-0 whitespace-nowrap tabular-nums">-{formatPrice(effectiveGiftCardDiscount)}</span>
                  </div>
                )}
                <div className="flex justify-between gap-2">
                  <span className="text-muted-foreground">Доставка:</span>
                  <span className="whitespace-nowrap tabular-nums">{deliveryCost === 0 ? "Бесплатно" : formatPrice(deliveryCost)}</span>
                </div>
              </div>


              <div className="border-t border-border pt-3 flex justify-between items-center gap-2">
                <span className="font-bold text-base">К оплате:</span>
                <span className="text-2xl font-bold whitespace-nowrap tabular-nums">{formatPrice(finalTotal)}</span>
              </div>

              <button
                type="submit"
                className="w-full h-12 bg-foreground text-background font-medium rounded-full text-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2 shadow-md"
              >
                Подтвердить и оплатить заказ
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="flex items-center justify-center gap-2 text-[11px] text-muted-foreground text-center pt-2">
                <ShieldCheck className="w-4 h-4 text-green-600" />
                Безопасный платеж с 256-битным шифрованием
              </div>
            </div>
          </div>
        </form>
      </div>
    </main>
  );
}
