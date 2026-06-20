import prisma from "@/lib/prisma";
import Link from "next/link";
import { UserCheck } from "lucide-react";

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
    <div className="bg-white rounded-2xl shadow-sm ring-1 ring-slate-100 p-5 flex-1 min-w-[140px] hover:shadow-md transition-shadow border-l-4 border-violet-500">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Today&apos;s Attendance</p>
          <h2 className="text-3xl font-bold text-slate-800 mt-1">
            {rate !== null ? `${rate}%` : "—"}
          </h2>
        </div>
        <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center flex-shrink-0">
          <UserCheck size={20} className="text-violet-600" />
        </div>
      </div>
      <p className="text-[11px] text-slate-400 mt-3">
        {total > 0 ? `${present} / ${total} records` : "No data yet"}
      </p>
      <Link href="/list/attendance" className="text-[11px] text-blue-600 hover:underline mt-1 block">
        Take Attendance →
      </Link>
    </div>
  );
};

export default TodayAttendanceCard;
