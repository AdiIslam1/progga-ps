"use client";

import { useState } from "react";
import { bulkAdmissionFee } from "@/lib/feeActions";

type Class = { id: number; name: string };

export default function BulkAdmissionForm({ classes }: { classes: Class[] }) {
  const [classId, setClassId] = useState("all");
  const [year, setYear] = useState(new Date().getFullYear());
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) return;

    setLoading(true);
    setResult(null);
    try {
      const res = await bulkAdmissionFee({ classId, year, amount: Number(amount) });
      setResult({ success: res.success, message: res.message ?? "Done." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Class */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-600">Class</label>
          <select
            value={classId}
            onChange={(e) => setClassId(e.target.value)}
            className="ring-1 ring-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-600 bg-white"
          >
            <option value="all">All Classes</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>Class {c.name}</option>
            ))}
          </select>
        </div>

        {/* Year */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-600">Academic Year</label>
          <input
            type="number"
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            min={2020}
            max={2099}
            className="ring-1 ring-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-600 bg-white"
            required
          />
        </div>

        {/* Amount */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-600">Amount per student (৳)</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            min={1}
            placeholder="e.g. 500"
            className="ring-1 ring-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-600 bg-white"
            required
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button
          type="submit"
          disabled={loading || !amount}
          className="bg-blue-700 hover:bg-blue-800 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold px-6 py-2.5 rounded-xl text-sm transition-colors"
        >
          {loading ? "Applying..." : "Apply Admission Fee"}
        </button>
        {result && (
          <p className={`text-sm font-medium ${result.success ? "text-green-700" : "text-red-600"}`}>
            {result.message}
          </p>
        )}
      </div>

      <p className="text-xs text-slate-400">
        Students who already have an &quot;Admission Fee {year}&quot; record will be skipped automatically.
      </p>
    </form>
  );
}
