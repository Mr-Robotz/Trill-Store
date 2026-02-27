"use client";

import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";


export function AdminGuard({ children }: { children: React.ReactNode }) {
  const me = useQuery(api.users.me, {});
  if (me === undefined) return null;

  if (!me) {
    return (
      <div className="glass rounded-md p-4 text-sm text-muted-foreground">
        Please sign in to access admin.
      </div>
    );
  }

  if (me.role !== "admin") {
    return (
      <div className="glass rounded-md p-4 text-sm text-muted-foreground">
        You are not authorized to view this page.
      </div>
    );
  }

  return <>{children}</>;
}