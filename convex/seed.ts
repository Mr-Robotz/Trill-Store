import { mutation } from "convex/server";
import { v } from "convex/values";

function img(name: string) {
  // Replace with your own hosted images later; these are placeholders.
  return `https://placehold.co/1200x900/png?text=${encodeURIComponent(name)}`;
}

export const run = mutation({
  args: { devSecret: v.string() },
  handler: async (ctx, args) => {
    const secret = process.env.SEED_DEV_SECRET;
    if (!secret || args.devSecret !== secret) throw new Error("Bad dev secret");

    // wipe (dev only)
    const products = await ctx.db.query("products").collect();
    for (const p of products) {
      const vars = await ctx.db
        .query("variants")
        .withIndex("by_productId", (q) => q.eq("productId", p._id))
        .collect();
      for (const vv of vars) await ctx.db.delete(vv._id);
      await ctx.db.delete(p._id);
    }

    const now = Date.now();

    const catalog = [
      {
        title: "iPhone 15 Pro",
        subtitle: "Titanium. Pro camera. Pro performance.",
        category: "iphones",
        images: [img("iPhone 15 Pro - Front"), img("iPhone 15 Pro - Back")],
        variants: [
          {
            sku: "IP15P-BLK-128",
            color: "Black Titanium",
            storage: "128GB",
            priceGhs: 14500,
            stock: 8,
          },
          {
            sku: "IP15P-BLK-256",
            color: "Black Titanium",
            storage: "256GB",
            priceGhs: 15800,
            stock: 6,
          },
          {
            sku: "IP15P-NAT-256",
            color: "Natural Titanium",
            storage: "256GB",
            priceGhs: 15800,
            stock: 5,
          },
        ],
      },
      {
        title: "iPhone 15",
        subtitle: "Dynamic Island for all.",
        category: "iphones",
        images: [img("iPhone 15 - Pink"), img("iPhone 15 - Blue")],
        variants: [
          {
            sku: "IP15-PNK-128",
            color: "Pink",
            storage: "128GB",
            priceGhs: 10500,
            stock: 10,
          },
          {
            sku: "IP15-BLU-256",
            color: "Blue",
            storage: "256GB",
            priceGhs: 11800,
            stock: 7,
          },
        ],
      },
      {
        title: "iPhone 14 Pro",
        subtitle: "Still a Pro.",
        category: "iphones",
        images: [img("iPhone 14 Pro - Deep Purple")],
        variants: [
          {
            sku: "IP14P-DPP-128",
            color: "Deep Purple",
            storage: "128GB",
            priceGhs: 9800,
            stock: 5,
          },
          {
            sku: "IP14P-DPP-256",
            color: "Deep Purple",
            storage: "256GB",
            priceGhs: 10800,
            stock: 4,
          },
        ],
      },
      {
        title: "AirPods Pro (2nd gen)",
        subtitle: "Adaptive Audio. Now playing.",
        category: "airpods",
        images: [img("AirPods Pro 2")],
        variants: [{ sku: "APP2-WHT-STD", priceGhs: 3200, stock: 14 }],
      },
      {
        title: "AirPods (3rd gen)",
        subtitle: "Spatial Audio, everyday comfort.",
        category: "airpods",
        images: [img("AirPods 3")],
        variants: [{ sku: "AP3-WHT-STD", priceGhs: 2100, stock: 18 }],
      },
      {
        title: "Premium USB-C Charger 20W",
        subtitle: "Fast, compact, reliable.",
        category: "chargers",
        images: [img("USB-C 20W Charger")],
        variants: [{ sku: "CHG-20W-WHT", priceGhs: 180, stock: 50 }],
      },
      {
        title: "MagSafe Charger",
        subtitle: "Snap-on wireless charging.",
        category: "chargers",
        images: [img("MagSafe Charger")],
        variants: [{ sku: "MSF-CHG-STD", priceGhs: 420, stock: 25 }],
      },
      {
        title: "Wireless Headset Pro",
        subtitle: "Noise reduction, clean sound.",
        category: "headsets",
        images: [img("Wireless Headset Pro")],
        variants: [{ sku: "HSP-BLK-STD", priceGhs: 650, stock: 20 }],
      },
      {
        title: "USB-C to Lightning Cable (1m)",
        subtitle: "Durable, fast charge.",
        category: "accessories",
        images: [img("USB-C to Lightning Cable")],
        variants: [{ sku: "CBL-USBC-LTG-1M", priceGhs: 120, stock: 80 }],
      },
      {
        title: "iPhone 15 Pro Case",
        subtitle: "Slim protection, premium feel.",
        category: "accessories",
        images: [img("iPhone 15 Pro Case")],
        variants: [{ sku: "CASE-15P-CLR", priceGhs: 220, stock: 40 }],
      },
      {
        title: "Screen Protector (2-pack)",
        subtitle: "Crystal clear, easy install.",
        category: "accessories",
        images: [img("Screen Protector")],
        variants: [{ sku: "SP-2PK-STD", priceGhs: 90, stock: 120 }],
      },
      {
        title: "Car Charger Dual USB-C",
        subtitle: "Fast charging on the go.",
        category: "chargers",
        images: [img("Car Charger USB-C")],
        variants: [{ sku: "CAR-CHG-DUAL-USBC", priceGhs: 160, stock: 45 }],
      },
    ];

    for (const p of catalog) {
      const productId = await ctx.db.insert("products", {
        title: p.title,
        subtitle: p.subtitle,
        description:
          "Premium, curated product. Replace this description with full specs in admin.",
        category: p.category,
        featured: p.category === "iphones",
        images: p.images,
        active: true,
        createdAt: now,
        updatedAt: now,
      });

      for (const v0 of p.variants) {
        await ctx.db.insert("variants", {
          productId,
          sku: v0.sku,
          attrs: { color: (v0 as any).color, storage: (v0 as any).storage },
          priceGhs: (v0 as any).priceGhs,
          stock: (v0 as any).stock,
          active: true,
        });
      }
    }
    // Ensure global settings exists
    const s = await ctx.db
      .query("settings")
      .withIndex("by_key", (q) => q.eq("key", "global"))
      .unique();
    if (!s) {
      await ctx.db.insert("settings", {
        key: "global",
        deliveryFeeGhs: 30,
        updatedAt: Date.now(),
      });
    }

    return { ok: true, products: catalog.length };
  },
});
