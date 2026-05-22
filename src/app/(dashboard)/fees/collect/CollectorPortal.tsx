"use client";

import { collectFees } from "@/lib/feeActions";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "react-toastify";

interface FeeItem {
  id: number;
  name: string;
  amount: number;
  month: string | null;
  status: "PAID" | "UNPAID" | "PENDING";
}

interface CollectorPortalProps {
  studentId: string;
  studentName: string;
  customTuitionFee: number | null;
  baseClassFee: number;
  unpaidFees: FeeItem[];
  cashierUsername: string;
}

export default function CollectorPortal({
  studentId,
  studentName,
  customTuitionFee,
  baseClassFee,
  unpaidFees,
  cashierUsername,
}: CollectorPortalProps) {
  const router = useRouter();
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    if (selectedIds.length === unpaidFees.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(unpaidFees.map((fee) => fee.id));
    }
  };

  const totalDue = unpaidFees
    .filter((fee) => selectedIds.includes(fee.id))
    .reduce((sum, fee) => sum + fee.amount, 0);

  const handleConfirmPayment = async () => {
    if (selectedIds.length === 0) {
      toast.error("Please select at least one outstanding fee to pay");
      return;
    }

    setLoading(true);
    try {
      const res = await collectFees(studentId, selectedIds, cashierUsername);
      if (res.success && res.receiptNo) {
        toast.success(`Payment verified successfully! Receipt ${res.receiptNo} generated.`);
        // Redirect to print receipt page
        router.push(`/fees/receipt/${res.receiptNo}`);
      } else {
        toast.error(res.message || "Failed to process payment.");
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred during cash collection.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col gap-6">
      <div className="flex items-center justify-between border-b border-gray-50 pb-4">
        <div>
          <h2 className="text-base font-bold text-gray-800">Outstanding Invoices Ledger</h2>
          <p className="text-xs text-gray-500 mt-0.5">Select months or one-off items below to record cash payment.</p>
        </div>
        {unpaidFees.length > 0 && (
          <button
            onClick={selectAll}
            className="text-xs text-lamaSky hover:text-[#38b1d8] font-bold transition-colors"
          >
            {selectedIds.length === unpaidFees.length ? "Deselect All" : "Select All Dues"}
          </button>
        )}
      </div>

      {unpaidFees.length === 0 ? (
        <div className="py-8 text-center flex flex-col items-center justify-center gap-2">
          <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center text-green-500 text-lg">✓</div>
          <p className="text-gray-500 font-bold text-sm">All Clear! No Outstanding Dues</p>
          <p className="text-xs text-gray-400">This student has cleared all scheduled tuition months and dynamic fees.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {/* Fee Checklist Grid */}
          <div className="max-h-80 overflow-y-auto pr-1 flex flex-col gap-2.5">
            {unpaidFees.map((fee) => {
              const isSelected = selectedIds.includes(fee.id);
              return (
                <div
                  key={fee.id}
                  onClick={() => toggleSelect(fee.id)}
                  className={`p-3.5 rounded-xl border transition-all duration-200 cursor-pointer flex items-center justify-between select-none ${
                    isSelected
                      ? "border-lamaSky bg-[#f3fcff] shadow-sm"
                      : "border-gray-100 hover:border-gray-200 bg-gray-50/50 hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {/* Checkbox circle */}
                    <div
                      className={`w-5 h-5 rounded-full flex items-center justify-center border transition-all duration-200 ${
                        isSelected
                          ? "bg-lamaSky border-lamaSky text-white font-bold"
                          : "border-gray-300 bg-white"
                      }`}
                    >
                      {isSelected && (
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-700">{fee.name}</p>
                      {fee.month && (
                        <p className="text-[10px] text-gray-400 font-medium">Billing Period: {fee.month}</p>
                      )}
                    </div>
                  </div>

                  <span className="text-sm font-extrabold text-gray-800">
                    ৳{fee.amount.toLocaleString()}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Payment Summary Footer */}
          <div className="border-t border-gray-100 pt-4 mt-2 flex flex-col gap-3">
            <div className="flex justify-between items-center text-xs text-gray-500">
              <span>Items Selected:</span>
              <span className="font-semibold text-gray-700">{selectedIds.length} invoice(s)</span>
            </div>

            {customTuitionFee !== null && (
              <div className="flex justify-between items-center text-xs text-amber-600 bg-amber-50 px-3 py-1.5 rounded-xl">
                <span>Tuition Discount / Waiver active:</span>
                <span className="font-bold">
                  ৳{customTuitionFee} / mo (Normal: ৳{baseClassFee})
                </span>
              </div>
            )}

            <div className="flex justify-between items-end border-b border-gray-50 pb-3 mt-1">
              <span className="text-sm font-bold text-gray-700">Total Cash Received:</span>
              <span className="text-xl font-extrabold text-gray-900 flex items-baseline gap-0.5">
                <span className="text-sm text-lamaSky font-bold">৳</span>
                {totalDue.toLocaleString()}
              </span>
            </div>

            <button
              onClick={handleConfirmPayment}
              disabled={loading || selectedIds.length === 0}
              className="w-full bg-lamaSky hover:bg-[#38b1d8] text-white font-bold py-3 px-4 rounded-xl transition-all duration-200 text-sm shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing Cash...
                </>
              ) : (
                "Confirm Cash & Print Receipt"
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
