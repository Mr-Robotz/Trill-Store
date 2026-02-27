"use client";


import { useMutation, useQuery } from "convex/react";

import { motion } from "framer-motion";
import { api } from "../../../convex/_generated/api";
import { useAdminSearch } from "../../../components/admin/AdminShell";
import { AdminGuard } from "../../../components/admin/AdminGuard";
import { fadeUp } from "../../../components/motion/Presets";
import { Button } from "../../../components/ui/button";


export default function AdminUsers() {
  const users = useQuery(api.admin.listUsers, {});
  const setRole = useMutation(api.users.adminSetRole);
  const block = useMutation(api.users.adminBlockUser);

  const { query } = useAdminSearch();
  const filtered = (users ?? []).filter((u: any) => {
    if (!query.trim()) return true;
    const s = query.toLowerCase();
    return (
      (u.clerkId ?? "").toLowerCase().includes(s) ||
      (u.role ?? "").toLowerCase().includes(s)
    );
  });

  return (
    <AdminGuard>
      <div className="space-y-6">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          className="space-y-1"
        >
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">
            Manage Users
          </h1>
          <p className="text-sm text-muted-foreground">
            Roles and access control enforced server-side in Convex.
          </p>
        </motion.div>

        <div className="space-y-3">
          {(filtered ?? []).map((u: any) => (
            <div
              key={u._id}
              className="glass rounded-md p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div className="min-w-0">
                <div className="text-sm font-medium truncate">
                  Clerk: {u.clerkId}
                </div>
                <div className="text-xs text-muted-foreground">
                  Role:{" "}
                  <span className="text-foreground font-medium">{u.role}</span>{" "}
                  • {u.blocked ? "Blocked" : "Active"}
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  className="rounded-md"
                  variant={u.role === "admin" ? "default" : "outline"}
                  onClick={() => setRole({ userId: u._id, role: "admin" })}
                >
                  Make admin
                </Button>
                <Button
                  size="sm"
                  className="rounded-md"
                  variant={u.role === "user" ? "default" : "outline"}
                  onClick={() => setRole({ userId: u._id, role: "user" })}
                >
                  Make user
                </Button>
                <Button
                  size="sm"
                  className="rounded-md"
                  variant={u.blocked ? "outline" : "destructive"}
                  onClick={() => block({ userId: u._id, blocked: !u.blocked })}
                >
                  {u.blocked ? "Unblock" : "Block"}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AdminGuard>
  );
}
