import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth-server";
import { redirect } from "next/navigation";
import FinanceChart from "@/components/FinanceChart";
import ExpenseForm from "./ExpenseForm";
import DeleteExpenseBtn from "./DeleteExpenseBtn";

const SCHOOL_TIME_ZONE = "Asia/Dhaka";

const getDhakaYear = (date: Date) =>
  Number(
    new Intl.DateTimeFormat("en-US", {
      timeZone: SCHOOL_TIME_ZONE,
      year: "numeric",
    }).format(date)
  );

const getDhakaMonthIndex = (date: Date) =>
  Number(
    new Intl.DateTimeFormat("en-US", {
      timeZone: SCHOOL_TIME_ZONE,
      month: "numeric",
    }).format(date)
  ) - 1;

const getDhakaYearStartUtc = (year: number) =>
  new Date(Date.UTC(year, 0, 1) - 6 * 60 * 60 * 1000);

export default async function FinanceReportsPage() {
  const { role } = await auth();

  // Route protection - only Admin can view financial aggregates and expense forms
  if (role !== "admin") {
    redirect("/");
  }

  // Use the school's Dhaka calendar year, regardless of the deployment server's timezone.
  const currentYear = getDhakaYear(new Date());
  const startOfYear = getDhakaYearStartUtc(currentYear);
  const startOfNextYear = getDhakaYearStartUtc(currentYear + 1);

  // Fetch PAID collections this year
  const paidCollections = await prisma.feeCollection.findMany({
    where: {
      status: "PAID",
        paidAt: {
          gte: startOfYear,
          lt: startOfNextYear,
      },
    },
  });

  const inventorySales = await prisma.inventoryMovement.findMany({
    where: {
      type: "SALE",
        createdAt: {
          gte: startOfYear,
          lt: startOfNextYear,
      },
    },
  });

  // Fetch all unpaid collections (outstanding dues)
  const unpaidCollections = await prisma.feeCollection.findMany({
    where: {
      status: "UNPAID",
    },
  });

  // Fetch school operational expenses this year
  const expenses = await prisma.expense.findMany({
    where: {
        date: {
          gte: startOfYear,
          lt: startOfNextYear,
      },
    },
    orderBy: {
      date: "desc",
    },
  });

  // Calculations
  const feeIncome = paidCollections.reduce((sum, item) => sum + item.paidAmount, 0);
  const inventoryIncome = inventorySales.reduce((sum, item) => sum + item.totalAmount, 0);
  const totalIncome = feeIncome + inventoryIncome;
  const totalExpenses = expenses.reduce((sum, item) => sum + item.amount, 0);
  const currentBalance = totalIncome - totalExpenses;
  const totalDues = unpaidCollections.reduce((sum, item) => sum + item.amount, 0);

  // 12-Month Chart Aggregation
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  
  const chartData = months.map((m) => ({
    name: m,
    income: 0,
    expense: 0,
  }));

  // Aggregate collections by month index
  paidCollections.forEach((c) => {
    if (c.paidAt) {
      const monthIdx = getDhakaMonthIndex(c.paidAt);
      if (monthIdx >= 0 && monthIdx < 12) {
        chartData[monthIdx].income += c.paidAmount;
      }
    }
  });

  inventorySales.forEach((sale) => {
    const monthIdx = getDhakaMonthIndex(sale.createdAt);
    if (monthIdx >= 0 && monthIdx < 12) {
      chartData[monthIdx].income += sale.totalAmount;
    }
  });

  // Aggregate expenses by month index
  expenses.forEach((e) => {
    const monthIdx = getDhakaMonthIndex(e.date);
    if (monthIdx >= 0 && monthIdx < 12) {
      chartData[monthIdx].expense += e.amount;
    }
  });

  return (
    <div className="p-6 bg-[#f8fafe] min-h-screen flex flex-col gap-6">
      {/* HEADER SECTION */}
      <div>
        <h1 className="text-2xl font-extrabold text-gray-800 tracking-tight">Finance & Cashflow Reports</h1>
        <p className="text-sm text-gray-500 mt-0.5">Live monitoring of standard fee income vs operational expenditures for the academic year {currentYear}.</p>
      </div>

      {/* METRICS ROW */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Income */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4 relative overflow-hidden">
          <div className="absolute top-0 left-0 bottom-0 w-1 bg-green-500" />
          <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center text-green-500 text-lg">৳</div>
          <div>
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Total Income</span>
            <h3 className="text-lg font-black text-gray-800 mt-0.5">৳{totalIncome.toLocaleString()}</h3>
            <p className="text-[9px] text-gray-400 font-medium">Fees + inventory sales</p>
          </div>
        </div>

        {/* Total Expenses */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4 relative overflow-hidden">
          <div className="absolute top-0 left-0 bottom-0 w-1 bg-purple-500" />
          <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center text-purple-500 text-lg">৳</div>
          <div>
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Total Expenses</span>
            <h3 className="text-lg font-black text-gray-800 mt-0.5">৳{totalExpenses.toLocaleString()}</h3>
            <p className="text-[9px] text-gray-400 font-medium">Logged expenditures</p>
          </div>
        </div>

        {/* Current Balance */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4 relative overflow-hidden">
          <div className={`absolute top-0 left-0 bottom-0 w-1 ${currentBalance >= 0 ? "bg-lamaSky" : "bg-red-500"}`} />
          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${
            currentBalance >= 0 ? "bg-lamaSkyLight text-lamaSky" : "bg-red-50 text-red-500"
          }`}>
            ৳
          </div>
          <div>
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Net Balance</span>
            <h3 className={`text-lg font-black mt-0.5 ${currentBalance >= 0 ? "text-gray-800" : "text-red-600"}`}>
              ৳{currentBalance.toLocaleString()}
            </h3>
            <p className="text-[9px] text-gray-400 font-medium">
              {currentBalance >= 0 ? "Surplus Cash" : "Deficit Balance"}
            </p>
          </div>
        </div>

        {/* Outstanding Dues */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4 relative overflow-hidden">
          <div className="absolute top-0 left-0 bottom-0 w-1 bg-amber-500" />
          <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center text-amber-500 text-lg">৳</div>
          <div>
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Unpaid Tuition</span>
            <h3 className="text-lg font-black text-gray-800 mt-0.5">৳{totalDues.toLocaleString()}</h3>
            <p className="text-[9px] text-gray-400 font-medium">Outstanding student invoices</p>
          </div>
        </div>
      </div>

      {/* CHART & DETAILS GRID */}
      <div className="grid gap-6 lg:grid-cols-3">
        
        {/* CHART AND EXPENSE TABLE */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* FINANCE CHART (TAKES Dynamic Aggregations) */}
          <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm h-96">
            <FinanceChart data={chartData} />
          </div>

          {/* RECENT EXPENSES TABULAR LEDGER */}
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col gap-4">
            <div>
              <h2 className="text-sm font-bold text-gray-800">Operational Expenditure Logs</h2>
              <p className="text-xs text-gray-500 mt-0.5">Detailed records of cash payouts made during {currentYear}.</p>
            </div>

            {expenses.length === 0 ? (
              <p className="text-xs text-gray-400 italic py-6 text-center">No school expenditures logged yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50 text-gray-500 font-bold uppercase text-[9px] tracking-wider">
                      <th className="p-3">Date</th>
                      <th className="p-3">Title / Description</th>
                      <th className="p-3">Category</th>
                      <th className="p-3">Amount</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {expenses.map((exp) => (
                      <tr key={exp.id} className="border-b border-gray-50 text-gray-700 hover:bg-slate-50/50 transition-colors">
                        <td className="p-3 font-semibold text-gray-400">
                          {new Date(exp.date).toLocaleDateString("en-GB", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </td>
                        <td className="p-3 font-bold text-gray-800">{exp.title}</td>
                        <td className="p-3 font-medium text-gray-400">
                          <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-[9px] uppercase font-bold">
                            {exp.category}
                          </span>
                        </td>
                        <td className="p-3 font-extrabold text-gray-900">৳{exp.amount.toLocaleString()}</td>
                        <td className="p-3 text-right">
                          <DeleteExpenseBtn id={exp.id} title={exp.title} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* EXPENSE INLINE FORM SIDEBAR */}
        <div className="flex flex-col gap-6">
          <ExpenseForm />

          {/* HELP BANNER */}
          <div className="bg-gradient-to-br from-[#f8fcf5] to-[#fcfefb] p-6 rounded-2xl border border-green-100 shadow-sm flex flex-col gap-3">
            <h3 className="text-xs font-bold text-green-800 uppercase tracking-wider flex items-center gap-1.5">
              📈 Live Ledger Audit Policy
            </h3>
            <p className="text-xs text-green-900/80 leading-relaxed">
              Expenditures directly affect the school&apos;s liquidity balances. All logging actions and cash fee collections are performed under strict secure server validation blocks, protecting database consistency during active auditing.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
