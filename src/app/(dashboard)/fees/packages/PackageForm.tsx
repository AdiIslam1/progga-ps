"use client";

import { createFeePackage } from "@/lib/feeActions";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "react-toastify";

interface ClassItem {
  id: number;
  name: string;
}

export default function PackageForm({ classes }: { classes: ClassItem[] }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    amount: "",
    classId: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.amount) {
      toast.error("Please fill in Name and Amount");
      return;
    }

    setLoading(true);
    try {
      const res = await createFeePackage(null, {
        name: formData.name,
        description: formData.description,
        amount: parseFloat(formData.amount),
        classId: formData.classId || undefined,
      });

      if (res.success) {
        toast.success("Standard Fee Package created successfully!");
        setFormData({ name: "", description: "", amount: "", classId: "" });
        router.refresh();
      } else {
        toast.error("Failed to create Fee Package.");
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col gap-5">
      <div>
        <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-lamaYellow inline-block animate-pulse"></span>
          Create Fee Package
        </h2>
        <p className="text-xs text-gray-500 mt-1">Configure standard monthly tuition fees or one-time class bills</p>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold text-gray-600">Package Name <span className="text-red-500">*</span></label>
        <input
          type="text"
          placeholder="e.g., Class 6 Tuition Fee - Jan"
          className="ring-1 ring-gray-200 p-2.5 rounded-xl text-sm w-full outline-none focus:ring-2 focus:ring-lamaSky transition-all duration-250 placeholder:text-gray-300"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold text-gray-600">Amount (৳) <span className="text-red-500">*</span></label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium text-sm">৳</span>
          <input
            type="number"
            min="0"
            step="0.01"
            placeholder="2000"
            className="pl-7 ring-1 ring-gray-200 p-2.5 rounded-xl text-sm w-full outline-none focus:ring-2 focus:ring-lamaSky transition-all duration-250 placeholder:text-gray-300"
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            required
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold text-gray-600">Associated Class (Optional)</label>
        <select
          className="ring-1 ring-gray-200 p-2.5 rounded-xl text-sm w-full outline-none focus:ring-2 focus:ring-lamaSky transition-all duration-250 bg-white"
          value={formData.classId}
          onChange={(e) => setFormData({ ...formData, classId: e.target.value })}
        >
          <option value="">All Classes (School-Wide)</option>
          {classes.map((cls) => (
            <option key={cls.id} value={cls.id}>
              Class {cls.name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold text-gray-600">Description</label>
        <textarea
          placeholder="Enter package details or payment cycles..."
          className="ring-1 ring-gray-200 p-2.5 rounded-xl text-sm w-full h-20 outline-none focus:ring-2 focus:ring-lamaSky transition-all duration-250 placeholder:text-gray-300 resize-none"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-lamaYellow hover:bg-yellow-400 text-gray-800 font-bold py-2.5 px-4 rounded-xl transition-all duration-200 text-sm shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-gray-800" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Creating...
          </>
        ) : (
          "Save Package"
        )}
      </button>
    </form>
  );
}
