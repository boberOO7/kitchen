// User types
export interface User {
  id: string;
  email: string;
  name: string | null;
  firstName: string | null;  // Google: given_name
  lastName: string | null;   // Google: family_name
  avatarUrl: string | null;
  createdAt: Date;
}

// Order status types (synced with Prisma schema)
export type OrderStatus =
  | "DRAFT"            // Order started but not complete (checkout in progress)
  | "PENDING_PAYMENT"  // Order complete, waiting for payment
  | "PAID"
  | "CANCELLED"
  | "EXPIRED"          // Payment window expired (48 hours)
  | "REFUNDED";

// Shipment types
export interface Shipment {
  id: string;
  orderId: string;
  trackingNumber: string | null;
  carrier: string | null;
  status: "in_transit" | "out_for_delivery" | "delivered";
  estimatedDelivery: Date | null;
  updatedAt: Date;
}

// Order types
export interface Order {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  total: number;
  currency: string;
  itemCount: number;
  createdAt: Date;
  shipment?: Shipment | null;
}

// Simple order reference (just the ID for navigation)
export interface OrderRef {
  id: string;
}

// Account summary for header dropdown
export interface AccountSummary {
  activeShipment?: Shipment;           // Order in transit
  pendingPaymentOrder?: OrderRef;      // Most recent order awaiting payment
  pendingPaymentCount?: number;        // Total count of pending payment orders
  draftOrder?: OrderRef;               // Order in progress (just need ID for link)
  cartCount: number;
}

// Context-aware action for "Продовжити" button
export interface ContextAction {
  label: string;
  href: string;
  icon?: "truck" | "card" | "cart" | "user";
}

