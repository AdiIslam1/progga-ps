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

  const handleBill = async () => {
    const targetText = className ? `Class ${className}` : "ALL students (School-Wide)";
    const confirmMessage = `Are you sure you want to post this bill?\n\nPackage: "${name}"\nAmount: ৳${amount.toLocaleString()}\nTarget: ${targetText}\n\nThis will generate an outstanding unpaid invoice for every student in ${className ? `Class ${className}` : "the school"}.`;

    if (!confirm(confirmMessage)) {
      return;
    }

    setLoading(true);
    try {
      const res = await billAdditionalFee(null, {
        name,
        amount,
        feePackageId: String(id),
        classId: classId ? String(classId) : undefined,
      });

      if (res.success) {
        if (res.message) {
          toast.success(res.message);
        } else {
          toast.success(`Successfully posted "${name}" bill to ${targetText}!`);
        }
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

  return (
    <button
      onClick={handleBill}
      disabled={loading}
      className={`mt-4 w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-bold text-xs shadow-sm hover:shadow-md transition-all duration-300 transform hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed ${
        className
          ? "bg-lamaSky text-white hover:bg-[#38b1d8] focus:ring-2 focus:ring-lamaSky"
          : "bg-lamaPurple text-white hover:bg-[#a394f7] focus:ring-2 focus:ring-lamaPurple"
      }`}
      title={`Bill this package to ${className ? `Class ${className}` : "all students"}`}
    >
      {loading ? (
        <>
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Posting Bills...
        </>
      ) : (
        <>
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-4 7h4m-4 4h4m-5 10v-4a1 1 0 00-1-1h-4a1 1 0 00-1 1v4"
            />
          </svg>
          {className ? `Bill Class ${className}` : "Bill School-Wide"}
        </>
      )}
    </button>
  );
}
