"use client";

import * as React from "react";

import { ProductCardSkeleton } from "../../components/products/ProductCartSkeleton";
import { Category, CATEGORY_TO_KEY } from "../../lib/constants";
import {
  StorefrontSearchProvider,
  useStorefrontSearch,
} from "../../components/storefront/useStorefrontSearch";
import { useDebouncedValue } from "../../hooks/useDebouncedValue";
import { api } from "../../convex/_generated/api";
import { useQuery } from "convex/react";
import { AppShell } from "../../components/app-shell/AppShell";
import { CategoryPills } from "../../components/app-shell/CategoryPills";
import { ProductCard } from "../../components/products/ProductCard";
import { PaginationBar } from "../../components/storefront/PaginationBar";

const PAGE_SIZE = 20;

function StorefrontInner() {
  const [category, setCategory] = React.useState<Category>("All");
  const { query } = useStorefrontSearch();
  const q = useDebouncedValue(query.trim(), 200);

  // Cursor-based paging, presented as numbered pages:
  // - cursors[0] is null (page 1 start)
  // - when you go "next", you store continueCursor as cursor for next page
  const [pageIndex, setPageIndex] = React.useState(0);
  const [cursors, setCursors] = React.useState<(string | null)[]>([null]);

  const featured = useQuery(api.products.featured, { limit: 8 });
  const featuredLoading = featured === undefined;

  // Reset paging when filters change
  React.useEffect(() => {
    setPageIndex(0);
    setCursors([null]);
  }, [q, category]);

  const cursor = cursors[pageIndex] ?? null;

  const page = useQuery(api.products.listPaged, {
    query: q.length ? q : null,
    category: CATEGORY_TO_KEY[category],
    paginationOpts: { numItems: PAGE_SIZE, cursor },
  });

  const isLoading = page === undefined;

  const products = page?.page ?? [];
  const canNext = !!page && !page.isDone && !!page.continueCursor;

  const onNext = () => {
    if (!canNext) return;
    const nextCursor = page!.continueCursor!;
    setCursors((prev) => {
      // If we already computed this next page cursor, keep it; else append
      if (prev[pageIndex + 1] === nextCursor) return prev;
      const copy = [...prev];
      copy[pageIndex + 1] = nextCursor;
      return copy;
    });
    setPageIndex((i) => i + 1);
  };

  const onPrev = () => setPageIndex((i) => Math.max(0, i - 1));

  const onGo = (idx: number) => {
    if (idx < 0 || idx >= cursors.length) return;
    setPageIndex(idx);
  };

  // Render page numbers:
  // - show all known pages (cursors length)
  // - if canNext, show an extra number “next page” only after user clicks next (keeps cursor chain clean)
  const knownPages = cursors.length;

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">
            Premium iPhones & Accessories
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            iPhones first. AirPods, headsets, chargers and accessories—curated
            and clean.
          </p>
        </div>

        {/* Hero */}
        <div className="glass rounded-md p-4 sm:p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">
            <div className="space-y-3">
              <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">
                iPhone-first. Clean accessories. Zero noise.
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground">
                Premium, Apple-like shopping experience—fast search, modal
                product details, and smooth checkout.
              </p>
              <div className="flex gap-2">
                <button
                  className="h-10 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium"
                  onClick={() =>
                    window.scrollTo({ top: 520, behavior: "smooth" })
                  }
                >
                  Shop iPhones
                </button>
                <button
                  className="h-10 px-4 rounded-md glass text-sm font-medium hover:bg-accent/40"
                  onClick={() =>
                    window.scrollTo({ top: 900, behavior: "smooth" })
                  }
                >
                  Featured
                </button>
              </div>
            </div>

            <div className="glass rounded-md p-4">
              <div className="text-xs text-muted-foreground">Why shop here</div>
              <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                <div className="glass rounded-md p-3">
                  <div className="font-medium">MoMo ready</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Paystack MTN MoMo Ghana
                  </div>
                </div>
                <div className="glass rounded-md p-3">
                  <div className="font-medium">Real-time</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Convex sync + updates
                  </div>
                </div>
                <div className="glass rounded-md p-3">
                  <div className="font-medium">Premium UI</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Glass, compact, fast
                  </div>
                </div>
                <div className="glass rounded-md p-3">
                  <div className="font-medium">No agents</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Direct checkout flow
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Featured */}
        <div className="space-y-2" id="featured">
          <div className="flex items-center justify-between">
            <h2 className="text-lg sm:text-xl font-semibold">Featured</h2>
            <div className="text-xs text-muted-foreground">Top picks</div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {featuredLoading
              ? Array.from({ length: 8 }).map((_, i) => (
                  <ProductCardSkeleton key={i} />
                ))
              : (featured ?? []).map((p: any) => (
                  <ProductCard key={p._id} product={p} />
                ))}
          </div>
        </div>

        <CategoryPills value={category} onChange={setCategory} />

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {isLoading
            ? Array.from({ length: 10 }).map((_, i) => (
                <ProductCardSkeleton key={i} />
              ))
            : products.map((p: any) => <ProductCard key={p._id} product={p} />)}
        </div>

        {page && products.length === 0 ? (
          <div className="glass rounded-md p-4 text-sm text-muted-foreground">
            No products found. Try another search or category.
          </div>
        ) : null}

        <PaginationBar
          pageIndex={pageIndex}
          knownPages={knownPages}
          canNext={canNext}
          onPrev={onPrev}
          onNext={onNext}
          onGo={onGo}
        />
      </div>
    </AppShell>
  );
}

export default function Page() {
  return (
    <StorefrontSearchProvider>
      <StorefrontInner />
    </StorefrontSearchProvider>
  );
}
