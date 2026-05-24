import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth-server";
import { redirect } from "next/navigation";
import Link from "next/link";
import PrintButton from "../fees/receipt/[receiptNo]/PrintButton";

export default async function ReportCardsPage({
  searchParams,
}: {
  searchParams: { classId?: string; term?: string; year?: string };
}) {
  const { role, userId } = await auth();

  if (!role || !userId) {
    redirect("/");
  }

  const selectedClassId = searchParams.classId;
  const selectedTerm = searchParams.term || "FIRST_TERM";
  const selectedYear = searchParams.year || "2026";

  // Fetch classes for administrators/teachers to choose from
  const classes = await prisma.class.findMany({
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  // Determine who we are rendering report cards for
  let studentsQuery: any = {};

  if (role === "student") {
    studentsQuery = { id: userId };
  } else {
    // Admin/Teacher selects class
    if (selectedClassId) {
      studentsQuery = { classId: parseInt(selectedClassId) };
    } else {
      // Don't fetch any students yet if no class is selected by admin/teacher
      studentsQuery = null;
    }
  }

  // Fetch student profiles and their subject exam results
  const students = studentsQuery
    ? await prisma.student.findMany({
        where: studentsQuery,
        include: {
          class: true,
          results: {
            where: {
              exam: {
                term: selectedTerm,
              },
            },
            include: {
              exam: {
                include: {
                  lesson: {
                    include: {
                      subject: true,
                    },
                  },
                },
              },
            },
          },
        },
        orderBy: { surname: "asc" },
      })
    : [];

  const getCgpaGrade = (cgpa: number) => {
    if (cgpa >= 5.0) return "A+";
    if (cgpa >= 4.0) return "A";
    if (cgpa >= 3.5) return "A-";
    if (cgpa >= 3.0) return "B";
    if (cgpa >= 2.0) return "C";
    if (cgpa >= 1.0) return "D";
    return "F";
  };

  return (
    <div className="p-4 md:p-6 bg-[#f8fafe] min-h-screen flex flex-col gap-6">
      {/* FILTER HEADER (HIDDEN ON PRINT) */}
      <div className="print:hidden flex flex-col gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-800 tracking-tight">Academic Report Cards</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {role === "admin" || role === "teacher"
              ? "Bulk print or review terminal result sheets for classes."
              : "Review your child's terminal GPA results and letter grade distributions."}
          </p>
        </div>

        {/* Filter Cockpit for Teachers/Admins */}
        {(role === "admin" || role === "teacher") && (
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row md:items-end gap-4 justify-between">
            <form id="report-cards-filter-form" method="GET" action="/report-cards" className="grid gap-3 sm:grid-cols-3 flex-1">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-500">Class</label>
                <select
                  name="classId"
                  className="ring-1 ring-gray-200 p-2.5 rounded-xl text-xs w-full outline-none focus:ring-2 focus:ring-lamaSky transition-all bg-white"
                  defaultValue={selectedClassId || ""}
                  required
                >
                  <option value="">-- Select Class --</option>
                  {classes.map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      Class {cls.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-500">Term</label>
                <select
                  name="term"
                  className="ring-1 ring-gray-200 p-2.5 rounded-xl text-xs w-full outline-none focus:ring-2 focus:ring-lamaSky transition-all bg-white"
                  defaultValue={selectedTerm}
                >
                  <option value="FIRST_TERM">First Term</option>
                  <option value="HALF_YEARLY">Half-Yearly Exam</option>
                  <option value="FINAL_EXAM">Final Examination</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-500">Year</label>
                <select
                  name="year"
                  className="ring-1 ring-gray-200 p-2.5 rounded-xl text-xs w-full outline-none focus:ring-2 focus:ring-lamaSky transition-all bg-white"
                  defaultValue={selectedYear}
                >
                  <option value="2026">2026</option>
                  <option value="2027">2027</option>
                </select>
              </div>
            </form>

            <div className="flex gap-2">
              <button
                type="submit"
                form="report-cards-filter-form"
                className="bg-lamaSky hover:bg-[#38b1d8] text-white font-bold py-2.5 px-6 rounded-xl text-xs shadow-sm transition-colors"
              >
                Generate Results
              </button>
              {students.length > 0 && <PrintButton />}
            </div>
          </div>
        )}

        {/* Print trigger for students */}
        {role === "student" && students.length > 0 && (
          <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
            <span className="text-xs text-gray-500 font-semibold">Print terminal card for records:</span>
            <PrintButton />
          </div>
        )}
      </div>

      {/* RENDER BULK REPORT CARDS */}
      {students.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-gray-100 shadow-sm text-center py-20 print:hidden">
          <div className="w-16 h-16 rounded-full bg-lamaSkyLight flex items-center justify-center text-lamaSky text-3xl mx-auto mb-4">
            🎓
          </div>
          <h2 className="text-base font-bold text-gray-800">
            {role === "admin" || role === "teacher"
              ? "Select Class and Term first"
              : "No Results Published"}
          </h2>
          <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
            {role === "admin" || role === "teacher"
              ? "Use the cockpit filters above to select class exam results to view/bulk-print."
              : "Your terminal examinations results have not been generated or published for this term yet."}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-8 print:gap-0">
          {students.map((student) => {
            // Aggregate subject scores
            const subjectsScores = student.results.map((r) => {
              const scoreVal = r.score;
              const gpa = r.gpa || 0.0;
              const grade = r.grade || "F";
              const subjectName = r.exam?.lesson?.subject?.name || "Other";
              return { subjectName, scoreVal, grade, gpa };
            });

            // Calculate terminal average GPA
            const totalGPA = subjectsScores.reduce((sum, item) => sum + item.gpa, 0);
            const averageGPA = subjectsScores.length > 0 ? parseFloat((totalGPA / subjectsScores.length).toFixed(2)) : 0.0;
            const finalGrade = getCgpaGrade(averageGPA);

            return (
              <div
                key={student.id}
                className="bg-white p-8 md:p-10 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden print:shadow-none print:border-none print:p-0 print:m-0 print:break-after-page min-h-[297mm] w-full max-w-3xl mx-auto flex flex-col justify-between"
              >
                {/* Print Accent */}
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-[#4facfe] print:hidden" />

                <div>
                  {/* SCHOOL HEADER */}
                  <div className="flex flex-col items-center text-center pb-6 border-b border-gray-100">
                    <img src="/school-logo.jpg" alt="School Logo" className="w-14 h-14 rounded-full object-cover mb-2" />
                    <h2 className="text-2xl font-black text-gray-800 uppercase tracking-wide">
                      Progga Preparatory and High School
                    </h2>
                    <p className="text-xs text-gray-400 mt-1">
                      Dhaka, Bangladesh • Academic Report Card
                    </p>
                    <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold mt-2 bg-gray-50 px-4 py-1.5 rounded-full inline-block">
                      {selectedTerm.replace("_", " ")} • Session {selectedYear}
                    </p>
                  </div>

                  {/* STUDENT IDENTITY GRID */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs py-6 border-b border-gray-50 bg-[#fafcff]/50 p-4 rounded-xl border border-gray-100/50 my-6">
                    <div className="flex flex-col">
                      <span className="text-gray-400 font-semibold uppercase text-[9px] tracking-wider">Student Name</span>
                      <span className="text-gray-800 font-bold mt-0.5">{student.name} {student.surname}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-gray-400 font-semibold uppercase text-[9px] tracking-wider">Class / Grade</span>
                      <span className="text-gray-800 font-bold mt-0.5">Class {student.class?.name || "Unassigned"}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-gray-400 font-semibold uppercase text-[9px] tracking-wider">Student ID</span>
                      <span className="text-gray-800 font-bold mt-0.5">{student.id}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-gray-400 font-semibold uppercase text-[9px] tracking-wider">Blood Type</span>
                      <span className="text-gray-800 font-bold mt-0.5">{student.bloodType || "N/A"}</span>
                    </div>
                  </div>

                  {/* RESULTS SHEET TABLE */}
                  <div className="my-6">
                    <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Marksheet statement</h3>
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-gray-100 bg-gray-50 text-gray-500 font-bold uppercase text-[9px] tracking-wider">
                          <th className="py-2.5 px-3">Subject</th>
                          <th className="py-2.5 px-3 w-32">Obtained Marks</th>
                          <th className="py-2.5 px-3 w-32">Letter Grade</th>
                          <th className="py-2.5 px-3 w-32 text-right">Grade Point</th>
                        </tr>
                      </thead>
                      <tbody>
                        {subjectsScores.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="py-6 text-center text-gray-400 italic">No exams recorded for this student.</td>
                          </tr>
                        ) : (
                          subjectsScores.map((item, index) => (
                            <tr key={index} className="border-b border-gray-50 text-gray-700">
                              <td className="py-3 px-3 font-bold">{item.subjectName}</td>
                              <td className="py-3 px-3 font-semibold text-gray-600">{item.scoreVal}</td>
                              <td className={`py-3 px-3 font-black ${item.grade === "F" ? "text-red-500" : "text-gray-800"}`}>{item.grade}</td>
                              <td className={`py-3 px-3 text-right font-black ${item.grade === "F" ? "text-red-500" : "text-gray-800"}`}>{item.gpa.toFixed(1)}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* SUMMARY BOARD METRICS */}
                  <div className="flex flex-col items-end gap-2 border-t border-gray-100 pt-5 my-6 text-xs">
                    <div className="flex justify-between w-64 items-center">
                      <span className="text-gray-500 font-semibold">Total Subjects:</span>
                      <span className="text-gray-700 font-bold">{subjectsScores.length}</span>
                    </div>
                    <div className="flex justify-between w-64 items-center border-t border-gray-100 pt-2 text-sm">
                      <span className="text-gray-800 font-bold">Terminal CGPA:</span>
                      <span className={`text-base font-extrabold ${finalGrade === "F" ? "text-red-600" : "text-[#4facfe]"}`}>
                        {averageGPA.toFixed(2)} / 5.0
                      </span>
                    </div>
                    <div className="flex justify-between w-64 items-center">
                      <span className="text-gray-800 font-bold">Overall Letter Grade:</span>
                      <span className={`text-base font-black ${finalGrade === "F" ? "text-red-600 animate-pulse" : "text-gray-800"}`}>
                        {finalGrade}
                      </span>
                    </div>
                  </div>
                </div>

                {/* BOARD SIGNATURES */}
                <div className="grid grid-cols-3 gap-6 pt-24 text-center text-xs mt-12">
                  <div className="flex flex-col items-center">
                    <div className="w-full border-t border-dashed border-gray-200 pt-2 text-[10px] text-gray-400 uppercase font-semibold">
                      Class Teacher
                    </div>
                  </div>
                  <div className="flex flex-col items-center">
                    <div className="w-full border-t border-dashed border-gray-200 pt-2 text-[10px] text-gray-400 uppercase font-semibold">
                      Guardian / Parent
                    </div>
                  </div>
                  <div className="flex flex-col items-center">
                    <div className="w-full border-t border-dashed border-gray-200 pt-2 text-[10px] text-gray-400 uppercase font-semibold">
                      Headmaster Signature
                    </div>
                  </div>
                </div>

                {/* STATEMENT PRINT NOTE */}
                <p className="text-[9px] text-gray-300 italic text-center mt-12 border-t border-gray-50 pt-3 select-none">
                  Generated electronically via Progga Preparatory and High School Result Suite. Board standard grading applied.
                </p>
              </div>
            );
          })}
        </div>
      )}

      {/* Bulk Print Styles */}
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
          .max-w-3xl {
            max-width: 100% !important;
            width: 100% !important;
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          .print\\:break-after-page {
            page-break-after: always !important;
            break-after: page !important;
          }
          @page {
            size: A4 portrait;
            margin: 15mm;
          }
        }
      `}} />
    </div>
  );
}
