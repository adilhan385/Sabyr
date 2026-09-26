"use client";

import React, { useState, useRef, useEffect, useCallback, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCartStore } from "@/store/useCartStore";
import { ProductItem } from "@/data/products";

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

type GarmentKind = "double_suit" | "classic_suit" | "zip_jacket" | "light_suit" | "polo" | "print_tshirt" | "shirt" | "pants";

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

function getGarmentColors(product: ProductItem, kind: GarmentKind) {
  const hex = product.variants?.[0]?.colorHex || "#141414";
  if (kind === "double_suit") {
    return { main: "#111113", shade: "#08080A", highlight: "#27272C", lapel: "#18181C", button: "#2D2926", stroke: "#2E2E35" };
  }
  if (kind === "classic_suit") {
    return { main: "#585B62", shade: "#3F4248", highlight: "#71757E", lapel: "#4E5158", button: "#2B2C30", stroke: "#383A40" };
  }
  if (kind === "zip_jacket") {
    return { main: "#151518", shade: "#0B0B0D", highlight: "#2A2A30", lapel: "#1D1D22", button: "#A8A9AD", stroke: "#303038" };
  }
  if (kind === "light_suit") {
    return { main: "#DDD6CA", shade: "#C4BCB0", highlight: "#ECE7DF", lapel: "#D3CCC0", button: "#9A8F7E", stroke: "#B5ADA0" };
  }
  if (kind === "polo") {
    return { main: "#F5F4F0", shade: "#DFDDD7", highlight: "#FFFFFF", lapel: "#ECEAE4", button: "#D8D5CE", stroke: "#CFCCC4" };
  }
  if (kind === "print_tshirt") {
    return { main: "#F4F3EF", shade: "#DEDCD5", highlight: "#FFFFFF", lapel: "#E8E6DF", button: "#C84B31", stroke: "#CFCCC4" };
  }
  if (kind === "shirt") {
    return { main: "#FAFAFA", shade: "#E3E4E8", highlight: "#FFFFFF", lapel: "#F0F1F4", button: "#D8DADF", stroke: "#CFD2D8" };
  }
  if (kind === "pants") {
    return { main: "#121215", shade: "#08080A", highlight: "#26262C", lapel: "#19191D", button: "#252529", stroke: "#2C2C34" };
  }
  return { main: hex, shade: "#1A1A1A", highlight: "#3A3A3A", lapel: hex, button: "#222222", stroke: "#333333" };
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

  // Size subtle width multiplier
  const sizeEase =
    size === "S" ? 0.96 : size === "M" ? 1.0 : size === "L" ? 1.04 : size === "XL" ? 1.08 : 1.12;

  const gradId = `sabyr-fabric-${product.id}`;
  const shadowId = `sabyr-shadow-${product.id}`;

  return (
    <svg
      viewBox="0 0 400 480"
      className="w-full h-full overflow-visible select-none pointer-events-none"
      style={{
        filter: "drop-shadow(0px 18px 28px rgba(0,0,0,0.42))",
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
      {(kind === "double_suit" || kind === "classic_suit" || kind === "light_suit" || kind === "zip_jacket") &&
        innerKind && (
          <g>
            {/* Inner White Shirt / Polo / Tee visible at neck V-zone */}
            <path
              d="M 155,44 Q 200,58 245,44 L 235,195 L 165,195 Z"
              fill={innerKind === "print_tshirt" || innerKind === "polo" ? "#F5F4F0" : "#FFFFFF"}
              stroke="#D5D3CC"
              strokeWidth="1.5"
            />
            {/* Inner Collar if shirt or polo */}
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
                {/* Placket line */}
                <line x1="200" y1="74" x2="200" y2="165" stroke="#DCDAD3" strokeWidth="2" />
                <circle cx="200" cy="96" r="2.8" fill="#C8C5BC" />
                <circle cx="200" cy="122" r="2.8" fill="#C8C5BC" />
              </g>
            )}
            {/* Inner ethnic red print peek if print_tshirt */}
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
          {/* Left & Right Tailored Sleeves */}
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

          {/* Main Structured Blazer Torso */}
          <path
            d="M 152,36 C 122,42 94,50 74,58 L 96,185 C 102,255 96,345 92,415 C 145,424 255,424 308,415 C 304,345 298,255 304,185 L 326,58 C 306,50 278,42 248,36 L 204,178 L 196,178 Z"
            fill={`url(#${gradId})`}
            stroke={colors.stroke}
            strokeWidth="1.8"
          />

          {/* Double-breasted overlapping front panel */}
          <path
            d="M 152,36 L 238,188 L 234,418 L 145,418 L 142,180 Z"
            fill={`url(#${gradId})`}
            stroke={colors.stroke}
            strokeWidth="1.2"
             opacity="0.95"
          />

          {/* Wide Peak Lapels (Left & Right) */}
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

          {/* Breast Welt Pocket & Flap Pockets */}
          <rect x="236" y="146" width="44" height="7" rx="1.5" fill={colors.shade} stroke={colors.stroke} strokeWidth="1" />
          <rect x="108" y="302" width="58" height="14" rx="2" fill={colors.shade} stroke={colors.stroke} strokeWidth="1.2" />
          <rect x="234" y="302" width="58" height="14" rx="2" fill={colors.shade} stroke={colors.stroke} strokeWidth="1.2" />

          {/* 6 Signature Double-Breasted Horn Buttons */}
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
          {/* Left & Right Tailored Sleeves */}
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

          {/* Main Jacket Torso */}
          <path
            d="M 154,36 C 124,42 96,50 76,58 L 96,185 C 102,255 96,345 92,412 C 142,422 192,422 199,412 L 201,412 C 208,422 258,422 308,412 C 304,345 298,255 304,185 L 324,58 C 304,50 276,42 246,36 L 200,198 Z"
            fill={`url(#${gradId})`}
            stroke={colors.stroke}
            strokeWidth="1.8"
          />

          {/* Center seam */}
          <line x1="200" y1="198" x2="200" y2="412" stroke={colors.stroke} strokeWidth="1.6" />

          {/* Notch Lapels */}
          <path
            d="M 154,36 L 116,90 L 136,100 L 126,118 L 200,204 L 200,182 Z"
            fill={`url(#${gradId}-lapel)`}
            stroke={colors.stroke}
            strokeWidth="1.5"
            filter={`url(#${shadowId})`}
          />
          <path
            d="M 246,36 L 284,90 L 264,100 L 274,118 L 200,204 L 200,182 Z"
            fill={`url(#${gradId}-lapel)`}
            stroke={colors.stroke}
            strokeWidth="1.5"
            filter={`url(#${shadowId})`}
          />

          {/* Pockets & 2 Buttons */}
          <rect x="232" y="148" width="42" height="6" rx="1.5" fill={colors.shade} stroke={colors.stroke} strokeWidth="1" />
          <rect x="108" y="304" width="56" height="14" rx="2" fill={colors.shade} stroke={colors.stroke} strokeWidth="1.2" />
          <rect x="236" y="304" width="56" height="14" rx="2" fill={colors.shade} stroke={colors.stroke} strokeWidth="1.2" />
          <circle cx="200" cy="232" r="5.5" fill={colors.button} stroke={colors.stroke} strokeWidth="1.2" />
          <circle cx="200" cy="286" r="5.5" fill={colors.button} stroke={colors.stroke} strokeWidth="1.2" />
        </g>
      )}

      {/* 3. RELAXED ZIP JACKET SET (sabyr-3) */}
      {kind === "zip_jacket" && (
        <g>
          {/* Relaxed Sleeves */}
          <path
            d="M 74,60 C 42,78 26,155 20,265 C 16,320 24,368 30,396 L 88,392 C 90,330 96,245 106,170 Z"
            fill={`url(#${gradId}-sleeve-l)`}
            stroke={colors.stroke}
            strokeWidth="1.5"
          />
          <path
            d="M 326,60 C 358,78 374,155 380,265 C 384,320 376,368 370,396 L 312,392 C 310,330 304,245 294,170 Z"
            fill={`url(#${gradId}-sleeve-r)`}
            stroke={colors.stroke}
            strokeWidth="1.5"
          />

          {/* Jacket Body */}
          <path
            d="M 150,38 C 120,44 92,52 74,60 L 94,185 C 98,260 94,345 92,408 L 308,408 C 306,345 302,260 306,185 L 326,60 C 308,52 280,44 250,38 Q 200,68 150,38 Z"
            fill={`url(#${gradId})`}
            stroke={colors.stroke}
            strokeWidth="1.8"
          />

          {/* Turn-down Collar */}
          <path
            d="M 150,36 L 122,76 L 172,92 L 200,66 Z"
            fill={`url(#${gradId}-lapel)`}
            stroke={colors.stroke}
            strokeWidth="1.5"
            filter={`url(#${shadowId})`}
          />
          <path
            d="M 250,36 L 278,76 L 228,92 L 200,66 Z"
            fill={`url(#${gradId}-lapel)`}
            stroke={colors.stroke}
            strokeWidth="1.5"
            filter={`url(#${shadowId})`}
          />

          {/* Metallic Center Zipper */}
          <line x1="200" y1="66" x2="200" y2="408" stroke="#9EA2A8" strokeWidth="3" strokeDasharray="3 2" />
          <rect x="196" y="78" width="8" height="16" rx="2" fill="#C4C7CC" stroke="#555" strokeWidth="1" />

          {/* Architectural Chest Seam & Side Welt Pockets */}
          <line x1="96" y1="165" x2="304" y2="165" stroke={colors.stroke} strokeWidth="1.4" />
          <line x1="120" y1="275" x2="142" y2="345" stroke={colors.stroke} strokeWidth="2.2" />
          <line x1="280" y1="275" x2="258" y2="345" stroke={colors.stroke} strokeWidth="2.2" />
        </g>
      )}

      {/* 4. WHITE POLO (sabyr-5) */}
      {kind === "polo" && (
        <g>
          {/* Short Sleeves with Ribbed Cuffs */}
          <path
            d="M 80,58 C 52,72 36,120 28,188 L 92,204 C 98,165 104,135 110,115 Z"
            fill={`url(#${gradId}-sleeve-l)`}
            stroke={colors.stroke}
            strokeWidth="1.5"
          />
          <path
            d="M 320,58 C 348,72 364,120 372,188 L 308,204 C 302,165 296,135 290,115 Z"
            fill={`url(#${gradId}-sleeve-r)`}
            stroke={colors.stroke}
            strokeWidth="1.5"
          />

          {/* Polo Torso */}
          <path
            d="M 152,38 C 124,44 98,50 80,58 L 100,180 C 102,255 100,335 98,402 C 165,410 235,410 302,402 C 300,335 298,255 300,180 L 320,58 C 302,50 276,44 248,38 Q 200,64 152,38 Z"
            fill={`url(#${gradId})`}
            stroke={colors.stroke}
            strokeWidth="1.6"
          />

          {/* Button Placket */}
          <rect
            x="189"
            y="62"
            width="22"
            height="102"
            rx="2"
            fill={colors.lapel}
            stroke={colors.stroke}
            strokeWidth="1.3"
          />
          <circle cx="200" cy="84" r="3.2" fill="#FFFFFF" stroke={colors.stroke} strokeWidth="1.2" />
          <circle cx="200" cy="112" r="3.2" fill="#FFFFFF" stroke={colors.stroke} strokeWidth="1.2" />
          <circle cx="200" cy="140" r="3.2" fill="#FFFFFF" stroke={colors.stroke} strokeWidth="1.2" />

          {/* Polo Knitted Collar */}
          <path
            d="M 150,35 L 126,74 L 176,88 L 196,62 Z"
            fill="#FFFFFF"
            stroke={colors.stroke}
            strokeWidth="1.5"
            filter={`url(#${shadowId})`}
          />
          <path
            d="M 250,35 L 274,74 L 224,88 L 204,62 Z"
            fill="#FFFFFF"
            stroke={colors.stroke}
            strokeWidth="1.5"
            filter={`url(#${shadowId})`}
          />
        </g>
      )}

      {/* 5. OVERSIZED T-SHIRT WITH ETHNIC PRINT (sabyr-6) */}
      {kind === "print_tshirt" && (
        <g>
          {/* Dropped-Shoulder Oversized Short Sleeves */}
          <path
            d="M 74,60 C 44,78 26,130 18,205 L 88,220 C 94,178 100,145 108,120 Z"
            fill={`url(#${gradId}-sleeve-l)`}
            stroke={colors.stroke}
            strokeWidth="1.5"
          />
          <path
            d="M 326,60 C 356,78 374,130 382,205 L 312,220 C 306,178 300,145 292,120 Z"
            fill={`url(#${gradId}-sleeve-r)`}
            stroke={colors.stroke}
            strokeWidth="1.5"
          />

          {/* T-Shirt Torso */}
          <path
            d="M 148,38 C 120,44 94,52 74,60 L 96,185 C 98,260 96,340 94,408 C 165,416 235,416 306,408 C 304,340 302,260 304,185 L 326,60 C 306,52 280,44 252,38 Q 200,72 148,38 Z"
            fill={`url(#${gradId})`}
            stroke={colors.stroke}
            strokeWidth="1.6"
          />

          {/* Thick Ribbed Crew Neckband */}
          <path
            d="M 146,38 Q 200,76 254,38 Q 258,48 250,54 Q 200,90 150,54 Q 142,48 146,38 Z"
            fill={colors.lapel}
            stroke={colors.stroke}
            strokeWidth="1.4"
          />

          {/* Signature SABYR Terracotta Ethnic Shanyrak/Yurt Graphic Print on Chest */}
          <g transform="translate(154, 118)" filter={`url(#${shadowId})`}>
            <rect x="0" y="0" width="92" height="92" rx="6" fill="#C84630" />
            <rect x="6" y="6" width="80" height="80" rx="3" fill="none" stroke="#F4F3EF" strokeWidth="2" />
            {/* Shanyrak Sun Circle & Cross */}
            <circle cx="46" cy="40" r="20" fill="none" stroke="#F4F3EF" strokeWidth="2.8" />
            <line x1="31" y1="40" x2="61" y2="40" stroke="#F4F3EF" strokeWidth="2.4" />
            <line x1="46" y1="25" x2="46" y2="55" stroke="#F4F3EF" strokeWidth="2.4" />
            <line x1="35" y1="29" x2="57" y2="51" stroke="#F4F3EF" strokeWidth="1.8" />
            <line x1="57" y1="29" x2="35" y2="51" stroke="#F4F3EF" strokeWidth="1.8" />
            {/* Yurt Lattice Base */}
            <path d="M 22,68 Q 46,54 70,68 L 70,78 L 22,78 Z" fill="none" stroke="#F4F3EF" strokeWidth="2.2" />
          </g>
        </g>
      )}

      {/* 6. CLASSIC WHITE POPLIN SHIRT (sabyr-7) */}
      {kind === "shirt" && (
        <g>
          {/* Long Tailored Shirt Sleeves + Buttoned Cuffs */}
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
          {/* Shirt Cuffs */}
          <rect x="30" y="368" width="54" height="24" rx="2" fill="#FFFFFF" stroke={colors.stroke} strokeWidth="1.4" />
          <rect x="316" y="368" width="54" height="24" rx="2" fill="#FFFFFF" stroke={colors.stroke} strokeWidth="1.4" />

          {/* Shirt Torso */}
          <path
            d="M 152,38 C 124,44 98,50 78,58 L 98,180 C 100,255 96,340 94,408 Q 200,424 306,408 C 304,340 300,255 302,180 L 322,58 C 302,50 276,44 248,38 Q 200,62 152,38 Z"
            fill={`url(#${gradId})`}
            stroke={colors.stroke}
            strokeWidth="1.6"
          />

          {/* Full Center Placket + Mother-of-Pearl Buttons */}
          <rect x="191" y="60" width="18" height="354" fill="#FFFFFF" stroke={colors.stroke} strokeWidth="1.2" />
          {[92, 138, 184, 230, 276, 322, 368].map((cy) => (
            <circle key={cy} cx="200" cy={cy} r="3.2" fill="#ECEEF2" stroke="#B8BCC4" strokeWidth="1.2" />
          ))}

          {/* Structured Point Collar */}
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
          {/* High-Waisted Wide-Leg Pleated Trousers */}
          <path
            d="M 96,36 L 304,36 L 312,68 C 324,165 332,310 336,456 L 214,456 L 200,162 L 186,456 L 64,456 C 68,310 76,165 88,68 Z"
            fill={`url(#${gradId})`}
            stroke={colors.stroke}
            strokeWidth="1.8"
          />
          {/* Waistband & Belt Loops */}
          <rect x="94" y="36" width="212" height="28" rx="2" fill={colors.lapel} stroke={colors.stroke} strokeWidth="1.5" />
          {[116, 158, 242, 284].map((lx) => (
            <rect key={lx} x={lx} y="34" width="7" height="32" rx="1" fill={colors.main} stroke={colors.stroke} strokeWidth="1.2" />
          ))}
          <circle cx="200" cy="50" r="4.5" fill={colors.button} stroke="#444" strokeWidth="1.2" />
          {/* Fly & Double Front Pleats (Защипы) + Center Creases */}
          <line x1="200" y1="64" x2="200" y2="158" stroke={colors.stroke} strokeWidth="1.8" />
          <line x1="142" y1="64" x2="132" y2="452" stroke={colors.highlight} strokeWidth="1.5" opacity="0.7" />
          <line x1="158" y1="64" x2="152" y2="195" stroke={colors.shade} strokeWidth="2" />
          <line x1="258" y1="64" x2="268" y2="452" stroke={colors.highlight} strokeWidth="1.5" opacity="0.7" />
          <line x1="242" y1="64" x2="248" y2="195" stroke={colors.shade} strokeWidth="2" />
          {/* Side Slash Pockets */}
          <line x1="94" y1="74" x2="118" y2="148" stroke={colors.stroke} strokeWidth="2" />
          <line x1="306" y1="74" x2="282" y2="148" stroke={colors.stroke} strokeWidth="2" />
        </g>
      )}
    </svg>
  );
}

function AITryOnContent() {
  const searchParams = useSearchParams();
  const initialProductId = searchParams.get("productId") || "";
  const initialSecondProductId = searchParams.get("secondProductId") || "";
  const autoTryOnParam = searchParams.get("autoTryOn") === "1";

  const [catalogProducts, setCatalogProducts] = useState<ProductItem[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<ProductItem | null>(null);
  const [secondProduct, setSecondProduct] = useState<ProductItem | null>(null);
  const [selectedSize, setSelectedSize] = useState("M");
  const [tryOnMode, setTryOnMode] = useState<"single" | "outfit">(
    initialSecondProductId ? "outfit" : "single"
  );

  // User photo & camera state
  const [userPhoto, setUserPhoto] = useState<string | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraCountdown, setCameraCountdown] = useState<number | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Fitting & AI Result state
  const [isProcessing, setIsProcessing] = useState(false);
  const [tryOnComplete, setTryOnComplete] = useState(false);
  const [generatedVtonImage, setGeneratedVtonImage] = useState<string | null>(null);
  const [fitAnalysis, setFitAnalysis] = useState<FitAnalysis | null>(null);
  const [compareBefore, setCompareBefore] = useState(false);

  // Interactive Garment Placement Controls (so garment fits every user photo accurately)
  const [garmentX, setGarmentX] = useState(50); // % from left
  const [garmentY, setGarmentY] = useState(55); // % from top (center of garment)
  const [garmentScale, setGarmentScale] = useState(100); // % scale
  const [shoulderWidthScale, setShoulderWidthScale] = useState(100); // % horizontal stretch
  const [fabricOpacity, setFabricOpacity] = useState(98); // %
  const [isDraggingGarment, setIsDraggingGarment] = useState(false);
  const dragStartRef = useRef<{ clientX: number; clientY: number; startX: number; startY: number } | null>(null);

  // Club access lock state
  const [accessChecked, setAccessChecked] = useState(false);
  const [hasClubAccess, setHasClubAccess] = useState(false);
  const [clubPrice, setClubPrice] = useState(150000);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const addItem = useCartStore((state) => state.addItem);
  const openCart = useCartStore((state) => state.openCart);
  const [addedFeedback, setAddedFeedback] = useState(false);

  // Check Club access + load saved photo from sessionStorage + load catalog
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
      if (!aiClubOnly || (user && (user.isClubMember || user.role === "ADMIN"))) {
        setHasClubAccess(true);
      } else {
        setHasClubAccess(false);
      }
      setAccessChecked(true);

      // Load shared photo from sessionStorage if available
      try {
        const savedPhoto = sessionStorage.getItem("sabyr_user_photo");
        if (savedPhoto) {
          setUserPhoto(savedPhoto);
        }
      } catch {
        // ignore storage restrictions
      }

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
    });
  }, [initialProductId, initialSecondProductId]);

  // Adjust vertical default position when switching between tops/suits and trousers
  const applyAnchorToGarment = useCallback(
    (anchor: BodyAnchor, prod: ProductItem | null) => {
      if (!prod) return;
      const kind = resolveGarmentKind(prod);
      setGarmentX(anchor.centerXPercent || 50);
      if (kind === "pants") {
        setGarmentY(Math.min(78, (anchor.hipYPercent || 58) + 14));
        setGarmentScale(96);
      } else {
        // Place collar right around neckYPercent
        const centerY = (anchor.neckYPercent || 26) + (anchor.torsoHeightPercent || 54) * 0.52;
        setGarmentY(Math.max(42, Math.min(68, Math.round(centerY))));
        setGarmentScale(102);
      }
    },
    []
  );

  /**
   * Client-side photo silhouette & face/skin detector on canvas
   * Finds the horizontal center and neck/shoulder line of the person in the photo
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

          // Find warm skin-tone pixels (face/neck) in upper 55% of image
          let skinXSum = 0;
          let skinYSum = 0;
          let skinCount = 0;

          for (let y = Math.floor(h * 0.06); y < Math.floor(h * 0.52); y++) {
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
          // fallback to standard center
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
      // Mirror horizontally for natural selfie view
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
      detectBodyFromPhotoClient(base64, selectedProduct);
      // Automatically dress the photo right after snapping
      triggerTryOn(base64, selectedProduct, secondProduct, selectedSize, tryOnMode);
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
      try {
        sessionStorage.setItem("sabyr_user_photo", base64);
      } catch {
        // ignore
      }
      detectBodyFromPhotoClient(base64, selectedProduct);
      triggerTryOn(base64, selectedProduct, secondProduct, selectedSize, tryOnMode);
    };
    reader.readAsDataURL(file);
  };

  const triggerTryOn = useCallback(
    async (
      photoToUse: string | null,
      prod: ProductItem | null,
      secProd: ProductItem | null,
      sizeToUse: string,
      modeToUse: "single" | "outfit"
    ) => {
      if (!photoToUse || !prod) return;
      setIsProcessing(true);
      setCompareBefore(false);

      // Immediately align garment on client so user sees instant dressing
      detectBodyFromPhotoClient(photoToUse, prod);

      try {
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
          setTryOnComplete(true);
        } else {
          setTryOnComplete(true);
        }
      } catch {
        setTryOnComplete(true);
      } finally {
        setIsProcessing(false);
      }
    },
    [applyAnchorToGarment, detectBodyFromPhotoClient]
  );

  // Auto-run try-on if navigated from AI-Stylist with ?autoTryOn=1 and saved photo
  useEffect(() => {
    if (autoTryOnParam && userPhoto && selectedProduct && !tryOnComplete && !isProcessing) {
      triggerTryOn(userPhoto, selectedProduct, secondProduct, selectedSize, tryOnMode);
    }
  }, [
    autoTryOnParam,
    userPhoto,
    selectedProduct,
    secondProduct,
    selectedSize,
    tryOnMode,
    tryOnComplete,
    isProcessing,
    triggerTryOn,
  ]);

  // Dragging garment directly on the user's photo
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!tryOnComplete || compareBefore || generatedVtonImage) return;
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
      // Draw cover background
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

      // Serialize SVG garment and draw at current garmentX / garmentY / scale
      const svgString = new XMLSerializer().serializeToString(svgEl);
      const svgBlob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
      const url = URL.createObjectURL(svgBlob);
      const garmentImg = new Image();
      garmentImg.onload = () => {
        const gW = cw * 0.66 * (garmentScale / 100) * (shoulderWidthScale / 100);
        const gH = ch * 0.58 * (garmentScale / 100);
        const gx = (garmentX / 100) * cw - gW / 2;
        const gy = (garmentY / 100) * ch - gH / 2;
        ctx.globalAlpha = fabricOpacity / 100;
        ctx.drawImage(garmentImg, gx, gy, gW, gH);
        ctx.globalAlpha = 1;

        // Watermark badge
        ctx.fillStyle = "rgba(18,18,18,0.82)";
        ctx.fillRect(28, ch - 78, 420, 50);
        ctx.fillStyle = "#F7F5F0";
        ctx.font = "600 18px sans-serif";
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
      productId: selectedProduct.id,
      variantId: `${selectedProduct.id}-${selectedSize}`,
      name: selectedProduct.name,
      price: selectedProduct.price,
      size: selectedSize,
      color: selectedProduct.variants[0]?.color || "Стандарт",
      image: selectedProduct.images[0],
      slug: selectedProduct.slug,
      quantity: 1,
    });
    if (tryOnMode === "outfit" && secondProduct && secondProduct.id !== selectedProduct.id) {
      addItem({
        productId: secondProduct.id,
        variantId: `${secondProduct.id}-${selectedSize}`,
        name: secondProduct.name,
        price: secondProduct.price,
        size: selectedSize,
        color: secondProduct.variants[0]?.color || "Стандарт",
        image: secondProduct.images[0],
        slug: secondProduct.slug,
        quantity: 1,
      });
    }
    setAddedFeedback(true);
    openCart();
    setTimeout(() => setAddedFeedback(false), 2500);
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
            Эксклюзивно для SABYR CLUB
          </span>
          <h1 className="font-serif text-3xl md:text-4xl mb-4">
            Виртуальная 3D AI-Примерочная закрыта
          </h1>
          <p className="text-sm text-[#A09C94] leading-relaxed mb-8">
            Онлайн-примерка вещей SABYR прямо на ваше фото с анализом посадки по плечам и силуэту
            доступна только для резидентов закрытого клуба SABYR CLUB.
          </p>
          <div className="bg-[#1A1A1A] border border-[#2C2C2C] p-5 mb-8 text-left space-y-2 text-xs text-[#D5D0C5]">
            <p className="text-[#C5A059] uppercase tracking-widest text-[10px] font-medium mb-2">
              Привилегии членства ({clubPrice.toLocaleString("ru-KZ")} ₸ / год):
            </p>
            <p>— Одевание любой вещи из каталога прямо на ваше фото</p>
            <p>— Персональный AI-Стилист по одной вашей фотографии</p>
            <p>— Закрытые дропы и лимитированные костюмы SABYR</p>
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
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 pb-6 border-b border-[#E8E3DA] gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#1A1A1A] text-[#F7F5F0] text-[10px] tracking-[0.25em] uppercase mb-3">
              <span className="w-1.5 h-1.5 rounded-full bg-[#C5A059]" />
              SABYR Virtual Fitting Room 3.0
            </div>
            <h1 className="font-serif text-3xl md:text-4xl text-[#1A1A1A] tracking-tight mb-2">
              Виртуальная AI-Примерочная на вашем фото
            </h1>
            <p className="text-[#6E6A63] text-sm max-w-2xl">
              Сфотографируйтесь на камеру или загрузите фото — система автоматически определит линию
              плеч и торса и наденет выбранную вещь SABYR прямо на вас, чтобы вы увидели посадку.
            </p>
          </div>
          <Link
            href="/ai-stylist"
            className="self-start md:self-auto px-5 py-3 border border-[#1A1A1A] text-[#1A1A1A] text-xs uppercase tracking-[0.18em] hover:bg-[#1A1A1A] hover:text-white transition-colors"
          >
            Подобрать топ-образы по фото (AI-Стилист)
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* LEFT COLUMN: Catalog Item & Size Selection (4 cols) */}
          <div className="lg:col-span-4 bg-white border border-[#E8E3DA] p-6 space-y-6">
            <div>
              <span className="text-[11px] uppercase tracking-[0.2em] text-[#8C857B] block mb-1">
                Шаг 1 — Выбор изделия
              </span>
              <h2 className="font-serif text-xl text-[#1A1A1A]">Что надеть на фото</h2>
            </div>

            {/* Mode Toggle: Single vs Layered Outfit */}
            <div className="grid grid-cols-2 gap-2 p-1 bg-[#FAF8F5] border border-[#E8E3DA]">
              <button
                type="button"
                onClick={() => {
                  setTryOnMode("single");
                  if (userPhoto && selectedProduct) {
                    triggerTryOn(userPhoto, selectedProduct, secondProduct, selectedSize, "single");
                  }
                }}
                className={`py-2.5 text-xs uppercase tracking-wider transition-all ${
                  tryOnMode === "single"
                    ? "bg-[#1A1A1A] text-white font-medium"
                    : "text-[#6E6A63] hover:text-[#1A1A1A]"
                }`}
              >
                Одна вещь
              </button>
              <button
                type="button"
                onClick={() => {
                  setTryOnMode("outfit");
                  if (userPhoto && selectedProduct) {
                    triggerTryOn(userPhoto, selectedProduct, secondProduct, selectedSize, "outfit");
                  }
                }}
                className={`py-2.5 text-xs uppercase tracking-wider transition-all ${
                  tryOnMode === "outfit"
                    ? "bg-[#1A1A1A] text-white font-medium"
                    : "text-[#6E6A63] hover:text-[#1A1A1A]"
                }`}
              >
                Многослойный образ
              </button>
            </div>

            {/* Product Grid */}
            <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
              {catalogProducts.map((product) => {
                const isSelected = selectedProduct?.id === product.id;
                return (
                  <button
                    key={product.id}
                    type="button"
                    onClick={() => {
                      setSelectedProduct(product);
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
                        triggerTryOn(userPhoto, product, secondProduct, selectedSize, tryOnMode);
                      }
                    }}
                    className={`w-full flex items-center gap-3.5 p-2.5 border text-left transition-all ${
                      isSelected
                        ? "border-[#1A1A1A] bg-[#FAF8F5] shadow-sm"
                        : "border-[#E8E3DA] hover:border-[#C5A059]"
                    }`}
                  >
                    <div className="w-14 h-18 bg-[#F2EFE9] overflow-hidden shrink-0">
                      <img
                        src={product.images[0]}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] uppercase tracking-wider text-[#8C857B]">
                        {product.category}
                      </p>
                      <p className="text-sm font-medium text-[#1A1A1A] truncate">{product.name}</p>
                      <p className="text-xs text-[#C5A059] font-medium mt-0.5">
                        {product.price.toLocaleString("ru-KZ")} ₸
                      </p>
                    </div>
                    <span
                      className={`text-[10px] uppercase tracking-widest px-2 py-1 border ${
                        isSelected
                          ? "bg-[#1A1A1A] text-white border-[#1A1A1A]"
                          : "text-[#8C857B] border-[#E8E3DA]"
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
              <div className="pt-3 border-t border-[#E8E3DA]">
                <label className="text-[11px] uppercase tracking-[0.15em] text-[#6E6A63] block mb-2">
                  Второй слой под пиджак / комплект:
                </label>
                <select
                  value={secondProduct?.id || ""}
                  onChange={(e) => {
                    const found = catalogProducts.find((p) => p.id === e.target.value) || null;
                    setSecondProduct(found);
                    if (userPhoto && selectedProduct) {
                      triggerTryOn(userPhoto, selectedProduct, found, selectedSize, "outfit");
                    }
                  }}
                  className="w-full border border-[#E8E3DA] bg-[#FAF8F5] px-3 py-2.5 text-xs text-[#1A1A1A] focus:outline-none focus:border-[#1A1A1A]"
                >
                  {catalogProducts
                    .filter((p) => p.id !== selectedProduct?.id)
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.price.toLocaleString("ru-KZ")} ₸)
                      </option>
                    ))}
                </select>
              </div>
            )}

            {/* Size Selector (affects garment silhouette width on photo) */}
            <div className="pt-3 border-t border-[#E8E3DA]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs uppercase tracking-wider text-[#6E6A63]">
                  Размер для посадки:
                </span>
                <span className="text-[11px] text-[#C5A059]">Меняет ширину плеч и свободу</span>
              </div>
              <div className="grid grid-cols-6 gap-1.5">
                {["S", "M", "L", "XL", "2XL", "3XL"].map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => {
                      setSelectedSize(size);
                      if (userPhoto && selectedProduct) {
                        triggerTryOn(userPhoto, selectedProduct, secondProduct, size, tryOnMode);
                      }
                    }}
                    className={`py-2 text-xs font-medium border transition-all ${
                      selectedSize === size
                        ? "border-[#1A1A1A] bg-[#1A1A1A] text-white"
                        : "border-[#E8E3DA] text-[#1A1A1A] hover:border-[#8C857B]"
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* CENTER & RIGHT COLUMN: Interactive Photo Dressing Canvas + Controls (8 cols) */}
          <div className="lg:col-span-8 bg-white border border-[#E8E3DA] p-6 md:p-8">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-4 border-b border-[#E8E3DA]">
              <div>
                <span className="text-[11px] uppercase tracking-[0.2em] text-[#8C857B] block mb-1">
                  Шаг 2 — Ваше фото и визуальная посадка
                </span>
                <h2 className="font-serif text-xl text-[#1A1A1A]">
                  {tryOnComplete && selectedProduct
                    ? `На вас: ${selectedProduct.name} (${selectedSize})`
                    : "Сфотографируйтесь или загрузите фото"}
                </h2>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {!cameraActive ? (
                  <button
                    type="button"
                    onClick={startCamera}
                    className="px-4 py-2.5 bg-[#1A1A1A] text-white text-xs uppercase tracking-widest hover:bg-[#333333] transition-colors"
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
                  className="px-4 py-2.5 border border-[#1A1A1A] text-[#1A1A1A] text-xs uppercase tracking-widest hover:bg-[#FAF8F5] transition-colors"
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

            {cameraError && (
              <div className="mb-4 p-3 bg-amber-50 border border-amber-300 text-xs text-amber-900">
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
                  className={`relative aspect-[3/4] w-full bg-[#141414] border border-[#E8E3DA] overflow-hidden select-none ${
                    tryOnComplete && !compareBefore && !generatedVtonImage
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
                      {/* Ghost silhouette guide on live camera */}
                      <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
                        <div className="w-24 h-28 rounded-full border-2 border-dashed border-[#C5A059]/70 mb-2" />
                        <div className="w-56 h-64 rounded-t-[48px] border-2 border-dashed border-[#C5A059]/70" />
                        <span className="mt-3 px-3 py-1 bg-black/70 text-[#F7F5F0] text-[10px] uppercase tracking-widest">
                          Расположите плечи и торс в контуре
                        </span>
                      </div>

                      {cameraCountdown !== null && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
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
                          Сфоткать сейчас
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
                    <div className="w-full h-full flex flex-col items-center justify-center text-center p-8 bg-[#FAF8F5]">
                      <div className="w-20 h-20 border border-[#C5A059] flex items-center justify-center mb-5 text-xs uppercase tracking-widest text-[#C5A059]">
                        3D FIT
                      </div>
                      <h3 className="font-serif text-xl text-[#1A1A1A] mb-2">
                        Добавьте своё фото по пояс или в полный рост
                      </h3>
                      <p className="text-xs text-[#6E6A63] max-w-xs mb-6 leading-relaxed">
                        AI-Примерочная наденет выбранный костюм, поло, рубашку или брюки SABYR прямо
                        поверх вашей фотографии с точной подгонкой по плечам.
                      </p>
                      <div className="flex flex-col sm:flex-row gap-2.5 w-full max-w-xs">
                        <button
                          type="button"
                          onClick={startCamera}
                          className="flex-1 py-3 bg-[#1A1A1A] text-white text-xs uppercase tracking-widest hover:bg-[#333]"
                        >
                          Включить камеру
                        </button>
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="flex-1 py-3 border border-[#1A1A1A] text-[#1A1A1A] text-xs uppercase tracking-widest hover:bg-white"
                        >
                          Выбрать файл
                        </button>
                      </div>
                    </div>
                  )}

                  {/* 3. USER PHOTO + FITTED GARMENT OVERLAY */}
                  {!cameraActive && userPhoto && (
                    <div className="relative w-full h-full">
                      {/* Base Image: either Gemini VTON output or user's photo */}
                      <img
                        src={
                          !compareBefore && generatedVtonImage ? generatedVtonImage : userPhoto
                        }
                        alt="Фото пользователя для примерки"
                        className="w-full h-full object-cover pointer-events-none"
                      />

                      {/* Tailored 3D Garment Overlay placed directly on the user's body */}
                      {tryOnComplete &&
                        selectedProduct &&
                        !compareBefore &&
                        !generatedVtonImage && (
                          <div
                            style={{
                              position: "absolute",
                              left: `${garmentX}%`,
                              top: `${garmentY}%`,
                              width: `${66 * (garmentScale / 100) * (shoulderWidthScale / 100)}%`,
                              height: `${58 * (garmentScale / 100)}%`,
                              transform: "translate(-50%, -50%)",
                              opacity: fabricOpacity / 100,
                              transition: isDraggingGarment ? "none" : "all 0.18s ease-out",
                            }}
                            className="pointer-events-none"
                          >
                            <TailoredGarmentSvg
                              product={selectedProduct}
                              secondProduct={tryOnMode === "outfit" ? secondProduct : null}
                              size={selectedSize}
                            />
                          </div>
                        )}

                      {/* Top Status Bar on Photo */}
                      <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
                        <div className="bg-[#121212]/85 backdrop-blur-md text-white px-3 py-1.5 text-[10px] uppercase tracking-widest">
                          {compareBefore
                            ? "Исходное фото (До примерки)"
                            : tryOnComplete && selectedProduct
                            ? `Примерено: ${selectedProduct.name} · ${selectedSize}`
                            : "Фото загружено"}
                        </div>
                        {fitAnalysis && (
                          <div className="bg-[#C5A059] text-[#121212] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider">
                            Посадка {fitAnalysis.fitScore}%
                          </div>
                        )}
                      </div>

                      {/* Drag Hint */}
                      {tryOnComplete && !compareBefore && !generatedVtonImage && (
                        <div className="absolute bottom-3 inset-x-3 flex items-center justify-between bg-[#121212]/80 backdrop-blur-sm text-[#E8E3DA] px-3 py-2 text-[10px] uppercase tracking-wider pointer-events-none">
                          <span>Потяните вещь мышкой или пальцем для точной посадки</span>
                          <span className="text-[#C5A059]">Размер {selectedSize}</span>
                        </div>
                      )}

                      {/* Processing Loader Overlay */}
                      {isProcessing && (
                        <div className="absolute inset-0 bg-[#121212]/70 backdrop-blur-sm flex flex-col items-center justify-center text-white p-6 text-center">
                          <div className="w-11 h-11 border-2 border-[#C5A059] border-t-transparent rounded-full animate-spin mb-4" />
                          <p className="font-serif text-lg mb-1">
                            Сканируем плечи и надеваем {selectedProduct?.name}...
                          </p>
                          <p className="text-xs text-[#C5A059] uppercase tracking-widest">
                            Подгонка лекала размера {selectedSize}
                          </p>
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
                      className="py-2.5 px-3 border border-[#E8E3DA] bg-[#FAF8F5] text-[11px] uppercase tracking-wider text-[#1A1A1A] hover:border-[#1A1A1A] transition-colors"
                    >
                      {compareBefore ? "Показать с одеждой" : "До / После"}
                    </button>
                    <button
                      type="button"
                      onClick={() => detectBodyFromPhotoClient(userPhoto, selectedProduct)}
                      className="py-2.5 px-3 border border-[#E8E3DA] bg-[#FAF8F5] text-[11px] uppercase tracking-wider text-[#1A1A1A] hover:border-[#1A1A1A] transition-colors"
                    >
                      Авто-центровка
                    </button>
                    <button
                      type="button"
                      onClick={handleDownloadComposite}
                      className="py-2.5 px-3 bg-[#1A1A1A] text-white text-[11px] uppercase tracking-wider hover:bg-[#333] transition-colors"
                    >
                      Скачать фото
                    </button>
                  </div>
                )}
              </div>

              {/* RIGHT PANEL: Interactive Fit Sliders & AI Fit Verdict (5 cols) */}
              <div className="md:col-span-5 space-y-5">
                {/* Interactive Garment Fit Sliders */}
                <div className="bg-[#FAF8F5] border border-[#E8E3DA] p-4 space-y-3.5">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs uppercase tracking-[0.15em] text-[#1A1A1A] font-medium">
                      Точная подгонка по фигуре
                    </h3>
                    <button
                      type="button"
                      onClick={() => {
                        setGarmentScale(102);
                        setShoulderWidthScale(100);
                        setFabricOpacity(98);
                        if (userPhoto) detectBodyFromPhotoClient(userPhoto, selectedProduct);
                      }}
                      className="text-[10px] uppercase tracking-wider text-[#C5A059] hover:underline"
                    >
                      Сбросить
                    </button>
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] text-[#6E6A63] mb-1">
                      <span>Масштаб изделия</span>
                      <span>{garmentScale}%</span>
                    </div>
                    <input
                      type="range"
                      min={60}
                      max={155}
                      value={garmentScale}
                      onChange={(e) => setGarmentScale(Number(e.target.value))}
                      className="w-full accent-[#1A1A1A]"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] text-[#6E6A63] mb-1">
                      <span>Ширина плечевого пояса</span>
                      <span>{shoulderWidthScale}%</span>
                    </div>
                    <input
                      type="range"
                      min={75}
                      max={135}
                      value={shoulderWidthScale}
                      onChange={(e) => setShoulderWidthScale(Number(e.target.value))}
                      className="w-full accent-[#1A1A1A]"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] text-[#6E6A63] mb-1">
                      <span>Посадка по высоте (вверх / вниз)</span>
                      <span>{garmentY}%</span>
                    </div>
                    <input
                      type="range"
                      min={25}
                      max={85}
                      value={garmentY}
                      onChange={(e) => setGarmentY(Number(e.target.value))}
                      className="w-full accent-[#1A1A1A]"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] text-[#6E6A63] mb-1">
                      <span>Плотность наложения ткани</span>
                      <span>{fabricOpacity}%</span>
                    </div>
                    <input
                      type="range"
                      min={65}
                      max={100}
                      value={fabricOpacity}
                      onChange={(e) => setFabricOpacity(Number(e.target.value))}
                      className="w-full accent-[#1A1A1A]"
                    />
                  </div>
                </div>

                {/* Selected Item Reference Card */}
                {selectedProduct && (
                  <div className="bg-white border border-[#E8E3DA] p-4">
                    <div className="flex gap-3 items-center mb-3">
                      <img
                        src={selectedProduct.images[0]}
                        alt={selectedProduct.name}
                        className="w-14 h-18 object-cover bg-[#F2EFE9]"
                      />
                      <div>
                        <span className="text-[10px] uppercase tracking-widest text-[#C5A059] block">
                          Оригинал из каталога SABYR
                        </span>
                        <h4 className="font-serif text-base text-[#1A1A1A]">
                          {selectedProduct.name}
                        </h4>
                        <p className="text-xs text-[#6E6A63]">
                          {selectedProduct.price.toLocaleString("ru-KZ")} ₸ · Размер {selectedSize}
                        </p>
                      </div>
                    </div>

                    {fitAnalysis && (
                      <div className="space-y-2 pt-3 border-t border-[#E8E3DA] text-xs">
                        <div className="flex justify-between">
                          <span className="text-[#8C857B]">Вердикт AI:</span>
                          <span className="text-[#1A1A1A] font-medium">{fitAnalysis.verdict}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#8C857B]">Плечи:</span>
                          <span className="text-[#1A1A1A] text-right">{fitAnalysis.shoulders}</span>
                        </div>
                        <p className="text-[11px] text-[#6E6A63] pt-1 leading-relaxed">
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
                            tryOnMode
                          )
                        }
                        disabled={!userPhoto || isProcessing}
                        className="w-full py-3 border border-[#1A1A1A] text-[#1A1A1A] text-xs uppercase tracking-widest hover:bg-[#1A1A1A] hover:text-white transition-colors disabled:opacity-40"
                      >
                        {isProcessing ? "Обработка..." : "Пересчитать посадку AI"}
                      </button>

                      <button
                        type="button"
                        onClick={handleAddToCart}
                        className="w-full py-3.5 bg-[#C5A059] text-[#121212] text-xs uppercase tracking-widest font-medium hover:bg-[#d4b06a] transition-colors"
                      >
                        {addedFeedback
                          ? "Добавлено в корзину"
                          : tryOnMode === "outfit" && secondProduct
                          ? `В корзину оба изделия (${(
                              selectedProduct.price + secondProduct.price
                            ).toLocaleString("ru-KZ")} ₸)`
                          : `Добавить в корзину — ${selectedProduct.price.toLocaleString(
                              "ru-KZ"
                            )} ₸`}
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
        <div className="min-h-screen bg-[#FAF8F5] flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-[#1A1A1A] border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <AITryOnContent />
    </Suspense>
  );
}
