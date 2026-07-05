import prisma from "@/lib/prisma";
import { CheckCircle2, AlertCircle } from "lucide-react";
import { Day } from "@prisma/client";
import Link from "next/link";

const JS_DAY_TO_DB: Record<number, Day | null> = {
  0: null,          // Sunday — no school
  1: "MONDAY",
  2: "TUESDAY",
  3: "WEDNESDAY",
  4: "THURSDAY",
  5: "FRIDAY",
  6: "SAT",
};

const TodayLessonsPanel = async ({ teacherId }: { teacherId: string }) => {
  const todayDay = JS_DAY_TO_DB[new Date().getDay()];

  if (!todayDay) {
    return (
      <div className="bg-white p-4 rounded-xl border border-gray-100">
        <h2 className="font-semibold text-gray-800 mb-2">Today&apos;s Lessons</h2>
        <p className="text-sm text-gray-400 py-4 text-center">No school today.</p>
      </div>
    );
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  const [lessons, attendanceTaken] = await Promise.all([
    prisma.lesson.findMany({
      where: { teacherId, day: todayDay },
      include: {
        subject: { select: { id: true, name: true } },
        class: { select: { id: true, name: true } },
      },
      orderBy: { startTime: "asc" },
    }),
    prisma.attendance.findMany({
      where: {
        date: { gte: today, lt: tomorrow },
        class: { lessons: { some: { teacherId } } },
      },
      select: { classId: true },
      distinct: ["classId"],
    }),
  ]);

  const markedClasses = new Set(attendanceTaken.map((a) => a.classId));
  const pendingCount = lessons.filter((l) => !markedClasses.has(l.class.id)).length;

  return (
    <div className="bg-white p-4 rounded-xl border border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-gray-800">Today&apos;s Lessons</h2>
        <div className="flex items-center gap-2">
          {pendingCount > 0 && (
            <span className="text-xs bg-orange-50 border border-orange-200 text-orange-600 px-2 py-0.5 rounded-full">
              {pendingCount} attendance pending
            </span>
          )}
          <span className="text-xs text-gray-400">{lessons.length} lessons</span>
        </div>
      </div>
      {lessons.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-4">No lessons scheduled today.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {lessons.map((lesson) => {
            const marked = markedClasses.has(lesson.class.id);
            return (
              <div key={lesson.id} className="flex items-center gap-3">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    marked ? "bg-green-50" : "bg-orange-50"
                  }`}
                >
                  {marked ? (
                    <CheckCircle2 size={16} className="text-green-500" />
                  ) : (
                    <AlertCircle size={16} className="text-orange-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-gray-700 truncate">
                    {lesson.subject.name} — Class {lesson.class.name}
                  </p>
                  <p className="text-xs text-gray-400">
                    {new Intl.DateTimeFormat("en-GB", {
                      hour: "2-digit",
                      minute: "2-digit",
                    }).format(lesson.startTime)}{" "}
                    –{" "}
                    {new Intl.DateTimeFormat("en-GB", {
                      hour: "2-digit",
                      minute: "2-digit",
                    }).format(lesson.endTime)}
                  </p>
                </div>
                {!marked && (
                  <Link
                    href="/list/attendance"
                    className="text-xs bg-orange-50 border border-orange-200 text-orange-700 px-2.5 py-1 rounded-md hover:bg-orange-100 flex-shrink-0 transition-colors"
                  >
                    Mark
                  </Link>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default TodayLessonsPanel;
