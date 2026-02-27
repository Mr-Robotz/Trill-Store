export const CATEGORIES = ["All", "iPhones", "AirPods", "Headsets", "Chargers", "Accessories"] as const;
export type Category = (typeof CATEGORIES)[number];

export const CATEGORY_TO_KEY: Record<Category, string | null> = {
  All: null,
  iPhones: "iphones",
  AirPods: "airpods",
  Headsets: "headsets",
  Chargers: "chargers",
  Accessories: "accessories",
};