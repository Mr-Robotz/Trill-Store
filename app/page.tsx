"use client";

import * as React from "react";


import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { Category, CATEGORY_TO_KEY } from "../lib/constants";
import { StorefrontSearchProvider, useStorefrontSearch } from "../components/storefront/useStorefrontSearch";
import { useDebouncedValue } from "../hooks/useDebouncedValue";
import { AppShell } from "../components/app-shell/AppShell";
import { CategoryPills } from "../components/app-shell/CategoryPills";
import { ProductCardSkeleton } from "../components/products/ProductCartSkeleton";
import { ProductCard } from "../components/products/ProductCard";
import { PaginationBar } from "../components/storefront/PaginationBar";


const PAGE_SIZE = 20;

function HomeInner() {
  const [category, setCategory] = React.useState<Category>("All");
  const { query } = useStorefrontSearch();
  const q = useDebouncedValue(query.trim(), 200);

  const [pageIndex, setPageIndex] = React.useState(0);
  const [cursors, setCursors] = React.useState<(string | null)[]>([null]);

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
      const copy = [...prev];
      copy[pageIndex + 1] = nextCursor;
      return copy;
    });
    setPageIndex((i) => i + 1);
  };

  const onPrev = () => setPageIndex((i) => Math.max(0, i - 1));
  const onGo = (idx: number) => idx >= 0 && idx < cursors.length && setPageIndex(idx);

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="glass rounded-md p-4 sm:p-6">
          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">
              iPhone-first. Clean accessories. Zero noise.
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Premium storefront, modal-first product details, and smooth MoMo checkout.
            </p>
          </div>
        </div>

        <CategoryPills value={category} onChange={setCategory} />

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {isLoading
            ? Array.from({ length: 10 }).map((_, i) => <ProductCardSkeleton key={i} />)
            : products.map((p: any) => <ProductCard key={p._id} product={p} />)}
        </div>

        <PaginationBar
          pageIndex={pageIndex}
          knownPages={cursors.length}
          canNext={canNext}
          onPrev={onPrev}
          onNext={onNext}
          onGo={onGo}
        />
      </div>
    </AppShell>
  );
}

export default function Home() {
  return (
    <StorefrontSearchProvider>
      <HomeInner />
    </StorefrontSearchProvider>
  );
}