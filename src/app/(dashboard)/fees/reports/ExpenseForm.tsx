"use client";

import { createExpense } from "@/lib/feeActions";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "react-toastify";

export default function ExpenseForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    amount: "",
    category: "Utility",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.amount) {
      toast.error("Please fill in title and amount");
      return;
    }

    setLoading(true);
    try {
      const res = await createExpense(null, {
        title: formData.title,
        amount: parseFloat(formData.amount),
        category: formData.category,
      });

      if (res.success) {
        toast.success(`Expense "${formData.title}" logged successfully!`);
        setFormData({ title: "", amount: "", category: "Utility" });
        router.refresh();
      } else {
        toast.error("Failed to log expense.");
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
          Log Operational Expense
        </h3>
        <p className="text-[11px] text-gray-500 mt-0.5">Record utility bills, staff salaries, or facility repairs.</p>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Expense Title</label>
        <input
          type="text"
          placeholder="e.g., Electric Bill May"
          className="ring-1 ring-gray-200 p-2 rounded-xl text-xs w-full outline-none focus:ring-2 focus:ring-lamaPurple transition-all placeholder:text-gray-300"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          required
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Amount (৳)</label>
          <div className="relative">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 font-semibold text-xs">৳</span>
            <input
              type="number"
              min="0"
              placeholder="5000"
              className="pl-6 ring-1 ring-gray-200 p-2 rounded-xl text-xs w-full outline-none focus:ring-2 focus:ring-lamaPurple transition-all placeholder:text-gray-300"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              required
            />
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Category</label>
          <select
            className="ring-1 ring-gray-200 p-2 rounded-xl text-xs w-full outline-none focus:ring-2 focus:ring-lamaPurple transition-all bg-white"
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
          >
            <option value="Salary">Salaries & Payroll</option>
            <option value="Utility">Utilities & Bills</option>
            <option value="Maintenance">Maintenance & Repairs</option>
            <option value="Supplies">Supplies & Stationery</option>
            <option value="Events">School Events</option>
            <option value="Other">Other Expenses</option>
          </select>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-lamaPurple hover:bg-[#a394f7] text-white font-bold py-2 rounded-xl transition-all duration-200 text-xs shadow-sm disabled:opacity-50 flex items-center justify-center gap-1.5"
      >
        {loading ? "Logging..." : "Log Expense Details"}
      </button>
    </form>
  );
}
