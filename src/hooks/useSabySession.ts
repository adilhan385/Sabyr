/**
 * SABYR User Session Hook
 *
 * Provides the current authenticated user on the client side by fetching GET /api/session,
 * which verifies the httpOnly `sabyr-session` JWT cookie and loads the user's DB record.
 */

import { useState, useEffect, useCallback } from "react";

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface BonusLevel {
  name: string;
  percent: number;
  currentPurchases: number;
  nextLevelAt: number;
  privileges: string[];
}

export interface ClubMembership {
  isActive: boolean;
  tier: string;
  validUntil: string;
}

export interface OrderItem {
  name: string;
  color: string;
  size: string;
  quantity: number;
  price: number;
  image: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  date: string;
  status: string;
  statusColor: string;
  trackingNumber: string;
  deliveryCity: string;
  deliveryAddress: string;
  deliveryType: string;
  items: OrderItem[];
  total: number;
  bonusesEarned: number;
}

export interface BonusHistoryItem {
  id: string;
  type: string;
  amount: number;
  description: string;
  date: string;
}

export interface Address {
  id: string;
  title: string;
  city: string;
  street: string;
  isDefault: boolean;
}

export interface GiftCard {
  id: string;
  code: string;
  amount: number;
  balance: number;
  expiresAt: string;
  isUsed: boolean;
}

export interface SabyUser {
  id: string;
  name: string;
  phone: string;
  email: string;
  role?: "CUSTOMER" | "ADMIN";
  bonusBalance: number;
  bonusLevel: BonusLevel;
  clubMembership: ClubMembership;
  bonusHistory: BonusHistoryItem[];
  orders: Order[];
  addresses: Address[];
  giftCards: GiftCard[];
}

// ─── Empty guest / loading state ───────────────────────────────────────────────

export const EMPTY_USER: SabyUser = {
  id: "",
  name: "",
  phone: "",
  email: "",
  role: "CUSTOMER",
  bonusBalance: 0,
  bonusLevel: {
    name: "Новый клиент",
    percent: 3,
    currentPurchases: 0,
    nextLevelAt: 100000,
    privileges: ["Кешбэк 3% бонусами", "Бесплатная доставка от 30 000 ₸"],
  },
  clubMembership: { isActive: false, tier: "Нет членства", validUntil: "" },
  bonusHistory: [],
  orders: [],
  addresses: [],
  giftCards: [],
};

// ─── Hook ──────────────────────────────────────────────────────────────────────

export function useSabySession() {
  const [user, setUser] = useState<SabyUser>(EMPTY_USER);
  const [isLoading, setIsLoading] = useState(true);

  const refreshSession = useCallback(async () => {
    try {
      const res = await fetch("/api/session", { cache: "no-store" });
      const data = await res.json();
      if (data.authenticated && data.user) {
        setUser(data.user);
      } else {
        setUser(EMPTY_USER);
      }
    } catch {
      setUser(EMPTY_USER);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    fetch("/api/session", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        if (!active) return;
        if (data.authenticated && data.user) {
          setUser(data.user);
        } else {
          setUser(EMPTY_USER);
        }
      })
      .catch(() => {
        if (active) setUser(EMPTY_USER);
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const logout = useCallback(async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      setUser(EMPTY_USER);
    }
  }, []);

  const isGuest = !isLoading && user.id === "";

  return { user, setUser, isLoading, isGuest, refreshSession, logout };
}
