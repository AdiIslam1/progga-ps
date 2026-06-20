import prisma from "@/lib/prisma";
import Link from "next/link";
import { AlertCircle } from "lucide-react";

const PendingFeesCard = async () => {
  const result = await prisma.feeCollection.aggregate({
    where: { status: { in: ["UNPAID", "PENDING"] } },
    _count: true,
    _sum: { amount: true },
  });

  const count = result._count;
  const total = result._sum.amount ?? 0;

  return (
    <div className="bg-white rounded-2xl shadow-sm ring-1 ring-slate-100 p-5 flex-1 min-w-[140px] hover:shadow-md transition-shadow border-l-4 border-amber-500">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Pending Fees</p>
          <h2 className="text-3xl font-bold text-slate-800 mt-1">{count}</h2>
        </div>
        <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
          <AlertCircle size={20} className="text-amber-600" />
        </div>
      </div>
      <p className="text-[11px] text-slate-400 mt-3">৳{total.toLocaleString()} outstanding</p>
      <Link href="/fees/ledger" className="text-[11px] text-blue-600 hover:underline mt-1 block">
        View Ledger →
      </Link>
    </div>
  );
};

export default PendingFeesCard;
