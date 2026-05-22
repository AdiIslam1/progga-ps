"use client";

import { deleteExpense } from "@/lib/feeActions";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "react-toastify";

export default function DeleteExpenseBtn({ id, title }: { id: number; title: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete the expense entry "${title}"?`)) {
      return;
    }

    setLoading(true);
    try {
      const res = await deleteExpense(id);
      if (res.success) {
        toast.success(`Expense entry "${title}" deleted!`);
        router.refresh();
      } else {
        toast.error("Failed to delete expense entry.");
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="text-xs font-bold text-red-500 hover:text-red-700 transition-colors"
      title="Delete Entry"
    >
      {loading ? "..." : "Delete ✕"}
    </button>
  );
}
