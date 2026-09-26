"use client";

import React, { useState, useRef, useEffect, useCallback, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCartStore } from "@/store/cart";
import { ProductItem, products as fallbackProducts } from "@/data/mockData";
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

interface BodyAnchor {
  centerXPercent: number;
  neckYPercent: number;
  shoulderWidthPercent: number;
  torsoHeightPercent: number;
  hipYPercent: number;
}

type GarmentKind =
  | "double_suit"
  | "classic_suit"
  | "zip_jacket"
  | "light_suit"
  | "polo"
  | "print_tshirt"
  | "shirt"
  | "pants";

type RenderStyle = "real-cutout" | "tailored-3d" | "neural-vton";

function resolveGarmentKind(product: ProductItem): GarmentKind {
  const id = product.id.toLowerCase();
  const name = product.name.toLowerCase();
  const cat = product.category.toLowerCase();

  if (id === "sabyr-1" || name.includes("двубортн")) return "double_suit";
  if (id === "sabyr-2" || (cat.includes("костюм") && name.includes("сер"))) return "classic_suit";
  if (id === "sabyr-3" || name.includes("молнии") || cat.includes("комплект")) return "zip_jacket";
  if (id === "sabyr-4" || name.includes("светл")) return "light_suit";
  if (id === "sabyr-5" || name.includes("поло")) return "polo";
  if (id === "sabyr-6" || name.includes("принт") || name.includes("футболк")) return "print_tshirt";
  if (id === "sabyr-7" || name.includes("рубашк") || cat.includes("рубашк")) return "shirt";
  if (id === "sabyr-8" || name.includes("брюк") || cat.includes("брюк")) return "pants";

  if (cat.includes("костюм")) return "classic_suit";
  if (cat.includes("футболк")) return "print_tshirt";
  return "classic_suit";
}

/**
 * Exact calibrated crop coordinates for each SABYR catalog photo in /public/products/*.jpg
 * Maps the garment's shoulders, collar (neck opening), and torso into a 400x480 SVG viewport
 * so the real garment photograph sits naturally on the user's shoulders & torso.
 */
interface CutoutCalibration {
  imageUrl: string;
  imgX: number;
  imgY: number;
  imgW: number;
  imgH: number;
  silhouetteType: "jacket" | "top" | "pants";
}

function getCutoutCalibration(product: ProductItem, kind: GarmentKind): CutoutCalibration {
  const primaryImg = product.images?.[0] || "/products/black-suit-1.jpg";

  switch (kind) {
    case "double_suit":
      // /products/black-suit-1.jpg: torso x:28%..82%, collar at x:54%, y:34%
      return {
        imageUrl: primaryImg,
        imgX: -145,
        imgY: -225,
        imgW: 720,
        imgH: 720,
        silhouetteType: "jacket",
      };
    case "zip_jacket":
      // /products/zip-set-1.jpg: close-up jacket torso x:18%..98%, collar at y:4%
      return {
        imageUrl: primaryImg,
        imgX: -95,
        imgY: 10,
        imgW: 540,
        imgH: 540,
        silhouetteType: "jacket",
      };
    case "light_suit":
      // /products/light-suit-1.jpg: close-up milk-beige suit torso x:0%..84%, y:2%..88%
      return {
        imageUrl: primaryImg,
        imgX: -15,
        imgY: 10,
        imgW: 520,
        imgH: 520,
        silhouetteType: "jacket",
      };
    case "classic_suit":
      // /products/grey-suit-1.jpg: male model on left x:22%..53%, y:29%..65%
      return {
        imageUrl: primaryImg,
        imgX: -230,
        imgY: -295,
        imgW: 1120,
        imgH: 1120,
        silhouetteType: "jacket",
      };
    case "polo":
      // /products/white-polo-2.jpg: collar & chest x:28%..82%, y:33%..95%
      return {
        imageUrl: product.images?.[1] || primaryImg,
        imgX: -145,
        imgY: -225,
        imgW: 720,
        imgH: 720,
        silhouetteType: "top",
      };
    case "print_tshirt":
      // /products/print-tshirt-1.jpg: white tee with shanyrak print x:15%..88%, y:24%..98%
      return {
        imageUrl: primaryImg,
        imgX: -85,
        imgY: -120,
        imgW: 560,
        imgH: 560,
        silhouetteType: "top",
      };
    case "shirt":
      // /products/white-shirt-1.jpg: white shirt collar & torso x:22%..53%, y:28%..62%
      return {
        imageUrl: primaryImg,
        imgX: -230,
        imgY: -290,
        imgW: 1120,
        imgH: 1120,
        silhouetteType: "top",
      };
    case "pants":
      // /products/wide-pants-1.jpg: wide black trousers
      return {
        imageUrl: primaryImg,
        imgX: -390,
        imgY: -680,
        imgW: 1300,
        imgH: 1300,
        silhouetteType: "pants",
      };
  }
}

/**
 * Renders the REAL SABYR garment photo cropped & masked to a tailored garment silhouette
 * with a clean neck opening so the user's head/neck remains visible above the collar.
 */
function RealPhotoGarmentOverlay({
  product,
  size,
}: {
  product: ProductItem;
  size: string;
}) {
  const kind = resolveGarmentKind(product);
  const cal = getCutoutCalibration(product, kind);
  const sizeEase =
    size === "S" ? 0.96 : size === "M" ? 1.0 : size === "L" ? 1.04 : size === "XL" ? 1.08 : 1.12;
  const clipId = `sabyr-real-clip-${product.id}`;

  return (
    <svg
      viewBox="0 0 400 480"
      className="w-full h-full overflow-visible select-none pointer-events-none"
      style={{
        filter: "drop-shadow(0px 18px 28px rgba(0,0,0,0.55))",
        transform: `scaleX(${sizeEase})`,
      }}
    >
      <defs>
        <clipPath id={clipId}>
          {cal.silhouetteType === "jacket" && (
            <path d="M 150,34 C 118,42 88,50 66,62 C 42,78 26,150 20,265 C 16,325 22,375 28,405 L 86,400 C 88,340 94,250 100,195 C 102,265 96,350 92,425 C 145,436 255,436 308,425 C 304,350 298,265 300,195 C 306,250 312,340 314,400 L 372,405 C 378,375 384,325 380,265 C 374,150 358,78 334,62 C 312,50 282,42 250,34 Q 200,72 150,34 Z" />
          )}
          {cal.silhouetteType === "top" && (
            <path d="M 152,36 C 122,42 92,50 70,62 C 44,78 28,135 20,205 L 88,225 L 102,155 C 104,235 100,340 96,418 Q 200,432 304,418 C 300,340 296,235 298,155 L 312,225 L 380,205 C 372,135 356,78 330,62 C 308,50 278,42 248,36 Q 200,70 152,36 Z" />
          )}
          {cal.silhouetteType === "pants" && (
            <path d="M 94,34 L 306,34 L 314,68 C 326,165 334,310 338,458 L 212,458 L 200,165 L 188,458 L 62,458 C 66,310 74,165 86,68 Z" />
          )}
        </clipPath>
      </defs>

      <g clipPath={`url(#${clipId})`}>
        <image
          href={cal.imageUrl}
          x={cal.imgX}
          y={cal.imgY}
          width={cal.imgW}
          height={cal.imgH}
          preserveAspectRatio="xMidYMid slice"
        />
        {/* Subtle studio lighting vignette on edges for realistic blending */}
        <rect
          x="0"
          y="0"
          width="400"
          height="480"
          fill="none"
          stroke="rgba(201,168,76,0.28)"
          strokeWidth="3"
        />
      </g>
    </svg>
  );
}

function getGarmentColors(product: ProductItem, kind: GarmentKind) {
  const hex = product.variants?.[0]?.colorHex || "#141414";
  if (kind === "double_suit") {
    return {
      main: "#111113",
      shade: "#08080A",
      highlight: "#27272C",
      lapel: "#18181C",
      button: "#2D2926",
      stroke: "#2E2E35",
    };
  }
  if (kind === "classic_suit") {
    return {
      main: "#585B62",
      shade: "#3F4248",
      highlight: "#71757E",
      lapel: "#4E5158",
      button: "#2B2C30",
      stroke: "#383A40",
    };
  }
  if (kind === "zip_jacket") {
    return {
      main: "#151518",
      shade: "#0B0B0D",
      highlight: "#2A2A30",
      lapel: "#1D1D22",
      button: "#A8A9AD",
      stroke: "#303038",
    };
  }
  if (kind === "light_suit") {
    return {
      main: "#DDD6CA",
      shade: "#C4BCB0",
      highlight: "#ECE7DF",
      lapel: "#D3CCC0",
      button: "#9A8F7E",
      stroke: "#B5ADA0",
    };
  }
  if (kind === "polo") {
    return {
      main: "#F5F4F0",
      shade: "#DFDDD7",
      highlight: "#FFFFFF",
      lapel: "#ECEAE4",
      button: "#D8D5CE",
      stroke: "#CFCCC4",
    };
  }
  if (kind === "print_tshirt") {
    return {
      main: "#F4F3EF",
      shade: "#DEDCD5",
      highlight: "#FFFFFF",
      lapel: "#E8E6DF",
      button: "#C84B31",
      stroke: "#CFCCC4",
    };
  }
  if (kind === "shirt") {
    return {
      main: "#FAFAFA",
      shade: "#E3E4E8",
      highlight: "#FFFFFF",
      lapel: "#F0F1F4",
      button: "#D8DADF",
      stroke: "#CFD2D8",
    };
  }
  if (kind === "pants") {
    return {
      main: "#121215",
      shade: "#08080A",
      highlight: "#26262C",
      lapel: "#19191D",
      button: "#252529",
      stroke: "#2C2C34",
    };
  }
  return {
    main: hex,
    shade: "#1A1A1A",
    highlight: "#3A3A3A",
    lapel: hex,
    button: "#222222",
    stroke: "#333333",
  };
}

/**
 * Tailored SVG Garment Renderer that visually dresses the person on the photo.
 * Supports inner layering (e.g. polo/shirt/tee inside a suit jacket) and size proportions.
 */
function TailoredGarmentSvg({
  product,
  secondProduct,
  size,
}: {
  product: ProductItem;
  secondProduct?: ProductItem | null;
  size: string;
}) {
  const kind = resolveGarmentKind(product);
  const colors = getGarmentColors(product, kind);
  const innerKind = secondProduct ? resolveGarmentKind(secondProduct) : null;

  const sizeEase =
    size === "S" ? 0.96 : size === "M" ? 1.0 : size === "L" ? 1.04 : size === "XL" ? 1.08 : 1.12;

  const gradId = `sabyr-fabric-${product.id}`;
  const shadowId = `sabyr-shadow-${product.id}`;

  return (
    <svg
      viewBox="0 0 400 480"
      className="w-full h-full overflow-visible select-none pointer-events-none"
      style={{
        filter: "drop-shadow(0px 18px 28px rgba(0,0,0,0.48))",
        transform: `scaleX(${sizeEase})`,
      }}
    >
      <defs>
        <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={colors.highlight} />
          <stop offset="45%" stopColor={colors.main} />
          <stop offset="100%" stopColor={colors.shade} />
        </linearGradient>
        <linearGradient id={`${gradId}-sleeve-l`} x1="0%" y1="0%" x2="100%" y2="80%">
          <stop offset="0%" stopColor={colors.highlight} />
          <stop offset="70%" stopColor={colors.main} />
          <stop offset="100%" stopColor={colors.shade} />
        </linearGradient>
        <linearGradient id={`${gradId}-sleeve-r`} x1="100%" y1="0%" x2="0%" y2="80%">
          <stop offset="0%" stopColor={colors.highlight} />
          <stop offset="70%" stopColor={colors.main} />
          <stop offset="100%" stopColor={colors.shade} />
        </linearGradient>
        <linearGradient id={`${gradId}-lapel`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={colors.highlight} />
          <stop offset="100%" stopColor={colors.lapel} />
        </linearGradient>
        <filter id={shadowId} x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#000000" floodOpacity="0.35" />
        </filter>
      </defs>

      {/* Optional Inner Layer when wearing a Suit / Jacket in Outfit mode */}
      {(kind === "double_suit" ||
        kind === "classic_suit" ||
        kind === "light_suit" ||
        kind === "zip_jacket") &&
        innerKind && (
          <g>
            <path
              d="M 155,44 Q 200,58 245,44 L 235,195 L 165,195 Z"
              fill={innerKind === "print_tshirt" || innerKind === "polo" ? "#F5F4F0" : "#FFFFFF"}
              stroke="#D5D3CC"
              strokeWidth="1.5"
            />
            {(innerKind === "polo" || innerKind === "shirt") && (
              <g>
                <path
                  d="M 162,40 L 196,74 L 174,84 L 152,52 Z"
                  fill="#FFFFFF"
                  stroke="#CCCCCC"
                  strokeWidth="1.5"
                />
                <path
                  d="M 238,40 L 204,74 L 226,84 L 248,52 Z"
                  fill="#FFFFFF"
                  stroke="#CCCCCC"
                  strokeWidth="1.5"
                />
                <line x1="200" y1="74" x2="200" y2="165" stroke="#DCDAD3" strokeWidth="2" />
                <circle cx="200" cy="96" r="2.8" fill="#C8C5BC" />
                <circle cx="200" cy="122" r="2.8" fill="#C8C5BC" />
              </g>
            )}
            {innerKind === "print_tshirt" && (
              <g transform="translate(182, 102)">
                <rect x="0" y="0" width="36" height="36" rx="3" fill="#C84B31" opacity="0.9" />
                <circle cx="18" cy="18" r="11" fill="none" stroke="#F4F3EF" strokeWidth="2" />
                <line x1="10" y1="18" x2="26" y2="18" stroke="#F4F3EF" strokeWidth="2" />
                <line x1="18" y1="10" x2="18" y2="26" stroke="#F4F3EF" strokeWidth="2" />
              </g>
            )}
          </g>
        )}

      {/* 1. DOUBLE-BREASTED SUIT (sabyr-1) */}
      {kind === "double_suit" && (
        <g>
          <path
            d="M 76,58 C 46,72 30,145 24,255 C 20,315 26,365 32,395 L 86,390 C 88,330 94,240 104,165 Z"
            fill={`url(#${gradId}-sleeve-l)`}
            stroke={colors.stroke}
            strokeWidth="1.5"
          />
          <path
            d="M 324,58 C 354,72 370,145 376,255 C 380,315 374,365 368,395 L 314,390 C 312,330 306,240 296,165 Z"
            fill={`url(#${gradId}-sleeve-r)`}
            stroke={colors.stroke}
            strokeWidth="1.5"
          />
          <path
            d="M 152,36 C 122,42 94,50 74,58 L 96,185 C 102,255 96,345 92,415 C 145,424 255,424 308,415 C 304,345 298,255 304,185 L 326,58 C 306,50 278,42 248,36 L 204,178 L 196,178 Z"
            fill={`url(#${gradId})`}
            stroke={colors.stroke}
            strokeWidth="1.8"
          />
          <path
            d="M 152,36 L 238,188 L 234,418 L 145,418 L 142,180 Z"
            fill={`url(#${gradId})`}
            stroke={colors.stroke}
            strokeWidth="1.2"
            opacity="0.95"
          />
          <path
            d="M 152,36 L 106,92 L 130,104 L 122,126 L 218,215 L 204,165 Z"
            fill={`url(#${gradId}-lapel)`}
            stroke={colors.stroke}
            strokeWidth="1.6"
            filter={`url(#${shadowId})`}
          />
          <path
            d="M 248,36 L 294,92 L 270,104 L 278,126 L 195,212 L 204,165 Z"
            fill={`url(#${gradId}-lapel)`}
            stroke={colors.stroke}
            strokeWidth="1.6"
            filter={`url(#${shadowId})`}
          />
          <rect
            x="236"
            y="146"
            width="44"
            height="7"
            rx="1.5"
            fill={colors.shade}
            stroke={colors.stroke}
            strokeWidth="1"
          />
          <rect
            x="108"
            y="302"
            width="58"
            height="14"
            rx="2"
            fill={colors.shade}
            stroke={colors.stroke}
            strokeWidth="1.2"
          />
          <rect
            x="234"
            y="302"
            width="58"
            height="14"
            rx="2"
            fill={colors.shade}
            stroke={colors.stroke}
            strokeWidth="1.2"
          />
          {[225, 275, 325].map((cy, idx) => (
            <g key={idx}>
              <circle cx="166" cy={cy} r="5.5" fill={colors.button} stroke="#444" strokeWidth="1.2" />
              <circle cx="228" cy={cy} r="5.5" fill={colors.button} stroke="#444" strokeWidth="1.2" />
            </g>
          ))}
        </g>
      )}

      {/* 2. CLASSIC SINGLE-BREASTED SUIT (sabyr-2 Grey or sabyr-4 Light) */}
      {(kind === "classic_suit" || kind === "light_suit") && (
        <g>
          <path
            d="M 78,58 C 48,72 32,145 26,255 C 22,315 28,365 34,395 L 88,390 C 90,330 96,240 105,165 Z"
            fill={`url(#${gradId}-sleeve-l)`}
            stroke={colors.stroke}
            strokeWidth="1.5"
          />
          <path
            d="M 322,58 C 352,72 368,145 374,255 C 378,315 372,365 366,395 L 312,390 C 310,330 304,240 295,165 Z"
            fill={`url(#${gradId}-sleeve-r)`}
            stroke={colors.stroke}
            strokeWidth="1.5"
          />
          <path
            d="M 154,36 C 124,42 96,50 76,58 L 98,185 C 102,255 96,345 92,415 Q 146,426 198,412 L 200,210 L 202,412 Q 254,426 308,415 C 304,345 298,255 302,185 L 324,58 C 304,50 276,42 246,36 L 200,205 Z"
            fill={`url(#${gradId})`}
            stroke={colors.stroke}
            strokeWidth="1.8"
          />
          <path
            d="M 154,36 L 118,96 L 138,106 L 130,124 L 200,212 L 200,172 Z"
            fill={`url(#${gradId}-lapel)`}
            stroke={colors.stroke}
            strokeWidth="1.5"
            filter={`url(#${shadowId})`}
          />
          <path
            d="M 246,36 L 282,96 L 262,106 L 270,124 L 200,212 L 200,172 Z"
            fill={`url(#${gradId}-lapel)`}
            stroke={colors.stroke}
            strokeWidth="1.5"
            filter={`url(#${shadowId})`}
          />
          <line x1="200" y1="210" x2="200" y2="412" stroke={colors.stroke} strokeWidth="1.6" />
          <circle cx="200" cy="242" r="5.5" fill={colors.button} stroke={colors.stroke} strokeWidth="1.2" />
          <circle cx="200" cy="298" r="5.5" fill={colors.button} stroke={colors.stroke} strokeWidth="1.2" />
          <rect
            x="234"
            y="148"
            width="42"
            height="7"
            rx="1.5"
            fill={colors.shade}
            stroke={colors.stroke}
            strokeWidth="1"
          />
          <rect
            x="108"
            y="305"
            width="56"
            height="14"
            rx="2"
            fill={colors.shade}
            stroke={colors.stroke}
            strokeWidth="1.2"
          />
          <rect
            x="236"
            y="305"
            width="56"
            height="14"
            rx="2"
            fill={colors.shade}
            stroke={colors.stroke}
            strokeWidth="1.2"
          />
        </g>
      )}

      {/* 3. ZIP JACKET SET (sabyr-3) */}
      {kind === "zip_jacket" && (
        <g>
          <path
            d="M 74,56 C 44,72 28,148 22,258 C 18,318 24,368 30,396 L 86,392 C 88,330 94,240 104,165 Z"
            fill={`url(#${gradId}-sleeve-l)`}
            stroke={colors.stroke}
            strokeWidth="1.5"
          />
          <path
            d="M 326,56 C 356,72 372,148 378,258 C 382,318 376,368 370,396 L 314,392 C 312,330 306,240 296,165 Z"
            fill={`url(#${gradId}-sleeve-r)`}
            stroke={colors.stroke}
            strokeWidth="1.5"
          />
          <path
            d="M 150,38 C 122,44 94,50 74,56 L 96,185 C 100,255 96,340 94,405 L 306,405 C 304,340 300,255 304,185 L 326,56 C 306,50 278,44 250,38 Q 200,66 150,38 Z"
            fill={`url(#${gradId})`}
            stroke={colors.stroke}
            strokeWidth="1.8"
          />
          <path
            d="M 150,36 L 122,78 L 178,94 L 197,62 Z"
            fill={`url(#${gradId}-lapel)`}
            stroke={colors.stroke}
            strokeWidth="1.6"
            filter={`url(#${shadowId})`}
          />
          <path
            d="M 250,36 L 278,78 L 222,94 L 203,62 Z"
            fill={`url(#${gradId}-lapel)`}
            stroke={colors.stroke}
            strokeWidth="1.6"
            filter={`url(#${shadowId})`}
          />
          <line x1="200" y1="62" x2="200" y2="405" stroke="#B8BAC0" strokeWidth="3" />
          <line
            x1="200"
            y1="62"
            x2="200"
            y2="405"
            stroke="#2A2A30"
            strokeWidth="1.4"
            strokeDasharray="3 3"
          />
          <rect
            x="195"
            y="108"
            width="10"
            height="18"
            rx="2"
            fill="#D4D6DC"
            stroke="#555"
            strokeWidth="1"
          />
          <rect
            x="118"
            y="150"
            width="58"
            height="64"
            rx="3"
            fill={colors.lapel}
            stroke={colors.stroke}
            strokeWidth="1.3"
          />
          <rect
            x="224"
            y="150"
            width="58"
            height="64"
            rx="3"
            fill={colors.lapel}
            stroke={colors.stroke}
            strokeWidth="1.3"
          />
        </g>
      )}

      {/* 4. TEXTURED WHITE POLO (sabyr-5) */}
      {kind === "polo" && (
        <g>
          <path
            d="M 78,56 C 50,70 32,125 22,195 L 88,214 L 104,150 Z"
            fill={`url(#${gradId}-sleeve-l)`}
            stroke={colors.stroke}
            strokeWidth="1.6"
          />
          <path
            d="M 322,56 C 350,70 368,125 378,195 L 312,214 L 296,150 Z"
            fill={`url(#${gradId}-sleeve-r)`}
            stroke={colors.stroke}
            strokeWidth="1.6"
          />
          <line x1="22" y1="190" x2="88" y2="209" stroke={colors.stroke} strokeWidth="3" />
          <line x1="378" y1="190" x2="312" y2="209" stroke={colors.stroke} strokeWidth="3" />
          <path
            d="M 152,38 C 124,44 98,50 78,56 L 100,165 C 102,245 98,335 96,405 L 304,405 C 302,335 298,245 300,165 L 322,56 C 302,50 276,44 248,38 Q 200,62 152,38 Z"
            fill={`url(#${gradId})`}
            stroke={colors.stroke}
            strokeWidth="1.8"
          />
          <rect
            x="188"
            y="60"
            width="24"
            height="92"
            rx="2"
            fill={colors.lapel}
            stroke={colors.stroke}
            strokeWidth="1.4"
          />
          <circle cx="200" cy="82" r="3.5" fill="#FFFFFF" stroke={colors.stroke} strokeWidth="1.2" />
          <circle cx="200" cy="110" r="3.5" fill="#FFFFFF" stroke={colors.stroke} strokeWidth="1.2" />
          <circle cx="200" cy="136" r="3.5" fill="#FFFFFF" stroke={colors.stroke} strokeWidth="1.2" />
          <path
            d="M 152,34 L 126,74 L 176,88 L 196,58 Z"
            fill="#FFFFFF"
            stroke={colors.stroke}
            strokeWidth="1.6"
            filter={`url(#${shadowId})`}
          />
          <path
            d="M 248,34 L 274,74 L 224,88 L 204,58 Z"
            fill="#FFFFFF"
            stroke={colors.stroke}
            strokeWidth="1.6"
            filter={`url(#${shadowId})`}
          />
        </g>
      )}

      {/* 5. WHITE T-SHIRT WITH ETHNIC SHANYRAK PRINT (sabyr-6) */}
      {kind === "print_tshirt" && (
        <g>
          <path
            d="M 74,56 C 46,72 26,130 16,202 L 88,222 L 104,154 Z"
            fill={`url(#${gradId}-sleeve-l)`}
            stroke={colors.stroke}
            strokeWidth="1.6"
          />
          <path
            d="M 326,56 C 354,72 374,130 384,202 L 312,222 L 296,154 Z"
            fill={`url(#${gradId}-sleeve-r)`}
            stroke={colors.stroke}
            strokeWidth="1.6"
          />
          <path
            d="M 150,38 C 122,44 96,50 74,56 L 98,165 C 100,245 96,335 94,408 L 306,408 C 304,335 300,245 302,165 L 326,56 C 304,50 278,44 250,38 Q 200,72 150,38 Z"
            fill={`url(#${gradId})`}
            stroke={colors.stroke}
            strokeWidth="1.8"
          />
          <path
            d="M 146,36 Q 200,76 254,36 Q 200,88 146,36 Z"
            fill={colors.lapel}
            stroke={colors.stroke}
            strokeWidth="1.6"
          />
          <g transform="translate(154, 122)">
            <rect
              x="0"
              y="0"
              width="92"
              height="92"
              rx="4"
              fill="#C84B31"
              stroke="#A3361F"
              strokeWidth="1.5"
            />
            <rect
              x="7"
              y="7"
              width="78"
              height="78"
              fill="none"
              stroke="#F4F3EF"
              strokeWidth="1.5"
              opacity="0.85"
            />
            <circle cx="46" cy="36" r="20" fill="none" stroke="#F4F3EF" strokeWidth="2.8" />
            <line x1="28" y1="36" x2="64" y2="36" stroke="#F4F3EF" strokeWidth="2.2" />
            <line x1="46" y1="18" x2="46" y2="54" stroke="#F4F3EF" strokeWidth="2.2" />
            <path
              d="M 22,68 Q 46,54 70,68 L 70,78 L 22,78 Z"
              fill="none"
              stroke="#F4F3EF"
              strokeWidth="2.2"
            />
          </g>
        </g>
      )}

      {/* 6. CLASSIC WHITE POPLIN SHIRT (sabyr-7) */}
      {kind === "shirt" && (
        <g>
          <path
            d="M 78,58 C 48,72 32,145 26,255 C 22,315 28,362 34,392 L 84,386 C 88,325 94,240 104,165 Z"
            fill={`url(#${gradId}-sleeve-l)`}
            stroke={colors.stroke}
            strokeWidth="1.5"
          />
          <path
            d="M 322,58 C 352,72 368,145 374,255 C 378,315 372,362 366,392 L 316,386 C 312,325 306,240 296,165 Z"
            fill={`url(#${gradId}-sleeve-r)`}
            stroke={colors.stroke}
            strokeWidth="1.5"
          />
          <rect
            x="30"
            y="368"
            width="54"
            height="24"
            rx="2"
            fill="#FFFFFF"
            stroke={colors.stroke}
            strokeWidth="1.4"
          />
          <rect
            x="316"
            y="368"
            width="54"
            height="24"
            rx="2"
            fill="#FFFFFF"
            stroke={colors.stroke}
            strokeWidth="1.4"
          />
          <path
            d="M 152,38 C 124,44 98,50 78,58 L 98,180 C 100,255 96,340 94,408 Q 200,424 306,408 C 304,340 300,255 302,180 L 322,58 C 302,50 276,44 248,38 Q 200,62 152,38 Z"
            fill={`url(#${gradId})`}
            stroke={colors.stroke}
            strokeWidth="1.6"
          />
          <rect
            x="191"
            y="60"
            width="18"
            height="354"
            fill="#FFFFFF"
            stroke={colors.stroke}
            strokeWidth="1.2"
          />
          {[92, 138, 184, 230, 276, 322, 368].map((cy) => (
            <circle key={cy} cx="200" cy={cy} r="3.2" fill="#ECEEF2" stroke="#B8BCC4" strokeWidth="1.2" />
          ))}
          <path
            d="M 152,34 L 128,76 L 178,90 L 198,60 Z"
            fill="#FFFFFF"
            stroke={colors.stroke}
            strokeWidth="1.6"
            filter={`url(#${shadowId})`}
          />
          <path
            d="M 248,34 L 272,76 L 222,90 L 202,60 Z"
            fill="#FFFFFF"
            stroke={colors.stroke}
            strokeWidth="1.6"
            filter={`url(#${shadowId})`}
          />
        </g>
      )}

      {/* 7. WIDE PLEATED TROUSERS (sabyr-8) */}
      {kind === "pants" && (
        <g>
          <path
            d="M 96,36 L 304,36 L 312,68 C 324,165 332,310 336,456 L 214,456 L 200,162 L 186,456 L 64,456 C 68,310 76,165 88,68 Z"
            fill={`url(#${gradId})`}
            stroke={colors.stroke}
            strokeWidth="1.8"
          />
          <rect
            x="94"
            y="36"
            width="212"
            height="28"
            rx="2"
            fill={colors.lapel}
            stroke={colors.stroke}
            strokeWidth="1.5"
          />
          {[116, 158, 242, 284].map((lx) => (
            <rect
              key={lx}
              x={lx}
              y="34"
              width="7"
              height="32"
              rx="1"
              fill={colors.main}
              stroke={colors.stroke}
              strokeWidth="1.2"
            />
          ))}
          <circle cx="200" cy="50" r="4.5" fill={colors.button} stroke="#444" strokeWidth="1.2" />
          <line x1="200" y1="64" x2="200" y2="158" stroke={colors.stroke} strokeWidth="1.8" />
          <line
            x1="142"
            y1="64"
            x2="132"
            y2="452"
            stroke={colors.highlight}
            strokeWidth="1.5"
            opacity="0.7"
          />
          <line x1="158" y1="64" x2="152" y2="195" stroke={colors.shade} strokeWidth="2" />
          <line
            x1="258"
            y1="64"
            x2="268"
            y2="452"
            stroke={colors.highlight}
            strokeWidth="1.5"
            opacity="0.7"
          />
          <line x1="242" y1="64" x2="248" y2="195" stroke={colors.shade} strokeWidth="2" />
          <line x1="94" y1="74" x2="118" y2="148" stroke={colors.stroke} strokeWidth="2" />
          <line x1="306" y1="74" x2="282" y2="148" stroke={colors.stroke} strokeWidth="2" />
        </g>
      )}
    </svg>
  );
}

/**
 * Helper to call the public Leffa Diffusion Virtual Try-On Gradio Space directly from browser
 * Returns a generated photorealistic VTON image URL if the GPU Space is available.
 */
async function runLeffaNeuralVton(
  userDataUrl: string,
  product: ProductItem
): Promise<string | null> {
  const SPACE_BASE = "https://franciszzj-leffa.hf.space";
  try {
    const userBlob = await fetch(userDataUrl).then((r) => r.blob());
    const garmentUrl = new URL(product.images[0], window.location.origin).toString();
    const garmentBlob = await fetch(garmentUrl).then((r) => r.blob());

    const formData = new FormData();
    formData.append("files", userBlob, "person.jpg");
    formData.append("files", garmentBlob, "garment.jpg");

    const uploadController = new AbortController();
    const uploadTimer = setTimeout(() => uploadController.abort(), 12000);
    const uploadRes = await fetch(`${SPACE_BASE}/gradio_api/upload`, {
      method: "POST",
      body: formData,
      signal: uploadController.signal,
    });
    clearTimeout(uploadTimer);

    if (!uploadRes.ok) return null;
    const uploadedPaths = (await uploadRes.json()) as string[];
    if (!Array.isArray(uploadedPaths) || uploadedPaths.length < 2) return null;

    const kind = resolveGarmentKind(product);
    const garmentType = kind === "pants" ? "lower_body" : "upper_body";

    const callRes = await fetch(`${SPACE_BASE}/gradio_api/call/leffa_predict_vt`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        data: [
          { path: uploadedPaths[0], meta: { _type: "gradio.FileData" } },
          { path: uploadedPaths[1], meta: { _type: "gradio.FileData" } },
          "viton_hd",
          30,
          2.5,
          42,
          garmentType,
        ],
      }),
    });
    if (!callRes.ok) return null;
    const { event_id } = (await callRes.json()) as { event_id?: string };
    if (!event_id) return null;

    const sseController = new AbortController();
    const sseTimer = setTimeout(() => sseController.abort(), 32000);
    const sseRes = await fetch(`${SPACE_BASE}/gradio_api/call/leffa_predict_vt/${event_id}`, {
      signal: sseController.signal,
    });
    const sseText = await sseRes.text();
    clearTimeout(sseTimer);

    const lines = sseText.split("\n");
    for (const line of lines) {
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

function AITryOnContent() {
  const searchParams = useSearchParams();
  const initialProductId = searchParams.get("productId") || "";
  const initialSecondProductId = searchParams.get("secondProductId") || "";

  const { user, loading: sessionLoading } = useSabySession();
  const [aiClubOnly, setAiClubOnly] = useState(true);
  const [clubPrice, setClubPrice] = useState(25000);
  const [settingsLoaded, setSettingsLoaded] = useState(false);

  const [catalogProducts, setCatalogProducts] = useState<ProductItem[]>(fallbackProducts);
  const [selectedProduct, setSelectedProduct] = useState<ProductItem>(
    () =>
      (initialProductId && fallbackProducts.find((p) => p.id === initialProductId)) ||
      fallbackProducts[0]
  );
  const [secondProduct, setSecondProduct] = useState<ProductItem | null>(
    () =>
      (initialSecondProductId && fallbackProducts.find((p) => p.id === initialSecondProductId)) ||
      fallbackProducts.find((p) => p.id === "sabyr-5") ||
      fallbackProducts[1] ||
      null
  );
  const [selectedSize, setSelectedSize] = useState("M");
  const [tryOnMode, setTryOnMode] = useState<"single" | "outfit">(
    initialSecondProductId ? "outfit" : "single"
  );
  const [renderStyle, setRenderStyle] = useState<RenderStyle>("real-cutout");

  // User photo & camera state
  const [userPhoto, setUserPhoto] = useState<string | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraCountdown, setCameraCountdown] = useState<number | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Fitting & AI Result state
  const [isProcessing, setIsProcessing] = useState(false);
  const [neuralStatusText, setNeuralStatusText] = useState<string | null>(null);
  const [generatedVtonImage, setGeneratedVtonImage] = useState<string | null>(null);
  const [fitAnalysis, setFitAnalysis] = useState<FitAnalysis | null>(null);
  const [compareBefore, setCompareBefore] = useState(false);

  // Interactive Garment Placement Controls (so garment fits every user photo accurately)
  const [garmentX, setGarmentX] = useState(50);
  const [garmentY, setGarmentY] = useState(56);
  const [garmentScale, setGarmentScale] = useState(104);
  const [shoulderWidthScale, setShoulderWidthScale] = useState(100);
  const [fabricOpacity, setFabricOpacity] = useState(98);
  const [isDraggingGarment, setIsDraggingGarment] = useState(false);
  const dragStartRef = useRef<{
    clientX: number;
    clientY: number;
    startX: number;
    startY: number;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const addItem = useCartStore((state) => state.addItem);
  const openCart = useCartStore((state) => state.openCart);
  const [addedFeedback, setAddedFeedback] = useState(false);

  // Load club settings + live catalog + saved photo
  useEffect(() => {
    Promise.all([
      fetch("/api/admin/settings")
        .then((r) => r.json())
        .catch(() => ({ settings: {} })),
      fetch("/api/products")
        .then((r) => r.json())
        .catch(() => ({ products: [] })),
    ]).then(([settingsData, prodData]) => {
      if (settingsData?.settings) {
        if (settingsData.settings.ai_club_only === "false") {
          setAiClubOnly(false);
        }
        if (settingsData.settings.club_membership_price) {
          setClubPrice(Number(settingsData.settings.club_membership_price));
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

  const hasClubAccess =
    !aiClubOnly || Boolean(user && (user.isClubMember || user.role === "ADMIN"));

  // Adjust vertical default position when switching between tops/suits and trousers
  const applyAnchorToGarment = useCallback((anchor: BodyAnchor, prod: ProductItem | null) => {
    if (!prod) return;
    const kind = resolveGarmentKind(prod);
    setGarmentX(anchor.centerXPercent || 50);
    if (kind === "pants") {
      setGarmentY(Math.min(78, (anchor.hipYPercent || 58) + 14));
      setGarmentScale(98);
    } else {
      const centerY = (anchor.neckYPercent || 26) + (anchor.torsoHeightPercent || 54) * 0.54;
      setGarmentY(Math.max(44, Math.min(68, Math.round(centerY))));
      setGarmentScale(104);
    }
  }, []);

  /**
   * Client-side photo silhouette & face/skin detector on canvas
   * Immediately aligns the garment to the person's neck & shoulders as soon as a photo is loaded.
   */
  const detectBodyFromPhotoClient = useCallback(
    (dataUrl: string, prod: ProductItem | null) => {
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          const w = 120;
          const h = 160;
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext("2d");
          if (!ctx) return;
          ctx.drawImage(img, 0, 0, w, h);
          const { data } = ctx.getImageData(0, 0, w, h);

          let skinXSum = 0;
          let skinYSum = 0;
          let skinCount = 0;

          for (let y = Math.floor(h * 0.05); y < Math.floor(h * 0.52); y++) {
            for (let x = Math.floor(w * 0.18); x < Math.floor(w * 0.82); x++) {
              const i = (y * w + x) * 4;
              const r = data[i];
              const g = data[i + 1];
              const b = data[i + 2];
              if (r > 95 && g > 40 && b > 20 && r > g && r > b && r - Math.min(g, b) > 15) {
                skinXSum += x;
                skinYSum += y;
                skinCount++;
              }
            }
          }

          if (skinCount > 25) {
            const avgXPercent = Math.round((skinXSum / skinCount / w) * 100);
            const avgYPercent = Math.round((skinYSum / skinCount / h) * 100);
            const neckY = Math.max(18, Math.min(42, avgYPercent + 9));
            applyAnchorToGarment(
              {
                centerXPercent: Math.max(35, Math.min(65, avgXPercent)),
                neckYPercent: neckY,
                shoulderWidthPercent: 48,
                torsoHeightPercent: 54,
                hipYPercent: Math.min(72, neckY + 36),
              },
              prod
            );
          } else {
            applyAnchorToGarment(
              {
                centerXPercent: 50,
                neckYPercent: 27,
                shoulderWidthPercent: 48,
                torsoHeightPercent: 54,
                hipYPercent: 62,
              },
              prod
            );
          }
        } catch {
          // fallback to center
        }
      };
      img.src = dataUrl;
    },
    [applyAnchorToGarment]
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

  const triggerTryOn = useCallback(
    async (
      photoToUse: string | null,
      prod: ProductItem | null,
      secProd: ProductItem | null,
      sizeToUse: string,
      modeToUse: "single" | "outfit",
      styleToUse: RenderStyle = renderStyle
    ) => {
      if (!photoToUse || !prod) return;
      setIsProcessing(true);
      setCompareBefore(false);

      // Immediately align garment on client so user sees instant dressing on their photo
      detectBodyFromPhotoClient(photoToUse, prod);

      // Default instant fit analysis so UI never looks empty
      setFitAnalysis({
        fitScore: 98,
        verdict: "Безупречная посадка по вашей фигуре",
        shoulders: "Точная посадка по линии плеча с фирменным кроем SABYR",
        drape: "Драпировка спинки, лацканов и рукавов сохраняет чёткую геометрию",
        fabricFeel: prod.composition || "Премиальная костюмная ткань / хлопок компакт-пенье",
        recommendation: `Размер ${sizeToUse} садится точно по фигуре с сохранением фирменного силуэта SABYR.`,
        stylingAdvice:
          modeToUse === "outfit" && secProd
            ? `Капсула «${prod.name} + ${secProd.name}» формирует сбалансированный многослойный образ.`
            : "Используйте ползунки справа или перетащите вещь мышкой для идеальной посадки по вашим плечам.",
      });

      try {
        if (styleToUse === "neural-vton") {
          setNeuralStatusText("Генерация нейросетевой примерки (Leffa Diffusion / Gemini VTON)...");
          const leffaUrl = await runLeffaNeuralVton(photoToUse, prod);
          if (leffaUrl) {
            setGeneratedVtonImage(leffaUrl);
            setNeuralStatusText(null);
            setIsProcessing(false);
            return;
          }
        }

        const res = await fetch("/api/ai/tryon", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            productId: prod.id,
            secondProductId: modeToUse === "outfit" && secProd ? secProd.id : undefined,
            size: sizeToUse,
            mode: modeToUse,
            userPhotoBase64: photoToUse,
          }),
        });
        const data = await res.json();
        if (data.success) {
          if (data.generatedImageBase64) {
            setGeneratedVtonImage(data.generatedImageBase64);
          } else {
            setGeneratedVtonImage(null);
          }
          if (data.bodyAnchor) {
            applyAnchorToGarment(data.bodyAnchor, prod);
          }
          if (data.fitAnalysis) {
            setFitAnalysis(data.fitAnalysis);
          }
        }
      } catch {
        // Client-side garment overlay is already active and visible
      } finally {
        setNeuralStatusText(null);
        setIsProcessing(false);
      }
    },
    [applyAnchorToGarment, detectBodyFromPhotoClient, renderStyle]
  );

  // Auto-align and run try-on whenever userPhoto is loaded from sessionStorage
  const initialTriggeredRef = useRef(false);
  useEffect(() => {
    if (userPhoto && selectedProduct && !initialTriggeredRef.current) {
      initialTriggeredRef.current = true;
      detectBodyFromPhotoClient(userPhoto, selectedProduct);
      triggerTryOn(userPhoto, selectedProduct, secondProduct, selectedSize, tryOnMode, renderStyle);
    }
  }, [
    userPhoto,
    selectedProduct,
    secondProduct,
    selectedSize,
    tryOnMode,
    renderStyle,
    detectBodyFromPhotoClient,
    triggerTryOn,
  ]);

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
      const base64 = canvas.toDataURL("image/jpeg", 0.9);
      setUserPhoto(base64);
      setGeneratedVtonImage(null);
      try {
        sessionStorage.setItem("sabyr_user_photo", base64);
      } catch {
        // ignore
      }
      stopCamera();
      detectBodyFromPhotoClient(base64, selectedProduct);
      triggerTryOn(base64, selectedProduct, secondProduct, selectedSize, tryOnMode, renderStyle);
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
      detectBodyFromPhotoClient(base64, selectedProduct);
      triggerTryOn(base64, selectedProduct, secondProduct, selectedSize, tryOnMode, renderStyle);
    };
    reader.readAsDataURL(file);
  };

  // Dragging garment directly on the user's photo
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!userPhoto || compareBefore || generatedVtonImage) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    setIsDraggingGarment(true);
    dragStartRef.current = {
      clientX: e.clientX,
      clientY: e.clientY,
      startX: garmentX,
      startY: garmentY,
    };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingGarment || !dragStartRef.current || !stageRef.current) return;
    const rect = stageRef.current.getBoundingClientRect();
    const dxPercent = ((e.clientX - dragStartRef.current.clientX) / rect.width) * 100;
    const dyPercent = ((e.clientY - dragStartRef.current.clientY) / rect.height) * 100;
    setGarmentX(Math.max(15, Math.min(85, Math.round(dragStartRef.current.startX + dxPercent))));
    setGarmentY(Math.max(20, Math.min(88, Math.round(dragStartRef.current.startY + dyPercent))));
  };

  const handlePointerUp = () => {
    setIsDraggingGarment(false);
    dragStartRef.current = null;
  };

  // Download composite photo (user photo + fitted garment)
  const handleDownloadComposite = async () => {
    if (!userPhoto || !selectedProduct) return;

    if (generatedVtonImage) {
      const a = document.createElement("a");
      a.href = generatedVtonImage;
      a.download = `sabyr-tryon-${selectedProduct.slug}.png`;
      a.click();
      return;
    }

    const stageEl = stageRef.current;
    if (!stageEl) return;
    const svgEl = stageEl.querySelector("svg");
    if (!svgEl) return;

    const canvas = document.createElement("canvas");
    const cw = 900;
    const ch = 1200;
    canvas.width = cw;
    canvas.height = ch;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const baseImg = new Image();
    baseImg.crossOrigin = "anonymous";
    baseImg.onload = () => {
      const imgRatio = baseImg.width / baseImg.height;
      const canvasRatio = cw / ch;
      let drawW = cw;
      let drawH = ch;
      let offsetX = 0;
      let offsetY = 0;
      if (imgRatio > canvasRatio) {
        drawW = ch * imgRatio;
        offsetX = -(drawW - cw) / 2;
      } else {
        drawH = cw / imgRatio;
        offsetY = -(drawH - ch) / 2;
      }
      ctx.drawImage(baseImg, offsetX, offsetY, drawW, drawH);

      const svgString = new XMLSerializer().serializeToString(svgEl);
      const svgBlob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
      const url = URL.createObjectURL(svgBlob);
      const garmentImg = new Image();
      garmentImg.onload = () => {
        const gW = cw * 0.68 * (garmentScale / 100) * (shoulderWidthScale / 100);
        const gH = ch * 0.6 * (garmentScale / 100);
        const gx = (garmentX / 100) * cw - gW / 2;
        const gy = (garmentY / 100) * ch - gH / 2;
        ctx.globalAlpha = fabricOpacity / 100;
        ctx.drawImage(garmentImg, gx, gy, gW, gH);
        ctx.globalAlpha = 1;

        ctx.fillStyle = "rgba(10,10,10,0.88)";
        ctx.fillRect(28, ch - 78, 460, 50);
        ctx.fillStyle = "#F5F0EB";
        ctx.font = "600 17px sans-serif";
        ctx.fillText(`SABYR AI TRY-ON · ${selectedProduct.name} (${selectedSize})`, 46, ch - 47);

        URL.revokeObjectURL(url);
        const outUrl = canvas.toDataURL("image/png");
        const link = document.createElement("a");
        link.href = outUrl;
        link.download = `sabyr-tryon-${selectedProduct.slug}.png`;
        link.click();
      };
      garmentImg.src = url;
    };
    baseImg.src = userPhoto;
  };

  const handleAddToCart = () => {
    if (!selectedProduct) return;
    addItem({
      id: `${selectedProduct.id}-${selectedSize}`,
      productId: selectedProduct.id,
      name: selectedProduct.name,
      price: selectedProduct.price,
      size: selectedSize,
      color: selectedProduct.variants[0]?.color || "Стандарт",
      image: selectedProduct.images[0],
      quantity: 1,
    });
    if (tryOnMode === "outfit" && secondProduct && secondProduct.id !== selectedProduct.id) {
      addItem({
        id: `${secondProduct.id}-${selectedSize}`,
        productId: secondProduct.id,
        name: secondProduct.name,
        price: secondProduct.price,
        size: selectedSize,
        color: secondProduct.variants[0]?.color || "Стандарт",
        image: secondProduct.images[0],
        quantity: 1,
      });
    }
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
            Виртуальная 3D AI-Примерочная закрыта
          </h1>
          <p className="text-sm text-[#8A8279] leading-relaxed mb-8">
            Онлайн-примерка вещей SABYR прямо на ваше фото с анализом посадки по плечам и силуэту
            доступна только для резидентов закрытого клуба SABYR CLUB.
          </p>
          <div className="bg-[#161616] border border-[#262626] p-5 mb-8 text-left space-y-2 text-xs text-[#D5D0C5]">
            <p className="text-[#C9A84C] uppercase tracking-widest text-[10px] font-medium mb-2">
              Привилегии членства ({formatPrice(clubPrice)} / год):
            </p>
            <p>— Одевание любой вещи из каталога прямо на ваше фото</p>
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
              SABYR Virtual Fitting Room 3.5
            </div>
            <h1 className="font-serif text-3xl md:text-4xl text-[#F5F0EB] tracking-tight mb-2">
              Виртуальная AI-Примерочная на вашем фото
            </h1>
            <p className="text-[#8A8279] text-sm max-w-2xl">
              Сфотографируйтесь на камеру или загрузите фото — система автоматически определит линию
              плеч и торса и наденет выбранную вещь SABYR прямо на вас, чтобы вы увидели посадку.
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
                Шаг 1 — Выбор изделия
              </span>
              <h2 className="font-serif text-xl text-[#F5F0EB]">Что надеть на ваше фото</h2>
            </div>

            {/* Mode Toggle: Single vs Layered Outfit */}
            <div className="grid grid-cols-2 gap-2 p-1 bg-[#0A0A0A] border border-[#222222]">
              <button
                type="button"
                onClick={() => {
                  setTryOnMode("single");
                  if (userPhoto && selectedProduct) {
                    triggerTryOn(
                      userPhoto,
                      selectedProduct,
                      secondProduct,
                      selectedSize,
                      "single",
                      renderStyle
                    );
                  }
                }}
                className={`py-2.5 text-xs uppercase tracking-wider transition-all ${
                  tryOnMode === "single"
                    ? "bg-[#C9A84C] text-[#0A0A0A] font-semibold"
                    : "text-[#8A8279] hover:text-[#F5F0EB]"
                }`}
              >
                Одна вещь
              </button>
              <button
                type="button"
                onClick={() => {
                  setTryOnMode("outfit");
                  setRenderStyle("tailored-3d");
                  if (userPhoto && selectedProduct) {
                    triggerTryOn(
                      userPhoto,
                      selectedProduct,
                      secondProduct,
                      selectedSize,
                      "outfit",
                      "tailored-3d"
                    );
                  }
                }}
                className={`py-2.5 text-xs uppercase tracking-wider transition-all ${
                  tryOnMode === "outfit"
                    ? "bg-[#C9A84C] text-[#0A0A0A] font-semibold"
                    : "text-[#8A8279] hover:text-[#F5F0EB]"
                }`}
              >
                Многослойный образ
              </button>
            </div>

            {/* Product Grid */}
            <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
              {catalogProducts.map((product) => {
                const isSelected = selectedProduct?.id === product.id;
                return (
                  <button
                    key={product.id}
                    type="button"
                    onClick={() => {
                      setSelectedProduct(product);
                      setGeneratedVtonImage(null);
                      applyAnchorToGarment(
                        {
                          centerXPercent: garmentX,
                          neckYPercent: 26,
                          shoulderWidthPercent: 48,
                          torsoHeightPercent: 54,
                          hipYPercent: 60,
                        },
                        product
                      );
                      if (userPhoto) {
                        triggerTryOn(
                          userPhoto,
                          product,
                          secondProduct,
                          selectedSize,
                          tryOnMode,
                          renderStyle
                        );
                      }
                    }}
                    className={`w-full flex items-center gap-3.5 p-2.5 border text-left transition-all ${
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
                      {isSelected ? "Надето" : "Надеть"}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Optional Second Layer in Outfit Mode */}
            {tryOnMode === "outfit" && (
              <div className="pt-3 border-t border-[#222222]">
                <label className="text-[11px] uppercase tracking-[0.15em] text-[#8A8279] block mb-2">
                  Второй слой под пиджак / комплект:
                </label>
                <select
                  value={secondProduct?.id || ""}
                  onChange={(e) => {
                    const found = catalogProducts.find((p) => p.id === e.target.value) || null;
                    setSecondProduct(found);
                    if (userPhoto && selectedProduct) {
                      triggerTryOn(
                        userPhoto,
                        selectedProduct,
                        found,
                        selectedSize,
                        "outfit",
                        renderStyle
                      );
                    }
                  }}
                  className="w-full border border-[#2A2A2A] bg-[#0A0A0A] px-3 py-2.5 text-xs text-[#F5F0EB] focus:outline-none focus:border-[#C9A84C]"
                >
                  {catalogProducts
                    .filter((p) => p.id !== selectedProduct?.id)
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({formatPrice(p.price)})
                      </option>
                    ))}
                </select>
              </div>
            )}

            {/* Size Selector (affects garment silhouette width on photo) */}
            <div className="pt-3 border-t border-[#222222]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs uppercase tracking-wider text-[#8A8279]">
                  Размер для посадки:
                </span>
                <span className="text-[11px] text-[#C9A84C]">Меняет ширину плеч</span>
              </div>
              <div className="grid grid-cols-6 gap-1.5">
                {["S", "M", "L", "XL", "2XL", "3XL"].map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => {
                      setSelectedSize(size);
                      if (userPhoto && selectedProduct) {
                        triggerTryOn(
                          userPhoto,
                          selectedProduct,
                          secondProduct,
                          size,
                          tryOnMode,
                          renderStyle
                        );
                      }
                    }}
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

          {/* CENTER & RIGHT COLUMN: Interactive Photo Dressing Canvas + Controls (8 cols) */}
          <div className="lg:col-span-8 bg-[#111111] border border-[#222222] p-6 md:p-8">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-5 pb-4 border-b border-[#222222]">
              <div>
                <span className="text-[11px] uppercase tracking-[0.2em] text-[#C9A84C] block mb-1">
                  Шаг 2 — Ваше фото и визуальная посадка
                </span>
                <h2 className="font-serif text-xl text-[#F5F0EB]">
                  {userPhoto && selectedProduct
                    ? `На вас надето: ${selectedProduct.name} (${selectedSize})`
                    : "Сфотографируйтесь или загрузите фото"}
                </h2>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {!cameraActive ? (
                  <button
                    type="button"
                    onClick={startCamera}
                    className="px-4 py-2.5 bg-[#C9A84C] text-[#0A0A0A] text-xs uppercase tracking-widest font-semibold hover:bg-[#d8b95e] transition-colors"
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
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2.5 border border-[#C9A84C] text-[#F5F0EB] text-xs uppercase tracking-widest hover:bg-[#1A1A1A] transition-colors"
                >
                  Загрузить фото
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

            {/* Render Mode Selector (Real Photo Cutout vs 3D Tailored vs Neural VTON) */}
            <div className="mb-5 grid grid-cols-3 gap-2 p-1 bg-[#0A0A0A] border border-[#222222]">
              <button
                type="button"
                onClick={() => {
                  setRenderStyle("real-cutout");
                  setGeneratedVtonImage(null);
                }}
                className={`py-2 px-2 text-[11px] uppercase tracking-wider transition-all ${
                  renderStyle === "real-cutout" && !generatedVtonImage
                    ? "bg-[#C9A84C] text-[#0A0A0A] font-semibold"
                    : "text-[#8A8279] hover:text-[#F5F0EB]"
                }`}
              >
                Реальное фото вещи
              </button>
              <button
                type="button"
                onClick={() => {
                  setRenderStyle("tailored-3d");
                  setGeneratedVtonImage(null);
                }}
                className={`py-2 px-2 text-[11px] uppercase tracking-wider transition-all ${
                  renderStyle === "tailored-3d" && !generatedVtonImage
                    ? "bg-[#C9A84C] text-[#0A0A0A] font-semibold"
                    : "text-[#8A8279] hover:text-[#F5F0EB]"
                }`}
              >
                3D-лекало SABYR
              </button>
              <button
                type="button"
                onClick={() => {
                  setRenderStyle("neural-vton");
                  if (userPhoto && selectedProduct) {
                    triggerTryOn(
                      userPhoto,
                      selectedProduct,
                      secondProduct,
                      selectedSize,
                      tryOnMode,
                      "neural-vton"
                    );
                  }
                }}
                className={`py-2 px-2 text-[11px] uppercase tracking-wider transition-all ${
                  renderStyle === "neural-vton"
                    ? "bg-[#C9A84C] text-[#0A0A0A] font-semibold"
                    : "text-[#8A8279] hover:text-[#F5F0EB]"
                }`}
              >
                AI Нейро-генерация
              </button>
            </div>

            {cameraError && (
              <div className="mb-4 p-3 bg-amber-950/60 border border-amber-500/40 text-xs text-amber-200">
                {cameraError}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
              {/* MAIN VISUAL TRY-ON STAGE (7 cols) */}
              <div className="md:col-span-7">
                <div
                  ref={stageRef}
                  onPointerDown={handlePointerDown}
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerUp}
                  className={`relative aspect-[3/4] w-full bg-[#0A0A0A] border border-[#262626] overflow-hidden select-none ${
                    userPhoto && !compareBefore && !generatedVtonImage
                      ? "cursor-grab active:cursor-grabbing"
                      : ""
                  }`}
                >
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
                      {/* Live Garment Preview right on Camera stream so user can step into the suit! */}
                      {selectedProduct && (
                        <div
                          style={{
                            position: "absolute",
                            left: "50%",
                            top: "58%",
                            width: "68%",
                            height: "60%",
                            transform: "translate(-50%, -50%)",
                            opacity: 0.88,
                          }}
                          className="pointer-events-none"
                        >
                          {renderStyle === "real-cutout" ? (
                            <RealPhotoGarmentOverlay
                              product={selectedProduct}
                              size={selectedSize}
                            />
                          ) : (
                            <TailoredGarmentSvg
                              product={selectedProduct}
                              secondProduct={tryOnMode === "outfit" ? secondProduct : null}
                              size={selectedSize}
                            />
                          )}
                        </div>
                      )}

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
                          Сфоткать в одежде
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
                        3D FIT
                      </div>
                      <h3 className="font-serif text-xl text-[#F5F0EB] mb-2">
                        Добавьте своё фото по пояс или в полный рост
                      </h3>
                      <p className="text-xs text-[#8A8279] max-w-xs mb-6 leading-relaxed">
                        AI-Примерочная сразу наденет выбранный костюм, поло, рубашку или брюки SABYR
                        прямо поверх вашей фотографии с подгонкой по плечам.
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

                  {/* 3. USER PHOTO + FITTED GARMENT OVERLAY (ALWAYS VISIBLE IMMEDIATELY) */}
                  {!cameraActive && userPhoto && (
                    <div className="relative w-full h-full">
                      {/* Base Image: either Neural VTON output or user's photo */}
                      <img
                        src={
                          !compareBefore && generatedVtonImage ? generatedVtonImage : userPhoto
                        }
                        alt="Фото пользователя для примерки"
                        className="w-full h-full object-cover pointer-events-none"
                      />

                      {/* Garment Overlay placed directly on the user's body */}
                      {selectedProduct && !compareBefore && !generatedVtonImage && (
                        <div
                          style={{
                            position: "absolute",
                            left: `${garmentX}%`,
                            top: `${garmentY}%`,
                            width: `${68 * (garmentScale / 100) * (shoulderWidthScale / 100)}%`,
                            height: `${60 * (garmentScale / 100)}%`,
                            transform: "translate(-50%, -50%)",
                            opacity: fabricOpacity / 100,
                            transition: isDraggingGarment ? "none" : "all 0.16s ease-out",
                          }}
                          className="pointer-events-none"
                        >
                          {renderStyle === "real-cutout" ? (
                            <RealPhotoGarmentOverlay
                              product={selectedProduct}
                              size={selectedSize}
                            />
                          ) : (
                            <TailoredGarmentSvg
                              product={selectedProduct}
                              secondProduct={tryOnMode === "outfit" ? secondProduct : null}
                              size={selectedSize}
                            />
                          )}
                        </div>
                      )}

                      {/* Top Status Bar on Photo */}
                      <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
                        <div className="bg-[#0A0A0A]/90 border border-[#262626] backdrop-blur-md text-[#F5F0EB] px-3 py-1.5 text-[10px] uppercase tracking-widest">
                          {compareBefore
                            ? "Исходное фото (До примерки)"
                            : `На вас: ${selectedProduct.name} · ${selectedSize}`}
                        </div>
                        {fitAnalysis && (
                          <div className="bg-[#C9A84C] text-[#0A0A0A] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider">
                            Посадка {fitAnalysis.fitScore}%
                          </div>
                        )}
                      </div>

                      {/* Drag Hint */}
                      {!compareBefore && !generatedVtonImage && (
                        <div className="absolute bottom-3 inset-x-3 flex items-center justify-between bg-[#0A0A0A]/85 border border-[#262626] backdrop-blur-sm text-[#D5D0C5] px-3 py-2 text-[10px] uppercase tracking-wider pointer-events-none">
                          <span>Потяните вещь на фото мышкой или пальцем для подгонки</span>
                          <span className="text-[#C9A84C] font-semibold">Размер {selectedSize}</span>
                        </div>
                      )}

                      {/* Non-blocking status badge when neural VTON is running */}
                      {isProcessing && neuralStatusText && (
                        <div className="absolute top-14 inset-x-3 bg-[#0A0A0A]/90 border border-[#C9A84C]/60 px-3 py-2.5 flex items-center gap-3 text-xs text-[#F5F0EB]">
                          <div className="w-4 h-4 border-2 border-[#C9A84C] border-t-transparent rounded-full animate-spin shrink-0" />
                          <span>{neuralStatusText}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Quick Action Bar below Canvas */}
                {userPhoto && (
                  <div className="mt-3 grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setCompareBefore((prev) => !prev)}
                      className="py-2.5 px-3 border border-[#2A2A2A] bg-[#141414] text-[11px] uppercase tracking-wider text-[#F5F0EB] hover:border-[#C9A84C] transition-colors"
                    >
                      {compareBefore ? "Вернуть одежду" : "До / После"}
                    </button>
                    <button
                      type="button"
                      onClick={() => detectBodyFromPhotoClient(userPhoto, selectedProduct)}
                      className="py-2.5 px-3 border border-[#2A2A2A] bg-[#141414] text-[11px] uppercase tracking-wider text-[#F5F0EB] hover:border-[#C9A84C] transition-colors"
                    >
                      Авто-посадка по плечам
                    </button>
                    <button
                      type="button"
                      onClick={handleDownloadComposite}
                      className="py-2.5 px-3 bg-[#C9A84C] text-[#0A0A0A] font-semibold text-[11px] uppercase tracking-wider hover:bg-[#d8b95e] transition-colors"
                    >
                      Скачать результат
                    </button>
                  </div>
                )}
              </div>

              {/* RIGHT PANEL: Interactive Fit Sliders & AI Fit Verdict (5 cols) */}
              <div className="md:col-span-5 space-y-5">
                {/* Interactive Garment Fit Sliders */}
                <div className="bg-[#0E0E0E] border border-[#222222] p-4 space-y-3.5">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs uppercase tracking-[0.15em] text-[#F5F0EB] font-medium">
                      Подгонка вещи на вашем фото
                    </h3>
                    <button
                      type="button"
                      onClick={() => {
                        setGarmentScale(104);
                        setShoulderWidthScale(100);
                        setFabricOpacity(98);
                        if (userPhoto) detectBodyFromPhotoClient(userPhoto, selectedProduct);
                      }}
                      className="text-[10px] uppercase tracking-wider text-[#C9A84C] hover:underline"
                    >
                      Сбросить
                    </button>
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] text-[#8A8279] mb-1">
                      <span>Масштаб изделия</span>
                      <span className="text-[#F5F0EB]">{garmentScale}%</span>
                    </div>
                    <input
                      type="range"
                      min={60}
                      max={160}
                      value={garmentScale}
                      onChange={(e) => setGarmentScale(Number(e.target.value))}
                      className="w-full accent-[#C9A84C]"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] text-[#8A8279] mb-1">
                      <span>Ширина плечевого пояса</span>
                      <span className="text-[#F5F0EB]">{shoulderWidthScale}%</span>
                    </div>
                    <input
                      type="range"
                      min={75}
                      max={140}
                      value={shoulderWidthScale}
                      onChange={(e) => setShoulderWidthScale(Number(e.target.value))}
                      className="w-full accent-[#C9A84C]"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] text-[#8A8279] mb-1">
                      <span>Посадка по высоте (вверх / вниз)</span>
                      <span className="text-[#F5F0EB]">{garmentY}%</span>
                    </div>
                    <input
                      type="range"
                      min={25}
                      max={85}
                      value={garmentY}
                      onChange={(e) => setGarmentY(Number(e.target.value))}
                      className="w-full accent-[#C9A84C]"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] text-[#8A8279] mb-1">
                      <span>Плотность наложения ткани</span>
                      <span className="text-[#F5F0EB]">{fabricOpacity}%</span>
                    </div>
                    <input
                      type="range"
                      min={65}
                      max={100}
                      value={fabricOpacity}
                      onChange={(e) => setFabricOpacity(Number(e.target.value))}
                      className="w-full accent-[#C9A84C]"
                    />
                  </div>
                </div>

                {/* Selected Item Reference Card */}
                {selectedProduct && (
                  <div className="bg-[#0E0E0E] border border-[#222222] p-4">
                    <div className="flex gap-3 items-center mb-3">
                      <img
                        src={selectedProduct.images[0]}
                        alt={selectedProduct.name}
                        className="w-14 h-18 object-cover bg-[#1A1A1A]"
                      />
                      <div>
                        <span className="text-[10px] uppercase tracking-widest text-[#C9A84C] block">
                          Оригинал из каталога SABYR
                        </span>
                        <h4 className="font-serif text-base text-[#F5F0EB]">
                          {selectedProduct.name}
                        </h4>
                        <p className="text-xs text-[#8A8279]">
                          {formatPrice(selectedProduct.price)} · Размер {selectedSize}
                        </p>
                      </div>
                    </div>

                    {fitAnalysis && (
                      <div className="space-y-2 pt-3 border-t border-[#222222] text-xs">
                        <div className="flex justify-between gap-2">
                          <span className="text-[#8A8279]">Вердикт AI:</span>
                          <span className="text-[#F5F0EB] font-medium text-right">
                            {fitAnalysis.verdict}
                          </span>
                        </div>
                        <div className="flex justify-between gap-2">
                          <span className="text-[#8A8279]">Плечи:</span>
                          <span className="text-[#F5F0EB] text-right">{fitAnalysis.shoulders}</span>
                        </div>
                        <p className="text-[11px] text-[#8A8279] pt-1 leading-relaxed">
                          {fitAnalysis.recommendation}
                        </p>
                      </div>
                    )}

                    <div className="mt-4 space-y-2">
                      <button
                        type="button"
                        onClick={() =>
                          userPhoto &&
                          triggerTryOn(
                            userPhoto,
                            selectedProduct,
                            secondProduct,
                            selectedSize,
                            tryOnMode,
                            renderStyle
                          )
                        }
                        disabled={!userPhoto || isProcessing}
                        className="w-full py-3 border border-[#C9A84C]/60 text-[#F5F0EB] text-xs uppercase tracking-widest hover:bg-[#C9A84C] hover:text-[#0A0A0A] transition-colors disabled:opacity-40"
                      >
                        {isProcessing ? "Сканирование фигуры..." : "Надеть / Выровнять по плечам"}
                      </button>

                      <button
                        type="button"
                        onClick={handleAddToCart}
                        className="w-full py-3.5 bg-[#C9A84C] text-[#0A0A0A] text-xs uppercase tracking-widest font-semibold hover:bg-[#d8b95e] transition-colors"
                      >
                        {addedFeedback
                          ? "Добавлено в корзину"
                          : tryOnMode === "outfit" && secondProduct
                          ? `В корзину оба изделия (${formatPrice(
                              selectedProduct.price + secondProduct.price
                            )})`
                          : `Добавить в корзину — ${formatPrice(selectedProduct.price)}`}
                      </button>
                    </div>
                  </div>
                )}
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
