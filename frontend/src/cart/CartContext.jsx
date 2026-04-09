import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../auth/AuthContext';

const CartContext = createContext(null);

function storageKey(loginName) {
  return loginName ? `cart:${loginName}` : 'cart:guest';
}

function readCart(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeCart(key, items) {
  localStorage.setItem(key, JSON.stringify(items));
}

export function CartProvider({ children }) {
  const { loginName } = useAuth(); // ważne
  const key = useMemo(() => storageKey(loginName), [loginName]);

  const [items, setItems] = useState(() => readCart(key));

  // gdy zmienia się użytkownik -> przeładuj jego koszyk
  useEffect(() => {
    setItems(readCart(key));
  }, [key]);

  // zapis do localStorage dla aktualnego użytkownika
  useEffect(() => {
    writeCart(key, items);
  }, [key, items]);

  function addItem(product) {
    setItems((prev) => {
      const id = product.id ?? product.productId;
      const found = prev.find((x) => x.productId === id);
      if (found) {
        return prev.map((x) =>
          x.productId === id ? { ...x, quantity: x.quantity + 1 } : x
        );
      }
      return [
        ...prev,
        {
          productId: id,
          name: product.name,
          unitPrice: Number(product.unit_price ?? product.unitPrice),
          quantity: 1,
        },
      ];
    });
  }

  function inc(productId) {
    setItems((prev) =>
      prev.map((x) => (x.productId === productId ? { ...x, quantity: x.quantity + 1 } : x))
    );
  }

  function dec(productId) {
    setItems((prev) =>
      prev.map((x) => {
        if (x.productId !== productId) return x;
        return { ...x, quantity: Math.max(1, x.quantity - 1) };
      })
    );
  }

  function removeItem(productId) {
    setItems((prev) => prev.filter((x) => x.productId !== productId));
  }

  function clear() {
    setItems([]);
  }

  const total = useMemo(
    () => items.reduce((sum, it) => sum + it.unitPrice * it.quantity, 0),
    [items]
  );

  const value = useMemo(
    () => ({ items, total, addItem, inc, dec, removeItem, clear }),
    [items, total]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside CartProvider');
  return ctx;
}
