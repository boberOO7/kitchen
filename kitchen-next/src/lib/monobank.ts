import crypto from "crypto";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface MonoInvoiceCreateRequest {
  amount: number; // Amount in minimal units (kopeks for UAH)
  ccy?: number; // Currency code (980 for UAH)
  merchantPaymInfo?: {
    reference?: string;
    destination?: string;
    basketOrder?: Array<{
      name: string;
      qty: number;
      sum: number; // In minimal units
      icon?: string;
      unit?: string;
    }>;
  };
  redirectUrl?: string;
  webHookUrl?: string;
  validity?: number; // Invoice validity in seconds
  paymentType?: "debit" | "hold";
}

export interface MonoInvoiceCreateResponse {
  invoiceId: string;
  pageUrl: string;
}

export interface MonoInvoiceStatus {
  invoiceId: string;
  status: "created" | "processing" | "hold" | "success" | "failure" | "reversed" | "expired";
  failureReason?: string;
  amount: number;
  ccy: number;
  finalAmount?: number;
  createdDate: string;
  modifiedDate: string;
  reference?: string;
  cancelList?: Array<{
    status: string;
    amount: number;
    ccy: number;
    createdDate: string;
    modifiedDate: string;
  }>;
}

export interface MonoWebhookPayload {
  invoiceId: string;
  status: "created" | "processing" | "hold" | "success" | "failure" | "reversed" | "expired";
  failureReason?: string;
  amount: number;
  ccy: number;
  finalAmount?: number;
  createdDate: string;
  modifiedDate: string;
  reference?: string;
  payMethod?: string;
  fee?: number;
  paymentId?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Configuration
// ─────────────────────────────────────────────────────────────────────────────

function getConfig() {
  const token = process.env.MONO_MERCHANT_TOKEN;
  if (!token) {
    throw new Error("MONO_MERCHANT_TOKEN is not configured");
  }

  return {
    token,
    apiBase: process.env.MONO_API_BASE || "https://api.monobank.ua",
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Public Key Cache (10 minutes)
// ─────────────────────────────────────────────────────────────────────────────

let cachedPubKey: string | null = null;
let pubKeyCachedAt: number = 0;
const PUBKEY_CACHE_TTL = 10 * 60 * 1000; // 10 minutes

async function fetchPubKey(): Promise<string> {
  const { token, apiBase } = getConfig();

  const response = await fetch(`${apiBase}/api/merchant/pubkey`, {
    method: "GET",
    headers: {
      "X-Token": token,
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Failed to fetch monobank pubkey: ${response.status} ${text}`);
  }

  const data = await response.json();
  return data.key;
}

export async function monoGetPubKey(forceRefresh = false): Promise<string> {
  const now = Date.now();

  if (!forceRefresh && cachedPubKey && now - pubKeyCachedAt < PUBKEY_CACHE_TTL) {
    return cachedPubKey;
  }

  cachedPubKey = await fetchPubKey();
  pubKeyCachedAt = now;
  return cachedPubKey;
}

// ─────────────────────────────────────────────────────────────────────────────
// API Functions
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Create a new invoice for payment
 */
export async function monoCreateInvoice(
  payload: MonoInvoiceCreateRequest
): Promise<MonoInvoiceCreateResponse> {
  const { token, apiBase } = getConfig();

  const response = await fetch(`${apiBase}/api/merchant/invoice/create`, {
    method: "POST",
    headers: {
      "X-Token": token,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Monobank invoice creation failed: ${response.status} ${text}`);
  }

  return response.json();
}

/**
 * Get invoice status by invoiceId
 */
export async function monoGetInvoiceStatus(invoiceId: string): Promise<MonoInvoiceStatus> {
  const { token, apiBase } = getConfig();

  const response = await fetch(
    `${apiBase}/api/merchant/invoice/status?invoiceId=${encodeURIComponent(invoiceId)}`,
    {
      method: "GET",
      headers: {
        "X-Token": token,
      },
    }
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Failed to get invoice status: ${response.status} ${text}`);
  }

  return response.json();
}

// ─────────────────────────────────────────────────────────────────────────────
// Webhook Signature Verification
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Verify monobank webhook signature (ECDSA)
 * Returns true if signature is valid
 */
export async function monoVerifySignature(
  rawBody: Uint8Array,
  xSign: string,
  forceRefreshKey = false
): Promise<boolean> {
  try {
    const pubKeyBase64 = await monoGetPubKey(forceRefreshKey);
    
    // Monobank returns PEM key encoded in Base64
    const pubKeyPem = Buffer.from(pubKeyBase64, "base64").toString("utf-8");
    console.log("📝 Public key PEM (first 50 chars):", pubKeyPem.substring(0, 50));

    // Create public key from PEM
    const publicKey = crypto.createPublicKey(pubKeyPem);
    console.log("✅ Public key created successfully");

    // Decode signature from base64 (DER format, NOT ieee-p1363!)
    const signature = Buffer.from(xSign, "base64");
    console.log("📝 Signature length (bytes):", signature.length);

    // Verify signature using ECDSA with SHA256
    // Monobank uses DER-encoded signature (default), NOT ieee-p1363
    const isValid = crypto.verify(
      "sha256",
      Buffer.from(rawBody),
      publicKey,
      signature
    );

    console.log("📝 Signature verification result:", isValid);
    return isValid;
  } catch (error) {
    console.error("Signature verification error:", error);
    return false;
  }
}

/**
 * Verify webhook with automatic key refresh on failure
 */
export async function monoVerifyWebhook(
  rawBody: Uint8Array,
  xSign: string
): Promise<boolean> {
  // First attempt with cached key
  let isValid = await monoVerifySignature(rawBody, xSign, false);

  if (!isValid) {
    // Retry with fresh key
    console.log("Signature verification failed, refreshing pubkey and retrying...");
    isValid = await monoVerifySignature(rawBody, xSign, true);
  }

  return isValid;
}

// ─────────────────────────────────────────────────────────────────────────────
// Status Mapping
// ─────────────────────────────────────────────────────────────────────────────

import { PaymentStatus, OrderStatus } from "@prisma/client";

export function mapMonoStatusToPaymentStatus(
  monoStatus: MonoWebhookPayload["status"]
): PaymentStatus {
  switch (monoStatus) {
    case "created":
      return PaymentStatus.CREATED;
    case "processing":
    case "hold":
      return PaymentStatus.PENDING;
    case "success":
      return PaymentStatus.SUCCEEDED;
    case "failure":
    case "expired":
      return PaymentStatus.FAILED;
    case "reversed":
      return PaymentStatus.CANCELED;
    default:
      return PaymentStatus.PENDING;
  }
}

export function shouldUpdateOrderToPaid(paymentStatus: PaymentStatus): boolean {
  return paymentStatus === PaymentStatus.SUCCEEDED;
}

export function shouldUpdateOrderToCancelled(paymentStatus: PaymentStatus): boolean {
  return (
    paymentStatus === PaymentStatus.FAILED || paymentStatus === PaymentStatus.CANCELED
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Currency Helpers
// ─────────────────────────────────────────────────────────────────────────────

// ISO 4217 numeric currency codes
export const CURRENCY_CODES: Record<string, number> = {
  UAH: 980,
  USD: 840,
  EUR: 978,
};

export function getCurrencyCode(currency: string): number {
  const code = CURRENCY_CODES[currency.toUpperCase()];
  if (!code) {
    throw new Error(`Unsupported currency: ${currency}`);
  }
  return code;
}

