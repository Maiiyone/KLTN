import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CartItem, Product } from '../types';

interface CartState {
  items: CartItem[];
  addItem: (product: Product, quantity?: number) => void;
  removeItem: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  clearCart: () => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (product, quantity = 1) => {
        if (!product || typeof product.id !== 'number') {
          // Ignore invalid product
          return;
        }

        set((state) => {
          const existingItem = state.items.find(
            (item) => item?.product && item.product.id === product.id
          );

          if (existingItem) {
            return {
              items: state.items.map((item) =>
                item?.product && item.product.id === product.id
                  ? { ...item, quantity: item.quantity + quantity }
                  : item
              ),
            };
          }

          return {
            items: [...state.items, { product, quantity }],
          };
        });
      },

      removeItem: (productId) => {
        set((state) => ({
          items: state.items.filter((item) => item?.product?.id !== productId),
        }));
      },

      updateQuantity: (productId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(productId);
          return;
        }

        set((state) => ({
          items: state.items.map((item) =>
            item?.product?.id === productId ? { ...item, quantity } : item
          ),
        }));
      },

      clearCart: () => set({ items: [] }),

      getTotalItems: () => {
        return get().items.reduce((total, item) => total + (item?.quantity || 0), 0);
      },

      getTotalPrice: () => {
        return get().items.reduce(
          (total, item) =>
            total + ((item?.product?.current_price || 0) * (item?.quantity || 0)),
          0
        );
      },
    }),
    {
      name: 'cart-storage',
      version: 1,
      migrate: (persistedState: any, _version: number) => {
        const items = Array.isArray(persistedState?.items)
          ? persistedState.items.filter(
              (it: any) => it && it.product && typeof it.product.id === 'number'
            )
          : [];
        return { ...persistedState, items };
      },
    }
  )
);

