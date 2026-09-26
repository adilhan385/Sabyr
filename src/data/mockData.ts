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
    id: "sabyr-1",
    name: "Двубортный чёрный костюм SABYR",
    slug: "dvubortnyj-chernyj-kostyum-sabyr",
    category: "Костюмы и комплекты",
    price: 42990,
    comparePrice: null,
    description: "Костюм, который собирает образ без лишнего. Чистый силуэт, спокойные детали и посадка, которая говорит за себя. SABYR — тебя сначала видят. Потом слушают.",
    composition: "Плотная костюмная ткань премиального качества (вискоза, полиэстер, эластан). Держит форму и не сковывает движения.",
    care: "Деликатная стирка при 30°C или химчистка. Отпаривание при средней температуре.",
    images: [
      "/products/black-suit-1.jpg",
      "/products/black-suit-2.jpg",
      "/products/black-suit-3.jpg",
      "/products/black-suit-4.jpg"
    ],
    variants: [
      { id: "sabyr1-blk-s", color: "Глубокий чёрный", colorHex: "#0D0D0D", size: "S", stock: 10 },
      { id: "sabyr1-blk-m", color: "Глубокий чёрный", colorHex: "#0D0D0D", size: "M", stock: 10 },
      { id: "sabyr1-blk-l", color: "Глубокий чёрный", colorHex: "#0D0D0D", size: "L", stock: 10 },
      { id: "sabyr1-blk-xl", color: "Глубокий чёрный", colorHex: "#0D0D0D", size: "XL", stock: 10 },
      { id: "sabyr1-blk-2xl", color: "Глубокий чёрный", colorHex: "#0D0D0D", size: "2XL", stock: 10 },
      { id: "sabyr1-blk-3xl", color: "Глубокий чёрный", colorHex: "#0D0D0D", size: "3XL", stock: 10 },
    ],
    isNew: true,
    isBestSeller: true,
    isClubOnly: false,
    aiDescription: "Двубортный чёрный костюм SABYR, категория Костюмы и комплекты, чистый силуэт и современная посадка.",
    occasionTags: ["деловая встреча", "вечерний выход", "повседневный образ"],
    styleTags: ["minimalism", "quiet luxury", "new classic"]
  },
  {
    id: "sabyr-2",
    name: "Серый классический костюм SABYR",
    slug: "seryj-klassicheskij-kostyum-sabyr",
    category: "Костюмы и комплекты",
    price: 42990,
    comparePrice: 43990,
    description: "Серый костюм — чистый силуэт, уверенная посадка и тот самый образ, который работает без лишних слов. Универсально как для повседневного образа, так и для более формального выхода.",
    composition: "Плотная костюмная ткань премиального качества с матовой текстурой.",
    care: "Деликатная стирка при 30°C или сухая чистка. Гладить через ткань или отпаривать.",
    images: [
      "/products/grey-suit-1.jpg",
      "/products/grey-suit-2.jpg",
      "/products/grey-suit-3.jpg",
      "/products/grey-suit-4.jpg"
    ],
    variants: [
      { id: "sabyr2-gry-s", color: "Графитовый серый", colorHex: "#5A5D64", size: "S", stock: 10 },
      { id: "sabyr2-gry-m", color: "Графитовый серый", colorHex: "#5A5D64", size: "M", stock: 10 },
      { id: "sabyr2-gry-l", color: "Графитовый серый", colorHex: "#5A5D64", size: "L", stock: 10 },
      { id: "sabyr2-gry-xl", color: "Графитовый серый", colorHex: "#5A5D64", size: "XL", stock: 10 },
      { id: "sabyr2-gry-2xl", color: "Графитовый серый", colorHex: "#5A5D64", size: "2XL", stock: 10 },
      { id: "sabyr2-gry-3xl", color: "Графитовый серый", colorHex: "#5A5D64", size: "3XL", stock: 10 },
    ],
    isNew: true,
    isBestSeller: true,
    isClubOnly: false,
    aiDescription: "Серый классический костюм SABYR, универсальный комплект для делового и повседневного образа.",
    occasionTags: ["деловая встреча", "офис", "повседневный образ"],
    styleTags: ["minimalism", "tailoring", "quiet luxury"]
  },
  {
    id: "sabyr-3",
    name: "Повседневный комплект SABYR на молнии",
    slug: "povsednevnyj-komplekt-sabyr-na-molnii",
    category: "Костюмы и комплекты",
    price: 42990,
    comparePrice: null,
    description: "Чистый силуэт. Ничего лишнего. Комплект SABYR на молнии — свободная посадка, лёгкая дышащая ткань и универсальный чёрный цвет на каждый день.",
    composition: "Премиальный смесовый хлопок с добавлением эластана для комфортной посадки.",
    care: "Бережная стирка при 30°C в застёгнутом виде.",
    images: [
      "/products/zip-set-1.jpg",
      "/products/zip-set-2.jpg",
      "/products/zip-set-3.jpg",
      "/products/zip-set-4.jpg"
    ],
    variants: [
      { id: "sabyr3-blk-s", color: "Чёрный", colorHex: "#121212", size: "S", stock: 10 },
      { id: "sabyr3-blk-m", color: "Чёрный", colorHex: "#121212", size: "M", stock: 10 },
      { id: "sabyr3-blk-l", color: "Чёрный", colorHex: "#121212", size: "L", stock: 10 },
      { id: "sabyr3-blk-xl", color: "Чёрный", colorHex: "#121212", size: "XL", stock: 10 },
      { id: "sabyr3-blk-2xl", color: "Чёрный", colorHex: "#121212", size: "2XL", stock: 10 },
      { id: "sabyr3-blk-3xl", color: "Чёрный", colorHex: "#121212", size: "3XL", stock: 10 },
    ],
    isNew: true,
    isBestSeller: true,
    isClubOnly: false,
    aiDescription: "Повседневный чёрный комплект SABYR с курткой на молнии и брюками свободного кроя.",
    occasionTags: ["повседневный образ", "прогулка", "поездка"],
    styleTags: ["smart casual", "minimalism"]
  },
  {
    id: "sabyr-4",
    name: "Светлый костюм SABYR «The New Classic»",
    slug: "svetlyj-kostyum-sabyr-the-new-classic",
    category: "Костюмы и комплекты",
    price: 42990,
    comparePrice: null,
    description: "THE NEW CLASSIC — современный взгляд на привычный костюм. Чистый силуэт, свободная посадка и детали, которые собирают образ. Первое впечатление без слов.",
    composition: "Плотная костюмная ткань премиального качества, устойчивая к сминанию.",
    care: "Деликатная химчистка или бережное отпаривание.",
    images: [
      "/products/light-suit-1.jpg"
    ],
    variants: [
      { id: "sabyr4-lgt-s", color: "Молочно-бежевый", colorHex: "#DCD6CC", size: "S", stock: 10 },
      { id: "sabyr4-lgt-m", color: "Молочно-бежевый", colorHex: "#DCD6CC", size: "M", stock: 10 },
      { id: "sabyr4-lgt-l", color: "Молочно-бежевый", colorHex: "#DCD6CC", size: "L", stock: 10 },
      { id: "sabyr4-lgt-xl", color: "Молочно-бежевый", colorHex: "#DCD6CC", size: "XL", stock: 10 },
      { id: "sabyr4-lgt-2xl", color: "Молочно-бежевый", colorHex: "#DCD6CC", size: "2XL", stock: 10 },
      { id: "sabyr4-lgt-3xl", color: "Молочно-бежевый", colorHex: "#DCD6CC", size: "3XL", stock: 10 },
    ],
    isNew: true,
    isBestSeller: false,
    isClubOnly: false,
    aiDescription: "Светлый костюм SABYR The New Classic, современный крой и благородный молочно-бежевый оттенок.",
    occasionTags: ["торжество", "деловая встреча", "вечерний выход"],
    styleTags: ["new classic", "quiet luxury"]
  },
  {
    id: "sabyr-5",
    name: "Базовое белое поло SABYR",
    slug: "bazovoe-beloe-polo-sabyr",
    category: "Рубашки и поло",
    price: 11990,
    comparePrice: 14990,
    description: "SABYR — повседневный стиль без лишних деталей. Базовое белое поло с выверенной посадкой и отложным воротником, идеально сочетается с классическим костюмом, брюками или джинсами.",
    composition: "100% плотный дышащий хлопок пике премиальной выделки.",
    care: "Стирка при 30°C с вещами светлых оттенков. Не использовать отбеливатель.",
    images: [
      "/products/white-polo-1.jpg",
      "/products/white-polo-2.jpg"
    ],
    variants: [
      { id: "sabyr5-wht-s", color: "Белый", colorHex: "#F7F7F5", size: "S", stock: 10 },
      { id: "sabyr5-wht-m", color: "Белый", colorHex: "#F7F7F5", size: "M", stock: 10 },
      { id: "sabyr5-wht-l", color: "Белый", colorHex: "#F7F7F5", size: "L", stock: 10 },
      { id: "sabyr5-wht-xl", color: "Белый", colorHex: "#F7F7F5", size: "XL", stock: 10 },
      { id: "sabyr5-wht-2xl", color: "Белый", colorHex: "#F7F7F5", size: "2XL", stock: 10 },
      { id: "sabyr5-wht-3xl", color: "Белый", colorHex: "#F7F7F5", size: "3XL", stock: 10 },
    ],
    isNew: true,
    isBestSeller: true,
    isClubOnly: false,
    aiDescription: "Базовое белое поло SABYR под пиджак или для повседневного образа.",
    occasionTags: ["повседневный образ", "офис", "деловая встреча"],
    styleTags: ["minimalism", "smart casual"]
  },
  {
    id: "sabyr-6",
    name: "Футболка SABYR с авторским принтом",
    slug: "futbolka-sabyr-s-avtorskim-printom",
    category: "Футболки и лонгсливы",
    price: 14990,
    comparePrice: null,
    description: "Футболка с авторским национальным принтом SABYR — плотный премиальный хлопок, свободный силуэт и акцентная деталь, которая собирает образ без лишнего.",
    composition: "100% плотный гребенной хлопок пенье (240 г/м²).",
    care: "Стирка наизнанку при 30°C. Гладить с изнаночной стороны, избегая зоны принта.",
    images: [
      "/products/print-tshirt-1.jpg",
      "/products/print-tshirt-2.jpg"
    ],
    variants: [
      { id: "sabyr6-wht-s", color: "Белый", colorHex: "#F7F7F5", size: "S", stock: 10 },
      { id: "sabyr6-wht-m", color: "Белый", colorHex: "#F7F7F5", size: "M", stock: 10 },
      { id: "sabyr6-wht-l", color: "Белый", colorHex: "#F7F7F5", size: "L", stock: 10 },
      { id: "sabyr6-wht-xl", color: "Белый", colorHex: "#F7F7F5", size: "XL", stock: 10 },
      { id: "sabyr6-wht-2xl", color: "Белый", colorHex: "#F7F7F5", size: "2XL", stock: 10 },
      { id: "sabyr6-wht-3xl", color: "Белый", colorHex: "#F7F7F5", size: "3XL", stock: 10 },
    ],
    isNew: true,
    isBestSeller: false,
    isClubOnly: false,
    aiDescription: "Белая футболка SABYR с авторским этническим принтом из плотного хлопка.",
    occasionTags: ["повседневный образ", "прогулка", "встреча с друзьями"],
    styleTags: ["streetwear", "minimalism", "contemporary"]
  },
  {
    id: "sabyr-7",
    name: "Базовая белая рубашка SABYR",
    slug: "bazovaya-belaya-rubashka-sabyr",
    category: "Рубашки и поло",
    price: 16990,
    comparePrice: null,
    description: "Базовая белая рубашка SABYR — плотный хлопок, чистый воротник и универсальная посадка как для классического костюма, так и для повседневного образа.",
    composition: "97% длинноволокнистый хлопок поплин, 3% эластан.",
    care: "Бережная стирка при 30°C. Отпаривание во влажном состоянии.",
    images: [
      "/products/white-shirt-1.jpg",
      "/products/white-shirt-2.jpg"
    ],
    variants: [
      { id: "sabyr7-wht-s", color: "Белый", colorHex: "#FFFFFF", size: "S", stock: 10 },
      { id: "sabyr7-wht-m", color: "Белый", colorHex: "#FFFFFF", size: "M", stock: 10 },
      { id: "sabyr7-wht-l", color: "Белый", colorHex: "#FFFFFF", size: "L", stock: 10 },
      { id: "sabyr7-wht-xl", color: "Белый", colorHex: "#FFFFFF", size: "XL", stock: 10 },
      { id: "sabyr7-wht-2xl", color: "Белый", colorHex: "#FFFFFF", size: "2XL", stock: 10 },
      { id: "sabyr7-wht-3xl", color: "Белый", colorHex: "#FFFFFF", size: "3XL", stock: 10 },
    ],
    isNew: false,
    isBestSeller: true,
    isClubOnly: false,
    aiDescription: "Базовая белая рубашка SABYR классического кроя из плотного хлопка.",
    occasionTags: ["деловая встреча", "офис", "торжество"],
    styleTags: ["tailoring", "minimalism", "classic"]
  },
  {
    id: "sabyr-8",
    name: "Свободные брюки с защипами SABYR",
    slug: "svobodnye-bryuki-dzhinsy-sabyr",
    category: "Брюки и джоггеры",
    price: 19990,
    comparePrice: null,
    description: "7 секунд, чтобы тебя заметили. Остальное делает посадка. Свободный крой с защипами у пояса и безупречная линия силуэта на каждый день.",
    composition: "Плотная костюмная ткань / деним высокой плотности, держит форму в течение всего дня.",
    care: "Деликатная стирка при 30°C. Отпаривание по линии стрелок.",
    images: [
      "/products/wide-pants-1.jpg",
      "/products/wide-pants-2.jpg"
    ],
    variants: [
      { id: "sabyr8-blk-m", color: "Глубокий чёрный", colorHex: "#0D0D0D", size: "M", stock: 10 },
      { id: "sabyr8-blk-l", color: "Глубокий чёрный", colorHex: "#0D0D0D", size: "L", stock: 10 },
      { id: "sabyr8-blk-xl", color: "Глубокий чёрный", colorHex: "#0D0D0D", size: "XL", stock: 10 },
      { id: "sabyr8-blk-2xl", color: "Глубокий чёрный", colorHex: "#0D0D0D", size: "2XL", stock: 10 },
      { id: "sabyr8-blk-3xl", color: "Глубокий чёрный", colorHex: "#0D0D0D", size: "3XL", stock: 10 },
    ],
    isNew: true,
    isBestSeller: true,
    isClubOnly: false,
    aiDescription: "Свободные брюки с защипами SABYR, выверенная посадка и широкий силуэт.",
    occasionTags: ["повседневный образ", "деловая встреча", "офис"],
    styleTags: ["minimalism", "new classic", "wide leg"]
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
      city: "Астана",
      street: "пр. Мангилик Ел 52, кв. 45",
      isDefault: true
    },
    {
      id: "addr-2",
      title: "Офис",
      city: "Астана",
      street: "ул. Достык 16, БЦ Talan Towers, офис 702",
      isDefault: false
    }
  ],
  bonusHistory: [
    { id: "b1", type: "EARNED", amount: 2150, description: "Начисление за заказ #SAB-9281", date: "12 мая 2026" },
    { id: "b2", type: "SPENT", amount: -3000, description: "Оплата бонусами заказа #SAB-8104", date: "24 апреля 2026" },
    { id: "b3", type: "EARNED", amount: 3000, description: "Подарок в честь дня рождения", date: "10 апреля 2026" },
  ],
  orders: [
    {
      id: "ord-1",
      orderNumber: "SAB-2026-9281",
      date: "14 мая 2026",
      status: "В пути",
      statusColor: "text-amber-600 bg-amber-50 border-amber-200",
      trackingNumber: "KZ-POST-9918239",
      deliveryCity: "Астана",
      deliveryAddress: "пр. Мангилик Ел 52, кв. 45",
      deliveryType: "Курьерская доставка по Астане",
      items: [
        {
          name: "Двубортный чёрный костюм SABYR",
          color: "Глубокий чёрный",
          size: "L",
          quantity: 1,
          price: 42990,
          image: "/products/black-suit-1.jpg"
        }
      ],
      total: 42990,
      bonusesEarned: 2150
    },
    {
      id: "ord-2",
      orderNumber: "SAB-2026-8104",
      date: "24 апреля 2026",
      status: "Доставлен",
      statusColor: "text-green-600 bg-green-50 border-green-200",
      trackingNumber: "KZ-POST-8812301",
      deliveryCity: "Астана",
      deliveryAddress: "пр. Мангилик Ел 52, кв. 45",
      deliveryType: "Курьер",
      items: [
        {
          name: "Серый классический костюм SABYR",
          color: "Графитовый серый",
          size: "L",
          quantity: 1,
          price: 42990,
          image: "/products/grey-suit-1.jpg"
        },
        {
          name: "Базовое белое поло SABYR",
          color: "Белый",
          size: "L",
          quantity: 1,
          price: 11990,
          image: "/products/white-polo-1.jpg"
        }
      ],
      total: 54980,
      bonusesEarned: 2749
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
