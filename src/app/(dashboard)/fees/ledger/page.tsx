import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth-server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { FeeStatus } from "@prisma/client";

export default async function FeeLedgerPage({
  searchParams,
}: {
  searchParams: { search?: string; status?: string };
}) {
  const { role, userId } = await auth();

  if (!role || !userId) {
    redirect("/");
  }

  // Define database query filters based on role access controls
  let studentIds: string[] = [];

  if (role === "student") {
    studentIds = [userId];
  }

  // Construct search and status filter query for Prisma
  const statusFilter = searchParams.status as FeeStatus | undefined;
  const searchQuery = searchParams.search;

  const query: any = {
    // Scope down collections for parent/student roles
    ...(role !== "admin" ? { studentId: { in: studentIds } } : {}),
    // Apply status filter if active
    ...(statusFilter ? { status: statusFilter } : {}),
    // Apply search query if active
    ...(searchQuery
      ? {
          OR: [
            { receiptNo: { contains: searchQuery, mode: "insensitive" } },
            { name: { contains: searchQuery, mode: "insensitive" } },
            {
              student: {
                OR: [
                  { name: { contains: searchQuery, mode: "insensitive" } },
                  { surname: { contains: searchQuery, mode: "insensitive" } },
                ],
              },
            },
          ],
        }
      : {}),
  };

  // Fetch collections
  const collections = await prisma.feeCollection.findMany({
    where: query,
    include: {
      student: {
        select: {
          id: true,
          name: true,
          surname: true,
          class: { select: { name: true } },
        },
      },
    },
    orderBy: [
      { paidAt: "desc" },
      { id: "desc" },
    ],
  });

  // Calculate high-level financial metrics for the current dashboard scope
  const paidCollections = collections.filter((c) => c.status === FeeStatus.PAID);
  const unpaidCollections = collections.filter((c) => c.status === FeeStatus.UNPAID);

  const totalPaidSum = paidCollections.reduce((sum, c) => sum + c.paidAmount, 0);
  const totalUnpaidSum = unpaidCollections.reduce((sum, c) => sum + c.amount, 0);

  return (
    <div className="p-6 bg-[#f8fafe] min-h-screen flex flex-col gap-6">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-800 tracking-tight">Billing & Payment Ledger</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {role === "admin"
              ? "Comprehensive audit log of cash transactions, outstanding school tuition, and student payments."
              : "Review your student invoices, payment history, and download print-ready receipts."}
          </p>
        </div>
      </div>

      {/* METRICS ROW */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4 relative overflow-hidden">
          <div className="absolute top-0 left-0 bottom-0 w-1 bg-green-500" />
          <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center text-green-500 text-lg">৳</div>
          <div>
            <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">Total Fees Settled</span>
            <h3 className="text-xl font-black text-gray-800 mt-0.5">৳{totalPaidSum.toLocaleString()}</h3>
            <p className="text-[10px] text-gray-400 font-medium mt-0.5">{paidCollections.length} cleared invoices</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4 relative overflow-hidden">
          <div className="absolute top-0 left-0 bottom-0 w-1 bg-amber-500" />
          <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center text-amber-500 text-lg">৳</div>
          <div>
            <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">Outstanding Dues</span>
            <h3 className="text-xl font-black text-gray-800 mt-0.5">৳{totalUnpaidSum.toLocaleString()}</h3>
            <p className="text-[10px] text-gray-400 font-medium mt-0.5">{unpaidCollections.length} pending payments</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4 relative overflow-hidden sm:col-span-2 lg:col-span-1">
          <div className="absolute top-0 left-0 bottom-0 w-1 bg-lamaSky" />
          <div className="w-10 h-10 rounded-full bg-lamaSkyLight flex items-center justify-center text-lamaSky text-lg">🧾</div>
          <div>
            <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">Audit Coverage</span>
            <h3 className="text-xl font-black text-gray-800 mt-0.5">{collections.length}</h3>
            <p className="text-[10px] text-gray-400 font-medium mt-0.5">Total ledger items recorded</p>
          </div>
        </div>
      </div>

      {/* FILTER & SEARCH ROW */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Status Filters */}
        <div className="flex gap-2">
          <Link
            href="/fees/ledger"
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              !statusFilter
                ? "bg-gray-800 text-white shadow-sm"
                : "bg-gray-50 text-gray-500 hover:bg-gray-100"
            }`}
          >
            All Items
          </Link>
          <Link
            href="/fees/ledger?status=PAID"
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              statusFilter === FeeStatus.PAID
                ? "bg-green-600 text-white shadow-sm"
                : "bg-gray-50 text-gray-500 hover:bg-gray-100"
            }`}
          >
            Paid (Receipts)
          </Link>
          <Link
            href="/fees/ledger?status=UNPAID"
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              statusFilter === FeeStatus.UNPAID
                ? "bg-amber-600 text-white shadow-sm"
                : "bg-gray-50 text-gray-500 hover:bg-gray-100"
            }`}
          >
            Unpaid (Outstanding)
          </Link>
        </div>

        {/* Text Search Form */}
        <form className="flex gap-2 max-w-sm w-full">
          <input
            type="text"
            name="search"
            placeholder="Search by student, bill or receipt..."
            defaultValue={searchQuery || ""}
            className="ring-1 ring-gray-200 p-2 rounded-xl text-xs w-full outline-none focus:ring-2 focus:ring-lamaSky transition-all placeholder:text-gray-300"
          />
          {statusFilter && <input type="hidden" name="status" value={statusFilter} />}
          <button
            type="submit"
            className="bg-lamaSky hover:bg-[#38b1d8] text-white font-bold py-2 px-4 rounded-xl text-xs transition-colors shadow-sm"
          >
            Filter
          </button>
        </form>
      </div>

      {/* LEDGER DATA TABLE */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
        {collections.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center gap-3">
            <span className="text-2xl">📋</span>
            <p className="text-gray-500 font-bold text-sm">No ledger statements found</p>
            <p className="text-xs text-gray-400">There are no records matching your current filter settings.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50 text-gray-500 font-bold uppercase text-[9px] tracking-wider">
                  <th className="p-4">Receipt / Invoice Ref</th>
                  <th className="p-4">Student Profile</th>
                  <th className="p-4">Class</th>
                  <th className="p-4">Fee Description</th>
                  <th className="p-4">Cycle</th>
                  <th className="p-4">Amount</th>
                  <th className="p-4">Settlement Date</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Receipt Details</th>
                </tr>
              </thead>
              <tbody>
                {collections.map((item) => (
                  <tr
                    key={item.id}
                    className="border-b border-gray-50 text-gray-700 hover:bg-slate-50/50 transition-colors"
                  >
                    <td className="p-4 font-mono font-semibold text-gray-500">
                      {item.receiptNo || "N/A"}
                    </td>
                    <td className="p-4 font-bold text-gray-800">
                      {item.student.name} {item.student.surname}
                    </td>
                    <td className="p-4 font-medium text-gray-400">
                      Class {item.student.class?.name || "Unassigned"}
                    </td>
                    <td className="p-4 font-bold text-gray-800">
                      {item.name}
                    </td>
                    <td className="p-4 font-semibold text-gray-400">
                      {item.month || "One-time Charge"}
                    </td>
                    <td className="p-4 font-extrabold text-gray-900">
                      ৳{item.amount.toLocaleString()}
                    </td>
                    <td className="p-4 font-medium text-gray-400">
                      {item.paidAt
                        ? new Date(item.paidAt).toLocaleDateString("en-GB", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })
                        : "Outstanding"}
                    </td>
                    <td className="p-4">
                      <span
                        className={`text-[9px] uppercase font-black px-2 py-0.5 rounded-full ${
                          item.status === FeeStatus.PAID
                            ? "bg-green-50 text-green-600"
                            : "bg-amber-50 text-amber-600"
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      {item.status === FeeStatus.PAID ? (
                        <Link
                          href={`/fees/receipt/${item.receiptNo}`}
                          className="bg-lamaSkyLight hover:bg-lamaSky/20 text-lamaSky text-[10px] font-bold py-1.5 px-3 rounded-full transition-colors"
                        >
                          View & Print ⎙
                        </Link>
                      ) : (
                        <span className="text-[10px] text-gray-300 font-bold py-1.5 px-3">
                          Payable
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
