"use client";

import { createFeePackage } from "@/lib/feeActions";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "react-toastify";

interface ClassItem { id: number; name: string; }

export default function PackageForm({ classes }: { classes: ClassItem[] }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [type, setType] = useState<"TUITION" | "OTHER_FEE">("TUITION");
  const [formData, setFormData] = useState({ name: "", description: "", amount: "", classId: "" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.amount) {
      toast.error("Name and amount are required.");
      return;
    }
    if (type === "TUITION" && !formData.classId) {
      toast.error("Please select a class for a tuition package.");
      return;
    }
    setLoading(true);
    try {
      const res = await createFeePackage(null, {
        name: formData.name,
        description: formData.description,
        amount: parseFloat(formData.amount),
        classId: formData.classId || undefined,
        type,
      });
      if (res.success) {
        toast.success("Package created!");
        setFormData({ name: "", description: "", amount: "", classId: "" });
        router.refresh();
      } else {
        toast.error((res as any).message || "Failed to create package.");
      }
    } catch {
      toast.error("An error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col gap-4">
      <div>
        <h2 className="text-base font-bold text-gray-800">New Package</h2>
        <p className="text-xs text-gray-500 mt-0.5">Create a tuition rate or a reusable fee template.</p>
      </div>

      {/* Type toggle */}
      <div className="flex rounded-xl overflow-hidden border border-gray-200">
        <button
          type="button"
          onClick={() => setType("TUITION")}
          className={`flex-1 py-2 text-xs font-bold transition-colors ${
            type === "TUITION" ? "bg-lamaSky text-white" : "bg-gray-50 text-gray-500 hover:bg-gray-100"
          }`}
        >
          Monthly Tuition
        </button>
        <button
          type="button"
          onClick={() => setType("OTHER_FEE")}
          className={`flex-1 py-2 text-xs font-bold transition-colors ${
            type === "OTHER_FEE" ? "bg-lamaPurple text-white" : "bg-gray-50 text-gray-500 hover:bg-gray-100"
          }`}
        >
          Other Fee
        </button>
      </div>

      {/* Class selector — required for tuition, optional for other */}
      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold text-gray-600">
          Class {type === "TUITION" ? <span className="text-red-400">*</span> : <span className="text-gray-400">(optional)</span>}
        </label>
        <select
          className="ring-1 ring-gray-200 p-2.5 rounded-xl text-sm w-full outline-none focus:ring-2 focus:ring-lamaSky bg-white"
          value={formData.classId}
          onChange={(e) => setFormData({ ...formData, classId: e.target.value })}
        >
          <option value="">{type === "TUITION" ? "Select a class…" : "All Classes (School-Wide)"}</option>
          {classes.map((cls) => (
            <option key={cls.id} value={cls.id}>Class {cls.name}</option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold text-gray-600">Name <span className="text-red-400">*</span></label>
        <input
          type="text"
          placeholder={type === "TUITION" ? "e.g. Class 1A Monthly Tuition" : "e.g. Sports Fee"}
          className="ring-1 ring-gray-200 p-2.5 rounded-xl text-sm w-full outline-none focus:ring-2 focus:ring-lamaSky"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold text-gray-600">Amount (৳) <span className="text-red-400">*</span></label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">৳</span>
          <input
            type="number"
            min="0"
            step="0.01"
            placeholder="2000"
            className="pl-7 ring-1 ring-gray-200 p-2.5 rounded-xl text-sm w-full outline-none focus:ring-2 focus:ring-lamaSky"
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            required
          />
        </div>
        {type === "TUITION" && (
          <p className="text-[10px] text-gray-400">Per student per month. Students with a custom rate override this.</p>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold text-gray-600">Description <span className="text-gray-400">(optional)</span></label>
        <input
          type="text"
          placeholder="Any notes…"
          className="ring-1 ring-gray-200 p-2.5 rounded-xl text-sm w-full outline-none focus:ring-2 focus:ring-lamaSky"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className={`w-full text-white font-bold py-2.5 rounded-xl text-sm shadow-sm transition-all disabled:opacity-50 ${
          type === "TUITION" ? "bg-lamaSky hover:bg-[#38b1d8]" : "bg-lamaPurple hover:bg-[#a394f7]"
        }`}
      >
        {loading ? "Creating…" : "Create Package"}
      </button>
    </form>
  );
}
