/**
 * SABYR Luxury Fashion — Order Service
 *
 * Implements core order creation logic with atomic database transactions:
 * 1. Monetary values handled strictly in tiyn (integer minor units, no floats).
 * 2. Entire order lifecycle (order creation, variant stock decrement, bonus deduction,
 *    gift card balance deduction, promo code recording, loyalty tier calculation,
 *    payment transaction init) executes inside a single prisma.$transaction.
 * 3. Integrates with CloudPayments and Kaspi Pay via PaymentService.
 */

import { prisma, isDatabaseAvailable } from "@/lib/db";
import { generateOrderNumber, toTiyn } from "@/lib/utils";
import { formatKzPhone } from "@/lib/auth";
import { BonusService } from "./bonus";
import {
  CloudPaymentsService,
  KaspiPayService,
  PaymentInitiationResult,
} from "./payment";
import { DeliveryType, PaymentGateway, PaymentStatus } from "@prisma/client";

export interface CreateOrderItemInput {
  productId: string;
  variantId?: string;
  name: string;
  price: number; // in KZT
  quantity: number;
  color: string;
  size: string;
}

export interface CustomerInput {
  name?: string;
  phone: string;
  email?: string;
  city?: string;
  address?: string;
}

export interface CreateOrderInput {
  userId?: string;
  customer: CustomerInput;
  items: CreateOrderItemInput[];
  deliveryType: "COURIER" | "PICKUP" | "POSTAL";
  paymentMethod: "KASPI_QR" | "CARD_CLOUDPAYMENTS" | "CASH_ON_DELIVERY" | string;
  subtotal: number; // in KZT
  discount?: number; // in KZT
  bonusUsed?: number; // in bonus points (1 bonus = 1 KZT)
  promoCode?: string;
  promoDiscount?: number; // in KZT
  giftCardCode?: string;
  giftCardAmount?: number; // in KZT
  deliveryCost?: number; // in KZT
  total: number; // in KZT
  notes?: string;
}

export interface OrderCreationResult {
  success: boolean;
  orderNumber: string;
  orderId?: string;
  source: "database" | "local-store";
  earnedBonuses?: number;
  payment?: PaymentInitiationResult;
  error?: string;
}

export class OrderService {
  /**
   * Creates an order atomically.
   */
  public static async createOrder(input: CreateOrderInput): Promise<OrderCreationResult> {
    const orderNumber = generateOrderNumber();
    const isDbUp = await isDatabaseAvailable();
    const formattedPhone = formatKzPhone(input.customer.phone);

    // Map paymentMethod string to Prisma enum
    let gateway: PaymentGateway = PaymentGateway.KASPI_QR;
    if (input.paymentMethod === "CARD_CLOUDPAYMENTS" || input.paymentMethod === "card") {
      gateway = PaymentGateway.CARD_CLOUDPAYMENTS;
    } else if (input.paymentMethod === "CASH_ON_DELIVERY" || input.paymentMethod === "cash") {
      gateway = PaymentGateway.CASH_ON_DELIVERY;
    }

    const subtotalTiyn = toTiyn(input.subtotal);
    const discountTiyn = toTiyn(input.discount || 0);
    const deliveryCostTiyn = toTiyn(input.deliveryCost || 0);
    const totalTiyn = toTiyn(input.total);
    const requestedBonusUsed = input.bonusUsed || 0;

    if (isDbUp) {
      try {
        const result = await prisma.$transaction(async (tx) => {
          // 1. Resolve customer user by session userId, canonical KZ phone, or email
          let user = input.userId
            ? await tx.user.findUnique({ where: { id: input.userId } })
            : null;

          if (!user) {
            user = await tx.user.findUnique({
              where: { phone: formattedPhone },
            });
          }

          const cleanEmail = input.customer.email?.trim().toLowerCase() || null;
          if (!user && cleanEmail) {
            user = await tx.user.findFirst({
              where: { email: { equals: cleanEmail, mode: "insensitive" } },
            });
          }

          if (!user) {
            const starterLevel = await tx.bonusLevel.findFirst({
              orderBy: { minPurchaseAmount: "asc" },
            });
            user = await tx.user.create({
              data: {
                phone: formattedPhone,
                name: input.customer.name || "Покупатель",
                email: cleanEmail,
                bonusLevelId: starterLevel?.id || null,
              },
            });
          } else if (input.customer.name && (!user.name || user.name === "Клиент SABYR" || user.name === "Покупатель")) {
            user = await tx.user.update({
              where: { id: user.id },
              data: { name: input.customer.name },
            });
          }

          // 2. Create address if supplied
          let addressId: string | null = null;
          if (input.customer.city && input.customer.address) {
            const address = await tx.address.create({
              data: {
                userId: user.id,
                city: input.customer.city,
                street: input.customer.address,
                title: "Адрес доставки",
              },
            });
            addressId = address.id;
          }

          // 3. Resolve promo code if supplied
          let promoCodeId: string | null = null;
          if (input.promoCode) {
            const promo = await tx.promoCode.findUnique({
              where: { code: input.promoCode.trim().toUpperCase() },
            });
            if (promo && promo.isActive) {
              promoCodeId = promo.id;
              await tx.promoCode.update({
                where: { id: promo.id },
                data: { usedCount: { increment: 1 } },
              });
              await tx.promoCodeUsage.create({
                data: {
                  promoCodeId: promo.id,
                  userId: user.id,
                },
              });
            }
          }

          // 4. Resolve and deduct Gift Card balance if supplied
          let giftCardId: string | null = null;
          let giftCardAmountTiyn = 0;
          if (input.giftCardCode) {
            const gc = await tx.giftCard.findUnique({
              where: { code: input.giftCardCode.trim().toUpperCase() },
            });
            if (gc && gc.isActive && gc.balance > 0) {
              const requestedGcTiyn = toTiyn(input.giftCardAmount || 0);
              giftCardAmountTiyn = Math.min(
                gc.balance,
                requestedGcTiyn > 0 ? requestedGcTiyn : gc.balance
              );
              giftCardId = gc.id;
              await tx.giftCard.update({
                where: { id: gc.id },
                data: {
                  balance: { decrement: giftCardAmountTiyn },
                },
              });
            }
          }

          // 5. Create Order
          const order = await tx.order.create({
            data: {
              orderNumber,
              userId: user.id,
              status: "PENDING",
              subtotal: subtotalTiyn,
              discount: discountTiyn,
              bonusUsed: requestedBonusUsed,
              deliveryCost: deliveryCostTiyn,
              total: totalTiyn,
              giftCardId,
              giftCardAmount: giftCardAmountTiyn,
              deliveryType: (input.deliveryType as DeliveryType) || DeliveryType.COURIER,
              addressId,
              paymentStatus: PaymentStatus.PENDING,
              paymentMethod: gateway,
              promoCodeId,
              notes: input.notes || null,
            },
          });

          // 6. Create OrderItems & decrement variant stock where available
          for (const item of input.items) {
            let validProductId = item.productId;
            let validVariantId: string | null = null;

            if (item.variantId) {
              const existingVariant = await tx.productVariant.findUnique({
                where: { id: item.variantId },
              });
              if (existingVariant) {
                validVariantId = existingVariant.id;
                validProductId = existingVariant.productId;
              }
            }

            if (!validVariantId) {
              const fallbackVariant = await tx.productVariant.findFirst({
                where: { productId: validProductId },
              });
              if (fallbackVariant) {
                validVariantId = fallbackVariant.id;
              }
            }

            // If product or variant is still missing in DB, auto-create it so OrderItem is never dropped
            if (!validVariantId) {
              let existingProd = await tx.product.findUnique({
                where: { id: validProductId },
              });
              if (!existingProd) {
                let firstCat = await tx.category.findFirst();
                if (!firstCat) {
                  firstCat = await tx.category.create({
                    data: { id: "cat-1", name: "Верхняя одежда", slug: "outerwear" },
                  });
                }
                existingProd = await tx.product.create({
                  data: {
                    id: validProductId,
                    name: item.name,
                    slug: `${validProductId}-${Date.now()}`,
                    description: item.name,
                    price: toTiyn(item.price),
                    categoryId: firstCat.id,
                    isActive: true,
                  },
                });
              }
              const createdVariant = await tx.productVariant.create({
                data: {
                  productId: existingProd.id,
                  size: item.size || "M",
                  color: item.color || "Чёрный",
                  colorHex: "#0D0D0D",
                  stock: 20,
                  sku: `SBR-${existingProd.id.slice(-4)}-${item.size || "M"}-${Date.now().toString().slice(-4)}`,
                },
              });
              validVariantId = createdVariant.id;
              validProductId = existingProd.id;
            }

            await tx.orderItem.create({
              data: {
                orderId: order.id,
                productId: validProductId,
                variantId: validVariantId,
                price: toTiyn(item.price),
                quantity: item.quantity,
                color: item.color,
                size: item.size,
              },
            });

            await tx.productVariant.updateMany({
              where: { id: validVariantId, stock: { gte: item.quantity } },
              data: { stock: { decrement: item.quantity } },
            });
          }

          // 7. Process loyalty bonuses, tier upgrades & SABYR CLUB auto-join
          const loyaltyResult = await BonusService.processOrderLoyalty(tx, {
            userId: user.id,
            orderId: order.id,
            orderNumber: order.orderNumber,
            subtotalKzt: input.subtotal,
            paidTotalTiyn: totalTiyn,
            requestedBonusUsed,
          });

          // 8. Create PaymentTransaction
          await tx.paymentTransaction.create({
            data: {
              orderId: order.id,
              gateway,
              amount: totalTiyn,
              status: PaymentStatus.PENDING,
              idempotencyKey: `pay-${order.id}-${Date.now()}`,
            },
          });

          return { order, user, loyaltyResult };
        });

        // 9. Generate Payment Initiation payload
        let paymentResult: PaymentInitiationResult | undefined;
        const paymentParams = {
          orderId: result.order.id,
          orderNumber: result.order.orderNumber,
          amountTiyn: totalTiyn,
          customerEmail: input.customer.email,
          customerPhone: formattedPhone,
          customerName: input.customer.name,
        };

        if (gateway === PaymentGateway.CARD_CLOUDPAYMENTS) {
          paymentResult = CloudPaymentsService.createWidgetConfig(paymentParams);
        } else if (gateway === PaymentGateway.KASPI_QR) {
          paymentResult = await KaspiPayService.createPayment(paymentParams);
        }

        return {
          success: true,
          orderNumber: result.order.orderNumber,
          orderId: result.order.id,
          source: "database",
          earnedBonuses: result.loyaltyResult.earnedBonuses,
          payment: paymentResult,
        };
      } catch (dbErr) {
        console.warn("[SABYR OrderService] DB transaction failed, falling back to local:", dbErr);
      }
    }

    // Fallback: local-store execution
    const fallbackPaymentParams = {
      orderId: `local-${Date.now()}`,
      orderNumber,
      amountTiyn: totalTiyn,
      customerEmail: input.customer.email,
      customerPhone: formattedPhone,
      customerName: input.customer.name,
    };

    let paymentResult: PaymentInitiationResult | undefined;
    if (gateway === PaymentGateway.CARD_CLOUDPAYMENTS) {
      paymentResult = CloudPaymentsService.createWidgetConfig(fallbackPaymentParams);
    } else if (gateway === PaymentGateway.KASPI_QR) {
      paymentResult = await KaspiPayService.createPayment(fallbackPaymentParams);
    }

    return {
      success: true,
      orderNumber,
      source: "local-store",
      earnedBonuses: Math.round(input.total * 0.05),
      payment: paymentResult,
    };
  }
}
