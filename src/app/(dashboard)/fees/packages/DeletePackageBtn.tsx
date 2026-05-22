"use client";

import { deleteFeePackage } from "@/lib/feeActions";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "react-toastify";
import Image from "next/image";

export default function DeletePackageBtn({ id, name }: { id: number; name: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete "${name}"? All linked records will be affected.`)) {
      return;
    }

    setLoading(true);
    try {
      const res = await deleteFeePackage(id);
      if (res.success) {
        toast.success(`Fee package "${name}" deleted!`);
        router.refresh();
      } else {
        toast.error("Failed to delete the package.");
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
      className="w-7 h-7 flex items-center justify-center rounded-full bg-lamaPurple hover:bg-red-100 group transition-all duration-200"
      title="Delete Package"
    >
      {loading ? (
        <svg className="animate-spin h-4 w-4 text-purple-700 group-hover:text-red-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      ) : (
        <Image src="/delete.png" alt="Delete" width={14} height={14} />
      )}
    </button>
  );
}
