/**
 * Monobank "Покупка частинами" (Installments) Integration
 *
 * Test platform credentials (env vars):
 *   MONO_CHAST_BASE_URL=https://u2-demo-ext.mono.st4g3.com
 *   MONO_CHAST_STORE_ID=test_store_with_confirm
 *   MONO_CHAST_SECRET=secret_98765432--123-123
 *   MONO_CHAST_CALLBACK_URL=https://YOUR_DOMAIN/api/webhooks/mono-installments
 *
 * Test scenarios based on phone last digit:
 *   1 => approved callback after ~5s
 *   2 => waiting customer confirm
 *   3 => declined (insufficient limit) callback after ~5s
 *   4 => customer confirmed, waiting merchant confirm (2-step flow)
 */

import { createHmac } from "crypto";
import { InstallmentStatus } from "@prisma/client";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export const INSTALLMENT_PERIODS = [3, 4, 6, 9, 12] as const;
export type InstallmentPeriod = (typeof INSTALLMENT_PERIODS)[number];

export interface CreateInstallmentRequest {
  orderId: string;
  totalAmount: number; // in kopeks (will be converted to UAH)
  customerPhone: string;
  months: InstallmentPeriod;
  products: Array<{
    name: string;
    price: number; // in kopeks
    count: number;
  }>;
  redirectUrl?: string;
  webhookUrl?: string;
}

export interface CreateInstallmentResponse {
  applicationId: string;
  redirectUrl?: string;
  monthlyAmount?: number;
  status: string;
  rawResponse?: unknown;
}

export interface InstallmentCallbackPayload {
  applicationId?: string;
  application_id?: string;
  orderId?: string;
  order_id?: string;
  store_order_id?: string;
  status: string;
  state?: string;
  monthlyAmount?: number;
  monthly_amount?: number;
  failureReason?: string;
  failure_reason?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Configuration
// ─────────────────────────────────────────────────────────────────────────────

export function getInstallmentsConfig() {
  const baseUrl = process.env.MONO_CHAST_BASE_URL || "https://u2-demo-ext.mono.st4g3.com";
  const storeId = process.env.MONO_CHAST_STORE_ID || "test_store_with_confirm";
  const secret = process.env.MONO_CHAST_SECRET || "secret_98765432--123-123";
  const callbackUrl = process.env.MONO_CHAST_CALLBACK_URL || "";

  return { baseUrl, storeId, secret, callbackUrl };
}

/**
 * Check if we should use mock mode for installments
 * Set MONO_CHAST_MOCK=true in .env to enable
 */
function shouldUseMock(): boolean {
  return process.env.MONO_CHAST_MOCK === "true";
}

// ─────────────────────────────────────────────────────────────────────────────
// Signature Generation & Verification
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Generate HMAC-SHA256 signature for Monobank API requests
 * Signature is calculated from raw JSON string
 */
export function generateInstallmentSignature(rawBody: string, secret: string): string {
  return createHmac("sha256", secret).update(rawBody, "utf8").digest("base64");
}

/**
 * Verify webhook signature from Monobank
 */
export function verifyInstallmentWebhookSignature(
  rawBody: string,
  signature: string,
  secret: string
): boolean {
  const expectedSignature = generateInstallmentSignature(rawBody, secret);

  // In mock mode, always accept signatures
  if (shouldUseMock()) {
    console.log("🎭 MOCK MODE: Skipping signature verification");
    return true;
  }

  return signature === expectedSignature;
}

// ─────────────────────────────────────────────────────────────────────────────
// Status Mapping
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Map Monobank API status to internal InstallmentStatus enum
 * @param monoStatus - The state field from Monobank callback
 * @param subState - The order_sub_state field from Monobank callback (optional)
 */
export function mapMonoInstallmentStatus(monoStatus: string, subState?: string): InstallmentStatus {
  const statusLower = monoStatus.toLowerCase();
  const subStateLower = subState?.toLowerCase();

  // Handle various status formats from Monobank
  if (statusLower === "approved" || statusLower === "success" || statusLower === "done") {
    return InstallmentStatus.APPROVED;
  }
  if (statusLower === "declined" || statusLower === "rejected" || statusLower === "failed" || statusLower === "fail") {
    return InstallmentStatus.DECLINED;
  }
  if (statusLower === "canceled" || statusLower === "cancelled") {
    return InstallmentStatus.CANCELED;
  }
  if (statusLower === "expired") {
    return InstallmentStatus.EXPIRED;
  }
  
  // Check sub_state for more specific status (Scenario 4: 2-step flow)
  if (subStateLower === "waiting_for_store_confirm" || subStateLower === "waiting for store confirm") {
    return InstallmentStatus.PENDING_MERCHANT;
  }
  
  if (
    statusLower === "waiting_customer" ||
    statusLower === "pending_customer" ||
    statusLower === "waiting customer" ||
    statusLower === "pending customer" ||
    statusLower === "pending" ||
    statusLower === "created"
  ) {
    return InstallmentStatus.PENDING_CUSTOMER;
  }
  if (
    statusLower === "waiting_merchant" ||
    statusLower === "pending_merchant" ||
    statusLower === "waiting merchant" ||
    statusLower === "pending merchant"
  ) {
    return InstallmentStatus.PENDING_MERCHANT;
  }
  
  // IN_PROCESS without specific sub_state means customer needs to confirm
  if (statusLower === "in_process" || statusLower === "in process") {
    return InstallmentStatus.PENDING_CUSTOMER;
  }

  // Default to PENDING_CUSTOMER for unknown statuses
  console.warn(`Unknown Monobank installment status: ${monoStatus} (subState: ${subState}), defaulting to PENDING_CUSTOMER`);
  return InstallmentStatus.PENDING_CUSTOMER;
}

/**
 * Check if installment status should update order to PAID
 */
export function shouldUpdateOrderToPaidFromInstallment(status: InstallmentStatus): boolean {
  return status === InstallmentStatus.APPROVED;
}

// ─────────────────────────────────────────────────────────────────────────────
// Utility Functions
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Convert kopeks to UAH with decimals (e.g., 123456 => 1234.56)
 */
export function kopeksToUah(kopeks: number): number {
  return kopeks / 100;
}

/**
 * Convert UAH to kopeks (e.g., 1234.56 => 123456)
 */
export function uahToKopeks(uah: number): number {
  return Math.round(uah * 100);
}

/**
 * Calculate approximate monthly payment (in kopeks)
 */
export function calculateMonthlyPayment(totalAmountKopeks: number, months: number): number {
  return Math.ceil(totalAmountKopeks / months);
}

/**
 * Get test scenario description based on phone number last digit
 */
export function getTestScenarioInfo(phone: string): string {
  const lastDigit = phone.replace(/\D/g, "").slice(-1);
  switch (lastDigit) {
    case "1":
      return "✅ Сценарій 1: Буде схвалено через ~5 сек";
    case "2":
      return "⏳ Сценарій 2: Очікування підтвердження клієнта";
    case "3":
      return "❌ Сценарій 3: Буде відхилено через ~5 сек";
    case "4":
      return "🏪 Сценарій 4: Потребує підтвердження магазину";
    default:
      return "";
  }
}

/**
 * Format date as YYYY-MM-DD for invoice
 */
function formatDateForInvoice(date: Date = new Date()): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * Format phone number for Monobank API
 * Must be in format +380XXXXXXXXX with valid operator code
 */
export function formatPhoneForMono(phone: string): string {
  // Remove all non-digit characters
  let digits = phone.replace(/\D/g, "");

  // If starts with 0, add 38 prefix
  if (digits.startsWith("0") && digits.length === 10) {
    digits = "38" + digits;
  }

  // If doesn't start with 380, assume it's missing country code
  if (!digits.startsWith("380") && digits.length === 9) {
    digits = "380" + digits;
  }

  // Must be 12 digits (380 + 9 digits)
  if (digits.length !== 12 || !digits.startsWith("380")) {
    console.warn(`Phone number ${phone} doesn't match expected format, using as-is: ${digits}`);
  }

  // Return with + prefix
  return "+" + digits;
}

// ─────────────────────────────────────────────────────────────────────────────
// Request Body Builder
// ─────────────────────────────────────────────────────────────────────────────

interface MonoChastRequestBody {
  store_order_id: string;
  client_phone: string;
  total_sum: number;
  invoice: {
    date: string;
    number: string;
    point_id: number;
    source: string;
  };
  available_programs: Array<{
    available_parts_count: number[];
    type: string;
  }>;
  products: Array<{
    name: string;
    count: number;
    sum: number;
  }>;
  result_callback: string;
}

/**
 * Build request body in the exact format expected by Mono API
 * Important: signature is calculated from raw JSON string,
 * so we need consistent key ordering
 */
function buildCreateRequestBody(params: {
  storeOrderId: string;
  clientPhone: string;
  totalSumUah: number;
  monthsOptions: number[];
  products: Array<{ name: string; count: number; sumUah: number }>;
  callbackUrl: string;
}): MonoChastRequestBody {
  return {
    store_order_id: params.storeOrderId,
    client_phone: params.clientPhone,
    total_sum: params.totalSumUah,
    invoice: {
      date: formatDateForInvoice(),
      number: params.storeOrderId,
      point_id: 1234,
      source: "INTERNET",
    },
    available_programs: [
      {
        available_parts_count: params.monthsOptions,
        type: "payment_installments",
      },
    ],
    products: params.products.map((p) => ({
      name: p.name,
      count: p.count,
      sum: p.sumUah,
    })),
    result_callback: params.callbackUrl,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// API Functions
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Create a new installment application with Monobank
 */
export async function createInstallmentApplication(
  request: CreateInstallmentRequest
): Promise<CreateInstallmentResponse> {
  const { storeId, secret, baseUrl, callbackUrl } = getInstallmentsConfig();

  // Use provided webhook URL or fall back to env config
  const webhookUrl = request.webhookUrl || callbackUrl;

  console.log("\n📤 Creating installment application...");
  console.log("   Store ID:", storeId);
  console.log("   Order ID:", request.orderId);
  console.log("   Amount:", request.totalAmount, "kopeks =", kopeksToUah(request.totalAmount), "UAH");
  console.log("   Phone:", request.customerPhone);
  console.log("   Months:", request.months);
  console.log("   Callback URL:", webhookUrl);

  // Mock mode for development when test server is unavailable
  if (shouldUseMock()) {
    console.log("🎭 MOCK MODE: Simulating installment creation");
    const mockApplicationId = `mock_${request.orderId}_${Date.now()}`;
    const monthlyAmount = calculateMonthlyPayment(request.totalAmount, request.months);

    return {
      applicationId: mockApplicationId,
      redirectUrl: undefined,
      monthlyAmount: monthlyAmount,
      status: "created",
    };
  }

  // Format phone for Mono API (must be +380XXXXXXXXX)
  const formattedPhone = formatPhoneForMono(request.customerPhone);
  console.log("   Formatted phone:", formattedPhone);

  // Build request body
  const bodyObj = buildCreateRequestBody({
    storeOrderId: request.orderId,
    clientPhone: formattedPhone,
    totalSumUah: kopeksToUah(request.totalAmount),
    monthsOptions: [request.months], // Only the selected months option
    products: request.products.map((p) => ({
      name: p.name,
      count: p.count,
      sumUah: kopeksToUah(p.price * p.count),
    })),
    callbackUrl: webhookUrl,
  });

  // Stringify and sign
  const rawBody = JSON.stringify(bodyObj);
  const signature = generateInstallmentSignature(rawBody, secret);

  console.log("📋 Request body:", rawBody);
  console.log("🔐 Signature:", signature);

  const url = `${baseUrl}/api/order/create`;
  console.log("🌐 URL:", url);

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "store-id": storeId,
      signature: signature,
    },
    body: rawBody,
  });

  const responseText = await response.text();
  console.log("📥 Response status:", response.status);
  console.log("📥 Response body:", responseText);

  let data: Record<string, unknown> = {};
  try {
    data = JSON.parse(responseText);
  } catch {
    console.error("❌ Failed to parse response as JSON");
  }

  if (!response.ok) {
    console.error("❌ Installment API error:", response.status, responseText);
    throw new Error(`Failed to create installment application: ${response.status} ${responseText}`);
  }

  console.log("✅ Installment application created:", data);

  // Extract application ID from response (field name may vary)
  const applicationId =
    (data.application_id as string) ||
    (data.applicationId as string) ||
    (data.order_id as string) ||
    (data.id as string) ||
    request.orderId;

  return {
    applicationId,
    redirectUrl: (data.redirect_url as string) || (data.redirectUrl as string) || (data.url as string),
    monthlyAmount: (data.monthly_amount as number) || (data.monthlyAmount as number),
    status: (data.status as string) || (data.state as string) || "created",
    rawResponse: data,
  };
}

/**
 * Merchant confirm for 2-step flow (phone ends with 4)
 */
export async function merchantConfirmInstallment(
  applicationId: string
): Promise<{ success: boolean; status: string }> {
  console.log("\n📤 Merchant confirming installment...");
  console.log("   Application ID:", applicationId);

  // Mock mode
  if (shouldUseMock()) {
    console.log("🎭 MOCK MODE: Simulating merchant confirm");
    return {
      success: true,
      status: "approved",
    };
  }

  const { storeId, secret, baseUrl } = getInstallmentsConfig();

  // Mono expects order_id (their ID), not store_order_id (our ID)
  const bodyObj = {
    order_id: applicationId,
  };

  const rawBody = JSON.stringify(bodyObj);
  const signature = generateInstallmentSignature(rawBody, secret);

  const url = `${baseUrl}/api/order/confirm`;
  console.log("🌐 URL:", url);
  console.log("📋 Request body:", rawBody);

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "store-id": storeId,
      signature: signature,
    },
    body: rawBody,
  });

  const responseText = await response.text();
  console.log("📥 Response status:", response.status);
  console.log("📥 Response body:", responseText);

  if (!response.ok) {
    console.error("❌ Merchant confirm API error:", response.status, responseText);
    throw new Error(`Failed to confirm installment: ${response.status} ${responseText}`);
  }

  let data: Record<string, unknown> = {};
  try {
    data = JSON.parse(responseText);
  } catch {
    // Response might not be JSON
  }

  console.log("✅ Merchant confirm response:", data);

  return {
    success: true,
    status: (data.status as string) || (data.state as string) || "approved",
  };
}

/**
 * Get installment application status from Monobank
 * @param monoOrderId - Mono's order_id (returned from /api/order/create)
 */
export async function getInstallmentStatus(
  monoOrderId: string
): Promise<{ status: string; monthlyAmount?: number }> {
  console.log("\n📤 Getting installment status...");
  console.log("   Mono Order ID:", monoOrderId);

  // Mock mode
  if (shouldUseMock()) {
    console.log("🎭 MOCK MODE: Returning mock status");
    return {
      status: "pending_customer",
    };
  }

  const { storeId, secret, baseUrl } = getInstallmentsConfig();

  // Use order_id (Mono's ID) instead of store_order_id (our ID)
  const bodyObj = {
    order_id: monoOrderId,
  };

  const rawBody = JSON.stringify(bodyObj);
  const signature = generateInstallmentSignature(rawBody, secret);

  const url = `${baseUrl}/api/order/status`;
  console.log("🌐 URL:", url);
  console.log("📋 Request body:", rawBody);

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "store-id": storeId,
      signature: signature,
    },
    body: rawBody,
  });

  const responseText = await response.text();
  console.log("📥 Response status:", response.status);
  console.log("📥 Response body:", responseText);

  if (!response.ok) {
    console.error("❌ Get status API error:", response.status, responseText);
    throw new Error(`Failed to get installment status: ${response.status} ${responseText}`);
  }

  let data: Record<string, unknown> = {};
  try {
    data = JSON.parse(responseText);
  } catch {
    // Response might not be JSON
  }

  console.log("✅ Status response:", data);

  return {
    status: (data.status as string) || (data.state as string) || "unknown",
    monthlyAmount: (data.monthly_amount as number) || (data.monthlyAmount as number),
  };
}

/**
 * Extract order ID from webhook payload (handles various field names)
 */
export function extractOrderIdFromCallback(payload: InstallmentCallbackPayload): string | undefined {
  return payload.store_order_id || payload.orderId || payload.order_id;
}

/**
 * Extract application ID from webhook payload
 */
export function extractApplicationIdFromCallback(payload: InstallmentCallbackPayload): string | undefined {
  return payload.application_id || payload.applicationId;
}

/**
 * Extract status from webhook payload
 */
export function extractStatusFromCallback(payload: InstallmentCallbackPayload): string {
  return payload.status || payload.state || "unknown";
}
