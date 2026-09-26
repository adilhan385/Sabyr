"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/store/cart";
import { PRODUCTS, ProductItem } from "@/data/mockData";
import { useSabySession } from "@/hooks/useSabySession";
import { formatPrice } from "@/lib/utils";

interface AppearanceProfile {
  colorType: string;
  contrastLevel: string;
  bestPalette: string;
  silhouetteAdvice: string;
  recommendedSize: string;
}

interface CuratedOutfit {
  id: string;
  rank: number;
  title: string;
  badge: string;
  matchScore: number;
  rationale: string;
  stylingTip: string;
  items: ProductItem[];
}

function analyzePhotoMetricsClient(
  dataUrl: string
): Promise<{ brightness: number; contrast: number; warmth: number }> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        const w = 80;
        const h = 80;
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve({ brightness: 125, contrast: 50, warmth: 15 });
          return;
        }
        ctx.drawImage(img, 0, 0, w, h);
        const { data } = ctx.getImageData(0, 0, w, h);
        let lumSum = 0;
        let warmthSum = 0;
        const lums: number[] = [];
        const total = w * h;

        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const lum = 0.299 * r + 0.587 * g + 0.114 * b;
          lumSum += lum;
          warmthSum += r - b;
          lums.push(lum);
        }

        const brightness = Math.round(lumSum / total);
        const warmth = Math.round(warmthSum / total);
        let varianceSum = 0;
        for (const l of lums) {
          varianceSum += (l - brightness) * (l - brightness);
        }
        const contrast = Math.round(Math.sqrt(varianceSum / total));
        resolve({ brightness, contrast, warmth });
      } catch {
        resolve({ brightness: 125, contrast: 50, warmth: 15 });
      }
    };
    img.onerror = () => resolve({ brightness: 125, contrast: 50, warmth: 15 });
    img.src = dataUrl;
  });
}

export default function AIStylistPage() {
  const router = useRouter();
  const { user, isLoading: isSessionLoading } = useSabySession();
  const [catalogProducts, setCatalogProducts] = useState<ProductItem[]>(PRODUCTS);
  const [selectedSize, setSelectedSize] = useState("M");

  // User photo & camera state
  const [userPhoto, setUserPhoto] = useState<string | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraCountdown, setCameraCountdown] = useState<number | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // AI Stylist Results
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [appearanceProfile, setAppearanceProfile] = useState<AppearanceProfile | null>(null);
  const [outfits, setOutfits] = useState<CuratedOutfit[]>([]);
  const [addedOutfitId, setAddedOutfitId] = useState<string | null>(null);

  // Club access lock state
  const [aiClubOnly, setAiClubOnly] = useState(true);
  const [clubPrice, setClubPrice] = useState(25000);
  const [clubMonthlyPrice, setClubMonthlyPrice] = useState(4900);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const addItem = useCartStore((state) => state.addItem);
  const openCart = useCartStore((state) => state.openCart);

  const hasClubAccess = Boolean(
    !aiClubOnly || user?.clubMembership?.isActive || user?.role === "ADMIN"
  );

  const runPhotoStylistAnalysis = useCallback(async (photoBase64: string) => {
    setIsAnalyzing(true);
    try {
      const metrics = await analyzePhotoMetricsClient(photoBase64);
      const res = await fetch("/api/ai/stylist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userPhotoBase64: photoBase64,
          photoMetrics: metrics,
        }),
      });
      const data = await res.json();
      if (data.appearanceProfile) {
        setAppearanceProfile(data.appearanceProfile);
      }
      if (Array.isArray(data.outfits) && data.outfits.length > 0) {
        setOutfits(data.outfits);
      }
    } catch {
      // handled gracefully by fallback
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/settings").then((r) => r.json()).catch(() => null),
      fetch("/api/products").then((r) => r.json()).catch(() => null),
    ]).then(([settingsData, prodData]) => {
      if (settingsData?.club) {
        if (settingsData.club.annual_price) {
          setClubPrice(Number(settingsData.club.annual_price));
        }
        if (settingsData.club.monthly_price) {
          setClubMonthlyPrice(Number(settingsData.club.monthly_price));
        }
        if (settingsData.club.ai_club_only === "false") {
          setAiClubOnly(false);
        } else {
          setAiClubOnly(true);
        }
      }

      if (prodData?.products?.length > 0) {
        setCatalogProducts(prodData.products);
      }
    });
  }, []);

  // Auto-analyze saved photo if user has club access
  useEffect(() => {
    if (!isSessionLoading && hasClubAccess) {
      try {
        const savedPhoto = sessionStorage.getItem("sabyr_user_photo");
        if (savedPhoto && !userPhoto) {
          setUserPhoto(savedPhoto);
          runPhotoStylistAnalysis(savedPhoto);
        }
      } catch {
        // ignore
      }
    }
  }, [isSessionLoading, hasClubAccess, userPhoto, runPhotoStylistAnalysis]);

  // Stop camera on unmount
  useEffect(() => {
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  const startCamera = async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 1080 }, height: { ideal: 1440 } },
        audio: false,
      });
      setCameraActive(true);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
      }, 80);
    } catch {
      setCameraError(
        "Не удалось включить камеру в браузере. Проверьте доступ к камере или загрузите готовое фото."
      );
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((t) => t.stop());
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
    setCameraCountdown(null);
  };

  const captureFromCamera = (withTimer = false) => {
    if (!videoRef.current) return;

    const doCapture = () => {
      const video = videoRef.current;
      if (!video) return;
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth || 720;
      canvas.height = video.videoHeight || 960;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const base64 = canvas.toDataURL("image/jpeg", 0.9);
      setUserPhoto(base64);
      try {
        sessionStorage.setItem("sabyr_user_photo", base64);
      } catch {
        // ignore
      }
      stopCamera();
      runPhotoStylistAnalysis(base64);
    };

    if (!withTimer) {
      doCapture();
      return;
    }

    setCameraCountdown(3);
    let count = 3;
    const interval = setInterval(() => {
      count -= 1;
      if (count <= 0) {
        clearInterval(interval);
        setCameraCountdown(null);
        doCapture();
      } else {
        setCameraCountdown(count);
      }
    }, 1000);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      setUserPhoto(base64);
      try {
        sessionStorage.setItem("sabyr_user_photo", base64);
      } catch {
        // ignore
      }
      runPhotoStylistAnalysis(base64);
    };
    reader.readAsDataURL(file);
  };

  const handleAddOutfitToCart = (outfit: CuratedOutfit) => {
    outfit.items.forEach((product) => {
      const variant =
        product.variants.find((v) => v.size === selectedSize) || product.variants[0];
      addItem({
        id: `${product.id}-${selectedSize}`,
        productId: product.id,
        variantId: variant?.id || `${product.id}-${selectedSize}`,
        name: product.name,
        price: product.price,
        size: selectedSize,
        color: variant?.color || "Стандарт",
        image: product.images[0],
        slug: product.slug,
        quantity: 1,
      });
    });
    setAddedOutfitId(outfit.id);
    openCart();
    setTimeout(() => setAddedOutfitId(null), 2500);
  };

  const handleTryOnOutfit = (outfit: CuratedOutfit) => {
    const primary = outfit.items[0];
    const secondary = outfit.items[1];
    if (!primary) return;
    const params = new URLSearchParams({
      productId: primary.id,
      autoTryOn: "1",
    });
    if (secondary) {
      params.set("secondProductId", secondary.id);
    }
    router.push(`/ai-tryon?${params.toString()}`);
  };

  const handleSwapItemInOutfit = (outfitId: string, itemIndex: number) => {
    if (catalogProducts.length === 0) return;
    setOutfits((prev) =>
      prev.map((o) => {
        if (o.id !== outfitId) return o;
        const currentItem = o.items[itemIndex];
        const otherIds = o.items.map((i) => i.id);
        const candidates = catalogProducts.filter((p) => !otherIds.includes(p.id));
        if (candidates.length === 0) return o;
        const nextCandidate =
          candidates.find((p) => p.category === currentItem?.category) || candidates[0];
        const nextItems = [...o.items];
        nextItems[itemIndex] = nextCandidate;
        return { ...o, items: nextItems };
      })
    );
  };

  if (isSessionLoading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] pt-24 pb-20 flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-[#C9A84C] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!hasClubAccess) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] text-[#F5F0EB] pt-24 pb-20 flex items-center justify-center px-6">
        <div className="max-w-xl w-full bg-[#111111] border border-[#C9A84C]/30 p-8 md:p-12 text-center">
          <p className="text-[11px] uppercase tracking-[0.35em] text-[#C9A84C] mb-4">
            SABYR CLUB EXCLUSIVE
          </p>
          <h1
            className="text-3xl md:text-4xl font-light mb-4"
            style={{ fontFamily: "var(--font-cormorant), Georgia, serif" }}
          >
            AI-Стилист по фото доступен только участникам SABYR CLUB
          </h1>
          <p className="text-sm text-[#8A8279] leading-relaxed mb-8">
            Сфотографируйте себя — и искусственный интеллект без анкет и опросов подберёт 3 лучших
            готовых образа из всей коллекции SABYR под ваш типаж. Доступ открыт только резидентам
            закрытого клуба.
          </p>

          <div className="bg-[#0A0A0A] border border-[#222222] p-5 mb-8 text-left space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#8A8279] uppercase tracking-widest">Месячный доступ</span>
              <span className="text-[#F5F0EB] font-medium">
                {formatPrice(clubMonthlyPrice)} / мес
              </span>
            </div>
            <div className="flex items-center justify-between text-xs pt-2 border-t border-[#1A1A1A]">
              <span className="text-[#8A8279] uppercase tracking-widest">Годовое членство</span>
              <span className="text-[#C9A84C] font-medium">{formatPrice(clubPrice)} / год</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href="/club"
              className="flex-1 py-4 bg-[#C9A84C] text-[#0A0A0A] text-xs font-semibold uppercase tracking-[0.2em] hover:bg-[#E2C56D] transition-colors text-center"
            >
              Вступить в SABYR CLUB
            </Link>
            {!user && (
              <Link
                href="/account"
                className="flex-1 py-4 border border-[#333333] text-[#F5F0EB] text-xs uppercase tracking-[0.2em] hover:border-[#C9A84C] transition-colors text-center"
              >
                Войти в аккаунт
              </Link>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-[#F5F0EB] pt-24 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 border border-[#C9A84C]/40 bg-[#C9A84C]/10 text-[#C9A84C] text-[10px] tracking-[0.25em] uppercase mb-4">
            SABYR AI Vision Stylist — Без анкет, по вашему фото
          </div>
          <h1
            className="text-3xl md:text-5xl font-light text-[#F5F0EB] tracking-tight mb-3"
            style={{ fontFamily: "var(--font-cormorant), Georgia, serif" }}
          >
            Сфотографируйтесь — AI сам подберёт вам топ-образы
          </h1>
          <p className="text-[#8A8279] text-sm md:text-base leading-relaxed">
            Никаких вопросов и ручного выбора. Сделайте селфи с камеры или загрузите своё фото:
            нейросеть определит ваш цветотип, контрастность и соберёт 3 лучших готовых образа из
            всей коллекции SABYR.
          </p>
        </div>

        {/* PHOTO CAPTURE & APPEARANCE ANALYSIS PANEL */}
        <div className="bg-[#111111] border border-[#222222] p-6 md:p-10 mb-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left: Camera / Photo Box (5 cols) */}
            <div className="lg:col-span-5">
              <div className="relative aspect-[3/4] w-full max-w-md mx-auto bg-[#0D0D0D] border border-[#2A2A2A] overflow-hidden">
                {/* Live Camera Stream */}
                {cameraActive && (
                  <div className="relative w-full h-full">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover scale-x-[-1]"
                    />
                    <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
                      <div className="w-28 h-36 rounded-full border-2 border-dashed border-[#C9A84C]/80 mb-3" />
                      <span className="px-3 py-1 bg-black/75 text-[#F5F0EB] text-[10px] uppercase tracking-widest">
                        Смотрите в камеру при хорошем освещении
                      </span>
                    </div>

                    {cameraCountdown !== null && (
                      <div className="absolute inset-0 bg-black/45 flex items-center justify-center">
                        <span className="font-serif text-7xl text-[#C9A84C] font-bold">
                          {cameraCountdown}
                        </span>
                      </div>
                    )}

                    <div className="absolute bottom-4 inset-x-4 flex gap-2 justify-center">
                      <button
                        type="button"
                        onClick={() => captureFromCamera(false)}
                        className="px-6 py-3 bg-[#C9A84C] text-[#0A0A0A] text-xs uppercase tracking-widest font-semibold hover:bg-[#E2C56D]"
                      >
                        Сфоткаться
                      </button>
                      <button
                        type="button"
                        onClick={() => captureFromCamera(true)}
                        className="px-4 py-3 bg-black/80 text-white border border-white/30 text-xs uppercase tracking-widest"
                      >
                        Таймер 3 сек
                      </button>
                      <button
                        type="button"
                        onClick={stopCamera}
                        className="px-3 py-3 bg-red-900/90 text-white text-xs uppercase tracking-widest"
                      >
                        Отмена
                      </button>
                    </div>
                  </div>
                )}

                {/* Uploaded / Captured Photo */}
                {!cameraActive && userPhoto && (
                  <div className="relative w-full h-full">
                    <img
                      src={userPhoto}
                      alt="Ваше фото для AI-стилиста"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-3 left-3 bg-[#0A0A0A]/90 border border-[#C9A84C]/40 text-[#C9A84C] px-3 py-1.5 text-[10px] uppercase tracking-widest">
                      Ваше фото проанализировано AI
                    </div>
                    {isAnalyzing && (
                      <div className="absolute inset-0 bg-[#0A0A0A]/80 backdrop-blur-sm flex flex-col items-center justify-center text-white p-6 text-center">
                        <div className="w-12 h-12 border-2 border-[#C9A84C] border-t-transparent rounded-full animate-spin mb-4" />
                        <p
                          className="text-xl mb-1"
                          style={{ fontFamily: "var(--font-cormorant), Georgia, serif" }}
                        >
                          AI анализирует ваш типаж и подбирает одежду...
                        </p>
                        <p className="text-xs text-[#C9A84C] uppercase tracking-widest">
                          Сканирование всех капсул каталога SABYR
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Empty State */}
                {!cameraActive && !userPhoto && (
                  <div className="w-full h-full flex flex-col items-center justify-center text-center p-8 bg-[#0D0D0D]">
                    <div className="w-20 h-20 border border-[#C9A84C]/50 flex items-center justify-center mb-5 text-xs uppercase tracking-widest text-[#C9A84C]">
                      AI SCAN
                    </div>
                    <h3
                      className="text-2xl text-[#F5F0EB] mb-2"
                      style={{ fontFamily: "var(--font-cormorant), Georgia, serif" }}
                    >
                      Сделайте селфи или загрузите фото
                    </h3>
                    <p className="text-xs text-[#8A8279] max-w-xs mb-6 leading-relaxed">
                      Вам не нужно ничего выбирать вручную — AI сам оценит ваш цветотип и соберёт
                      лучшие комплекты из всех костюмов, рубашек, поло и брюк SABYR.
                    </p>
                    <div className="flex flex-col gap-3 w-full max-w-xs">
                      <button
                        type="button"
                        onClick={startCamera}
                        className="w-full py-4 bg-[#C9A84C] text-[#0A0A0A] text-xs uppercase tracking-[0.2em] font-semibold hover:bg-[#E2C56D] transition-colors"
                      >
                        Включить камеру и сфоткаться
                      </button>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full py-4 border border-[#333333] text-[#F5F0EB] text-xs uppercase tracking-[0.2em] hover:border-[#C9A84C] transition-colors"
                      >
                        Загрузить готовое фото
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFileUpload}
                className="hidden"
              />

              {cameraError && (
                <div className="mt-3 p-3 bg-red-950/60 border border-red-700/50 text-xs text-red-200">
                  {cameraError}
                </div>
              )}
            </div>

            {/* Right: AI Appearance Profile & Action Controls (7 cols) */}
            <div className="lg:col-span-7 space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#222222]">
                <div>
                  <span className="text-[11px] uppercase tracking-[0.2em] text-[#C9A84C] block mb-1">
                    Персональное досье стиля
                  </span>
                  <h2
                    className="text-2xl md:text-3xl text-[#F5F0EB]"
                    style={{ fontFamily: "var(--font-cormorant), Georgia, serif" }}
                  >
                    {appearanceProfile
                      ? "Результаты AI-сканирования вашей внешности"
                      : "Сделайте фото для автоматического подбора образов"}
                  </h2>
                </div>

                {userPhoto && (
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={startCamera}
                      className="px-4 py-2.5 bg-[#C9A84C] text-[#0A0A0A] text-xs uppercase tracking-widest font-semibold hover:bg-[#E2C56D]"
                    >
                      Переснять с камеры
                    </button>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-4 py-2.5 border border-[#333333] text-[#F5F0EB] text-xs uppercase tracking-widest hover:border-[#C9A84C]"
                    >
                      Другое фото
                    </button>
                  </div>
                )}
              </div>

              {appearanceProfile ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-[#0A0A0A] border border-[#222222] p-5">
                    <span className="text-[10px] uppercase tracking-[0.2em] text-[#C9A84C] block mb-1">
                      Определённый типаж
                    </span>
                    <p
                      className="text-lg text-[#F5F0EB] mb-1"
                      style={{ fontFamily: "var(--font-cormorant), Georgia, serif" }}
                    >
                      {appearanceProfile.colorType}
                    </p>
                    <p className="text-xs text-[#8A8279] leading-relaxed">
                      {appearanceProfile.contrastLevel}
                    </p>
                  </div>

                  <div className="bg-[#0A0A0A] border border-[#222222] p-5">
                    <span className="text-[10px] uppercase tracking-[0.2em] text-[#C9A84C] block mb-1">
                      Идеальная палитра SABYR
                    </span>
                    <p
                      className="text-lg text-[#F5F0EB] mb-1"
                      style={{ fontFamily: "var(--font-cormorant), Georgia, serif" }}
                    >
                      Рекомендованные оттенки
                    </p>
                    <p className="text-xs text-[#8A8279] leading-relaxed">
                      {appearanceProfile.bestPalette}
                    </p>
                  </div>

                  <div className="bg-[#0A0A0A] border border-[#222222] p-5 md:col-span-2">
                    <span className="text-[10px] uppercase tracking-[0.2em] text-[#C9A84C] block mb-1">
                      Архитектура кроя и посадка
                    </span>
                    <p className="text-sm text-[#D5CFC7] leading-relaxed">
                      {appearanceProfile.silhouetteAdvice}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="bg-[#0A0A0A] border border-[#222222] p-6 space-y-3 text-sm text-[#8A8279]">
                  <p className="text-[#F5F0EB] font-medium">
                    Как работает AI-Стилист по вашему фото:
                  </p>
                  <p>
                    1. Вы фотографируетесь на камеру или загружаете любое своё фото — никаких анкет
                    заполнять не нужно.
                  </p>
                  <p>
                    2. Искусственный интеллект анализирует ваш цветотип, контрастность и пропорции
                    плечевого пояса.
                  </p>
                  <p>
                    3. Из всех вещей каталога SABYR автоматически собираются 3 готовых топ-образа,
                    которые вы можете в один клик надеть прямо на своё фото в AI-Примерочной.
                  </p>
                </div>
              )}

              {/* Global Size Selector for adding outfits to cart */}
              <div className="pt-2">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs uppercase tracking-wider text-[#8A8279]">
                    Ваш размер для заказа и примерки:
                  </span>
                  <span className="text-xs text-[#C9A84C]">Полная сетка S – 3XL</span>
                </div>
                <div className="grid grid-cols-6 gap-2 max-w-md">
                  {["S", "M", "L", "XL", "2XL", "3XL"].map((sz) => (
                    <button
                      key={sz}
                      type="button"
                      onClick={() => setSelectedSize(sz)}
                      className={`py-2.5 text-xs font-medium border transition-all ${
                        selectedSize === sz
                          ? "border-[#C9A84C] bg-[#C9A84C] text-[#0A0A0A] font-semibold"
                          : "border-[#2A2A2A] bg-[#0A0A0A] text-[#F5F0EB] hover:border-[#C9A84C]"
                      }`}
                    >
                      {sz}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* TOP-3 CURATED OUTFITS SECTION */}
        {outfits.length > 0 && (
          <div className="space-y-10">
            <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-[#222222] pb-5 gap-4">
              <div>
                <span className="text-[11px] uppercase tracking-[0.25em] text-[#C9A84C] block mb-1">
                  Персональная селекция из всего каталога SABYR
                </span>
                <h2
                  className="text-3xl md:text-4xl text-[#F5F0EB]"
                  style={{ fontFamily: "var(--font-cormorant), Georgia, serif" }}
                >
                  Топ-3 образа специально под ваше фото
                </h2>
              </div>
              <button
                type="button"
                onClick={() => userPhoto && runPhotoStylistAnalysis(userPhoto)}
                disabled={isAnalyzing}
                className="self-start md:self-auto px-5 py-2.5 border border-[#C9A84C] text-xs uppercase tracking-widest text-[#C9A84C] hover:bg-[#C9A84C] hover:text-[#0A0A0A] transition-colors"
              >
                {isAnalyzing ? "Обновление..." : "Пересобрать топ-образы"}
              </button>
            </div>

            <div className="space-y-8">
              {outfits.map((outfit) => {
                const totalOutfitPrice = outfit.items.reduce((acc, p) => acc + p.price, 0);
                return (
                  <div
                    key={outfit.id}
                    className="bg-[#111111] border border-[#222222] p-6 md:p-8"
                  >
                    {/* Outfit Header */}
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 mb-6 border-b border-[#222222]">
                      <div>
                        <div className="flex flex-wrap items-center gap-2.5 mb-2">
                          <span className="px-3 py-1 bg-[#C9A84C] text-[#0A0A0A] text-[10px] uppercase tracking-[0.2em] font-semibold">
                            {outfit.badge}
                          </span>
                          <span className="px-3 py-1 bg-[#0A0A0A] border border-[#2A2A2A] text-[#F5F0EB] text-[10px] uppercase tracking-widest">
                            Совпадение с вашим фото: {outfit.matchScore}%
                          </span>
                        </div>
                        <h3
                          className="text-2xl md:text-3xl text-[#F5F0EB]"
                          style={{ fontFamily: "var(--font-cormorant), Georgia, serif" }}
                        >
                          {outfit.title}
                        </h3>
                      </div>

                      <div className="flex flex-wrap items-center gap-3">
                        <button
                          type="button"
                          onClick={() => handleTryOnOutfit(outfit)}
                          className="px-6 py-3.5 border border-[#C9A84C] text-[#C9A84C] text-xs uppercase tracking-[0.18em] font-medium hover:bg-[#C9A84C] hover:text-[#0A0A0A] transition-colors"
                        >
                          Надеть этот образ на моё фото (AI-Примерка)
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAddOutfitToCart(outfit)}
                          className="px-6 py-3.5 bg-[#C9A84C] text-[#0A0A0A] text-xs uppercase tracking-[0.18em] font-semibold hover:bg-[#E2C56D] transition-colors"
                        >
                          {addedOutfitId === outfit.id
                            ? "Образ добавлен в корзину"
                            : `Купить весь образ (${formatPrice(totalOutfitPrice)})`}
                        </button>
                      </div>
                    </div>

                    {/* Stylist Rationale & Tip */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 bg-[#0A0A0A] border border-[#222222] p-4">
                      <div>
                        <span className="text-[10px] uppercase tracking-widest text-[#8A8279] block mb-1">
                          Почему AI выбрал этот образ под ваше фото:
                        </span>
                        <p className="text-xs md:text-sm text-[#F5F0EB] leading-relaxed">
                          {outfit.rationale}
                        </p>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase tracking-widest text-[#C9A84C] block mb-1">
                          Рекомендация по стилизации:
                        </span>
                        <p className="text-xs md:text-sm text-[#8A8279] leading-relaxed">
                          {outfit.stylingTip}
                        </p>
                      </div>
                    </div>

                    {/* Items in this Outfit */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {outfit.items.map((product, idx) => (
                        <div
                          key={`${outfit.id}-${product.id}`}
                          className="border border-[#222222] bg-[#0A0A0A] flex flex-col justify-between"
                        >
                          <div>
                            <div className="relative aspect-[3/4] bg-[#151515] overflow-hidden">
                              <img
                                src={product.images[0]}
                                alt={product.name}
                                className="w-full h-full object-cover"
                              />
                              <span className="absolute top-3 left-3 bg-[#0A0A0A]/90 border border-[#333333] text-[#F5F0EB] px-2.5 py-1 text-[10px] uppercase tracking-widest">
                                Изделие {idx + 1} · {product.category}
                              </span>
                            </div>
                            <div className="p-4">
                              <Link
                                href={`/product/${product.slug}`}
                                className="text-lg text-[#F5F0EB] hover:text-[#C9A84C] transition-colors block mb-1"
                                style={{ fontFamily: "var(--font-cormorant), Georgia, serif" }}
                              >
                                {product.name}
                              </Link>
                              <p className="text-sm font-medium text-[#C9A84C] mb-2">
                                {formatPrice(product.price)} · Размер {selectedSize}
                              </p>
                              <p className="text-xs text-[#8A8279] line-clamp-2">
                                {product.aiDescription || product.description}
                              </p>
                            </div>
                          </div>

                          <div className="p-4 pt-0 flex gap-2">
                            <Link
                              href={`/ai-tryon?productId=${product.id}&autoTryOn=1`}
                              className="flex-1 py-2.5 bg-[#C9A84C] text-[#0A0A0A] font-semibold text-center text-[10px] uppercase tracking-widest hover:bg-[#E2C56D]"
                            >
                              Надеть на моё фото
                            </Link>
                            <button
                              type="button"
                              onClick={() => handleSwapItemInOutfit(outfit.id, idx)}
                              className="px-3 py-2.5 border border-[#333333] text-[10px] uppercase tracking-widest text-[#8A8279] hover:text-[#F5F0EB] hover:border-[#C9A84C]"
                            >
                              Заменить
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
