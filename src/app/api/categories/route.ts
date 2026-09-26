import fs from "fs";
import path from "path";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma, isDatabaseAvailable } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { getStoredProducts, saveStoredProducts } from "@/lib/productsStore";
import defaultCategories from "@/data/categories.json";

export interface CategoryRecord {
  id: string;
  name: string;
  slug: string;
}

const CATEGORIES_PATH = path.join(process.cwd(), "src", "data", "categories.json");
let memoryCategories: CategoryRecord[] = [...(defaultCategories as CategoryRecord[])];

function getLocalCategories(): CategoryRecord[] {
  try {
    if (fs.existsSync(CATEGORIES_PATH)) {
      const raw = fs.readFileSync(CATEGORIES_PATH, "utf-8");
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        memoryCategories = parsed;
        return parsed;
      }
    }
  } catch (err) {
    console.warn("[Categories Store] Failed reading categories.json:", err);
  }
  return memoryCategories;
}

function saveLocalCategories(cats: CategoryRecord[]) {
  try {
    memoryCategories = cats;
    fs.writeFileSync(CATEGORIES_PATH, JSON.stringify(cats, null, 2), "utf-8");
  } catch (err) {
    console.warn("[Categories Store] Failed writing categories.json:", err);
  }
}

const CreateCategorySchema = z.object({
  name: z.string().min(1, "Введите название категории").max(100),
});

const UpdateCategorySchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1, "Введите новое название категории").max(100),
});

// ─── GET /api/categories ──────────────────────────────────────────────────────

export async function GET() {
  const isDbUp = await isDatabaseAvailable();
  if (isDbUp) {
    try {
      const dbCats = await prisma.category.findMany({
        orderBy: [{ name: "asc" }],
      });
      if (dbCats.length > 0) {
        return NextResponse.json({
          success: true,
          source: "database",
          categories: dbCats.map((c) => ({
            id: c.id,
            name: c.name,
            slug: c.slug,
          })),
        });
      }
    } catch (err) {
      console.warn("[GET /api/categories] DB error, using local fallback:", err);
    }
  }

  return NextResponse.json({
    success: true,
    source: "local",
    categories: getLocalCategories(),
  });
}

// ─── POST /api/categories ─────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    await requireAdmin(req);
  } catch (authError) {
    if (authError instanceof NextResponse) return authError;
    return NextResponse.json({ success: false, error: "Нет доступа" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const parsed = CreateCategorySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: "Некорректное название" }, { status: 400 });
    }

    const cleanName = parsed.data.name.trim();
    const newId = `cat-${Date.now()}`;
    const slug = `${cleanName
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-") || "cat"}-${Math.floor(100 + Math.random() * 900)}`;

    const newCat: CategoryRecord = { id: newId, name: cleanName, slug };

    const current = getLocalCategories();
    if (!current.some((c) => c.name.toLowerCase() === cleanName.toLowerCase())) {
      saveLocalCategories([...current, newCat]);
    }

    const isDbUp = await isDatabaseAvailable();
    if (isDbUp) {
      try {
        const existing = await prisma.category.findFirst({
          where: { name: cleanName },
        });
        if (!existing) {
          await prisma.category.create({
            data: {
              id: newId,
              name: cleanName,
              slug,
            },
          });
        }
      } catch (err) {
        console.warn("[POST /api/categories] DB create warning:", err);
      }
    }

    return NextResponse.json({ success: true, category: newCat });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Ошибка создания категории";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

// ─── PATCH /api/categories (Rename category) ──────────────────────────────────

export async function PATCH(req: NextRequest) {
  try {
    await requireAdmin(req);
  } catch (authError) {
    if (authError instanceof NextResponse) return authError;
    return NextResponse.json({ success: false, error: "Нет доступа" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const parsed = UpdateCategorySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: "Некорректные данные" }, { status: 400 });
    }

    const { id, name } = parsed.data;
    const cleanName = name.trim();

    const current = getLocalCategories();
    const targetLocal = current.find((c) => c.id === id);
    const oldName = targetLocal?.name;

    const updatedLocal = current.map((c) =>
      c.id === id ? { ...c, name: cleanName } : c
    );
    saveLocalCategories(updatedLocal);

    if (oldName && oldName !== cleanName) {
      const prods = getStoredProducts();
      const updatedProds = prods.map((p) =>
        p.category === oldName ? { ...p, category: cleanName } : p
      );
      saveStoredProducts(updatedProds);
    }

    const isDbUp = await isDatabaseAvailable();
    if (isDbUp) {
      try {
        await prisma.category.update({
          where: { id },
          data: { name: cleanName },
        });
      } catch (err) {
        console.warn("[PATCH /api/categories] DB update warning:", err);
      }
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Ошибка изменения категории";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

// ─── DELETE /api/categories?id=... ────────────────────────────────────────────

export async function DELETE(req: NextRequest) {
  try {
    await requireAdmin(req);
  } catch (authError) {
    if (authError instanceof NextResponse) return authError;
    return NextResponse.json({ success: false, error: "Нет доступа" }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ success: false, error: "ID обязателен" }, { status: 400 });
    }

    const current = getLocalCategories();
    const filtered = current.filter((c) => c.id !== id);
    saveLocalCategories(filtered);

    const isDbUp = await isDatabaseAvailable();
    if (isDbUp) {
      try {
        // Reassign any products referencing this category before deleting it
        const fallbackCat = await prisma.category.findFirst({
          where: { id: { not: id } },
        });
        if (fallbackCat) {
          await prisma.product.updateMany({
            where: { categoryId: id },
            data: { categoryId: fallbackCat.id },
          });
        }
        await prisma.category.delete({
          where: { id },
        });
      } catch (err) {
        console.warn("[DELETE /api/categories] DB delete warning:", err);
      }
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Ошибка удаления категории";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
