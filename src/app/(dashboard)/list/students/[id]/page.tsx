import Announcements from "@/components/Announcements";
import BigCalendarContainer from "@/components/BigCalendarContainer";
import ResetPasswordButton from "@/components/ResetPasswordButton";
import StudentAttendanceCard from "@/components/StudentAttendanceCard";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth-server";
import { Class, Student } from "@prisma/client";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

const SingleStudentPage = async ({
  params: { id },
}: {
  params: { id: string };
}) => {
  const { role } = await auth();

  const student:
    | (Student & {
        class: Class & { _count: { lessons: number } };
      })
    | null = await prisma.student.findUnique({
    where: { id },
    include: {
      class: { include: { _count: { select: { lessons: true } } } },
    },
  });

  if (!student) return notFound();

  // Label + value row used inside the blue header card
  const HeaderRow = ({ label, value }: { label: string; value: string | null | undefined }) => (
    <div className="flex items-start gap-2 text-sm">
      <div>
        <span className="text-blue-200 text-xs block">{label}</span>
        <span className="text-white font-medium">{value || "—"}</span>
      </div>
    </div>
  );

  // Label + value row used inside white detail cards
  const Row = ({ label, value }: { label: string; value: string | number | null | undefined }) => {
    if (!value && value !== 0) return null;
    return (
      <div className="flex flex-col gap-0.5">
        <span className="text-xs text-slate-400">{label}</span>
        <span className="text-sm text-slate-700 font-medium">{String(value)}</span>
      </div>
    );
  };

  // Section card
  const Card = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
      <h2 className="text-sm font-semibold text-slate-700 mb-4 pb-2 border-b border-slate-100">{title}</h2>
      <div className="grid grid-cols-2 gap-x-6 gap-y-3">
        {children}
      </div>
    </div>
  );

  const hasAnyFatherInfo = student.fatherName || student.fatherNameEn || student.fatherPhone || student.fatherNid || student.fatherAddress || student.fatherUpazila || student.fatherWorkAddress;
  const hasAnyMotherInfo = student.motherName || student.motherNameEn || student.motherNid;
  const hasBirthplace = student.birthVillage || student.birthDistrict || student.birthUpazila || student.birthThana;
  const hasPermanentAddr = student.permVillage || student.permDistrict || student.permUpazila || student.permThana;
  const hasPrevSchool = student.prevSchoolName || student.prevSchoolClass || student.prevSchoolRoll || student.prevTutors;
  const hasPrevResults = student.prevPassMarks || student.prevSubjectCount || student.prevSession || student.admissionYear;

  return (
    <div className="flex-1 p-4 flex flex-col gap-4 xl:flex-row">
      {/* LEFT */}
      <div className="w-full xl:w-2/3 flex flex-col gap-4">

        {/* Blue Profile Header */}
        <div className="bg-gradient-to-r from-blue-700 to-blue-600 rounded-xl p-6 flex flex-col sm:flex-row gap-6">
          {/* Avatar */}
          <div className="flex-shrink-0 flex flex-col items-center gap-2">
            <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-white shadow-md">
              <Image
                src={student.img || "/noAvatar.png"}
                alt={student.name}
                width={112}
                height={112}
                className="w-full h-full object-cover"
              />
            </div>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${student.sex === "MALE" ? "bg-white/20 text-white" : "bg-pink-200/30 text-pink-100"}`}>
              {student.sex === "MALE" ? "Male" : "Female"}
            </span>
          </div>

          {/* Core identity */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 flex-wrap">
              <div>
                <h1 className="text-2xl font-bold text-white">{student.name} {student.surname}</h1>
                {student.nameBn && <p className="text-blue-100 text-base mt-0.5">{student.nameBn}</p>}
                <p className="text-blue-200 text-sm font-mono mt-0.5">ID: {student.studentId}</p>
              </div>
              {role === "admin" && (
                <div className="flex items-center gap-2">
                  <Link href={`/list/students/${student.id}/edit`}>
                    <button className="w-7 h-7 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 transition-colors">
                      <Image src="/update.png" alt="Edit" width={16} height={16} />
                    </button>
                  </Link>
                  <ResetPasswordButton role="student" id={student.id} />
                </div>
              )}
            </div>

            <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-2.5">
              <HeaderRow label="Date of Birth" value={new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "long", year: "numeric" }).format(student.birthday)} />
              <HeaderRow label="Blood Type" value={student.bloodType} />
              {student.religion && <HeaderRow label="Religion" value={student.religion} />}
              {student.birthRegNo && <HeaderRow label="Birth Reg. No." value={student.birthRegNo} />}
              <HeaderRow label="Class" value={`Class ${student.class.name}${student.section ? ` — ${student.section}` : ""}`} />
              {student.rollNo != null && <HeaderRow label="Roll No." value={String(student.rollNo)} />}
              {student.shift && <HeaderRow label="Shift" value={student.shift} />}
              {student.group && <HeaderRow label="Group" value={student.group} />}
              {student.admissionYear && <HeaderRow label="Admission Year" value={String(student.admissionYear)} />}
              {student.phone && <HeaderRow label="Phone" value={student.phone} />}
              {student.address && <HeaderRow label="Address" value={student.address} />}
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-4 flex items-center gap-3 shadow-sm border border-gray-100">
            <Image src="/singleAttendance.png" alt="" width={28} height={28} className="opacity-80" />
            <Suspense fallback={<span className="text-sm text-gray-400">…</span>}>
              <StudentAttendanceCard id={student.id} />
            </Suspense>
          </div>
          <div className="bg-white rounded-xl p-4 flex items-center gap-3 shadow-sm border border-gray-100">
            <Image src="/singleBranch.png" alt="" width={28} height={28} className="opacity-80" />
            <div>
              <p className="text-xl font-bold">{student.class.name}</p>
              <p className="text-xs text-gray-400">Class</p>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 flex items-center gap-3 shadow-sm border border-gray-100">
            <Image src="/singleLesson.png" alt="" width={28} height={28} className="opacity-80" />
            <div>
              <p className="text-xl font-bold">{student.class._count.lessons}</p>
              <p className="text-xs text-gray-400">Lessons</p>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 flex items-center gap-3 shadow-sm border border-gray-100">
            <Image src="/singleClass.png" alt="" width={28} height={28} className="opacity-80" />
            <div>
              <p className="text-xl font-bold">{student.rollNo ?? "—"}</p>
              <p className="text-xs text-gray-400">Roll No.</p>
            </div>
          </div>
        </div>

        {/* Father & Mother info */}
        {(hasAnyFatherInfo || hasAnyMotherInfo) && (
          <Card title="Parents / Guardian Information">
            {student.fatherName && <Row label="Father's Name (বাংলায়)" value={student.fatherName} />}
            {student.fatherNameEn && <Row label="Father's Name (English)" value={student.fatherNameEn} />}
            {student.fatherPhone && <Row label="Father's Phone" value={student.fatherPhone} />}
            {student.fatherNid && <Row label="Father's NID" value={student.fatherNid} />}
            {student.fatherAddress && <Row label="Father's Address" value={student.fatherAddress} />}
            {student.fatherUpazila && <Row label="Father's Upazila/Thana" value={student.fatherUpazila} />}
            {student.fatherWorkAddress && <Row label="Father's Work Address" value={student.fatherWorkAddress} />}
            {student.motherName && <Row label="Mother's Name (বাংলায়)" value={student.motherName} />}
            {student.motherNameEn && <Row label="Mother's Name (English)" value={student.motherNameEn} />}
            {student.motherNid && <Row label="Mother's NID" value={student.motherNid} />}
            {student.guardianName && <Row label="Guardian Name" value={student.guardianName} />}
            {student.guardianPhone && <Row label="Guardian Phone" value={student.guardianPhone} />}
          </Card>
        )}

        {/* Address info */}
        {(hasBirthplace || hasPermanentAddr) && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {hasBirthplace && (
              <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                <h2 className="text-sm font-semibold text-slate-700 mb-4 pb-2 border-b border-slate-100">জন্মস্থান (Birthplace)</h2>
                <div className="flex flex-col gap-3">
                  <Row label="গ্রাম/শহর (Village/City)" value={student.birthVillage} />
                  <Row label="জেলা ও পোস্ট (District)" value={student.birthDistrict} />
                  <Row label="উপজেলা (Upazila)" value={student.birthUpazila} />
                  <Row label="থানা (Thana)" value={student.birthThana} />
                </div>
              </div>
            )}
            {hasPermanentAddr && (
              <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                <h2 className="text-sm font-semibold text-slate-700 mb-4 pb-2 border-b border-slate-100">স্থায়ী ঠিকানা (Permanent Address)</h2>
                <div className="flex flex-col gap-3">
                  <Row label="গ্রাম/শহর (Village/City)" value={student.permVillage} />
                  <Row label="জেলা ও পোস্ট (District)" value={student.permDistrict} />
                  <Row label="উপজেলা (Upazila)" value={student.permUpazila} />
                  <Row label="থানা (Thana)" value={student.permThana} />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Previous school & results */}
        {(hasPrevSchool || hasPrevResults) && (
          <Card title="Academic History">
            {student.prevSchoolName && <Row label="Previous School" value={student.prevSchoolName} />}
            {student.prevSchoolClass && <Row label="Previous Class" value={student.prevSchoolClass} />}
            {student.prevSchoolSection && <Row label="Previous Section" value={student.prevSchoolSection} />}
            {student.prevSchoolRoll && <Row label="Previous Roll No." value={student.prevSchoolRoll} />}
            {student.prevTutors && <div className="col-span-2"><Row label="Previous Tutors (গত দুই বছর)" value={student.prevTutors} /></div>}
            {student.prevPassMarks != null && <Row label="Previous Passing Marks" value={student.prevPassMarks} />}
            {student.prevSubjectCount != null && <Row label="No. of Subjects" value={student.prevSubjectCount} />}
            {student.prevSession && <Row label="Session" value={student.prevSession} />}
          </Card>
        )}

        {/* Schedule */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 min-h-[400px] lg:h-[600px]">
          <h2 className="text-base font-semibold mb-2">Class Schedule</h2>
          <BigCalendarContainer type="classId" id={student.class.id} />
        </div>
      </div>

      {/* RIGHT */}
      <div className="w-full xl:w-1/3 flex flex-col gap-4">
        {/* Quick Links */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <h2 className="text-base font-semibold mb-3">Quick Links</h2>
          <div className="flex flex-wrap gap-2 text-xs">
            <Link className="px-3 py-2 rounded-lg bg-lamaSkyLight text-lamaSky font-medium hover:bg-lamaSky hover:text-white transition-colors" href={`/list/lessons?classId=${student.class.id}`}>Lessons</Link>
            <Link className="px-3 py-2 rounded-lg bg-lamaPurpleLight text-purple-600 font-medium hover:bg-lamaPurple hover:text-white transition-colors" href={`/list/teachers?classId=${student.class.id}`}>Teachers</Link>
            <Link className="px-3 py-2 rounded-lg bg-pink-50 text-pink-600 font-medium hover:bg-pink-100 transition-colors" href={`/list/exams?classId=${student.class.id}`}>Exams</Link>
            <Link className="px-3 py-2 rounded-lg bg-lamaSkyLight text-lamaSky font-medium hover:bg-lamaSky hover:text-white transition-colors" href={`/routine?classId=${student.class.id}`}>Routine</Link>
            <Link className="px-3 py-2 rounded-lg bg-lamaYellowLight text-yellow-700 font-medium hover:bg-lamaYellow transition-colors" href={`/list/results?studentId=${student.id}`}>Results</Link>
            <Link className="px-3 py-2 rounded-lg bg-green-50 text-green-700 font-medium hover:bg-green-100 transition-colors" href={`/fees?studentId=${student.id}`}>Fees</Link>
          </div>
        </div>

        {/* Student ID Card */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold">Student ID</h2>
            <span className="text-xs text-gray-400 font-mono">#{student.studentId}</span>
          </div>
          <div className="border-2 border-dashed border-gray-200 rounded-lg p-3 flex items-center gap-3">
            <div className="w-14 h-14 rounded-lg overflow-hidden border border-gray-200 flex-shrink-0">
              <Image src={student.img || "/noAvatar.png"} alt="" width={56} height={56} className="w-full h-full object-cover" />
            </div>
            <div className="text-xs min-w-0">
              <p className="font-bold text-sm truncate">{student.name} {student.surname}</p>
              {student.nameBn && <p className="text-gray-500 truncate">{student.nameBn}</p>}
              <p className="text-gray-500">Class {student.class.name}{student.section ? ` — ${student.section}` : ""}</p>
              <p className="text-gray-400 mt-1">Progga Preparatory & High School</p>
            </div>
          </div>
        </div>

        {/* Admission summary card */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <h2 className="text-sm font-semibold text-slate-700 mb-3 pb-2 border-b border-slate-100">Admission Summary</h2>
          <div className="flex flex-col gap-2.5 text-sm">
            {[
              { label: "Admission Year", value: student.admissionYear },
              { label: "Birth Reg. No.", value: student.birthRegNo },
              { label: "Religion", value: student.religion },
              { label: "Group", value: student.group },
              { label: "Shift", value: student.shift },
              { label: "Roll No.", value: student.rollNo },
              { label: "Section", value: student.section },
            ].filter(r => r.value != null && r.value !== "").map(({ label, value }) => (
              <div key={label} className="flex justify-between gap-2">
                <span className="text-slate-400 text-xs">{label}</span>
                <span className="text-slate-700 font-medium text-xs text-right">{String(value)}</span>
              </div>
            ))}
          </div>
        </div>

        <Announcements />
      </div>
    </div>
  );
};

export default SingleStudentPage;
