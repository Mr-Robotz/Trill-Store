"use client";

import * as React from "react";

import { motion } from "framer-motion";


import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { AdminGuard } from "../../../components/admin/AdminGuard";
import { fadeUp } from "../../../components/motion/Presets";
import { Input } from "../../../components/ui/input";
import { Button } from "../../../components/ui/button";


export default function AdminSettings() {
  const s = useQuery(api.settings.adminGet, {});
  const setFee = useMutation(api.settings.adminSetDeliveryFee);
  const [fee, setFeeState] = React.useState<string>("30");

  React.useEffect(() => {
    if (s?.deliveryFeeGhs != null) setFeeState(String(s.deliveryFeeGhs));
  }, [s?.deliveryFeeGhs]);

  return (
    <AdminGuard>
      <motion.div initial="hidden" animate="visible" variants={fadeUp} className="space-y-4">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">Settings</h1>
          <p className="text-sm text-muted-foreground">Global checkout settings.</p>
        </div>

        <div className="glass rounded-md p-4 space-y-3 max-w-lg">
          <div className="text-sm font-medium">Delivery fee (GHS)</div>
          <Input
            className="h-10 rounded-md glass"
            type="number"
            value={fee}
            onChange={(e) => setFeeState(e.target.value)}
          />
          <Button
            className="rounded-md"
            onClick={async () => {
              const n = Number(fee);
              if (Number.isFinite(n) && n >= 0) await setFee({ deliveryFeeGhs: n });
            }}
          >
            Save
          </Button>
          <div className="text-xs text-muted-foreground">
            Storefront checkout reads this value live from Convex.
          </div>
        </div>
      </motion.div>
    </AdminGuard>
  );
}