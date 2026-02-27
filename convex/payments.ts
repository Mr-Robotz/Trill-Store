import { mutation, query } from "convex/server";
import { v } from "convex/values";
import { requireDbUser, requireAdmin } from "./auth";

export const myPayments = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireDbUser(ctx);
    return await ctx.db.query("payments").filter((q) => q.eq(q.field("userId"), user._id)).order("desc").take(50);
  },
});

export const recordInitiated = mutation({
  args: {
    orderId: v.id("orders"),
    provider: v.string(),
    reference: v.string(),
    amountGhs: v.number(),
    raw: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const user = await requireDbUser(ctx);
    const now = Date.now();
    const paymentId = await ctx.db.insert("payments", {
      userId: user._id,
      orderId: args.orderId,
      provider: args.provider,
      reference: args.reference,
      status: "initiated",
      amountGhs: args.amountGhs,
      raw: args.raw,
      createdAt: now,
      updatedAt: now,
    });
    await ctx.db.patch(args.orderId, { paymentId, updatedAt: now });
    return paymentId;
  },
});

export const markResult = mutation({
  args: {
    reference: v.string(),
    status: v.union(v.literal("success"), v.literal("failed")),
    raw: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    // webhook path should be server-to-server; we allow without auth by using an action later,
    // but simplest: keep this mutation admin-only and call it from Next.js route with admin token.
    // We'll use an internal "action" alternative in Next.js route handler via service role pattern.
    await requireAdmin(ctx);

    const p = await ctx.db.query("payments").withIndex("by_reference", (q) => q.eq("reference", args.reference)).unique();
    if (!p) throw new Error("Payment not found");

    const now = Date.now();
    await ctx.db.patch(p._id, { status: args.status, raw: args.raw, updatedAt: now });

    const orderStatus = args.status === "success" ? "paid" : "failed";
    await ctx.db.patch(p.orderId, { status: orderStatus, updatedAt: now });
  },
});