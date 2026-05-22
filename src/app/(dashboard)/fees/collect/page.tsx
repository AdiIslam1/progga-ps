import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth-server";
import { redirect } from "next/navigation";
import Link from "next/link";
import CollectorPortal from "./CollectorPortal";
import BillFeeForm from "./BillFeeForm";
import Image from "next/image";

export default async function CollectFeesPage({
  searchParams,
}: {
  searchParams: { search?: string; studentId?: string };
}) {
  const { role, username } = await auth();

  // Route protection - only Admin/Accountant can access fees collection portal
  if (role !== "admin") {
    redirect("/");
  }

  const searchQuery = searchParams.search;
  const selectedStudentId = searchParams.studentId;

  // Search students by name, surname, or username
  const studentsFound = searchQuery
    ? await prisma.student.findMany({
        where: {
          OR: [
            { name: { contains: searchQuery, mode: "insensitive" } },
            { surname: { contains: searchQuery, mode: "insensitive" } },
            { username: { contains: searchQuery, mode: "insensitive" } },
          ],
        },
        include: {
          class: {
            select: { name: true },
          },
        },
        take: 5,
      })
    : [];

  let selectedStudent = null;
  let baseClassFee = 0;

  if (selectedStudentId) {
    selectedStudent = await prisma.student.findUnique({
      where: { id: selectedStudentId },
      include: {
        class: true,
        parent: true,
        feeCollections: {
          where: { status: "UNPAID" },
          orderBy: { id: "asc" },
        },
      },
    });

    if (selectedStudent) {
      // Find standard class tuition package to display base rate comparison
      const standardPackage = await prisma.feePackage.findFirst({
        where: {
          classId: selectedStudent.classId,
          name: { contains: "Tuition", mode: "insensitive" },
        },
      });
      baseClassFee = standardPackage?.amount || 0;
    }
  }

  return (
    <div className="p-6 bg-[#f8fafe] min-h-screen flex flex-col gap-6">
      {/* HEADER SECTION */}
      <div>
        <h1 className="text-2xl font-extrabold text-gray-800 tracking-tight">Accountant Portal</h1>
        <p className="text-sm text-gray-500 mt-0.5">Collect school dues, check student ledgers, and invoice custom exam or library fees.</p>
      </div>

      {/* STUDENT SEARCH PANEL */}
      <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col gap-4">
        <form className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
              🔍
            </span>
            <input
              type="text"
              name="search"
              placeholder="Search Student by First Name, Surname, or Student ID..."
              defaultValue={searchQuery || ""}
              className="pl-10 ring-1 ring-gray-200 p-3 rounded-xl text-sm w-full outline-none focus:ring-2 focus:ring-lamaSky transition-all placeholder:text-gray-300"
            />
          </div>
          <button
            type="submit"
            className="bg-lamaSky hover:bg-[#38b1d8] text-white font-bold py-3 px-6 rounded-xl text-sm shadow-sm transition-all duration-200"
          >
            Search
          </button>
        </form>

        {/* SEARCH RESULTS DROPDOWN */}
        {searchQuery && (
          <div className="border-t border-gray-50 pt-3">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Search Results ({studentsFound.length})</h3>
            {studentsFound.length === 0 ? (
              <p className="text-xs text-gray-500 italic">No matching students found. Try another spelling or Student ID.</p>
            ) : (
              <div className="flex flex-wrap gap-2.5">
                {studentsFound.map((std) => (
                  <Link
                    key={std.id}
                    href={`/fees/collect?search=${searchQuery}&studentId=${std.id}`}
                    className={`px-4 py-2.5 rounded-xl border text-xs font-semibold flex items-center gap-2 transition-all duration-200 ${
                      selectedStudentId === std.id
                        ? "bg-lamaSky border-lamaSky text-white shadow-sm"
                        : "bg-gray-50 border-gray-100 hover:bg-gray-100 hover:border-gray-200 text-gray-700"
                    }`}
                  >
                    <span>{std.name} {std.surname}</span>
                    <span className="text-[10px] opacity-75 font-normal">({std.class?.name || "No Class"} • ID: {std.id})</span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* SELECTED STUDENT LEDGER COCKPIT */}
      {selectedStudent ? (
        <div className="grid gap-6 lg:grid-cols-3 items-start">
          {/* STUDENT DETAILS & PORTAL */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            {/* Student Profile Card */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col sm:flex-row gap-5 items-start justify-between relative overflow-hidden">
              {/* Profile Background Decorative Banner */}
              <div className="absolute top-0 right-0 w-24 h-24 bg-lamaSkyLight opacity-40 rounded-full translate-x-8 -translate-y-8" />
              
              <div className="flex gap-4 items-center">
                <div className="w-14 h-14 rounded-full bg-lamaSkyLight flex items-center justify-center text-lamaSky text-xl font-black">
                  {selectedStudent.name[0]}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                    {selectedStudent.name} {selectedStudent.surname}
                    <span className="text-xs font-semibold text-lamaSky bg-lamaSkyLight px-2 py-0.5 rounded-full">
                      Class {selectedStudent.class?.name || "Unassigned"}
                    </span>
                  </h2>
                  <p className="text-xs text-gray-400 mt-0.5">Student Username: <span className="font-semibold text-gray-500">{selectedStudent.username}</span> • ID: <span className="font-semibold text-gray-500">{selectedStudent.id}</span></p>
                </div>
              </div>

              {/* Guardian Info Box */}
              <div className="border-t sm:border-t-0 sm:border-l border-gray-100 pt-4 sm:pt-0 sm:pl-6 flex flex-col gap-1">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Guardian / Parent</span>
                <span className="text-xs font-bold text-gray-700">{selectedStudent.parent.name} {selectedStudent.parent.surname}</span>
                <span className="text-xs text-gray-500 flex items-center gap-1">
                  📞 {selectedStudent.parent.phone}
                </span>
              </div>
            </div>

            {/* Checklist unpaid ledger */}
            <CollectorPortal
              studentId={selectedStudent.id}
              studentName={`${selectedStudent.name} ${selectedStudent.surname}`}
              customTuitionFee={selectedStudent.customTuitionFee}
              baseClassFee={baseClassFee}
              unpaidFees={selectedStudent.feeCollections}
              cashierUsername={username || "system_cashier"}
            />
          </div>

          {/* DYNAMIC ADDITIONAL FEES SIDE PANEL */}
          <div className="flex flex-col gap-6">
            <BillFeeForm
              studentId={selectedStudent.id}
              studentName={`${selectedStudent.name} ${selectedStudent.surname}`}
            />

            {/* QUICK ACTIONS BANNER */}
            <div className="bg-gradient-to-br from-[#fdfbf7] to-[#fffefc] p-6 rounded-2xl border border-amber-100 shadow-sm flex flex-col gap-3">
              <h3 className="text-xs font-bold text-amber-800 uppercase tracking-wider flex items-center gap-1.5">
                💡 Bangladesh High School Accounting Notes
              </h3>
              <p className="text-xs text-amber-900/80 leading-relaxed">
                Tuition Billing Cycles start from **January** to **December**. Custom tuition waivers are auto-applied depending on students&apos; specific financial aid assignments. Always issue standard, serial-numbered print receipts for cache audits.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white p-12 rounded-2xl border border-gray-100 shadow-sm text-center flex flex-col items-center justify-center gap-4 py-20">
          <div className="w-16 h-16 rounded-full bg-lamaSkyLight flex items-center justify-center text-lamaSky text-3xl">
            👤
          </div>
          <div>
            <h2 className="text-base font-bold text-gray-800">No Student Selected</h2>
            <p className="text-xs text-gray-400 mt-1 max-w-sm">Use the search bar above to look up any student by name or ID to load their monthly invoice ledger and collect payments.</p>
          </div>
        </div>
      )}
    </div>
  );
}
