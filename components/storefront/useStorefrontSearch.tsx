"use client";

import * as React from "react";

type Ctx = { query: string; setQuery: (v: string) => void };

const StorefrontSearchContext = React.createContext<Ctx | null>(null);

export function StorefrontSearchProvider({ children }: { children: React.ReactNode }) {
  const [query, setQuery] = React.useState("");
  return (
    <StorefrontSearchContext.Provider value={{ query, setQuery }}>
      {children}
    </StorefrontSearchContext.Provider>
  );
}

export function useStorefrontSearch() {
  const ctx = React.useContext(StorefrontSearchContext);
  if (!ctx) throw new Error("useStorefrontSearch must be used within StorefrontSearchProvider");
  return ctx;
}