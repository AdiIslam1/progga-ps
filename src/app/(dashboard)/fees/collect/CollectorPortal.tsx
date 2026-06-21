"use client";

import { collectFees, updateFeeAmount } from "@/lib/feeActions";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "react-toastify";
import { Pencil, Check, X } from "lucide-react";

interface FeeItem {
  id: number;
  name: string;
  amount: number;
  month: string | null;
  status: "PAID" | "UNPAID" | "PENDING";
}

interface PaidFeeItem {
  id: number;
  name: string;
  paidAmount: number;
  month: string | null;
  paidAt: Date | string | null;
  receiptNo: string | null;
}

interface CollectorPortalProps {
  studentId: string;
  studentName: string;
  customTuitionFee: number | null;
  baseClassFee: number;
  unpaidFees: FeeItem[];
  paidFees: PaidFeeItem[];
  cashierUsername: string;
}

export default function CollectorPortal({
  studentId,
  studentName,
  customTuitionFee,
  baseClassFee,
  unpaidFees,
  paidFees,
  cashierUsername,
}: CollectorPortalProps) {
  const router = useRouter();
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [discount, setDiscount] = useState("");
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editAmount, setEditAmount] = useState("");
  const [editSaving, setEditSaving] = useState(false);

  const startEdit = (fee: FeeItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(fee.id);
    setEditAmount(String(fee.amount));
  };

  const cancelEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(null);
    setEditAmount("");
  };

  const saveEdit = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const amt = parseFloat(editAmount);
    if (isNaN(amt) || amt < 0) { toast.error("Enter a valid amount."); return; }
    setEditSaving(true);
    const res = await updateFeeAmount(id, amt);
    setEditSaving(false);
    if (res.success) {
      toast.success("Fee amount updated.");
      setEditingId(null);
      router.refresh();
    } else {
      toast.error(res.message ?? "Failed to update.");
    }
  };

  const toggleSelect = (id: number) =>
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );

  const selectAll = () =>
    setSelectedIds(
      selectedIds.length === unpaidFees.length ? [] : unpaidFees.map((f) => f.id)
    );

  const subtotal = unpaidFees
    .filter((f) => selectedIds.includes(f.id))
    .reduce((sum, f) => sum + f.amount, 0);

  const discountVal = Math.min(Math.max(parseFloat(discount) || 0, 0), subtotal);
  const totalCollected = subtotal - discountVal;

  const handleConfirmPayment = async () => {
    if (selectedIds.length === 0) {
      toast.error("Select at least one outstanding fee to pay.");
      return;
    }
    if (discountVal > subtotal) {
      toast.error("Discount cannot exceed the total amount.");
      return;
    }
    setLoading(true);
    try {
      const res = await collectFees(studentId, selectedIds, cashierUsername, discountVal);
      if (res.success && res.receiptNo) {
        toast.success(`Payment confirmed! Receipt ${res.receiptNo} generated.`);
        router.push(`/fees/receipt/${res.receiptNo}`);
      } else {
        toast.error(res.message || "Failed to process payment.");
      }
    } catch {
      toast.error("An error occurred during payment.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* ── OUTSTANDING DUES ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
          <div>
            <h2 className="text-sm font-bold text-gray-800">Outstanding Dues</h2>
            <p className="text-[11px] text-gray-400 mt-0.5">
              {unpaidFees.length === 0
                ? "All clear — no pending payments."
                : `${unpaidFees.length} unpaid item${unpaidFees.length !== 1 ? "s" : ""}`}
            </p>
          </div>
          {unpaidFees.length > 0 && (
            <button
              onClick={selectAll}
              className="text-xs text-lamaSky hover:text-[#1e40af] font-bold transition-colors"
            >
              {selectedIds.length === unpaidFees.length ? "Deselect All" : "Select All"}
            </button>
          )}
        </div>

        {unpaidFees.length === 0 ? (
          <div className="py-10 flex flex-col items-center gap-2">
            <div className="w-9 h-9 rounded-full bg-green-50 flex items-center justify-center text-green-500">✓</div>
            <p className="text-xs text-gray-400 font-semibold">No outstanding dues</p>
          </div>
        ) : (
          <>
            {/* Fee rows */}
            <div className="divide-y divide-gray-50">
              {unpaidFees.map((fee) => {
                const isSelected = selectedIds.includes(fee.id);
                return (
                  <div
                    key={fee.id}
                    onClick={() => editingId !== fee.id && toggleSelect(fee.id)}
                    className={`flex items-center justify-between px-5 py-3.5 cursor-pointer select-none transition-colors ${
                      isSelected ? "bg-[#f3fcff]" : "hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-5 h-5 rounded-full border flex items-center justify-center flex-shrink-0 transition-all ${
                          isSelected ? "bg-lamaSky border-lamaSky" : "border-gray-300 bg-white"
                        }`}
                      >
                        {isSelected && (
                          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-700">{fee.name}</p>
                        {fee.month && (
                          <p className="text-[10px] text-gray-400">Period: {fee.month}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {editingId === fee.id ? (
                        <>
                          <span className="text-xs text-gray-400 font-semibold">৳</span>
                          <input
                            type="number"
                            value={editAmount}
                            onChange={(e) => setEditAmount(e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                            className="w-24 ring-1 ring-blue-300 rounded-lg px-2 py-1 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500"
                            autoFocus
                          />
                          <button onClick={(e) => saveEdit(fee.id, e)} disabled={editSaving} className="w-6 h-6 flex items-center justify-center rounded-full bg-green-100 hover:bg-green-200 text-green-700 transition-colors">
                            <Check size={12} />
                          </button>
                          <button onClick={cancelEdit} className="w-6 h-6 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 transition-colors">
                            <X size={12} />
                          </button>
                        </>
                      ) : (
                        <>
                          <span className="text-sm font-extrabold text-gray-800">৳{fee.amount.toLocaleString()}</span>
                          {fee.name.startsWith("Admission Fee") && (
                            <button onClick={(e) => startEdit(fee, e)} className="w-6 h-6 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 transition-colors">
                              <Pencil size={11} />
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Payment footer */}
            <div className="px-5 py-4 border-t border-gray-100 bg-gray-50/50 flex flex-col gap-3">
              {customTuitionFee !== null && baseClassFee > 0 && (
                <div className="flex justify-between items-center text-xs text-amber-700 bg-amber-50 px-3 py-1.5 rounded-xl">
                  <span>Custom tuition active:</span>
                  <span className="font-bold">
                    ৳{customTuitionFee}/mo{" "}
                    <span className="font-normal text-amber-500">(default ৳{baseClassFee})</span>
                  </span>
                </div>
              )}

              {/* Totals */}
              <div className="flex flex-col gap-1.5 text-xs">
                <div className="flex justify-between text-gray-500">
                  <span>{selectedIds.length} item{selectedIds.length !== 1 ? "s" : ""} selected</span>
                  <span className="font-semibold text-gray-700">৳{subtotal.toLocaleString()}</span>
                </div>

                {/* Discount row */}
                <div className="flex items-center justify-between gap-3">
                  <span className="text-gray-500 flex-shrink-0">Discount (optional)</span>
                  <div className="relative w-36">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-semibold">৳</span>
                    <input
                      type="number"
                      min="0"
                      max={subtotal}
                      placeholder="0"
                      value={discount}
                      onChange={(e) => setDiscount(e.target.value)}
                      disabled={selectedIds.length === 0}
                      className="pl-6 w-full ring-1 ring-gray-200 py-1.5 rounded-lg text-xs outline-none focus:ring-2 focus:ring-lamaSky transition-all disabled:opacity-40 text-right pr-2"
                    />
                  </div>
                </div>

                {discountVal > 0 && (
                  <div className="flex justify-between text-red-500 font-semibold">
                    <span>Discount</span>
                    <span>− ৳{discountVal.toLocaleString()}</span>
                  </div>
                )}

                <div className="flex justify-between items-center border-t border-gray-200 pt-2 mt-1">
                  <span className="font-bold text-gray-700 text-sm">Total Collected</span>
                  <span className="text-lg font-extrabold text-gray-900">
                    <span className="text-sm text-lamaSky font-bold">৳</span>
                    {totalCollected.toLocaleString()}
                  </span>
                </div>
              </div>

              <button
                onClick={handleConfirmPayment}
                disabled={loading || selectedIds.length === 0}
                className="w-full bg-lamaSky hover:bg-[#1e40af] text-white font-bold py-3 px-4 rounded-xl transition-all text-sm shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Processing…
                  </>
                ) : (
                  "Confirm Payment & Print Receipt"
                )}
              </button>
            </div>
          </>
        )}
      </div>

      {/* ── PAYMENT HISTORY ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
        <div className="px-5 py-4 border-b border-gray-50">
          <h2 className="text-sm font-bold text-gray-800">Payment History</h2>
          <p className="text-[11px] text-gray-400 mt-0.5">
            {paidFees.length === 0
              ? "No payments recorded yet."
              : `${paidFees.length} paid transaction${paidFees.length !== 1 ? "s" : ""}`}
          </p>
        </div>

        {paidFees.length === 0 ? (
          <div className="py-10 flex flex-col items-center gap-2">
            <p className="text-xs text-gray-400">No payment history yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {paidFees.map((fee) => (
              <div
                key={fee.id}
                className="flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                    <svg className="w-3 h-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-700">{fee.name}</p>
                    <p className="text-[10px] text-gray-400">
                      {fee.month ? `Period: ${fee.month} · ` : ""}
                      {fee.paidAt
                        ? new Date(fee.paidAt).toLocaleDateString("en-GB", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })
                        : ""}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-extrabold text-gray-800">
                    ৳{fee.paidAmount.toLocaleString()}
                  </span>
                  {fee.receiptNo && (
                    <Link
                      href={`/fees/receipt/${fee.receiptNo}`}
                      className="text-[10px] font-bold text-lamaSky bg-lamaSkyLight px-2.5 py-1 rounded-full hover:bg-lamaSky/20 transition-colors"
                    >
                      Receipt
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
