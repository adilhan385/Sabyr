import React from "react";

interface SabyrLogoProps {
  className?: string;
  height?: number | string;
}

/**
 * Точный векторный логотип-вордмарк SABYR (по официальному референсу бренда:
 * геометрия S с фасками, A в виде Λ без перекладины, широкие геометрические B, Y, R).
 */
export function SabyrLogo({ className = "h-4 w-auto", height }: SabyrLogoProps) {
  return (
    <svg
      viewBox="0 0 136 20"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={height ? { height, width: "auto" } : undefined}
      role="img"
      aria-label="SABYR"
    >
      {/* S */}
      <path d="M4.5 0H21.5L25.8 5.2L21.2 7.4L19.1 4.1H6.4L4.9 5.8L26 12.4V14.8L21.5 20H4.5L0 14.8L4.6 12.6L6.8 15.9H19.5L21.1 14.1L0 7.5V5.2L4.5 0Z" />
      {/* A (Λ) */}
      <path d="M27.2 20L38.4 0H44.6L55.8 20H49.8L41.5 5.2L33.2 20H27.2Z" />
      {/* B */}
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M58 0H76.8C80 0 81.8 1.8 81.8 4.8C81.8 7.1 80.5 8.8 78.4 9.5C80.9 10.2 82.4 12.1 82.4 14.8C82.4 18.1 80.3 20 76.9 20H58V0ZM63.6 3.9V8.1H74.6C75.8 8.1 76.5 7.3 76.5 6C76.5 4.7 75.8 3.9 74.6 3.9H63.6ZM63.6 11.8V16.1H75.1C76.4 16.1 77.1 15.3 77.1 13.95C77.1 12.6 76.4 11.8 75.1 11.8H63.6Z"
      />
      {/* Y */}
      <path d="M84.4 0H90.8L97.5 8.2L104.2 0H110.6L100.3 12.2V20H94.7V12.2L84.4 0Z" />
      {/* R */}
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M113 0H130.2C133.8 0 135.8 2.1 135.8 5.9C135.8 9.2 134.1 11.3 131.1 11.9L136 20H129.6L125.2 12.2H118.6V20H113V0ZM118.6 4V8.5H129.2C130.5 8.5 131.2 7.6 131.2 6.25C131.2 4.9 130.5 4 129.2 4H118.6Z"
      />
    </svg>
  );
}

interface SabyrAvatarProps {
  className?: string;
  size?: number;
}

/**
 * Круглая фирменная аватарка SABYR (чёрный круг с белым логотипом SABYR по центру).
 */
export function SabyrAvatar({ className = "w-12 h-12", size }: SabyrAvatarProps) {
  return (
    <svg
      viewBox="0 0 187 187"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={size ? { width: size, height: size } : undefined}
      role="img"
      aria-label="SABYR Avatar"
    >
      <circle cx="93.5" cy="93.5" r="93.5" fill="#050505" />
      <g transform="translate(45, 86) scale(0.713, 0.75)" fill="#FFFFFF">
        <path d="M4.5 0H21.5L25.8 5.2L21.2 7.4L19.1 4.1H6.4L4.9 5.8L26 12.4V14.8L21.5 20H4.5L0 14.8L4.6 12.6L6.8 15.9H19.5L21.1 14.1L0 7.5V5.2L4.5 0Z" />
        <path d="M27.2 20L38.4 0H44.6L55.8 20H49.8L41.5 5.2L33.2 20H27.2Z" />
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M58 0H76.8C80 0 81.8 1.8 81.8 4.8C81.8 7.1 80.5 8.8 78.4 9.5C80.9 10.2 82.4 12.1 82.4 14.8C82.4 18.1 80.3 20 76.9 20H58V0ZM63.6 3.9V8.1H74.6C75.8 8.1 76.5 7.3 76.5 6C76.5 4.7 75.8 3.9 74.6 3.9H63.6ZM63.6 11.8V16.1H75.1C76.4 16.1 77.1 15.3 77.1 13.95C77.1 12.6 76.4 11.8 75.1 11.8H63.6Z"
        />
        <path d="M84.4 0H90.8L97.5 8.2L104.2 0H110.6L100.3 12.2V20H94.7V12.2L84.4 0Z" />
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M113 0H130.2C133.8 0 135.8 2.1 135.8 5.9C135.8 9.2 134.1 11.3 131.1 11.9L136 20H129.6L125.2 12.2H118.6V20H113V0ZM118.6 4V8.5H129.2C130.5 8.5 131.2 7.6 131.2 6.25C131.2 4.9 130.5 4 129.2 4H118.6Z"
        />
      </g>
    </svg>
  );
}
