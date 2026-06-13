"use client";

import { useFormState } from "react-dom";
import { billAllTeacherSalaries } from "@/lib/salaryActions";
import { useState } from "react";

function BillingForm() {
  const today = new Date();
  const defaultMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
  const [month, setMonth] = useState(defaultMonth);

  const action = billAllTeacherSalaries.bind(null, null);
  const [state, formAction] = useFormState(action as any, { success: false, error: false, message: "" });

  return (
    <form action={formAction} className="flex flex-col gap-4 max-w-md">
      <div className="flex flex-col gap-1">
        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Salary Month</label>
        <input
          type="month"
          name="month"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="ring-1 ring-gray-200 rounded-xl p-2.5 text-sm outline-none focus:ring-2 focus:ring-lamaSky transition-all"
          required
        />
        <p className="text-[11px] text-gray-400">
          Generates one unpaid salary record per teacher. Already-billed teachers are skipped automatically.
        </p>
      </div>

      {state.message && (
        <div className={`text-xs font-semibold px-4 py-2.5 rounded-xl ${state.success ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"}`}>
          {state.message}
        </div>
      )}

      <button
        type="submit"
        className="bg-lamaSky hover:bg-[#38b1d8] text-white font-bold py-2.5 px-6 rounded-xl text-sm transition-colors shadow-sm self-start"
      >
        Bill All Teachers for {month}
      </button>
    </form>
  );
}

export default function SalaryBillingPage() {
  return (
    <div className="p-6 bg-[#f8fafe] min-h-screen flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-extrabold text-gray-800 tracking-tight">Monthly Salary Billing</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Generate salary records for all teachers in one click. Only teachers with a monthly salary set will be billed.
        </p>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <h2 className="text-sm font-bold text-gray-700 mb-4">Generate Salary Bills</h2>
        <BillingForm />
      </div>

      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <h2 className="text-sm font-bold text-gray-700 mb-2">How it works</h2>
        <ul className="text-xs text-gray-500 flex flex-col gap-2 list-disc list-inside">
          <li>Select the month and click bill — one UNPAID record is created per teacher.</li>
          <li>Teachers without a monthly salary set are skipped.</li>
          <li>Running the same month twice skips already-billed teachers, so it is safe to re-run.</li>
          <li>Head to <strong>Payroll Portal</strong> to mark salaries as paid and issue receipts.</li>
        </ul>
      </div>
    </div>
  );
}
