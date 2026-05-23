"use client";

import { setCustomTuitionFee } from "@/lib/feeActions";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "react-toastify";

interface Props {
  studentId: string;
  studentName: string;
  currentCustomFee: number | null;
  baseClassFee: number;
}

export default function CustomTuitionEditor({
  studentId,
  studentName,
  currentCustomFee,
  baseClassFee,
}: Props) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(
    currentCustomFee != null ? String(currentCustomFee) : ""
  );
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    const parsed = parseFloat(value);
    if (isNaN(parsed) || parsed < 0) {
      toast.error("Enter a valid amount.");
      return;
    }
    setLoading(true);
    const res = await setCustomTuitionFee(studentId, parsed);
    setLoading(false);
    if (res.success) {
      toast.success(`Custom tuition set to ৳${parsed.toLocaleString()} for ${studentName}.`);
      setEditing(false);
      router.refresh();
    } else {
      toast.error("Failed to update tuition rate.");
    }
  };

  const handleClear = async () => {
    setLoading(true);
    const res = await setCustomTuitionFee(studentId, null);
    setLoading(false);
    if (res.success) {
      toast.success(`Custom rate cleared — ${studentName} reverts to class default.`);
      setValue("");
      setEditing(false);
      router.refresh();
    } else {
      toast.error("Failed to clear tuition rate.");
    }
  };

  return (
    <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-gray-800 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
            Custom Tuition Rate
          </h3>
          <p className="text-[11px] text-gray-500 mt-0.5">
            Override the class default for this student.
          </p>
        </div>
        {!editing && (
          <button
            onClick={() => setEditing(true)}
            className="text-[10px] font-bold text-lamaSky hover:underline"
          >
            Edit
          </button>
        )}
      </div>

      {/* Current state display */}
      {!editing && (
        <div className="flex items-center justify-between bg-gray-50 rounded-xl px-3 py-2.5">
          <span className="text-xs text-gray-500">
            {currentCustomFee != null ? "Custom rate active" : "Using class default"}
          </span>
          <span className="text-sm font-extrabold text-gray-800">
            ৳{(currentCustomFee ?? baseClassFee).toLocaleString()}
            {currentCustomFee != null && baseClassFee > 0 && (
              <span className="text-[10px] font-normal text-gray-400 ml-1">
                (default ৳{baseClassFee.toLocaleString()})
              </span>
            )}
          </span>
        </div>
      )}

      {/* Edit form */}
      {editing && (
        <div className="flex flex-col gap-2">
          <div className="relative">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 font-semibold text-xs">৳</span>
            <input
              type="number"
              min="0"
              placeholder={String(baseClassFee || 0)}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="pl-6 ring-1 ring-gray-200 p-2 rounded-xl text-sm w-full outline-none focus:ring-2 focus:ring-amber-400 transition-all"
              autoFocus
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={loading}
              className="flex-1 bg-amber-400 hover:bg-amber-500 text-white font-bold py-2 rounded-xl text-xs transition-colors disabled:opacity-50"
            >
              {loading ? "Saving…" : "Save Rate"}
            </button>
            {currentCustomFee != null && (
              <button
                onClick={handleClear}
                disabled={loading}
                className="px-3 bg-red-50 text-red-500 hover:bg-red-100 font-bold py-2 rounded-xl text-xs transition-colors disabled:opacity-50"
                title="Remove custom rate, revert to class default"
              >
                Clear
              </button>
            )}
            <button
              onClick={() => { setEditing(false); setValue(currentCustomFee != null ? String(currentCustomFee) : ""); }}
              className="px-3 bg-gray-100 text-gray-600 font-bold py-2 rounded-xl text-xs hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
          </div>
          {baseClassFee > 0 && (
            <p className="text-[10px] text-gray-400">
              Class default is ৳{baseClassFee.toLocaleString()}. Leave blank or press Clear to revert.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
