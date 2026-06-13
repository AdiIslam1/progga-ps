"use client";

import { processSalaryPayment } from "@/lib/salaryActions";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "react-toastify";

interface SalaryItem {
  id: number;
  name: string;
  amount: number;
  month: string;
  status: "PAID" | "UNPAID";
}

interface PaidSalaryItem {
  id: number;
  name: string;
  paidAmount: number;
  month: string;
  paidAt: Date | string | null;
  receiptNo: string | null;
}

interface PayrollPortalProps {
  teacherId: string;
  unpaidSalaries: SalaryItem[];
  paidSalaries: PaidSalaryItem[];
  cashierUsername: string;
}

export default function PayrollPortal({
  teacherId,
  unpaidSalaries,
  paidSalaries,
  cashierUsername,
}: PayrollPortalProps) {
  const router = useRouter();
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);

  const toggleSelect = (id: number) =>
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );

  const selectAll = () =>
    setSelectedIds(
      selectedIds.length === unpaidSalaries.length ? [] : unpaidSalaries.map((s) => s.id)
    );

  const subtotal = unpaidSalaries
    .filter((s) => selectedIds.includes(s.id))
    .reduce((sum, s) => sum + s.amount, 0);

  const handleConfirmPayment = async () => {
    if (selectedIds.length === 0) {
      toast.error("Select at least one salary record.");
      return;
    }
    setLoading(true);
    try {
      const res = await processSalaryPayment(teacherId, selectedIds, cashierUsername);
      if (res.success) {
        toast.success(`Salary paid! Receipt ${res.receiptNo} generated.`);
        setSelectedIds([]);
        router.refresh();
      } else {
        toast.error(res.message || "Failed to process payment.");
      }
    } catch {
      toast.error("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* OUTSTANDING SALARIES */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
          <div>
            <h2 className="text-sm font-bold text-gray-800">Unpaid Salaries</h2>
            <p className="text-[11px] text-gray-400 mt-0.5">
              {unpaidSalaries.length === 0
                ? "All salaries settled."
                : `${unpaidSalaries.length} unpaid record${unpaidSalaries.length !== 1 ? "s" : ""}`}
            </p>
          </div>
          {unpaidSalaries.length > 0 && (
            <button
              onClick={selectAll}
              className="text-xs text-lamaSky hover:text-[#38b1d8] font-bold transition-colors"
            >
              {selectedIds.length === unpaidSalaries.length ? "Deselect All" : "Select All"}
            </button>
          )}
        </div>

        {unpaidSalaries.length === 0 ? (
          <div className="py-10 flex flex-col items-center gap-2">
            <div className="w-9 h-9 rounded-full bg-green-50 flex items-center justify-center text-green-500 text-lg">✓</div>
            <p className="text-xs text-gray-400 font-semibold">No outstanding salaries</p>
          </div>
        ) : (
          <>
            <div className="divide-y divide-gray-50">
              {unpaidSalaries.map((sal) => {
                const isSelected = selectedIds.includes(sal.id);
                return (
                  <div
                    key={sal.id}
                    onClick={() => toggleSelect(sal.id)}
                    className={`flex items-center justify-between px-5 py-3.5 cursor-pointer select-none transition-colors ${
                      isSelected ? "bg-[#f3fcff]" : "hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-5 h-5 rounded-full border flex items-center justify-center flex-shrink-0 transition-all ${
                          isSelected ? "bg-lamaSky border-lamaSky" : "border-gray-300 bg-white"
                        }`}
                      >
                        {isSelected && (
                          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-700">{sal.name}</p>
                        <p className="text-[10px] text-gray-400">Period: {sal.month}</p>
                      </div>
                    </div>
                    <span className="text-sm font-extrabold text-gray-800">
                      ৳{sal.amount.toLocaleString()}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="px-5 py-4 border-t border-gray-100 bg-gray-50/50 flex flex-col gap-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500 text-xs">
                  {selectedIds.length} item{selectedIds.length !== 1 ? "s" : ""} selected
                </span>
                <span className="font-extrabold text-gray-900">
                  <span className="text-sm text-lamaSky font-bold">৳</span>
                  {subtotal.toLocaleString()}
                </span>
              </div>

              <button
                onClick={handleConfirmPayment}
                disabled={loading || selectedIds.length === 0}
                className="w-full bg-lamaSky hover:bg-[#38b1d8] text-white font-bold py-3 px-4 rounded-xl transition-all text-sm shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Processing…
                  </>
                ) : (
                  "Confirm Salary Payment"
                )}
              </button>
            </div>
          </>
        )}
      </div>

      {/* PAYMENT HISTORY */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
        <div className="px-5 py-4 border-b border-gray-50">
          <h2 className="text-sm font-bold text-gray-800">Payment History</h2>
          <p className="text-[11px] text-gray-400 mt-0.5">
            {paidSalaries.length === 0
              ? "No payments recorded yet."
              : `${paidSalaries.length} paid transaction${paidSalaries.length !== 1 ? "s" : ""}`}
          </p>
        </div>

        {paidSalaries.length === 0 ? (
          <div className="py-10 flex flex-col items-center gap-2">
            <p className="text-xs text-gray-400">No payment history yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {paidSalaries.map((sal) => (
              <div
                key={sal.id}
                className="flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                    <svg className="w-3 h-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-700">{sal.name}</p>
                    <p className="text-[10px] text-gray-400">
                      Period: {sal.month}
                      {sal.paidAt
                        ? ` · Paid ${new Date(sal.paidAt).toLocaleDateString("en-GB", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}`
                        : ""}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-extrabold text-gray-800">
                    ৳{sal.paidAmount.toLocaleString()}
                  </span>
                  {sal.receiptNo && (
                    <span className="text-[10px] font-mono font-semibold text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full">
                      {sal.receiptNo}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
