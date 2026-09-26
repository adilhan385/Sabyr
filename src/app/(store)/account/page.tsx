"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ShoppingBag,
  Sparkles,
  Crown,
  Gift,
  MapPin,
  Tag,
  CheckCircle2,
  Percent,
  Bell,
  LogIn,
  Loader2,
  LogOut,
  Trash2,
  UserCheck,
  Pencil,
  X,
  Heart,
} from "lucide-react";
import { useSabySession } from "@/hooks/useSabySession";
import { useFavoritesStore } from "@/store/favorites";
import { ProductItem, PRODUCTS as INITIAL_PRODUCTS } from "@/data/mockData";
import { formatPrice } from "@/lib/utils";

type TabKey =
  | "orders"
  | "favorites"
  | "bonuses"
  | "club"
  | "addresses"
  | "giftcards"
  | "promos"
  | "notifications";

export default function AccountPage() {
  const { user, isLoading, isGuest, refreshSession, logout } = useSabySession();
  const { items: favoriteIds, removeFavorite, syncFromServer } = useFavoritesStore();
  const [catalogProducts, setCatalogProducts] = useState<ProductItem[]>(INITIAL_PRODUCTS);
  const [activeTab, setActiveTab] = useState<TabKey>("orders");
  const [notifyDrops, setNotifyDrops] = useState(true);
  const [notifyClub, setNotifyClub] = useState(true);
  const [notifySms, setNotifySms] = useState(true);
  const [notifyEmail, setNotifyEmail] = useState(true);

  useEffect(() => {
    syncFromServer();
    fetch("/api/products")
      .then((r) => r.json())
      .then((d) => {
        if (d.success && Array.isArray(d.products) && d.products.length > 0) {
          setCatalogProducts(d.products);
        }
      })
      .catch(() => {});
  }, [syncFromServer]);

  const favoriteProducts = catalogProducts.filter((p) => favoriteIds.includes(p.id));

  // ─── Auth OTP Login State ──────────────────────────────────────────────────
  const [loginPhone, setLoginPhone] = useState("");
  const [loginName, setLoginName] = useState("");
  const [loginEmail, setLoginEmail] = useState("");
  const [sendVia, setSendVia] = useState<"sms" | "email">("email");
  const [otpSentTo, setOtpSentTo] = useState<{ via: "sms" | "email"; target: string } | null>(null);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [otpStep, setOtpStep] = useState<"phone" | "code">("phone");
  const [otpCode, setOtpCode] = useState("");
  const [authSubmitting, setAuthSubmitting] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // ─── Profile Edit & Address State ──────────────────────────────────────────
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [profileSaving, setProfileSaving] = useState(false);

  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [newAddrTitle, setNewAddrTitle] = useState("Дом");
  const [newAddrCity, setNewAddrCity] = useState("Алматы");
  const [newAddrStreet, setNewAddrStreet] = useState("");
  const [newAddrDefault, setNewAddrDefault] = useState(true);
  const [addressSaving, setAddressSaving] = useState(false);

  const progressPercent = Math.min(
    100,
    Math.round(
      (user.bonusLevel.currentPurchases / Math.max(1, user.bonusLevel.nextLevelAt)) * 100
    )
  );

  const [devCodeHint, setDevCodeHint] = useState<string | null>(null);

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setDevCodeHint(null);
    if (!loginEmail.trim()) {
      setAuthError("Пожалуйста, укажите ваш Email (обязательное поле).");
      return;
    }
    if (!acceptedTerms) {
      setAuthError("Для входа и регистрации необходимо согласиться с Условиями использования.");
      return;
    }
    setAuthSubmitting(true);
    try {
      const res = await fetch("/api/auth/otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: loginPhone,
          email: loginEmail.trim(),
          sendVia,
          acceptedTerms: true,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setAuthError(data.error || "Ошибка отправки кода подтверждения");
      } else {
        const formattedPhone = data.phone || loginPhone;
        setLoginPhone(formattedPhone);
        setOtpSentTo({
          via: sendVia,
          target: sendVia === "email" ? loginEmail.trim() : formattedPhone,
        });
        if (data.devCode) {
          setDevCodeHint(String(data.devCode));
        }
        setOtpCode("");
        setOtpStep("code");
      }
    } catch {
      setAuthError("Не удалось отправить код. Проверьте соединение.");
    } finally {
      setAuthSubmitting(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    if (!acceptedTerms) {
      setAuthError("Необходимо согласиться с Условиями использования.");
      return;
    }
    setAuthSubmitting(true);
    try {
      const res = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: loginPhone,
          code: otpCode,
          name: loginName || undefined,
          email: loginEmail.trim(),
          acceptedTerms: true,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setAuthError(data.error || "Неверный код подтверждения");
      } else {
        await refreshSession();
      }
    } catch {
      setAuthError("Ошибка проверки кода");
    } finally {
      setAuthSubmitting(false);
    }
  };

  const handleOpenEditProfile = () => {
    setEditName(user.name);
    setEditEmail(user.email);
    setIsEditingProfile(true);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSaving(true);
    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editName, email: editEmail }),
      });
      if (res.ok) {
        await refreshSession();
        setIsEditingProfile(false);
      }
    } finally {
      setProfileSaving(false);
    }
  };

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAddrStreet.trim()) return;
    setAddressSaving(true);
    try {
      const res = await fetch("/api/user/addresses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newAddrTitle,
          city: newAddrCity,
          street: newAddrStreet,
          isDefault: newAddrDefault,
        }),
      });
      if (res.ok) {
        setNewAddrStreet("");
        setIsAddingAddress(false);
        await refreshSession();
      }
    } finally {
      setAddressSaving(false);
    }
  };

  const handleDeleteAddress = async (id: string) => {
    await fetch(`/api/user/addresses?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
    await refreshSession();
  };

  // ─── Loading skeleton ──────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <Loader2 className="w-8 h-8 animate-spin" />
          <p className="text-sm">Загружаем ваш профиль...</p>
        </div>
      </main>
    );
  }

  // ─── Guest / not logged in ─────────────────────────────────────────────────
  if (isGuest) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4 py-16">
        <div className="max-w-md w-full border border-border bg-card rounded-2xl p-6 sm:p-8 space-y-6">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-full bg-secondary flex items-center justify-center mx-auto mb-3">
              <LogIn className="w-6 h-6 text-foreground stroke-[1.4]" />
            </div>
            <h1 className="font-serif text-2xl font-light tracking-tight">
              Вход и регистрация
            </h1>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Укажите ваш номер телефона и Email, затем выберите, куда отправить одноразовый код подтверждения.
            </p>
          </div>

          {otpStep === "phone" ? (
            <form onSubmit={handleRequestOtp} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
                  Номер телефона *
                </label>
                <input
                  type="tel"
                  required
                  value={loginPhone}
                  onChange={(e) => setLoginPhone(e.target.value)}
                  placeholder="Введите номер телефона (+7...)"
                  className="w-full px-4 py-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:border-foreground"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
                  Email (Почта) *
                </label>
                <input
                  type="email"
                  required
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="Введите ваш Email (обязательно)"
                  className="w-full px-4 py-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:border-foreground"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
                  Имя
                </label>
                <input
                  type="text"
                  value={loginName}
                  onChange={(e) => setLoginName(e.target.value)}
                  placeholder="Введите ваше имя"
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-xs focus:outline-none focus:border-foreground"
                />
              </div>

              {/* Channel selector: Email vs SMS */}
              <div className="space-y-1.5 pt-1">
                <label className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold block">
                  Куда отправить код подтверждения? *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSendVia("email")}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-semibold transition-all ${
                      sendVia === "email"
                        ? "border-foreground bg-foreground text-background shadow-sm"
                        : "border-border bg-background text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    ✉️ На Email (Почту)
                  </button>
                  <button
                    type="button"
                    onClick={() => setSendVia("sms")}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-semibold transition-all ${
                      sendVia === "sms"
                        ? "border-foreground bg-foreground text-background shadow-sm"
                        : "border-border bg-background text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    📱 По SMS (На номер)
                  </button>
                </div>
              </div>

              {/* Mandatory Terms of Use Checkbox */}
              <label className="flex items-start gap-2.5 pt-1 cursor-pointer select-none">
                <input
                  type="checkbox"
                  required
                  checked={acceptedTerms}
                  onChange={(e) => setAcceptedTerms(e.target.checked)}
                  className="mt-0.5 w-4 h-4 accent-foreground rounded flex-shrink-0 cursor-pointer"
                />
                <span className="text-xs text-muted-foreground leading-relaxed">
                  Я соглашаюсь с{" "}
                  <Link
                    href="/terms"
                    target="_blank"
                    className="text-foreground underline underline-offset-2 hover:opacity-80"
                  >
                    Условиями использования
                  </Link>{" "}
                  и{" "}
                  <Link
                    href="/privacy"
                    target="_blank"
                    className="text-foreground underline underline-offset-2 hover:opacity-80"
                  >
                    Политикой конфиденциальности
                  </Link>
                </span>
              </label>

              {authError && (
                <p className="text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 p-3 rounded-xl">
                  {authError}
                </p>
              )}

              <button
                type="submit"
                disabled={authSubmitting || !acceptedTerms || !loginEmail.trim() || !loginPhone.trim()}
                className="w-full py-3.5 bg-foreground text-background text-xs uppercase tracking-[0.15em] font-semibold rounded-full hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {authSubmitting
                  ? "Отправка кода..."
                  : sendVia === "email"
                    ? "Получить код на Email"
                    : "Получить SMS-код"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="p-3.5 rounded-xl bg-secondary/60 text-xs space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-muted-foreground">
                    {otpSentTo?.via === "email"
                      ? "Код отправлен на почту:"
                      : "Код отправлен на номер:"}
                  </span>
                  <button
                    type="button"
                    onClick={() => setOtpStep("phone")}
                    className="underline text-foreground font-medium"
                  >
                    Изменить
                  </button>
                </div>
                <p className="font-semibold">{otpSentTo?.target || loginEmail || loginPhone}</p>
              </div>

              {devCodeHint && (
                <div className="p-3 rounded-xl border border-border bg-secondary/40 text-xs flex items-center justify-between">
                  <span className="text-muted-foreground">Код подтверждения:</span>
                  <span className="font-mono font-bold tracking-widest text-sm">{devCodeHint}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
                  4-значный код подтверждения
                </label>
                <input
                  type="text"
                  maxLength={4}
                  required
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                  placeholder="••••"
                  className="w-full px-4 py-3 rounded-xl border border-border bg-background text-center font-mono text-lg tracking-[0.4em] focus:outline-none focus:border-foreground"
                />
              </div>

              {/* Mandatory Terms of Use Checkbox on step 2 as well */}
              <label className="flex items-start gap-2.5 pt-1 cursor-pointer select-none">
                <input
                  type="checkbox"
                  required
                  checked={acceptedTerms}
                  onChange={(e) => setAcceptedTerms(e.target.checked)}
                  className="mt-0.5 w-4 h-4 accent-foreground rounded flex-shrink-0 cursor-pointer"
                />
                <span className="text-xs text-muted-foreground leading-relaxed">
                  Подтверждаю согласие с{" "}
                  <Link
                    href="/terms"
                    target="_blank"
                    className="text-foreground underline underline-offset-2 hover:opacity-80"
                  >
                    Условиями использования
                  </Link>
                </span>
              </label>

              {authError && (
                <p className="text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 p-3 rounded-xl">
                  {authError}
                </p>
              )}

              <button
                type="submit"
                disabled={authSubmitting || otpCode.length !== 4 || !acceptedTerms}
                className="w-full py-3.5 bg-foreground text-background text-xs uppercase tracking-[0.15em] font-semibold rounded-full hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {authSubmitting ? "Проверка..." : "Войти в кабинет"}
              </button>
            </form>
          )}

          <div className="pt-2 border-t border-border text-center">
            <Link
              href="/catalog"
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Продолжить покупки без входа →
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // ─── Authenticated user ────────────────────────────────────────────────────
  return (
    <main className="min-h-screen pb-24">
      {/* User Header Profile */}
      <section className="bg-secondary/40 border-b border-border py-12">
        <div className="container max-w-6xl">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-foreground text-background flex items-center justify-center text-xl font-bold flex-shrink-0">
                {user.name.slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="font-serif text-2xl md:text-3xl font-normal tracking-wide">
                    {user.name}
                  </h1>
                  {user.clubMembership.isActive && (
                    <span className="px-2.5 py-0.5 rounded-full bg-black text-[hsl(var(--accent))] text-[10px] font-semibold uppercase tracking-wider flex items-center gap-1 border border-[hsl(var(--accent))]/40">
                      <Crown className="w-3 h-3" /> CLUB VIP
                    </span>
                  )}
                  {user.role === "ADMIN" && (
                    <Link
                      href="/admin"
                      className="px-2.5 py-0.5 rounded-full bg-foreground text-background text-[10px] font-semibold uppercase tracking-wider flex items-center gap-1"
                    >
                      <UserCheck className="w-3 h-3" /> Админ-панель
                    </Link>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {user.phone}
                  {user.email ? ` · ${user.email}` : ""}
                </p>
                <div className="flex items-center gap-4 mt-2">
                  <button
                    onClick={handleOpenEditProfile}
                    className="text-[11px] text-muted-foreground hover:text-foreground inline-flex items-center gap-1 transition-colors"
                  >
                    <Pencil className="w-3 h-3" /> Изменить профиль
                  </button>
                  <button
                    onClick={logout}
                    className="text-[11px] text-muted-foreground hover:text-foreground inline-flex items-center gap-1 transition-colors"
                  >
                    <LogOut className="w-3 h-3" /> Выйти
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Balance Cards */}
            <div className="flex flex-wrap gap-3 w-full md:w-auto">
              <div className="p-3.5 bg-card border border-border rounded-xl flex-1 md:w-44 text-left">
                <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-[hsl(var(--accent))]" /> Бонусы{" "}
                  <span className="font-brand tracking-[0.15em]">SABYR</span>
                </span>
                <p className="text-xl font-semibold mt-1 text-foreground tabular-nums">
                  {user.bonusBalance.toLocaleString()} ₸
                </p>
              </div>

              <div className="p-3.5 bg-card border border-border rounded-xl flex-1 md:w-44 text-left">
                <span className="text-[11px] text-muted-foreground">Текущий статус</span>
                <p className="text-sm font-bold mt-1 text-foreground">
                  {user.bonusLevel.name}
                </p>
              </div>
            </div>
          </div>

          {isEditingProfile && (
            <form
              onSubmit={handleSaveProfile}
              className="mt-6 p-4 border border-border bg-card rounded-2xl flex flex-col sm:flex-row items-end gap-3"
            >
              <div className="w-full sm:flex-1 space-y-1">
                <label className="text-[11px] text-muted-foreground">Ваше имя</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-border bg-background text-xs"
                />
              </div>
              <div className="w-full sm:flex-1 space-y-1">
                <label className="text-[11px] text-muted-foreground">Email</label>
                <input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-border bg-background text-xs"
                />
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="submit"
                  disabled={profileSaving}
                  className="px-4 py-2 bg-foreground text-background rounded-full text-xs font-semibold hover:opacity-90"
                >
                  {profileSaving ? "Сохранение..." : "Сохранить"}
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditingProfile(false)}
                  className="p-2 border border-border rounded-full text-muted-foreground hover:text-foreground"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          )}
        </div>
      </section>

      {/* Main Tabs and Content */}
      <div className="container max-w-6xl pt-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Sidebar Nav */}
          <div className="lg:col-span-3 space-y-1">
            {(
              [
                { key: "orders", icon: ShoppingBag, label: "История заказов", badge: `${user.orders.length}` },
                { key: "favorites", icon: Heart, label: "Избранное", badge: favoriteProducts.length > 0 ? `${favoriteProducts.length}` : undefined },
                { key: "bonuses", icon: Sparkles, label: "Бонусная система", badge: user.bonusBalance.toLocaleString() },
                { key: "club", icon: Crown, label: "SABYR CLUB", badge: user.clubMembership.isActive ? "Активен" : undefined },
                { key: "addresses", icon: MapPin, label: "Адреса доставки", badge: `${user.addresses.length}` },
                { key: "giftcards", icon: Gift, label: "Сертификаты", badge: user.giftCards.length > 0 ? `${user.giftCards.length}` : undefined },
                { key: "promos", icon: Tag, label: "Промокоды", badge: undefined },
                { key: "notifications", icon: Bell, label: "Уведомления", badge: undefined },
              ] as Array<{ key: TabKey; icon: typeof ShoppingBag; label: string; badge?: string }>
            ).map(({ key, icon: Icon, label, badge }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`w-full flex items-center justify-between p-3 rounded-xl text-xs font-semibold transition-colors whitespace-nowrap ${
                  activeTab === key
                    ? "bg-foreground text-background"
                    : "hover:bg-secondary text-muted-foreground hover:text-foreground"
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  {label}
                </span>
                {badge && <span className="text-[10px] opacity-70">{badge}</span>}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="lg:col-span-9 space-y-6 min-w-0">
            {/* 1. Orders */}
            {activeTab === "orders" && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold tracking-tight">Ваши заказы</h2>
                {user.orders.length === 0 ? (
                  <div className="py-16 text-center border border-dashed border-border rounded-2xl">
                    <ShoppingBag className="w-10 h-10 text-muted-foreground mx-auto mb-3 stroke-[1.25]" />
                    <p className="text-sm text-muted-foreground">У вас пока нет заказов</p>
                    <Link
                      href="/catalog"
                      className="mt-4 inline-block text-xs uppercase tracking-widest font-semibold link-underline"
                    >
                      Перейти в каталог
                    </Link>
                  </div>
                ) : (
                  user.orders.map((ord) => (
                    <div key={ord.id} className="border border-border rounded-2xl p-6 bg-card space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-4">
                        <div>
                          <div className="flex items-center gap-3">
                            <span className="font-bold text-sm">{ord.orderNumber}</span>
                            <span
                              className={`px-2.5 py-0.5 rounded-full border text-[11px] font-semibold ${ord.statusColor}`}
                            >
                              {ord.status}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">Оформлен: {ord.date}</p>
                        </div>
                        <div className="sm:text-right">
                          <span className="text-xs text-muted-foreground">Итоговая сумма:</span>
                          <div className="font-bold text-base tabular-nums whitespace-nowrap">
                            {formatPrice(ord.total)}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3">
                        {ord.items.map((it, idx) => (
                          <div key={idx} className="flex items-center gap-3 text-xs">
                            <div className="relative w-12 h-16 rounded-md overflow-hidden bg-secondary flex-shrink-0">
                              <Image
                                src={it.image}
                                alt={it.name}
                                fill
                                sizes="48px"
                                className="object-cover"
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium truncate">{it.name}</h4>
                              <p className="text-muted-foreground mt-0.5">
                                {it.color} · Размер {it.size} · {it.quantity} шт.
                              </p>
                            </div>
                            <span className="font-semibold flex-shrink-0 whitespace-nowrap tabular-nums">
                              {formatPrice(it.price)}
                            </span>
                          </div>
                        ))}
                      </div>

                      <div className="bg-secondary/40 p-3 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                        <div>
                          <span className="text-muted-foreground">Трек-номер: </span>
                          <span className="font-mono font-medium">{ord.trackingNumber}</span>
                        </div>
                        <span className="text-muted-foreground">
                          {ord.deliveryType} ({ord.deliveryCity})
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* 1b. Favorites */}
            {activeTab === "favorites" && (
              <div className="space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 className="text-xl font-bold tracking-tight">Избранные изделия</h2>
                  <Link
                    href="/catalog"
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Смотреть весь каталог →
                  </Link>
                </div>

                {favoriteProducts.length === 0 ? (
                  <div className="py-16 text-center border border-dashed border-border rounded-2xl">
                    <Heart className="w-10 h-10 text-muted-foreground mx-auto mb-3 stroke-[1.25]" />
                    <p className="text-sm text-muted-foreground">В избранном пока нет изделий</p>
                    <Link
                      href="/catalog"
                      className="mt-4 inline-block text-xs uppercase tracking-widest font-semibold link-underline"
                    >
                      Перейти в каталог
                    </Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {favoriteProducts.map((product) => (
                      <div
                        key={product.id}
                        className="group border border-border rounded-2xl overflow-hidden bg-card flex flex-col justify-between"
                      >
                        <div className="relative aspect-[3/4] bg-secondary overflow-hidden">
                          <Link href={`/product/${product.slug}`}>
                            <Image
                              src={product.images[0]}
                              alt={product.name}
                              fill
                              sizes="(max-width: 640px) 100vw, 33vw"
                              className="object-cover transition-transform duration-500 group-hover:scale-105"
                            />
                          </Link>
                          <button
                            type="button"
                            onClick={() => removeFavorite(product.id)}
                            title="Убрать из избранного"
                            className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-white/85 dark:bg-black/65 backdrop-blur-sm flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div className="p-4 space-y-2">
                          <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
                            {product.category}
                          </span>
                          <Link
                            href={`/product/${product.slug}`}
                            className="block font-serif text-sm font-medium line-clamp-2 hover:opacity-75 transition-opacity"
                          >
                            {product.name}
                          </Link>
                          <div className="flex items-center justify-between gap-2 pt-1">
                            <span className="text-sm font-semibold tabular-nums">
                              {formatPrice(product.price)}
                            </span>
                            <Link
                              href={`/product/${product.slug}`}
                              className="text-[11px] uppercase tracking-wider font-semibold underline"
                            >
                              Подробнее
                            </Link>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 2. Bonus System */}
            {activeTab === "bonuses" && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold tracking-tight">Бонусная программа лояльности</h2>

                <div className="border border-border rounded-2xl p-6 bg-card space-y-4">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <span className="text-xs text-muted-foreground uppercase tracking-wider">
                        Текущий уровень
                      </span>
                      <h3 className="text-2xl font-extrabold mt-0.5">{user.bonusLevel.name}</h3>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <span className="text-xs text-muted-foreground">Кешбэк</span>
                      <div className="text-2xl font-extrabold text-[hsl(var(--accent))] tabular-nums">
                        {user.bonusLevel.percent}%
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5 pt-2">
                    <div className="flex flex-wrap justify-between gap-2 text-xs text-muted-foreground">
                      <span className="tabular-nums">
                        Сумма покупок: {formatPrice(user.bonusLevel.currentPurchases)}
                      </span>
                      <span className="tabular-nums">
                        До след. уровня: {formatPrice(user.bonusLevel.nextLevelAt)}
                      </span>
                    </div>
                    <div className="w-full h-2.5 rounded-full bg-secondary overflow-hidden">
                      <div
                        className="h-full bg-foreground rounded-full transition-all duration-500"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  </div>

                  <div className="pt-3 border-t border-border">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                      Привилегии вашего статуса:
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {user.bonusLevel.privileges.map((p, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs">
                          <CheckCircle2 className="w-3.5 h-3.5 text-green-600 flex-shrink-0" />
                          <span>{p}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {user.bonusHistory.length > 0 && (
                  <div className="border border-border rounded-2xl p-6 bg-card space-y-4">
                    <h3 className="font-bold text-sm">История начислений и списаний</h3>
                    <div className="divide-y divide-border">
                      {user.bonusHistory.map((bh) => (
                        <div
                          key={bh.id}
                          className="py-3 flex items-center justify-between gap-3 text-xs"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="font-medium break-words">{bh.description}</p>
                            <span className="text-[11px] text-muted-foreground">{bh.date}</span>
                          </div>
                          <span
                            className={`font-bold text-sm flex-shrink-0 whitespace-nowrap tabular-nums ${
                              bh.amount > 0 ? "text-green-600" : "text-amber-600"
                            }`}
                          >
                            {bh.amount > 0
                              ? `+${bh.amount.toLocaleString()}`
                              : bh.amount.toLocaleString()}{" "}
                            ₸
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 3. SABYR CLUB */}
            {activeTab === "club" && (
              <div className="space-y-6">
                {user.clubMembership.isActive ? (
                  <div className="border border-border rounded-2xl p-6 bg-sabyr-black text-white space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-[hsl(var(--accent))] text-xs font-bold uppercase tracking-widest">
                        <Crown className="w-4 h-4" /> Членство активно
                      </div>
                      <span className="text-xs text-white/50">
                        Действует до {user.clubMembership.validUntil}
                      </span>
                    </div>
                    <h3 className="text-2xl font-bold tracking-tight">
                      {user.clubMembership.tier}
                    </h3>
                    <p className="text-sm text-white/70">
                      Вам открыт доступ ко всем закрытым показам, закрытым дропам и приоритетной линии консьерж-сервиса SABYR.
                    </p>
                    <Link
                      href="/club#exclusive"
                      className="inline-flex px-5 py-2.5 bg-[hsl(var(--accent))] text-black font-semibold rounded-full text-xs hover:opacity-90"
                    >
                      Смотреть закрытые дропы
                    </Link>
                  </div>
                ) : (
                  <div className="text-center py-12 border border-dashed border-border rounded-2xl space-y-4">
                    <Crown className="w-10 h-10 text-[hsl(var(--accent))] mx-auto" />
                    <p className="font-serif text-xl font-light">Вы ещё не в клубе</p>
                    <p className="text-xs text-muted-foreground max-w-xs mx-auto leading-relaxed">
                      SABYR CLUB открывает доступ к закрытым дропам, индивидуальному пошиву и консьерж-сервису.
                    </p>
                    <Link
                      href="/club"
                      className="inline-flex px-6 py-3 bg-foreground text-background text-xs uppercase tracking-widest font-semibold rounded-full hover:opacity-90"
                    >
                      Узнать о клубе
                    </Link>
                  </div>
                )}
              </div>
            )}

            {/* 4. Addresses */}
            {activeTab === "addresses" && (
              <div className="space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 className="text-xl font-bold tracking-tight">Сохранённые адреса</h2>
                  <button
                    onClick={() => setIsAddingAddress(!isAddingAddress)}
                    className="px-4 py-2 border border-border rounded-full text-xs font-semibold hover:bg-secondary transition-colors flex-shrink-0"
                  >
                    {isAddingAddress ? "Отмена" : "+ Добавить адрес"}
                  </button>
                </div>

                {isAddingAddress && (
                  <form
                    onSubmit={handleAddAddress}
                    className="p-5 border border-border rounded-2xl bg-card space-y-4"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[11px] text-muted-foreground">Название (Дом, Офис)</label>
                        <input
                          type="text"
                          required
                          value={newAddrTitle}
                          onChange={(e) => setNewAddrTitle(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-xs"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] text-muted-foreground">Город</label>
                        <input
                          type="text"
                          required
                          value={newAddrCity}
                          onChange={(e) => setNewAddrCity(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-xs"
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] text-muted-foreground">Улица, дом, квартира</label>
                      <input
                        type="text"
                        required
                        placeholder="пр. Достык 180, кв. 45"
                        value={newAddrStreet}
                        onChange={(e) => setNewAddrStreet(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-xs"
                      />
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
                        <input
                          type="checkbox"
                          checked={newAddrDefault}
                          onChange={(e) => setNewAddrDefault(e.target.checked)}
                          className="accent-foreground"
                        />
                        Сделать адресом по умолчанию
                      </label>
                      <button
                        type="submit"
                        disabled={addressSaving}
                        className="px-5 py-2 bg-foreground text-background rounded-full text-xs font-semibold hover:opacity-90"
                      >
                        {addressSaving ? "Сохранение..." : "Сохранить адрес"}
                      </button>
                    </div>
                  </form>
                )}

                {user.addresses.length === 0 ? (
                  <div className="py-12 text-center border border-dashed border-border rounded-2xl text-sm text-muted-foreground">
                    <MapPin className="w-8 h-8 mx-auto mb-3 stroke-[1.25]" />
                    Сохранённых адресов нет
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {user.addresses.map((addr) => (
                      <div
                        key={addr.id}
                        className="p-5 border border-border rounded-2xl bg-card space-y-2 flex flex-col justify-between"
                      >
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-bold text-sm">{addr.title}</span>
                            <div className="flex items-center gap-2">
                              {addr.isDefault && (
                                <span className="px-2 py-0.5 bg-secondary text-[10px] rounded-full font-medium flex-shrink-0">
                                  По умолчанию
                                </span>
                              )}
                              <button
                                onClick={() => handleDeleteAddress(addr.id)}
                                className="text-muted-foreground hover:text-foreground transition-colors p-1"
                                title="Удалить адрес"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                          <p className="text-xs text-muted-foreground">{addr.city}</p>
                          <p className="text-xs font-medium break-words">{addr.street}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 5. Gift Cards */}
            {activeTab === "giftcards" && (
              <div className="space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 className="text-xl font-bold tracking-tight">Ваши подарочные сертификаты</h2>
                  <Link
                    href="/gift-cards"
                    className="px-4 py-2 bg-foreground text-background rounded-full text-xs font-semibold hover:opacity-90 transition-opacity flex-shrink-0"
                  >
                    Купить сертификат
                  </Link>
                </div>

                {user.giftCards.length === 0 ? (
                  <div className="py-12 text-center border border-dashed border-border rounded-2xl text-sm text-muted-foreground">
                    <Gift className="w-8 h-8 mx-auto mb-3 stroke-[1.25]" />
                    У вас нет активных сертификатов
                  </div>
                ) : (
                  user.giftCards.map((gc) => (
                    <div key={gc.id} className="border border-border rounded-2xl p-6 bg-card space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-mono text-base font-bold break-all">{gc.code}</span>
                        <span className="px-2.5 py-0.5 bg-green-50 dark:bg-green-950 text-green-700 text-xs font-semibold rounded-full flex-shrink-0">
                          {gc.isUsed ? "Использован" : "Активен"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-2 text-xs pt-2 border-t border-border">
                        <span className="text-muted-foreground">Остаток баланса:</span>
                        <span className="font-bold text-sm tabular-nums whitespace-nowrap">
                          {formatPrice(gc.balance)}
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground">
                        Срок действия: до {gc.expiresAt}
                      </p>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* 6. Promos */}
            {activeTab === "promos" && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold tracking-tight">Персональные предложения</h2>
                <div className="p-6 border border-dashed border-border rounded-2xl bg-card space-y-3">
                  <div className="flex items-center gap-2 text-xs uppercase font-bold text-[hsl(var(--accent))]">
                    <Percent className="w-4 h-4 flex-shrink-0" /> Специальный промокод для вас
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-mono text-xl font-extrabold tracking-wider">SABYR10</span>
                    <span className="px-3 py-1 bg-secondary rounded-full text-xs font-bold flex-shrink-0">
                      Скидка -10%
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Действует на любую вещь из нового дропа при оформлении заказа в корзине.
                  </p>
                </div>
              </div>
            )}

            {/* 7. Notifications */}
            {activeTab === "notifications" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold tracking-tight">Уведомления и подписки</h2>
                  <p className="text-xs text-muted-foreground mt-1">
                    Управляйте тем, какие сообщения вы хотите получать от SABYR.
                  </p>
                </div>

                <div className="border border-border rounded-2xl p-6 bg-card space-y-6 divide-y divide-border">
                  {[
                    {
                      label: "Новые дропы и коллекции",
                      desc: "Мгновенные оповещения о релизе новых линеек и сезонных коллекций",
                      value: notifyDrops,
                      onChange: setNotifyDrops,
                    },
                    {
                      label: "Закрытые события SABYR CLUB",
                      desc: "Приглашения на закрытые показы в бутики Алматы и Астаны",
                      value: notifyClub,
                      onChange: setNotifyClub,
                    },
                    {
                      label: "SMS и WhatsApp оповещения",
                      desc: "Статусы доставки, трек-номера и персональные промокоды",
                      value: notifySms,
                      onChange: setNotifySms,
                    },
                    {
                      label: "Email-дайджест Atelier SABYR",
                      desc: "Гид по стилю, капсульные лукбуки и обзоры итальянских тканей",
                      value: notifyEmail,
                      onChange: setNotifyEmail,
                    },
                  ].map((item, idx) => (
                    <div
                      key={idx}
                      className={`flex items-center justify-between gap-4 ${
                        idx > 0 ? "pt-6" : "pt-0"
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <h4 className="text-sm font-semibold">{item.label}</h4>
                        <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={item.value}
                        onChange={(e) => item.onChange(e.target.checked)}
                        className="w-4 h-4 accent-foreground rounded cursor-pointer flex-shrink-0"
                      />
                    </div>
                  ))}
                </div>

                <div className="p-4 bg-secondary/50 rounded-xl text-xs text-muted-foreground">
                  Мы строго соблюдаем закон РК о персональных данных. Вы можете изменить настройки или отказаться от уведомлений в любой момент.
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
