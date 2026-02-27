import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireUser, requireDbUser, requireAdmin } from "./auth";

export const me = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    return ctx.db.query("users").withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject)).unique();
  },
});

export const ensureUser = mutation({
  args: { phone: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const identity = await requireUser(ctx);
    const existing = await ctx.db.query("users").withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject)).unique();
    if (existing) return existing._id;

    return await ctx.db.insert("users", {
      clerkId: identity.subject,
      phone: args.phone,
      role: "user",
      blocked: false,
      createdAt: Date.now(),
    });
  },
});

export const adminSetRole = mutation({
  args: { userId: v.id("users"), role: v.union(v.literal("user"), v.literal("admin")) },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    await ctx.db.patch(args.userId, { role: args.role });
  },
});

export const adminBlockUser = mutation({
  args: { userId: v.id("users"), blocked: v.boolean() },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    await ctx.db.patch(args.userId, { blocked: args.blocked });
  },
});