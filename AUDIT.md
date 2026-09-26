# SABYR — Полный аудит кодовой базы

> Сгенерировано: 2026-09-19  
> Статус: **ЖДУ ПОДТВЕРЖДЕНИЯ** — никаких изменений кода до одобрения  
> Версия Next.js: 16.3.5 (Turbopack)

---

## 1. Дерево директорий `src/`

```
src/
├── app/
│   ├── (store)/
│   │   ├── about/page.tsx
│   │   ├── account/page.tsx          ← MOCK_USER, нет реального auth
│   │   ├── ai-stylist/page.tsx       ← Всё ещё импортирует PRODUCTS fallback
│   │   ├── ai-tryon/page.tsx         ← ProductItem из mockData (тип-импорт)
│   │   ├── care/page.tsx
│   │   ├── careers/page.tsx
│   │   ├── cart/page.tsx
│   │   ├── catalog/
│   │   │   ├── new/page.tsx          ← redirect
│   │   │   ├── sale/page.tsx         ← redirect
│   │   │   └── page.tsx              ← Всё ещё импортирует INITIAL_PRODUCTS
│   │   ├── checkout/page.tsx         ← MOCK_USER, hardcoded form values
│   │   ├── club/page.tsx             ← Динамическая загрузка ✓
│   │   ├── contacts/page.tsx
│   │   ├── delivery/page.tsx
│   │   ├── gift-cards/page.tsx
│   │   ├── privacy/page.tsx
│   │   ├── product/[slug]/page.tsx   ← Всё ещё INITIAL_PRODUCTS для SSR
│   │   ├── returns/page.tsx
│   │   ├── size-guide/page.tsx
│   │   └── terms/page.tsx
│   ├── admin/page.tsx                ← КРИТИЧНО: нет серверной проверки прав
│   ├── api/
│   │   ├── ai/stylist/route.ts       ← Gemini @google/genai ✓, нет rate limiting
│   │   ├── ai/tryon/route.ts         ← Gemini @google/genai ✓, нет rate limiting
│   │   ├── orders/route.ts           ← нет auth, нет Zod
│   │   ├── products/route.ts         ← нет admin auth, нет Zod
│   │   └── waitlist/route.ts
│   ├── globals.css                   ← @theme блок ✓ (Tailwind v4 корректно)
│   ├── layout.tsx                    ← dangerouslySetInnerHTML (FOUC script, приемлемо)
│   └── page.tsx                      ← Unsplash hardcode, нет CMS
├── components/
│   ├── common/ThemeToggle.tsx
│   └── layout/
│       ├── Header.tsx
│       └── Footer.tsx
├── data/
│   ├── mockData.ts                   ← Содержит PRODUCTS, MOCK_USER — частично используется
│   └── products.json                 ← Локальное хранилище (Unsplash URLs)
├── lib/
│   ├── auth.ts                       ← КРИТИЧНО: полностью мок, нет реального auth
│   ├── db.ts                         ← PrismaPg ✓
│   ├── productsStore.ts              ← getLiveCatalogProducts ✓
│   └── utils.ts                      ← toTiyn/toKzt ✓
└── store/
    ├── cart.ts                       ← Zustand persist ✓
    └── favorites.ts
```

---

## 2. Анализ `package.json`

| Пакет | Версия | Статус |
|-------|--------|--------|
| `next` | 16.3.5 | ✅ Актуальная |
| `react` / `react-dom` | 19.2.8 | ✅ |
| `@google/genai` | ^2.23.0 | ✅ Новый SDK |
| `@prisma/client` | ^7.10.0 | ✅ Стабильная |
| `prisma` (dev) | ^7.10.0 | ✅ Совпадает — RC-конфликт устранён |
| `tailwindcss` | ^4 | ✅ v4 |
| `@tailwindcss/postcss` | ^4 | ✅ |
| `framer-motion` | ^13.4.0 | ⚠️ v13 — требует проверки (v12+ переехал в `motion`) |
| `zustand` | ^5.0.15 | ✅ |
| `lucide-react` | ^1.47.0 | ✅ |
| **ОТСУТСТВУЮТ** | | |
| `next-auth` | — | ❌ Не установлен (auth самописный-мок) |
| `bcrypt` / `bcryptjs` | — | ❌ Нет хэширования паролей |
| `zod` | — | ❌ Нет валидации входных данных |
| `resend` | — | ❌ Нет email-сервиса |
| `@upstash/ratelimit` | — | ❌ Нет rate limiting |
| `cloudinary` / upload SDK | — | ❌ Нет загрузки файлов |
| `stripe` / cloudpayments SDK | — | ❌ Нет платёжного SDK |

---

## 3. Конфигурация Tailwind v4

**Статус: ✅ Правильно настроен**

- `tailwind.config.ts` — **НЕ существует** в проекте. Для v4 это правильно — нет конфликта с устаревшим конфигом.
- `globals.css` корректно использует `@import "tailwindcss"` и `@theme {}` (строки 72–100).
- `@custom-variant dark (&:is(.dark *))` — правильная запись для v4 (строка 3).

**Мелкие недостатки:**
- `--color-sabyr-black`, `--color-sabyr-gold`, `--color-sabyr-sand` определены в `@theme`, но нигде не используются — везде хардкоды `#0A0A0A`, `#C9A84C`.
- Нет `@media (prefers-reduced-motion: reduce)` — анимации framer-motion не отключаются.

---

## 4. Анализ Prisma-схемы

| Модель | Статус |
|--------|--------|
| `User`, `Product`, `ProductImage`, `ProductVariant`, `Category` | ✅ есть |
| `Order`, `OrderItem`, `Address` | ✅ есть |
| `TryOnSession`, `OtpVerification`, `PaymentTransaction`, `RestockNotification`, `SizeGuide` | ✅ добавлены |
| `BonusTransaction`, `GiftCard`, `PromoCode`, `ClubMembership` | ❓ требует проверки |

**Prisma RC-конфликт устранён:** `prisma@7.10.0` = `@prisma/client@7.10.0`.

---

## 5. Что работает vs. заглушки

### ✅ РАБОТАЕТ
- Сборка (`npm run build`) — 29/29 маршрутов без ошибок
- TypeScript strict mode + ESLint — 0 ошибок
- Тёмная тема (localStorage + класс `.dark`)
- Корзина (Zustand persist в localStorage)
- Каталог — динамическая загрузка с API `/api/products`
- AI Stylist — реальный вызов Gemini (только продукты из каталога)
- AI Try-On — реальный вызов Gemini multimodal, fallback при отсутствии ключа
- Admin Products CRUD — POST/DELETE реально работает через API + local store
- Все footer-страницы (about, delivery, returns, care, careers, privacy, terms, contacts, size-guide)

### ❌ ЗАГЛУШКИ / НЕ РЕАЛИЗОВАНО

| Функция | Описание проблемы |
|---------|-------------------|
| **Аутентификация** | `auth.ts` — 100% мок. `getSession()` всегда возвращает хардкоженого "Айгерим". Нет OTP-SMS, нет bcrypt, нет реальных JWT, нет httpOnly cookie |
| **Аккаунт пользователя** | `account/page.tsx` использует `MOCK_USER` напрямую — не подключён к БД |
| **Оформление заказа** | `checkout/page.tsx` — форма предзаполнена данными `MOCK_USER`, `bonusBalance` хардкожен |
| **Платежи** | Нет Kaspi API, нет CloudPayments — заказ создаётся без реальной оплаты |
| **Email/SMS уведомления** | Нет Resend, нет SMS-провайдера — кнопка "Отправить" в admin фиктивная |
| **Загрузка изображений** | Нет Cloudinary / S3. Товары создаются с Unsplash fallback-фото |
| **AI Try-On (изображение)** | Только текстовый анализ посадки. Gemini 2.5 Flash не генерирует изображения. Реальный try-on требует Vertex AI |
| **Admin авторизация** | `/admin` — `"use client"` без middleware, без серверной проверки роли |
| **Промокоды** | Admin создаёт промокоды только в `useState` браузера — не в БД, не валидируются при checkout |
| **Заказы в Admin** | Захардкожены в компоненте, не из БД |
| **Бонусная программа** | Логика расчёта на клиенте из мок-данных — нет серверной проверки |
| **SABYR CLUB членство** | Нет оформления, нет оплаты членского взноса |
| **Gift Cards** | UI без бэкенда |
| **Rate limiting** | Ни один API endpoint не защищён от abuse |
| **Zod валидация** | Нет ни в одном route handler |
| **API версионирование** | `/api/*` вместо `/api/v1/*` |

---

## 6. Хардкоженные данные вместо БД

### Импорты из `mockData.ts`

| Файл | Что импортирует | Критичность |
|------|-----------------|-------------|
| `src/app/admin/page.tsx` L21 | `PRODUCTS, ProductItem` | 🔴 Высокая — начальный state из мока |
| `src/app/(store)/account/page.tsx` L17 | `MOCK_USER` | 🔴 Высокая — все данные пользователя фиктивны |
| `src/app/(store)/checkout/page.tsx` L10 | `MOCK_USER` | 🔴 Высокая — bonusBalance, предзаполненная форма |
| `src/app/(store)/ai-stylist/page.tsx` L25 | `PRODUCTS, ProductItem` | 🟡 Средняя — initial state (перезаписывается API) |
| `src/app/(store)/catalog/page.tsx` L11 | `ProductItem, INITIAL_PRODUCTS` | 🟡 Средняя — SSR initial state |
| `src/app/(store)/product/[slug]/page.tsx` L29 | `ProductItem, INITIAL_PRODUCTS` | 🟡 Средняя — findProduct из мока для SSR |
| `src/app/api/products/route.ts` L3 | `ProductItem` | 🟢 Низкая — только тип |
| `src/app/(store)/ai-tryon/page.tsx` L18 | `ProductItem` | 🟢 Низкая — только тип |
| `src/app/(store)/club/page.tsx` L7 | `ProductItem` | 🟢 Низкая — только тип |
| `src/lib/productsStore.ts` L3 | `ProductItem` | 🟢 Низкая — только тип |

### Unsplash изображения
`images.unsplash.com` присутствует в `next.config.ts`, `mockData.ts`, `products.json`, `page.tsx` (22+ ссылки), `api/products/route.ts` (fallback). Нужно заменить реальным CDN.

---

## 7. Качество кода

| Проверка | Результат |
|----------|-----------|
| TypeScript `: any` | ✅ 0 найдено |
| `@ts-ignore` / `eslint-disable` | ✅ 0 найдено |
| `$queryRawUnsafe` | ✅ 0 найдено |
| `dangerouslySetInnerHTML` | `layout.tsx` L70 — FOUC script (приемлемо, без пользовательских данных) |
| `bcrypt` | ❌ 0 найдено — нет хэширования паролей |
| Реальные JWT | ❌ 0 найдено — токен = base64(email/phone) |

---

## 8. КРИТИЧЕСКИЕ ПРОБЛЕМЫ БЕЗОПАСНОСТИ

### 🔴 КРИТИЧНО

#### 1. Аутентификация — полный мок
```typescript
// src/lib/auth.ts
export async function getSession() {
  // ВСЕГДА возвращает одного пользователя — реального auth нет
  return { user: { id: "usr-01", name: "Айгерим Касымова", role: "CUSTOMER" } };
}

export async function loginWithPhone(phone: string, code: string) {
  if (code === "1234" || code.length === 4) { // ← любые 4 цифры = вход
    return { success: true, token: "sabyr_jwt_token_" + Buffer.from(phone).toString("base64") };
    // ← base64 не является JWT. Нет подписи, нет expiry.
  }
}
```

#### 2. Admin Panel без защиты
```typescript
// src/app/admin/page.tsx
"use client"; // ← /admin открыт для всех без проверки роли
```

#### 3. API endpoints без авторизации
- `POST /api/products` — **любой** может добавить/удалить товар
- `POST /api/ai/stylist` — **любой** может вызывать Gemini за счёт владельца
- `POST /api/ai/tryon` — **любой** может загружать base64-фото без лимита размера

#### 4. Нет Zod-валидации
```typescript
// src/app/api/products/route.ts
const { name, category, price, ... } = body; // ← без валидации типов
```

#### 5. Несогласованность цен (tiyn)
`cart.ts` и `checkout/page.tsx` хранят цены в KZT.  
`api/orders/route.ts` вызывает `toTiyn(total)` → умножает на 100.  
Это работает корректно, **но** нужен audit что конвертация происходит ровно один раз и нигде не дублируется.

### 🟡 СРЕДНЕЙ КРИТИЧНОСТИ

#### 6. Промокоды не персистируются
Admin создаёт промокоды только в `useState` — при перезагрузке страницы всё теряется.

#### 7. Бонусы не защищены серверно
Скидка по бонусам вычисляется на клиенте из `MOCK_USER.bonusBalance` — легко подделать.

---

## 9. Архитектурные проблемы

| Проблема | Описание |
|----------|----------|
| Нет `src/lib/services/*` | Бизнес-логика в route handlers и компонентах |
| Нет `/api/v1/` | Нельзя версионировать для мобильного приложения |
| Нет единой транзакции | Создание заказа не атомарно (user → address → order → items — разные запросы) |
| `mockData.ts` — God File | Содержит типы + данные + MOCK_USER вместе — нужно разделить |

---

## 10. Необходимые внешние сервисы

| Сервис | Назначение | Env var | SDK |
|--------|-----------|---------|-----|
| **Google Gemini** | AI Stylist + Try-On | `GEMINI_API_KEY`, `GEMINI_MODEL` | ✅ `@google/genai` |
| **PostgreSQL / Neon** | БД | `DATABASE_URL` | ✅ `pg`, `@prisma/adapter-pg` |
| **Cloudinary или S3** | Фото товаров, Try-On фото | `CLOUDINARY_URL` | ❌ нет |
| **SMS KZ (SMSC/Mobizon)** | OTP авторизация | `SMS_API_KEY` | ❌ нет |
| **Resend** | Email уведомления | `RESEND_API_KEY` | ❌ нет |
| **Kaspi Pay API** | Kaspi QR оплата | `KASPI_MERCHANT_ID` | ❌ нет |
| **CloudPayments** | Карточная оплата | `CP_PUBLIC_ID`, `CP_API_SECRET` | ❌ нет |
| **Upstash Redis** | Rate limiting | `UPSTASH_REDIS_REST_URL` | ❌ нет |
| **Vertex AI** | Реальная генерация try-on изображений | `GOOGLE_CLOUD_PROJECT` | ❌ нет |

---

## 11. Сводная таблица приоритетов

| # | Проблема | Критичность | Этап |
|---|----------|-------------|------|
| 1 | Реальный auth (OTP + httpOnly cookie) | 🔴 | Phase 1 |
| 2 | Admin роль — серверная проверка | 🔴 | Phase 1 |
| 3 | Zod — валидация всех API | 🔴 | Phase 1 |
| 4 | Rate limiting AI endpoints | 🔴 | Phase 1 |
| 5 | Убрать MOCK_USER из account + checkout | 🔴 | Phase 3 |
| 6 | Tiyn consistency audit | 🔴 | Phase 1 |
| 7 | framer-motion v13 — проверить импорты | 🟡 | Phase 1 |
| 8 | Промокоды → в БД | 🟡 | Phase 3 |
| 9 | API versioning `/api/v1/` | 🟡 | Phase 6 |
| 10 | `src/lib/services/*` вынести логику | 🟡 | Phase 6 |
| 11 | `next/image` — `priority` + `sizes` везде | 🟡 | Phase 2 |
| 12 | `prefers-reduced-motion` | 🟢 | Phase 2 |
| 13 | Заменить Unsplash на реальный CDN | 🟢 | Phase 3 |
| 14 | Использовать `sabyr-*` CSS-токены | 🟢 | Phase 2 |

---

## Следующий шаг

**Жду вашего подтверждения.** После одобрения перехожу к **Phase 1 (Config & Security)** — каждый пункт отдельным коммитом.
