import { prisma } from "../src/lib/db";
import { PRODUCTS } from "../src/data/mockData";
import { toTiyn } from "../src/lib/utils";

async function main() {
  console.log("[SABYR Seed] Starting database seed...");

  // 1. Bonus Levels
  const bonusLevels = [
    {
      id: "bl-1",
      name: "Новый клиент",
      minPurchaseAmount: 0,
      bonusPercent: 3.0,
      color: "#808080",
      order: 1,
      privileges: ["Кешбэк 3% бонусами", "Бесплатная доставка от 30 000 ₸"],
    },
    {
      id: "bl-2",
      name: "Silver",
      minPurchaseAmount: 10000000,
      bonusPercent: 5.0,
      color: "#C0C0C0",
      order: 2,
      privileges: [
        "Кешбэк 5% бонусами",
        "Бесплатная доставка от 20 000 ₸",
        "Промокод на день рождения 15%",
      ],
    },
    {
      id: "bl-3",
      name: "Gold",
      minPurchaseAmount: 30000000,
      bonusPercent: 7.0,
      color: "#C8A96E",
      order: 3,
      privileges: [
        "Кешбэк 7% бонусами",
        "Бесплатная доставка",
        "Ранний доступ к дропам",
        "Персональный стилист",
      ],
    },
    {
      id: "bl-4",
      name: "VIP Black",
      minPurchaseAmount: 50000000,
      bonusPercent: 10.0,
      color: "#0D0D0D",
      order: 4,
      privileges: [
        "Кешбэк 10% бонусами",
        "Бесплатная экспресс-доставка",
        "Приоритетный доступ",
        "Подарок на ДР",
        "VIP обслуживание",
      ],
    },
  ];

  for (const lvl of bonusLevels) {
    await prisma.bonusLevel.upsert({
      where: { id: lvl.id },
      update: lvl,
      create: lvl,
    });
  }

  // 2. Categories
  const categoryMap: Record<string, { id: string; slug: string }> = {
    "Пиджаки и жакеты": { id: "cat-1", slug: "blazers" },
    "Брюки и палаццо": { id: "cat-2", slug: "pants" },
    Платья: { id: "cat-3", slug: "dresses" },
    "Пальто и тренчи": { id: "cat-4", slug: "outerwear" },
    "Рубашки и блузы": { id: "cat-5", slug: "shirts" },
    Трикотаж: { id: "cat-6", slug: "knitwear" },
    Аксессуары: { id: "cat-7", slug: "accessories" },
  };

  let catOrder = 1;
  for (const [name, meta] of Object.entries(categoryMap)) {
    await prisma.category.upsert({
      where: { slug: meta.slug },
      update: { name, order: catOrder, isActive: true },
      create: { id: meta.id, name, slug: meta.slug, order: catOrder, isActive: true },
    });
    catOrder++;
  }

  // 3. Products
  for (const prod of PRODUCTS) {
    const catMeta = categoryMap[prod.category] ?? { id: "cat-1", slug: "blazers" };
    await prisma.product.upsert({
      where: { slug: prod.slug },
      update: {
        name: prod.name,
        description: prod.description,
        composition: prod.composition,
        care: prod.care,
        price: toTiyn(prod.price),
        comparePrice: prod.comparePrice ? toTiyn(prod.comparePrice) : null,
        isNew: Boolean(prod.isNew),
        isBestSeller: Boolean(prod.isBestSeller),
        isClubOnly: Boolean(prod.isClubOnly),
        aiDescription: prod.aiDescription,
        occasionTags: prod.occasionTags,
        styleTags: prod.styleTags,
      },
      create: {
        id: prod.id,
        name: prod.name,
        slug: prod.slug,
        description: prod.description,
        composition: prod.composition,
        care: prod.care,
        categoryId: catMeta.id,
        price: toTiyn(prod.price),
        comparePrice: prod.comparePrice ? toTiyn(prod.comparePrice) : null,
        isNew: Boolean(prod.isNew),
        isBestSeller: Boolean(prod.isBestSeller),
        isClubOnly: Boolean(prod.isClubOnly),
        aiDescription: prod.aiDescription,
        occasionTags: prod.occasionTags,
        styleTags: prod.styleTags,
      },
    });
  }

  // 4. Promo codes
  await prisma.promoCode.upsert({
    where: { code: "SABYR10" },
    update: { isActive: true },
    create: {
      id: "pc-1",
      code: "SABYR10",
      type: "PERCENTAGE",
      value: 10,
      maxUses: 100,
      minOrderAmount: 0,
      isActive: true,
      categoryIds: [],
      productIds: [],
    },
  });

  console.log("[SABYR Seed] Seed completed.");
}

main()
  .catch((e) => {
    console.error("[SABYR Seed Error]:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
