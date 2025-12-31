"use client";

import { createContext, useContext, useState, useEffect, useCallback, useTransition, useRef } from "react";
import {
  getCart as getCartAction,
  addToCart as addToCartAction,
  updateCartItem as updateCartItemAction,
  removeFromCart as removeFromCartAction,
  clearCart as clearCartAction,
} from "@/app/actions/cart";

const CartContext = createContext(null);

// Debounce delay for quantity updates (ms)
const DEBOUNCE_DELAY = 300;

// ─────────────────────────────────────────────────────────────────────────────
// Optimistic update helpers
// ─────────────────────────────────────────────────────────────────────────────

function optimisticallyAddItem(cart, productId, quantity, productInfo) {
  if (!cart) {
    return {
      id: null,
      subtotal: productInfo.unitPrice * quantity,
      total: productInfo.unitPrice * quantity,
      currency: "USD",
      itemCount: quantity,
      items: [{
        id: `temp-${Date.now()}`,
        productId,
        name: productInfo.name,
        unitPrice: productInfo.unitPrice,
        quantity,
        total: productInfo.unitPrice * quantity,
        product: productInfo.product || null,
      }],
    };
  }

  const existingItem = cart.items.find((i) => i.productId === productId);
  
  if (existingItem) {
    const newQuantity = existingItem.quantity + quantity;
    const newLineTotal = newQuantity * existingItem.unitPrice;
    const priceDiff = quantity * existingItem.unitPrice;
    
    return {
      ...cart,
      subtotal: cart.subtotal + priceDiff,
      total: cart.total + priceDiff,
      itemCount: cart.itemCount + quantity,
      items: cart.items.map((i) =>
        i.productId === productId
          ? { ...i, quantity: newQuantity, total: newLineTotal }
          : i
      ),
    };
  }

  const lineTotal = productInfo.unitPrice * quantity;
  return {
    ...cart,
    subtotal: cart.subtotal + lineTotal,
    total: cart.total + lineTotal,
    itemCount: cart.itemCount + quantity,
    items: [
      ...cart.items,
      {
        id: `temp-${Date.now()}`,
        productId,
        name: productInfo.name,
        unitPrice: productInfo.unitPrice,
        quantity,
        total: lineTotal,
        product: productInfo.product || null,
      },
    ],
  };
}

function optimisticallyUpdateQuantity(cart, productId, newQuantity) {
  if (!cart) return cart;

  const item = cart.items.find((i) => i.productId === productId);
  if (!item) return cart;

  const quantityDiff = newQuantity - item.quantity;
  const priceDiff = quantityDiff * item.unitPrice;
  const newLineTotal = newQuantity * item.unitPrice;

  return {
    ...cart,
    subtotal: cart.subtotal + priceDiff,
    total: cart.total + priceDiff,
    itemCount: cart.itemCount + quantityDiff,
    items: cart.items.map((i) =>
      i.productId === productId
        ? { ...i, quantity: newQuantity, total: newLineTotal }
        : i
    ),
  };
}

function optimisticallyRemoveItem(cart, productId) {
  if (!cart) return cart;

  const item = cart.items.find((i) => i.productId === productId);
  if (!item) return cart;

  return {
    ...cart,
    subtotal: cart.subtotal - item.total,
    total: cart.total - item.total,
    itemCount: cart.itemCount - item.quantity,
    items: cart.items.filter((i) => i.productId !== productId),
  };
}

function optimisticallyClearCart(cart) {
  if (!cart) return cart;

  return {
    ...cart,
    subtotal: 0,
    total: 0,
    itemCount: 0,
    items: [],
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Cart Provider
// ─────────────────────────────────────────────────────────────────────────────

export function CartProvider({ children }) {
  const [cart, setCart] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  
  // Debounce timers for quantity updates (per productId)
  const quantityTimersRef = useRef(new Map());

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      quantityTimersRef.current.forEach((timer) => clearTimeout(timer));
    };
  }, []);

  // Fetch cart from server
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

  // Fetch cart on mount
  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  // Add to cart - this one still needs server reconciliation 
  // because we're creating new items
  const addToCart = useCallback(async (productId, quantity = 1, productInfo = null) => {
    const previousCart = cart;
    
    if (productInfo) {
      setCart((prev) => optimisticallyAddItem(prev, productId, quantity, productInfo));
    }
    setIsDrawerOpen(true);
    
    startTransition(async () => {
      const result = await addToCartAction(productId, quantity);
      
      if (result.success && result.cart) {
        setCart(result.cart);
      } else if (result.error === "UNAUTHORIZED") {
        setCart(previousCart);
        window.location.href = "/login";
      } else {
        setCart(previousCart);
        console.error("Failed to add to cart:", result.error);
      }
    });
  }, [cart]);

  // Update quantity - FIRE AND FORGET with debounce
  // Optimistic update is instant, server sync happens in background
  const updateQuantity = useCallback((productId, quantity) => {
    if (quantity <= 0) {
      return removeItem(productId);
    }
    
    // Instant optimistic update
    setCart((prev) => optimisticallyUpdateQuantity(prev, productId, quantity));
    
    // Debounce server sync
    const existingTimer = quantityTimersRef.current.get(productId);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }
    
    const timer = setTimeout(() => {
      quantityTimersRef.current.delete(productId);
      // Fire and forget - no await, no reconciliation
      updateCartItemAction(productId, quantity).catch((err) => {
        console.error("Failed to sync quantity:", err);
      });
    }, DEBOUNCE_DELAY);
    
    quantityTimersRef.current.set(productId, timer);
  }, []);

  // Remove item - FIRE AND FORGET
  // Optimistic update is instant, server sync happens in background
  const removeItem = useCallback((productId) => {
    // Cancel any pending quantity update for this item
    const existingTimer = quantityTimersRef.current.get(productId);
    if (existingTimer) {
      clearTimeout(existingTimer);
      quantityTimersRef.current.delete(productId);
    }
    
    // Instant optimistic update
    setCart((prev) => optimisticallyRemoveItem(prev, productId));
    
    // Fire and forget
    removeFromCartAction(productId).catch((err) => {
      console.error("Failed to sync removal:", err);
    });
  }, []);

  // Clear cart - still uses reconciliation for safety
  const clearCart = useCallback(async () => {
    // Cancel all pending updates
    quantityTimersRef.current.forEach((timer) => clearTimeout(timer));
    quantityTimersRef.current.clear();
    
    const previousCart = cart;
    setCart((prev) => optimisticallyClearCart(prev));
    
    startTransition(async () => {
      const result = await clearCartAction();
      
      if (result.success && result.cart) {
        setCart(result.cart);
      } else {
        setCart(previousCart);
        console.error("Failed to clear cart:", result.error);
      }
    });
  }, [cart]);

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
