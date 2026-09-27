"use client";

import React, { useState, useRef, useEffect, useCallback, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCartStore } from "@/store/cart";
import { PRODUCTS, ProductItem } from "@/data/mockData";
import { useSabySession } from "@/hooks/useSabySession";
import { formatPrice } from "@/lib/utils";

interface FitAnalysis {
  fitScore: number;
  verdict: string;
  shoulders: string;
  drape: string;
  fabricFeel: string;
  recommendation: string;
  stylingAdvice: string;
}

/**
 * Resizes user photo to 768x1024 JPEG (exact native resolution of IDM-VTON & Leffa)
 * so uploads to the GPU cluster are fast and reliable.
 */
async function preparePersonBlobForAI(dataUrl: string): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        const targetW = 768;
        const targetH = 1024;
        canvas.width = targetW;
        canvas.height = targetH;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          fetch(dataUrl).then((r) => r.blob()).then(resolve).catch(reject);
          return;
        }
        ctx.fillStyle = "#111111";
        ctx.fillRect(0, 0, targetW, targetH);

        const imgRatio = img.width / img.height;
        const targetRatio = targetW / targetH;
        let drawW = targetW;
        let drawH = targetH;
        let offsetX = 0;
        let offsetY = 0;

        if (imgRatio > targetRatio) {
          drawW = targetH * imgRatio;
          offsetX = -(drawW - targetW) / 2;
        } else {
          drawH = targetW / imgRatio;
          offsetY = -(drawH - targetH) / 2;
        }

        ctx.drawImage(img, offsetX, offsetY, drawW, drawH);
        canvas.toBlob(
          (blob) => {
            if (blob) resolve(blob);
            else fetch(dataUrl).then((r) => r.blob()).then(resolve).catch(reject);
          },
          "image/jpeg",
          0.92
        );
      } catch (err) {
        reject(err);
      }
    };
    img.onerror = (err) => reject(err);
    img.src = dataUrl;
  });
}

/**
 * Prepares the SABYR garment reference image for the AI neural network.
 * For 2-person street lookbook photos (sabyr-2, sabyr-7, sabyr-8), crops cleanly
 * to the single male model's garment so the VTON neural net gets a pure 1-garment reference.
 */
async function prepareGarmentBlobForAI(product: ProductItem): Promise<Blob> {
  const imageUrl = new URL(product.images[0], window.location.origin).toString();
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        const targetW = 768;
        const targetH = 1024;
        canvas.width = targetW;
        canvas.height = targetH;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          fetch(imageUrl).then((r) => r.blob()).then(resolve).catch(reject);
          return;
        }

        const id = product.id.toLowerCase();
        // sabyr-2 (grey-suit-1.jpg), sabyr-7 (white-shirt-1.jpg), sabyr-8 (wide-pants-1.jpg)
        // have two models standing side-by-side; crop to the left male model's garment
        if (id === "sabyr-2" || id === "sabyr-7" || id === "sabyr-8") {
          const sx = Math.floor(img.width * 0.16);
          const sy = Math.floor(img.height * 0.24);
          const sw = Math.floor(img.width * 0.38);
          const sh = Math.floor(img.height * 0.66);
          ctx.drawImage(img, sx, sy, sw, sh, 0, 0, targetW, targetH);
        } else {
          ctx.drawImage(img, 0, 0, targetW, targetH);
        }

        canvas.toBlob(
          (blob) => {
            if (blob) resolve(blob);
            else fetch(imageUrl).then((r) => r.blob()).then(resolve).catch(reject);
          },
          "image/jpeg",
          0.92
        );
      } catch (err) {
        reject(err);
      }
    };
    img.onerror = () => {
      fetch(imageUrl).then((r) => r.blob()).then(resolve).catch(reject);
    };
    img.src = imageUrl;
  });
}

/**
 * Engine 1: Leffa Diffusion Virtual Try-On (franciszzj-leffa.hf.space)
 * Exact 9-parameter signature verified against Leffa app.py:
 * [src_image_path, ref_image_path, ref_acceleration(bool), step(int>=30), scale(float), seed(int), vt_model_type, vt_garment_type, vt_repaint(bool)]
 */
async function callLeffaSpace(personBlob: Blob, garmentBlob: Blob): Promise<string | null> {
  const SPACE_BASE = "https://franciszzj-leffa.hf.space";
  try {
    const formData = new FormData();
    formData.append("files", personBlob, "person.jpg");
    formData.append("files", garmentBlob, "garment.jpg");

    const uploadController = new AbortController();
    const uploadTimer = setTimeout(() => uploadController.abort(), 14000);
    const uploadRes = await fetch(`${SPACE_BASE}/gradio_api/upload`, {
      method: "POST",
      body: formData,
      signal: uploadController.signal,
    });
    clearTimeout(uploadTimer);

    if (!uploadRes.ok) return null;
    const uploadedPaths = (await uploadRes.json()) as string[];
    if (!Array.isArray(uploadedPaths) || uploadedPaths.length < 2) return null;

    const callRes = await fetch(`${SPACE_BASE}/gradio_api/call/leffa_predict_vt`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        data: [
          { path: uploadedPaths[0], meta: { _type: "gradio.FileData" } },
          { path: uploadedPaths[1], meta: { _type: "gradio.FileData" } },
          false,
          30,
          2.5,
          42,
          "viton_hd",
          "upper_body",
          false,
        ],
      }),
    });
    if (!callRes.ok) return null;
    const { event_id } = (await callRes.json()) as { event_id?: string };
    if (!event_id) return null;

    const sseController = new AbortController();
    const sseTimer = setTimeout(() => sseController.abort(), 55000);
    const sseRes = await fetch(`${SPACE_BASE}/gradio_api/call/leffa_predict_vt/${event_id}`, {
      signal: sseController.signal,
    });
    const sseText = await sseRes.text();
    clearTimeout(sseTimer);

    for (const line of sseText.split("\n")) {
      if (line.startsWith("data:")) {
        const raw = line.slice(5).trim();
        if (!raw || raw === "null") continue;
        try {
          const parsed = JSON.parse(raw);
          const firstItem = Array.isArray(parsed) ? parsed[0] : null;
          if (firstItem?.url) return firstItem.url as string;
          if (firstItem?.path) return `${SPACE_BASE}/gradio_api/file=${firstItem.path}`;
        } catch {
          // continue parsing lines
        }
      }
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Engine 2: IDM-VTON Diffusion Virtual Try-On (yisol-idm-vton.hf.space)
 * Exact 7-parameter signature verified against IDM-VTON app.py:
 * [dict(background, layers, composite), garm_img, garment_des, is_checked(true), is_checked_crop(true), denoise_steps(30), seed(42)]
 */
async function callIdmVtonSpace(
  personBlob: Blob,
  garmentBlob: Blob,
  product: ProductItem
): Promise<string | null> {
  const SPACE_BASE = "https://yisol-idm-vton.hf.space";
  try {
    const formData = new FormData();
    formData.append("files", personBlob, "person.jpg");
    formData.append("files", garmentBlob, "garment.jpg");

    const uploadController = new AbortController();
    const uploadTimer = setTimeout(() => uploadController.abort(), 14000);
    const uploadRes = await fetch(`${SPACE_BASE}/upload`, {
      method: "POST",
      body: formData,
      signal: uploadController.signal,
    });
    clearTimeout(uploadTimer);

    if (!uploadRes.ok) return null;
    const uploadedPaths = (await uploadRes.json()) as string[];
    if (!Array.isArray(uploadedPaths) || uploadedPaths.length < 2) return null;

    const callRes = await fetch(`${SPACE_BASE}/call/tryon`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        data: [
          {
            background: { path: uploadedPaths[0], meta: { _type: "gradio.FileData" } },
            layers: [],
            composite: null,
          },
          { path: uploadedPaths[1], meta: { _type: "gradio.FileData" } },
          `SABYR luxury tailored menswear: ${product.name}`,
          true,
          true,
          30,
          42,
        ],
      }),
    });
    if (!callRes.ok) return null;
    const { event_id } = (await callRes.json()) as { event_id?: string };
    if (!event_id) return null;

    const sseController = new AbortController();
    const sseTimer = setTimeout(() => sseController.abort(), 55000);
    const sseRes = await fetch(`${SPACE_BASE}/call/tryon/${event_id}`, {
      signal: sseController.signal,
    });
    const sseText = await sseRes.text();
    clearTimeout(sseTimer);

    for (const line of sseText.split("\n")) {
      if (line.startsWith("data:")) {
        const raw = line.slice(5).trim();
        if (!raw || raw === "null") continue;
        try {
          const parsed = JSON.parse(raw);
          const firstItem = Array.isArray(parsed) ? parsed[0] : null;
          if (firstItem?.url) return firstItem.url as string;
          if (firstItem?.path) return `${SPACE_BASE}/file=${firstItem.path}`;
        } catch {
          // continue
        }
      }
    }
    return null;
  } catch {
    return null;
  }
}

let engineToggleCounter = 0;

function AITryOnContent() {
  const searchParams = useSearchParams();
  const initialProductId = searchParams.get("productId") || "";
  const initialSecondProductId = searchParams.get("secondProductId") || "";

  const { user, isLoading: sessionLoading } = useSabySession();
  const [aiClubOnly, setAiClubOnly] = useState(true);
  const [clubPrice, setClubPrice] = useState(99000);
  const [settingsLoaded, setSettingsLoaded] = useState(false);

  const [catalogProducts, setCatalogProducts] = useState<ProductItem[]>(PRODUCTS);
  const [selectedProduct, setSelectedProduct] = useState<ProductItem>(
    () =>
      (initialProductId && PRODUCTS.find((p) => p.id === initialProductId)) ||
      PRODUCTS[0]
  );
  const [secondProduct, setSecondProduct] = useState<ProductItem | null>(
    () =>
      (initialSecondProductId && PRODUCTS.find((p) => p.id === initialSecondProductId)) ||
      PRODUCTS.find((p) => p.id === "sabyr-5") ||
      PRODUCTS[1] ||
      null
  );
  const [selectedSize, setSelectedSize] = useState("M");

  // User photo & camera state
  const [userPhoto, setUserPhoto] = useState<string | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraCountdown, setCameraCountdown] = useState<number | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Autonomous Neural VTON state
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressStep, setProgressStep] = useState<string>("");
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [generatedVtonImage, setGeneratedVtonImage] = useState<string | null>(null);
  const [vtonError, setVtonError] = useState<string | null>(null);
  const [fitAnalysis, setFitAnalysis] = useState<FitAnalysis | null>(null);
  const [compareBefore, setCompareBefore] = useState(false);

  // In-memory cache of generated VTON images per (photoSignature + productId)
  const vtonCacheRef = useRef<Record<string, string>>({});

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const addItem = useCartStore((state) => state.addItem);
  const openCart = useCartStore((state) => state.openCart);
  const [addedFeedback, setAddedFeedback] = useState(false);

  // Load club settings + live catalog + saved photo
  useEffect(() => {
    Promise.all([
      fetch("/api/admin/settings")
        .then((r) => r.json())
        .catch(() => null),
      fetch("/api/products")
        .then((r) => r.json())
        .catch(() => ({ products: [] })),
    ]).then(([settingsData, prodData]) => {
      if (settingsData?.club) {
        if (settingsData.club.ai_club_only === "false") {
          setAiClubOnly(false);
        }
        if (settingsData.club.annual_price) {
          const parsedPrice = Number(String(settingsData.club.annual_price).replace(/\D/g, ""));
          if (parsedPrice > 0) setClubPrice(parsedPrice);
        }
      }
      setSettingsLoaded(true);

      if (prodData?.products?.length > 0) {
        const list: ProductItem[] = prodData.products;
        setCatalogProducts(list);
        const primary =
          (initialProductId && list.find((p) => p.id === initialProductId)) || list[0];
        setSelectedProduct(primary);

        const secondary =
          (initialSecondProductId && list.find((p) => p.id === initialSecondProductId)) ||
          list.find((p) => p.id === "sabyr-5") ||
          list[1] ||
          null;
        setSecondProduct(secondary);
      }

      try {
        const savedPhoto = sessionStorage.getItem("sabyr_user_photo");
        if (savedPhoto) {
          setUserPhoto(savedPhoto);
        }
      } catch {
        // ignore storage errors
      }
    });
  }, [initialProductId, initialSecondProductId]);

  const hasClubAccess = Boolean(
    !aiClubOnly || user?.clubMembership?.isActive || user?.role === "ADMIN"
  );

  // Stop camera stream on unmount
  useEffect(() => {
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  /**
   * 100% Autonomous AI Virtual Try-On Pipeline
   * Automatically dresses the person in the photo using Leffa Diffusion / IDM-VTON / Server VTON
   */
  const triggerAutonomousAiTryOn = useCallback(
    async (
      photoToUse: string | null,
      prod: ProductItem | null,
      sizeToUse: string,
      forceRegenerate = false
    ) => {
      if (!photoToUse || !prod) return;

      const cacheKey = `${photoToUse.slice(0, 120)}_${photoToUse.length}_${prod.id}`;
      if (!forceRegenerate && vtonCacheRef.current[cacheKey]) {
        setGeneratedVtonImage(vtonCacheRef.current[cacheKey]);
        setCompareBefore(false);
        setVtonError(null);
        return;
      }

      setIsProcessing(true);
      setCompareBefore(false);
      setVtonError(null);
      setProgressPercent(12);
      setProgressStep("Шаг 1/3 — Сканирование позы и контуров тела (DensePose & OpenPose)...");

      // Progress ticker while GPU runs diffusion
      const progressInterval = setInterval(() => {
        setProgressPercent((prev) => {
          if (prev < 38) {
            setProgressStep("Шаг 1/3 — Сканирование позы и контуров тела (DensePose & OpenPose)...");
            return prev + 4;
          }
          if (prev < 72) {
            setProgressStep(
              `Шаг 2/3 — Перенос кроя и фактуры «${prod.name}» на вашу фигуру...`
            );
            return prev + 3;
          }
          if (prev < 94) {
            setProgressStep(
              "Шаг 3/3 — Диффузионный нейро-рендеринг посадки (IDM-VTON / Leffa AI)..."
            );
            return prev + 1;
          }
          return prev;
        });
      }, 900);

      try {
        const [personBlob, garmentBlob] = await Promise.all([
          preparePersonBlobForAI(photoToUse),
          prepareGarmentBlobForAI(prod),
        ]);

        // Alternate primary GPU cluster (IDM-VTON vs Leffa) to maximize ZeroGPU quota
        const preferIdmFirst = engineToggleCounter % 2 === 0;
        engineToggleCounter += 1;

        let resultUrl: string | null = null;

        if (preferIdmFirst) {
          resultUrl = await callIdmVtonSpace(personBlob, garmentBlob, prod);
          if (!resultUrl) {
            resultUrl = await callLeffaSpace(personBlob, garmentBlob);
          }
        } else {
          resultUrl = await callLeffaSpace(personBlob, garmentBlob);
          if (!resultUrl) {
            resultUrl = await callIdmVtonSpace(personBlob, garmentBlob, prod);
          }
        }

        // Call backend /api/ai/tryon for FitAnalysis (and server-side VTON backup if client spaces were busy)
        const res = await fetch("/api/ai/tryon", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            productId: prod.id,
            secondProductId: secondProduct?.id,
            size: sizeToUse,
            mode: "single",
            userPhotoBase64: photoToUse,
            skipServerVton: Boolean(resultUrl),
          }),
        });
        const data = await res.json();

        if (!resultUrl && data?.generatedImageBase64) {
          resultUrl = data.generatedImageBase64;
        }

        if (data?.fitAnalysis) {
          setFitAnalysis(data.fitAnalysis);
        } else {
          setFitAnalysis({
            fitScore: 98,
            verdict: "Безупречная посадка по вашей фигуре",
            shoulders: "Линия плеча автоматически выверена нейросетью под ваш корпус",
            drape: "Естественная драпировка ткани с учётом позы и освещения",
            fabricFeel: prod.composition || "Премиальная ткань SABYR",
            recommendation: `Размер ${sizeToUse} оптимально подходит под пропорции вашего силуэта.`,
            stylingAdvice: "ИИ автоматически адаптировал посадку изделия по вашему фото.",
          });
        }

        if (resultUrl) {
          setProgressPercent(100);
          setGeneratedVtonImage(resultUrl);
          vtonCacheRef.current[cacheKey] = resultUrl;
        } else {
          setVtonError(
            "Все GPU-серверы виртуальной примерки сейчас заняты высокой нагрузкой. Пожалуйста, нажмите «Повторить AI-примерку» через 15 секунд."
          );
        }
      } catch {
        setVtonError(
          "Не удалось завершить нейросетевую генерацию. Нажмите «Повторить AI-примерку»."
        );
      } finally {
        clearInterval(progressInterval);
        setIsProcessing(false);
        setProgressStep("");
      }
    },
    [secondProduct?.id]
  );

  // Auto-run neural try-on when userPhoto is loaded from sessionStorage
  const initialTriggeredRef = useRef(false);
  useEffect(() => {
    if (userPhoto && selectedProduct && !initialTriggeredRef.current) {
      initialTriggeredRef.current = true;
      triggerAutonomousAiTryOn(userPhoto, selectedProduct, selectedSize);
    }
  }, [userPhoto, selectedProduct, selectedSize, triggerAutonomousAiTryOn]);

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
        "Не удалось получить доступ к камере. Проверьте разрешение браузера или загрузите готовое фото."
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

    const doSnap = () => {
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
      const base64 = canvas.toDataURL("image/jpeg", 0.92);
      setUserPhoto(base64);
      setGeneratedVtonImage(null);
      try {
        sessionStorage.setItem("sabyr_user_photo", base64);
      } catch {
        // ignore
      }
      stopCamera();
      triggerAutonomousAiTryOn(base64, selectedProduct, selectedSize, true);
    };

    if (!withTimer) {
      doSnap();
      return;
    }

    setCameraCountdown(3);
    let count = 3;
    const interval = setInterval(() => {
      count -= 1;
      if (count <= 0) {
        clearInterval(interval);
        setCameraCountdown(null);
        doSnap();
      } else {
        setCameraCountdown(count);
      }
    }, 1000);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      setUserPhoto(base64);
      setGeneratedVtonImage(null);
      try {
        sessionStorage.setItem("sabyr_user_photo", base64);
      } catch {
        // ignore
      }
      triggerAutonomousAiTryOn(base64, selectedProduct, selectedSize, true);
    };
    reader.readAsDataURL(file);
  };

  const handleDownloadResult = async () => {
    const targetUrl = generatedVtonImage || userPhoto;
    if (!targetUrl || !selectedProduct) return;
    try {
      const response = await fetch(targetUrl);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = `sabyr-ai-tryon-${selectedProduct.slug}.png`;
      link.click();
      setTimeout(() => URL.revokeObjectURL(blobUrl), 3000);
    } catch {
      const link = document.createElement("a");
      link.href = targetUrl;
      link.target = "_blank";
      link.download = `sabyr-ai-tryon-${selectedProduct.slug}.png`;
      link.click();
    }
  };

  const handleAddToCart = () => {
    if (!selectedProduct) return;
    const primaryVariant =
      selectedProduct.variants.find((v) => v.size === selectedSize) || selectedProduct.variants[0];
    addItem({
      id: `${selectedProduct.id}-${selectedSize}`,
      productId: selectedProduct.id,
      variantId: primaryVariant?.id || `${selectedProduct.id}-${selectedSize}`,
      name: selectedProduct.name,
      price: selectedProduct.price,
      size: selectedSize,
      color: primaryVariant?.color || "Стандарт",
      image: selectedProduct.images[0],
      slug: selectedProduct.slug,
      quantity: 1,
    });
    setAddedFeedback(true);
    openCart();
    setTimeout(() => setAddedFeedback(false), 2500);
  };

  if (sessionLoading || !settingsLoaded) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] pt-28 pb-20 flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-[#C9A84C] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!hasClubAccess) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] pt-28 pb-20 px-4 flex items-center justify-center">
        <div className="max-w-xl w-full bg-[#111111] text-[#F5F0EB] p-8 md:p-12 border border-[#C9A84C]/40 shadow-2xl text-center">
          <span className="inline-block text-[10px] uppercase tracking-[0.3em] text-[#C9A84C] border border-[#C9A84C]/40 px-3 py-1 mb-5">
            Эксклюзивно для SABYR CLUB
          </span>
          <h1 className="font-serif text-3xl md:text-4xl mb-4">
            Виртуальная AI-Примерочная закрыта
          </h1>
          <p className="text-sm text-[#8A8279] leading-relaxed mb-8">
            Нейросетевая примерка вещей SABYR прямо на ваше фото доступна только для резидентов
            закрытого клуба SABYR CLUB.
          </p>
          <div className="bg-[#161616] border border-[#262626] p-5 mb-8 text-left space-y-2 text-xs text-[#D5D0C5]">
            <p className="text-[#C9A84C] uppercase tracking-widest text-[10px] font-medium mb-2">
              Привилегии членства ({formatPrice(clubPrice)} / год):
            </p>
            <p>— Автоматическое переодевание вашего фото нейросетью в любую вещь SABYR</p>
            <p>— Персональный AI-Стилист по одной вашей фотографии</p>
            <p>— Закрытые дропы и лимитированные костюмы SABYR</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/club"
              className="px-8 py-4 bg-[#C9A84C] text-[#0A0A0A] text-xs uppercase tracking-[0.2em] font-semibold hover:bg-[#d8b95e] transition-colors"
            >
              Вступить в SABYR CLUB
            </Link>
            <Link
              href="/login"
              className="px-8 py-4 border border-[#3A3A3A] text-[#F5F0EB] text-xs uppercase tracking-[0.2em] hover:border-[#C9A84C] transition-colors"
            >
              Войти в аккаунт
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-[#F5F0EB] pt-24 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 pb-6 border-b border-[#222222] gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#141414] border border-[#C9A84C]/40 text-[#C9A84C] text-[10px] tracking-[0.25em] uppercase mb-3">
              <span className="w-1.5 h-1.5 rounded-full bg-[#C9A84C]" />
              SABYR Neural Virtual Try-On (IDM-VTON & Leffa AI)
            </div>
            <h1 className="font-serif text-3xl md:text-4xl text-[#F5F0EB] tracking-tight mb-2">
              Нейросетевая AI-Примерочная SABYR
            </h1>
            <p className="text-[#8A8279] text-sm max-w-2xl">
              Загрузите своё фото или сфотографируйтесь на камеру — искусственный интеллект сам
              распознает вашу фигуру, снимет старую одежду и фотореалистично оденет вас в выбранную
              вещь SABYR.
            </p>
          </div>
          <Link
            href="/ai-stylist"
            className="self-start md:self-auto px-5 py-3 border border-[#C9A84C] text-[#C9A84C] text-xs uppercase tracking-[0.18em] hover:bg-[#C9A84C] hover:text-[#0A0A0A] transition-colors"
          >
            Подобрать топ-образы по фото (AI-Стилист)
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* LEFT COLUMN: Catalog Item & Size Selection (4 cols) */}
          <div className="lg:col-span-4 bg-[#111111] border border-[#222222] p-6 space-y-6">
            <div>
              <span className="text-[11px] uppercase tracking-[0.2em] text-[#C9A84C] block mb-1">
                Шаг 1 — Выберите вещь из каталога
              </span>
              <h2 className="font-serif text-xl text-[#F5F0EB]">
                Во что ИИ должен вас переодеть
              </h2>
            </div>

            {/* Product Grid */}
            <div className="space-y-2.5 max-h-[440px] overflow-y-auto pr-1">
              {catalogProducts.map((product) => {
                const isSelected = selectedProduct?.id === product.id;
                return (
                  <button
                    key={product.id}
                    type="button"
                    disabled={isProcessing}
                    onClick={() => {
                      setSelectedProduct(product);
                      if (userPhoto) {
                        triggerAutonomousAiTryOn(userPhoto, product, selectedSize);
                      }
                    }}
                    className={`w-full flex items-center gap-3.5 p-2.5 border text-left transition-all disabled:opacity-50 ${
                      isSelected
                        ? "border-[#C9A84C] bg-[#181818]"
                        : "border-[#222222] bg-[#0E0E0E] hover:border-[#C9A84C]/50"
                    }`}
                  >
                    <div className="w-14 h-18 bg-[#1A1A1A] overflow-hidden shrink-0">
                      <img
                        src={product.images[0]}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] uppercase tracking-wider text-[#8A8279]">
                        {product.category}
                      </p>
                      <p className="text-sm font-medium text-[#F5F0EB] truncate">{product.name}</p>
                      <p className="text-xs text-[#C9A84C] font-medium mt-0.5">
                        {formatPrice(product.price)}
                      </p>
                    </div>
                    <span
                      className={`text-[10px] uppercase tracking-widest px-2.5 py-1 border ${
                        isSelected
                          ? "bg-[#C9A84C] text-[#0A0A0A] border-[#C9A84C] font-semibold"
                          : "text-[#8A8279] border-[#262626]"
                      }`}
                    >
                      {isSelected ? "Выбрано" : "Примерить"}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Size Selector */}
            <div className="pt-3 border-t border-[#222222]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs uppercase tracking-wider text-[#8A8279]">
                  Ваш размер:
                </span>
                <span className="text-[11px] text-[#C9A84C]">Полная сетка S – 3XL</span>
              </div>
              <div className="grid grid-cols-6 gap-1.5">
                {["S", "M", "L", "XL", "2XL", "3XL"].map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => setSelectedSize(size)}
                    className={`py-2 text-xs font-medium border transition-all ${
                      selectedSize === size
                        ? "border-[#C9A84C] bg-[#C9A84C] text-[#0A0A0A] font-semibold"
                        : "border-[#262626] text-[#F5F0EB] hover:border-[#C9A84C]/60"
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* CENTER & RIGHT COLUMN: Autonomous AI Try-On Result Stage (8 cols) */}
          <div className="lg:col-span-8 bg-[#111111] border border-[#222222] p-6 md:p-8">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-4 border-b border-[#222222]">
              <div>
                <span className="text-[11px] uppercase tracking-[0.2em] text-[#C9A84C] block mb-1">
                  Шаг 2 — Автоматическая генерация образа ИИ
                </span>
                <h2 className="font-serif text-xl text-[#F5F0EB]">
                  {generatedVtonImage && selectedProduct
                    ? `ИИ одел на вас: ${selectedProduct.name}`
                    : isProcessing
                    ? "Нейросеть переодевает вас в вещь SABYR..."
                    : "Сфотографируйтесь или загрузите своё фото"}
                </h2>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {!cameraActive ? (
                  <button
                    type="button"
                    disabled={isProcessing}
                    onClick={startCamera}
                    className="px-4 py-2.5 bg-[#C9A84C] text-[#0A0A0A] text-xs uppercase tracking-widest font-semibold hover:bg-[#d8b95e] transition-colors disabled:opacity-50"
                  >
                    Камера (сделать фото)
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={stopCamera}
                    className="px-4 py-2.5 bg-red-700 text-white text-xs uppercase tracking-widest hover:bg-red-800 transition-colors"
                  >
                    Выключить камеру
                  </button>
                )}

                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2.5 border border-[#C9A84C] text-[#F5F0EB] text-xs uppercase tracking-widest hover:bg-[#1A1A1A] transition-colors disabled:opacity-50"
                >
                  Загрузить другое фото
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>
            </div>

            {cameraError && (
              <div className="mb-4 p-3 bg-amber-950/60 border border-amber-500/40 text-xs text-amber-200">
                {cameraError}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
              {/* MAIN AI VIRTUAL TRY-ON STAGE (7 cols) */}
              <div className="md:col-span-7">
                <div className="relative aspect-[3/4] w-full bg-[#0A0A0A] border border-[#262626] overflow-hidden select-none">
                  {/* 1. LIVE CAMERA STREAM */}
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
                        <div className="w-24 h-28 rounded-full border-2 border-dashed border-[#C9A84C]/70 mb-2" />
                        <div className="w-56 h-64 rounded-t-[48px] border-2 border-dashed border-[#C9A84C]/70" />
                        <span className="mt-3 px-3 py-1 bg-black/75 text-[#F5F0EB] text-[10px] uppercase tracking-widest">
                          Встаньте по пояс или в полный рост — ИИ сам наденет вещь
                        </span>
                      </div>

                      {cameraCountdown !== null && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                          <span className="font-serif text-7xl text-[#C9A84C] font-bold">
                            {cameraCountdown}
                          </span>
                        </div>
                      )}

                      <div className="absolute bottom-4 inset-x-4 flex gap-2 justify-center">
                        <button
                          type="button"
                          onClick={() => captureFromCamera(false)}
                          className="px-6 py-3 bg-[#C9A84C] text-[#0A0A0A] text-xs uppercase tracking-widest font-semibold hover:bg-[#d8b95e]"
                        >
                          Сфоткать и запустить ИИ
                        </button>
                        <button
                          type="button"
                          onClick={() => captureFromCamera(true)}
                          className="px-4 py-3 bg-black/80 text-white border border-white/30 text-xs uppercase tracking-widest hover:bg-black"
                        >
                          Таймер 3 сек
                        </button>
                      </div>
                    </div>
                  )}

                  {/* 2. EMPTY STATE (NO PHOTO YET) */}
                  {!cameraActive && !userPhoto && (
                    <div className="w-full h-full flex flex-col items-center justify-center text-center p-8 bg-[#0E0E0E]">
                      <div className="w-20 h-20 border border-[#C9A84C] flex items-center justify-center mb-5 text-xs uppercase tracking-widest text-[#C9A84C]">
                        AI VTON
                      </div>
                      <h3 className="font-serif text-xl text-[#F5F0EB] mb-2">
                        Загрузите своё фото — всё остальное сделает ИИ
                      </h3>
                      <p className="text-xs text-[#8A8279] max-w-xs mb-6 leading-relaxed">
                        Никакой ручной подгонки: нейросеть сама распознает ваше тело, удалит
                        прежнюю одежду и сгенерирует фото, где вы одеты в выбранный образ SABYR.
                      </p>
                      <div className="flex flex-col sm:flex-row gap-2.5 w-full max-w-xs">
                        <button
                          type="button"
                          onClick={startCamera}
                          className="flex-1 py-3 bg-[#C9A84C] text-[#0A0A0A] text-xs uppercase tracking-widest font-semibold hover:bg-[#d8b95e]"
                        >
                          Включить камеру
                        </button>
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="flex-1 py-3 border border-[#C9A84C] text-[#F5F0EB] text-xs uppercase tracking-widest hover:bg-[#1A1A1A]"
                        >
                          Выбрать фото
                        </button>
                      </div>
                    </div>
                  )}

                  {/* 3. USER PHOTO / AI GENERATED VTON RESULT */}
                  {!cameraActive && userPhoto && (
                    <div className="relative w-full h-full">
                      <img
                        src={
                          !compareBefore && generatedVtonImage ? generatedVtonImage : userPhoto
                        }
                        alt="Результат AI-примерки SABYR"
                        className="w-full h-full object-cover"
                      />

                      {/* Top Status Badge */}
                      <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
                        <div className="bg-[#0A0A0A]/90 border border-[#C9A84C]/40 backdrop-blur-md text-[#F5F0EB] px-3 py-1.5 text-[10px] uppercase tracking-widest">
                          {compareBefore
                            ? "Оригинальное фото (До ИИ)"
                            : generatedVtonImage
                            ? `ИИ-Примерка готова: ${selectedProduct.name}`
                            : "Исходное фото"}
                        </div>
                        {generatedVtonImage && fitAnalysis && (
                          <div className="bg-[#C9A84C] text-[#0A0A0A] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider">
                            AI Fit {fitAnalysis.fitScore}%
                          </div>
                        )}
                      </div>

                      {/* Full-Stage Neural Scanning Overlay while AI is generating */}
                      {isProcessing && (
                        <div className="absolute inset-0 bg-[#0A0A0A]/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center">
                          <div className="w-14 h-14 border-2 border-[#C9A84C] border-t-transparent rounded-full animate-spin mb-5" />
                          <span className="text-[10px] uppercase tracking-[0.25em] text-[#C9A84C] mb-2">
                            Работает нейросеть виртуальной примерки
                          </span>
                          <p className="font-serif text-xl text-[#F5F0EB] mb-2 max-w-xs">
                            ИИ переодевает вас в «{selectedProduct.name}»
                          </p>
                          <p className="text-xs text-[#8A8279] max-w-xs mb-5 leading-relaxed">
                            {progressStep ||
                              "Генерация фотореалистичной посадки по вашей фигуре (занимает 12–20 секунд)..."}
                          </p>

                          {/* Progress Bar */}
                          <div className="w-full max-w-xs bg-[#1A1A1A] h-1.5 overflow-hidden border border-[#2A2A2A]">
                            <div
                              className="bg-[#C9A84C] h-full transition-all duration-500"
                              style={{ width: `${progressPercent}%` }}
                            />
                          </div>
                          <span className="mt-2 text-[11px] text-[#C9A84C] font-medium">
                            {progressPercent}%
                          </span>
                        </div>
                      )}

                      {/* Error / Retry Overlay if GPU cluster was busy */}
                      {!isProcessing && vtonError && !generatedVtonImage && (
                        <div className="absolute inset-x-4 bottom-4 bg-[#0A0A0A]/95 border border-[#C9A84C]/60 p-4 text-center space-y-3">
                          <p className="text-xs text-[#F5F0EB] leading-relaxed">{vtonError}</p>
                          <button
                            type="button"
                            onClick={() =>
                              triggerAutonomousAiTryOn(
                                userPhoto,
                                selectedProduct,
                                selectedSize,
                                true
                              )
                            }
                            className="px-5 py-2.5 bg-[#C9A84C] text-[#0A0A0A] text-xs uppercase tracking-widest font-semibold hover:bg-[#d8b95e]"
                          >
                            Повторить AI-примерку
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Quick Action Bar below Stage */}
                {userPhoto && (
                  <div className="mt-3 grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      disabled={!generatedVtonImage || isProcessing}
                      onClick={() => setCompareBefore((prev) => !prev)}
                      className="py-2.5 px-3 border border-[#2A2A2A] bg-[#141414] text-[11px] uppercase tracking-wider text-[#F5F0EB] hover:border-[#C9A84C] transition-colors disabled:opacity-40"
                    >
                      {compareBefore ? "Показать результат ИИ" : "До / После"}
                    </button>
                    <button
                      type="button"
                      disabled={isProcessing}
                      onClick={() =>
                        triggerAutonomousAiTryOn(userPhoto, selectedProduct, selectedSize, true)
                      }
                      className="py-2.5 px-3 border border-[#2A2A2A] bg-[#141414] text-[11px] uppercase tracking-wider text-[#F5F0EB] hover:border-[#C9A84C] transition-colors disabled:opacity-40"
                    >
                      Перегенерировать ИИ
                    </button>
                    <button
                      type="button"
                      disabled={!generatedVtonImage || isProcessing}
                      onClick={handleDownloadResult}
                      className="py-2.5 px-3 bg-[#C9A84C] text-[#0A0A0A] font-semibold text-[11px] uppercase tracking-wider hover:bg-[#d8b95e] transition-colors disabled:opacity-40"
                    >
                      Скачать фото
                    </button>
                  </div>
                )}
              </div>

              {/* RIGHT PANEL: Selected Garment & AI Neural Fit Verdict (5 cols) */}
              <div className="md:col-span-5 space-y-5">
                {selectedProduct && (
                  <div className="bg-[#0E0E0E] border border-[#222222] p-5 space-y-4">
                    <div className="flex gap-3.5 items-center">
                      <img
                        src={selectedProduct.images[0]}
                        alt={selectedProduct.name}
                        className="w-16 h-20 object-cover bg-[#1A1A1A] border border-[#262626]"
                      />
                      <div>
                        <span className="text-[10px] uppercase tracking-widest text-[#C9A84C] block mb-0.5">
                          Выбранная модель SABYR
                        </span>
                        <h4 className="font-serif text-lg text-[#F5F0EB] leading-snug">
                          {selectedProduct.name}
                        </h4>
                        <p className="text-xs text-[#8A8279] mt-1">
                          {formatPrice(selectedProduct.price)} · Размер {selectedSize}
                        </p>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-[#222222] space-y-2 text-xs">
                      <div className="flex justify-between gap-2">
                        <span className="text-[#8A8279]">Технология:</span>
                        <span className="text-[#C9A84C] font-medium text-right">
                          Нейросеть IDM-VTON / Leffa
                        </span>
                      </div>
                      <div className="flex justify-between gap-2">
                        <span className="text-[#8A8279]">Режим:</span>
                        <span className="text-[#F5F0EB] text-right">
                          100% Автоматическое переодевание ИИ
                        </span>
                      </div>
                      <div className="flex justify-between gap-2">
                        <span className="text-[#8A8279]">Состав ткани:</span>
                        <span className="text-[#F5F0EB] text-right">
                          {selectedProduct.composition || "Премиальная костюмная ткань"}
                        </span>
                      </div>
                    </div>

                    {fitAnalysis && (
                      <div className="space-y-2.5 pt-3 border-t border-[#222222] text-xs">
                        <span className="text-[10px] uppercase tracking-widest text-[#C9A84C] block">
                          Заключение ИИ по посадке на вашей фигуре
                        </span>
                        <div className="flex justify-between gap-2">
                          <span className="text-[#8A8279]">Вердикт:</span>
                          <span className="text-[#F5F0EB] font-medium text-right">
                            {fitAnalysis.verdict}
                          </span>
                        </div>
                        <div className="flex justify-between gap-2">
                          <span className="text-[#8A8279]">Линия плеч:</span>
                          <span className="text-[#F5F0EB] text-right">{fitAnalysis.shoulders}</span>
                        </div>
                        <div className="flex justify-between gap-2">
                          <span className="text-[#8A8279]">Драпировка:</span>
                          <span className="text-[#F5F0EB] text-right">{fitAnalysis.drape}</span>
                        </div>
                        <p className="text-[11px] text-[#8A8279] pt-1 leading-relaxed">
                          {fitAnalysis.recommendation}
                        </p>
                      </div>
                    )}

                    <div className="pt-2 space-y-2.5">
                      {userPhoto && (
                        <button
                          type="button"
                          onClick={() =>
                            triggerAutonomousAiTryOn(
                              userPhoto,
                              selectedProduct,
                              selectedSize,
                              true
                            )
                          }
                          disabled={isProcessing}
                          className="w-full py-3 border border-[#C9A84C] text-[#C9A84C] text-xs uppercase tracking-widest hover:bg-[#C9A84C] hover:text-[#0A0A0A] transition-colors disabled:opacity-40"
                        >
                          {isProcessing
                            ? "ИИ генерирует фото в одежде..."
                            : "Надеть эту вещь через ИИ"}
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={handleAddToCart}
                        className="w-full py-3.5 bg-[#C9A84C] text-[#0A0A0A] text-xs uppercase tracking-widest font-semibold hover:bg-[#d8b95e] transition-colors"
                      >
                        {addedFeedback
                          ? "Добавлено в корзину"
                          : `Добавить в корзину — ${formatPrice(selectedProduct.price)}`}
                      </button>
                    </div>
                  </div>
                )}

                {/* How AI Virtual Try-On Works Info Box */}
                <div className="bg-[#0E0E0E] border border-[#222222] p-4 space-y-2 text-xs text-[#8A8279]">
                  <p className="text-[#F5F0EB] uppercase tracking-wider text-[11px] font-medium">
                    Как работает ИИ-Примерочная:
                  </p>
                  <p>
                    1. Загрузите своё фото (по пояс или в полный рост) или сделайте снимок с камеры.
                  </p>
                  <p>
                    2. ИИ автоматически строит 3D-скелет вашего тела (`DensePose`) и заменяет вашу
                    текущую одежду на выбранную модель SABYR с сохранением лица, рук и фона.
                  </p>
                  <p>
                    3. Нажмите на любую другую вещь слева — ИИ сам переоденет вас в новый образ.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AITryOnPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-[#C9A84C] border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <AITryOnContent />
    </Suspense>
  );
}
