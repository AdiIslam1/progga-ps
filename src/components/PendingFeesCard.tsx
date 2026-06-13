import prisma from "@/lib/prisma";
import Link from "next/link";

const PendingFeesCard = async () => {
  const result = await prisma.feeCollection.aggregate({
    where: { status: { in: ["UNPAID", "PENDING"] } },
    _count: true,
    _sum: { amount: true },
  });

  const count = result._count;
  const total = result._sum.amount ?? 0;

  return (
    <div className="rounded-2xl bg-lamaYellow p-4 flex-1 min-w-[130px]">
      <div className="flex justify-between items-center">
        <span className="text-[10px] bg-white px-2 py-1 rounded-full text-orange-700">
          Pending
        </span>
      </div>
      <h1 className="text-2xl font-semibold my-4">{count}</h1>
      <h2 className="text-sm font-medium text-gray-500">Unpaid Collections</h2>
      <p className="text-xs text-gray-500 mt-1">৳{total.toLocaleString()} outstanding</p>
      <Link href="/fees/ledger" className="text-xs text-blue-600 hover:underline mt-1 block">
        View Ledger →
      </Link>
    </div>
  );
};

export default PendingFeesCard;
