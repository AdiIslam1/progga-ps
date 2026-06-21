"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateFeeAmount } from "@/lib/feeActions";
import { Pencil, Check, X } from "lucide-react";
import { toast } from "react-toastify";

export default function EditFeeAmount({ id, amount, paid }: { id: number; amount: number; paid: boolean }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(String(amount));
  const [saving, setSaving] = useState(false);

  if (paid) return <span className="text-slate-700">৳{amount.toLocaleString()}</span>;

  if (!editing) {
    return (
      <div className="flex items-center gap-2 justify-end">
        <span className="text-slate-700">৳{amount.toLocaleString()}</span>
        <button
          onClick={() => setEditing(true)}
          className="w-6 h-6 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 transition-colors"
        >
          <Pencil size={11} />
        </button>
      </div>
    );
  }

  const save = async () => {
    const amt = parseFloat(value);
    if (isNaN(amt) || amt < 0) { toast.error("Enter a valid amount."); return; }
    setSaving(true);
    const res = await updateFeeAmount(id, amt);
    setSaving(false);
    if (res.success) {
      toast.success("Updated.");
      setEditing(false);
      router.refresh();
    } else {
      toast.error(res.message ?? "Failed.");
    }
  };

  return (
    <div className="flex items-center gap-1.5 justify-end">
      <span className="text-xs text-slate-400">৳</span>
      <input
        type="number"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="w-20 ring-1 ring-blue-300 rounded-lg px-2 py-0.5 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500"
        autoFocus
      />
      <button onClick={save} disabled={saving} className="w-6 h-6 flex items-center justify-center rounded-full bg-green-100 hover:bg-green-200 text-green-700 transition-colors">
        <Check size={12} />
      </button>
      <button onClick={() => setEditing(false)} className="w-6 h-6 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 transition-colors">
        <X size={12} />
      </button>
    </div>
  );
}
