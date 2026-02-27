"use client";

import * as React from "react";
import { CATEGORIES, Category } from "../../lib/constants";
import { Badge } from "../ui/badge";
import { cn } from "../../lib/utils";


export function CategoryPills({
  value,
  onChange,
}: {
  value: Category;
  onChange: (c: Category) => void;
}) {
  return (
    <div className="w-full overflow-x-auto">
      <div className="flex gap-2 py-1">
        {CATEGORIES.map((c) => {
          const active = c === value;
          return (
            <button key={c} onClick={() => onChange(c)} className="shrink-0">
              <Badge
                variant={active ? "default" : "secondary"}
                className={cn("h-8 px-3 text-sm rounded-md", active ? "" : "hover:bg-accent")}
              >
                {c}
              </Badge>
            </button>
          );
        })}
      </div>
    </div>
  );
}