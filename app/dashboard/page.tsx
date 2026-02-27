"use client";

import * as React from "react";

import { useQuery } from "convex/react";

import { motion } from "framer-motion";
import { api } from "../../convex/_generated/api";
import { AppShell } from "../../components/app-shell/AppShell";
import { fadeUp, staggerChildren } from "../../components/motion/Presets";
import { Button } from "../../components/ui/button";
import { OrderDetailsModal } from "../../components/orders/OrderDetailsModal";


export default function DashboardPage() {
  const orders = useQuery(api.orders.myOrders, {});
  const payments = useQuery(api.payments.myPayments, {});

  const [open, setOpen] = React.useState(false);
  const [orderId, setOrderId] = React.useState<string | null>(null);

  return (
    <AppShell>
      <motion.div variants={staggerChildren} initial="hidden" animate="visible" className="space-y-6">
        <motion.div variants={fadeUp} className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">Your dashboard</h1>
          <p className="text-sm text-muted-foreground">Orders, payments, and receipts in one place.</p>
        </motion.div>

        <motion.div variants={fadeUp} className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <div className="glass rounded-md p-4">
            <div className="text-sm font-medium">Recent Orders</div>
            <div className="mt-3 space-y-2 text-sm">
              {(orders ?? []).slice(0, 10).map((o: any) => (
                <div key={o._id} className="flex items-center justify-between gap-2">
                  <span className="text-muted-foreground">{new Date(o.createdAt).toLocaleDateString()}</span>
                  <span className="font-medium">{o.status.toUpperCase()}</span>
                  <span className="font-semibold">GHS {o.totalGhs.toFixed(0)}</span>
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
              ))}
              {orders && orders.length === 0 ? <div className="text-muted-foreground">No orders yet.</div> : null}
            </div>
          </div>

          <div className="glass rounded-md p-4">
            <div className="text-sm font-medium">Payments</div>
            <div className="mt-3 space-y-2 text-sm">
              {(payments ?? []).slice(0, 10).map((p: any) => (
                <div key={p._id} className="flex items-center justify-between">
                  <span className="text-muted-foreground">{p.provider}</span>
                  <span className="font-medium">{p.status}</span>
                  <span className="font-semibold">GHS {p.amountGhs.toFixed(0)}</span>
                </div>
              ))}
              {payments && payments.length === 0 ? <div className="text-muted-foreground">No payments yet.</div> : null}
            </div>
          </div>
        </motion.div>
      </motion.div>

      <OrderDetailsModal open={open} onOpenChange={setOpen} orderId={orderId} />
    </AppShell>
  );
}