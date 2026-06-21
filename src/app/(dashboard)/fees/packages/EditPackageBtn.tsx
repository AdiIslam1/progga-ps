"use client";

import { updateFeePackage } from "@/lib/feeActions";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "react-toastify";

interface Props {
  id: number;
  currentName: string;
  currentAmount: number;
  currentDescription?: string | null;
}

export default function EditPackageBtn({
  id,
  currentName,
  currentAmount,
  currentDescription,
}: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState(currentName);
  const [amount, setAmount] = useState(String(currentAmount));
  const [description, setDescription] = useState(currentDescription || "");

  const handleSave = async () => {
    const parsedAmount = parseFloat(amount);
    if (!name.trim() || isNaN(parsedAmount) || parsedAmount < 0) {
      toast.error("Please enter a valid name and amount.");
      return;
    }
    setLoading(true);
    const res = await updateFeePackage(id, {
      name: name.trim(),
      amount: parsedAmount,
      description: description.trim() || undefined,
    });
    setLoading(false);
    if (res.success) {
      toast.success("Package updated.");
      setOpen(false);
      router.refresh();
    } else {
      toast.error("Failed to update package.");
    }
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="text-[10px] font-bold text-gray-400 hover:text-lamaSky transition-colors px-1.5 py-0.5 rounded"
        title="Edit package"
      >
        Edit
      </button>
    );
  }

  return (
    <div className="mt-3 bg-gray-50 border border-gray-200 rounded-xl p-3 flex flex-col gap-2">
      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Edit Package</p>
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Package name"
        className="ring-1 ring-gray-200 p-2 rounded-lg text-xs w-full outline-none focus:ring-2 focus:ring-lamaSky bg-white"
      />
      <div className="relative">
        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-semibold">৳</span>
        <input
          type="number"
          min="0"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Amount"
          className="pl-6 ring-1 ring-gray-200 p-2 rounded-lg text-xs w-full outline-none focus:ring-2 focus:ring-lamaSky bg-white"
        />
      </div>
      <input
        type="text"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Description (optional)"
        className="ring-1 ring-gray-200 p-2 rounded-lg text-xs w-full outline-none focus:ring-2 focus:ring-lamaSky bg-white"
      />
      <div className="flex gap-2">
        <button
          onClick={handleSave}
          disabled={loading}
          className="flex-1 bg-lamaSky text-white font-bold py-1.5 rounded-lg text-xs hover:bg-[#1e40af] disabled:opacity-50 transition-colors"
        >
          {loading ? "Saving…" : "Save"}
        </button>
        <button
          onClick={() => { setOpen(false); setName(currentName); setAmount(String(currentAmount)); setDescription(currentDescription || ""); }}
          className="px-3 bg-gray-100 text-gray-600 font-bold py-1.5 rounded-lg text-xs hover:bg-gray-200 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
