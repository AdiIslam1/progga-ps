"use client";

import { billAdditionalFee } from "@/lib/feeActions";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "react-toastify";

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

interface BillPackageBtnProps {
  id: number;
  name: string;
  amount: number;
  classId: number | null;
  className: string | null;
  isTuition: boolean;
  billedMonths: string[];
  currentYear: number;
}

export default function BillPackageBtn({
  id,
  name,
  amount,
  classId,
  className,
  isTuition,
  billedMonths,
  currentYear,
}: BillPackageBtnProps) {
  const router = useRouter();
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const targetLabel = className ? `Class ${className}` : "All Students";
  const accentColor = className ? "bg-lamaSky" : "bg-lamaPurple";
  const accentHover = className ? "hover:bg-[#1e40af]" : "hover:bg-[#a394f7]";
  const billedSet = new Set(billedMonths);
  const currentMonth = new Date().getMonth() + 1;

  const callBill = async (monthKey?: string) => {
    setLoading(true);
    try {
      const res = await billAdditionalFee(null, {
        name,
        amount,
        feePackageId: String(id),
        classId: classId ? String(classId) : undefined,
        month: monthKey,
      });
      if (res.success) {
        toast.success(res.message || `Billed "${name}".`);
        setSelected(null);
        router.refresh();
      } else {
        toast.error(res.message || "Failed to post bill.");
      }
    } catch {
      toast.error("An error occurred.");
    } finally {
      setLoading(false);
    }
  };

  // ── OTHER FEE: simple one-click bill ──────────────────────────────────────
  if (!isTuition) {
    return (
      <button
        onClick={() => callBill()}
        disabled={loading}
        className={`w-full ${accentColor} ${accentHover} text-white font-bold py-3 rounded-xl text-sm transition-all shadow-sm hover:shadow-md disabled:opacity-50 flex items-center justify-center gap-2`}
      >
        {loading ? "Posting…" : `Bill ${targetLabel}`}
      </button>
    );
  }

  // ── TUITION: click a month to select, then confirm ────────────────────────
  const selectedLabel = selected
    ? `${MONTHS[parseInt(selected.split("-")[1]) - 1]} ${currentYear}`
    : null;

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-6 gap-1.5">
        {MONTHS.map((label, i) => {
          const monthKey = `${currentYear}-${String(i + 1).padStart(2, "0")}`;
          const isBilled = billedSet.has(monthKey);
          const isPast = i + 1 < currentMonth;
          const isFuture = i + 1 > currentMonth;
          const isSelected = selected === monthKey;

          let pillClass = "";
          if (isBilled) {
            pillClass = "bg-lamaSky text-white cursor-default";
          } else if (isFuture) {
            pillClass = "bg-gray-50 text-gray-300 cursor-default";
          } else if (isSelected) {
            pillClass = "bg-lamaYellow text-gray-800 ring-2 ring-lamaYellow ring-offset-1";
          } else if (isPast) {
            pillClass = "bg-red-50 text-red-400 border border-red-100 hover:bg-red-100";
          } else {
            pillClass = "bg-gray-100 text-gray-500 hover:bg-gray-200";
          }

          return (
            <button
              key={monthKey}
              type="button"
              disabled={isBilled || isFuture || loading}
              onClick={() => setSelected((prev) => (prev === monthKey ? null : monthKey))}
              title={isBilled ? `${label} — already billed` : isFuture ? `${label} — not yet` : `Select ${label} ${currentYear}`}
              className={`flex flex-col items-center py-2.5 rounded-xl text-xs font-bold select-none transition-all cursor-pointer disabled:cursor-default ${pillClass}`}
            >
              {label}
              {isBilled && (
                <svg className="w-3 h-3 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>
          );
        })}
      </div>

      <p className="text-[9px] text-gray-400">
        Blue = billed · Red = past, not yet billed · Grey = current/billed · Faded = future
      </p>

      {selected && (
        <button
          onClick={() => callBill(selected)}
          disabled={loading}
          className={`w-full ${accentColor} ${accentHover} text-white font-bold py-3 rounded-xl text-sm transition-all shadow-sm hover:shadow-md disabled:opacity-50 flex items-center justify-center gap-2`}
        >
          {loading ? (
            <>
              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Posting…
            </>
          ) : (
            `Bill ${targetLabel} for ${selectedLabel}`
          )}
        </button>
      )}
    </div>
  );
}
