import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth-server";
import { redirect } from "next/navigation";
import { Day } from "@prisma/client";

export default async function ClassRoutinePage({
  searchParams,
}: {
  searchParams: { classId?: string };
}) {
  const { role, userId } = await auth();

  if (!role || !userId) {
    redirect("/");
  }

  const selectedClassId = searchParams.classId;

  // Fetch all classes for filters (Admins/Teachers)
  const classes = await prisma.class.findMany({
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  // Query lessons based on role
  let lessonsQuery: any = {};

  if (role === "student") {
    const std = await prisma.student.findUnique({
      where: { id: userId },
      select: { classId: true },
    });
    lessonsQuery = { classId: std?.classId || 0 };
  } else if (role === "parent") {
    const kids = await prisma.student.findMany({
      where: { parentId: userId },
      select: { classId: true },
    });
    lessonsQuery = { classId: { in: kids.map((k) => k.classId) } };
  } else if (role === "teacher") {
    // Teachers view their assigned teaching routine
    lessonsQuery = { teacherId: userId };
  } else {
    // Admin selects class to view routine
    if (selectedClassId) {
      lessonsQuery = { classId: parseInt(selectedClassId) };
    } else {
      // Default to first class if none selected by admin
      lessonsQuery = classes.length > 0 ? { classId: classes[0].id } : null;
    }
  }

  const lessons = lessonsQuery
    ? await prisma.lesson.findMany({
        where: lessonsQuery,
        include: {
          subject: true,
          class: true,
          teacher: true,
        },
        orderBy: {
          startTime: "asc",
        },
      })
    : [];

  // Group lessons by Day
  const daysOfWeek: Day[] = [
    Day.SAT,
    Day.MONDAY,
    Day.TUESDAY,
    Day.WEDNESDAY,
    Day.THURSDAY,
    Day.FRIDAY,
  ];

  const groupedRoutine = daysOfWeek.map((day) => {
    const dayLessons = lessons.filter((l) => l.day === day);
    return { day, dayLessons };
  });

  const getDayLabel = (day: Day) => {
    if (day === Day.SAT) return "Saturday";
    if (day === Day.MONDAY) return "Monday";
    if (day === Day.TUESDAY) return "Tuesday";
    if (day === Day.WEDNESDAY) return "Wednesday";
    if (day === Day.THURSDAY) return "Thursday";
    if (day === Day.FRIDAY) return "Friday";
    return day;
  };

  return (
    <div className="p-6 bg-[#f8fafe] min-h-screen flex flex-col gap-6">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-800 tracking-tight">Class Routine</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Weekly academic schedule including Saturday routines and subject timetables.
          </p>
        </div>
      </div>

      {/* FILTER BOX FOR ADMIN / TEACHER */}
      {(role === "admin" || role === "teacher") && (
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <form method="GET" action="/routine" className="flex flex-col sm:flex-row sm:items-end gap-2 flex-1 max-w-md">
            <div className="flex flex-col gap-1.5 flex-1">
              <label className="text-xs font-semibold text-gray-500">Filter Class Routine</label>
              <select
                name="classId"
                className="ring-1 ring-gray-200 p-2.5 rounded-xl text-xs w-full outline-none focus:ring-2 focus:ring-lamaSky transition-all bg-white"
                defaultValue={selectedClassId || (classes.length > 0 ? classes[0].id.toString() : "")}
              >
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    Class {cls.name}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="submit"
              className="bg-lamaSky hover:bg-[#38b1d8] text-white font-bold py-2.5 px-4 rounded-xl text-xs transition-colors h-[38px] flex items-center justify-center shadow-sm"
            >
              Filter
            </button>
          </form>
          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider bg-gray-50 px-3 py-1.5 rounded-full shadow-sm">
            Active view: Class {classes.find(c => c.id.toString() === selectedClassId)?.name || (classes.length > 0 ? classes[0].name : "None")}
          </span>
        </div>
      )}

      {/* WEEKLY routine COLUMN DECK */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 items-start">
        {groupedRoutine.map(({ day, dayLessons }) => (
          <div
            key={day}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-col gap-4 min-h-[300px] relative overflow-hidden"
          >
            {/* Visual Accent */}
            <div className={`absolute top-0 left-0 right-0 h-1 ${
              day === Day.SAT ? "bg-amber-400" : "bg-lamaSky"
            }`} />

            <div className="flex items-center justify-between border-b border-gray-50 pb-2">
              <span className={`text-xs font-black uppercase tracking-wider ${
                day === Day.SAT ? "text-amber-600" : "text-gray-800"
              }`}>
                {getDayLabel(day)}
              </span>
              <span className="bg-gray-50 text-[10px] font-bold text-gray-400 px-2 py-0.5 rounded-full">
                {dayLessons.length} Periods
              </span>
            </div>

            {dayLessons.length === 0 ? (
              <div className="flex-1 flex items-center justify-center py-10">
                <span className="text-xs text-gray-300 italic">No Scheduled Classes</span>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {dayLessons.map((lesson) => (
                  <div
                    key={lesson.id}
                    className="p-3 rounded-xl border border-gray-100 hover:border-gray-200 bg-gray-50/50 hover:bg-gray-50 transition-all duration-200 flex flex-col gap-1.5"
                  >
                    <div className="flex justify-between items-start gap-1">
                      <span className="text-xs font-extrabold text-gray-800 line-clamp-1">
                        {lesson.subject.name}
                      </span>
                      {role === "teacher" && (
                        <span className="bg-lamaSkyLight text-lamaSky text-[8px] font-bold px-1.5 py-0.5 rounded">
                          Class {lesson.class.name}
                        </span>
                      )}
                    </div>

                    <div className="text-[10px] text-gray-400 font-semibold flex items-center gap-1.5">
                      ⏱️ {new Date(lesson.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(lesson.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>

                    {role !== "teacher" && (
                      <div className="text-[10px] text-gray-500 font-medium">
                        👤 Tr. {lesson.teacher.name} {lesson.teacher.surname[0]}.
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
