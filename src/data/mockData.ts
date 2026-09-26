export interface ProductVariant {
  id: string;
  color: string;
  colorHex: string;
  size: string;
  stock: number;
}

export interface ProductItem {
  id: string;
  name: string;
  slug: string;
  category: string;
  price: number;
  comparePrice?: number | null;
  description: string;
  composition: string;
  care: string;
  images: string[];
  variants: ProductVariant[];
  isNew?: boolean;
  isBestSeller?: boolean;
  isClubOnly?: boolean;
  aiDescription: string;
  occasionTags: string[];
  styleTags: string[];
}

export const CATEGORIES = [
  { id: "all", name: "Все изделия", slug: "" },
  { id: "hoodies-sweatshirts", name: "Худи и свитшоты", slug: "hoodies-sweatshirts" },
  { id: "tshirts-longsleeves", name: "Футболки и лонгсливы", slug: "tshirts-longsleeves" },
  { id: "sets-suits", name: "Костюмы и комплекты", slug: "sets-suits" },
  { id: "pants-joggers", name: "Брюки и джоггеры", slug: "pants-joggers" },
  { id: "shirts-polo", name: "Рубашки и поло", slug: "shirts-polo" },
  { id: "outerwear-jackets", name: "Верхняя одежда и куртки", slug: "outerwear-jackets" },
  { id: "accessories", name: "Аксессуары", slug: "accessories" },
];

export const PRODUCTS: ProductItem[] = [
  {
    id: "example-1",
    name: "Пример",
    slug: "example-item",
    category: "Худи и свитшоты",
    price: 50000,
    comparePrice: 65000,
    description: "Пример карточки одежды SABYR. Измените название, цену, скидку и фотографии этого примера или добавьте свои товары в Админ-панели (/admin).",
    composition: "Пример состава изделия (редактируется в Админ-панели).",
    care: "Пример рекомендаций по уходу.",
    images: [
      "/example-product.svg"
    ],
    variants: [
      { id: "ex1-blk-xs", color: "Чёрный", colorHex: "#0D0D0D", size: "XS", stock: 5 },
      { id: "ex1-blk-s", color: "Чёрный", colorHex: "#0D0D0D", size: "S", stock: 5 },
      { id: "ex1-blk-m", color: "Чёрный", colorHex: "#0D0D0D", size: "M", stock: 5 },
      { id: "ex1-blk-l", color: "Чёрный", colorHex: "#0D0D0D", size: "L", stock: 5 },
    ],
    isNew: true,
    isBestSeller: true,
    isClubOnly: false,
    aiDescription: "Пример изделия SABYR.",
    occasionTags: ["повседневный образ", "деловая встреча"],
    styleTags: ["minimalism"]
  }
];

export const MOCK_USER = {
  id: "usr-01",
  name: "Айгерим Касымова",
  email: "aigerim.k@gmail.com",
  phone: "+7 (777) 345-67-89",
  bonusBalance: 14500,
  bonusLevel: {
    name: "Level 2 — Silver",
    levelNumber: 2,
    percent: 5,
    nextLevelAt: 300000,
    currentPurchases: 215000,
    privileges: [
      "5% кешбэк бонусами с каждого заказа",
      "Бесплатная курьерская доставка от 20 000 ₸",
      "Персональный промокод на день рождения 15%",
      "Приоритетное обслуживание поддержки"
    ]
  },
  clubMembership: {
    isActive: true,
    plan: "ANNUAL",
    validUntil: "2027-01-15",
    tier: "SABYR BLACK VIP",
    exclusiveDropsCount: 3
  },
  addresses: [
    {
      id: "addr-1",
      title: "Дом",
      city: "Алматы",
      street: "пр. Достык 180, кв. 45",
      isDefault: true
    },
    {
      id: "addr-2",
      title: "Офис",
      city: "Алматы",
      street: "ул. Байзакова 280, БЦ Алматы Towers, офис 702",
      isDefault: false
    }
  ],
  bonusHistory: [
    { id: "b1", type: "EARNED", amount: 4450, description: "Начисление за заказ #SAB-9281", date: "12 мая 2026" },
    { id: "b2", type: "SPENT", amount: -5000, description: "Оплата бонусами заказа #SAB-8104", date: "24 апреля 2026" },
    { id: "b3", type: "EARNED", amount: 3000, description: "Подарок в честь дня рождения", date: "10 апреля 2026" },
    { id: "b4", type: "EARNED", amount: 12050, description: "Начисление за покупку кашемирового пальто", date: "1 марта 2026" },
  ],
  orders: [
    {
      id: "ord-1",
      orderNumber: "SAB-2026-9281",
      date: "14 мая 2026",
      status: "В пути",
      statusColor: "text-amber-600 bg-amber-50 border-amber-200",
      trackingNumber: "KZ-POST-9918239",
      deliveryCity: "Алматы",
      deliveryAddress: "пр. Достык 180, кв. 45",
      deliveryType: "Курьерская доставка SABYR Express",
      items: [
        {
          name: "Двубортный шерстяной жакет SABYR Structure",
          color: "Глубокий чёрный",
          size: "S",
          quantity: 1,
          price: 89000,
          image: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=400&q=80"
        }
      ],
      total: 89000,
      bonusesEarned: 4450
    },
    {
      id: "ord-2",
      orderNumber: "SAB-2026-8104",
      date: "24 апреля 2026",
      status: "Доставлен",
      statusColor: "text-green-600 bg-green-50 border-green-200",
      trackingNumber: "KZ-POST-8812301",
      deliveryCity: "Алматы",
      deliveryAddress: "пр. Достык 180, кв. 45",
      deliveryType: "Курьер",
      items: [
        {
          name: "Широкие брюки палаццо с защипами",
          color: "Песочный крем",
          size: "S",
          quantity: 1,
          price: 62000,
          image: "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=400&q=80"
        },
        {
          name: "Шёлковая блуза свободного кроя Silk Essence",
          color: "Слоновая кость",
          size: "S",
          quantity: 1,
          price: 54000,
          image: "https://images.unsplash.com/photo-1583744946564-b52ac1c389c8?w=400&q=80"
        }
      ],
      total: 111000,
      bonusesEarned: 5550
    }
  ],
  giftCards: [
    {
      id: "gc-1",
      code: "SABYR-GIFT-8942-XXXX",
      amount: 50000,
      balance: 50000,
      expiresAt: "31 декабря 2026",
      isUsed: false
    }
  ]
};
