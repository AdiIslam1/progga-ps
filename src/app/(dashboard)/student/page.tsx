import Announcements from "@/components/Announcements";
import BigCalendarContainer from "@/components/BigCalendarContainer";
import EventCalendar from "@/components/EventCalendar";
import UpcomingExamsPanel from "@/components/UpcomingExamsPanel";
import { auth } from "@/lib/auth-server";
import prisma from "@/lib/prisma";
import { BookOpen, UserCheck } from "lucide-react";
import Link from "next/link";

const StudentPage = async () => {
  const { userId } = await auth();

  const [student, attendance, outstandingFees] = await Promise.all([
    prisma.student.findUnique({
      where: { id: userId! },
      include: { class: true },
    }),
    prisma.attendance.findMany({
      where: { studentId: userId! },
      select: { present: true },
    }),
    prisma.feeCollection.aggregate({
      where: { studentId: userId!, status: { in: ["UNPAID", "PENDING"] } },
      _sum: { amount: true },
      _count: true,
    }),
  ]);

  const present = attendance.filter((a) => a.present).length;
  const total = attendance.length;
  const attendanceRate = total > 0 ? Math.round((present / total) * 100) : null;
  const outstandingAmount = outstandingFees._sum.amount ?? 0;
  const outstandingCount = outstandingFees._count;

  return (
    <div className="p-4 flex gap-4 flex-col xl:flex-row">
      {/* LEFT */}
      <div className="w-full xl:w-2/3 flex flex-col gap-4">
        {/* Stat cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Attendance */}
          <div className="bg-white p-4 rounded-xl border border-gray-100 flex items-center gap-3 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-lamaSkyLight flex items-center justify-center flex-shrink-0">
              <UserCheck size={20} className="text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">
                {attendanceRate !== null ? `${attendanceRate}%` : "—"}
              </p>
              <p className="text-xs text-gray-400">Attendance</p>
              {total > 0 && (
                <p className="text-xs text-gray-300">{present}/{total} classes</p>
              )}
            </div>
          </div>

          {/* Outstanding fees */}
          <Link
            href="/fees/ledger"
            className="bg-white p-4 rounded-xl border border-gray-100 flex items-center gap-3 shadow-sm hover:shadow-md transition-shadow"
          >
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                outstandingAmount > 0 ? "bg-red-50" : "bg-green-50"
              }`}
            >
              <span className={`text-lg font-bold ${outstandingAmount > 0 ? "text-red-400" : "text-green-500"}`}>
                ৳
              </span>
            </div>
            <div>
              <p className={`text-2xl font-bold ${outstandingAmount > 0 ? "text-red-500" : "text-green-600"}`}>
                ৳{outstandingAmount.toLocaleString()}
              </p>
              <p className="text-xs text-gray-400">
                {outstandingCount > 0
                  ? `${outstandingCount} unpaid ${outstandingCount === 1 ? "fee" : "fees"}`
                  : "All fees paid"}
              </p>
            </div>
          </Link>

          {/* Class */}
          <div className="bg-white p-4 rounded-xl border border-gray-100 flex items-center gap-3 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-lamaPurpleLight flex items-center justify-center flex-shrink-0">
              <BookOpen size={20} className="text-purple-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">
                {student?.class.name ?? "—"}
              </p>
              <p className="text-xs text-gray-400">My Class</p>
            </div>
          </div>
        </div>

        {/* Class schedule */}
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <h1 className="text-lg font-semibold mb-2">Class Schedule</h1>
          {student && (
            <BigCalendarContainer type="classId" id={student.class.id} />
          )}
        </div>
      </div>

      {/* RIGHT */}
      <div className="w-full xl:w-1/3 flex flex-col gap-4">
        <EventCalendar />
        {student && <UpcomingExamsPanel classId={student.classId} />}
        <Announcements />
      </div>
    </div>
  );
};

export default StudentPage;
