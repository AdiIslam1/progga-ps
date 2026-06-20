"use client";

import { createBonusPackage } from "@/lib/salaryActions";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "react-toastify";

export default function BonusPackageForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !amount) return;
    setLoading(true);
    try {
      const res = await createBonusPackage(name.trim(), parseFloat(amount), description.trim());
      if (res.success) {
        toast.success("Bonus package created.");
        setName("");
        setAmount("");
        setDescription("");
        router.refresh();
      } else {
        toast.error(res.message || "Failed to create.");
      }
    } catch {
      toast.error("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm sticky top-6">
      <h2 className="text-sm font-bold text-gray-700 mb-4">Create Bonus Package</h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Package Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Eid Bonus 2026"
            required
            className="ring-1 ring-gray-200 rounded-xl p-2.5 text-sm outline-none focus:ring-2 focus:ring-lamaYellow transition-all placeholder:text-gray-300"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Amount (৳)</label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0"
            required
            className="ring-1 ring-gray-200 rounded-xl p-2.5 text-sm outline-none focus:ring-2 focus:ring-lamaYellow transition-all placeholder:text-gray-300"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Description (optional)</label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. Eid-ul-Adha festival bonus"
            className="ring-1 ring-gray-200 rounded-xl p-2.5 text-sm outline-none focus:ring-2 focus:ring-lamaYellow transition-all placeholder:text-gray-300"
          />
        </div>

        <button
          type="submit"
          disabled={loading || !name.trim() || !amount}
          className="bg-lamaYellow hover:bg-[#e6c840] text-gray-800 font-bold py-2.5 px-4 rounded-xl text-sm transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Creating…" : "Create Package"}
        </button>
      </form>
    </div>
  );
}
