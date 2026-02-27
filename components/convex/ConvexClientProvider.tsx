"use client";

import * as React from "react";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import { useAuth } from "@clerk/nextjs";

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export function ConvexClientProvider({ children }: { children: React.ReactNode }) {
  const { getToken } = useAuth();

  React.useEffect(() => {
    convex.setAuth(async () => {
      const token = await getToken({ template: "convex" }).catch(() => null);
      return token ?? null;
    });
  }, [getToken]);

  return <ConvexProvider client={convex}>{children}</ConvexProvider>;
}