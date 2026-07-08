"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth-server";
import prisma from "@/lib/prisma";

type ActionResult = {
  success: boolean;
  error?: boolean;
  message?: string;
};

type InventoryItemInput = {
  name: string;
  category?: string;
  description?: string;
  buyingPrice: number;
  sellingPrice: number;
};

const requireAdmin = async () => {
  const { role } = await auth();
  return role === "admin";
};

const cleanText = (value?: string) => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
};

const validatePositiveNumber = (value: number, label: string) => {
  if (!Number.isFinite(value) || value <= 0) {
    return `${label} must be greater than 0.`;
  }
  return null;
};

const revalidateInventoryViews = () => {
  revalidatePath("/inventory");
  revalidatePath("/fees/reports");
  revalidatePath("/");
};

export const createInventoryItem = async (
  data: InventoryItemInput
): Promise<ActionResult> => {
  try {
    if (!(await requireAdmin())) {
      return { success: false, error: true, message: "Only admins can manage inventory." };
    }

    const name = cleanText(data.name);
    if (!name) {
      return { success: false, error: true, message: "Item name is required." };
    }

    const buyingError = validatePositiveNumber(data.buyingPrice, "Buying price");
    const sellingError = validatePositiveNumber(data.sellingPrice, "Selling price");
    const validationError = buyingError || sellingError;
    if (validationError) {
      return { success: false, error: true, message: validationError };
    }

    await prisma.inventoryItem.create({
      data: {
        name,
        category: cleanText(data.category),
        description: cleanText(data.description),
        buyingPrice: data.buyingPrice,
        sellingPrice: data.sellingPrice,
      },
    });

    revalidatePath("/inventory");
    return { success: true };
  } catch (err) {
    console.error(err);
    return { success: false, error: true, message: "Failed to create inventory item." };
  }
};

export const updateInventoryItem = async (
  id: number,
  data: InventoryItemInput
): Promise<ActionResult> => {
  try {
    if (!(await requireAdmin())) {
      return { success: false, error: true, message: "Only admins can manage inventory." };
    }

    const name = cleanText(data.name);
    if (!name) {
      return { success: false, error: true, message: "Item name is required." };
    }

    const buyingError = validatePositiveNumber(data.buyingPrice, "Buying price");
    const sellingError = validatePositiveNumber(data.sellingPrice, "Selling price");
    const validationError = buyingError || sellingError;
    if (validationError) {
      return { success: false, error: true, message: validationError };
    }

    await prisma.inventoryItem.update({
      where: { id },
      data: {
        name,
        category: cleanText(data.category),
        description: cleanText(data.description),
        buyingPrice: data.buyingPrice,
        sellingPrice: data.sellingPrice,
      },
    });

    revalidatePath("/inventory");
    return { success: true };
  } catch (err) {
    console.error(err);
    return { success: false, error: true, message: "Failed to update inventory item." };
  }
};

export const setInventoryItemActive = async (
  id: number,
  isActive: boolean
): Promise<ActionResult> => {
  try {
    if (!(await requireAdmin())) {
      return { success: false, error: true, message: "Only admins can manage inventory." };
    }

    await prisma.inventoryItem.update({
      where: { id },
      data: { isActive },
    });

    revalidatePath("/inventory");
    return { success: true };
  } catch (err) {
    console.error(err);
    return { success: false, error: true, message: "Failed to update item status." };
  }
};

export const addInventoryStock = async (
  itemId: number,
  data: { quantity: number; unitBuyingPrice?: number; note?: string }
): Promise<ActionResult> => {
  try {
    if (!(await requireAdmin())) {
      return { success: false, error: true, message: "Only admins can manage inventory." };
    }

    if (!Number.isInteger(data.quantity) || data.quantity <= 0) {
      return { success: false, error: true, message: "Purchase quantity must be a positive whole number." };
    }

    await prisma.$transaction(async (tx) => {
      const item = await tx.inventoryItem.findUnique({ where: { id: itemId } });
      if (!item || !item.isActive) {
        throw new Error("Item is not available.");
      }

      const unitBuyingPrice = data.unitBuyingPrice ?? item.buyingPrice;
      const priceError = validatePositiveNumber(unitBuyingPrice, "Buying price");
      if (priceError) {
        throw new Error(priceError);
      }

      const totalAmount = data.quantity * unitBuyingPrice;

      await tx.inventoryItem.update({
        where: { id: itemId },
        data: {
          buyingPrice: unitBuyingPrice,
          quantityInStock: { increment: data.quantity },
        },
      });

      await tx.inventoryMovement.create({
        data: {
          itemId,
          type: "PURCHASE",
          quantity: data.quantity,
          unitBuyingPrice,
          totalAmount,
          note: cleanText(data.note),
        },
      });

      await tx.expense.create({
        data: {
          title: `Inventory purchase: ${item.name} (${data.quantity})`,
          amount: totalAmount,
          category: "Inventory",
        },
      });
    });

    revalidateInventoryViews();
    return { success: true };
  } catch (err: any) {
    console.error(err);
    return {
      success: false,
      error: true,
      message: err?.message || "Failed to add inventory stock.",
    };
  }
};

export const recordInventorySale = async (
  itemId: number,
  data: { quantity: number; unitSellingPrice?: number; note?: string }
): Promise<ActionResult> => {
  try {
    if (!(await requireAdmin())) {
      return { success: false, error: true, message: "Only admins can manage inventory." };
    }

    if (!Number.isInteger(data.quantity) || data.quantity <= 0) {
      return { success: false, error: true, message: "Sale quantity must be a positive whole number." };
    }

    await prisma.$transaction(async (tx) => {
      const item = await tx.inventoryItem.findUnique({ where: { id: itemId } });
      if (!item || !item.isActive) {
        throw new Error("Item is not available.");
      }

      const unitSellingPrice = data.unitSellingPrice ?? item.sellingPrice;
      const priceError = validatePositiveNumber(unitSellingPrice, "Selling price");
      if (priceError) {
        throw new Error(priceError);
      }

      const updated = await tx.inventoryItem.updateMany({
        where: {
          id: itemId,
          isActive: true,
          quantityInStock: { gte: data.quantity },
        },
        data: {
          quantityInStock: { decrement: data.quantity },
        },
      });

      if (updated.count === 0) {
        throw new Error("Not enough stock available for this sale.");
      }

      await tx.inventoryMovement.create({
        data: {
          itemId,
          type: "SALE",
          quantity: data.quantity,
          unitBuyingPrice: item.buyingPrice,
          unitSellingPrice,
          totalAmount: data.quantity * unitSellingPrice,
          note: cleanText(data.note),
        },
      });
    });

    revalidateInventoryViews();
    return { success: true };
  } catch (err: any) {
    console.error(err);
    return {
      success: false,
      error: true,
      message: err?.message || "Failed to record inventory sale.",
    };
  }
};

export const adjustInventoryStock = async (
  itemId: number,
  data: { quantityDelta: number; note?: string }
): Promise<ActionResult> => {
  try {
    if (!(await requireAdmin())) {
      return { success: false, error: true, message: "Only admins can manage inventory." };
    }

    if (!Number.isInteger(data.quantityDelta) || data.quantityDelta === 0) {
      return { success: false, error: true, message: "Adjustment must be a non-zero whole number." };
    }

    await prisma.$transaction(async (tx) => {
      const item = await tx.inventoryItem.findUnique({ where: { id: itemId } });
      if (!item || !item.isActive) {
        throw new Error("Item is not available.");
      }

      const updated = await tx.inventoryItem.updateMany({
        where: {
          id: itemId,
          isActive: true,
          ...(data.quantityDelta < 0
            ? { quantityInStock: { gte: Math.abs(data.quantityDelta) } }
            : {}),
        },
        data: {
          quantityInStock:
            data.quantityDelta > 0
              ? { increment: data.quantityDelta }
              : { decrement: Math.abs(data.quantityDelta) },
        },
      });

      if (updated.count === 0) {
        throw new Error("Adjustment would make stock negative.");
      }

      await tx.inventoryMovement.create({
        data: {
          itemId,
          type: "ADJUSTMENT",
          quantity: data.quantityDelta,
          totalAmount: 0,
          note: cleanText(data.note),
        },
      });
    });

    revalidatePath("/inventory");
    return { success: true };
  } catch (err: any) {
    console.error(err);
    return {
      success: false,
      error: true,
      message: err?.message || "Failed to adjust inventory stock.",
    };
  }
};
