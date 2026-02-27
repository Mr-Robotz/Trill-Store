"use client";

import * as React from "react";
import Link from "next/link";
import { Heart, Search, ShoppingBag, User } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import { useUser } from "@clerk/nextjs";
import { useStorefrontSearch } from "../storefront/useStorefrontSearch";
import { useDebouncedValue } from "../../hooks/useDebouncedValue";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { AuthModal } from "../auth/AuthModal";
import { CartSheet } from "../cart/CartSheet";
import { WishlistSheet } from "../cart/WishlistSheet";
import { CartGuestMerge } from "../cart/CartGuestMerge";

export function Navbar() {
  const { isSignedIn } = useUser();
  const [authOpen, setAuthOpen] = React.useState(false);
  const [cartOpen, setCartOpen] = React.useState(false);
  const [wishOpen, setWishOpen] = React.useState(false);

  const { query, setQuery } = useStorefrontSearch();
  const debounced = useDebouncedValue(query, 200);

  return (
    <header className="sticky top-0 z-50 w-full">
      <div className="glass">
        <div className="container-x-wide h-14 flex items-center gap-3">
          <Link href="/" className="font-semibold tracking-tight text-sm sm:text-base">
            iPhone<span className="text-muted-foreground">Store</span>
          </Link>

          <div className="flex-1 flex items-center justify-center">
            <div className="relative w-full max-w-xl">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search iPhone models, storage, accessories..."
                className="h-9 pl-9 rounded-md glass"
                aria-label="Search products"
              />
              {/* debounced is used by the page query; kept here to emphasize UX */}
              <span className="sr-only">{debounced}</span>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <ThemeToggle />

            <Button variant="ghost" size="icon" className="rounded-md" onClick={() => setWishOpen(true)} aria-label="Wishlist">
              <Heart className="h-5 w-5" />
            </Button>

            <Button variant="ghost" size="icon" className="rounded-md" onClick={() => setCartOpen(true)} aria-label="Cart">
              <ShoppingBag className="h-5 w-5" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="rounded-md"
              onClick={() => (isSignedIn ? null : setAuthOpen(true))}
              aria-label="Login or account"
            >
              <User className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      <AuthModal open={authOpen} onOpenChange={setAuthOpen} />
      <CartSheet open={cartOpen} onOpenChange={setCartOpen} />
      <WishlistSheet open={wishOpen} onOpenChange={setWishOpen} />
      <CartGuestMerge />
    </header>
  );
}