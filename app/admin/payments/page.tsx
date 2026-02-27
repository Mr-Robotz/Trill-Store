"use client";

import * as React from "react";

import { useQuery } from "convex/react";

import { motion } from "framer-motion";
import { api } from "../../../convex/_generated/api";
import { useAdminSearch } from "../../../components/admin/AdminShell";
import { AdminGuard } from "../../../components/admin/AdminGuard";
import { fadeUp } from "../../../components/motion/Presets";
import { Button } from "../../../components/ui/button";
import { AdminPaymentModal } from "../../../components/admin/AdminPaymentModal";



function includesAny(hay: string, needle: string) {
  return hay.toLowerCase().includes(needle.toLowerCase());
}

export default function AdminPayments() {
  const payments = useQuery(api.admin.listPayments, {});
  const { query } = useAdminSearch();

  const [open, setOpen] = React.useState(false);
  const [paymentId, setPaymentId] = React.useState<string | null>(null);

  const filtered = (payments ?? []).filter((p: any) => {
    if (!query.trim()) return true;
    return includesAny(p.reference ?? "", query) || includesAny(p.provider ?? "", query) || includesAny(p.status ?? "", query);
  });

  return (
    <AdminGuard>
      <div className="space-y-6">
        <motion.div initial="hidden" animate="visible" variants={fadeUp} className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">Payments</h1>
          <p className="text-sm text-muted-foreground">Search from the top bar. Click a row to drill down.</p>
        </motion.div>

        <div className="space-y-3">
          {filtered.map((p: any) => (
            <div key={p._id} className="glass rounded-md p-4 flex flex-wrap items-center justify-between gap-2">
              <div className="min-w-0">
                <div className="text-sm font-medium">{p.provider} • {p.status}</div>
                <div className="text-xs text-muted-foreground truncate">Ref: {p.reference}</div>
              </div>
              <div className="flex items-center gap-2">
                <div className="text-sm font-semibold">GHS {p.amountGhs.toFixed(0)}</div>
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-md"
                  onClick={() => { setPaymentId(p._id); setOpen(true); }}
                >
                  View
                </Button>
              </div>
            </div>
          ))}
        </div>

        <AdminPaymentModal open={open} onOpenChange={setOpen} paymentId={paymentId} />
      </div>
    </AdminGuard>
  );
}