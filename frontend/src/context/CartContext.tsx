import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { cartApi } from '../api/cartApi';
import { useAuth } from './AuthContext';
import type { Cart } from '../types';

interface CartContextType {
  cart: Cart | null;
  itemCount: number;
  isLoading: boolean;
  refresh: () => Promise<void>;
}

const EMPTY_CART: Cart = { cartId: null, items: [], totals: {}, itemCount: 0 };

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [cart, setCart] = useState<Cart | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!isAuthenticated || !user || user.role !== 'CUSTOMER') {
      setCart(null);
      return;
    }
    setIsLoading(true);
    try {
      const data = await cartApi.getCart();
      setCart(data ?? EMPTY_CART);
    } catch {
      setCart(EMPTY_CART);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return (
    <CartContext.Provider
      value={{
        cart,
        itemCount: cart?.itemCount ?? 0,
        isLoading,
        refresh,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = (): CartContextType => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
