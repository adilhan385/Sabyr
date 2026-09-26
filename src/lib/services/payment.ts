/**
 * SABYR Luxury Fashion — Payment Services
 *
 * Provides integrations with Kazakhstan payment gateways:
 * 1. CloudPayments KZ (Visa, Mastercard online payments)
 * 2. Kaspi Pay / Kaspi QR (Instant mobile payments via Kaspi.kz)
 *
 * Monetary rule: all internal operations in tiyn (integer).
 * Conversion to tenge (KZT) happens only when formatting for external gateways that require decimal tenge.
 */

import crypto from "crypto";

export type SupportedGateway = "KASPI_QR" | "CARD_CLOUDPAYMENTS" | "CASH_ON_DELIVERY";

export interface InitiatePaymentParams {
  orderId: string;
  orderNumber: string;
  amountTiyn: number; // in tiyn (e.g. 5000000 = 50 000 KZT)
  customerEmail?: string | null;
  customerPhone: string;
  customerName?: string | null;
  description?: string;
}

export interface CloudPaymentsWidgetConfig {
  publicId: string;
  description: string;
  amount: number; // in KZT (decimal/float as required by CloudPayments widget)
  currency: "KZT";
  accountId: string;
  invoiceId: string;
  email?: string;
  data: Record<string, unknown>;
}

export interface PaymentInitiationResult {
  gateway: SupportedGateway;
  requiresRedirect: boolean;
  paymentUrl?: string;
  qrPayload?: string;
  widgetConfig?: CloudPaymentsWidgetConfig;
  status: "PENDING" | "READY";
  mode: "production" | "sandbox";
}

// ─── CloudPayments Service ───────────────────────────────────────────────────

export class CloudPaymentsService {
  private static getPublicId(): string {
    return process.env.CLOUDPAYMENTS_PUBLIC_ID || "";
  }

  private static getApiSecret(): string {
    return process.env.CLOUDPAYMENTS_API_SECRET || "";
  }

  /**
   * Generates the configuration payload for CloudPayments widget.
   * If credentials are not configured, returns sandbox configuration.
   */
  public static createWidgetConfig(params: InitiatePaymentParams): PaymentInitiationResult {
    const publicId = this.getPublicId();
    const isSandbox = !publicId;
    const amountKzt = Math.round(params.amountTiyn / 100);

    const widgetConfig: CloudPaymentsWidgetConfig = {
      publicId: publicId || "pk_sandbox_sabyr_fashion_luxury",
      description: params.description || `Оплата заказа ${params.orderNumber} в SABYR Atelier`,
      amount: amountKzt,
      currency: "KZT",
      accountId: params.customerPhone,
      invoiceId: params.orderNumber,
      email: params.customerEmail || undefined,
      data: {
        orderId: params.orderId,
        orderNumber: params.orderNumber,
        customerName: params.customerName || "Покупатель",
      },
    };

    return {
      gateway: "CARD_CLOUDPAYMENTS",
      requiresRedirect: false,
      widgetConfig,
      status: "READY",
      mode: isSandbox ? "sandbox" : "production",
    };
  }

  /**
   * Verifies HMAC-SHA256 signature for CloudPayments webhook notifications.
   * @param requestBody Raw JSON string of webhook payload
   * @param signatureHeader Content-HMAC header value from request
   */
  public static verifyWebhookSignature(requestBody: string, signatureHeader: string | null): boolean {
    const secret = this.getApiSecret();
    if (!secret || !signatureHeader) return false;

    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(requestBody)
      .digest("base64");

    return crypto.timingSafeEqual(
      Buffer.from(signatureHeader),
      Buffer.from(expectedSignature)
    );
  }
}

// ─── Kaspi Pay / Kaspi QR Service ────────────────────────────────────────────

export class KaspiPayService {
  private static getApiKey(): string {
    return process.env.KASPI_PAY_API_KEY || "";
  }

  private static getMerchantId(): string {
    return process.env.KASPI_PAY_MERCHANT_ID || "";
  }

  /**
   * Initiates a Kaspi QR payment.
   * In sandbox mode, generates a simulation QR deeplink for mobile testing.
   *
   * TODO (Production):
   * When official Kaspi Pay API credentials are provided:
   * 1. Send POST request to https://kaspi.kz:8080/api/v1/payment/create
   * 2. Receive official QR code image or dynamic link
   * 3. Register webhook listener for payment status updates
   */
  public static async createPayment(params: InitiatePaymentParams): Promise<PaymentInitiationResult> {
    const apiKey = this.getApiKey();
    const merchantId = this.getMerchantId();
    const isSandbox = !apiKey || !merchantId;
    const amountKzt = Math.round(params.amountTiyn / 100);

    if (isSandbox) {
      // Sandbox mode: generate a structured Kaspi payment deeplink
      const sandboxQrPayload = `https://kaspi.kz/pay/sabyr?order=${params.orderNumber}&amount=${amountKzt}`;

      return {
        gateway: "KASPI_QR",
        requiresRedirect: false,
        qrPayload: sandboxQrPayload,
        paymentUrl: sandboxQrPayload,
        status: "READY",
        mode: "sandbox",
      };
    }

    // TODO: Production Kaspi Pay API call
    return {
      gateway: "KASPI_QR",
      requiresRedirect: false,
      paymentUrl: `https://kaspi.kz/pay/sabyr?order=${params.orderNumber}&amount=${amountKzt}`,
      status: "READY",
      mode: "production",
    };
  }
}
