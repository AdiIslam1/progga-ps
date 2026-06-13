import prisma from "@/lib/prisma";
import Link from "next/link";

const RecentPaymentsPanel = async () => {
  const payments = await prisma.feeCollection.findMany({
    where: { status: "PAID" },
    orderBy: { paidAt: "desc" },
    take: 6,
    select: {
      id: true,
      name: true,
      paidAmount: true,
      paidAt: true,
      receiptNo: true,
      student: { select: { name: true, surname: true } },
    },
  });

  return (
    <div className="bg-white p-4 rounded-xl border border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-gray-800">Recent Payments</h2>
        <Link href="/fees/ledger" className="text-xs text-blue-500 hover:underline">
          View All
        </Link>
      </div>
      {payments.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-4">No payments recorded yet.</p>
      ) : (
        <div className="flex flex-col divide-y divide-gray-50">
          {payments.map((p) => (
            <div key={p.id} className="flex items-center justify-between gap-2 py-2.5 text-sm">
              <div className="min-w-0">
                <p className="font-medium text-gray-700 truncate">
                  {p.student.name} {p.student.surname}
                </p>
                <p className="text-xs text-gray-400 truncate">{p.name}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="font-semibold text-green-600">৳{p.paidAmount.toLocaleString()}</p>
                {p.receiptNo && (
                  <Link
                    href={`/fees/receipt/${p.receiptNo}`}
                    className="text-xs text-blue-400 hover:underline"
                  >
                    #{p.receiptNo}
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RecentPaymentsPanel;
