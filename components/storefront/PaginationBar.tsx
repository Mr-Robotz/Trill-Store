"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "../ui/button";
import { cn } from "../../lib/utils";


export function PaginationBar({
  pageIndex,
  knownPages,
  canNext,
  onPrev,
  onNext,
  onGo,
}: {
  pageIndex: number;
  knownPages: number; // how many pages we have cursors for (numbers to render)
  canNext: boolean;
  onPrev: () => void;
  onNext: () => void;
  onGo: (idx: number) => void;
}) {
  const pages = Array.from({ length: knownPages }, (_, i) => i);

  return (
    <div className="flex items-center justify-center gap-2 pt-2">
      <Button
        variant="outline"
        size="icon"
        className="rounded-md"
        onClick={onPrev}
        disabled={pageIndex === 0}
        aria-label="Previous page"
      >
        <ChevronLeft className="h-5 w-5" />
      </Button>

      <div className="flex items-center gap-1">
        {pages.map((i) => {
          const active = i === pageIndex;
          return (
            <button
              key={i}
              onClick={() => onGo(i)}
              className={cn(
                "h-9 min-w-9 px-3 rounded-md text-sm glass",
                active ? "ring-2 ring-ring" : "hover:bg-accent/40"
              )}
              aria-label={`Go to page ${i + 1}`}
            >
              {i + 1}
            </button>
          );
        })}
      </div>

      <Button
        variant="outline"
        size="icon"
        className="rounded-md"
        onClick={onNext}
        disabled={!canNext}
        aria-label="Next page"
      >
        <ChevronRight className="h-5 w-5" />
      </Button>
    </div>
  );
}