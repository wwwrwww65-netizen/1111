import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface CartItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
}

interface CartState {
  items: CartItem[];
  isLoading: boolean;
  error: string | null;
}

interface CartActions {
  addItem: (item: Omit<CartItem, 'id'>) => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

type CartStore = CartState & CartActions;

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      // State
      items: [],
      isLoading: false,
      error: null,

      // Actions
      addItem: (newItem: Omit<CartItem, 'id'>) =>
        set((state) => {
          const existingItem = state.items.find(
            (item) => item.productId === newItem.productId
          );

          if (existingItem) {
            // Update quantity if item already exists
            return {
              items: state.items.map((item) =>
                item.productId === newItem.productId
                  ? { ...item, quantity: item.quantity + newItem.quantity }
                  : item
              ),
            };
          } else {
            // Add new item
            const itemWithId: CartItem = {
              ...newItem,
              id: `${newItem.productId}-${Date.now()}`,
            };
            return {
              items: [...state.items, itemWithId],
            };
          }
        }),

      removeItem: (itemId: string) =>
        set((state) => ({
          items: state.items.filter((item) => item.id !== itemId),
        })),

      updateQuantity: (itemId: string, quantity: number) =>
        set((state) => ({
          items: state.items.map((item) =>
            item.id === itemId
              ? { ...item, quantity: Math.max(0, quantity) }
              : item
          ),
        })),

      clearCart: () =>
        set({
          items: [],
          error: null,
        }),

      setLoading: (loading: boolean) =>
        set({ isLoading: loading }),

      setError: (error: string | null) =>
        set({ error }),
    }),
    {
      name: 'cart-storage',
      partialize: (state) => ({
        items: state.items,
      }),
    }
  )
);

// Computed values
export const useCartTotal = () => {
  const items = useCartStore((state) => state.items);
  return items.reduce((total, item) => total + item.price * item.quantity, 0);
};

export const useCartItemCount = () => {
  const items = useCartStore((state) => state.items);
  return items.reduce((count, item) => count + item.quantity, 0);
};