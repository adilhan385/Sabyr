import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CartItem {
  id: string;
  productId: string;
  variantId: string;
  name: string;
  price: number;
  image: string;
  color: string;
  size: string;
  quantity: number;
  slug: string;
}

export interface AppliedPromo {
  code: string;
  discountAmount: number;
  description: string;
}

export interface AppliedGiftCard {
  code: string;
  amount: number;
}

interface CartStore {
  items: CartItem[];
  isOpen: boolean;
  appliedPromo: AppliedPromo | null;
  appliedGiftCard: AppliedGiftCard | null;
  bonusesUsed: number;

  // Actions
  addItem: (item: CartItem) => void;
  removeItem: (variantId: string) => void;
  updateQuantity: (variantId: string, quantity: number) => void;
  updateSize: (variantId: string, newVariantId: string, newSize: string) => void;
  setAppliedPromo: (promo: AppliedPromo | null) => void;
  setAppliedGiftCard: (gc: AppliedGiftCard | null) => void;
  setBonusesUsed: (bonuses: number) => void;
  clearCart: () => void;
  toggleCart: () => void;
  openCart: () => void;
  closeCart: () => void;

  // Computed
  totalItems: () => number;
  totalPrice: () => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      appliedPromo: null,
      appliedGiftCard: null,
      bonusesUsed: 0,

      addItem: (newItem) => {
        set((state) => {
          const existingIndex = state.items.findIndex(
            (item) => item.variantId === newItem.variantId
          );

          if (existingIndex >= 0) {
            const updated = [...state.items];
            updated[existingIndex] = {
              ...updated[existingIndex],
              quantity: updated[existingIndex].quantity + newItem.quantity,
            };
            return { items: updated };
          }

          return { items: [...state.items, newItem] };
        });
      },

      removeItem: (variantId) => {
        set((state) => ({
          items: state.items.filter((item) => item.variantId !== variantId),
        }));
      },

      updateQuantity: (variantId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(variantId);
          return;
        }
        set((state) => ({
          items: state.items.map((item) =>
            item.variantId === variantId ? { ...item, quantity } : item
          ),
        }));
      },

      updateSize: (variantId, newVariantId, newSize) => {
        set((state) => ({
          items: state.items.map((item) =>
            item.variantId === variantId
              ? { ...item, variantId: newVariantId, size: newSize }
              : item
          ),
        }));
      },

      setAppliedPromo: (appliedPromo) => set({ appliedPromo }),
      setAppliedGiftCard: (appliedGiftCard) => set({ appliedGiftCard }),
      setBonusesUsed: (bonusesUsed) => set({ bonusesUsed }),

      clearCart: () =>
        set({
          items: [],
          appliedPromo: null,
          appliedGiftCard: null,
          bonusesUsed: 0,
        }),
      toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),
      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),

      totalItems: () => get().items.reduce((sum, item) => sum + item.quantity, 0),
      totalPrice: () => get().items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    }),
    {
      name: "sabyr-cart",
      partialize: (state) => ({
        items: state.items,
        appliedPromo: state.appliedPromo,
        appliedGiftCard: state.appliedGiftCard,
        bonusesUsed: state.bonusesUsed,
      }),
    }
  )
);
