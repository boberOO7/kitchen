"use server";

import { prisma } from "@/lib/prisma";
import { requireAppUser, getAppUser } from "@/lib/auth";
import { expirePendingOrders } from "@/server/orders/expirePendingOrders";
import { calculateMonthlyPayment, getTestScenarioInfo, INSTALLMENT_PERIODS } from "@/lib/monobank-installments";
import { getNbuUsdRate, convertUsdToUah, getExchangeRateInfo } from "@/lib/nbu";

/**
 * Normalize name to title case (handles compound names like "Анна-Марія")
 */
function normalizeNameCase(name) {
  if (!name) return name;
  return name
    .toLowerCase()
    .split(/(-|'|ʼ|')/)
    .map((part) => {
      if (part === '-' || part === "'" || part === 'ʼ' || part === "'") {
        return part;
      }
      return part.charAt(0).toUpperCase() + part.slice(1);
    })
    .join('');
}

/**
 * Check if user has any PENDING_PAYMENT orders (unpaid orders)
 * Returns the most recent one and total count of pending orders
 */
export async function getPendingPaymentOrder() {
  try {
    const { appUser } = await requireAppUser();

    // Expire any pending orders before reading (expire-on-read)
    await expirePendingOrders();

    // Get count of all pending orders
    const pendingCount = await prisma.order.count({
      where: {
        userId: appUser.id,
        status: "PENDING_PAYMENT",
      },
    });

    if (pendingCount === 0) {
      return { success: true, order: null, pendingCount: 0 };
    }

    // Get the most recent pending order
    const pendingOrder = await prisma.order.findFirst({
      where: {
        userId: appUser.id,
        status: "PENDING_PAYMENT",
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        payments: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    if (!pendingOrder || pendingOrder.items.length === 0) {
      return { success: true, order: null, pendingCount: 0 };
    }

    const latestPayment = pendingOrder.payments[0] || null;

    return {
      success: true,
      pendingCount,
      order: {
        id: pendingOrder.id,
        status: pendingOrder.status,
        total: pendingOrder.totalMinor,
        currency: pendingOrder.currency,
        itemCount: pendingOrder.items.reduce((sum, item) => sum + item.quantity, 0),
        createdAt: pendingOrder.createdAt.toISOString(),
        paymentStatus: latestPayment?.status || null,
      },
    };
  } catch (error) {
    if (error.message === "UNAUTHORIZED") {
      return { success: false, error: "UNAUTHORIZED" };
    }
    console.error("getPendingPaymentOrder error:", error);
    return { success: false, error: "Failed to check pending orders" };
  }
}

/**
 * Initiate Monobank payment for the user's cart
 * Saves delivery info to order before creating payment
 * Returns orderId for client to call the API endpoint
 */
export async function initiateMonobankPayment(deliveryInfo = null) {
  try {
    const { appUser } = await requireAppUser();

    // Find user's DRAFT order (cart)
    const order = await prisma.order.findFirst({
      where: {
        userId: appUser.id,
        status: "DRAFT",
      },
      include: {
        items: true,
      },
    });

    if (!order) {
      return { success: false, error: "Кошик порожній" };
    }

    if (order.items.length === 0) {
      return { success: false, error: "Кошик порожній" };
    }

    if (order.totalMinor <= 0) {
      return { success: false, error: "Сума замовлення має бути більше 0" };
    }

    // Get current NBU exchange rate and fix it for this order
    let exchangeRate;
    try {
      exchangeRate = await getNbuUsdRate();
    } catch (rateError) {
      console.error("Failed to get NBU rate:", rateError);
      return { 
        success: false, 
        error: "Не вдалося отримати курс НБУ. Спробуйте пізніше." 
      };
    }
    const totalUahMinor = convertUsdToUah(order.totalMinor, exchangeRate);

    // Save delivery info and fix exchange rate
    const updateData = {
      // Fix exchange rate at order confirmation
      exchangeRateNbu: exchangeRate,
      totalUahMinor: totalUahMinor,
      rateFixedAt: new Date(),
    };

    // Add delivery info if provided
    if (deliveryInfo) {
      Object.assign(updateData, {
        deliveryMethod: deliveryInfo.deliveryMethod || null,
        recipientName: deliveryInfo.firstName && deliveryInfo.lastName 
          ? `${normalizeNameCase(deliveryInfo.firstName.trim())} ${normalizeNameCase(deliveryInfo.lastName.trim())}` 
          : null,
        recipientPhone: deliveryInfo.phone || null,
        recipientEmail: deliveryInfo.email || null,
        deliveryCity: deliveryInfo.city || null,
        deliveryAddress: deliveryInfo.address || null,
        comment: deliveryInfo.comment || null,
      });
    }

    await prisma.order.update({
      where: { id: order.id },
      data: updateData,
    });

    // Sync checkout data to user profile (silent)
    if (deliveryInfo) {
      const profileUpdate = {};
      if (deliveryInfo.firstName) {
        profileUpdate.firstName = normalizeNameCase(deliveryInfo.firstName.trim());
      }
      if (deliveryInfo.lastName) {
        profileUpdate.lastName = normalizeNameCase(deliveryInfo.lastName.trim());
      }
      if (deliveryInfo.phone) {
        profileUpdate.phone = deliveryInfo.phone;
      }
      
      if (Object.keys(profileUpdate).length > 0) {
        await prisma.user.update({
          where: { id: appUser.id },
          data: profileUpdate,
        });
      }
    }

    // Return orderId for client to call the API endpoint
    // We use API endpoint because we need request headers for origin URL
    return { 
      success: true, 
      orderId: order.id,
      exchangeRate,
      totalUahMinor,
    };
  } catch (error) {
    console.error("initiateMonobankPayment error:", error);
    
    if (error.message === "UNAUTHORIZED") {
      return { success: false, error: "UNAUTHORIZED" };
    }
    
    return { success: false, error: "Не вдалося ініціювати оплату" };
  }
}

/**
 * Get order status for checkout success page (legacy)
 */
export async function getOrderStatus(orderId) {
  return getOrderDetails(orderId);
}

/**
 * Get full order details with items, products, payment info, and installment status
 */
export async function getOrderDetails(orderId) {
  try {
    const { appUser } = await requireAppUser();

    // Expire any pending orders before reading (expire-on-read)
    await expirePendingOrders();

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        payments: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
        installment: true, // Include installment application if exists
      },
    });

    if (!order || order.userId !== appUser.id) {
      return { success: false, error: "Замовлення не знайдено" };
    }

    const latestPayment = order.payments[0] || null;

    return {
      success: true,
      order: {
        id: order.id,
        status: order.status,
        paymentMethod: order.paymentMethod, // MONO_CARD or MONO_INSTALLMENTS
        subtotal: order.subtotalMinor, // In minor units (cents/kopeks)
        total: order.totalMinor, // In minor units (cents/kopeks)
        totalUah: order.totalUahMinor, // UAH kopeks (rounded to whole hryvnias)
        exchangeRate: order.exchangeRateNbu, // Exchange rate at order time
        currency: order.currency,
        createdAt: order.createdAt.toISOString(),
        updatedAt: order.updatedAt.toISOString(),
        expiresAt: order.expiresAt?.toISOString() || null,
        expiredAt: order.expiredAt?.toISOString() || null,
        items: order.items.map((item) => ({
          id: item.id,
          name: item.name,
          unitPrice: item.unitPriceMinor, // In minor units (cents/kopeks)
          quantity: item.quantity,
          total: item.totalMinor, // In minor units (cents/kopeks)
          product: item.product
            ? {
                id: item.product.id,
                name: item.product.name,
                imageKey: item.product.imageKey,
              }
            : null,
        })),
        // Delivery info
        delivery: {
          method: order.deliveryMethod,
          recipientName: order.recipientName,
          phone: order.recipientPhone,
          email: order.recipientEmail,
          city: order.deliveryCity,
          address: order.deliveryAddress,
          comment: order.comment,
        },
      },
      payment: latestPayment
        ? {
            id: latestPayment.id,
            status: latestPayment.status,
            provider: latestPayment.provider,
            amount: latestPayment.amountMinor, // In minor units (cents/kopeks)
            createdAt: latestPayment.createdAt.toISOString(),
          }
        : null,
      // Installment application info (if payment method is installments)
      installment: order.installment
        ? {
            id: order.installment.id,
            status: order.installment.status,
            months: order.installment.months,
            monthlyAmount: order.installment.monthlyAmount,
            totalAmount: order.installment.totalAmount,
            customerPhone: order.installment.customerPhone,
            createdAt: order.installment.createdAt.toISOString(),
            updatedAt: order.installment.updatedAt.toISOString(),
          }
        : null,
    };
  } catch (error) {
    console.error("getOrderDetails error:", error);
    
    if (error.message === "UNAUTHORIZED") {
      return { success: false, error: "UNAUTHORIZED" };
    }
    
    return { success: false, error: "Не вдалося отримати замовлення" };
  }
}

/**
 * Get available installment options for the current cart
 */
export async function getInstallmentOptions() {
  try {
    const { appUser } = await requireAppUser();

    // Find user's DRAFT order (cart)
    const order = await prisma.order.findFirst({
      where: {
        userId: appUser.id,
        status: "DRAFT",
      },
    });

    if (!order || order.totalMinor <= 0) {
      return { success: true, options: [] };
    }

    // Get current exchange rate and convert to UAH
    let totalUah;
    try {
      const exchangeRate = await getNbuUsdRate();
      totalUah = convertUsdToUah(order.totalMinor, exchangeRate);
    } catch (rateError) {
      console.error("Failed to get NBU rate for installments:", rateError);
      return { success: false, error: "Не вдалося отримати курс НБУ" };
    }

    // Calculate monthly payments for each period (in UAH)
    const options = INSTALLMENT_PERIODS.map((months) => ({
      months,
      monthlyAmount: calculateMonthlyPayment(totalUah, months),
      totalAmount: totalUah,
    }));

    return { success: true, options };
  } catch (error) {
    console.error("getInstallmentOptions error:", error);
    
    if (error.message === "UNAUTHORIZED") {
      return { success: false, error: "UNAUTHORIZED" };
    }
    
    return { success: false, error: "Не вдалося отримати опції розстрочки" };
  }
}

/**
 * Get test scenario info for development
 */
export async function getInstallmentTestScenario(phone) {
  return {
    success: true,
    scenario: getTestScenarioInfo(phone),
  };
}

/**
 * Get all orders for the current user (excluding DRAFT orders which are carts)
 */
export async function getUserOrders() {
  try {
    const { appUser } = await requireAppUser();

    // Expire any pending orders before reading (expire-on-read)
    await expirePendingOrders();

    const orders = await prisma.order.findMany({
      where: {
        userId: appUser.id,
        status: {
          not: "DRAFT", // Exclude DRAFT orders (carts)
        },
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        payments: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return {
      success: true,
      orders: orders.map((order) => {
        const latestPayment = order.payments[0] || null;
        return {
          id: order.id,
          status: order.status,
          subtotal: order.subtotalMinor,
          total: order.totalMinor,
          totalUah: order.totalUahMinor, // UAH amount (already rounded to whole hryvnias)
          exchangeRate: order.exchangeRateNbu, // Exchange rate at order time
          currency: order.currency,
          createdAt: order.createdAt.toISOString(),
          updatedAt: order.updatedAt.toISOString(),
          itemCount: order.items.reduce((sum, item) => sum + item.quantity, 0),
          items: order.items.map((item) => ({
            id: item.id,
            name: item.name,
            unitPrice: item.unitPriceMinor,
            quantity: item.quantity,
            total: item.totalMinor,
            product: item.product
              ? {
                  id: item.product.id,
                  name: item.product.name,
                  imageKey: item.product.imageKey,
                }
              : null,
          })),
          payment: latestPayment
            ? {
                id: latestPayment.id,
                status: latestPayment.status,
                provider: latestPayment.provider,
              }
            : null,
        };
      }),
    };
  } catch (error) {
    console.error("getUserOrders error:", error);

    if (error.message === "UNAUTHORIZED") {
      return { success: false, error: "UNAUTHORIZED" };
    }

    return { success: false, error: "Не вдалося отримати замовлення" };
  }
}

/**
 * Revert a PENDING_PAYMENT order back to DRAFT status (for editing/resuming checkout)
 * Returns delivery info for prefilling checkout form
 */
export async function revertOrderToDraft(orderId) {
  try {
    const { appUser } = await requireAppUser();

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        payments: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });

    if (!order || order.userId !== appUser.id) {
      return { success: false, error: "Замовлення не знайдено" };
    }

    // Only revert PENDING_PAYMENT orders
    if (order.status !== "PENDING_PAYMENT") {
      return { success: false, error: "Замовлення не можна відновити" };
    }

    // Check if payment was successful - don't revert if paid
    const latestPayment = order.payments[0];
    if (latestPayment?.status === "SUCCEEDED") {
      return { success: false, error: "Замовлення вже оплачено" };
    }

    // Revert to DRAFT and clear expiration
    await prisma.order.update({
      where: { id: orderId },
      data: {
        status: "DRAFT",
        activePaymentId: null,
        expiresAt: null,
        expiredAt: null,
      },
    });

    // Return delivery info for prefilling checkout form
    return { 
      success: true,
      deliveryInfo: {
        firstName: order.recipientName?.split(' ')[0] || '',
        lastName: order.recipientName?.split(' ').slice(1).join(' ') || '',
        email: order.recipientEmail || '',
        phone: order.recipientPhone || '',
        city: order.deliveryCity || '',
        address: order.deliveryAddress || '',
        deliveryMethod: order.deliveryMethod || '',
        comment: order.comment || '',
      },
    };
  } catch (error) {
    console.error("revertOrderToDraft error:", error);

    if (error.message === "UNAUTHORIZED") {
      return { success: false, error: "UNAUTHORIZED" };
    }

    return { success: false, error: "Не вдалося відновити замовлення" };
  }
}

/**
 * Cancel a PENDING_PAYMENT order
 * User can cancel their order before payment is completed
 */
export async function cancelOrder(orderId) {
  try {
    const { appUser } = await requireAppUser();

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        payments: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });

    if (!order || order.userId !== appUser.id) {
      return { success: false, error: "Замовлення не знайдено" };
    }

    // Only cancel PENDING_PAYMENT orders
    if (order.status !== "PENDING_PAYMENT") {
      return { success: false, error: "Замовлення не можна скасувати" };
    }

    // Check if payment was successful - don't cancel if paid
    const latestPayment = order.payments[0];
    if (latestPayment?.status === "SUCCEEDED") {
      return { success: false, error: "Замовлення вже оплачено" };
    }

    // Cancel the order
    await prisma.order.update({
      where: { id: orderId },
      data: {
        status: "CANCELLED",
        activePaymentId: null,
      },
    });

    return { success: true };
  } catch (error) {
    console.error("cancelOrder error:", error);

    if (error.message === "UNAUTHORIZED") {
      return { success: false, error: "UNAUTHORIZED" };
    }

    return { success: false, error: "Не вдалося скасувати замовлення" };
  }
}

/**
 * Edit order: Cancel the existing order and create a new DRAFT with the same items
 * Returns delivery info for checkout prefill
 */
export async function editOrderAsNewDraft(orderId) {
  try {
    const { appUser } = await requireAppUser();

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        payments: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });

    if (!order || order.userId !== appUser.id) {
      return { success: false, error: "Замовлення не знайдено" };
    }

    // Only edit PENDING_PAYMENT orders
    if (order.status !== "PENDING_PAYMENT") {
      return { success: false, error: "Замовлення не можна редагувати" };
    }

    // Check if payment was successful - don't edit if paid
    const latestPayment = order.payments[0];
    if (latestPayment?.status === "SUCCEEDED") {
      return { success: false, error: "Замовлення вже оплачено" };
    }

    // Check if user already has a DRAFT order
    const existingDraft = await prisma.order.findFirst({
      where: {
        userId: appUser.id,
        status: "DRAFT",
      },
    });

    if (existingDraft) {
      // Delete existing draft (we'll create a new one with items from the order)
      await prisma.orderItem.deleteMany({
        where: { orderId: existingDraft.id },
      });
      await prisma.order.delete({
        where: { id: existingDraft.id },
      });
    }

    // Cancel the existing order
    await prisma.order.update({
      where: { id: orderId },
      data: {
        status: "CANCELLED",
        activePaymentId: null,
      },
    });

    // Create a new DRAFT order with the same items
    const newOrder = await prisma.order.create({
      data: {
        userId: appUser.id,
        status: "DRAFT",
        currency: order.currency,
        subtotalMinor: order.subtotalMinor,
        totalMinor: order.totalMinor,
        // Copy delivery info to the new order too
        deliveryMethod: order.deliveryMethod,
        recipientName: order.recipientName,
        recipientPhone: order.recipientPhone,
        recipientEmail: order.recipientEmail,
        deliveryCity: order.deliveryCity,
        deliveryAddress: order.deliveryAddress,
        comment: order.comment,
      },
    });

    // Copy items to the new order
    for (const item of order.items) {
      await prisma.orderItem.create({
        data: {
          orderId: newOrder.id,
          productId: item.productId,
          name: item.name,
          unitPriceMinor: item.unitPriceMinor,
          quantity: item.quantity,
          totalMinor: item.totalMinor,
          configId: item.configId,
        },
      });
    }

    // Return delivery info for prefilling checkout form
    return { 
      success: true,
      newOrderId: newOrder.id,
      deliveryInfo: {
        firstName: order.recipientName?.split(' ')[0] || '',
        lastName: order.recipientName?.split(' ').slice(1).join(' ') || '',
        email: order.recipientEmail || '',
        phone: order.recipientPhone || '',
        city: order.deliveryCity || '',
        address: order.deliveryAddress || '',
        deliveryMethod: order.deliveryMethod || '',
        comment: order.comment || '',
      },
    };
  } catch (error) {
    console.error("editOrderAsNewDraft error:", error);

    if (error.message === "UNAUTHORIZED") {
      return { success: false, error: "UNAUTHORIZED" };
    }

    return { success: false, error: "Не вдалося редагувати замовлення" };
  }
}

/**
 * Get current NBU exchange rate for USD/UAH
 * Used for displaying estimated UAH price on checkout before order confirmation
 */
export async function getCurrentExchangeRate() {
  try {
    const { rate, date, dateFormatted } = await getExchangeRateInfo();
    return {
      success: true,
      rate,
      date,           // NBU date (DD.MM.YYYY)
      dateFormatted,  // Human-readable date
    };
  } catch (error) {
    console.error("getCurrentExchangeRate error:", error);
    return {
      success: false,
      error: "Не вдалося отримати курс НБУ. Спробуйте пізніше.",
    };
  }
}

/**
 * Get all initial data needed for checkout page in a single request
 * Combines: profile, saved addresses, exchange rate
 * This optimizes the checkout page load from 3+ requests to 1
 */
export async function getCheckoutInitialData() {
  // Run all fetches in parallel on the server
  const [userResult, exchangeRateResult] = await Promise.all([
    getAppUser(),
    getExchangeRateInfo().catch(() => null),
  ]);

  const { appUser, supabaseUser } = userResult;

  // Profile data
  let profile = null;
  if (appUser && supabaseUser) {
    const metadata = supabaseUser.user_metadata || {};
    const googleIdentity = supabaseUser.identities?.find(
      (i) => i.provider === "google"
    )?.identity_data;

    profile = {
      firstName: appUser.firstName || metadata.given_name || googleIdentity?.given_name || "",
      lastName: appUser.lastName || metadata.family_name || googleIdentity?.family_name || "",
      email: appUser.email,
      phone: appUser.phone || "",
    };
  }

  // Saved addresses (only if logged in)
  let addresses = [];
  if (appUser) {
    try {
      const userAddresses = await prisma.address.findMany({
        where: { userId: appUser.id },
        orderBy: [
          { isDefault: "desc" },
          { createdAt: "desc" },
        ],
      });
      addresses = userAddresses.map((addr) => ({
        id: addr.id,
        label: addr.label,
        city: addr.city,
        address: addr.address,
        deliveryMethod: addr.deliveryMethod,
        isDefault: addr.isDefault,
      }));
    } catch (e) {
      console.error("Failed to load addresses:", e);
    }
  }

  // Exchange rate
  let exchangeRate = null;
  if (exchangeRateResult) {
    exchangeRate = {
      rate: exchangeRateResult.rate,
      date: exchangeRateResult.date,
      dateFormatted: exchangeRateResult.dateFormatted,
    };
  }

  return {
    success: true,
    profile,
    addresses,
    exchangeRate,
    isLoggedIn: !!appUser,
  };
}

