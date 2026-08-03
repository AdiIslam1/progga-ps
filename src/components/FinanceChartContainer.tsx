import prisma from "@/lib/prisma";
import FinanceChart from "./FinanceChart";

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

const FinanceChartContainer = async () => {
  const currentYear = new Date().getFullYear();
  const yearStart = new Date(`${currentYear}-01-01`);
  const yearEnd = new Date(`${currentYear + 1}-01-01`);

  const [feeData, expenseData, inventorySales] = await Promise.all([
    prisma.feeCollection.findMany({
      where: { status: "PAID", paidAt: { gte: yearStart, lt: yearEnd } },
      select: { paidAt: true, paidAmount: true },
    }),
    prisma.expense.findMany({
      where: { date: { gte: yearStart, lt: yearEnd } },
      select: { date: true, amount: true },
    }),
    prisma.inventoryMovement.findMany({
      where: { type: "SALE", createdAt: { gte: yearStart, lt: yearEnd } },
      select: { createdAt: true, totalAmount: true },
    }),
  ]);

  const income = new Array(12).fill(0);
  const expense = new Array(12).fill(0);

  feeData.forEach((r) => {
    if (r.paidAt) income[new Date(r.paidAt).getMonth()] += r.paidAmount;
  });
  inventorySales.forEach((r) => {
    income[new Date(r.createdAt).getMonth()] += r.totalAmount;
  });
  expenseData.forEach((r) => {
    expense[new Date(r.date).getMonth()] += r.amount;
  });

  const chartData = MONTHS.map((name, i) => ({
    name,
    income: Math.round(income[i]),
    expense: Math.round(expense[i]),
  }));

  return <FinanceChart data={chartData} />;
};

export default FinanceChartContainer;
