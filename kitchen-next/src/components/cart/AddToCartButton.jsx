"use client";

import { useState } from "react";
import { useCart } from "@/contexts/CartContext";

export default function AddToCartButton({ productId, className = "" }) {
  const { addToCart, isPending } = useCart();
  const [isAdding, setIsAdding] = useState(false);

  const handleClick = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    setIsAdding(true);
    await addToCart(productId, 1);
    setIsAdding(false);
  };

  return (
    <button
      onClick={handleClick}
      disabled={isPending || isAdding}
      className={`flex items-center justify-center gap-2 rounded bg-[var(--sky-accent)] px-4 py-2 text-sm font-medium text-[var(--sky-accent-fg)] transition-all hover:opacity-90 disabled:opacity-50 ${className}`}
    >
      {isAdding ? (
        <>
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          <span>Додаю...</span>
        </>
      ) : (
        <>
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <span>В кошик</span>
        </>
      )}
    </button>
  );
}

