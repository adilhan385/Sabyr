"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/store/useCartStore";
import { ProductItem } from "@/data/products";

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
  const [catalogProducts, setCatalogProducts] = useState<ProductItem[]>([]);
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
  const [accessChecked, setAccessChecked] = useState(false);
  const [hasClubAccess, setHasClubAccess] = useState(false);
  const [clubPrice, setClubPrice] = useState(150000);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const addItem = useCartStore((state) => state.addItem);
  const openCart = useCartStore((state) => state.openCart);

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
      fetch("/api/auth/me").then((r) => r.json()).catch(() => ({ user: null })),
      fetch("/api/club").then((r) => r.json()).catch(() => ({ settings: {} })),
      fetch("/api/products").then((r) => r.json()).catch(() => ({ products: [] })),
    ]).then(([authData, clubData, prodData]) => {
      const user = authData?.user;
      const aiClubOnly = clubData?.settings?.ai_club_only !== "false";
      if (clubData?.settings?.annual_price) {
        setClubPrice(Number(clubData.settings.annual_price));
      }
      const allowed = Boolean(!aiClubOnly || (user && (user.isClubMember || user.role === "ADMIN")));
      setHasClubAccess(allowed);
      setAccessChecked(true);

      if (prodData?.products?.length > 0) {
        setCatalogProducts(prodData.products);
      }

      if (allowed) {
        try {
          const savedPhoto = sessionStorage.getItem("sabyr_user_photo");
          if (savedPhoto) {
            setUserPhoto(savedPhoto);
            runPhotoStylistAnalysis(savedPhoto);
          }
        } catch {
          // ignore
        }
      }
    });
  }, [runPhotoStylistAnalysis]);

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
      addItem({
        productId: product.id,
        variantId: `${product.id}-${selectedSize}`,
        name: product.name,
        price: product.price,
        size: selectedSize,
        color: product.variants[0]?.color || "Стандарт",
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

  if (!accessChecked) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] pt-24 pb-20 flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-[#C5A059] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!hasClubAccess) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] pt-28 pb-20 px-4 flex items-center justify-center">
        <div className="max-w-xl w-full bg-[#121212] text-[#F7F5F0] p-8 md:p-12 border border-[#C5A059]/40 shadow-2xl text-center">
          <span className="inline-block text-[10px] uppercase tracking-[0.3em] text-[#C5A059] border border-[#C5A059]/40 px-3 py-1 mb-5">
            Привилегия SABYR CLUB
          </span>
          <h1 className="font-serif text-3xl md:text-4xl mb-4">
            Персональный AI-Стилист по фото закрыт
          </h1>
          <p className="text-sm text-[#A09C94] leading-relaxed mb-8">
            Мгновенный подбор топ-образов по вашей фотографии без анкет и опросов доступен только
            резидентам закрытого клуба SABYR CLUB.
          </p>
          <div className="bg-[#1A1A1A] border border-[#2C2C2C] p-5 mb-8 text-left space-y-2 text-xs text-[#D5D0C5]">
            <p className="text-[#C5A059] uppercase tracking-widest text-[10px] font-medium mb-2">
              Что открывает статус резидента ({clubPrice.toLocaleString("ru-KZ")} ₸ / год):
            </p>
            <p>— Автоматический подбор 3 лучших образов из всей коллекции по одному вашему селфи</p>
            <p>— 3D AI-Примерочная с одеванием вещей прямо на ваше фото</p>
            <p>— Доступ к лимитированным костюмам и закрытым дропам SABYR</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/club"
              className="px-8 py-4 bg-[#C5A059] text-[#121212] text-xs uppercase tracking-[0.2em] font-medium hover:bg-[#d4b06a] transition-colors"
            >
              Вступить в SABYR CLUB
            </Link>
            <Link
              href="/login"
              className="px-8 py-4 border border-[#3A3A3A] text-[#F7F5F0] text-xs uppercase tracking-[0.2em] hover:border-[#C5A059] transition-colors"
            >
              Войти в аккаунт
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF8F5] pt-24 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#1A1A1A] text-[#F7F5F0] text-[10px] tracking-[0.25em] uppercase mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-[#C5A059]" />
            SABYR AI Vision Stylist
          </div>
          <h1 className="font-serif text-3xl md:text-5xl text-[#1A1A1A] tracking-tight mb-3">
            Сфотографируйтесь — AI сам подберёт вам топ-образы
          </h1>
          <p className="text-[#6E6A63] text-sm md:text-base leading-relaxed">
            Никаких анкет и сложных вопросов. Просто сделайте фото с камеры или загрузите снимок:
            искусственный интеллект определит ваш типаж, контрастность и соберёт 3 лучших образа из
            всей коллекции SABYR.
          </p>
        </div>

        {/* PHOTO CAPTURE & APPEARANCE ANALYSIS PANEL */}
        <div className="bg-white border border-[#E8E3DA] p-6 md:p-10 mb-12 shadow-sm">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left: Camera / Photo Box (5 cols) */}
            <div className="lg:col-span-5">
              <div className="relative aspect-[3/4] w-full max-w-md mx-auto bg-[#141414] border border-[#E8E3DA] overflow-hidden">
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
                      <div className="w-28 h-36 rounded-full border-2 border-dashed border-[#C5A059]/80 mb-3" />
                      <span className="px-3 py-1 bg-black/75 text-[#F7F5F0] text-[10px] uppercase tracking-widest">
                        Смотрите в камеру при хорошем освещении
                      </span>
                    </div>

                    {cameraCountdown !== null && (
                      <div className="absolute inset-0 bg-black/45 flex items-center justify-center">
                        <span className="font-serif text-7xl text-white font-bold">
                          {cameraCountdown}
                        </span>
                      </div>
                    )}

                    <div className="absolute bottom-4 inset-x-4 flex gap-2 justify-center">
                      <button
                        type="button"
                        onClick={() => captureFromCamera(false)}
                        className="px-6 py-3 bg-[#C5A059] text-[#121212] text-xs uppercase tracking-widest font-medium hover:bg-[#d4b06a]"
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
                        className="px-3 py-3 bg-red-800/90 text-white text-xs uppercase tracking-widest"
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
                    <div className="absolute top-3 left-3 bg-[#121212]/85 text-[#C5A059] px-3 py-1.5 text-[10px] uppercase tracking-widest">
                      Фото проанализировано AI
                    </div>
                    {isAnalyzing && (
                      <div className="absolute inset-0 bg-[#121212]/75 backdrop-blur-sm flex flex-col items-center justify-center text-white p-6 text-center">
                        <div className="w-12 h-12 border-2 border-[#C5A059] border-t-transparent rounded-full animate-spin mb-4" />
                        <p className="font-serif text-xl mb-1">
                          AI анализирует ваш типаж и подбирает одежду...
                        </p>
                        <p className="text-xs text-[#C5A059] uppercase tracking-widest">
                          Сканирование всех капсул каталога SABYR
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Empty State */}
                {!cameraActive && !userPhoto && (
                  <div className="w-full h-full flex flex-col items-center justify-center text-center p-8 bg-[#FAF8F5]">
                    <div className="w-20 h-20 border border-[#C5A059] flex items-center justify-center mb-5 text-xs uppercase tracking-widest text-[#C5A059]">
                      AI SCAN
                    </div>
                    <h3 className="font-serif text-2xl text-[#1A1A1A] mb-2">
                      Сделайте селфи или загрузите фото
                    </h3>
                    <p className="text-xs text-[#6E6A63] max-w-xs mb-6 leading-relaxed">
                      Вам не нужно ничего выбирать вручную — AI сам оценит ваш цветотип и соберёт
                      лучшие комплекты из всех костюмов, рубашек, поло и брюк SABYR.
                    </p>
                    <div className="flex flex-col gap-3 w-full max-w-xs">
                      <button
                        type="button"
                        onClick={startCamera}
                        className="w-full py-4 bg-[#1A1A1A] text-white text-xs uppercase tracking-[0.2em] font-medium hover:bg-[#333] transition-colors"
                      >
                        Включить камеру и сфоткаться
                      </button>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full py-4 border border-[#1A1A1A] text-[#1A1A1A] text-xs uppercase tracking-[0.2em] hover:bg-white transition-colors"
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
                <div className="mt-3 p-3 bg-amber-50 border border-amber-300 text-xs text-amber-900">
                  {cameraError}
                </div>
              )}
            </div>

            {/* Right: AI Appearance Profile & Action Controls (7 cols) */}
            <div className="lg:col-span-7 space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#E8E3DA]">
                <div>
                  <span className="text-[11px] uppercase tracking-[0.2em] text-[#C5A059] block mb-1">
                    Персональное досье стиля
                  </span>
                  <h2 className="font-serif text-2xl md:text-3xl text-[#1A1A1A]">
                    {appearanceProfile
                      ? "Результаты AI-сканирования вашей внешности"
                      : "Ожидание вашей фотографии"}
                  </h2>
                </div>

                {userPhoto && (
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={startCamera}
                      className="px-4 py-2.5 bg-[#1A1A1A] text-white text-xs uppercase tracking-widest hover:bg-[#333]"
                    >
                      Переснять с камеры
                    </button>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-4 py-2.5 border border-[#1A1A1A] text-[#1A1A1A] text-xs uppercase tracking-widest hover:bg-[#FAF8F5]"
                    >
                      Другое фото
                    </button>
                  </div>
                )}
              </div>

              {appearanceProfile ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-[#FAF8F5] border border-[#E8E3DA] p-5">
                    <span className="text-[10px] uppercase tracking-[0.2em] text-[#8C857B] block mb-1">
                      Определённый типаж
                    </span>
                    <p className="font-serif text-lg text-[#1A1A1A] mb-1">
                      {appearanceProfile.colorType}
                    </p>
                    <p className="text-xs text-[#6E6A63] leading-relaxed">
                      {appearanceProfile.contrastLevel}
                    </p>
                  </div>

                  <div className="bg-[#FAF8F5] border border-[#E8E3DA] p-5">
                    <span className="text-[10px] uppercase tracking-[0.2em] text-[#8C857B] block mb-1">
                      Идеальная палитра SABYR
                    </span>
                    <p className="font-serif text-lg text-[#1A1A1A] mb-1">
                      Рекомендованные оттенки
                    </p>
                    <p className="text-xs text-[#6E6A63] leading-relaxed">
                      {appearanceProfile.bestPalette}
                    </p>
                  </div>

                  <div className="bg-[#FAF8F5] border border-[#E8E3DA] p-5 md:col-span-2">
                    <span className="text-[10px] uppercase tracking-[0.2em] text-[#8C857B] block mb-1">
                      Архитектура кроя и посадка
                    </span>
                    <p className="text-sm text-[#1A1A1A] leading-relaxed">
                      {appearanceProfile.silhouetteAdvice}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="bg-[#FAF8F5] border border-[#E8E3DA] p-6 space-y-3 text-sm text-[#6E6A63]">
                  <p className="text-[#1A1A1A] font-medium">
                    Как работает AI-Стилист по вашему фото:
                  </p>
                  <p>
                    1. Вы фотографируетесь на веб-камеру / фронтальную камеру или загружаете любое
                    своё фото.
                  </p>
                  <p>
                    2. Алгоритм анализирует тон кожи, контрастность и пропорции плечевого пояса.
                  </p>
                  <p>
                    3. Из всех вещей каталога SABYR автоматически собираются 3 готовых топ-образа,
                    которые вы можете в один клик примерить прямо на своё фото!
                  </p>
                </div>
              )}

              {/* Global Size Selector for adding outfits to cart */}
              <div className="pt-2">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs uppercase tracking-wider text-[#6E6A63]">
                    Ваш размер для заказа и 3D-примерки:
                  </span>
                  <span className="text-xs text-[#C5A059]">Полная сетка S – 3XL</span>
                </div>
                <div className="grid grid-cols-6 gap-2 max-w-md">
                  {["S", "M", "L", "XL", "2XL", "3XL"].map((sz) => (
                    <button
                      key={sz}
                      type="button"
                      onClick={() => setSelectedSize(sz)}
                      className={`py-2.5 text-xs font-medium border transition-all ${
                        selectedSize === sz
                          ? "border-[#1A1A1A] bg-[#1A1A1A] text-white"
                          : "border-[#E8E3DA] bg-white text-[#1A1A1A] hover:border-[#1A1A1A]"
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
            <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-[#E8E3DA] pb-5 gap-4">
              <div>
                <span className="text-[11px] uppercase tracking-[0.25em] text-[#C5A059] block mb-1">
                  Персональная селекция из всего каталога
                </span>
                <h2 className="font-serif text-3xl md:text-4xl text-[#1A1A1A]">
                  Топ-3 образа специально для вас
                </h2>
              </div>
              <button
                type="button"
                onClick={() => userPhoto && runPhotoStylistAnalysis(userPhoto)}
                disabled={isAnalyzing}
                className="self-start md:self-auto px-5 py-2.5 border border-[#1A1A1A] text-xs uppercase tracking-widest text-[#1A1A1A] hover:bg-[#1A1A1A] hover:text-white transition-colors"
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
                    className="bg-white border border-[#E8E3DA] p-6 md:p-8 shadow-sm"
                  >
                    {/* Outfit Header */}
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 mb-6 border-b border-[#E8E3DA]">
                      <div>
                        <div className="flex flex-wrap items-center gap-2.5 mb-2">
                          <span className="px-3 py-1 bg-[#1A1A1A] text-[#C5A059] text-[10px] uppercase tracking-[0.2em] font-medium">
                            {outfit.badge}
                          </span>
                          <span className="px-3 py-1 bg-[#FAF8F5] border border-[#E8E3DA] text-[#1A1A1A] text-[10px] uppercase tracking-widest font-medium">
                            Совпадение с вашим фото: {outfit.matchScore}%
                          </span>
                        </div>
                        <h3 className="font-serif text-2xl md:text-3xl text-[#1A1A1A]">
                          {outfit.title}
                        </h3>
                      </div>

                      <div className="flex flex-wrap items-center gap-3">
                        <button
                          type="button"
                          onClick={() => handleTryOnOutfit(outfit)}
                          className="px-6 py-3.5 bg-[#1A1A1A] text-white text-xs uppercase tracking-[0.18em] font-medium hover:bg-[#333333] transition-colors"
                        >
                          Надеть этот образ на моё фото (AI-Примерка)
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAddOutfitToCart(outfit)}
                          className="px-6 py-3.5 bg-[#C5A059] text-[#121212] text-xs uppercase tracking-[0.18em] font-medium hover:bg-[#d4b06a] transition-colors"
                        >
                          {addedOutfitId === outfit.id
                            ? "Образ добавлен в корзину"
                            : `Купить весь образ (${totalOutfitPrice.toLocaleString("ru-KZ")} ₸)`}
                        </button>
                      </div>
                    </div>

                    {/* Stylist Rationale & Tip */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 bg-[#FAF8F5] border border-[#E8E3DA] p-4">
                      <div>
                        <span className="text-[10px] uppercase tracking-widest text-[#8C857B] block mb-1">
                          Почему AI выбрал этот образ под ваше фото:
                        </span>
                        <p className="text-xs md:text-sm text-[#1A1A1A] leading-relaxed">
                          {outfit.rationale}
                        </p>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase tracking-widest text-[#C5A059] block mb-1">
                          Рекомендация по стилизации:
                        </span>
                        <p className="text-xs md:text-sm text-[#6E6A63] leading-relaxed">
                          {outfit.stylingTip}
                        </p>
                      </div>
                    </div>

                    {/* Items in this Outfit */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {outfit.items.map((product, idx) => (
                        <div
                          key={`${outfit.id}-${product.id}`}
                          className="border border-[#E8E3DA] bg-[#FAF8F5] flex flex-col justify-between"
                        >
                          <div>
                            <div className="relative aspect-[3/4] bg-[#F2EFE9] overflow-hidden">
                              <img
                                src={product.images[0]}
                                alt={product.name}
                                className="w-full h-full object-cover"
                              />
                              <span className="absolute top-3 left-3 bg-[#121212]/85 text-white px-2.5 py-1 text-[10px] uppercase tracking-widest">
                                Изделие {idx + 1} · {product.category}
                              </span>
                            </div>
                            <div className="p-4">
                              <Link
                                href={`/product/${product.slug}`}
                                className="font-serif text-lg text-[#1A1A1A] hover:text-[#C5A059] transition-colors block mb-1"
                              >
                                {product.name}
                              </Link>
                              <p className="text-sm font-medium text-[#1A1A1A] mb-2">
                                {product.price.toLocaleString("ru-KZ")} ₸ · Размер {selectedSize}
                              </p>
                              <p className="text-xs text-[#6E6A63] line-clamp-2">
                                {product.aiDescription || product.description}
                              </p>
                            </div>
                          </div>

                          <div className="p-4 pt-0 flex gap-2">
                            <Link
                              href={`/ai-tryon?productId=${product.id}&autoTryOn=1`}
                              className="flex-1 py-2.5 bg-[#1A1A1A] text-white text-center text-[10px] uppercase tracking-widest hover:bg-[#333]"
                            >
                              Примерить на себя
                            </Link>
                            <button
                              type="button"
                              onClick={() => handleSwapItemInOutfit(outfit.id, idx)}
                              className="px-3 py-2.5 border border-[#D5CFC4] text-[10px] uppercase tracking-widest text-[#6E6A63] hover:text-[#1A1A1A] hover:border-[#1A1A1A]"
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
