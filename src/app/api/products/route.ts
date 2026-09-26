import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  getLiveCatalogProducts,
  addProductToDb,
  updateProductInDb,
  deleteProductFromDb,
} from "@/lib/productsStore";
import { ProductItem } from "@/data/mockData";
import { prisma, isDatabaseAvailable } from "@/lib/db";
import { toTiyn } from "@/lib/utils";
import { requireAdmin } from "@/lib/auth";

// ─── Zod Schemas ─────────────────────────────────────────────────────────────

const ProductVariantSchema = z.object({
  id: z.string().optional(),
  color: z.string().min(1),
  colorHex: z.string().regex(/^#[0-9a-fA-F]{3,6}$/).optional().default("#0D0D0D"),
  size: z.string().min(1),
  stock: z.number().int().min(0).default(0),
});

const CreateProductSchema = z.object({
  name: z.string().min(1, "Название обязательно").max(200),
  category: z.string().min(1).max(100).optional(),
  price: z.number().positive("Цена должна быть положительной").max(100_000_000),
  comparePrice: z.number().positive().max(100_000_000).nullable().optional(),
  description: z.string().max(2000).optional(),
  composition: z.string().max(500).optional(),
  care: z.string().max(500).optional(),
  images: z.array(z.string().min(1)).max(10).optional(),
  variants: z.array(ProductVariantSchema).max(50).optional(),
  isClubOnly: z.boolean().optional().default(false),
  isNew: z.boolean().optional().default(true),
  isBestSeller: z.boolean().optional().default(false),
});

const UpdateProductSchema = z.object({
  id: z.string().min(1, "ID обязателен"),
  name: z.string().min(1).max(200).optional(),
  category: z.string().min(1).max(100).optional(),
  price: z.number().positive("Цена должна быть положительной").max(100_000_000).optional(),
  comparePrice: z.number().positive().max(100_000_000).nullable().optional(),
  description: z.string().max(2000).optional(),
  composition: z.string().max(500).optional(),
  care: z.string().max(500).optional(),
  images: z.array(z.string().min(1)).max(10).optional(),
  variants: z.array(ProductVariantSchema).max(50).optional(),
  isClubOnly: z.boolean().optional(),
  isNew: z.boolean().optional(),
  isBestSeller: z.boolean().optional(),
});

const DeleteProductSchema = z.object({
  id: z.string().min(1, "ID обязателен"),
});

// ─── GET /api/products ────────────────────────────────────────────────────────

export async function GET() {
  const isDbUp = await isDatabaseAvailable();
  const products = await getLiveCatalogProducts();
  return NextResponse.json({
    success: true,
    source: isDbUp ? "database" : "local-file",
    products,
  });
}

// ─── POST /api/products ───────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    await requireAdmin(req);
  } catch (authError) {
    if (authError instanceof NextResponse) return authError;
    return NextResponse.json({ success: false, error: "Нет доступа" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const parsed = CreateProductSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Ошибка валидации", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const {
      name,
      category,
      price,
      comparePrice,
      description,
      composition,
      care,
      images,
      variants,
      isClubOnly,
      isNew,
      isBestSeller,
    } = parsed.data;

    const newId = `p-${Date.now()}`;
    const slug =
      name
        .toLowerCase()
        .replace(/[^\w\s-]/g, "")
        .replace(/[\s_-]+/g, "-")
        .replace(/^-+|-+$/g, "") || `product-${Date.now()}`;

    const newProduct: ProductItem = {
      id: newId,
      name,
      slug: `${slug}-${Math.floor(100 + Math.random() * 900)}`,
      category: category || "Пиджаки и жакеты",
      price,
      comparePrice: comparePrice ?? null,
      description: description || "Изделие из коллекции SABYR.",
      composition: composition || "100% натуральные материалы премиального качества.",
      care: care || "Сухая деликатная чистка.",
      images:
        Array.isArray(images) && images.length > 0 && images[0].trim()
          ? images
          : ["/example-product.svg"],
      variants:
        Array.isArray(variants) && variants.length > 0
          ? variants.map((v, i) => ({
              id: v.id || `${newId}-v${i}`,
              color: v.color,
              colorHex: v.colorHex || "#0D0D0D",
              size: v.size,
              stock: v.stock,
            }))
          : [
              { id: `${newId}-blk-xs`, color: "Чёрный", colorHex: "#0D0D0D", size: "XS", stock: 5 },
              { id: `${newId}-blk-s`, color: "Чёрный", colorHex: "#0D0D0D", size: "S", stock: 5 },
              { id: `${newId}-blk-m`, color: "Чёрный", colorHex: "#0D0D0D", size: "M", stock: 5 },
              { id: `${newId}-blk-l`, color: "Чёрный", colorHex: "#0D0D0D", size: "L", stock: 5 },
            ],
      isNew: isNew ?? true,
      isBestSeller: isBestSeller ?? false,
      isClubOnly: Boolean(isClubOnly),
      aiDescription: `${name}, категория ${category || "Одежда"}, современный силуэт SABYR.`,
      occasionTags: ["деловая встреча", "свидание", "повседневный образ"],
      styleTags: ["minimalism", "quiet luxury"],
    };

    const isDbUp = await isDatabaseAvailable();
    if (isDbUp) {
      try {
        let categoryRecord = await prisma.category.findFirst({
          where: { name: newProduct.category },
        });
        if (!categoryRecord) {
          categoryRecord = await prisma.category.create({
            data: {
              name: newProduct.category,
              slug: `${newProduct.category.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}`,
            },
          });
        }
        await prisma.product.create({
          data: {
            id: newId,
            name: newProduct.name,
            slug: newProduct.slug,
            price: toTiyn(newProduct.price),
            comparePrice: newProduct.comparePrice ? toTiyn(newProduct.comparePrice) : null,
            description: newProduct.description,
            composition: newProduct.composition,
            care: newProduct.care,
            categoryId: categoryRecord.id,
            isNew: newProduct.isNew ?? true,
            isBestSeller: newProduct.isBestSeller ?? false,
            isClubOnly: newProduct.isClubOnly ?? false,
            aiDescription: newProduct.aiDescription,
            occasionTags: newProduct.occasionTags,
            styleTags: newProduct.styleTags,
            images: {
              create: newProduct.images.map((url, i) => ({ url, order: i })),
            },
            variants: {
              create: newProduct.variants.map((v) => ({
                color: v.color,
                colorHex: v.colorHex,
                size: v.size,
                stock: v.stock,
              })),
            },
          },
        });
      } catch (dbErr: unknown) {
        console.warn("[SABYR API] Error writing product to DB, saved to local JSON only:", dbErr);
      }
    }

    const saved = addProductToDb(newProduct);
    return NextResponse.json({ success: true, product: saved });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Ошибка создания товара";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

// ─── PATCH /api/products (Edit product, price, discount, stock, etc.) ─────────

export async function PATCH(req: NextRequest) {
  try {
    await requireAdmin(req);
  } catch (authError) {
    if (authError instanceof NextResponse) return authError;
    return NextResponse.json({ success: false, error: "Нет доступа" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const parsed = UpdateProductSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Ошибка валидации", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const {
      id,
      name,
      category,
      price,
      comparePrice,
      description,
      composition,
      care,
      images,
      variants,
      isClubOnly,
      isNew,
      isBestSeller,
    } = parsed.data;

    const updates: Partial<ProductItem> = {};
    if (name !== undefined) updates.name = name;
    if (category !== undefined) updates.category = category;
    if (price !== undefined) updates.price = price;
    if (comparePrice !== undefined) updates.comparePrice = comparePrice;
    if (description !== undefined) updates.description = description;
    if (composition !== undefined) updates.composition = composition;
    if (care !== undefined) updates.care = care;
    if (images !== undefined && images.length > 0) updates.images = images;
    if (variants !== undefined && variants.length > 0) {
      updates.variants = variants.map((v, i) => ({
        id: v.id || `${id}-v${i}`,
        color: v.color,
        colorHex: v.colorHex || "#0D0D0D",
        size: v.size,
        stock: v.stock,
      }));
    }
    if (isClubOnly !== undefined) updates.isClubOnly = isClubOnly;
    if (isNew !== undefined) updates.isNew = isNew;
    if (isBestSeller !== undefined) updates.isBestSeller = isBestSeller;

    // Update local store
    updateProductInDb(id, updates);

    // Update PostgreSQL if available
    const isDbUp = await isDatabaseAvailable();
    if (isDbUp) {
      try {
        let categoryId: string | undefined;
        if (category) {
          let categoryRecord = await prisma.category.findFirst({
            where: { name: category },
          });
          if (!categoryRecord) {
            categoryRecord = await prisma.category.create({
              data: {
                name: category,
                slug: `${category.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}`,
              },
            });
          }
          categoryId = categoryRecord.id;
        }

        await prisma.product.update({
          where: { id },
          data: {
            ...(name !== undefined ? { name } : {}),
            ...(categoryId !== undefined ? { categoryId } : {}),
            ...(price !== undefined ? { price: toTiyn(price) } : {}),
            ...(comparePrice !== undefined
              ? { comparePrice: comparePrice ? toTiyn(comparePrice) : null }
              : {}),
            ...(description !== undefined ? { description } : {}),
            ...(composition !== undefined ? { composition } : {}),
            ...(care !== undefined ? { care } : {}),
            ...(isClubOnly !== undefined ? { isClubOnly } : {}),
            ...(isNew !== undefined ? { isNew } : {}),
            ...(isBestSeller !== undefined ? { isBestSeller } : {}),
            ...(images !== undefined && images.length > 0
              ? {
                  images: {
                    deleteMany: {},
                    create: images.map((url, i) => ({ url, order: i })),
                  },
                }
              : {}),
            ...(updates.variants !== undefined
              ? {
                  variants: {
                    deleteMany: {},
                    create: updates.variants.map((v) => ({
                      color: v.color,
                      colorHex: v.colorHex,
                      size: v.size,
                      stock: v.stock,
                    })),
                  },
                }
              : {}),
          },
        });
      } catch (dbErr: unknown) {
        console.warn("[SABYR API] Error updating product in DB:", dbErr);
      }
    }

    const updatedCatalog = await getLiveCatalogProducts();
    const updatedProduct = updatedCatalog.find((p) => p.id === id) || null;

    return NextResponse.json({
      success: true,
      product: updatedProduct,
      products: updatedCatalog,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Ошибка обновления товара";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

// ─── DELETE /api/products?id=... ─────────────────────────────────────────────

export async function DELETE(req: NextRequest) {
  try {
    await requireAdmin(req);
  } catch (authError) {
    if (authError instanceof NextResponse) return authError;
    return NextResponse.json({ success: false, error: "Нет доступа" }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const parsed = DeleteProductSchema.safeParse({ id: searchParams.get("id") });

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "ID обязателен" },
        { status: 400 }
      );
    }

    const { id } = parsed.data;
    deleteProductFromDb(id);

    const isDbUp = await isDatabaseAvailable();
    if (isDbUp) {
      try {
        await prisma.product.update({
          where: { id },
          data: { isActive: false }, // Soft delete
        });
      } catch {
        // Product may only exist in local store — that's OK
      }
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Ошибка удаления товара";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
