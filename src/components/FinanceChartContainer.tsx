import prisma from "@/lib/prisma";
import FinanceChart from "./FinanceChart";

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

const FinanceChartContainer = async () => {
  const currentYear = new Date().getFullYear();
  const yearStart = new Date(`${currentYear}-01-01`);
  const yearEnd = new Date(`${currentYear + 1}-01-01`);

  const [feeData, salaryData] = await Promise.all([
    prisma.feeCollection.findMany({
      where: { status: "PAID", paidAt: { gte: yearStart, lt: yearEnd } },
      select: { paidAt: true, paidAmount: true },
    }),
    prisma.salaryCollection.findMany({
      where: { status: "PAID", paidAt: { gte: yearStart, lt: yearEnd } },
      select: { paidAt: true, paidAmount: true },
    }),
  ]);

  const income = new Array(12).fill(0);
  const expense = new Array(12).fill(0);

  feeData.forEach((r) => {
    if (r.paidAt) income[new Date(r.paidAt).getMonth()] += r.paidAmount;
  });
  salaryData.forEach((r) => {
    if (r.paidAt) expense[new Date(r.paidAt).getMonth()] += r.paidAmount;
  });

  const chartData = MONTHS.map((name, i) => ({
    name,
    income: Math.round(income[i]),
    expense: Math.round(expense[i]),
  }));

  return <FinanceChart data={chartData} />;
};

export default FinanceChartContainer;
