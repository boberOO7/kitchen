"use client";

import { createContext, useContext, useState, useEffect, useCallback, useTransition } from "react";
import {
  getCart as getCartAction,
  addToCart as addToCartAction,
  updateCartItem as updateCartItemAction,
  removeFromCart as removeFromCartAction,
  clearCart as clearCartAction,
} from "@/app/actions/cart";

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [cart, setCart] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Fetch cart on mount
  const fetchCart = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await getCartAction();
      if (result.success) {
        setCart(result.cart);
      } else if (result.error === "UNAUTHORIZED") {
        setCart(null);
      }
    } catch (error) {
      console.error("Failed to fetch cart:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  // Add to cart
  const addToCart = useCallback(async (productId, quantity = 1) => {
    startTransition(async () => {
      const result = await addToCartAction(productId, quantity);
      if (result.success) {
        await fetchCart();
        setIsDrawerOpen(true);
      } else if (result.error === "UNAUTHORIZED") {
        // Could redirect to login
        window.location.href = "/login";
      }
      return result;
    });
  }, [fetchCart]);

  // Update item quantity
  const updateQuantity = useCallback(async (productId, quantity) => {
    startTransition(async () => {
      const result = await updateCartItemAction(productId, quantity);
      if (result.success) {
        await fetchCart();
      }
      return result;
    });
  }, [fetchCart]);

  // Remove item
  const removeItem = useCallback(async (productId) => {
    startTransition(async () => {
      const result = await removeFromCartAction(productId);
      if (result.success) {
        await fetchCart();
      }
      return result;
    });
  }, [fetchCart]);

  // Clear cart
  const clearCart = useCallback(async () => {
    startTransition(async () => {
      const result = await clearCartAction();
      if (result.success) {
        await fetchCart();
      }
      return result;
    });
  }, [fetchCart]);

  // Drawer controls
  const openDrawer = useCallback(() => setIsDrawerOpen(true), []);
  const closeDrawer = useCallback(() => setIsDrawerOpen(false), []);
  const toggleDrawer = useCallback(() => setIsDrawerOpen((prev) => !prev), []);

  const value = {
    cart,
    isLoading,
    isPending,
    isDrawerOpen,
    itemCount: cart?.itemCount || 0,
    addToCart,
    updateQuantity,
    removeItem,
    clearCart,
    refetch: fetchCart,
    openDrawer,
    closeDrawer,
    toggleDrawer,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}

