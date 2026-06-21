"use client";

import { billAllTeacherSalaries } from "@/lib/salaryActions";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "react-toastify";

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

interface SalaryBillingCalendarProps {
  currentYear: number;
  billedMonths: string[];   // months where at least one record exists, e.g. ["2026-01"]
  totalTeachers: number;
  billedCountByMonth: Record<string, number>; // monthKey -> count of teachers billed
}

export default function SalaryBillingCalendar({
  currentYear,
  billedMonths,
  totalTeachers,
  billedCountByMonth,
}: SalaryBillingCalendarProps) {
  const router = useRouter();
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const billedSet = new Set(billedMonths);
  const currentMonth = new Date().getMonth() + 1;

  const handleBill = async () => {
    if (!selected) return;
    setLoading(true);
    try {
      const res = await billAllTeacherSalaries(selected);
      if (res.success) {
        toast.success(res.message || `Billed all teachers for ${selected}.`);
        setSelected(null);
        router.refresh();
      } else {
        toast.error(res.message || "Failed to bill.");
      }
    } catch {
      toast.error("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const selectedLabel = selected
    ? `${MONTHS[parseInt(selected.split("-")[1]) - 1]} ${currentYear}`
    : null;

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-6 gap-1.5">
        {MONTHS.map((label, i) => {
          const monthKey = `${currentYear}-${String(i + 1).padStart(2, "0")}`;
          const billedCount = billedCountByMonth[monthKey] ?? 0;
          const fullyBilled = billedCount >= totalTeachers && totalTeachers > 0;
          const partiallyBilled = billedCount > 0 && !fullyBilled;
          const isFuture = i + 1 > currentMonth;
          const isPast = i + 1 < currentMonth;
          const isSelected = selected === monthKey;

          let pillClass = "";
          if (fullyBilled) {
            pillClass = "bg-lamaSky text-white cursor-default";
          } else if (isFuture) {
            pillClass = "bg-gray-50 text-gray-300 cursor-default";
          } else if (isSelected) {
            pillClass = "bg-lamaYellow text-gray-800 ring-2 ring-lamaYellow ring-offset-1";
          } else if (partiallyBilled) {
            pillClass = "bg-amber-50 text-amber-600 border border-amber-200 hover:bg-amber-100";
          } else if (isPast) {
            pillClass = "bg-red-50 text-red-400 border border-red-100 hover:bg-red-100";
          } else {
            pillClass = "bg-gray-100 text-gray-500 hover:bg-gray-200";
          }

          const title = fullyBilled
            ? `${label} — fully billed (${billedCount}/${totalTeachers})`
            : partiallyBilled
            ? `${label} — partial (${billedCount}/${totalTeachers} billed)`
            : isFuture
            ? `${label} — not yet`
            : `Bill all teachers for ${label} ${currentYear}`;

          return (
            <button
              key={monthKey}
              type="button"
              disabled={fullyBilled || isFuture || loading}
              onClick={() => setSelected((prev) => (prev === monthKey ? null : monthKey))}
              title={title}
              className={`flex flex-col items-center py-2.5 rounded-xl text-xs font-bold select-none transition-all cursor-pointer disabled:cursor-default ${pillClass}`}
            >
              {label}
              {fullyBilled && (
                <svg className="w-3 h-3 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                </svg>
              )}
              {partiallyBilled && !fullyBilled && (
                <span className="text-[8px] mt-0.5 font-semibold">{billedCount}/{totalTeachers}</span>
              )}
            </button>
          );
        })}
      </div>

      <p className="text-[9px] text-gray-400">
        Blue = fully billed · Amber = partial · Red = past, not billed · Faded = future
      </p>

      {selected && (
        <button
          onClick={handleBill}
          disabled={loading}
          className="w-full bg-lamaSky hover:bg-[#1e40af] text-white font-bold py-3 px-4 rounded-xl text-sm transition-all shadow-sm hover:shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Billing…
            </>
          ) : (
            `Bill All Teachers for ${selectedLabel}`
          )}
        </button>
      )}
    </div>
  );
}
