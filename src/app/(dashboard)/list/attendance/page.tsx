import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth-server";
import { redirect } from "next/navigation";
import AttendancePortal from "./AttendancePortal";
import AttendanceAnalytics from "./AttendanceAnalytics";
import Link from "next/link";

interface PageProps {
  searchParams: {
    classId?: string;
    lessonId?: string;
    date?: string;
    studentId?: string;
  };
}

export default async function AttendancePage({ searchParams }: PageProps) {
  const { role, userId } = await auth();

  // Route protection - only authenticated users can access attendance
  if (!role || !userId) {
    redirect("/login");
  }

  const isAdminOrTeacher = role === "admin" || role === "teacher";

  // Date setup (normalized to local date string "YYYY-MM-DD")
  const today = new Date();
  const offset = today.getTimezoneOffset();
  const localToday = new Date(today.getTime() - offset * 60 * 1000);
  const todayStr = localToday.toISOString().split("T")[0];
  const selectedDate = searchParams.date || todayStr;

  if (isAdminOrTeacher) {
    // Fetch classes list (filtered by taught lessons if teacher)
    const classes = await prisma.class.findMany({
      where: role === "teacher" ? { lessons: { some: { teacherId: userId } } } : {},
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    });

    const selectedClassId = searchParams.classId || classes[0]?.id.toString();

    // Fetch lessons for the selected class (filtered by teacher if teacher)
    const lessons = selectedClassId
      ? await prisma.lesson.findMany({
          where: {
            classId: parseInt(selectedClassId),
            ...(role === "teacher" ? { teacherId: userId } : {}),
          },
          include: {
            subject: { select: { name: true } },
          },
          orderBy: { name: "asc" },
        })
      : [];

    const selectedLessonId = searchParams.lessonId || lessons[0]?.id.toString();

    let students: { id: string; name: string; surname: string }[] = [];
    let existingAttendance: { studentId: string; present: boolean }[] = [];
    let currentLesson = null;

    if (selectedClassId && selectedLessonId) {
      currentLesson = lessons.find((l) => l.id === parseInt(selectedLessonId));

      if (currentLesson) {
        // Fetch students in this class
        students = await prisma.student.findMany({
          where: { classId: parseInt(selectedClassId) },
          select: { id: true, name: true, surname: true },
          orderBy: { name: "asc" },
        });

        // Normalize query date boundary
        const attendanceDate = new Date(selectedDate);
        attendanceDate.setHours(0, 0, 0, 0);

        existingAttendance = await prisma.attendance.findMany({
          where: {
            lessonId: currentLesson.id,
            date: {
              gte: attendanceDate,
              lt: new Date(attendanceDate.getTime() + 24 * 60 * 60 * 1000),
            },
          },
          select: {
            studentId: true,
            present: true,
          },
        });
      }
    }

    return (
      <div className="p-6 bg-[#f8fafe] min-h-screen flex flex-col gap-6">
        {/* HEADER SECTION */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-gray-800 tracking-tight">Attendance Register</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Record daily lecture presence, track absentees, and manage routine roll calls.
            </p>
          </div>
          <div className="flex items-center gap-2 self-end">
            <Link
              href="/"
              className="px-4 py-2 bg-white border border-gray-100 hover:bg-gray-50 text-gray-600 rounded-xl text-xs font-bold shadow-sm transition-all duration-200"
            >
              ← Back to Dashboard
            </Link>
          </div>
        </div>

        {/* FILTERS COCKPIT CARD */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <form method="GET" action="/list/attendance" className="grid gap-4 sm:grid-cols-4 items-end">
            {/* Class Select */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-500">Select Class</label>
              <select
                name="classId"
                className="ring-1 ring-gray-200 p-2.5 rounded-xl text-xs w-full outline-none focus:ring-2 focus:ring-lamaSky transition-all bg-white font-medium text-gray-700"
                defaultValue={selectedClassId || ""}
              >
                <option value="">-- Choose Class --</option>
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    Class {cls.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Lesson Select */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-500">Select Lesson</label>
              <select
                name="lessonId"
                className="ring-1 ring-gray-200 p-2.5 rounded-xl text-xs w-full outline-none focus:ring-2 focus:ring-lamaSky transition-all bg-white font-medium text-gray-700"
                defaultValue={selectedLessonId || ""}
                disabled={!selectedClassId}
              >
                <option value="">-- Choose Lesson --</option>
                {lessons.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name} ({l.subject.name})
                  </option>
                ))}
              </select>
            </div>

            {/* Date Picker */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-500">Register Date</label>
              <input
                type="date"
                name="date"
                defaultValue={selectedDate}
                className="ring-1 ring-gray-200 p-2.5 rounded-xl text-xs w-full outline-none focus:ring-2 focus:ring-lamaSky transition-all bg-white font-medium text-gray-700"
              />
            </div>

            {/* Load Button */}
            <button
              type="submit"
              className="bg-lamaSky hover:bg-[#38b1d8] text-white font-bold p-2.5 rounded-xl text-xs transition-all duration-200 shadow-sm flex items-center justify-center gap-1.5 transform hover:scale-[1.01] active:scale-[0.99] w-full"
            >
              🔍 Load Register
            </button>
          </form>
        </div>

        {/* BULK ATTENDANCE REGISTER */}
        {selectedClassId && selectedLessonId && currentLesson ? (
          students.length > 0 ? (
            <AttendancePortal
              lessonId={currentLesson.id}
              lessonTitle={`${currentLesson.name} (${currentLesson.subject.name})`}
              date={selectedDate}
              students={students}
              existingAttendance={existingAttendance}
            />
          ) : (
            <div className="bg-white p-12 text-center border border-gray-100 rounded-2xl shadow-sm">
              <span className="text-3xl block mb-2">👥</span>
              <h3 className="text-sm font-bold text-gray-700">No Students Found</h3>
              <p className="text-xs text-gray-400 mt-1">There are no students enrolled in Class {classes.find(c => c.id === parseInt(selectedClassId))?.name || ""}.</p>
            </div>
          )
        ) : (
          <div className="bg-white p-12 text-center border border-gray-100 rounded-2xl shadow-sm flex flex-col items-center justify-center">
            <span className="text-3xl block mb-2">📅</span>
            <h3 className="text-sm font-bold text-gray-700">Select Class & Lesson</h3>
            <p className="text-xs text-gray-400 mt-1 max-w-xs">
              Choose an active class grade and subject lesson from the cockpit above to pull the attendance register.
            </p>
          </div>
        )}
      </div>
    );
  }

  // Student View - Personal read-only analytics logs
  if (role === "student") {
    let selectedStudentId = userId;

    // Fetch the target student details
    const student = selectedStudentId
      ? await prisma.student.findUnique({
          where: { id: selectedStudentId },
          select: { id: true, name: true, surname: true },
        })
      : null;

    // Fetch attendance records for this student
    const records = selectedStudentId
      ? await prisma.attendance.findMany({
          where: { studentId: selectedStudentId },
          include: {
            lesson: {
              select: {
                name: true,
                subject: {
                  select: { name: true },
                },
              },
            },
          },
          orderBy: { date: "desc" },
        })
      : [];

    return (
      <div className="p-6 bg-[#f8fafe] min-h-screen flex flex-col gap-6">
        {/* HEADER SECTION */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-gray-800 tracking-tight">Attendance Record</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Your personal daily presence history and visual attendance percentage cards.
            </p>
          </div>
          <div className="flex items-center gap-2 self-end">
            <Link
              href="/"
              className="px-4 py-2 bg-white border border-gray-100 hover:bg-gray-50 text-gray-600 rounded-xl text-xs font-bold shadow-sm transition-all duration-200"
            >
              ← Back to Dashboard
            </Link>
          </div>
        </div>

        {/* Analytics & Table Rendering */}
        {student ? (
          <AttendanceAnalytics
            studentName={`${student.name} ${student.surname}`}
            studentId={student.id}
            records={records}
          />
        ) : (
          <div className="bg-white p-12 text-center border border-gray-100 rounded-2xl shadow-sm">
            <span className="text-3xl block mb-2 font-emoji">📂</span>
            <h3 className="text-sm font-bold text-gray-700">No Student Records Found</h3>
            <p className="text-xs text-gray-400 mt-1">We couldn't retrieve any student profile connected to this session.</p>
          </div>
        )}
      </div>
    );
  }

  // Fallback redirect for other roles
  redirect("/");
}
