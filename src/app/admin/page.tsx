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

export default function AdminPage() {
  const [currentTab, setCurrentTab] = useState<AdminTab>("products");
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
  const [newProductCategory, setNewProductCategory] = useState("Пиджаки и жакеты");
  const [newProductPrice, setNewProductPrice] = useState(50000);
  const [newProductComparePrice, setNewProductComparePrice] = useState<string>("");
  const [newProductImageUrl, setNewProductImageUrl] = useState("");
  const [newProductDescription, setNewProductDescription] = useState("");
  const [newProductComposition, setNewProductComposition] = useState("");
  const [newProductColor, setNewProductColor] = useState("Чёрный");
  const [newProductStock, setNewProductStock] = useState(5);
  const [newProductClubOnly, setNewProductClubOnly] = useState(false);
  const [newProductIsNew, setNewProductIsNew] = useState(true);

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
  const [bonusLevels] = useState([
    { level: "Level 1 — Starter", minSpend: 0, percent: 3, activeUsers: 0 },
    { level: "Level 2 — Silver", minSpend: 150000, percent: 5, activeUsers: 0 },
    { level: "Level 3 — Gold", minSpend: 300000, percent: 7, activeUsers: 0 },
    { level: "Level 4 — Platinum VIP", minSpend: 600000, percent: 10, activeUsers: 0 },
  ]);

  // Club & Hero content settings
  const [clubAnnualPrice, setClubAnnualPrice] = useState("190 000 ₸");
  const [clubWelcomeDeposit, setClubWelcomeDeposit] = useState("25 000 ₸");
  const [heroTitle, setHeroTitle] = useState("Новая коллекция Осень-Зима");
  const [heroSubtitle, setHeroSubtitle] = useState(
    "Минимализм, который говорит. Качество, которое чувствуется."
  );

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
          if (data.site?.hero_title) setHeroTitle(data.site.hero_title);
          if (data.site?.hero_subtitle) setHeroSubtitle(data.site.hero_subtitle);
          if (data.club?.annual_price) setClubAnnualPrice(data.club.annual_price);
          if (data.club?.welcome_deposit) setClubWelcomeDeposit(data.club.welcome_deposit);
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

  const openAddProductModal = () => {
    setEditingProductId(null);
    setNewProductName("");
    setNewProductCategory("Пиджаки и жакеты");
    setNewProductPrice(50000);
    setNewProductComparePrice("");
    setNewProductImageUrl("/example-product.svg");
    setNewProductDescription("");
    setNewProductComposition("100% натуральные ткани премиального качества.");
    setNewProductColor("Чёрный");
    setNewProductStock(5);
    setNewProductClubOnly(false);
    setNewProductIsNew(true);
    setIsAddModalOpen(true);
  };

  const openEditProductModal = (product: ProductItem) => {
    setEditingProductId(product.id);
    setNewProductName(product.name);
    setNewProductCategory(product.category);
    setNewProductPrice(product.price);
    setNewProductComparePrice(product.comparePrice ? String(product.comparePrice) : "");
    setNewProductImageUrl(product.images?.[0] || "/example-product.svg");
    setNewProductDescription(product.description || "");
    setNewProductComposition(product.composition || "");
    setNewProductColor(product.variants?.[0]?.color || "Чёрный");
    setNewProductStock(product.variants?.[0]?.stock ?? 5);
    setNewProductClubOnly(Boolean(product.isClubOnly));
    setNewProductIsNew(product.isNew ?? true);
    setIsAddModalOpen(true);
  };

  const handleImageFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setNewProductImageUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
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

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const compareVal =
      newProductComparePrice.trim() && Number(newProductComparePrice) > Number(newProductPrice)
        ? Number(newProductComparePrice)
        : null;
    const imgList = [newProductImageUrl.trim() || "/example-product.svg"];
    const variantsList = ["XS", "S", "M", "L"].map((size, idx) => ({
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
            images: imgList,
            variants: variantsList,
            isClubOnly: newProductClubOnly,
            isNew: newProductIsNew,
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
            images: imgList,
            variants: variantsList,
            isClubOnly: newProductClubOnly,
            isNew: newProductIsNew,
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
    payload: { bonusDelta?: number; toggleClub?: boolean; toggleBlock?: boolean }
  ) => {
    try {
      const res = await fetch("/api/admin/customers", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, ...payload }),
      });
      if (res.ok) {
        loadCustomers();
        showToast(
          payload.toggleBlock
            ? "Статус блокировки клиента изменён"
            : "Профиль клиента обновлён"
        );
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
    await fetch("/api/admin/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        scope: "club",
        entries: {
          annual_price: clubAnnualPrice,
          welcome_deposit: clubWelcomeDeposit,
        },
      }),
    });
    showToast("Условия SABYR CLUB сохранены в БД");
  };

  const handleSaveHeroContent = async () => {
    await fetch("/api/admin/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        scope: "site",
        entries: {
          hero_title: heroTitle,
          hero_subtitle: heroSubtitle,
        },
      }),
    });
    showToast("Контент главной страницы сохранён в БД");
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

  return (
    <div className="min-h-screen bg-secondary/30 flex flex-col">
      {/* Top Admin Bar */}
      <header className="bg-background border-b border-border sticky top-0 z-sticky">
        <div className="px-4 sm:px-6 h-16 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-4 min-w-0">
            <Link href="/" className="text-foreground hover:opacity-85 transition-opacity inline-flex items-center" aria-label="SABYR">
              <SabyrLogo className="h-3.5 sm:h-4 w-auto" />
            </Link>
            <span className="px-2.5 py-0.5 rounded-md bg-foreground text-background text-[11px] font-semibold uppercase tracking-wider whitespace-nowrap">
              Admin Panel
            </span>
          </div>

          <div className="flex items-center gap-3 flex-shrink-0">
            <Link
              href="/"
              target="_blank"
              className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 whitespace-nowrap"
            >
              <span className="hidden sm:inline">Сайт для клиентов</span> <ExternalLink className="w-3.5 h-3.5 flex-shrink-0" />
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
            { id: "analytics", label: "Аналитика и продажи", icon: BarChart3 },
            { id: "products", label: "Товары и остатки", icon: Package },
            { id: "categories", label: "Категории одежды", icon: Folder },
            { id: "orders", label: "Заказы клиентов", icon: ShoppingBag },
            { id: "customers", label: "База клиентов", icon: Users },
            { id: "bonuses", label: "Бонусы и уровни", icon: Sparkles },
            { id: "club", label: "SABYR CLUB", icon: Crown },
            { id: "promos", label: "Промокоды и карты", icon: Tag },
            { id: "content", label: "Баннеры и Главная", icon: LayoutTemplate },
            { id: "notifications", label: "Уведомления", icon: Bell },
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
          {/* TAB 1: Analytics */}
          {currentTab === "analytics" && (
            <div className="space-y-8">
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Аналитика и показатели SABYR</h1>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Данные из базы — заказы, клиенты, товары
                </p>
              </div>

              {/* KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-5 border border-border rounded-2xl bg-card">
                  <span className="text-xs text-muted-foreground">Всего заказов</span>
                  <div className="text-2xl font-extrabold mt-1 tabular-nums">{ordersList.length}</div>
                  <span className="text-[11px] text-muted-foreground">Загружено из БД</span>
                </div>

                <div className="p-5 border border-border rounded-2xl bg-card">
                  <span className="text-xs text-muted-foreground">Клиентов в базе</span>
                  <div className="text-2xl font-extrabold mt-1 tabular-nums">{customersList.length}</div>
                  <span className="text-[11px] text-muted-foreground">Без администраторов</span>
                </div>

                <div className="p-5 border border-border rounded-2xl bg-card">
                  <span className="text-xs text-muted-foreground">Товаров в каталоге</span>
                  <div className="text-2xl font-extrabold mt-1 tabular-nums">{productsList.length}</div>
                  <span className="text-[11px] text-muted-foreground">Активных позиций</span>
                </div>

                <div className="p-5 border border-border rounded-2xl bg-card">
                  <span className="text-xs text-muted-foreground">Категорий одежды</span>
                  <div className="text-2xl font-extrabold mt-1 tabular-nums">{categoriesList.length}</div>
                  <span className="text-[11px] text-muted-foreground">Управляйте в разделе</span>
                </div>
              </div>

              {/* Products list in analytics */}
              {productsList.length > 0 && (
                <div className="border border-border rounded-2xl p-6 bg-card space-y-4">
                  <h3 className="font-bold text-sm">Товары каталога</h3>
                  <div className="divide-y divide-border text-xs">
                    {productsList.slice(0, 5).map((p) => (
                      <div key={p.id} className="py-3 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className="relative w-10 h-12 rounded bg-secondary overflow-hidden flex-shrink-0">
                            <Image src={p.images[0]} alt={p.name} fill className="object-cover" unoptimized />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold truncate">{p.name}</p>
                            <span className="text-muted-foreground block truncate">{p.category}</span>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <span className="font-bold tabular-nums whitespace-nowrap">{formatPrice(p.price)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {productsList.length === 0 && ordersList.length === 0 && (
                <div className="border border-border rounded-2xl p-10 bg-card text-center text-sm text-muted-foreground">
                  Данные загружаются из базы данных. Добавьте первый товар или заказ, чтобы увидеть статистику.
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
                    Добавляйте одежду, меняйте цены, назначайте скидки, загружайте фото и управляйте остатками ({productsList.length} шт.)
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
                        <th className="p-4">Остатки</th>
                        <th className="p-4">Доступ</th>
                        <th className="p-4 text-right">Действия</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {filteredProducts.map((p) => {
                        const totalStock = p.variants.reduce((acc, v) => acc + v.stock, 0);
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
                                    src={p.images[0] || "/example-product.svg"}
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
                                  <span className="text-[10px] text-muted-foreground break-all">
                                    ID: {p.id}
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
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-semibold tabular-nums ${
                                  totalStock > 5
                                    ? "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-400"
                                    : "bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400"
                                }`}
                              >
                                {totalStock} шт.
                              </span>
                            </td>
                            <td className="p-4 whitespace-nowrap">
                              {p.isClubOnly ? (
                                <span className="px-2 py-0.5 rounded bg-black text-[hsl(var(--accent))] text-[10px] font-bold">
                                  CLUB ONLY
                                </span>
                              ) : (
                                <span className="text-muted-foreground">Общий каталог</span>
                              )}
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
                  <div className="bg-card border border-border rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-2xl my-8">
                    <div className="flex items-center justify-between border-b border-border pb-3">
                      <h3 className="font-bold text-lg">
                        {editingProductId
                          ? "Редактировать одежду / цену / скидку"
                          : "Добавить новую одежду в каталог"}
                      </h3>
                      <button
                        type="button"
                        onClick={() => setIsAddModalOpen(false)}
                        className="text-xs text-muted-foreground hover:text-foreground"
                      >
                        Закрыть ✕
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
                            placeholder="Например: Пример или Шерстяной жакет"
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
                                <option key={cat.id} value={cat.name}>{cat.name}</option>
                              ))
                            ) : (
                              <>
                                <option>Пиджаки и жакеты</option>
                                <option>Брюки и палаццо</option>
                                <option>Рубашки и блузы</option>
                                <option>Пальто и тренчи</option>
                                <option>Платья</option>
                                <option>Трикотаж</option>
                                <option>Аксессуары</option>
                              </>
                            )}
                          </select>
                        </div>
                      </div>

                      {/* Price & Discount Block */}
                      <div className="p-3.5 rounded-xl bg-secondary/40 border border-border space-y-3">
                        <div className="flex items-center justify-between">
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
                              placeholder="Например: 65000 (зачёркнутая цена)"
                              className="w-full px-3.5 py-2 border border-border rounded-lg bg-background"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Image URL or File Upload */}
                      <div className="space-y-2">
                        <label className="block font-semibold">Фотография одежды (ссылка или файл)</label>
                        <div className="flex flex-col sm:flex-row gap-2">
                          <input
                            type="text"
                            value={newProductImageUrl}
                            onChange={(e) => setNewProductImageUrl(e.target.value)}
                            placeholder="https://... или /example-product.svg"
                            className="flex-1 px-3.5 py-2 border border-border rounded-lg bg-background"
                          />
                          <label className="px-3.5 py-2 border border-border rounded-lg bg-secondary hover:bg-secondary/80 cursor-pointer inline-flex items-center justify-center gap-1.5 font-medium whitespace-nowrap">
                            <Upload className="w-3.5 h-3.5" />
                            <span>Загрузить с устройства</span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleImageFileUpload}
                              className="hidden"
                            />
                          </label>
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
                            placeholder="Например: 90% шерсть, 10% кашемир"
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
                            placeholder="Чёрный / Бежевый / Молочный"
                            className="w-full px-3.5 py-2 border border-border rounded-lg bg-background"
                          />
                        </div>
                        <div>
                          <label className="block font-semibold mb-1">
                            Остаток на каждый размер (XS, S, M, L)
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
                    placeholder="Название категории, напр. «Брюки»"
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
                    Категории загружаются... Если список пуст, нажмите &laquo;Добавить&raquo; выше.
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

          {/* TAB 3: Orders */}
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
                            <span className="text-[11px] text-muted-foreground whitespace-nowrap">{ord.phone}</span>
                          </td>
                          <td className="p-4 font-bold whitespace-nowrap tabular-nums">{formatPrice(ord.total)}</td>
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

          {/* TAB 4: Customers */}
          {currentTab === "customers" && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-bold tracking-tight">База клиентов SABYR</h1>
                <p className="text-xs text-muted-foreground">
                  Профили покупателей, бонусные балансы, SABYR CLUB и блокировка доступа
                </p>
              </div>

              <div className="border border-border rounded-2xl bg-card overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-secondary/40 border-b border-border text-muted-foreground uppercase text-[10px] tracking-wider">
                      <tr>
                        <th className="p-4">Клиент</th>
                        <th className="p-4">Статус</th>
                        <th className="p-4">Уровень</th>
                        <th className="p-4">Бонусы</th>
                        <th className="p-4">Покупки</th>
                        <th className="p-4">SABYR CLUB</th>
                        <th className="p-4 text-right">Управление</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {customersList.map((c) => (
                        <tr key={c.id} className="hover:bg-secondary/20">
                          <td className="p-4 min-w-[180px]">
                            <p className="font-semibold">{c.name}</p>
                            <span className="text-[11px] text-muted-foreground block">{c.phone}</span>
                          </td>
                          <td className="p-4 whitespace-nowrap">
                            {c.isBlocked ? (
                              <span className="px-2.5 py-0.5 rounded-full bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400 text-[10px] font-bold">
                                Заблокирован
                              </span>
                            ) : (
                              <span className="px-2.5 py-0.5 rounded-full bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-400 text-[10px] font-bold">
                                Активен
                              </span>
                            )}
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
                            <div className="inline-flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() =>
                                  handleCustomerAction(c.id, { bonusDelta: 5000 })
                                }
                                className="px-2.5 py-1 rounded-lg border border-border hover:bg-secondary text-[11px] font-medium"
                              >
                                +5 000 Б
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  handleCustomerAction(c.id, { toggleClub: true })
                                }
                                className="px-2.5 py-1 rounded-lg border border-border hover:bg-secondary text-[11px] font-medium"
                              >
                                {c.club ? "Откл. Club" : "Вкл. Club"}
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  handleCustomerAction(c.id, { toggleBlock: true })
                                }
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

          {/* TAB 5: Bonuses */}
          {currentTab === "bonuses" && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Настройки Бонусной Программы</h1>
                <p className="text-xs text-muted-foreground">
                  Управление уровнями лояльности и процентами начисления (1 бонус = 1 ₸, оплата до 30% заказа)
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {bonusLevels.map((bl, i) => (
                  <div key={i} className="p-6 border border-border rounded-2xl bg-card space-y-3">
                    <div className="flex justify-between items-center gap-2">
                      <h3 className="font-bold text-sm">{bl.level}</h3>
                      <span className="px-3 py-1 bg-secondary rounded-full font-bold text-xs text-[hsl(var(--accent))] flex-shrink-0 tabular-nums">
                        {bl.percent}% кешбэк
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground space-y-1">
                      <p className="tabular-nums">Порог покупок: от {formatPrice(bl.minSpend)}</p>
                      <p className="tabular-nums">Активных клиентов: {bl.activeUsers} чел.</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 6: SABYR CLUB Admin */}
          {currentTab === "club" && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Управление SABYR CLUB</h1>
                <p className="text-xs text-muted-foreground">
                  Настройка клубных условий и доступ к закрытым мероприятиям
                </p>
              </div>

              <div className="p-6 border border-border rounded-2xl bg-card space-y-4">
                <h3 className="font-bold text-sm">Параметры членства</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block font-medium mb-1">Стоимость годового членства</label>
                    <input
                      type="text"
                      value={clubAnnualPrice}
                      onChange={(e) => setClubAnnualPrice(e.target.value)}
                      className="w-full px-3.5 py-2 border border-border rounded-lg bg-background"
                    />
                  </div>
                  <div>
                    <label className="block font-medium mb-1">Приветственный депозит сертификата</label>
                    <input
                      type="text"
                      value={clubWelcomeDeposit}
                      onChange={(e) => setClubWelcomeDeposit(e.target.value)}
                      className="w-full px-3.5 py-2 border border-border rounded-lg bg-background"
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleSaveClubSettings}
                  className="px-5 py-2 bg-foreground text-background text-xs font-semibold rounded-full hover:opacity-90"
                >
                  Обновить условия клуба
                </button>
              </div>
            </div>
          )}

          {/* TAB 7: Promos & Gift Cards */}
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
                    placeholder="SUMMER20"
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
                            <td className="p-4 whitespace-nowrap tabular-nums">{formatPrice(gc.amount)}</td>
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

          {/* TAB 8: Content & Banners */}
          {currentTab === "content" && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Контент главной страницы</h1>
                <p className="text-xs text-muted-foreground">
                  Редактирование главного баннера и текстов без кода
                </p>
              </div>

              <div className="p-6 border border-border rounded-2xl bg-card space-y-4 text-xs">
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
                  <label className="block font-semibold mb-1">Подзаголовок</label>
                  <input
                    type="text"
                    value={heroSubtitle}
                    onChange={(e) => setHeroSubtitle(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-border rounded-lg bg-background"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleSaveHeroContent}
                  className="px-6 py-2.5 bg-foreground text-background rounded-full font-semibold hover:opacity-90"
                >
                  Сохранить изменения на главной
                </button>
              </div>
            </div>
          )}

          {/* TAB 9: Notifications */}
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
                      placeholder="Эксклюзивный дроп пальто из кашемира уже на сайте"
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
