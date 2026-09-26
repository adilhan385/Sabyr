"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Camera,
  RefreshCw,
  ShoppingBag,
  Check,
  ShieldCheck,
  Briefcase,
  Building2,
  Gem,
  Moon,
  Award,
  BookOpen,
  Compass,
  Music,
  Sun,
  Eye,
  Share2,
  History,
  BookmarkCheck,
  ArrowLeft,
  Crown,
  Lock,
} from "lucide-react";
import { PRODUCTS, ProductItem } from "@/data/mockData";
import { formatPrice } from "@/lib/utils";
import { useCartStore } from "@/store/cart";
import { useSabySession } from "@/hooks/useSabySession";

const OCCASIONS = [
  { id: "interview", label: "Интервью / Собеседование", icon: Briefcase, note: "Сдержанный авторитет и уверенность" },
  { id: "business", label: "Деловая встреча", icon: Building2, note: "Статусность, безупречный крой" },
  { id: "wedding", label: "Свадьба / Той", icon: Gem, note: "Торжественный вечерний шик" },
  { id: "date", label: "Свидание", icon: Moon, note: "Интригующий силуэт и мягкие фактуры" },
  { id: "birthday", label: "День рождения", icon: Award, note: "Праздничный акцентный образ" },
  { id: "university", label: "Университет / Лекция", icon: BookOpen, note: "Интеллектуальный преппи-минимализм" },
  { id: "walk", label: "Прогулка по городу", icon: Compass, note: "Расслабленный комфорт и теплые слои" },
  { id: "party", label: "Вечеринка", icon: Music, note: "Скульптурные линии, акцент на детали" },
  { id: "everyday", label: "Повседневный образ", icon: Sun, note: "Базовая безукоризненная капсула" },
];

const STYLES = [
  { id: "minimalism", label: "Чистый Минимализм" },
  { id: "old_money", label: "Quiet Luxury / Old Money" },
  { id: "business_casual", label: "Smart Business" },
  { id: "monochrome", label: "Тотальный Монохром" },
];

const COLOR_PALETTES = [
  { id: "monochrome_dark", label: "Черный / Графит / Уголь", colors: ["#0A0A0A", "#262626", "#404040"] },
  { id: "warm_neutrals", label: "Беж / Песок / Молоко", colors: ["#E7DFD5", "#C5B49C", "#F5F2EB"] },
  { id: "contrast", label: "Контраст Чёрного и Белого", colors: ["#0A0A0A", "#FFFFFF"] },
];

const SIZES = ["XS", "S", "M", "L", "XL"];

export interface SavedLook {
  id: string;
  createdAt: string;
  occasionId: string;
  occasionLabel: string;
  items: ProductItem[];
  rationale: string;
  totalPrice: number;
}

export default function AiStylistPage() {
  const [step, setStep] = useState<"form" | "loading" | "result">("form");
  const [selectedOccasion, setSelectedOccasion] = useState(OCCASIONS[0].id);
  const [selectedStyle, setSelectedStyle] = useState(STYLES[0].id);
  const [selectedPalette, setSelectedPalette] = useState(COLOR_PALETTES[0].id);
  const [selectedSize, setSelectedSize] = useState("S");
  const [userQuery, setUserQuery] = useState("");
  const [userPhoto, setUserPhoto] = useState<string | null>(null);

  // Result outfit state
  const [lookItems, setLookItems] = useState<ProductItem[]>([]);
  const [aiRationale, setAiRationale] = useState("");
  const [addedAllToCart, setAddedAllToCart] = useState(false);
  const [copiedShare, setCopiedShare] = useState(false);

  // History of generated looks (hydrated after mount to prevent SSR/CSR mismatch)
  const [savedLooks, setSavedLooks] = useState<SavedLook[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  const { addItem, openCart } = useCartStore();
  const { user, isLoading, isGuest } = useSabySession();
  const hasClubAccess = Boolean(user.clubMembership?.isActive || user.role === "ADMIN");

  const [catalogProducts, setCatalogProducts] = useState<ProductItem[]>(PRODUCTS);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("sabyr_stylist_history");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          requestAnimationFrame(() => setSavedLooks(parsed));
        }
      }
    } catch {
      // Ignore storage read errors
    }

    fetch("/api/products")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.products)) {
          setCatalogProducts(data.products);
        }
      })
      .catch(() => {
        // Fallback to initial catalog products silently
      });
  }, []);


  const saveLookToHistory = (items: ProductItem[], rationale: string, occasionId: string) => {
    try {
      const occasionObj = OCCASIONS.find((o) => o.id === occasionId);
      const total = items.reduce((acc, it) => acc + it.price, 0);
      const newSaved: SavedLook = {
        id: `look-${Date.now()}`,
        createdAt: new Date().toLocaleDateString("ru-RU", { day: "numeric", month: "long" }),
        occasionId,
        occasionLabel: occasionObj?.label || "Индивидуальный образ",
        items,
        rationale,
        totalPrice: total,
      };
      const updated = [newSaved, ...savedLooks.filter((l) => l.id !== newSaved.id)].slice(0, 10);
      setSavedLooks(updated);
      localStorage.setItem("sabyr_stylist_history", JSON.stringify(updated));
    } catch {
      // Ignore
    }
  };

  const handleShareLook = async () => {
    const shareText = `Капсульный образ SABYR для «${OCCASIONS.find((o) => o.id === selectedOccasion)?.label}». Посмотрите подборку на sabyr.kz/ai-stylist`;
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: "Образ от SABYR AI Stylist",
          text: shareText,
          url: window.location.href,
        });
        return;
      } catch {
        // Fallback to clipboard
      }
    }
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      await navigator.clipboard.writeText(window.location.href);
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 2500);
    }
  };


  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setUserPhoto(url);
    }
  };

  const handleGenerate = async () => {
    setStep("loading");

    try {
      const res = await fetch("/api/ai/stylist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          occasion: selectedOccasion,
          style: selectedStyle,
          palette: selectedPalette,
          size: selectedSize,
          query: userQuery,
        }),
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.items) && data.items.length > 0) {
        setLookItems(data.items);
        setAiRationale(data.rationale);
        saveLookToHistory(data.items, data.rationale, selectedOccasion);
        setStep("result");
        return;
      }
    } catch {
      // Fallback to local curated catalog matching
    }

    // Curated catalog engine matching ONLY from live catalog database (including admin items)
    const available = catalogProducts.filter((p) => p.variants.some((v) => v.stock > 0));
    let selected: ProductItem[] = [];

    if (selectedOccasion === "interview" || selectedOccasion === "business") {
      selected = available.filter((p) =>
        p.category.includes("Пиджаки") ||
        p.category.includes("Брюки") ||
        p.category.includes("Рубашки") ||
        p.occasionTags.includes("деловая встреча")
      ).slice(0, 4);
      setAiRationale(
        "Образ подобран исключительно из каталога SABYR с учетом делового дресс-кода: баланс архитектурной строгости жакета, комфортной посадки брюк и чистоты линий."
      );
    } else if (selectedOccasion === "wedding" || selectedOccasion === "party") {
      selected = available.filter((p) =>
        p.category.includes("Платья") ||
        p.category.includes("Пальто") ||
        p.occasionTags.includes("свадьба / той")
      ).slice(0, 3);
      setAiRationale(
        "Вечерний торжественный образ из актуальной коллекции: утонченный силуэт, благородные ткани и премиальная фурнитура."
      );
    } else {
      selected = available.slice(0, 3);
      setAiRationale(
        "Функциональная капсула на каждый день из каталога SABYR: проверенные силуэты, гармонирующие между собой."
      );
    }

    if (selected.length === 0) selected = available.slice(0, 3);
    setLookItems(selected);
    saveLookToHistory(selected, aiRationale, selectedOccasion);
    setStep("result");
  };

  const loadSavedLook = (look: SavedLook) => {
    setLookItems(look.items);
    setAiRationale(look.rationale);
    setSelectedOccasion(look.occasionId);
    setShowHistory(false);
    setStep("result");
  };


  const handleSwapItem = (index: number) => {
    // Pick another available item strictly from current catalog database
    const currentItem = lookItems[index];
    const alternates = catalogProducts.filter((p) => p.id !== currentItem.id && p.variants.some((v) => v.stock > 0));
    if (alternates.length > 0) {
      const sameCategoryAlternates = alternates.filter((p) => p.category === currentItem.category);
      const pool = sameCategoryAlternates.length > 0 ? sameCategoryAlternates : alternates;
      const nextIndex = (index + 1) % pool.length;
      const nextItem = pool[nextIndex];
      const updated = [...lookItems];
      updated[index] = nextItem;
      setLookItems(updated);
    }
  };

  const handleAddAllToCart = () => {
    lookItems.forEach((item) => {
      const variant = item.variants.find((v) => v.size === selectedSize && v.stock > 0) || item.variants[0];
      addItem({
        id: item.id,
        productId: item.id,
        variantId: variant.id,
        name: item.name,
        price: item.price,
        image: item.images[0],
        color: variant.color,
        size: variant.size,
        quantity: 1,
        slug: item.slug,
      });
    });

    setAddedAllToCart(true);
    setTimeout(() => {
      openCart();
      setAddedAllToCart(false);
    }, 800);
  };

  const totalLookPrice = lookItems.reduce((acc, it) => acc + it.price, 0);

  if (!isLoading && !hasClubAccess) {
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
            Персональный AI-Стилист и AI-Подбор образов
          </h1>
          <p className="text-white/70 text-sm md:text-base leading-relaxed font-light">
            Индивидуальный нейросетевой подбор капсульного гардероба и виртуальная примерочная доступны исключительно резидентам закрытого клуба <strong className="text-[#C9A84C] font-semibold">SABYR CLUB</strong>.
          </p>
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
    <main className="min-h-screen pb-24">
      {/* Hero Header */}
      <section className="bg-sabyr-black text-white pt-12 pb-16 border-b border-white/10">
        <div className="container max-w-4xl text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 text-[hsl(var(--accent))] text-xs font-semibold uppercase tracking-wider mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            Интеллектуальный Стилист <span className="font-brand tracking-[0.15em]">SABYR</span>
          </div>
          <h1 className="font-serif text-3xl md:text-5xl lg:text-6xl font-light tracking-wide mb-4 text-white">
            Персональный гардеробный образ за пару кликов
          </h1>
          <p className="text-white/75 text-base md:text-lg max-w-2xl mx-auto leading-relaxed font-light">
            ИИ подбирает гармоничный образ исключительно из коллекции <span className="font-brand tracking-[0.16em] text-white">SABYR</span>, сверяясь с остатками на складе в режиме реального времени.
          </p>

          {savedLooks.length > 0 && (
            <div className="flex justify-center mt-6">
              <button
                type="button"
                onClick={() => setShowHistory(!showHistory)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/20 text-xs text-white/90 hover:bg-white/10 transition-colors"
              >
                <History className="w-3.5 h-3.5 text-[hsl(var(--accent))]" />
                {showHistory ? "Скрыть историю образов" : `История сохранённых образов (${savedLooks.length})`}
              </button>
            </div>
          )}
        </div>
      </section>

      {/* History Drawer / Panel */}
      {showHistory && savedLooks.length > 0 && (
        <div className="bg-secondary/40 border-b border-border py-8">
          <div className="container max-w-4xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <BookmarkCheck className="w-4 h-4 text-[hsl(var(--accent))]" /> Ваши сохранённые капсулы
              </h3>
              <button
                onClick={() => setShowHistory(false)}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Закрыть
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {savedLooks.map((look) => (
                <div
                  key={look.id}
                  onClick={() => loadSavedLook(look)}
                  className="p-4 rounded-xl border border-border bg-card hover:border-foreground/50 transition-all cursor-pointer space-y-3"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-foreground">{look.occasionLabel}</span>
                    <span className="text-muted-foreground">{look.createdAt}</span>
                  </div>
                  <div className="flex items-center gap-2 overflow-hidden">
                    {look.items.map((it, idx) => (
                      <div key={idx} className="relative w-12 h-16 rounded bg-secondary overflow-hidden flex-shrink-0">
                        <Image src={it.images[0]} alt={it.name} fill sizes="48px" className="object-cover" />
                      </div>
                    ))}
                    <div className="ml-auto text-right">
                      <span className="text-[10px] text-muted-foreground">Итого:</span>
                      <p className="font-bold text-xs">{formatPrice(look.totalPrice)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Content Form */}
      <div className="container max-w-4xl pt-10">
        <AnimatePresence mode="wait">

          {step === "form" && (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-10"
            >
              {/* Photo Upload (Optional) */}
              <div className="border border-dashed border-border rounded-2xl p-6 text-center bg-card">
                <div className="max-w-md mx-auto">
                  {userPhoto ? (
                    <div className="flex flex-col items-center gap-4">
                      <div className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-foreground">
                        <Image src={userPhoto} alt="User" fill className="object-cover" />
                      </div>
                      <p className="text-sm font-medium">Фото загружено и готово к анализу цветотипа</p>
                      <button
                        onClick={() => setUserPhoto(null)}
                        className="text-xs text-muted-foreground hover:text-red-500 underline"
                      >
                        Удалить фото
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center mx-auto mb-3">
                        <Camera className="w-6 h-6 text-foreground" />
                      </div>
                      <h3 className="font-semibold text-base mb-1">Загрузите ваше фото (по желанию)</h3>
                      <p className="text-xs text-muted-foreground mb-4">
                        ИИ определит контрастность внешности и подберёт комплементарную палитру
                      </p>
                      <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 border border-border rounded-full text-xs font-medium hover:bg-secondary transition-colors">
                        <span>Выбрать снимок</span>
                        <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                      </label>
                    </>
                  )}
                </div>
              </div>

              {/* Occasion Selection */}
              <div>
                <label className="block text-sm font-semibold mb-3">
                  1. Куда вы собираетесь? <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {OCCASIONS.map((occ) => {
                    const Icon = occ.icon;
                    return (
                      <button
                        key={occ.id}
                        onClick={() => setSelectedOccasion(occ.id)}
                        className={`text-left p-4 rounded-xl border transition-all ${
                          selectedOccasion === occ.id
                            ? "border-foreground bg-secondary/50 shadow-sm"
                            : "border-border hover:border-foreground/40 bg-card"
                        }`}
                      >
                        <div className="w-8 h-8 rounded-lg bg-secondary/80 flex items-center justify-center mb-2.5 text-foreground">
                          <Icon className="w-4 h-4 stroke-[1.5]" />
                        </div>
                        <span className="font-medium text-sm block">{occ.label}</span>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{occ.note}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Style Selection */}
              <div>
                <label className="block text-sm font-semibold mb-3">2. Желаемый стиль</label>
                <div className="flex flex-wrap gap-2.5">
                  {STYLES.map((st) => (
                    <button
                      key={st.id}
                      onClick={() => setSelectedStyle(st.id)}
                      className={`px-4 py-2.5 rounded-full text-sm font-medium border transition-all ${
                        selectedStyle === st.id
                          ? "bg-foreground text-background border-foreground"
                          : "border-border bg-card hover:border-foreground/50"
                      }`}
                    >
                      {st.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Color Palettes */}
              <div>
                <label className="block text-sm font-semibold mb-3">3. Цветовые предпочтения</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {COLOR_PALETTES.map((pal) => (
                    <button
                      key={pal.id}
                      onClick={() => setSelectedPalette(pal.id)}
                      className={`p-3.5 rounded-xl border text-left flex items-center justify-between ${
                        selectedPalette === pal.id
                          ? "border-foreground bg-secondary/40"
                          : "border-border bg-card hover:border-foreground/40"
                      }`}
                    >
                      <span className="text-xs font-medium">{pal.label}</span>
                      <div className="flex -space-x-1">
                        {pal.colors.map((c, i) => (
                          <div
                            key={i}
                            className="w-4 h-4 rounded-full border border-border"
                            style={{ backgroundColor: c }}
                          />
                        ))}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Size & Free Query */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-2">Ваш размер одежды</label>
                  <div className="flex gap-1.5">
                    {SIZES.map((sz) => (
                      <button
                        key={sz}
                        onClick={() => setSelectedSize(sz)}
                        className={`flex-1 py-2 text-xs font-medium border rounded-lg ${
                          selectedSize === sz
                            ? "bg-foreground text-background border-foreground"
                            : "border-border hover:border-foreground"
                        }`}
                      >
                        {sz}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-sm font-semibold mb-2">Дополнительные пожелания стилисту</label>
                  <input
                    type="text"
                    value={userQuery}
                    onChange={(e) => setUserQuery(e.target.value)}
                    placeholder="Например: 'Хочу выглядеть строго, но свободно, без каблука'"
                    className="w-full px-3.5 py-2.5 text-sm border border-border rounded-lg bg-card focus:outline-none focus:border-foreground"
                  />
                </div>
              </div>

              {/* Submit CTA */}
              <div className="pt-4">
                <button
                  onClick={handleGenerate}
                  className="w-full h-14 bg-foreground text-background font-medium rounded-full text-base flex items-center justify-center gap-2 hover:opacity-90 transition-opacity shadow-lg"
                >
                  <Sparkles className="w-5 h-5 text-[hsl(var(--accent))]" />
                  Собрать образ из каталога SABYR
                </button>
                <div className="flex items-center justify-center gap-2 mt-3 text-xs text-muted-foreground">
                  <ShieldCheck className="w-4 h-4 text-green-600" />
                  Все рекомендованные вещи есть в наличии в выбранном размере
                </div>
              </div>
            </motion.div>
          )}

          {step === "loading" && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="py-24 text-center space-y-6"
            >
              <div className="relative w-16 h-16 mx-auto">
                <div className="w-16 h-16 rounded-full border-2 border-border border-t-foreground animate-spin" />
                <Sparkles className="w-6 h-6 absolute inset-0 m-auto text-[hsl(var(--accent))]" />
              </div>
              <h3 className="text-xl font-bold">ИИ-стилист SABYR собирает ваш образ...</h3>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                Анализируем контекст события, правила пропорций, текстурную гармонию и актуальные остатки на складе
              </p>
            </motion.div>
          )}

          {step === "result" && (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              {/* Header Navigation & Share */}
              <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-border">
                <button
                  onClick={() => setStep("form")}
                  className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1.5 transition-colors py-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5 flex-shrink-0" />
                  Изменить параметры запроса
                </button>

                <button
                  onClick={handleShareLook}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-border bg-card text-xs font-medium hover:bg-secondary transition-all shadow-xs"
                >
                  <Share2 className="w-3.5 h-3.5 flex-shrink-0" />
                  {copiedShare ? "Ссылка скопирована!" : "Поделиться образом"}
                </button>
              </div>

              {/* AI Explanation Banner */}
              <div className="p-6 bg-secondary/50 border border-border rounded-2xl space-y-2">
                <div className="flex items-center gap-2 text-xs font-semibold tracking-wider uppercase text-foreground/70">
                  <Sparkles className="w-4 h-4 text-[hsl(var(--accent))] flex-shrink-0" />
                  Рекомендация экспертного стилиста SABYR
                </div>
                <p className="text-sm md:text-base leading-relaxed text-foreground">
                  {aiRationale}
                </p>
              </div>

              {/* Look Items Grid */}
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="text-lg font-bold">Вещи в капсуле ({lookItems.length})</h2>
                  <span className="text-xs text-muted-foreground flex-shrink-0">Размер: {selectedSize}</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {lookItems.map((item, idx) => (
                    <div
                      key={item.id + idx}
                      className="p-4 border border-border rounded-xl bg-card flex gap-4 items-center justify-between"
                    >
                      <div className="flex gap-3 items-center min-w-0 flex-1">
                        <div className="relative w-16 h-20 rounded-lg overflow-hidden bg-secondary flex-shrink-0">
                          <Image
                            src={item.images[0]}
                            alt={item.name}
                            fill
                            sizes="64px"
                            className="object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="text-[10px] uppercase tracking-wider text-muted-foreground block truncate">
                            {item.category}
                          </span>
                          <h4 className="text-sm font-medium truncate">{item.name}</h4>
                          <p className="text-sm font-semibold mt-1 tabular-nums whitespace-nowrap">{formatPrice(item.price)}</p>
                          <span className="inline-block px-1.5 py-0.5 bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-400 text-[10px] rounded font-medium mt-1">
                            В наличии
                          </span>
                        </div>
                      </div>

                      {/* Swap button */}
                      <button
                        onClick={() => handleSwapItem(idx)}
                        title="Заменить эту вещь"
                        className="p-2 border border-border hover:bg-secondary rounded-full text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Total & Action Bar */}
              <div className="p-6 border border-border rounded-2xl bg-card flex flex-col md:flex-row items-center justify-between gap-4">
                <div>
                  <span className="text-xs text-muted-foreground uppercase tracking-wider">Общая стоимость образа</span>
                  <div className="text-2xl font-bold tabular-nums whitespace-nowrap">{formatPrice(totalLookPrice)}</div>
                </div>

                <div className="flex flex-wrap gap-3 w-full md:w-auto">
                  {/* Link to AI Try-on */}
                  <Link
                    href={`/ai-tryon?lookId=${selectedOccasion}`}
                    className="flex-1 md:flex-none px-4 sm:px-6 py-3.5 border border-foreground font-medium rounded-full text-xs sm:text-sm text-center leading-snug hover:bg-secondary transition-colors inline-flex items-center justify-center gap-2"
                  >
                    <Eye className="w-4 h-4 flex-shrink-0" />
                    Примерить образ на себе
                  </Link>

                  {/* Add All to Cart */}
                  <button
                    onClick={handleAddAllToCart}
                    className={`flex-1 md:flex-none px-4 sm:px-8 py-3.5 rounded-full font-medium text-xs sm:text-sm text-center leading-snug flex items-center justify-center gap-2 transition-all ${
                      addedAllToCart
                        ? "bg-green-600 text-white"
                        : "bg-foreground text-background hover:opacity-90"
                    }`}
                  >
                    {addedAllToCart ? (
                      <>
                        <Check className="w-4 h-4 flex-shrink-0" /> Весь образ в корзине!
                      </>
                    ) : (
                      <>
                        <ShoppingBag className="w-4 h-4 flex-shrink-0" /> Добавить весь образ в корзину
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}
