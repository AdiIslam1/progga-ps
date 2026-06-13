import prisma from "@/lib/prisma";
import Link from "next/link";

const TodayAttendanceCard = async () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  const records = await prisma.attendance.findMany({
    where: { date: { gte: today, lt: tomorrow } },
    select: { present: true },
  });

  const total = records.length;
  const present = records.filter((r) => r.present).length;
  const rate = total > 0 ? Math.round((present / total) * 100) : null;

  return (
    <div className="rounded-2xl bg-lamaSky p-4 flex-1 min-w-[130px]">
      <div className="flex justify-between items-center">
        <span className="text-[10px] bg-white px-2 py-1 rounded-full text-blue-700">
          Today
        </span>
      </div>
      <h1 className="text-2xl font-semibold my-4">
        {rate !== null ? `${rate}%` : "—"}
      </h1>
      <h2 className="text-sm font-medium text-gray-500">Attendance Rate</h2>
      <p className="text-xs text-gray-500 mt-1">
        {total > 0 ? `${present} / ${total} records` : "No data yet"}
      </p>
      <Link href="/list/attendance" className="text-xs text-blue-600 hover:underline mt-1 block">
        Take Attendance →
      </Link>
    </div>
  );
};

export default TodayAttendanceCard;
