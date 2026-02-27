"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, LayoutDashboard, Package, Receipt, Settings, Users, CreditCard } from "lucide-react";

import { UserButton } from "@clerk/nextjs";
import { cn } from "../../lib/utils";
import { Input } from "../ui/input";

type AdminSearchCtx = { query: string; setQuery: (v: string) => void };
const AdminSearchContext = React.createContext<AdminSearchCtx | null>(null);

export function useAdminSearch() {
  const ctx = React.useContext(AdminSearchContext);
  if (!ctx) throw new Error("useAdminSearch must be used within AdminShell");
  return ctx;
}

const nav = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/products", label: "Manage Products", icon: Package },
  { href: "/admin/orders", label: "Orders", icon: Receipt },
  { href: "/admin/payments", label: "Payments", icon: CreditCard },
  { href: "/admin/users", label: "Manage Users", icon: Users },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [query, setQuery] = React.useState("");

  // Optional: clear search when route changes
  React.useEffect(() => setQuery(""), [pathname]);

  return (
    <AdminSearchContext.Provider value={{ query, setQuery }}>
      <div className="min-h-dvh">
        <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr]">
          {/* Sidebar: full height, sticky */}
          <aside className="hidden lg:block sticky top-0 h-dvh glass border-r border-border/60">
            <div className="p-4">
              <Link href="/admin" className="font-semibold tracking-tight">
                Admin<span className="text-muted-foreground">Panel</span>
              </Link>

              <nav className="mt-6 space-y-1">
                {nav.map((item) => {
                  const active = pathname === item.href;
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "flex items-center gap-2 rounded-sm px-3 py-2 text-sm transition-colors",
                        active ? "bg-accent text-foreground" : "text-muted-foreground hover:bg-accent hover:text-foreground"
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>
          </aside>

          {/* Main */}
          <div className="min-w-0">
            {/* Top bar */}
            <header className="sticky top-0 z-40 glass border-b border-border/60">
              <div className="container-x-wide h-14 flex items-center gap-3">
                <div className="flex-1 max-w-xl">
                  <Input
                    className="h-9 rounded-md glass"
                    placeholder="Search (products, users, orders, payments)…"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                </div>

                <button className="rounded-md p-2 hover:bg-accent" aria-label="Notifications">
                  <Bell className="h-5 w-5" />
                </button>

                <div className="rounded-md glass px-2 py-1">
                  <UserButton afterSignOutUrl="/" />
                </div>
              </div>
            </header>

            <main className="container-x-wide py-6">{children}</main>
          </div>
        </div>
      </div>
    </AdminSearchContext.Provider>
  );
}