import { query, mutation } from "./_generated/server";;
import { v } from "convex/values";
import { requireAdmin } from "./auth";

export const search = query({
  args: {
    query: v.union(v.null(), v.string()),
    category: v.union(v.null(), v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit ?? 50, 100);

    if (args.query) {
      let q = ctx.db.query("products").withSearchIndex("search_title", (q) => {
        let qq = q.search("title", args.query).eq("active", true);
        if (args.category) qq = qq.eq("category", args.category);
        return qq;
      });
      return await q.take(limit);
    }

    // No search string -> just category/featured ordering (simple)
    if (args.category) {
      return await ctx.db.query("products").withIndex("by_category", (q) => q.eq("category", args.category)).filter((q) => q.eq(q.field("active"), true)).take(limit);
    }

    return await ctx.db.query("products").filter((q) => q.eq(q.field("active"), true)).order("desc").take(limit);
  },
});

export const variantsByProduct = query({
  args: { productId: v.id("products") },
  handler: async (ctx, args) => {
    return await ctx.db.query("variants").withIndex("by_productId", (q) => q.eq("productId", args.productId)).filter((q) => q.eq(q.field("active"), true)).collect();
  },
});

export const getById = query({
  args: { productId: v.id("products") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.productId);
  },
});

export const adminUpsertProduct = mutation({
  args: {
    productId: v.optional(v.id("products")),
    title: v.string(),
    subtitle: v.optional(v.string()),
    description: v.optional(v.string()),
    category: v.string(),
    featured: v.boolean(),
    images: v.array(v.string()),
    active: v.boolean(),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const now = Date.now();
    if (!args.productId) {
      return await ctx.db.insert("products", { ...args, createdAt: now, updatedAt: now });
    }
    await ctx.db.patch(args.productId, { ...args, updatedAt: now });
    return args.productId;
  },
  

});

export const adminUpsertVariant = mutation({
  args: {
    variantId: v.optional(v.id("variants")),
    productId: v.id("products"),
    sku: v.string(),
    color: v.optional(v.string()),
    storage: v.optional(v.string()),
    priceGhs: v.number(),
    stock: v.number(),
    active: v.boolean(),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const payload = {
      productId: args.productId,
      sku: args.sku,
      attrs: { color: args.color, storage: args.storage },
      priceGhs: args.priceGhs,
      stock: args.stock,
      active: args.active,
    };

    if (!args.variantId) {
      return await ctx.db.insert("variants", payload);
    }
    await ctx.db.patch(args.variantId, payload);
    return args.variantId;
  },
});

export const adminDeleteVariant = mutation({
  args: { variantId: v.id("variants") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    await ctx.db.delete(args.variantId);
  },
});

export const listPaged = query({
  args: {
    query: v.union(v.null(), v.string()),
    category: v.union(v.null(), v.string()),
    paginationOpts: v.object({
      numItems: v.number(),
      cursor: v.union(v.null(), v.string()),
    }),
  },
  handler: async (ctx, args) => {
    const { numItems, cursor } = args.paginationOpts;

    if (args.query) {
      const page = await ctx.db
        .query("products")
        .withSearchIndex("search_title", (q) => {
          let qq = q.search("title", args.query).eq("active", true);
          if (args.category) qq = qq.eq("category", args.category);
          return qq;
        })
        .paginate({ numItems, cursor: cursor ?? null });

      return page;
    }

    let q = ctx.db.query("products").filter((q) => q.eq(q.field("active"), true));
    if (args.category) {
      q = ctx.db
        .query("products")
        .withIndex("by_category", (q) => q.eq("category", args.category))
        .filter((q) => q.eq(q.field("active"), true));
    }

    return await q.order("desc").paginate({ numItems, cursor: cursor ?? null });
  },
});

export const related = query({
  args: { productId: v.id("products"), category: v.string(), limit: v.number() },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit, 12);
    const rows = await ctx.db
      .query("products")
      .withIndex("by_category", (q) => q.eq("category", args.category))
      .filter((q) => q.eq(q.field("active"), true))
      .order("desc")
      .take(limit + 5);

    return rows.filter((p) => p._id !== args.productId).slice(0, limit);
  },
});

export const featured = query({
  args: { limit: v.number() },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit, 20);
    return await ctx.db
      .query("products")
      .withIndex("by_featured", (q) => q.eq("featured", true))
      .filter((q) => q.eq(q.field("active"), true))
      .order("desc")
      .take(limit);
  },
});