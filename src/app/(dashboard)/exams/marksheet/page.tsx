import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth-server";
import { redirect } from "next/navigation";
import MarksheetPortal from "./MarksheetPortal";
import Link from "next/link";

export default async function MarksheetPage({
  searchParams,
}: {
  searchParams: { classId?: string; subjectId?: string; examId?: string };
}) {
  const { role } = await auth();

  // Route protection - only Admin and Teacher can access bulk marksheet recording
  if (role !== "admin" && role !== "teacher") {
    redirect("/");
  }

  const selectedClassId = searchParams.classId;
  const selectedSubjectId = searchParams.subjectId;
  const selectedExamId = searchParams.examId;

  // Fetch all classes and subjects for filter dropdowns
  const classes = await prisma.class.findMany({
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  const subjects = await prisma.subject.findMany({
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  // Fetch exams belonging to the selected Class & Subject pair
  const exams = (selectedClassId && selectedSubjectId)
    ? await prisma.exam.findMany({
        where: {
          lesson: {
            classId: parseInt(selectedClassId),
            subjectId: parseInt(selectedSubjectId),
          },
        },
        orderBy: { id: "desc" },
      })
    : [];

  let students: { id: string; name: string; surname: string }[] = [];
  let existingResults: { studentId: string; score: number; grade: string | null; gpa: number | null }[] = [];
  let currentExam = null;

  if (selectedClassId && selectedExamId) {
    currentExam = await prisma.exam.findUnique({
      where: { id: parseInt(selectedExamId) },
    });

    if (currentExam) {
      // Fetch students in this class
      students = await prisma.student.findMany({
        where: { classId: parseInt(selectedClassId) },
        select: { id: true, name: true, surname: true },
        orderBy: { surname: "asc" },
      });

      // Fetch existing results for this exam
      const resultsData = await prisma.result.findMany({
        where: { examId: currentExam.id },
        select: { studentId: true, score: true, grade: true, gpa: true },
      });

      existingResults = resultsData;
    }
  }

  return (
    <div className="p-6 bg-[#f8fafe] min-h-screen flex flex-col gap-6">
      {/* HEADER SECTION */}
      <div>
        <h1 className="text-2xl font-extrabold text-gray-800 tracking-tight">Marksheet Entry</h1>
        <p className="text-sm text-gray-500 mt-0.5">Bulk record terminal and term examination grades for classes using board standard GPA levels.</p>
      </div>

      {/* FILTERS COCKPIT CARD */}
      <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
        <form method="GET" action="/exams/marksheet" className="grid gap-4 sm:grid-cols-4 items-end">
          {/* Class Select */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-500">Select Class</label>
            <select
              name="classId"
              className="ring-1 ring-gray-200 p-2.5 rounded-xl text-xs w-full outline-none focus:ring-2 focus:ring-lamaSky transition-all bg-white"
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

          {/* Subject Select */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-500">Select Subject</label>
            <select
              name="subjectId"
              className="ring-1 ring-gray-200 p-2.5 rounded-xl text-xs w-full outline-none focus:ring-2 focus:ring-lamaSky transition-all bg-white"
              defaultValue={selectedSubjectId || ""}
            >
              <option value="">-- Choose Subject --</option>
              {subjects.map((sub) => (
                <option key={sub.id} value={sub.id}>
                  {sub.name}
                </option>
              ))}
            </select>
          </div>

          {/* Exam Select */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-500">Select Scheduled Exam</label>
            <select
              name="examId"
              className="ring-1 ring-gray-200 p-2.5 rounded-xl text-xs w-full outline-none focus:ring-2 focus:ring-lamaSky transition-all bg-white"
              defaultValue={selectedExamId || ""}
              disabled={exams.length === 0}
            >
              <option value="">
                {exams.length === 0
                  ? "-- Choose Class & Subject First --"
                  : "-- Choose Exam --"}
              </option>
              {exams.map((ex) => (
                <option key={ex.id} value={ex.id}>
                  {ex.title} ({ex.term})
                </option>
              ))}
            </select>
          </div>

          {/* Form Filter Button */}
          <button
            type="submit"
            className="w-full bg-lamaSky hover:bg-[#38b1d8] text-white font-bold py-2.5 px-4 rounded-xl text-xs shadow-sm transition-all duration-200 flex items-center justify-center gap-1.5"
          >
            🔍 Load Marksheet
          </button>
        </form>
      </div>

      {/* SELECTED EXAM MARKSHEET PORTAL */}
      {selectedClassId && selectedExamId && currentExam ? (
        students.length === 0 ? (
          <div className="bg-white p-12 rounded-2xl border border-gray-100 shadow-sm text-center">
            <p className="text-gray-500 font-bold text-sm">No students found in this class.</p>
            <p className="text-xs text-gray-400 mt-1">Make sure you have assigned students to Class {classes.find(c=>c.id.toString()===selectedClassId)?.name}.</p>
          </div>
        ) : (
          <MarksheetPortal
            examId={currentExam.id}
            examTitle={currentExam.title}
            students={students}
            existingResults={existingResults}
          />
        )
      ) : (
        <div className="bg-white p-12 rounded-2xl border border-gray-100 shadow-sm text-center flex flex-col items-center justify-center gap-4 py-20">
          <div className="w-16 h-16 rounded-full bg-lamaSkyLight flex items-center justify-center text-lamaSky text-2xl">
            📝
          </div>
          <div>
            <h2 className="text-base font-bold text-gray-800">Select Exam Parameters</h2>
            <p className="text-xs text-gray-400 mt-1 max-w-sm">Please pick the Class, Subject, and scheduled Examination from the cockpit filters above to load the student grade spreadsheet.</p>
          </div>
        </div>
      )}
    </div>
  );
}
