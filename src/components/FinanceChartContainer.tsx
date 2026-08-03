import prisma from "@/lib/prisma";
import FinanceChart from "./FinanceChart";
import {
  getSchoolMonthIndex,
  getSchoolYear,
  getSchoolYearStartUtc,
} from "@/lib/schoolDate";

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

const FinanceChartContainer = async () => {
  const currentYear = getSchoolYear();
  const yearStart = getSchoolYearStartUtc(currentYear);
  const yearEnd = getSchoolYearStartUtc(currentYear + 1);

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
    if (r.paidAt) income[getSchoolMonthIndex(r.paidAt)] += r.paidAmount;
  });
  inventorySales.forEach((r) => {
    income[getSchoolMonthIndex(r.createdAt)] += r.totalAmount;
  });
  expenseData.forEach((r) => {
    expense[getSchoolMonthIndex(r.date)] += r.amount;
  });

  const chartData = MONTHS.map((name, i) => ({
    name,
    income: Math.round(income[i]),
    expense: Math.round(expense[i]),
  }));

  return <FinanceChart data={chartData} />;
};

export default FinanceChartContainer;
