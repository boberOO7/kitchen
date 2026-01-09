"use server";

import { prisma } from "@/lib/prisma";
import { requireAppUser } from "@/lib/auth";

export interface AddressData {
  id: string;
  label: string | null;
  city: string;
  address: string;
  deliveryMethod: string;
  isDefault: boolean;
}

export interface CreateAddressInput {
  label?: string;
  city: string;
  address: string;
  deliveryMethod: string;
  isDefault?: boolean;
}

export interface UpdateAddressInput {
  label?: string;
  city?: string;
  address?: string;
  deliveryMethod?: string;
  isDefault?: boolean;
}

/**
 * Get all addresses for the current user
 */
export async function getUserAddresses(): Promise<{
  success: boolean;
  addresses?: AddressData[];
  error?: string;
}> {
  try {
    const { appUser } = await requireAppUser();

    const addresses = await prisma.address.findMany({
      where: { userId: appUser.id },
      orderBy: [
        { isDefault: "desc" }, // Default address first
        { createdAt: "desc" },
      ],
    });

    return {
      success: true,
      addresses: addresses.map((addr) => ({
        id: addr.id,
        label: addr.label,
        city: addr.city,
        address: addr.address,
        deliveryMethod: addr.deliveryMethod,
        isDefault: addr.isDefault,
      })),
    };
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED") {
      return { success: false, error: "UNAUTHORIZED" };
    }
    console.error("getUserAddresses error:", error);
    return { success: false, error: "Не вдалося завантажити адреси" };
  }
}

/**
 * Get the default address for checkout prefill
 */
export async function getDefaultAddress(): Promise<{
  success: boolean;
  address?: AddressData | null;
  error?: string;
}> {
  try {
    const { appUser } = await requireAppUser();

    const address = await prisma.address.findFirst({
      where: {
        userId: appUser.id,
        isDefault: true,
      },
    });

    if (!address) {
      // If no default, get the most recent address
      const recentAddress = await prisma.address.findFirst({
        where: { userId: appUser.id },
        orderBy: { createdAt: "desc" },
      });

      return {
        success: true,
        address: recentAddress
          ? {
              id: recentAddress.id,
              label: recentAddress.label,
              city: recentAddress.city,
              address: recentAddress.address,
              deliveryMethod: recentAddress.deliveryMethod,
              isDefault: recentAddress.isDefault,
            }
          : null,
      };
    }

    return {
      success: true,
      address: {
        id: address.id,
        label: address.label,
        city: address.city,
        address: address.address,
        deliveryMethod: address.deliveryMethod,
        isDefault: address.isDefault,
      },
    };
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED") {
      return { success: false, error: "UNAUTHORIZED" };
    }
    console.error("getDefaultAddress error:", error);
    return { success: false, error: "Не вдалося завантажити адресу" };
  }
}

/**
 * Create a new address
 */
export async function createAddress(input: CreateAddressInput): Promise<{
  success: boolean;
  address?: AddressData;
  error?: string;
}> {
  try {
    const { appUser } = await requireAppUser();

    // Validate required fields
    if (!input.city?.trim()) {
      return { success: false, error: "Вкажіть місто" };
    }
    if (!input.address?.trim()) {
      return { success: false, error: "Вкажіть адресу або відділення" };
    }
    if (!input.deliveryMethod) {
      return { success: false, error: "Виберіть спосіб доставки" };
    }

    // If this is set as default, unset other defaults
    if (input.isDefault) {
      await prisma.address.updateMany({
        where: { userId: appUser.id, isDefault: true },
        data: { isDefault: false },
      });
    }

    // If this is the first address, make it default
    const existingCount = await prisma.address.count({
      where: { userId: appUser.id },
    });
    const shouldBeDefault = input.isDefault || existingCount === 0;

    const address = await prisma.address.create({
      data: {
        userId: appUser.id,
        label: input.label?.trim() || null,
        city: input.city.trim(),
        address: input.address.trim(),
        deliveryMethod: input.deliveryMethod,
        isDefault: shouldBeDefault,
      },
    });

    return {
      success: true,
      address: {
        id: address.id,
        label: address.label,
        city: address.city,
        address: address.address,
        deliveryMethod: address.deliveryMethod,
        isDefault: address.isDefault,
      },
    };
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED") {
      return { success: false, error: "UNAUTHORIZED" };
    }
    console.error("createAddress error:", error);
    return { success: false, error: "Не вдалося створити адресу" };
  }
}

/**
 * Update an existing address
 */
export async function updateAddress(
  id: string,
  input: UpdateAddressInput
): Promise<{
  success: boolean;
  address?: AddressData;
  error?: string;
}> {
  try {
    const { appUser } = await requireAppUser();

    // Verify ownership
    const existing = await prisma.address.findFirst({
      where: { id, userId: appUser.id },
    });

    if (!existing) {
      return { success: false, error: "Адресу не знайдено" };
    }

    // If setting as default, unset other defaults
    if (input.isDefault) {
      await prisma.address.updateMany({
        where: { userId: appUser.id, isDefault: true, id: { not: id } },
        data: { isDefault: false },
      });
    }

    const updateData: any = {};
    if (input.label !== undefined) updateData.label = input.label?.trim() || null;
    if (input.city !== undefined) updateData.city = input.city.trim();
    if (input.address !== undefined) updateData.address = input.address.trim();
    if (input.deliveryMethod !== undefined) updateData.deliveryMethod = input.deliveryMethod;
    if (input.isDefault !== undefined) updateData.isDefault = input.isDefault;

    const address = await prisma.address.update({
      where: { id },
      data: updateData,
    });

    return {
      success: true,
      address: {
        id: address.id,
        label: address.label,
        city: address.city,
        address: address.address,
        deliveryMethod: address.deliveryMethod,
        isDefault: address.isDefault,
      },
    };
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED") {
      return { success: false, error: "UNAUTHORIZED" };
    }
    console.error("updateAddress error:", error);
    return { success: false, error: "Не вдалося оновити адресу" };
  }
}

/**
 * Delete an address
 */
export async function deleteAddress(id: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const { appUser } = await requireAppUser();

    // Verify ownership
    const existing = await prisma.address.findFirst({
      where: { id, userId: appUser.id },
    });

    if (!existing) {
      return { success: false, error: "Адресу не знайдено" };
    }

    await prisma.address.delete({ where: { id } });

    // If deleted address was default, make another one default
    if (existing.isDefault) {
      const nextAddress = await prisma.address.findFirst({
        where: { userId: appUser.id },
        orderBy: { createdAt: "desc" },
      });

      if (nextAddress) {
        await prisma.address.update({
          where: { id: nextAddress.id },
          data: { isDefault: true },
        });
      }
    }

    return { success: true };
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED") {
      return { success: false, error: "UNAUTHORIZED" };
    }
    console.error("deleteAddress error:", error);
    return { success: false, error: "Не вдалося видалити адресу" };
  }
}

/**
 * Set an address as default
 */
export async function setDefaultAddress(id: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const { appUser } = await requireAppUser();

    // Verify ownership
    const existing = await prisma.address.findFirst({
      where: { id, userId: appUser.id },
    });

    if (!existing) {
      return { success: false, error: "Адресу не знайдено" };
    }

    // Unset all other defaults
    await prisma.address.updateMany({
      where: { userId: appUser.id, isDefault: true },
      data: { isDefault: false },
    });

    // Set this one as default
    await prisma.address.update({
      where: { id },
      data: { isDefault: true },
    });

    return { success: true };
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED") {
      return { success: false, error: "UNAUTHORIZED" };
    }
    console.error("setDefaultAddress error:", error);
    return { success: false, error: "Не вдалося встановити адресу за замовчуванням" };
  }
}

