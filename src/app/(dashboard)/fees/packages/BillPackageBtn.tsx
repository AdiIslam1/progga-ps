"use client";

import { billAdditionalFee } from "@/lib/feeActions";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "react-toastify";

interface BillPackageBtnProps {
  id: number;
  name: string;
  amount: number;
  classId: number | null;
  className: string | null;
}

export default function BillPackageBtn({
  id,
  name,
  amount,
  classId,
  className,
}: BillPackageBtnProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(
    new Date().toISOString().slice(0, 7) // default to current month, e.g. "2026-05"
  );

  const handleBill = async () => {
    if (!selectedMonth) {
      toast.error("Please select a billing month.");
      return;
    }
    setLoading(true);
    setShowPicker(false);
    try {
      const res = await billAdditionalFee(null, {
        name,
        amount,
        feePackageId: String(id),
        classId: classId ? String(classId) : undefined,
        month: selectedMonth,
      });

      if (res.success) {
        toast.success(res.message || `Posted "${name}" for ${selectedMonth}.`);
        router.refresh();
      } else {
        toast.error(res.message || "Failed to post bill. Please try again.");
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred while processing the bill.");
    } finally {
      setLoading(false);
    }
  };

  const targetLabel = className ? `Class ${className}` : "All Students";
  const btnColor = className
    ? "bg-lamaSky text-white hover:bg-[#38b1d8] focus:ring-lamaSky"
    : "bg-lamaPurple text-white hover:bg-[#a394f7] focus:ring-lamaPurple";

  if (showPicker) {
    return (
      <div className="mt-4 bg-gray-50 border border-gray-200 rounded-xl p-3 flex flex-col gap-2.5">
        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
          Billing Month — {targetLabel}
        </p>
        <input
          type="month"
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="ring-1 ring-gray-200 p-2 rounded-lg text-xs w-full outline-none focus:ring-2 focus:ring-lamaSky bg-white"
        />
        <p className="text-[10px] text-gray-400 leading-relaxed">
          Students with a custom tuition rate will be billed at their individual
          rate instead of the package default.
        </p>
        <div className="flex gap-2">
          <button
            onClick={handleBill}
            disabled={loading || !selectedMonth}
            className="flex-1 bg-lamaSky text-white font-bold py-2 rounded-lg text-xs hover:bg-[#38b1d8] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "Posting…" : "Confirm & Post Bills"}
          </button>
          <button
            onClick={() => setShowPicker(false)}
            className="px-3 bg-gray-100 text-gray-600 font-bold py-2 rounded-lg text-xs hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={() => setShowPicker(true)}
      disabled={loading}
      className={`mt-4 w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-bold text-xs shadow-sm hover:shadow-md transition-all duration-300 focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed ${btnColor}`}
      title={`Bill this package to ${targetLabel}`}
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
        />
      </svg>
      {className ? `Bill Class ${className}` : "Bill School-Wide"}
    </button>
  );
}
