import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth-server";
import { redirect } from "next/navigation";
import Link from "next/link";
import PrintButton from "../../fees/receipt/[receiptNo]/PrintButton";

export default async function ExamSchedulePage({
  searchParams,
}: {
  searchParams: { classId?: string };
}) {
  const { role, userId } = await auth();

  if (!role || !userId) {
    redirect("/");
  }

  const selectedClassId = searchParams.classId;

  // Fetch classes for dropdown filter (Admins/Teachers only)
  const classes = await prisma.class.findMany({
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  // Query schedules
  let scheduleQuery: any = {};
  if (selectedClassId) {
    scheduleQuery = {
      exam: {
        lesson: {
          classId: parseInt(selectedClassId),
        },
      },
    };
  } else if (role === "student") {
    // For students, filter by their own class
    const std = await prisma.student.findUnique({
      where: { id: userId },
      select: { classId: true },
    });
    scheduleQuery = {
      exam: {
        lesson: {
          classId: std?.classId || 0,
        },
      },
    };
  } else if (role === "parent") {
    // For parents, filter by their children's classes
    const kids = await prisma.student.findMany({
      where: { parentId: userId },
      select: { classId: true },
    });
    scheduleQuery = {
      exam: {
        lesson: {
          classId: { in: kids.map((k) => k.classId) },
        },
      },
    };
  } else {
    // Admin/Teacher with no filter: show all
    scheduleQuery = {};
  }

  const schedules = await prisma.examSchedule.findMany({
    where: scheduleQuery,
    include: {
      exam: true,
      subject: true,
    },
    orderBy: {
      date: "asc",
    },
  });

  // Query students for bulk admit cards
  let studentsQuery: any = null;
  if (role === "student") {
    studentsQuery = { id: userId };
  } else if (role === "parent") {
    const kids = await prisma.student.findMany({
      where: { parentId: userId },
      select: { id: true },
    });
    studentsQuery = { id: { in: kids.map((k) => k.id) } };
  } else if (selectedClassId) {
    studentsQuery = { classId: parseInt(selectedClassId) };
  }

  const students = studentsQuery
    ? await prisma.student.findMany({
        where: studentsQuery,
        include: { class: true },
        orderBy: { surname: "asc" },
      })
    : [];

  return (
    <div className="p-4 md:p-6 bg-[#f8fafe] min-h-screen flex flex-col gap-6">
      
      {/* FILTER HEADER (HIDDEN ON PRINT) */}
      <div className="print:hidden flex flex-col gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-800 tracking-tight">Exam Schedules & Admit Cards</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Review exam routines, exam halls, and bulk-print candidates&apos; examination admit cards.
          </p>
        </div>

        {/* Filter for Admin/Teacher */}
        {(role === "admin" || role === "teacher") && (
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <form method="GET" action="/exams/schedule" className="flex flex-col sm:flex-row sm:items-end gap-2 flex-1 max-w-md">
              <div className="flex flex-col gap-1.5 flex-1">
                <label className="text-xs font-semibold text-gray-500">Filter Class</label>
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
              <button
                type="submit"
                className="bg-lamaSky hover:bg-[#38b1d8] text-white font-bold py-2.5 px-4 rounded-xl text-xs transition-colors h-[38px] flex items-center justify-center shadow-sm"
              >
                Filter
              </button>
            </form>

            {students.length > 0 && (
              <div className="flex gap-2">
                <a
                  href="#admit-cards-print-section"
                  className="bg-lamaPurple hover:bg-[#a394f7] text-white font-bold py-2.5 px-4 rounded-xl text-xs transition-colors shadow-sm flex items-center gap-1.5"
                >
                  🎟️ Jump to Admit Cards
                </a>
                <PrintButton />
              </div>
            )}
          </div>
        )}

        {/* Individual Student/Parent Print Button */}
        {(role === "student" || role === "parent") && students.length > 0 && (
          <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
            <span className="text-xs text-gray-500 font-semibold">Download Exam Admit Card:</span>
            <PrintButton />
          </div>
        )}
      </div>

      {/* SCHEDULE routine TIMETABLE GRID (HIDDEN ON PRINT) */}
      <div className="print:hidden bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col gap-4">
        <h2 className="text-base font-bold text-gray-800 flex items-center gap-2">
          📅 Timetable & Rooms
        </h2>
        {schedules.length === 0 ? (
          <p className="text-xs text-gray-400 italic py-6 text-center">No exams scheduled for the selected filters.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50 text-gray-500 font-bold uppercase text-[9px] tracking-wider">
                  <th className="p-3">Exam Date</th>
                  <th className="p-3">Time</th>
                  <th className="p-3">Exam Title</th>
                  <th className="p-3">Subject</th>
                  <th className="p-3">Room / Hall</th>
                </tr>
              </thead>
              <tbody>
                {schedules.map((sch) => (
                  <tr key={sch.id} className="border-b border-gray-50 text-gray-700 hover:bg-slate-50/50 transition-colors">
                    <td className="p-3 font-bold text-gray-800">
                      {new Date(sch.date).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="p-3 font-semibold text-gray-500">
                      {new Date(sch.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(sch.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="p-3 font-bold text-gray-800">{sch.exam.title}</td>
                    <td className="p-3 font-medium text-gray-400">
                      <span className="bg-lamaSkyLight text-lamaSky px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase">
                        {sch.subject.name}
                      </span>
                    </td>
                    <td className="p-3 font-bold text-gray-700">{sch.room || "Main Exam Hall"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ADMIT CARDS PRINTABLE CONTAINER */}
      {students.length > 0 && (
        <div id="admit-cards-print-section" className="flex flex-col gap-6 print:gap-0 mt-4">
          <h2 className="print:hidden text-base font-bold text-gray-800 flex items-center gap-2">
            🎟️ Generated Admit Slips
          </h2>

          <div className="grid gap-6 md:grid-cols-2 print:block">
            {students.map((student, index) => {
              // Group admit slips: 2 per page during A4 print
              const isPageBreak = index > 0 && index % 2 === 0;

              return (
                <div
                  key={student.id}
                  className={`bg-white p-6 rounded-2xl border-2 border-dashed border-gray-200 relative overflow-hidden print:border-2 print:border-dashed print:border-black print:rounded-none print:p-6 print:my-6 print:shadow-none print:w-[130mm] print:mx-auto print:inline-block print:align-top print:even:ml-4 ${
                    isPageBreak ? "print:break-before-page" : ""
                  }`}
                  style={{ minHeight: "120mm" }}
                >
                  {/* WATERMARK */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-gray-50 font-black text-[25px] tracking-widest uppercase rotate-12 select-none pointer-events-none opacity-40">
                    Bornomala Exam
                  </div>

                  {/* ADMIT HEADER */}
                  <div className="flex flex-col items-center text-center pb-3 border-b-2 border-gray-100 print:border-black">
                    <h3 className="text-sm font-black text-gray-800 uppercase tracking-wide">
                      Bornomala High School
                    </h3>
                    <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">
                      Admit Card • Board Syllabus Terminal Exams
                    </p>
                  </div>

                  {/* STUDENT DETAILS GRID */}
                  <div className="grid grid-cols-2 gap-3 text-[10px] py-4 border-b border-gray-100 print:border-black/50">
                    <div className="flex flex-col">
                      <span className="text-gray-400 font-medium uppercase text-[8px]">Student Name</span>
                      <span className="text-gray-800 font-bold">{student.name} {student.surname}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-gray-400 font-medium uppercase text-[8px]">Class / Grade</span>
                      <span className="text-gray-800 font-bold">Class {student.class?.name || "Unassigned"}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-gray-400 font-medium uppercase text-[8px]">Student Roll / ID</span>
                      <span className="text-gray-800 font-bold">{student.id}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-gray-400 font-medium uppercase text-[8px]">Session</span>
                      <span className="text-gray-800 font-bold">2026</span>
                    </div>
                  </div>

                  {/* INSTRUCTIONS */}
                  <div className="py-3 text-[9px] text-gray-500 flex flex-col gap-1">
                    <span className="font-bold text-gray-700 uppercase text-[8px] tracking-wider">Candidate Instructions:</span>
                    <p className="m-0">• Candidates must bring this printed admit slip to every exam session.</p>
                    <p className="m-0">• Electronic gadgets or mobile devices are strictly forbidden inside halls.</p>
                    <p className="m-0">• Arrive at least 15 minutes before the scheduled time slot.</p>
                  </div>

                  {/* FOOTER SIGNATURES */}
                  <div className="grid grid-cols-2 gap-4 pt-8 text-center text-[9px] mt-2">
                    <div className="flex flex-col items-center">
                      <div className="w-24 h-6 border border-dashed border-gray-300 flex items-center justify-center text-[6px] text-gray-300 rotate-12">
                        Official Seal
                      </div>
                      <span className="text-[8px] text-gray-400 mt-1 uppercase font-semibold">Authorized Stamp</span>
                    </div>
                    <div className="flex flex-col items-center justify-end">
                      <div className="w-full border-t border-dashed border-gray-200 print:border-black pt-1 font-bold text-gray-600">
                        Controller of Exams
                      </div>
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ADMIT CARD PRINT STYLES */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body, html, main, #__next {
            background: white !important;
            color: black !important;
            padding: 0 !important;
            margin: 0 !important;
            width: 100% !important;
            height: auto !important;
          }
          header, footer, nav, aside, [role="navigation"], .print\\:hidden {
            display: none !important;
          }
          .flex, .grid, .min-h-screen {
            display: block !important;
            background: white !important;
          }
          .print\\:break-before-page {
            page-break-before: always !important;
            break-before: page !important;
          }
          @page {
            size: A4 portrait;
            margin: 10mm;
          }
        }
      `}} />
    </div>
  );
}
