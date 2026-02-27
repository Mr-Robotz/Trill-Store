import { query, mutation } from "convex/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server"; // if you use convex-auth
// We’re using Clerk via Next.js token -> Convex. We'll read identity instead.

export async function requireUser(ctx: any) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error("Unauthorized");
  return identity;
}

export async function requireDbUser(ctx: any) {
  const identity = await requireUser(ctx);
  const clerkId = identity.subject;
  const user = await ctx.db
    .query("users")
    .withIndex("by_clerkId", (q: any) => q.eq("clerkId", clerkId))
    .unique();
  if (!user) throw new Error("User record missing (sync not complete)");
  if (user.blocked) throw new Error("Account blocked");
  return user;
}

export async function requireAdmin(ctx: any) {
  const user = await requireDbUser(ctx);
  if (user.role !== "admin") throw new Error("Admin only");
  return user;
}