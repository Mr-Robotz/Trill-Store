import { query, mutation } from "convex/server";
import { v } from "convex/values";
import { requireAdmin } from "./auth";

export const kpis = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);

    const orders = await ctx.db.query("orders").collect();
    const payments = await ctx.db.query("payments").collect();
    const variants = await ctx.db.query("variants").collect();

    const paid = orders.filter((o) => o.status === "paid" || o.status === "fulfilled");
    const pending = orders.filter((o) => o.status === "pending");
    const failed = orders.filter((o) => o.status === "failed");

    const salesGhs = paid.reduce((a, o) => a + o.totalGhs, 0);
    const lowStock = variants.filter((v) => v.stock <= 3 && v.active).length;

    return {
      salesGhs,
      ordersTotal: orders.length,
      ordersPending: pending.length,
      ordersFailed: failed.length,
      paymentsTotal: payments.length,
      lowStock,
    };
  },
});

export const listUsers = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    return await ctx.db.query("users").order("desc").take(200);
  },
});

export const listOrders = query({
  args: { status: v.optional(v.string()) },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    if (!args.status) return await ctx.db.query("orders").order("desc").take(200);
    return await ctx.db.query("orders").withIndex("by_status", (q) => q.eq("status", args.status as any)).take(200);
  },
});

export const listPayments = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    return await ctx.db.query("payments").order("desc").take(200);
  },
});

export const paymentById = query({
  args: { paymentId: v.id("payments") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const payment = await ctx.db.get(args.paymentId);
    if (!payment) return null;
    const order = await ctx.db.get(payment.orderId);
    const user = await ctx.db.get(payment.userId);
    return { payment, order, user };
  },
});