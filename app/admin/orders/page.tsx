"use client";

import * as React from "react";

import { useQuery } from "convex/react";

import { motion } from "framer-motion";
import { api } from "../../../convex/_generated/api";
import { useAdminSearch } from "../../../components/admin/AdminShell";
import { AdminGuard } from "../../../components/admin/AdminGuard";
import { fadeUp } from "../../../components/motion/Presets";
import { Tabs, TabsList, TabsTrigger } from "../../../components/ui/tabs";
import { Button } from "../../../components/ui/button";
import { AdminOrderModal } from "../../../components/admin/AdminOrderModal";



const FILTERS = [
  { key: "all", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "paid", label: "Paid" },
  { key: "failed", label: "Failed" },
  { key: "fulfilled", label: "Fulfilled" },
] as const;

export default function AdminOrders() {
  const [filter, setFilter] =
    React.useState<(typeof FILTERS)[number]["key"]>("all");
  const orders = useQuery(api.admin.listOrders, {
    status: filter === "all" ? undefined : filter,
  });

  const [open, setOpen] = React.useState(false);
  const [orderId, setOrderId] = React.useState<string | null>(null);
  const isLoading = orders === undefined;

  const { query } = useAdminSearch();
  const filteredOrders = (orders ?? []).filter((o: any) => {
    if (!query.trim()) return true;
    const s = query.toLowerCase();
    return (
      (o._id ?? "").toLowerCase().includes(s) ||
      (o.status ?? "").toLowerCase().includes(s)
    );
  });

  return (
    <AdminGuard>
      <div className="space-y-6">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          className="space-y-2"
        >
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">
            Orders
          </h1>
          <p className="text-sm text-muted-foreground">
            Filter and drill down. Status updates are server-enforced.
          </p>

          <Tabs value={filter} onValueChange={(v) => setFilter(v as any)}>
            <TabsList className="glass rounded-md">
              {FILTERS.map((f) => (
                <TabsTrigger key={f.key} value={f.key} className="rounded-md">
                  {f.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </motion.div>

        <div className="space-y-3">
          {(filteredOrders ?? []).map((o: any) => (
            <div key={o._id} className="glass rounded-md p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="text-sm font-medium">Order: {o._id}</div>
                <div className="text-sm font-semibold">
                  GHS {o.totalGhs.toFixed(0)}
                </div>
              </div>

              <div className="mt-2 text-xs text-muted-foreground">
                {new Date(o.createdAt).toLocaleString()} • Status:{" "}
                <span className="text-foreground font-medium">{o.status}</span>
              </div>

              <div className="mt-3 flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  {o.items.length} items
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-md"
                  onClick={() => {
                    setOrderId(o._id);
                    setOpen(true);
                  }}
                >
                  View
                </Button>
              </div>
            </div>
          ))}
        </div>

        <AdminOrderModal open={open} onOpenChange={setOpen} orderId={orderId} />
      </div>
    </AdminGuard>
  );
}
