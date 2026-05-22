"use client";

import { billAdditionalFee } from "@/lib/feeActions";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "react-toastify";

export default function BillFeeForm({ studentId, studentName }: { studentId: string; studentName: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    amount: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.amount) {
      toast.error("Please specify fee name and amount");
      return;
    }

    setLoading(true);
    try {
      const res = await billAdditionalFee(null, {
        name: formData.name,
        amount: parseFloat(formData.amount),
        studentId: studentId,
      });

      if (res.success) {
        toast.success(`Billed ${formData.name} to ${studentName}!`);
        setFormData({ name: "", amount: "" });
        router.refresh();
      } else {
        toast.error("Failed to bill additional fee.");
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col gap-4">
      <div>
        <h3 className="text-sm font-bold text-gray-800 flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-lamaPurple inline-block"></span>
          Bill Additional Fee
        </h3>
        <p className="text-[11px] text-gray-500 mt-0.5">Charge a one-off invoice to {studentName}&apos;s ledger.</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Fee Description</label>
          <input
            type="text"
            placeholder="e.g., Half-Yearly Exam Fee"
            className="ring-1 ring-gray-200 p-2 rounded-xl text-xs w-full outline-none focus:ring-2 focus:ring-lamaPurple transition-all placeholder:text-gray-300"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Amount (৳)</label>
          <div className="relative">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 font-semibold text-xs">৳</span>
            <input
              type="number"
              min="0"
              placeholder="500"
              className="pl-6 ring-1 ring-gray-200 p-2 rounded-xl text-xs w-full outline-none focus:ring-2 focus:ring-lamaPurple transition-all placeholder:text-gray-300"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              required
            />
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-lamaPurple hover:bg-[#a394f7] text-white font-bold py-2 rounded-xl transition-all duration-200 text-xs shadow-sm disabled:opacity-50 flex items-center justify-center gap-1.5"
      >
        {loading ? "Charging..." : "Add to Outstanding Dues"}
      </button>
    </form>
  );
}
