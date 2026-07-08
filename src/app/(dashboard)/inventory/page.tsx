import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth-server";
import { redirect } from "next/navigation";
import InventoryPortal from "./InventoryPortal";

export default async function InventoryPage() {
  const { role } = await auth();
  if (role !== "admin") redirect("/");

  const [items, movements, saleMovements] = await Promise.all([
    prisma.inventoryItem.findMany({
      orderBy: [{ isActive: "desc" }, { name: "asc" }],
    }),
    prisma.inventoryMovement.findMany({
      take: 50,
      orderBy: { createdAt: "desc" },
      include: {
        item: {
          select: {
            id: true,
            name: true,
            category: true,
          },
        },
      },
    }),
    prisma.inventoryMovement.findMany({
      where: { type: "SALE" },
      select: {
        quantity: true,
        unitBuyingPrice: true,
        totalAmount: true,
      },
    }),
  ]);

  const activeItems = items.filter((item) => item.isActive);
  const totalStockValue = activeItems.reduce(
    (sum, item) => sum + item.quantityInStock * item.buyingPrice,
    0
  );
  const expectedSalesValue = activeItems.reduce(
    (sum, item) => sum + item.quantityInStock * item.sellingPrice,
    0
  );
  const totalSalesRevenue = saleMovements
    .reduce((sum, movement) => sum + movement.totalAmount, 0);
  const lowStockCount = activeItems.filter((item) => item.quantityInStock <= 5).length;

  const totalSalesProfit = saleMovements
    .reduce(
      (sum, movement) =>
        sum + movement.totalAmount - movement.quantity * (movement.unitBuyingPrice || 0),
      0
    );

  return (
    <InventoryPortal
      items={items.map((item) => ({
        id: item.id,
        name: item.name,
        category: item.category,
        description: item.description,
        buyingPrice: item.buyingPrice,
        sellingPrice: item.sellingPrice,
        quantityInStock: item.quantityInStock,
        isActive: item.isActive,
        createdAt: item.createdAt.toISOString(),
        updatedAt: item.updatedAt.toISOString(),
      }))}
      movements={movements.map((movement) => ({
        id: movement.id,
        itemId: movement.itemId,
        itemName: movement.item.name,
        itemCategory: movement.item.category,
        type: movement.type,
        quantity: movement.quantity,
        unitBuyingPrice: movement.unitBuyingPrice,
        unitSellingPrice: movement.unitSellingPrice,
        totalAmount: movement.totalAmount,
        note: movement.note,
        createdAt: movement.createdAt.toISOString(),
      }))}
      summary={{
        totalItems: activeItems.length,
        totalStockValue,
        expectedSalesValue,
        totalSalesRevenue,
        totalSalesProfit,
        lowStockCount,
      }}
    />
  );
}
