"use client";

import * as React from "react";

import { useMutation, useQuery } from "convex/react";

import { AnimatePresence, motion } from "framer-motion";

import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Trash2 } from "lucide-react";

import { toast } from "sonner";
import { api } from "../../../convex/_generated/api";
import { useAdminSearch } from "../../../components/admin/AdminShell";
import { AdminGuard } from "../../../components/admin/AdminGuard";
import { fadeUp, genieOpen, modalBackdrop } from "../../../components/motion/Presets";
import { Button } from "../../../components/ui/button";
import { Dialog, DialogContent} from "../../../components/ui/dialog";
import { Input } from "../../../components/ui/input";
import { ImageUploader } from "../../../components/admin/ImageUploader";

const productSchema = z.object({
  title: z.string().min(2),
  subtitle: z.string().optional(),
  category: z.enum([
    "iphones",
    "airpods",
    "headsets",
    "chargers",
    "accessories",
  ]),
  featured: z.boolean().default(false),
  active: z.boolean().default(true),
  imagesCsv: z.string().min(1, "Provide at least 1 image URL"),
});

type ProductForm = z.infer<typeof productSchema>;

const variantSchema = z.object({
  sku: z.string().min(2),
  color: z.string().optional(),
  storage: z.string().optional(),
  priceGhs: z.coerce.number().min(1),
  stock: z.coerce.number().min(0),
  active: z.boolean().default(true),
});

type VariantForm = z.infer<typeof variantSchema>;

export default function AdminProducts() {
  const products = useQuery(api.products.search, {
    query: null,
    category: null,
    limit: 200,
  });
  const upsertProduct = useMutation(api.products.adminUpsertProduct);

  const upsertVariant = useMutation(api.products.adminUpsertVariant);
  const deleteVariant = useMutation(api.products.adminDeleteVariant);

  const [open, setOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<any>(null);

  const variants = useQuery(
    api.products.variantsByProduct,
    editing?._id ? { productId: editing._id } : ("skip" as any),
  );

  // Product form
  const form = useForm<ProductForm>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      title: "",
      subtitle: "",
      category: "iphones",
      featured: false,
      active: true,
      imagesCsv: "",
    },
  });

  // Variant form (for add/edit)
  const [editingVariant, setEditingVariant] = React.useState<any>(null);
  const vform = useForm<VariantForm>({
    resolver: zodResolver(variantSchema),
    defaultValues: {
      sku: "",
      color: "",
      storage: "",
      priceGhs: 0,
      stock: 0,
      active: true,
    },
  });

  React.useEffect(() => {
    if (!open) return;

    // Reset product form
    if (!editing) {
      form.reset({
        title: "",
        subtitle: "",
        category: "iphones",
        featured: false,
        active: true,
        imagesCsv: "",
      });
    } else {
      form.reset({
        title: editing.title,
        subtitle: editing.subtitle ?? "",
        category: editing.category,
        featured: editing.featured,
        active: editing.active,
        imagesCsv: (editing.images ?? []).join(", "),
      });
    }

    // Reset variant form
    setEditingVariant(null);
    vform.reset({
      sku: "",
      color: "",
      storage: "",
      priceGhs: 0,
      stock: 0,
      active: true,
    });
  }, [open, editing, form, vform]);

  const saveProduct = form.handleSubmit(async (values) => {
    const images = values.imagesCsv
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const productId = await upsertProduct({
      productId: editing?._id,
      title: values.title,
      subtitle: values.subtitle || undefined,
      description: "Edit description later (admin expansion).",
      category: values.category,
      featured: values.featured,
      images,
      active: values.active,
    });
    toast.success("Product saved");

    const { query } = useAdminSearch();
    const filteredProducts = (products ?? []).filter((p: any) => {
      if (!query.trim()) return true;
      const s = query.toLowerCase();
      return (
        (p.title ?? "").toLowerCase().includes(s) ||
        (p.category ?? "").toLowerCase().includes(s)
      );
    });

    // Ensure editing stays available so variants can be managed immediately on new product
    const latest = { ...(editing ?? {}), _id: productId, ...values, images };
    setEditing(latest);
  });

  const startEditVariant = (v: any) => {
    setEditingVariant(v);
    vform.reset({
      sku: v.sku,
      color: v.attrs?.color ?? "",
      storage: v.attrs?.storage ?? "",
      priceGhs: v.priceGhs,
      stock: v.stock,
      active: v.active,
    });
  };

  const saveVariant = vform.handleSubmit(async (values) => {
    if (!editing?._id) return;

    await upsertVariant({
      variantId: editingVariant?._id,
      productId: editing._id,
      sku: values.sku,
      color: values.color || undefined,
      storage: values.storage || undefined,
      priceGhs: Number(values.priceGhs),
      stock: Number(values.stock),
      active: !!values.active,
    });
    toast.success("Variant saved");

    setEditingVariant(null);
    vform.reset({
      sku: "",
      color: "",
      storage: "",
      priceGhs: 0,
      stock: 0,
      active: true,
    });
  });

  const removeVariant = async (variantId: string) => {
    await deleteVariant({ variantId: variantId as any });
    toast.success("Variant deleted");
    if (editingVariant?._id === variantId) {
      setEditingVariant(null);
      vform.reset({
        sku: "",
        color: "",
        storage: "",
        priceGhs: 0,
        stock: 0,
        active: true,
      });
    }
  };

  return (
    <AdminGuard>
      <div className="space-y-6">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          className="flex items-center justify-between"
        >
          <div>
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">
              Manage Products
            </h1>
            <p className="text-sm text-muted-foreground">
              Product CRUD + Variants (SKU, storage/color, price, stock).
            </p>
          </div>
          <Button
            className="rounded-md"
            onClick={() => {
              setEditing(null);
              setOpen(true);
            }}
          >
            New product
          </Button>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {(filteredProducts ?? []).map((p: any) => (
            <button
              key={p._id}
              onClick={() => {
                setEditing(p);
                setOpen(true);
              }}
              className="text-left glass rounded-md p-3 hover:bg-accent/40 transition-colors"
            >
              <div className="aspect-[4/3] rounded-md overflow-hidden bg-muted/40">
                <img
                  src={p.images?.[0]}
                  alt={p.title}
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="mt-3 space-y-1">
                <div className="text-sm font-medium">{p.title}</div>
                <div className="text-xs text-muted-foreground">
                  {p.category}
                </div>
                <div className="text-xs text-muted-foreground">
                  {p.active ? "Active" : "Inactive"} •{" "}
                  {p.featured ? "Featured" : "—"}
                </div>
              </div>
            </button>
          ))}
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <AnimatePresence>
            {open ? (
              <DialogContent className="p-0 border-0 bg-transparent shadow-none">
                <motion.div
                  className="fixed inset-0 z-50 flex items-center justify-center"
                  variants={modalBackdrop}
                  initial="hidden"
                  animate="visible"
                  exit="hidden"
                >
                  <div className="absolute inset-0 bg-black/30" />
                  <motion.div
                    variants={genieOpen}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    className="relative w-[94vw] max-w-3xl glass rounded-md p-4"
                    style={{ transformOrigin: "top right" }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <h2 className="text-lg font-semibold tracking-tight">
                          {editing?._id ? "Edit product" : "New product"}
                        </h2>
                        <p className="text-sm text-muted-foreground">
                          Save the product first, then manage variants.
                        </p>
                      </div>

                      <Button
                        variant="outline"
                        className="rounded-md"
                        onClick={() => setOpen(false)}
                      >
                        Close
                      </Button>
                    </div>

                    <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {/* Product form */}
                      <div className="glass rounded-md p-4">
                        <div className="text-sm font-medium">Product</div>

                        <form onSubmit={saveProduct} className="mt-3 space-y-3">
                          <div className="space-y-1">
                            <label className="text-sm font-medium">Title</label>
                            <Input
                              className="h-10 rounded-md glass"
                              {...form.register("title")}
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-sm font-medium">
                              Subtitle
                            </label>
                            <Input
                              className="h-10 rounded-md glass"
                              {...form.register("subtitle")}
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-sm font-medium">
                              Category
                            </label>
                            <select
                              className="h-10 w-full rounded-md glass px-3 text-sm"
                              {...form.register("category")}
                            >
                              <option value="iphones">iphones</option>
                              <option value="airpods">airpods</option>
                              <option value="headsets">headsets</option>
                              <option value="chargers">chargers</option>
                              <option value="accessories">accessories</option>
                            </select>
                          </div>

                          <div className="space-y-1">
                            <label className="text-sm font-medium">
                              Images (comma-separated URLs)
                            </label>
                            <ImageUploader
                              onUploaded={(url) => {
                                const cur = form.getValues("imagesCsv") || "";
                                const next = cur.trim().length
                                  ? `${cur}, ${url}`
                                  : url;
                                form.setValue("imagesCsv", next, {
                                  shouldDirty: true,
                                });
                              }}
                            />
                            <Input
                              className="h-10 rounded-md glass"
                              {...form.register("imagesCsv")}
                            />
                            {form.formState.errors.imagesCsv?.message ? (
                              <p className="text-xs text-destructive">
                                {form.formState.errors.imagesCsv.message}
                              </p>
                            ) : null}
                          </div>

                          <div className="flex gap-3 text-sm">
                            <label className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                {...form.register("featured")}
                              />
                              Featured
                            </label>
                            <label className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                {...form.register("active")}
                              />
                              Active
                            </label>
                          </div>

                          <Button type="submit" className="rounded-md w-full">
                            Save product
                          </Button>
                        </form>
                      </div>

                      {/* Variants manager */}
                      <div className="glass rounded-md p-4">
                        <div className="flex items-center justify-between">
                          <div className="text-sm font-medium">Variants</div>
                          <Button
                            size="sm"
                            variant="outline"
                            className="rounded-md"
                            onClick={() => {
                              setEditingVariant(null);
                              vform.reset({
                                sku: "",
                                color: "",
                                storage: "",
                                priceGhs: 0,
                                stock: 0,
                                active: true,
                              });
                            }}
                            disabled={!editing?._id}
                          >
                            New variant
                          </Button>
                        </div>

                        {!editing?._id ? (
                          <div className="mt-3 text-sm text-muted-foreground">
                            Save the product first to manage variants.
                          </div>
                        ) : (
                          <>
                            <div className="mt-3 space-y-2">
                              {(variants ?? []).length ? (
                                (variants ?? []).map((v: any) => {
                                  const label =
                                    [v.attrs?.color, v.attrs?.storage]
                                      .filter(Boolean)
                                      .join(" • ") || "Default";
                                  return (
                                    <div
                                      key={v._id}
                                      className="glass rounded-md p-3 flex items-center justify-between gap-2"
                                    >
                                      <button
                                        className="min-w-0 text-left"
                                        onClick={() => startEditVariant(v)}
                                      >
                                        <div className="text-sm font-medium truncate">
                                          {v.sku}
                                        </div>
                                        <div className="text-xs text-muted-foreground truncate">
                                          {label} • GHS {v.priceGhs.toFixed(0)}{" "}
                                          • Stock {v.stock} •{" "}
                                          {v.active ? "Active" : "Inactive"}
                                        </div>
                                      </button>

                                      <Button
                                        size="icon"
                                        variant="ghost"
                                        className="rounded-md"
                                        onClick={() => removeVariant(v._id)}
                                        aria-label="Delete variant"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  );
                                })
                              ) : (
                                <div className="text-sm text-muted-foreground glass rounded-md p-3">
                                  No variants yet. Add one.
                                </div>
                              )}
                            </div>

                            <div className="mt-4 border-t border-border/60 pt-4">
                              <div className="text-sm font-medium">
                                {editingVariant
                                  ? "Edit variant"
                                  : "Add variant"}
                              </div>

                              <form
                                onSubmit={saveVariant}
                                className="mt-3 space-y-3"
                              >
                                <div className="space-y-1">
                                  <label className="text-sm font-medium">
                                    SKU
                                  </label>
                                  <Input
                                    className="h-10 rounded-md glass"
                                    {...vform.register("sku")}
                                  />
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                  <div className="space-y-1">
                                    <label className="text-sm font-medium">
                                      Color
                                    </label>
                                    <Input
                                      className="h-10 rounded-md glass"
                                      {...vform.register("color")}
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <label className="text-sm font-medium">
                                      Storage
                                    </label>
                                    <Input
                                      className="h-10 rounded-md glass"
                                      {...vform.register("storage")}
                                    />
                                  </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                  <div className="space-y-1">
                                    <label className="text-sm font-medium">
                                      Price (GHS)
                                    </label>
                                    <Input
                                      className="h-10 rounded-md glass"
                                      type="number"
                                      {...vform.register("priceGhs")}
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <label className="text-sm font-medium">
                                      Stock
                                    </label>
                                    <Input
                                      className="h-10 rounded-md glass"
                                      type="number"
                                      {...vform.register("stock")}
                                    />
                                  </div>
                                </div>

                                <label className="flex items-center gap-2 text-sm">
                                  <input
                                    type="checkbox"
                                    {...vform.register("active")}
                                  />
                                  Active
                                </label>

                                <div className="flex gap-2">
                                  <Button
                                    type="submit"
                                    className="rounded-md flex-1"
                                  >
                                    Save variant
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    className="rounded-md flex-1"
                                    onClick={() => {
                                      setEditingVariant(null);
                                      vform.reset({
                                        sku: "",
                                        color: "",
                                        storage: "",
                                        priceGhs: 0,
                                        stock: 0,
                                        active: true,
                                      });
                                    }}
                                  >
                                    Reset
                                  </Button>
                                </div>
                              </form>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </motion.div>
                </motion.div>
              </DialogContent>
            ) : null}
          </AnimatePresence>
        </Dialog>
      </div>
    </AdminGuard>
  );
}
