import fs from "fs";
import path from "path";
import { ProductItem } from "@/data/mockData";
import defaultProducts from "@/data/products.json";

import { prisma, isDatabaseAvailable } from "@/lib/db";
import { toKzt } from "@/lib/utils";

// In-memory cache + persistent storage
let memoryProducts: ProductItem[] = [...(defaultProducts as ProductItem[])];

const DB_PATH = path.join(process.cwd(), "src", "data", "products.json");

export async function getLiveCatalogProducts(): Promise<ProductItem[]> {
  try {
    const isDbUp = await isDatabaseAvailable();
    if (isDbUp) {
      const dbProducts = await prisma.product.findMany({
        where: { isActive: true },
        include: {
          images: { orderBy: { order: "asc" } },
          variants: true,
          category: true,
        },
        orderBy: { createdAt: "desc" },
      });

      if (dbProducts.length > 0) {
        return dbProducts.map((p) => ({
          id: p.id,
          name: p.name,
          slug: p.slug,
          category: p.category.name,
          price: toKzt(p.price),
          comparePrice: p.comparePrice ? toKzt(p.comparePrice) : null,
          description: p.description || "",
          composition: p.composition || "",
          care: p.care || "",
          images: p.images.map((img) => img.url),
          variants: p.variants.map((v) => ({
            id: v.id,
            color: v.color,
            colorHex: v.colorHex || "#000000",
            size: v.size,
            stock: v.stock,
          })),
          isNew: p.isNew,
          isBestSeller: p.isBestSeller,
          isClubOnly: p.isClubOnly,
          aiDescription: p.aiDescription || "",
          occasionTags: p.occasionTags,
          styleTags: p.styleTags,
        }));
      }
    }
  } catch (err) {
    console.warn("[productsStore] Failed to query PostgreSQL via Prisma, using local fallback:", err);
  }

  return getStoredProducts();
}

export function getStoredProducts(): ProductItem[] {
  try {
    if (typeof window === "undefined") {
      if (fs.existsSync(DB_PATH)) {
        const raw = fs.readFileSync(DB_PATH, "utf-8");
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          memoryProducts = parsed;
          return parsed;
        }
      }
    }
  } catch (err) {
    console.error("Error reading products db:", err);
  }
  return memoryProducts;
}

export function saveStoredProducts(products: ProductItem[]): boolean {
  try {
    memoryProducts = products;
    if (typeof window === "undefined") {
      fs.writeFileSync(DB_PATH, JSON.stringify(products, null, 2), "utf-8");
    }
    return true;
  } catch (err) {
    console.error("Error saving products db:", err);
    return false;
  }
}

export function addProductToDb(newProduct: ProductItem): ProductItem {
  const current = getStoredProducts();
  const updated = [newProduct, ...current];
  saveStoredProducts(updated);
  return newProduct;
}

export function updateProductInDb(
  id: string,
  updates: Partial<ProductItem>
): ProductItem | null {
  const current = getStoredProducts();
  const index = current.findIndex((p) => p.id === id);
  if (index === -1) return null;

  const updatedProduct: ProductItem = {
    ...current[index],
    ...updates,
    id: current[index].id,
  };
  const nextList = [...current];
  nextList[index] = updatedProduct;
  saveStoredProducts(nextList);
  return updatedProduct;
}

export function deleteProductFromDb(id: string): boolean {
  const current = getStoredProducts();
  const filtered = current.filter((p) => p.id !== id);
  saveStoredProducts(filtered);
  return true;
}
