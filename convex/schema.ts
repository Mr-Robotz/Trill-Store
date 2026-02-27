import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    clerkId: v.string(),
    phone: v.optional(v.string()),
    role: v.union(v.literal("user"), v.literal("admin")),
    blocked: v.boolean(),
    createdAt: v.number(),
  }).index("by_clerkId", ["clerkId"]),

  products: defineTable({
    title: v.string(),
    subtitle: v.optional(v.string()),
    description: v.optional(v.string()),
    category: v.string(), // iphones|airpods|headsets|chargers|accessories
    featured: v.boolean(),
    images: v.array(v.string()),
    active: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_category", ["category"])
    .index("by_featured", ["featured"])
    .searchIndex("search_title", {
      searchField: "title",
      filterFields: ["category", "active"],
    }),

  variants: defineTable({
    productId: v.id("products"),
    sku: v.string(),
    attrs: v.object({
      color: v.optional(v.string()),
      storage: v.optional(v.string()),
    }),
    priceGhs: v.number(),
    stock: v.number(),
    active: v.boolean(),
  }).index("by_productId", ["productId"]),

  carts: defineTable({
    userId: v.id("users"),
    items: v.array(
      v.object({
        productId: v.id("products"),
        variantId: v.id("variants"),
        qty: v.number(),
      }),
    ),
    updatedAt: v.number(),
  }).index("by_userId", ["userId"]),

  wishlists: defineTable({
    userId: v.id("users"),
    productIds: v.array(v.id("products")),
    updatedAt: v.number(),
  }).index("by_userId", ["userId"]),

  orders: defineTable({
    userId: v.id("users"),
    status: v.union(
      v.literal("pending"),
      v.literal("paid"),
      v.literal("failed"),
      v.literal("fulfilled"),
    ),
    currency: v.string(), // GHS
    subtotalGhs: v.number(),
    deliveryFeeGhs: v.number(),
    totalGhs: v.number(),
    items: v.array(
      v.object({
        productId: v.id("products"),
        variantId: v.id("variants"),
        title: v.string(),
        variantLabel: v.string(),
        qty: v.number(),
        unitPriceGhs: v.number(),
      }),
    ),
    customerPhone: v.optional(v.string()),
    paymentId: v.optional(v.id("payments")),
    createdAt: v.number(),
    updatedAt: v.number(),
    stockReserved: v.boolean(),
    trackingNotes: v.optional(
      v.array(
        v.object({
          at: v.number(),
          note: v.string(),
          status: v.optional(v.string()), // optional label like "packed", "shipped"
        }),
      ),
    ),
  })
    .index("by_userId", ["userId"])
    .index("by_status", ["status"]),

  payments: defineTable({
    userId: v.id("users"),
    orderId: v.id("orders"),
    provider: v.string(), // "paystack"
    reference: v.string(),
    status: v.union(
      v.literal("initiated"),
      v.literal("success"),
      v.literal("failed"),
    ),
    amountGhs: v.number(),
    raw: v.optional(v.any()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_reference", ["reference"])
    .index("by_orderId", ["orderId"]),

  settings: defineTable({
    key: v.string(), // "global"
    deliveryFeeGhs: v.number(),
    updatedAt: v.number(),
  }).index("by_key", ["key"]),
});
