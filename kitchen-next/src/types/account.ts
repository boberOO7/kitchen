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

// Account summary for header dropdown
export interface AccountSummary {
  activeShipment?: Shipment;           // Order in transit
  pendingPaymentOrder?: Order;         // Order awaiting payment (complete, ready to pay)
  draftOrder?: Order;                  // Order in progress (checkout started but not complete)
  cartCount: number;
}

// Context-aware action for "Продовжити" button
export interface ContextAction {
  label: string;
  href: string;
  icon?: "truck" | "card" | "cart" | "user";
}

