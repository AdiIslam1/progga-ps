import prisma from "@/lib/prisma";
import { ClipboardList } from "lucide-react";
import Link from "next/link";

const UpcomingExamsPanel = async ({ classId }: { classId?: number }) => {
  const upcoming = await prisma.examSchedule.findMany({
    where: {
      date: { gte: new Date() },
      ...(classId !== undefined ? { classId } : {}),
    },
    orderBy: { date: "asc" },
    take: 5,
    include: {
      exam: { select: { title: true } },
      subject: { select: { name: true } },
      class: { select: { name: true } },
    },
  });

  return (
    <div className="bg-white p-4 rounded-xl border border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-gray-800">Upcoming Exams</h2>
        <Link href="/exams/schedule" className="text-xs text-blue-500 hover:underline">
          View All
        </Link>
      </div>
      {upcoming.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-4">No upcoming exams scheduled.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {upcoming.map((e) => (
            <div key={e.id} className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-lamaSkyLight flex items-center justify-center flex-shrink-0 mt-0.5">
                <ClipboardList size={14} className="text-blue-500" />
              </div>
              <div className="min-w-0">
                <p className="font-medium text-gray-700 text-sm truncate">
                  {e.exam.title} — {e.subject.name}
                </p>
                <p className="text-xs text-gray-400">
                  Class {e.class.name} ·{" "}
                  {new Intl.DateTimeFormat("en-GB", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  }).format(e.date)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default UpcomingExamsPanel;
