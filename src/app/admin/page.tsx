"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  BarChart3,
  Package,
  ShoppingBag,
  Users,
  Sparkles,
  Crown,
  Tag,
  LayoutTemplate,
  Folder,
  Bell,
  Plus,
  Trash2,
  Search,
  ExternalLink,
  Pencil,
  Percent,
  Upload,
  Lock,
  X,
} from "lucide-react";
import { PRODUCTS, ProductItem } from "@/data/mockData";
import { formatPrice } from "@/lib/utils";
import { SabyrLogo } from "@/components/ui/SabyrLogo";

type AdminTab =
  | "analytics"
  | "products"
  | "categories"
  | "orders"
  | "customers"
  | "bonuses"
  | "club"
  | "promos"
  | "content"
  | "notifications";

const ALL_AVAILABLE_SIZES = ["XS", "S", "M", "L", "XL", "2XL", "3XL"];

export default function AdminPage() {
  const [currentTab, setCurrentTab] = useState<AdminTab>("club");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setStatusMessage(msg);
    setTimeout(() => setStatusMessage(null), 4000);
  };

  // Products state (Add & Edit)
  const [productsList, setProductsList] = useState<ProductItem[]>(PRODUCTS);
  const [searchProduct, setSearchProduct] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [newProductName, setNewProductName] = useState("");
  const [newProductCategory, setNewProductCategory] = useState("Худи и свитшоты");
  const [newProductPrice, setNewProductPrice] = useState(29990);
  const [newProductComparePrice, setNewProductComparePrice] = useState<string>("");
  const [newProductImageUrl, setNewProductImageUrl] = useState("");
  const [newProductImages, setNewProductImages] = useState<string[]>([]);
  const [newProductDescription, setNewProductDescription] = useState("");
  const [newProductComposition, setNewProductComposition] = useState("");
  const [newProductCare, setNewProductCare] = useState(
    "Деликатная стирка при 30°C на изнаночной стороне, не отбеливать, гладить на низкой температуре."
  );
  const [newProductColor, setNewProductColor] = useState("Чёрный");
  const [newProductSizes, setNewProductSizes] = useState<string[]>([
    "S",
    "M",
    "L",
    "XL",
    "2XL",
    "3XL",
  ]);
  const [newProductStock, setNewProductStock] = useState(8);
  const [newProductClubOnly, setNewProductClubOnly] = useState(false);
  const [newProductIsNew, setNewProductIsNew] = useState(true);
  const [newProductIsBestSeller, setNewProductIsBestSeller] = useState(false);

  // Orders state
  interface AdminOrder {
    id: string;
    number: string;
    customer: string;
    phone: string;
    date: string;
    status: string;
    rawStatus?: string;
    trackingNumber?: string;
    total: number;
    payment: string;
    itemsCount?: number;
  }

  const [ordersList, setOrdersList] = useState<AdminOrder[]>([]);

  // Customers state
  interface AdminCustomer {
    id: string;
    name: string;
    phone: string;
    email: string;
    role: string;
    isBlocked?: boolean;
    level: string;
    bonusBalance: number;
    club: boolean;
    ordersCount: number;
    totalSpent: number;
  }

  const [customersList, setCustomersList] = useState<AdminCustomer[]>([]);
  const [searchCustomer, setSearchCustomer] = useState("");

  // Promo codes state
  interface AdminPromo {
    id: string;
    code: string;
    discount: string;
    type: string;
    uses: number;
    maxUses: number | null;
    active: boolean;
  }

  const [promosList, setPromosList] = useState<AdminPromo[]>([]);
  const [newPromoCode, setNewPromoCode] = useState("");
  const [newPromoDiscount, setNewPromoDiscount] = useState("10");

  // Categories state
  interface AdminCategory {
    id: string;
    name: string;
    slug: string;
    sortOrder: number;
  }
  const [categoriesList, setCategoriesList] = useState<AdminCategory[]>([]);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editingCategoryName, setEditingCategoryName] = useState("");
  const [newCategoryName, setNewCategoryName] = useState("");
  const [categorySaving, setCategorySaving] = useState(false);

  // Gift Cards state
  interface AdminGiftCard {
    id: string;
    code: string;
    amount: number;
    balance: number;
    isActive: boolean;
    expiresAt: string | null;
  }
  const [giftCardsList, setGiftCardsList] = useState<AdminGiftCard[]>([]);
  const [newGiftAmount, setNewGiftAmount] = useState(50000);

  // Bonus levels settings
  interface AdminBonusLevel {
    id?: string;
    name: string;
    minSpend: number;
    percent: number;
  }
  const [bonusLevels, setBonusLevels] = useState<AdminBonusLevel[]>([
    { name: "Level 1 — Starter", minSpend: 0, percent: 3 },
    { name: "Level 2 — Silver", minSpend: 150000, percent: 5 },
    { name: "Level 3 — Gold", minSpend: 300000, percent: 7 },
    { name: "Level 4 — Platinum VIP", minSpend: 600000, percent: 10 },
  ]);
  const [savingBonuses, setSavingBonuses] = useState(false);

  // SABYR CLUB & AI settings
  const [clubAnnualPrice, setClubAnnualPrice] = useState("99 000 ₸");
  const [clubMonthlyPrice, setClubMonthlyPrice] = useState("12 000 ₸");
  const [clubWelcomeDeposit, setClubWelcomeDeposit] = useState("25 000 ₸");
  const [clubCashbackPercent, setClubCashbackPercent] = useState("10");
  const [clubSubtitle, setClubSubtitle] = useState(
    "Закрытое сообщество ценителей минималистичной роскоши. Приоритетный доступ к лимитированным дропам, AI-Стилисту, AI-Примерочной и персональному сервису."
  );
  const [aiClubOnly, setAiClubOnly] = useState(true);
  const [savingClub, setSavingClub] = useState(false);

  // Site / Homepage / Delivery / Contacts settings
  const [heroBadge, setHeroBadge] = useState("Collection 2026 · Almaty · Astana");
  const [heroTitle, setHeroTitle] = useState("Философия тишины и чистой формы.");
  const [heroSubtitle, setHeroSubtitle] = useState(
    "Лимитированные дропы базового гардероба в стиле quiet luxury. Плотный хлопок 100% Пенье, безупречный крой и выверенные пропорции от S до 3XL."
  );
  const [heroImage, setHeroImage] = useState("/products/1-1.jpg");
  const [announcementEnabled, setAnnouncementEnabled] = useState(true);
  const [announcementText, setAnnouncementText] = useState(
    "Бесплатная доставка по Казахстану от 50 000 ₸ · Лимитированная коллекция @sabyr.wear"
  );
  const [freeDeliveryThreshold, setFreeDeliveryThreshold] = useState("50000");
  const [courierDeliveryCost, setCourierDeliveryCost] = useState("2500");
  const [contactPhone, setContactPhone] = useState("+7 (777) 000-00-00");
  const [contactWhatsapp, setContactWhatsapp] = useState("https://wa.me/77770000000");
  const [contactInstagram, setContactInstagram] = useState("https://www.instagram.com/sabyr.wear");
  const [brandCity, setBrandCity] = useState("Алматы · Астана · Доставка по всему Казахстану");
  const [savingSite, setSavingSite] = useState(false);

  // Notifications state
  interface AdminNotificationLog {
    id: string;
    type: string;
    title: string;
    body: string;
    recipient: string;
    createdAt: string;
  }
  const [notificationsLog, setNotificationsLog] = useState<AdminNotificationLog[]>([]);
  const [notifTitle, setNotifTitle] = useState("");
  const [notifBody, setNotifBody] = useState("");
  const [notifAudience, setNotifAudience] = useState<"ALL" | "CLUB_ONLY">("ALL");
  const [notifType, setNotifType] = useState<"NEW_DROP" | "CLUB_OFFER" | "PERSONAL_OFFER">("NEW_DROP");
  const [notifSending, setNotifSending] = useState(false);

  const loadCustomers = () => {
    fetch("/api/admin/customers")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.customers)) {
          setCustomersList(data.customers);
        }
      })
      .catch(() => {});
  };

  const loadNotifications = () => {
    fetch("/api/notifications")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.notifications)) {
          setNotificationsLog(data.notifications);
        }
      })
      .catch(() => {});
  };

  const loadGiftCards = () => {
    fetch("/api/gift-cards")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.giftCards)) {
          setGiftCardsList(data.giftCards);
        }
      })
      .catch(() => {});
  };

  const loadCategories = () => {
    fetch("/api/categories")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.categories)) {
          setCategoriesList(data.categories);
          if (data.categories.length > 0) {
            setNewProductCategory(data.categories[0].name);
          }
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    fetch("/api/products")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.products)) {
          setProductsList(data.products);
        }
      })
      .catch(() => {});

    fetch("/api/orders")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.orders)) {
          setOrdersList(data.orders);
        }
      })
      .catch(() => {});

    fetch("/api/promo")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.promos)) {
          setPromosList(data.promos);
        }
      })
      .catch(() => {});

    fetch("/api/admin/settings")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          if (data.site) {
            if (data.site.hero_badge) setHeroBadge(data.site.hero_badge);
            if (data.site.hero_title) setHeroTitle(data.site.hero_title);
            if (data.site.hero_subtitle) setHeroSubtitle(data.site.hero_subtitle);
            if (data.site.hero_image) setHeroImage(data.site.hero_image);
            if (data.site.announcement_enabled !== undefined) {
              setAnnouncementEnabled(data.site.announcement_enabled !== "false");
            }
            if (data.site.announcement_text) setAnnouncementText(data.site.announcement_text);
            if (data.site.free_delivery_threshold) setFreeDeliveryThreshold(data.site.free_delivery_threshold);
            if (data.site.courier_delivery_cost) setCourierDeliveryCost(data.site.courier_delivery_cost);
            if (data.site.contact_phone) setContactPhone(data.site.contact_phone);
            if (data.site.contact_whatsapp) setContactWhatsapp(data.site.contact_whatsapp);
            if (data.site.contact_instagram) setContactInstagram(data.site.contact_instagram);
            if (data.site.brand_city) setBrandCity(data.site.brand_city);
          }
          if (data.club) {
            if (data.club.annual_price) setClubAnnualPrice(data.club.annual_price);
            if (data.club.monthly_price) setClubMonthlyPrice(data.club.monthly_price);
            if (data.club.welcome_deposit) setClubWelcomeDeposit(data.club.welcome_deposit);
            if (data.club.cashback_percent) setClubCashbackPercent(data.club.cashback_percent);
            if (data.club.club_subtitle) setClubSubtitle(data.club.club_subtitle);
            if (data.club.ai_club_only !== undefined) {
              setAiClubOnly(data.club.ai_club_only !== "false");
            }
          }
          if (Array.isArray(data.bonusLevels) && data.bonusLevels.length > 0) {
            setBonusLevels(data.bonusLevels);
          }
        }
      })
      .catch(() => {});

    loadCustomers();
    loadNotifications();
    loadGiftCards();
    loadCategories();
  }, []);

  const filteredProducts = productsList.filter(
    (p) =>
      p.name.toLowerCase().includes(searchProduct.toLowerCase()) ||
      p.category.toLowerCase().includes(searchProduct.toLowerCase())
  );

  const filteredCustomers = customersList.filter(
    (c) =>
      c.name.toLowerCase().includes(searchCustomer.toLowerCase()) ||
      c.phone.toLowerCase().includes(searchCustomer.toLowerCase()) ||
      c.email.toLowerCase().includes(searchCustomer.toLowerCase())
  );

  const openAddProductModal = () => {
    setEditingProductId(null);
    setNewProductName("");
    setNewProductCategory(categoriesList[0]?.name || "Худи и свитшоты");
    setNewProductPrice(29990);
    setNewProductComparePrice("");
    setNewProductImageUrl("");
    setNewProductImages(["/products/1-1.jpg"]);
    setNewProductDescription("");
    setNewProductComposition("100% турецкий хлопок Пенье премиального качества.");
    setNewProductCare(
      "Деликатная стирка при 30°C на изнаночной стороне, не отбеливать, гладить на низкой температуре."
    );
    setNewProductColor("Чёрный");
    setNewProductSizes(["S", "M", "L", "XL", "2XL", "3XL"]);
    setNewProductStock(8);
    setNewProductClubOnly(false);
    setNewProductIsNew(true);
    setNewProductIsBestSeller(false);
    setIsAddModalOpen(true);
  };

  const openEditProductModal = (product: ProductItem) => {
    setEditingProductId(product.id);
    setNewProductName(product.name);
    setNewProductCategory(product.category);
    setNewProductPrice(product.price);
    setNewProductComparePrice(product.comparePrice ? String(product.comparePrice) : "");
    const imgs = product.images && product.images.length > 0 ? product.images : ["/products/1-1.jpg"];
    setNewProductImages(imgs);
    setNewProductImageUrl("");
    setNewProductDescription(product.description || "");
    setNewProductComposition(product.composition || "");
    setNewProductCare(
      product.care ||
        "Деликатная стирка при 30°C на изнаночной стороне, не отбеливать, гладить на низкой температуре."
    );
    setNewProductColor(product.variants?.[0]?.color || "Чёрный");
    const existingSizes = Array.from(new Set((product.variants || []).map((v) => v.size)));
    setNewProductSizes(
      existingSizes.length > 0 ? existingSizes : ["S", "M", "L", "XL", "2XL", "3XL"]
    );
    setNewProductStock(product.variants?.[0]?.stock ?? 8);
    setNewProductClubOnly(Boolean(product.isClubOnly));
    setNewProductIsNew(product.isNew ?? true);
    setNewProductIsBestSeller(Boolean(product.isBestSeller));
    setIsAddModalOpen(true);
  };

  const handleImageFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setNewProductImages((prev) => [...prev, reader.result as string]);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleHeroImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setHeroImage(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleAddImageUrlToList = () => {
    const trimmed = newProductImageUrl.trim();
    if (!trimmed) return;
    setNewProductImages((prev) => [...prev, trimmed]);
    setNewProductImageUrl("");
  };

  const handleRemoveImageFromList = (index: number) => {
    setNewProductImages((prev) => prev.filter((_, i) => i !== index));
  };

  const toggleProductSize = (size: string) => {
    setNewProductSizes((prev) =>
      prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size]
    );
  };

  const applyDiscountPresetInModal = (discountPercent: number | null) => {
    if (!discountPercent) {
      if (newProductComparePrice && Number(newProductComparePrice) > 0) {
        setNewProductPrice(Number(newProductComparePrice));
      }
      setNewProductComparePrice("");
      return;
    }
    const basePrice =
      newProductComparePrice && Number(newProductComparePrice) > newProductPrice
        ? Number(newProductComparePrice)
        : newProductPrice;
    const discounted = Math.round((basePrice * (100 - discountPercent)) / 100);
    setNewProductComparePrice(String(basePrice));
    setNewProductPrice(discounted);
  };

  const handleQuickDiscount = async (product: ProductItem, discountPercent: number | null) => {
    const basePrice =
      product.comparePrice && product.comparePrice > product.price
        ? product.comparePrice
        : product.price;

    const nextPrice = discountPercent
      ? Math.round((basePrice * (100 - discountPercent)) / 100)
      : basePrice;
    const nextComparePrice = discountPercent ? basePrice : null;

    setProductsList((prev) =>
      prev.map((item) =>
        item.id === product.id
          ? { ...item, price: nextPrice, comparePrice: nextComparePrice }
          : item
      )
    );

    try {
      const res = await fetch("/api/products", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: product.id,
          price: nextPrice,
          comparePrice: nextComparePrice,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(
          discountPercent
            ? `Скидка -${discountPercent}% установлена для «${product.name}»`
            : `Скидка снята с «${product.name}»`
        );
      }
    } catch (err) {
      console.error("Error applying quick discount:", err);
    }
  };

  const handleToggleProductClub = async (product: ProductItem) => {
    const nextClubStatus = !product.isClubOnly;
    setProductsList((prev) =>
      prev.map((item) =>
        item.id === product.id ? { ...item, isClubOnly: nextClubStatus } : item
      )
    );

    try {
      const res = await fetch("/api/products", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: product.id,
          isClubOnly: nextClubStatus,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(
          nextClubStatus
            ? `Изделие «${product.name}» переведено в закрытый доступ SABYR CLUB`
            : `Изделие «${product.name}» открыто для общего каталога`
        );
      }
    } catch (err) {
      console.error("Error toggling product club status:", err);
    }
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const compareVal =
      newProductComparePrice.trim() && Number(newProductComparePrice) > Number(newProductPrice)
        ? Number(newProductComparePrice)
        : null;

    const finalImages =
      newProductImages.length > 0
        ? newProductImages
        : [newProductImageUrl.trim() || "/products/1-1.jpg"];

    const activeSizes =
      newProductSizes.length > 0 ? newProductSizes : ["S", "M", "L", "XL", "2XL", "3XL"];

    const variantsList = activeSizes.map((size, idx) => ({
      id: `${editingProductId || "new"}-v${idx}`,
      color: newProductColor || "Чёрный",
      colorHex: "#0D0D0D",
      size,
      stock: Math.max(0, Number(newProductStock)),
    }));

    try {
      if (editingProductId) {
        const res = await fetch("/api/products", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: editingProductId,
            name: newProductName,
            category: newProductCategory,
            price: Number(newProductPrice),
            comparePrice: compareVal,
            description: newProductDescription,
            composition: newProductComposition,
            care: newProductCare,
            images: finalImages,
            variants: variantsList,
            isClubOnly: newProductClubOnly,
            isNew: newProductIsNew,
            isBestSeller: newProductIsBestSeller,
          }),
        });
        const data = await res.json();
        if (data.success && Array.isArray(data.products)) {
          setProductsList(data.products);
          showToast(`Изделие «${newProductName}» успешно обновлено`);
        }
      } else {
        const res = await fetch("/api/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: newProductName,
            category: newProductCategory,
            price: Number(newProductPrice),
            comparePrice: compareVal,
            description: newProductDescription,
            composition: newProductComposition,
            care: newProductCare,
            images: finalImages,
            variants: variantsList,
            isClubOnly: newProductClubOnly,
            isNew: newProductIsNew,
            isBestSeller: newProductIsBestSeller,
          }),
        });
        const data = await res.json();
        if (data.success && data.product) {
          setProductsList([data.product, ...productsList]);
          showToast(`Изделие «${newProductName}» добавлено в каталог`);
        }
      }
    } catch (err) {
      console.error("Error saving product:", err);
    }
    setIsAddModalOpen(false);
    setEditingProductId(null);
  };

  const handleDeleteProduct = async (productId: string) => {
    try {
      await fetch(`/api/products?id=${encodeURIComponent(productId)}`, { method: "DELETE" });
      setProductsList(productsList.filter((item) => item.id !== productId));
      showToast("Товар удалён из каталога");
    } catch (err) {
      console.error("Error deleting product:", err);
    }
  };

  const handleUpdateOrderStatus = async (
    orderId: string,
    newStatus: string,
    trackingNumber?: string
  ) => {
    setOrdersList((prev) =>
      prev.map((ord) =>
        ord.id === orderId
          ? {
              ...ord,
              status: newStatus,
              ...(trackingNumber !== undefined ? { trackingNumber } : {}),
            }
          : ord
      )
    );

    try {
      const res = await fetch(`/api/orders/${encodeURIComponent(orderId)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus, trackingNumber }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Статус заказа обновлён: ${newStatus}`);
        loadNotifications();
      }
    } catch (err) {
      console.error("Error updating order status:", err);
    }
  };

  const handleCustomerAction = async (
    userId: string,
    payload: {
      bonusDelta?: number;
      toggleClub?: boolean;
      toggleBlock?: boolean;
      toggleRole?: boolean;
    }
  ) => {
    try {
      const res = await fetch("/api/admin/customers", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, ...payload }),
      });
      if (res.ok) {
        loadCustomers();
        if (payload.toggleClub) {
          showToast("Статус членства в SABYR CLUB обновлён");
        } else if (payload.toggleBlock) {
          showToast("Статус блокировки клиента изменён");
        } else if (payload.toggleRole) {
          showToast("Роль пользователя обновлена");
        } else {
          showToast("Бонусный баланс клиента обновлён");
        }
      }
    } catch {
      // ignore
    }
  };

  const handleCreatePromo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPromoCode) return;
    try {
      const res = await fetch("/api/promo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: newPromoCode,
          type: "PERCENTAGE",
          value: Number(newPromoDiscount),
          maxUses: 200,
        }),
      });
      const data = await res.json();
      if (data.success && data.promo) {
        setPromosList([data.promo, ...promosList]);
        setNewPromoCode("");
        showToast(`Промокод ${data.promo.code} создан`);
      }
    } catch (err) {
      console.error("Error creating promo:", err);
    }
  };

  const handleDeletePromo = async (promoId: string) => {
    try {
      await fetch(`/api/promo?id=${promoId}`, { method: "DELETE" });
      setPromosList(promosList.filter((p) => p.id !== promoId));
      showToast("Промокод деактивирован");
    } catch (err) {
      console.error("Error deleting promo:", err);
    }
  };

  const handleCreateGiftCard = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/gift-cards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: Number(newGiftAmount) }),
      });
      const data = await res.json();
      if (data.success) {
        loadGiftCards();
        showToast(`Сертификат ${data.giftCard.code} выпущен`);
      }
    } catch {
      // ignore
    }
  };

  const handleSaveClubSettings = async () => {
    setSavingClub(true);
    try {
      await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scope: "club",
          entries: {
            annual_price: clubAnnualPrice,
            monthly_price: clubMonthlyPrice,
            welcome_deposit: clubWelcomeDeposit,
            cashback_percent: clubCashbackPercent,
            club_subtitle: clubSubtitle,
            ai_club_only: aiClubOnly ? "true" : "false",
          },
        }),
      });
      showToast("Настройки SABYR CLUB, цены и доступ к AI сохранены в БД");
    } finally {
      setSavingClub(false);
    }
  };

  const handleSaveBonusLevels = async () => {
    setSavingBonuses(true);
    try {
      await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scope: "bonus",
          bonusLevels,
        }),
      });
      showToast("Уровни бонусной программы сохранены в БД");
    } finally {
      setSavingBonuses(false);
    }
  };

  const handleSaveHeroContent = async () => {
    setSavingSite(true);
    try {
      await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scope: "site",
          entries: {
            hero_badge: heroBadge,
            hero_title: heroTitle,
            hero_subtitle: heroSubtitle,
            hero_image: heroImage,
            announcement_enabled: announcementEnabled ? "true" : "false",
            announcement_text: announcementText,
            free_delivery_threshold: freeDeliveryThreshold,
            courier_delivery_cost: courierDeliveryCost,
            contact_phone: contactPhone,
            contact_whatsapp: contactWhatsapp,
            contact_instagram: contactInstagram,
            brand_city: brandCity,
          },
        }),
      });
      showToast("Настройки главной страницы, доставки и контактов сохранены в БД");
    } finally {
      setSavingSite(false);
    }
  };

  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notifTitle.trim() || !notifBody.trim()) return;
    setNotifSending(true);
    try {
      const res = await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: notifType,
          title: notifTitle,
          body: notifBody,
          audience: notifAudience,
          channels: ["IN_APP", "SMS", "WHATSAPP", "EMAIL"],
        }),
      });
      const data = await res.json();
      if (data.success) {
        setNotifTitle("");
        setNotifBody("");
        loadNotifications();
        showToast(data.message || "Уведомления успешно отправлены");
      }
    } finally {
      setNotifSending(false);
    }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    setCategorySaving(true);
    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newCategoryName.trim() }),
      });
      const data = await res.json();
      if (data.success && data.category) {
        setCategoriesList((prev) => [...prev, data.category]);
        setNewCategoryName("");
        showToast(`Категория «${data.category.name}» создана`);
      } else {
        showToast(data.error || "Ошибка при создании категории");
      }
    } catch {
      showToast("Ошибка сети");
    } finally {
      setCategorySaving(false);
    }
  };

  const handleSaveCategory = async (catId: string) => {
    if (!editingCategoryName.trim()) return;
    setCategorySaving(true);
    try {
      const res = await fetch("/api/categories", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: catId, name: editingCategoryName.trim() }),
      });
      const data = await res.json();
      if (data.success && data.category) {
        setCategoriesList((prev) =>
          prev.map((c) => (c.id === catId ? data.category : c))
        );
        setEditingCategoryId(null);
        showToast(`Категория переименована в «${data.category.name}»`);
      }
    } catch {
      showToast("Ошибка сети");
    } finally {
      setCategorySaving(false);
    }
  };

  const handleDeleteCategory = async (catId: string, catName: string) => {
    if (!confirm(`Удалить категорию «${catName}»? Это не удалит товары в ней.`)) return;
    try {
      const res = await fetch(`/api/categories?id=${encodeURIComponent(catId)}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setCategoriesList((prev) => prev.filter((c) => c.id !== catId));
        showToast(`Категория «${catName}» удалена`);
      } else {
        showToast(data.error || "Не удалось удалить категорию");
      }
    } catch {
      showToast("Ошибка сети");
    }
  };

  const clubMembersCount = customersList.filter((c) => c.club).length;
  const clubProductsCount = productsList.filter((p) => p.isClubOnly).length;

  return (
    <div className="min-h-screen bg-secondary/30 flex flex-col">
      {/* Top Admin Bar */}
      <header className="bg-background border-b border-border sticky top-0 z-sticky">
        <div className="px-4 sm:px-6 h-16 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-4 min-w-0">
            <Link
              href="/"
              className="text-foreground hover:opacity-85 transition-opacity inline-flex items-center"
              aria-label="SABYR"
            >
              <SabyrLogo className="h-3.5 sm:h-4 w-auto" />
            </Link>
            <span className="px-2.5 py-0.5 rounded-md bg-foreground text-background text-[11px] font-semibold uppercase tracking-wider whitespace-nowrap">
              Admin Panel · Полный контроль
            </span>
          </div>

          <div className="flex items-center gap-3 flex-shrink-0">
            <Link
              href="/club"
              target="_blank"
              className="text-xs text-muted-foreground hover:text-foreground hidden md:flex items-center gap-1 whitespace-nowrap"
            >
              <span>Страница SABYR CLUB</span>
              <ExternalLink className="w-3.5 h-3.5 flex-shrink-0" />
            </Link>
            <Link
              href="/"
              target="_blank"
              className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 whitespace-nowrap"
            >
              <span className="hidden sm:inline">Сайт для клиентов</span>
              <ExternalLink className="w-3.5 h-3.5 flex-shrink-0" />
            </Link>
            <div className="w-8 h-8 rounded-full bg-foreground text-background text-xs font-bold flex items-center justify-center flex-shrink-0">
              AD
            </div>
          </div>
        </div>
      </header>

      {/* Main Admin Layout */}
      <div className="flex-1 flex flex-col md:flex-row">
        {/* Sidebar Nav */}
        <aside className="w-full md:w-64 bg-background border-r border-border p-4 space-y-1">
          {[
            { id: "club", label: "SABYR CLUB и AI", icon: Crown },
            { id: "products", label: "Товары и остатки", icon: Package },
            { id: "categories", label: "Категории одежды", icon: Folder },
            { id: "orders", label: "Заказы клиентов", icon: ShoppingBag },
            { id: "customers", label: "База клиентов и роли", icon: Users },
            { id: "content", label: "Главная, доставка, контакты", icon: LayoutTemplate },
            { id: "bonuses", label: "Бонусы и уровни", icon: Sparkles },
            { id: "promos", label: "Промокоды и карты", icon: Tag },
            { id: "notifications", label: "Уведомления", icon: Bell },
            { id: "analytics", label: "Аналитика и продажи", icon: BarChart3 },
          ].map((item) => {
            const Icon = item.icon;
            const active = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentTab(item.id as AdminTab)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  active
                    ? "bg-foreground text-background shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                }`}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </aside>

        {/* Workspace Body */}
        <main className="flex-1 p-6 md:p-8 max-w-7xl overflow-x-hidden">
          {statusMessage && (
            <div className="mb-6 p-3.5 rounded-xl bg-foreground text-background text-xs font-medium flex items-center justify-between gap-3">
              <span>{statusMessage}</span>
              <button
                type="button"
                onClick={() => setStatusMessage(null)}
                className="text-[11px] opacity-75 hover:opacity-100"
              >
                Закрыть
              </button>
            </div>
          )}

          {/* TAB 1: Analytics */}
          {currentTab === "analytics" && (
            <div className="space-y-8">
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Аналитика и показатели SABYR</h1>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Сводка по каталогу, заказам, клиентам и резидентам закрытого клуба
                </p>
              </div>

              {/* KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-5 border border-border rounded-2xl bg-card">
                  <span className="text-xs text-muted-foreground">Всего заказов</span>
                  <div className="text-2xl font-extrabold mt-1 tabular-nums">{ordersList.length}</div>
                  <span className="text-[11px] text-muted-foreground">В базе данных</span>
                </div>

                <div className="p-5 border border-border rounded-2xl bg-card">
                  <span className="text-xs text-muted-foreground">Пользователей в базе</span>
                  <div className="text-2xl font-extrabold mt-1 tabular-nums">{customersList.length}</div>
                  <span className="text-[11px] text-muted-foreground">
                    Из них резидентов клуба: {clubMembersCount}
                  </span>
                </div>

                <div className="p-5 border border-border rounded-2xl bg-card">
                  <span className="text-xs text-muted-foreground">Товаров в каталоге</span>
                  <div className="text-2xl font-extrabold mt-1 tabular-nums">{productsList.length}</div>
                  <span className="text-[11px] text-muted-foreground">
                    Клубных дропов: {clubProductsCount}
                  </span>
                </div>

                <div className="p-5 border border-border rounded-2xl bg-card">
                  <span className="text-xs text-muted-foreground">Тариф SABYR CLUB</span>
                  <div className="text-2xl font-extrabold mt-1 tabular-nums">{clubAnnualPrice}</div>
                  <span className="text-[11px] text-muted-foreground">
                    Месячный: {clubMonthlyPrice}
                  </span>
                </div>
              </div>

              {/* Products list in analytics */}
              {productsList.length > 0 && (
                <div className="border border-border rounded-2xl p-6 bg-card space-y-4">
                  <h3 className="font-bold text-sm">Товары каталога</h3>
                  <div className="divide-y divide-border text-xs">
                    {productsList.slice(0, 8).map((p) => (
                      <div key={p.id} className="py-3 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className="relative w-10 h-12 rounded bg-secondary overflow-hidden flex-shrink-0">
                            <Image
                              src={p.images[0] || "/products/1-1.jpg"}
                              alt={p.name}
                              fill
                              className="object-cover"
                              unoptimized
                            />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold truncate">{p.name}</p>
                            <span className="text-muted-foreground block truncate">{p.category}</span>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0 flex items-center gap-3">
                          {p.isClubOnly && (
                            <span className="px-2 py-0.5 rounded bg-black text-[hsl(var(--accent))] text-[10px] font-bold">
                              CLUB ONLY
                            </span>
                          )}
                          <span className="font-bold tabular-nums whitespace-nowrap">
                            {formatPrice(p.price)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Products CRUD */}
          {currentTab === "products" && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight">Управление одеждой и скидками</h1>
                  <p className="text-xs text-muted-foreground">
                    Добавляйте одежду, меняйте цены, назначайте скидки, переключайте CLUB ONLY и управляйте остатками ({productsList.length} шт.)
                  </p>
                </div>
                <button
                  type="button"
                  onClick={openAddProductModal}
                  className="px-5 py-2.5 bg-foreground text-background text-xs font-semibold rounded-full flex items-center gap-1.5 hover:opacity-90 transition-all self-start sm:self-auto flex-shrink-0"
                >
                  <Plus className="w-4 h-4 flex-shrink-0" /> Добавить одежду
                </button>
              </div>

              {/* Search Bar */}
              <div className="relative max-w-md">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Поиск по названию или категории..."
                  value={searchProduct}
                  onChange={(e) => setSearchProduct(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-xs border border-border rounded-xl bg-card focus:outline-none focus:border-foreground"
                />
              </div>

              {/* Products Table */}
              <div className="border border-border rounded-2xl bg-card overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-secondary/40 border-b border-border text-muted-foreground uppercase text-[10px] tracking-wider">
                      <tr>
                        <th className="p-4">Изделие</th>
                        <th className="p-4">Категория</th>
                        <th className="p-4">Цена и Скидка</th>
                        <th className="p-4">Быстрая скидка</th>
                        <th className="p-4">Остатки / Размеры</th>
                        <th className="p-4">Доступ (Клуб)</th>
                        <th className="p-4 text-right">Действия</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {filteredProducts.map((p) => {
                        const totalStock = p.variants.reduce((acc, v) => acc + v.stock, 0);
                        const sizesStr = Array.from(new Set(p.variants.map((v) => v.size))).join(", ");
                        const hasDiscount = Boolean(p.comparePrice && p.comparePrice > p.price);
                        const discountPct =
                          hasDiscount && p.comparePrice
                            ? Math.round(((p.comparePrice - p.price) / p.comparePrice) * 100)
                            : 0;
                        return (
                          <tr key={p.id} className="hover:bg-secondary/20 transition-colors">
                            <td className="p-4 min-w-[210px]">
                              <div className="flex items-center gap-3">
                                <div className="relative w-11 h-14 rounded-lg bg-secondary overflow-hidden flex-shrink-0 border border-border/50">
                                  <Image
                                    src={p.images[0] || "/products/1-1.jpg"}
                                    alt={p.name}
                                    fill
                                    unoptimized={
                                      (p.images[0] || "").startsWith("data:") ||
                                      (p.images[0] || "").endsWith(".svg")
                                    }
                                    className="object-cover"
                                  />
                                </div>
                                <div className="min-w-[140px]">
                                  <p className="font-semibold break-words">{p.name}</p>
                                  <span className="text-[10px] text-muted-foreground">
                                    Фото: {p.images.length} шт.
                                  </span>
                                </div>
                              </div>
                            </td>
                            <td className="p-4 font-medium whitespace-nowrap">{p.category}</td>
                            <td className="p-4 whitespace-nowrap tabular-nums">
                              <div className="flex flex-col">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-sm">{formatPrice(p.price)}</span>
                                  {hasDiscount && (
                                    <span className="px-1.5 py-0.5 rounded bg-red-600 text-white text-[10px] font-bold">
                                      -{discountPct}%
                                    </span>
                                  )}
                                </div>
                                {hasDiscount && p.comparePrice && (
                                  <span className="text-[11px] text-muted-foreground line-through">
                                    {formatPrice(p.comparePrice)}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="p-4 whitespace-nowrap">
                              <div className="inline-flex items-center gap-1">
                                {[10, 20, 30, 50].map((pct) => (
                                  <button
                                    key={pct}
                                    type="button"
                                    onClick={() => handleQuickDiscount(p, pct)}
                                    className="px-2 py-1 rounded border border-border hover:bg-secondary text-[10px] font-semibold transition-colors"
                                    title={`Установить скидку -${pct}%`}
                                  >
                                    -{pct}%
                                  </button>
                                ))}
                                {hasDiscount && (
                                  <button
                                    type="button"
                                    onClick={() => handleQuickDiscount(p, null)}
                                    className="px-2 py-1 rounded border border-red-500/30 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 text-[10px] font-medium"
                                    title="Убрать скидку"
                                  >
                                    Без скидки
                                  </button>
                                )}
                              </div>
                            </td>
                            <td className="p-4 whitespace-nowrap">
                              <div className="flex flex-col gap-0.5">
                                <span
                                  className={`px-2 py-0.5 rounded text-[10px] font-semibold tabular-nums w-fit ${
                                    totalStock > 5
                                      ? "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-400"
                                      : "bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400"
                                  }`}
                                >
                                  {totalStock} шт.
                                </span>
                                <span className="text-[10px] text-muted-foreground">{sizesStr}</span>
                              </div>
                            </td>
                            <td className="p-4 whitespace-nowrap">
                              <button
                                type="button"
                                onClick={() => handleToggleProductClub(p)}
                                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-colors ${
                                  p.isClubOnly
                                    ? "bg-black text-[hsl(var(--accent))] hover:opacity-85"
                                    : "border border-border text-muted-foreground hover:text-foreground hover:bg-secondary"
                                }`}
                                title="Нажмите, чтобы переключить доступ (CLUB ONLY / Общий каталог)"
                              >
                                {p.isClubOnly ? "CLUB ONLY (Вкл)" : "Общий каталог"}
                              </button>
                            </td>
                            <td className="p-4 text-right whitespace-nowrap">
                              <div className="inline-flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => openEditProductModal(p)}
                                  className="px-2.5 py-1.5 rounded-lg border border-border hover:bg-secondary text-foreground inline-flex items-center gap-1 text-[11px] font-medium"
                                  title="Изменить товар, цену или скидку"
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                  <span>Изменить</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteProduct(p.id)}
                                  className="p-1.5 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg text-muted-foreground hover:text-red-600 transition-colors"
                                  title="Удалить товар"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Add / Edit Product Modal */}
              {isAddModalOpen && (
                <div className="fixed inset-0 z-modal bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
                  <div className="bg-card border border-border rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-2xl my-8 max-h-[92vh] overflow-y-auto">
                    <div className="flex items-center justify-between border-b border-border pb-3">
                      <h3 className="font-bold text-lg">
                        {editingProductId
                          ? "Редактировать одежду / цену / фото"
                          : "Добавить новую одежду в каталог"}
                      </h3>
                      <button
                        type="button"
                        onClick={() => setIsAddModalOpen(false)}
                        className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
                      >
                        <span>Закрыть</span>
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <form onSubmit={handleSaveProduct} className="space-y-4 text-xs">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block font-semibold mb-1">Название одежды *</label>
                          <input
                            type="text"
                            required
                            value={newProductName}
                            onChange={(e) => setNewProductName(e.target.value)}
                            placeholder="Например: Трикотажный свитшот на молнии"
                            className="w-full px-3.5 py-2 border border-border rounded-lg bg-background"
                          />
                        </div>
                        <div>
                          <label className="block font-semibold mb-1">Категория</label>
                          <select
                            value={newProductCategory}
                            onChange={(e) => setNewProductCategory(e.target.value)}
                            className="w-full px-3 py-2 border border-border rounded-lg bg-background"
                          >
                            {categoriesList.length > 0 ? (
                              categoriesList.map((cat) => (
                                <option key={cat.id} value={cat.name}>
                                  {cat.name}
                                </option>
                              ))
                            ) : (
                              <>
                                <option>Худи и свитшоты</option>
                                <option>Футболки и лонгсливы</option>
                                <option>Костюмы и комплекты</option>
                                <option>Брюки и джоггеры</option>
                                <option>Рубашки и поло</option>
                                <option>Верхняя одежда и куртки</option>
                                <option>Аксессуары</option>
                              </>
                            )}
                          </select>
                        </div>
                      </div>

                      {/* Price & Discount Block */}
                      <div className="p-3.5 rounded-xl bg-secondary/40 border border-border space-y-3">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <span className="font-bold flex items-center gap-1.5">
                            <Percent className="w-3.5 h-3.5 text-[hsl(var(--accent))]" />
                            Цена и управление скидкой
                          </span>
                          <div className="flex gap-1">
                            {[10, 15, 20, 30, 50].map((pct) => (
                              <button
                                key={pct}
                                type="button"
                                onClick={() => applyDiscountPresetInModal(pct)}
                                className="px-2 py-0.5 rounded bg-background border border-border hover:border-foreground text-[10px] font-semibold"
                              >
                                -{pct}%
                              </button>
                            ))}
                            <button
                              type="button"
                              onClick={() => applyDiscountPresetInModal(null)}
                              className="px-2 py-0.5 rounded bg-background border border-border text-muted-foreground hover:text-foreground text-[10px]"
                            >
                              Сброс
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block font-semibold mb-1">
                              Итоговая цена продажи (в ₸) *
                            </label>
                            <input
                              type="number"
                              required
                              min={100}
                              value={newProductPrice}
                              onChange={(e) => setNewProductPrice(Number(e.target.value))}
                              className="w-full px-3.5 py-2 border border-border rounded-lg bg-background font-bold"
                            />
                          </div>
                          <div>
                            <label className="block font-semibold mb-1">
                              Старая цена до скидки (в ₸, необязательно)
                            </label>
                            <input
                              type="number"
                              value={newProductComparePrice}
                              onChange={(e) => setNewProductComparePrice(e.target.value)}
                              placeholder="Например: 35000 (зачёркнутая цена)"
                              className="w-full px-3.5 py-2 border border-border rounded-lg bg-background"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Multiple Images Manager */}
                      <div className="space-y-2">
                        <label className="block font-semibold">
                          Фотографии изделия ({newProductImages.length} шт.)
                        </label>
                        {newProductImages.length > 0 && (
                          <div className="flex flex-wrap gap-2.5 pb-1">
                            {newProductImages.map((img, idx) => (
                              <div
                                key={idx}
                                className="relative w-16 h-20 rounded-lg border border-border overflow-hidden bg-secondary group"
                              >
                                <Image
                                  src={img}
                                  alt={`Фото ${idx + 1}`}
                                  fill
                                  unoptimized
                                  className="object-cover"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleRemoveImageFromList(idx)}
                                  className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/80 text-white flex items-center justify-center text-[10px]"
                                  title="Удалить фото"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                        <div className="flex flex-col sm:flex-row gap-2">
                          <input
                            type="text"
                            value={newProductImageUrl}
                            onChange={(e) => setNewProductImageUrl(e.target.value)}
                            placeholder="/products/1-1.jpg или https://..."
                            className="flex-1 px-3.5 py-2 border border-border rounded-lg bg-background"
                          />
                          <button
                            type="button"
                            onClick={handleAddImageUrlToList}
                            className="px-3.5 py-2 border border-border rounded-lg bg-secondary hover:bg-secondary/80 font-medium whitespace-nowrap"
                          >
                            + Добавить ссылку
                          </button>
                          <label className="px-3.5 py-2 border border-border rounded-lg bg-secondary hover:bg-secondary/80 cursor-pointer inline-flex items-center justify-center gap-1.5 font-medium whitespace-nowrap">
                            <Upload className="w-3.5 h-3.5" />
                            <span>Загрузить файл</span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleImageFileUpload}
                              className="hidden"
                            />
                          </label>
                        </div>
                      </div>

                      {/* Sizes Selector */}
                      <div>
                        <label className="block font-semibold mb-1.5">Доступные размеры</label>
                        <div className="flex flex-wrap gap-2">
                          {ALL_AVAILABLE_SIZES.map((sz) => {
                            const active = newProductSizes.includes(sz);
                            return (
                              <button
                                key={sz}
                                type="button"
                                onClick={() => toggleProductSize(sz)}
                                className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
                                  active
                                    ? "bg-foreground text-background border-foreground"
                                    : "bg-background text-muted-foreground border-border hover:border-foreground"
                                }`}
                              >
                                {sz}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Description & Composition */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block font-semibold mb-1">Описание изделия</label>
                          <textarea
                            rows={2}
                            value={newProductDescription}
                            onChange={(e) => setNewProductDescription(e.target.value)}
                            placeholder="Краткое описание кроя и посадки..."
                            className="w-full px-3 py-2 border border-border rounded-lg bg-background resize-none"
                          />
                        </div>
                        <div>
                          <label className="block font-semibold mb-1">Состав ткани</label>
                          <textarea
                            rows={2}
                            value={newProductComposition}
                            onChange={(e) => setNewProductComposition(e.target.value)}
                            placeholder="Например: 100% турецкий хлопок Пенье"
                            className="w-full px-3 py-2 border border-border rounded-lg bg-background resize-none"
                          />
                        </div>
                      </div>

                      {/* Color & Stock */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block font-semibold mb-1">Основной оттенок</label>
                          <input
                            type="text"
                            value={newProductColor}
                            onChange={(e) => setNewProductColor(e.target.value)}
                            placeholder="Чёрный / Тёмно-синий / Серый меланж"
                            className="w-full px-3.5 py-2 border border-border rounded-lg bg-background"
                          />
                        </div>
                        <div>
                          <label className="block font-semibold mb-1">
                            Остаток на каждый выбранный размер
                          </label>
                          <input
                            type="number"
                            min={0}
                            value={newProductStock}
                            onChange={(e) => setNewProductStock(Number(e.target.value))}
                            className="w-full px-3.5 py-2 border border-border rounded-lg bg-background"
                          />
                        </div>
                      </div>

                      {/* Badges */}
                      <div className="flex flex-wrap gap-5 pt-1">
                        <label className="flex items-center gap-2 cursor-pointer font-medium">
                          <input
                            type="checkbox"
                            checked={newProductIsNew}
                            onChange={(e) => setNewProductIsNew(e.target.checked)}
                            className="accent-foreground flex-shrink-0"
                          />
                          <span>Отметить как «NEW» (Новинка)</span>
                        </label>

                        <label className="flex items-center gap-2 cursor-pointer font-medium">
                          <input
                            type="checkbox"
                            checked={newProductIsBestSeller}
                            onChange={(e) => setNewProductIsBestSeller(e.target.checked)}
                            className="accent-foreground flex-shrink-0"
                          />
                          <span>Отметить как «Хит продаж» (Bestseller)</span>
                        </label>

                        <label className="flex items-center gap-2 cursor-pointer font-medium">
                          <input
                            type="checkbox"
                            checked={newProductClubOnly}
                            onChange={(e) => setNewProductClubOnly(e.target.checked)}
                            className="accent-foreground flex-shrink-0"
                          />
                          <span>Доступно только для SABYR CLUB</span>
                        </label>
                      </div>

                      <div className="flex gap-3 pt-3">
                        <button
                          type="button"
                          onClick={() => setIsAddModalOpen(false)}
                          className="flex-1 py-2.5 border border-border rounded-full hover:bg-secondary"
                        >
                          Отмена
                        </button>
                        <button
                          type="submit"
                          className="flex-1 py-2.5 bg-foreground text-background font-semibold rounded-full hover:opacity-90"
                        >
                          {editingProductId ? "Сохранить изменения" : "Добавить в каталог"}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Categories */}
          {currentTab === "categories" && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Категории одежды</h1>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Добавляйте, переименовывайте и удаляйте категории. Используются в каталоге и при добавлении товара.
                </p>
              </div>

              {/* Add New Category Form */}
              <div className="border border-border rounded-2xl p-6 bg-card">
                <h3 className="font-bold text-sm mb-4">Добавить новую категорию</h3>
                <form onSubmit={handleAddCategory} className="flex gap-3">
                  <input
                    type="text"
                    placeholder="Название категории, напр. «Костюмы и комплекты»"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    className="flex-1 px-4 py-2.5 text-xs border border-border rounded-xl bg-background focus:outline-none focus:border-foreground"
                    required
                  />
                  <button
                    type="submit"
                    disabled={categorySaving || !newCategoryName.trim()}
                    className="px-5 py-2.5 bg-foreground text-background text-xs font-semibold rounded-full flex items-center gap-1.5 hover:opacity-90 transition-all disabled:opacity-40 flex-shrink-0"
                  >
                    <Plus className="w-4 h-4" />
                    Добавить
                  </button>
                </form>
              </div>

              {/* Categories List */}
              <div className="border border-border rounded-2xl bg-card overflow-hidden">
                {categoriesList.length === 0 ? (
                  <div className="p-10 text-center text-sm text-muted-foreground">
                    Категории загружаются... Если список пуст, нажмите «Добавить» выше.
                  </div>
                ) : (
                  <table className="w-full text-left text-xs">
                    <thead className="bg-secondary/40 border-b border-border text-muted-foreground uppercase text-[10px] tracking-wider">
                      <tr>
                        <th className="p-4">Категория</th>
                        <th className="p-4">Slug</th>
                        <th className="p-4 text-right">Действия</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {categoriesList.map((cat) => (
                        <tr key={cat.id} className="hover:bg-secondary/20 transition-colors">
                          <td className="p-4 font-medium">
                            {editingCategoryId === cat.id ? (
                              <input
                                type="text"
                                value={editingCategoryName}
                                onChange={(e) => setEditingCategoryName(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") handleSaveCategory(cat.id);
                                  if (e.key === "Escape") setEditingCategoryId(null);
                                }}
                                autoFocus
                                className="w-full max-w-xs px-3 py-1.5 text-xs border border-foreground rounded-lg bg-background focus:outline-none"
                              />
                            ) : (
                              <span>{cat.name}</span>
                            )}
                          </td>
                          <td className="p-4 text-muted-foreground font-mono">{cat.slug}</td>
                          <td className="p-4 text-right">
                            <div className="inline-flex items-center gap-1.5">
                              {editingCategoryId === cat.id ? (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => handleSaveCategory(cat.id)}
                                    disabled={categorySaving}
                                    className="px-3 py-1.5 rounded-lg bg-foreground text-background text-[11px] font-semibold hover:opacity-90"
                                  >
                                    Сохранить
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setEditingCategoryId(null)}
                                    className="px-3 py-1.5 rounded-lg border border-border text-[11px] hover:bg-secondary"
                                  >
                                    Отмена
                                  </button>
                                </>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingCategoryId(cat.id);
                                    setEditingCategoryName(cat.name);
                                  }}
                                  className="px-2.5 py-1.5 rounded-lg border border-border hover:bg-secondary text-foreground inline-flex items-center gap-1 text-[11px] font-medium"
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                  <span>Переименовать</span>
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => handleDeleteCategory(cat.id, cat.name)}
                                className="p-1.5 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg text-muted-foreground hover:text-red-600 transition-colors"
                                title="Удалить категорию"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: Orders */}
          {currentTab === "orders" && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Заказы покупателей</h1>
                <p className="text-xs text-muted-foreground">
                  Управление доставкой, трек-номерами и смена статусов (клиент получает уведомление автоматически)
                </p>
              </div>

              <div className="border border-border rounded-2xl bg-card overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-secondary/40 border-b border-border text-muted-foreground uppercase text-[10px] tracking-wider">
                      <tr>
                        <th className="p-4">Номер заказа</th>
                        <th className="p-4">Покупатель</th>
                        <th className="p-4">Сумма</th>
                        <th className="p-4">Оплата</th>
                        <th className="p-4">Трек-номер</th>
                        <th className="p-4">Статус заказа</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {ordersList.map((ord) => (
                        <tr key={ord.id} className="hover:bg-secondary/20">
                          <td className="p-4 font-mono font-bold whitespace-nowrap">{ord.number}</td>
                          <td className="p-4 min-w-[160px]">
                            <p className="font-semibold">{ord.customer}</p>
                            <span className="text-[11px] text-muted-foreground whitespace-nowrap">
                              {ord.phone}
                            </span>
                          </td>
                          <td className="p-4 font-bold whitespace-nowrap tabular-nums">
                            {formatPrice(ord.total)}
                          </td>
                          <td className="p-4 whitespace-nowrap">{ord.payment}</td>
                          <td className="p-4 whitespace-nowrap">
                            <input
                              type="text"
                              value={ord.trackingNumber || ""}
                              placeholder="KZ-CDEK-..."
                              onChange={(e) => {
                                const val = e.target.value;
                                setOrdersList((prev) =>
                                  prev.map((o) =>
                                    o.id === ord.id ? { ...o, trackingNumber: val } : o
                                  )
                                );
                              }}
                              onBlur={(e) =>
                                handleUpdateOrderStatus(ord.id, ord.status, e.target.value)
                              }
                              className="w-36 px-2.5 py-1 text-xs font-mono border border-border rounded-lg bg-background"
                            />
                          </td>
                          <td className="p-4 whitespace-nowrap">
                            <select
                              value={ord.status}
                              onChange={(e) =>
                                handleUpdateOrderStatus(ord.id, e.target.value, ord.trackingNumber)
                              }
                              className="px-2.5 py-1 text-xs border border-border rounded-lg bg-background font-medium"
                            >
                              <option value="В обработке">В обработке</option>
                              <option value="В пути">В пути</option>
                              <option value="Доставлен">Доставлен</option>
                              <option value="Отменён">Отменён</option>
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: Customers */}
          {currentTab === "customers" && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight">База клиентов и права доступа</h1>
                  <p className="text-xs text-muted-foreground">
                    Начисляйте или списывайте бонусы, выдавайте SABYR CLUB VIP, назначайте администраторов и управляйте доступом
                  </p>
                </div>
              </div>

              <div className="relative max-w-md">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Поиск по имени, телефону или email..."
                  value={searchCustomer}
                  onChange={(e) => setSearchCustomer(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-xs border border-border rounded-xl bg-card focus:outline-none focus:border-foreground"
                />
              </div>

              <div className="border border-border rounded-2xl bg-card overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-secondary/40 border-b border-border text-muted-foreground uppercase text-[10px] tracking-wider">
                      <tr>
                        <th className="p-4">Клиент</th>
                        <th className="p-4">Роль и Статус</th>
                        <th className="p-4">Уровень</th>
                        <th className="p-4">Бонусы</th>
                        <th className="p-4">Покупки</th>
                        <th className="p-4">SABYR CLUB</th>
                        <th className="p-4 text-right">Полное управление</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {filteredCustomers.map((c) => (
                        <tr key={c.id} className="hover:bg-secondary/20">
                          <td className="p-4 min-w-[180px]">
                            <p className="font-semibold">{c.name}</p>
                            <span className="text-[11px] text-muted-foreground block">{c.phone}</span>
                            {c.email && c.email !== "—" && (
                              <span className="text-[10px] text-muted-foreground block">
                                {c.email}
                              </span>
                            )}
                          </td>
                          <td className="p-4 whitespace-nowrap">
                            <div className="flex flex-col gap-1 items-start">
                              {c.role === "ADMIN" ? (
                                <span className="px-2 py-0.5 rounded bg-foreground text-background text-[10px] font-bold">
                                  ADMIN
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded bg-secondary text-muted-foreground text-[10px] font-medium">
                                  Клиент
                                </span>
                              )}
                              {c.isBlocked ? (
                                <span className="px-2 py-0.5 rounded-full bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400 text-[10px] font-bold">
                                  Заблокирован
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-full bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-400 text-[10px] font-bold">
                                  Активен
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="p-4 whitespace-nowrap font-medium">{c.level}</td>
                          <td className="p-4 whitespace-nowrap font-bold tabular-nums">
                            {c.bonusBalance.toLocaleString()} ₸
                          </td>
                          <td className="p-4 whitespace-nowrap tabular-nums">
                            {formatPrice(c.totalSpent)} ({c.ordersCount} зак.)
                          </td>
                          <td className="p-4 whitespace-nowrap">
                            {c.club ? (
                              <span className="px-2.5 py-0.5 rounded-full bg-black text-[hsl(var(--accent))] text-[10px] font-bold">
                                CLUB VIP
                              </span>
                            ) : (
                              <span className="text-muted-foreground">Стандарт</span>
                            )}
                          </td>
                          <td className="p-4 text-right whitespace-nowrap">
                            <div className="inline-flex flex-wrap items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleCustomerAction(c.id, { bonusDelta: 5000 })}
                                className="px-2 py-1 rounded-lg border border-border hover:bg-secondary text-[11px] font-medium"
                                title="Начислить 5 000 бонусов"
                              >
                                +5 000 Б
                              </button>
                              <button
                                type="button"
                                onClick={() => handleCustomerAction(c.id, { bonusDelta: -5000 })}
                                className="px-2 py-1 rounded-lg border border-border hover:bg-secondary text-[11px] font-medium text-muted-foreground"
                                title="Списать 5 000 бонусов"
                              >
                                -5 000 Б
                              </button>
                              <button
                                type="button"
                                onClick={() => handleCustomerAction(c.id, { toggleClub: true })}
                                className={`px-2.5 py-1 rounded-lg border text-[11px] font-semibold transition-colors ${
                                  c.club
                                    ? "bg-black text-[hsl(var(--accent))] border-black"
                                    : "border-border hover:bg-secondary"
                                }`}
                              >
                                {c.club ? "Откл. Club" : "Выдать Club"}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleCustomerAction(c.id, { toggleRole: true })}
                                className="px-2.5 py-1 rounded-lg border border-border hover:bg-secondary text-[11px] font-medium"
                                title="Переключить роль ADMIN / CUSTOMER"
                              >
                                {c.role === "ADMIN" ? "Снять админа" : "Сделать админом"}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleCustomerAction(c.id, { toggleBlock: true })}
                                className={`px-2.5 py-1 rounded-lg border text-[11px] font-semibold transition-colors ${
                                  c.isBlocked
                                    ? "border-green-600/40 text-green-700 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-950/50"
                                    : "border-red-500/40 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/50"
                                }`}
                              >
                                {c.isBlocked ? "Разблокировать" : "Заблокировать"}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: Bonuses */}
          {currentTab === "bonuses" && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight">Настройки Бонусной Программы</h1>
                  <p className="text-xs text-muted-foreground">
                    Редактируйте пороги покупок и процент кешбэка для каждого уровня лояльности (1 бонус = 1 ₸)
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleSaveBonusLevels}
                  disabled={savingBonuses}
                  className="px-6 py-2.5 bg-foreground text-background text-xs font-semibold rounded-full hover:opacity-90 disabled:opacity-50"
                >
                  {savingBonuses ? "Сохранение..." : "Сохранить уровни бонусов"}
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {bonusLevels.map((bl, i) => (
                  <div key={i} className="p-6 border border-border rounded-2xl bg-card space-y-4 text-xs">
                    <div className="flex justify-between items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        Уровень #{i + 1}
                      </span>
                      <span className="px-3 py-1 bg-secondary rounded-full font-bold text-xs text-[hsl(var(--accent))] flex-shrink-0 tabular-nums">
                        {bl.percent}% кешбэк
                      </span>
                    </div>

                    <div>
                      <label className="block font-semibold mb-1">Название уровня</label>
                      <input
                        type="text"
                        value={bl.name}
                        onChange={(e) => {
                          const val = e.target.value;
                          setBonusLevels((prev) =>
                            prev.map((item, idx) => (idx === i ? { ...item, name: val } : item))
                          );
                        }}
                        className="w-full px-3.5 py-2 border border-border rounded-lg bg-background font-semibold"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block font-semibold mb-1">Порог покупок (в ₸)</label>
                        <input
                          type="number"
                          min={0}
                          value={bl.minSpend}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            setBonusLevels((prev) =>
                              prev.map((item, idx) =>
                                idx === i ? { ...item, minSpend: val } : item
                              )
                            );
                          }}
                          className="w-full px-3.5 py-2 border border-border rounded-lg bg-background"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold mb-1">Кешбэк (%)</label>
                        <input
                          type="number"
                          min={0}
                          max={50}
                          value={bl.percent}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            setBonusLevels((prev) =>
                              prev.map((item, idx) =>
                                idx === i ? { ...item, percent: val } : item
                              )
                            );
                          }}
                          className="w-full px-3.5 py-2 border border-border rounded-lg bg-background font-bold"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 7: SABYR CLUB & AI Control */}
          {currentTab === "club" && (
            <div className="space-y-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight">
                    Управление SABYR CLUB и AI-сервисами
                  </h1>
                  <p className="text-xs text-muted-foreground">
                    Меняйте цену закрытого клуба, управляйте доступом к AI-Стилисту и AI-Примерочной, назначайте резидентов и клубные дропы
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleSaveClubSettings}
                  disabled={savingClub}
                  className="px-6 py-2.5 bg-foreground text-background text-xs font-semibold rounded-full hover:opacity-90 disabled:opacity-50 self-start sm:self-auto"
                >
                  {savingClub ? "Сохранение..." : "Сохранить цены и настройки клуба"}
                </button>
              </div>

              {/* AI Access Lock & Pricing Card */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-7 p-6 border border-border rounded-2xl bg-card space-y-5 text-xs">
                  <div className="flex items-center justify-between border-b border-border pb-3">
                    <h3 className="font-bold text-sm flex items-center gap-2">
                      <Crown className="w-4 h-4 text-[hsl(var(--accent))]" />
                      <span>Тарифы и привилегии SABYR CLUB</span>
                    </h3>
                    <span className="text-[11px] text-muted-foreground">
                      Обновляется на /club, главной и экранах AI
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-semibold mb-1">
                        Годовая подписка SABYR CLUB (цена)
                      </label>
                      <input
                        type="text"
                        value={clubAnnualPrice}
                        onChange={(e) => setClubAnnualPrice(e.target.value)}
                        placeholder="99 000 ₸"
                        className="w-full px-3.5 py-2.5 border border-border rounded-lg bg-background font-bold text-sm"
                      />
                      <span className="text-[10px] text-muted-foreground mt-1 block">
                        Отображается в годовом тарифе на странице /club
                      </span>
                    </div>

                    <div>
                      <label className="block font-semibold mb-1">
                        Месячная подписка SABYR CLUB (цена)
                      </label>
                      <input
                        type="text"
                        value={clubMonthlyPrice}
                        onChange={(e) => setClubMonthlyPrice(e.target.value)}
                        placeholder="12 000 ₸"
                        className="w-full px-3.5 py-2.5 border border-border rounded-lg bg-background font-bold text-sm"
                      />
                      <span className="text-[10px] text-muted-foreground mt-1 block">
                        Отображается в месячном тарифе на /club и AI-экранах
                      </span>
                    </div>

                    <div>
                      <label className="block font-semibold mb-1">
                        Приветственный депозит / сертификат
                      </label>
                      <input
                        type="text"
                        value={clubWelcomeDeposit}
                        onChange={(e) => setClubWelcomeDeposit(e.target.value)}
                        placeholder="25 000 ₸"
                        className="w-full px-3.5 py-2 border border-border rounded-lg bg-background"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold mb-1">
                        Повышенный кешбэк для клуба (%)
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={50}
                        value={clubCashbackPercent}
                        onChange={(e) => setClubCashbackPercent(e.target.value)}
                        className="w-full px-3.5 py-2 border border-border rounded-lg bg-background font-bold"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold mb-1">
                      Описание привилегий на странице SABYR CLUB
                    </label>
                    <textarea
                      rows={3}
                      value={clubSubtitle}
                      onChange={(e) => setClubSubtitle(e.target.value)}
                      className="w-full px-3.5 py-2 border border-border rounded-lg bg-background resize-none"
                    />
                  </div>
                </div>

                {/* AI Features Access Control */}
                <div className="lg:col-span-5 p-6 border border-border rounded-2xl bg-card space-y-5 text-xs flex flex-col justify-between">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-border pb-3">
                      <h3 className="font-bold text-sm flex items-center gap-2">
                        <Lock className="w-4 h-4 text-[hsl(var(--accent))]" />
                        <span>Доступ к AI-функциям сайта</span>
                      </h3>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          aiClubOnly
                            ? "bg-black text-[hsl(var(--accent))]"
                            : "bg-green-50 text-green-700"
                        }`}
                      >
                        {aiClubOnly ? "ТОЛЬКО SABYR CLUB" : "ОТКРЫТО ВСЕМ"}
                      </span>
                    </div>

                    <p className="text-muted-foreground leading-relaxed">
                      Управляйте режимом доступа к <strong>AI-Стилисту (/ai-stylist)</strong> и{" "}
                      <strong>AI-Примерочной (/ai-tryon)</strong>. Когда включён закрытый режим,
                      пользователи без подписки SABYR CLUB видят приглашение вступить в клуб с
                      актуальными тарифами ({clubMonthlyPrice} / мес или {clubAnnualPrice} / год), а
                      серверные API-маршруты блокируют запросы без членства.
                    </p>

                    <label className="p-4 rounded-xl border border-border bg-secondary/40 flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={aiClubOnly}
                        onChange={(e) => setAiClubOnly(e.target.checked)}
                        className="mt-0.5 accent-foreground w-4 h-4 flex-shrink-0"
                      />
                      <div>
                        <span className="font-bold block text-foreground">
                          AI-Стилист и AI-Примерочная доступны только с закрытым клубом SABYR CLUB
                        </span>
                        <span className="text-[11px] text-muted-foreground block mt-0.5">
                          Администраторы и резиденты со статусом CLUB VIP получают полный доступ автоматически.
                        </span>
                      </div>
                    </label>
                  </div>

                  <button
                    type="button"
                    onClick={handleSaveClubSettings}
                    disabled={savingClub}
                    className="w-full py-3 bg-foreground text-background font-semibold rounded-full hover:opacity-90 disabled:opacity-50"
                  >
                    {savingClub ? "Сохранение..." : "Применить и сохранить настройки клуба"}
                  </button>
                </div>
              </div>

              {/* Quick Management: Club Members & Club-Only Products */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Club Members Quick Control */}
                <div className="p-6 border border-border rounded-2xl bg-card space-y-4 text-xs">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-sm">Резиденты SABYR CLUB ({clubMembersCount})</h3>
                      <p className="text-[11px] text-muted-foreground">
                        Быстрая выдача или отзыв клубного доступа (открывает AI и закрытые дропы)
                      </p>
                    </div>
                  </div>

                  <div className="divide-y divide-border max-h-80 overflow-y-auto">
                    {customersList.map((c) => (
                      <div key={c.id} className="py-2.5 flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-semibold truncate">{c.name}</p>
                          <span className="text-[11px] text-muted-foreground">{c.phone}</span>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {c.club && (
                            <span className="px-2 py-0.5 rounded bg-black text-[hsl(var(--accent))] text-[10px] font-bold">
                              CLUB VIP
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => handleCustomerAction(c.id, { toggleClub: true })}
                            className={`px-3 py-1 rounded-lg border text-[11px] font-semibold transition-colors ${
                              c.club
                                ? "border-border text-muted-foreground hover:bg-secondary"
                                : "bg-foreground text-background border-foreground hover:opacity-90"
                            }`}
                          >
                            {c.club ? "Отозвать клуб" : "Выдать клуб"}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Club-Only Products Quick Control */}
                <div className="p-6 border border-border rounded-2xl bg-card space-y-4 text-xs">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-sm">
                        Клубные дропы одежды ({clubProductsCount} из {productsList.length})
                      </h3>
                      <p className="text-[11px] text-muted-foreground">
                        Отмечайте изделия, которые могут заказать только члены SABYR CLUB
                      </p>
                    </div>
                  </div>

                  <div className="divide-y divide-border max-h-80 overflow-y-auto">
                    {productsList.map((p) => (
                      <div key={p.id} className="py-2.5 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="relative w-9 h-11 rounded bg-secondary overflow-hidden flex-shrink-0">
                            <Image
                              src={p.images[0] || "/products/1-1.jpg"}
                              alt={p.name}
                              fill
                              unoptimized
                              className="object-cover"
                            />
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold truncate">{p.name}</p>
                            <span className="text-[11px] text-muted-foreground">
                              {formatPrice(p.price)}
                            </span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleToggleProductClub(p)}
                          className={`px-3 py-1 rounded-lg text-[11px] font-semibold flex-shrink-0 transition-colors ${
                            p.isClubOnly
                              ? "bg-black text-[hsl(var(--accent))]"
                              : "border border-border hover:bg-secondary"
                          }`}
                        >
                          {p.isClubOnly ? "CLUB ONLY (Активно)" : "Сделать клубным"}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 8: Promos & Gift Cards */}
          {currentTab === "promos" && (
            <div className="space-y-8">
              <div className="flex justify-between items-center">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight">Промокоды и Сертификаты</h1>
                  <p className="text-xs text-muted-foreground">
                    Создание скидочных купонов и выпуск подарочных сертификатов
                  </p>
                </div>
              </div>

              {/* Create Promo Form */}
              <form
                onSubmit={handleCreatePromo}
                className="p-5 border border-border rounded-2xl bg-card flex flex-wrap gap-3 items-end text-xs"
              >
                <div>
                  <label className="block font-semibold mb-1">Код промокода</label>
                  <input
                    type="text"
                    required
                    placeholder="SABYR20"
                    value={newPromoCode}
                    onChange={(e) => setNewPromoCode(e.target.value)}
                    className="px-3.5 py-2 border border-border rounded-lg bg-background uppercase font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Процент скидки (%)</label>
                  <input
                    type="number"
                    value={newPromoDiscount}
                    onChange={(e) => setNewPromoDiscount(e.target.value)}
                    className="w-28 px-3.5 py-2 border border-border rounded-lg bg-background"
                  />
                </div>
                <button
                  type="submit"
                  className="px-5 py-2 bg-foreground text-background font-semibold rounded-lg hover:opacity-90"
                >
                  Создать промокод
                </button>
              </form>

              {/* Promos Table */}
              <div className="border border-border rounded-2xl bg-card overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-secondary/40 border-b border-border text-muted-foreground uppercase text-[10px] tracking-wider">
                      <tr>
                        <th className="p-4">Код</th>
                        <th className="p-4">Скидка</th>
                        <th className="p-4">Использований</th>
                        <th className="p-4">Лимит</th>
                        <th className="p-4">Статус</th>
                        <th className="p-4 text-right">Действия</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border font-mono">
                      {promosList.map((pr) => (
                        <tr key={pr.id}>
                          <td className="p-4 font-bold whitespace-nowrap">{pr.code}</td>
                          <td className="p-4 whitespace-nowrap tabular-nums">{pr.discount}</td>
                          <td className="p-4 whitespace-nowrap tabular-nums">{pr.uses} раз</td>
                          <td className="p-4 whitespace-nowrap tabular-nums">{pr.maxUses ?? "—"}</td>
                          <td className="p-4 whitespace-nowrap">
                            <span
                              className={`px-2 py-0.5 font-sans text-[10px] rounded font-semibold ${
                                pr.active
                                  ? "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-400"
                                  : "bg-muted text-muted-foreground"
                              }`}
                            >
                              {pr.active ? "Активен" : "Неактивен"}
                            </span>
                          </td>
                          <td className="p-4 text-right font-sans">
                            <button
                              type="button"
                              onClick={() => handleDeletePromo(pr.id)}
                              title="Деактивировать промокод"
                              className="p-1.5 text-muted-foreground hover:text-red-500 rounded-md hover:bg-secondary transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Gift Cards Section */}
              <div className="space-y-4 pt-2">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-bold tracking-tight">Подарочные сертификаты</h2>
                    <p className="text-xs text-muted-foreground">
                      Выпущенные сертификаты и остатки их балансов
                    </p>
                  </div>
                  <form onSubmit={handleCreateGiftCard} className="flex items-center gap-2 text-xs">
                    <select
                      value={newGiftAmount}
                      onChange={(e) => setNewGiftAmount(Number(e.target.value))}
                      className="px-3 py-2 border border-border rounded-lg bg-background font-semibold"
                    >
                      <option value={25000}>25 000 ₸</option>
                      <option value={50000}>50 000 ₸</option>
                      <option value={100000}>100 000 ₸</option>
                      <option value={250000}>250 000 ₸</option>
                    </select>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-foreground text-background font-semibold rounded-lg hover:opacity-90"
                    >
                      + Выпустить сертификат
                    </button>
                  </form>
                </div>

                <div className="border border-border rounded-2xl bg-card overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-secondary/40 border-b border-border text-muted-foreground uppercase text-[10px] tracking-wider">
                        <tr>
                          <th className="p-4">Код сертификата</th>
                          <th className="p-4">Номинал</th>
                          <th className="p-4">Остаток баланса</th>
                          <th className="p-4">Срок действия</th>
                          <th className="p-4">Статус</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border font-mono">
                        {giftCardsList.map((gc) => (
                          <tr key={gc.id}>
                            <td className="p-4 font-bold whitespace-nowrap">{gc.code}</td>
                            <td className="p-4 whitespace-nowrap tabular-nums">
                              {formatPrice(gc.amount)}
                            </td>
                            <td className="p-4 whitespace-nowrap font-bold tabular-nums">
                              {formatPrice(gc.balance)}
                            </td>
                            <td className="p-4 whitespace-nowrap font-sans text-muted-foreground">
                              {gc.expiresAt || "Бессрочно"}
                            </td>
                            <td className="p-4 whitespace-nowrap font-sans">
                              <span
                                className={`px-2 py-0.5 text-[10px] rounded font-semibold ${
                                  gc.isActive && gc.balance > 0
                                    ? "bg-green-50 text-green-700"
                                    : "bg-muted text-muted-foreground"
                                }`}
                              >
                                {gc.isActive && gc.balance > 0 ? "Активен" : "Использован"}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 9: Content, Banners, Delivery & Contacts */}
          {currentTab === "content" && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight">
                    Управление сайтом: Главная, Доставка, Контакты
                  </h1>
                  <p className="text-xs text-muted-foreground">
                    Полное редактирование баннеров, верхней строки объявлений, условий доставки и контактов без кода
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleSaveHeroContent}
                  disabled={savingSite}
                  className="px-6 py-2.5 bg-foreground text-background text-xs rounded-full font-semibold hover:opacity-90 disabled:opacity-50"
                >
                  {savingSite ? "Сохранение..." : "Сохранить все настройки сайта"}
                </button>
              </div>

              {/* Announcement Bar Settings */}
              <div className="p-6 border border-border rounded-2xl bg-card space-y-4 text-xs">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm">Верхняя информационная полоса (Announcement Bar)</h3>
                  <label className="flex items-center gap-2 cursor-pointer font-semibold">
                    <input
                      type="checkbox"
                      checked={announcementEnabled}
                      onChange={(e) => setAnnouncementEnabled(e.target.checked)}
                      className="accent-foreground"
                    />
                    <span>Показывать полосу сверху сайта</span>
                  </label>
                </div>
                <div>
                  <label className="block font-semibold mb-1">Текст верхней полосы</label>
                  <input
                    type="text"
                    value={announcementText}
                    onChange={(e) => setAnnouncementText(e.target.value)}
                    className="w-full px-3.5 py-2 border border-border rounded-lg bg-background"
                  />
                </div>
              </div>

              {/* Hero Banner Settings */}
              <div className="p-6 border border-border rounded-2xl bg-card space-y-4 text-xs">
                <h3 className="font-bold text-sm">Главный экран (Hero-баннер)</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold mb-1">Надпись над заголовком (Badge)</label>
                    <input
                      type="text"
                      value={heroBadge}
                      onChange={(e) => setHeroBadge(e.target.value)}
                      className="w-full px-3.5 py-2 border border-border rounded-lg bg-background"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1">Фотография главного баннера</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={heroImage}
                        onChange={(e) => setHeroImage(e.target.value)}
                        placeholder="/products/1-1.jpg"
                        className="flex-1 px-3.5 py-2 border border-border rounded-lg bg-background"
                      />
                      <label className="px-3 py-2 border border-border rounded-lg bg-secondary hover:bg-secondary/80 cursor-pointer inline-flex items-center gap-1.5 font-medium whitespace-nowrap">
                        <Upload className="w-3.5 h-3.5" />
                        <span>Файл</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleHeroImageUpload}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block font-semibold mb-1">Главный заголовок Hero</label>
                  <input
                    type="text"
                    value={heroTitle}
                    onChange={(e) => setHeroTitle(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-border rounded-lg bg-background text-sm font-semibold"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Подзаголовок Hero</label>
                  <textarea
                    rows={2}
                    value={heroSubtitle}
                    onChange={(e) => setHeroSubtitle(e.target.value)}
                    className="w-full px-3.5 py-2 border border-border rounded-lg bg-background resize-none"
                  />
                </div>
              </div>

              {/* Delivery & Contacts Settings */}
              <div className="p-6 border border-border rounded-2xl bg-card space-y-4 text-xs">
                <h3 className="font-bold text-sm">Тарифы доставки и контакты бутика</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="block font-semibold mb-1">
                      Бесплатная доставка от суммы (в ₸)
                    </label>
                    <input
                      type="number"
                      value={freeDeliveryThreshold}
                      onChange={(e) => setFreeDeliveryThreshold(e.target.value)}
                      className="w-full px-3.5 py-2 border border-border rounded-lg bg-background font-bold"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1">
                      Стоимость курьерской доставки (в ₸)
                    </label>
                    <input
                      type="number"
                      value={courierDeliveryCost}
                      onChange={(e) => setCourierDeliveryCost(e.target.value)}
                      className="w-full px-3.5 py-2 border border-border rounded-lg bg-background"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1">Города присутствия</label>
                    <input
                      type="text"
                      value={brandCity}
                      onChange={(e) => setBrandCity(e.target.value)}
                      className="w-full px-3.5 py-2 border border-border rounded-lg bg-background"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1">Контактный телефон</label>
                    <input
                      type="text"
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                      className="w-full px-3.5 py-2 border border-border rounded-lg bg-background"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1">Ссылка на WhatsApp</label>
                    <input
                      type="text"
                      value={contactWhatsapp}
                      onChange={(e) => setContactWhatsapp(e.target.value)}
                      className="w-full px-3.5 py-2 border border-border rounded-lg bg-background"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1">Ссылка на Instagram</label>
                    <input
                      type="text"
                      value={contactInstagram}
                      onChange={(e) => setContactInstagram(e.target.value)}
                      className="w-full px-3.5 py-2 border border-border rounded-lg bg-background"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleSaveHeroContent}
                    disabled={savingSite}
                    className="px-6 py-2.5 bg-foreground text-background rounded-full font-semibold hover:opacity-90 disabled:opacity-50"
                  >
                    {savingSite ? "Сохранение..." : "Сохранить все настройки сайта"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 10: Notifications */}
          {currentTab === "notifications" && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Отправка уведомлений клиентам</h1>
                <p className="text-xs text-muted-foreground">
                  Мультиканальные рассылки (In-App, SMS, WhatsApp, Email) о дропах и клубных событиях
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                <form
                  onSubmit={handleSendBroadcast}
                  className="lg:col-span-6 p-6 border border-border rounded-2xl bg-card space-y-4 text-xs"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold mb-1">Тип уведомления</label>
                      <select
                        value={notifType}
                        onChange={(e) =>
                          setNotifType(
                            e.target.value as "NEW_DROP" | "CLUB_OFFER" | "PERSONAL_OFFER"
                          )
                        }
                        className="w-full px-3 py-2 border border-border rounded-lg bg-background"
                      >
                        <option value="NEW_DROP">Новый дроп коллекции</option>
                        <option value="CLUB_OFFER">Закрытое предложение CLUB</option>
                        <option value="PERSONAL_OFFER">Персональная акция</option>
                      </select>
                    </div>
                    <div>
                      <label className="block font-semibold mb-1">Аудитория</label>
                      <select
                        value={notifAudience}
                        onChange={(e) =>
                          setNotifAudience(e.target.value as "ALL" | "CLUB_ONLY")
                        }
                        className="w-full px-3 py-2 border border-border rounded-lg bg-background"
                      >
                        <option value="ALL">Все клиенты</option>
                        <option value="CLUB_ONLY">Только резиденты SABYR CLUB</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold mb-1">Тема сообщения</label>
                    <input
                      type="text"
                      required
                      value={notifTitle}
                      onChange={(e) => setNotifTitle(e.target.value)}
                      placeholder="Закрытый дроп коллекции @sabyr.wear уже доступен"
                      className="w-full px-3.5 py-2 border border-border rounded-lg bg-background"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1">Текст уведомления</label>
                    <textarea
                      rows={4}
                      required
                      value={notifBody}
                      onChange={(e) => setNotifBody(e.target.value)}
                      placeholder="Здравствуйте! Для членов SABYR CLUB открыт ранний доступ..."
                      className="w-full px-3.5 py-2 border border-border rounded-lg bg-background"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={notifSending}
                    className="px-6 py-2.5 bg-foreground text-background rounded-full font-semibold hover:opacity-90 disabled:opacity-50"
                  >
                    {notifSending ? "Отправка..." : "Отправить рассылку"}
                  </button>
                </form>

                <div className="lg:col-span-6 p-6 border border-border rounded-2xl bg-card space-y-4 text-xs">
                  <h3 className="font-bold text-sm">Журнал отправленных уведомлений</h3>
                  {notificationsLog.length === 0 ? (
                    <p className="text-muted-foreground py-6 text-center">
                      Уведомлений пока не отправлялось
                    </p>
                  ) : (
                    <div className="divide-y divide-border max-h-96 overflow-y-auto">
                      {notificationsLog.map((n) => (
                        <div key={n.id} className="py-3 space-y-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-semibold text-foreground">{n.title}</span>
                            <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                              {n.createdAt}
                            </span>
                          </div>
                          <p className="text-muted-foreground">{n.body}</p>
                          <span className="inline-block text-[10px] text-muted-foreground">
                            Получатель: {n.recipient} · Тип: {n.type}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
