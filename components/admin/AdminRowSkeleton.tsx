"use client";

import { Skeleton } from "../ui/skeleton";



export function AdminRowSkeleton() {
  return (
    <div className="glass rounded-md p-4 flex items-center justify-between gap-3">
      <div className="space-y-2 flex-1">
        <Skeleton className="h-4 w-1/3 rounded-md" />
        <Skeleton className="h-3 w-1/2 rounded-md" />
      </div>
      <Skeleton className="h-9 w-20 rounded-md" />
    </div>
  );
}