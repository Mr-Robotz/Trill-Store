"use client";

import { Skeleton } from "../ui/skeleton";



export function ProductCardSkeleton() {
  return (
    <div className="glass rounded-md p-3">
      <Skeleton className="aspect-[4/3] rounded-md" />
      <div className="mt-3 space-y-2">
        <Skeleton className="h-4 w-3/4 rounded-md" />
        <Skeleton className="h-3 w-1/2 rounded-md" />
      </div>
    </div>
  );
}