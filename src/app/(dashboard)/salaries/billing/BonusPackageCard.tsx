"use client";

import { applyBonusPackage, deleteBonusPackage } from "@/lib/salaryActions";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "react-toastify";

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

interface BonusPackageCardProps {
  id: number;
  name: string;
  amount: number;
  description: string | null;
  currentYear: number;
  appliedMonths: string[]; // months this package has already been applied to
}

export default function BonusPackageCard({
  id,
  name,
  amount,
  description,
  currentYear,
  appliedMonths,
}: BonusPackageCardProps) {
  const router = useRouter();
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const appliedSet = new Set(appliedMonths);
  const currentMonth = new Date().getMonth() + 1;

  const handleApply = async () => {
    if (!selected) return;
    setLoading(true);
    try {
      const res = await applyBonusPackage(id, selected);
      if (res.success) {
        toast.success(res.message || `Applied "${name}".`);
        setSelected(null);
        router.refresh();
      } else {
        toast.error(res.message || "Failed to apply.");
      }
    } catch {
      toast.error("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await deleteBonusPackage(id);
      if (res.success) {
        toast.success(`"${name}" deleted.`);
        router.refresh();
      } else {
        toast.error(res.message || "Failed to delete.");
      }
    } catch {
      toast.error("An unexpected error occurred.");
    } finally {
      setDeleting(false);
      setConfirmDelete(false);
    }
  };

  const selectedLabel = selected
    ? `${MONTHS[parseInt(selected.split("-")[1]) - 1]} ${currentYear}`
    : null;

  return (
    <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col gap-4 relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-1 bg-lamaYellow" />

      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <span className="text-[10px] font-bold bg-lamaYellowLight text-yellow-700 px-2 py-0.5 rounded-full uppercase tracking-wider">
            One-Time Bonus
          </span>
          <h3 className="text-sm font-bold text-gray-800 mt-2">{name}</h3>
          {description && (
            <p className="text-[11px] text-gray-400 mt-0.5">{description}</p>
          )}
        </div>
        <div className="flex-shrink-0">
          {confirmDelete ? (
            <div className="flex items-center gap-1.5">
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="text-[10px] font-bold text-white bg-red-500 hover:bg-red-600 px-2.5 py-1 rounded-lg transition-colors disabled:opacity-50"
              >
                {deleting ? "…" : "Confirm"}
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="text-[10px] font-bold text-gray-500 hover:text-gray-700 px-2.5 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmDelete(true)}
              className="p-1.5 rounded-lg text-gray-300 hover:text-red-400 hover:bg-red-50 transition-colors"
              title="Delete bonus package"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Amount */}
      <div className="flex items-center justify-between bg-yellow-50 rounded-xl px-3 py-2">
        <span className="text-xs text-gray-500">Bonus per teacher</span>
        <span className="text-base font-extrabold text-gray-900">
          <span className="text-sm text-yellow-600 font-bold">৳</span>
          {amount.toLocaleString()}
        </span>
      </div>

      {/* Month calendar */}
      <div className="flex flex-col gap-1.5">
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{currentYear} — Select month to apply</span>
        <div className="grid grid-cols-6 gap-1.5">
          {MONTHS.map((label, i) => {
            const monthKey = `${currentYear}-${String(i + 1).padStart(2, "0")}`;
            const isApplied = appliedSet.has(monthKey);
            const isFuture = i + 1 > currentMonth;
            const isSelected = selected === monthKey;

            let pillClass = "";
            if (isApplied) {
              pillClass = "bg-lamaYellow text-gray-800 cursor-default";
            } else if (isFuture) {
              pillClass = "bg-gray-50 text-gray-300 cursor-default";
            } else if (isSelected) {
              pillClass = "bg-yellow-400 text-white ring-2 ring-yellow-400 ring-offset-1";
            } else {
              pillClass = "bg-gray-100 text-gray-500 hover:bg-yellow-50 hover:text-yellow-700";
            }

            return (
              <button
                key={monthKey}
                type="button"
                disabled={isApplied || isFuture || loading}
                onClick={() => setSelected((prev) => (prev === monthKey ? null : monthKey))}
                title={
                  isApplied
                    ? `${label} — already applied`
                    : isFuture
                    ? `${label} — not yet`
                    : `Apply for ${label} ${currentYear}`
                }
                className={`flex flex-col items-center py-2.5 rounded-xl text-xs font-bold select-none transition-all disabled:cursor-default ${pillClass}`}
              >
                {label}
                {isApplied && (
                  <svg className="w-3 h-3 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
            );
          })}
        </div>
        <p className="text-[9px] text-gray-400">Yellow = applied · Faded = future</p>
      </div>

      {selected && (
        <button
          onClick={handleApply}
          disabled={loading}
          className="w-full bg-lamaYellow hover:bg-[#e6c840] text-gray-800 font-bold py-3 px-4 rounded-xl text-sm transition-all shadow-sm hover:shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Applying…
            </>
          ) : (
            `Apply to All Teachers for ${selectedLabel}`
          )}
        </button>
      )}
    </div>
  );
}
