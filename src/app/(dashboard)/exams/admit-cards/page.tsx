import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth-server";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import PrintButton from "@/components/PrintButton";

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function fmtDay(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { weekday: "short" });
}

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });
}

export default async function AdmitCardsPage({
  searchParams,
}: {
  searchParams: { examId?: string; classId?: string };
}) {
  const { role, userId } = await auth();
  if (!role || !userId) redirect("/");

  const exams = await prisma.exam.findMany({
    select: { id: true, title: true },
    orderBy: { id: "desc" },
  });

  const classes = await prisma.class.findMany({
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  let selectedExamId = searchParams.examId ? parseInt(searchParams.examId) : (exams[0]?.id ?? null);
  let selectedClassId: number | null = null;

  if (role === "student") {
    const student = await prisma.student.findUnique({
      where: { id: userId },
      select: { classId: true },
    });
    selectedClassId = student?.classId ?? null;
  } else {
    selectedClassId = searchParams.classId ? parseInt(searchParams.classId) : (classes[0]?.id ?? null);
  }

  const selectedExam = exams.find((e) => e.id === selectedExamId);
  const selectedClass = classes.find((c) => c.id === selectedClassId);

  const rawScheduleEntries =
    selectedExamId && selectedClassId
      ? await prisma.examSchedule.findMany({
          where: { examId: selectedExamId, classId: selectedClassId },
          include: { subject: { select: { name: true } } },
          orderBy: { date: "asc" },
        })
      : [];

  const scheduleEntries: Array<{
    id: number;
    subject: { name: string };
    date: string;
    startTime: string;
    endTime: string;
    room: string | null;
  }> = JSON.parse(JSON.stringify(rawScheduleEntries));

  const students =
    selectedClassId
      ? await prisma.student.findMany({
          where: role === "student" ? { id: userId } : { classId: selectedClassId },
          include: { class: { select: { name: true } } },
          orderBy: [{ surname: "asc" }, { name: "asc" }],
        })
      : [];

  const year = new Date().getFullYear();

  return (
    <>
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #admit-print-root, #admit-print-root * { visibility: visible !important; }
          #admit-print-root { position: fixed; inset: 0; padding: 16px; background: #fff; }
          .no-print { display: none !important; }
          @page { size: A4 portrait; margin: 10mm; }
        }
      `}</style>

      <div className="p-6 bg-[#f8fafe] min-h-screen flex flex-col gap-6">
        {/* Header */}
        <div className="no-print flex items-center justify-between flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-2 text-xs text-gray-400 mb-1">
              <Link href={`/exams/schedule?examId=${selectedExamId}&classId=${selectedClassId}`} className="hover:text-lamaSky">
                Exam Schedule
              </Link>
              <span>/</span>
              <span className="text-gray-600 font-medium">Admit Cards</span>
            </div>
            <h1 className="text-2xl font-extrabold text-gray-800 tracking-tight">Admit Cards</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {selectedExam ? `${selectedExam.title} · Class ${selectedClass?.name}` : "Select exam and class"}
            </p>
          </div>
          {students.length > 0 && scheduleEntries.length > 0 && (
            <PrintButton label="Print All Cards" className="no-print flex items-center gap-2 bg-lamaSky text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-[#38b1d8] transition-colors" />
          )}
        </div>

        {/* Filters */}
        {role !== "student" && (
          <form
            method="GET"
            action="/exams/admit-cards"
            className="no-print bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-wrap items-end gap-3"
          >
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-gray-500">Exam</label>
              <select
                name="examId"
                defaultValue={selectedExamId?.toString() ?? ""}
                className="ring-1 ring-gray-200 p-2.5 rounded-xl text-sm outline-none focus:ring-2 focus:ring-lamaSky bg-white min-w-[180px]"
              >
                {exams.map((e) => (
                  <option key={e.id} value={e.id}>{e.title}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-gray-500">Class</label>
              <select
                name="classId"
                defaultValue={selectedClassId?.toString() ?? ""}
                className="ring-1 ring-gray-200 p-2.5 rounded-xl text-sm outline-none focus:ring-2 focus:ring-lamaSky bg-white"
              >
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>Class {c.name}</option>
                ))}
              </select>
            </div>
            <button
              type="submit"
              className="bg-lamaSky text-white font-semibold py-2.5 px-5 rounded-xl text-sm hover:bg-[#38b1d8] transition-colors"
            >
              Load
            </button>
          </form>
        )}

        {scheduleEntries.length === 0 && (
          <div className="no-print text-center py-10 text-gray-400 text-sm">
            {!selectedExamId || !selectedClassId
              ? "Select an exam and class to generate admit cards."
              : "No exam schedule found. Add subjects to the schedule first."}
          </div>
        )}

        {/* Admit cards */}
        {students.length > 0 && scheduleEntries.length > 0 && (
          <div id="admit-print-root">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 print:block print:gap-0">
              {students.map((student, index) => (
                <div
                  key={student.id}
                  className={`relative bg-white border-2 border-dashed border-gray-200 rounded-2xl p-5 overflow-hidden print:border-2 print:border-gray-400 print:rounded-none print:p-5 print:mb-4 print:break-inside-avoid ${
                    index > 0 && index % 2 === 0 ? "print:break-before-page" : ""
                  }`}
                >
                  {/* Watermark */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none opacity-[0.06]">
                    <img src="/school-logo.jpg" alt="" className="w-40 h-40 object-contain rotate-12" />
                  </div>

                  {/* Header */}
                  <div className="flex items-center gap-3 pb-3 border-b-2 border-gray-200 print:border-gray-400">
                    <img src="/school-logo.jpg" alt="Logo" className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
                    <div className="text-center flex-1">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
                        Progga Preparatory &amp; High School
                      </p>
                      <p className="text-xs font-extrabold text-gray-800 uppercase tracking-wide">
                        Admit Card · {selectedExam?.title}
                      </p>
                    </div>
                  </div>

                  {/* Student info */}
                  <div className="flex items-start gap-3 py-3 border-b border-gray-100 print:border-gray-300">
                    <div className="w-14 h-14 rounded-lg overflow-hidden border border-gray-200 flex-shrink-0 bg-gray-50">
                      <Image
                        src={student.img || "/noAvatar.png"}
                        alt=""
                        width={56}
                        height={56}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 flex-1 text-[10px]">
                      <div>
                        <p className="text-gray-400 uppercase font-semibold text-[8px]">Student Name</p>
                        <p className="font-bold text-gray-800">{student.name} {student.surname}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 uppercase font-semibold text-[8px]">Class</p>
                        <p className="font-bold text-gray-800">Class {student.class?.name}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 uppercase font-semibold text-[8px]">Student ID</p>
                        <p className="font-bold text-gray-800 font-mono">{student.studentId}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 uppercase font-semibold text-[8px]">Session</p>
                        <p className="font-bold text-gray-800">{year}</p>
                      </div>
                    </div>
                  </div>

                  {/* Exam schedule */}
                  <div className="py-2">
                    <p className="text-[8px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">Examination Schedule</p>
                    <table className="w-full text-[9px] border-collapse">
                      <thead>
                        <tr className="bg-gray-50 print:bg-transparent">
                          <th className="border border-gray-200 px-2 py-1 text-left text-gray-500 print:border-gray-400">Subject</th>
                          <th className="border border-gray-200 px-2 py-1 text-left text-gray-500 print:border-gray-400">Date</th>
                          <th className="border border-gray-200 px-2 py-1 text-left text-gray-500 print:border-gray-400">Day</th>
                          <th className="border border-gray-200 px-2 py-1 text-left text-gray-500 print:border-gray-400">Time</th>
                          <th className="border border-gray-200 px-2 py-1 text-left text-gray-500 print:border-gray-400">Room</th>
                        </tr>
                      </thead>
                      <tbody>
                        {scheduleEntries.map((entry) => (
                          <tr key={entry.id}>
                            <td className="border border-gray-100 px-2 py-1 font-semibold text-gray-800 print:border-gray-300">{entry.subject.name}</td>
                            <td className="border border-gray-100 px-2 py-1 text-gray-600 print:border-gray-300">{fmtDate(entry.date)}</td>
                            <td className="border border-gray-100 px-2 py-1 text-gray-500 print:border-gray-300">{fmtDay(entry.date)}</td>
                            <td className="border border-gray-100 px-2 py-1 text-gray-600 print:border-gray-300">{fmtTime(entry.startTime)}–{fmtTime(entry.endTime)}</td>
                            <td className="border border-gray-100 px-2 py-1 text-gray-500 print:border-gray-300">{entry.room || "Main Hall"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Instructions */}
                  <div className="text-[8px] text-gray-400 pt-2 border-t border-gray-100 print:border-gray-300 flex flex-col gap-0.5">
                    <span className="font-bold text-gray-600 uppercase tracking-wide text-[7px]">Instructions:</span>
                    <span>• Bring this admit card to every exam session.</span>
                    <span>• Mobile devices are strictly forbidden inside the hall.</span>
                    <span>• Arrive at least 15 minutes before the scheduled time.</span>
                  </div>

                  {/* Signatures */}
                  <div className="grid grid-cols-2 gap-4 pt-4 mt-1">
                    <div className="flex flex-col items-center text-center">
                      <div className="w-20 h-8 border border-dashed border-gray-300 print:border-gray-400 mb-1" />
                      <span className="text-[8px] text-gray-400 uppercase font-semibold">Authorized Stamp</span>
                    </div>
                    <div className="flex flex-col items-end text-center">
                      <div className="w-full border-t border-dashed border-gray-300 print:border-gray-400 pt-1">
                        <span className="text-[8px] text-gray-500 font-bold">Controller of Exams</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
