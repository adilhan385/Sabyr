"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Gift, Check, ArrowRight, ShieldCheck } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { SabyrLogo } from "@/components/ui/SabyrLogo";

const AMOUNTS = [10000, 25000, 50000, 100000];

export default function GiftCardsPage() {
  const [selectedAmount, setSelectedAmount] = useState(50000);
  const [customAmount, setCustomAmount] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [senderName, setSenderName] = useState("");
  const [greetingMessage, setGreetingMessage] = useState("");
  const [purchasedCode, setPurchasedCode] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const effectiveAmount = customAmount
    ? Math.max(10000, Number(customAmount) || selectedAmount)
    : selectedAmount;

  const handleBuy = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/gift-cards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: effectiveAmount,
          recipientName,
          recipientEmail,
          senderName: senderName || undefined,
          greetingMessage: greetingMessage || undefined,
        }),
      });
      const data = await res.json();
      if (data.success && data.giftCard?.code) {
        setPurchasedCode(data.giftCard.code);
      } else {
        setErrorMsg(data.error || "Ошибка оформления сертификата");
      }
    } catch {
      setErrorMsg("Ошибка соединения с сервером");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen pb-24">
      {/* Header */}
      <section className="bg-sabyr-black text-white pt-12 pb-16 border-b border-white/10 text-center">
        <div className="container max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-[hsl(var(--accent))] text-xs font-bold uppercase tracking-wider">
            <Gift className="w-3.5 h-3.5" />
            Подарочная карта
          </div>
          <h1 className="font-serif text-3xl md:text-5xl font-light tracking-wide text-white flex flex-wrap items-center justify-center gap-3">
            <span>Подарочный сертификат</span>
            <SabyrLogo className="h-5 md:h-7 w-auto text-white inline-block" />
          </h1>
          <p className="text-white/75 text-sm md:text-base max-w-xl mx-auto font-light leading-relaxed">
            Идеальный подарок, когда хочется подарить свободу выбора безупречного стиля и премиального кроя.
          </p>
        </div>
      </section>

      <div className="container max-w-5xl pt-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          {/* Card Preview (Left) */}
          <div className="lg:col-span-6 space-y-6">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Превью сертификата
            </h2>

            {/* Virtual Luxury Gift Card */}
            <div className="relative aspect-[16/10] min-h-[220px] rounded-3xl bg-gradient-to-br from-neutral-900 via-neutral-950 to-black text-white p-4 sm:p-6 md:p-8 shadow-2xl border border-white/15 flex flex-col justify-between overflow-hidden">
              <div className="absolute top-0 right-0 w-48 h-48 bg-[hsl(var(--accent))]/10 rounded-full blur-3xl pointer-events-none" />

              <div className="flex items-center justify-between gap-2 relative z-dropdown">
                <SabyrLogo className="h-4 sm:h-5 w-auto text-white" />
                <span className="text-[10px] tracking-widest uppercase border border-[hsl(var(--accent))]/50 text-[hsl(var(--accent))] px-2.5 py-0.5 rounded-full font-semibold whitespace-nowrap flex-shrink-0">
                  GIFT CERTIFICATE
                </span>
              </div>

              <div className="relative z-dropdown space-y-1 my-auto py-2 min-w-0">
                <p className="text-xs text-white/50 uppercase tracking-wider truncate">
                  {recipientName ? `Для: ${recipientName}` : "Номинал сертификата"}
                </p>
                <div className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-[hsl(var(--accent))] tabular-nums whitespace-nowrap">
                  {formatPrice(effectiveAmount)}
                </div>
                {greetingMessage && (
                  <p className="text-xs text-white/80 italic line-clamp-4 break-words pt-1 font-serif">
                    «{greetingMessage}»
                  </p>
                )}
              </div>

              <div className="flex flex-wrap items-end justify-between gap-2 relative z-dropdown text-[11px] text-white/50 pt-3 sm:pt-4 border-t border-white/10 font-mono">
                <div className="min-w-0 truncate">
                  <span>Код: </span>
                  <span className="text-white font-semibold tracking-wider">
                    {purchasedCode || "SABYR-XXXX-XXXX"}
                  </span>
                </div>
                <div className="flex-shrink-0 whitespace-nowrap">Срок: 12 месяцев</div>
              </div>
            </div>

            {purchasedCode && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-5 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-2xl space-y-2 text-xs"
              >
                <div className="flex items-center gap-1.5 text-green-700 dark:text-green-300 font-bold text-sm">
                  <Check className="w-4 h-4" /> Сертификат успешно создан в базе SABYR!
                </div>
                <p className="text-green-800 dark:text-green-200">
                  Уникальный код сертификата:{" "}
                  <strong className="font-mono text-sm">{purchasedCode}</strong>
                </p>
                <p className="text-muted-foreground">
                  Вы можете сразу применить этот код в корзине или при оформлении заказа. Копия отправлена на{" "}
                  {recipientEmail || "email получателя"}.
                </p>
              </motion.div>
            )}
          </div>

          {/* Form (Right) */}
          <div className="lg:col-span-6">
            <form
              onSubmit={handleBuy}
              className="border border-border rounded-2xl p-6 md:p-8 bg-card space-y-6 shadow-sm"
            >
              <div className="space-y-3">
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  1. Выберите номинал карты
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {AMOUNTS.map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => {
                        setSelectedAmount(amt);
                        setCustomAmount("");
                      }}
                      className={`py-3 px-4 rounded-xl border text-sm font-semibold transition-all tabular-nums ${
                        !customAmount && selectedAmount === amt
                          ? "border-foreground bg-secondary font-bold shadow-sm"
                          : "border-border hover:border-foreground/30"
                      }`}
                    >
                      {formatPrice(amt)}
                    </button>
                  ))}
                </div>
                <div className="pt-1">
                  <input
                    type="number"
                    min={10000}
                    max={2000000}
                    step={5000}
                    value={customAmount}
                    onChange={(e) => setCustomAmount(e.target.value)}
                    placeholder="Или введите произвольную сумму (от 10 000 ₸)"
                    className="w-full px-3.5 py-2.5 text-xs border border-border rounded-lg bg-background focus:outline-none focus:border-foreground"
                  />
                </div>
              </div>

              <div className="space-y-4 pt-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  2. Данные получателя
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <input
                      type="text"
                      placeholder="Имя получателя"
                      required
                      value={recipientName}
                      onChange={(e) => setRecipientName(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-sm border border-border rounded-lg bg-background focus:outline-none focus:border-foreground"
                    />
                  </div>
                  <div>
                    <input
                      type="email"
                      placeholder="Email получателя"
                      required
                      value={recipientEmail}
                      onChange={(e) => setRecipientEmail(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-sm border border-border rounded-lg bg-background focus:outline-none focus:border-foreground"
                    />
                  </div>
                </div>

                <div>
                  <input
                    type="text"
                    placeholder="Ваше имя (от кого подарок)"
                    value={senderName}
                    onChange={(e) => setSenderName(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm border border-border rounded-lg bg-background focus:outline-none focus:border-foreground"
                  />
                </div>

                <div>
                  <textarea
                    rows={3}
                    placeholder="Теплые пожелания или поздравление..."
                    value={greetingMessage}
                    onChange={(e) => setGreetingMessage(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm border border-border rounded-lg bg-background focus:outline-none focus:border-foreground"
                  />
                </div>
              </div>

              {errorMsg && (
                <p className="text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 p-3 rounded-xl">
                  {errorMsg}
                </p>
              )}

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-12 bg-foreground text-background font-medium rounded-full text-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2 shadow-md disabled:opacity-50"
                >
                  {isSubmitting
                    ? "Выпуск сертификата..."
                    : `Купить сертификат на ${formatPrice(effectiveAmount)}`}
                  <ArrowRight className="w-4 h-4" />
                </button>
                <div className="flex items-center justify-center gap-2 text-[11px] text-muted-foreground mt-3">
                  <ShieldCheck className="w-4 h-4 text-green-600" />
                  Моментальная онлайн-доставка по email и SMS
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </main>
  );
}
