"use client";


import { useQuery } from "convex/react";

import { motion } from "framer-motion";
import { api } from "../../convex/_generated/api";
import { AdminGuard } from "../../components/admin/AdminGuard";
import { fadeUp, staggerChildren } from "../../components/motion/Presets";


export default function AdminOverview() {
  const kpis = useQuery(api.admin.kpis, {});

  return (
    <AdminGuard>
      <motion.div variants={staggerChildren} initial="hidden" animate="visible" className="space-y-6">
        <motion.div variants={fadeUp} className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">Overview</h1>
          <p className="text-sm text-muted-foreground">Sales, orders, payments, and stock signals.</p>
        </motion.div>

        <motion.div variants={fadeUp} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <div className="glass rounded-md p-4">
            <div className="text-xs text-muted-foreground">Sales (GHS)</div>
            <div className="mt-2 text-xl font-semibold">{(kpis?.salesGhs ?? 0).toFixed(0)}</div>
          </div>
          <div className="glass rounded-md p-4">
            <div className="text-xs text-muted-foreground">Orders</div>
            <div className="mt-2 text-xl font-semibold">{kpis?.ordersTotal ?? 0}</div>
            <div className="mt-2 text-xs text-muted-foreground">
              Pending: {kpis?.ordersPending ?? 0} • Failed: {kpis?.ordersFailed ?? 0}
            </div>
          </div>
          <div className="glass rounded-md p-4">
            <div className="text-xs text-muted-foreground">Low stock variants</div>
            <div className="mt-2 text-xl font-semibold">{kpis?.lowStock ?? 0}</div>
          </div>
        </motion.div>
      </motion.div>
    </AdminGuard>
  );
}