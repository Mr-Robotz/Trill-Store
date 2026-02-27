const KEY = "guest_cart_v1";

export type GuestCartItem = { productId: string; variantId: string; qty: number };

export function loadGuestCart(): GuestCartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}

export function saveGuestCart(items: GuestCartItem[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(items));
}

export function clearGuestCart() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(KEY);
}