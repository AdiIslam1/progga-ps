import Announcements from "@/components/Announcements";
import BigCalendarContainer from "@/components/BigCalendarContainer";
import FormContainer from "@/components/FormContainer";
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

  const InfoRow = ({
    icon,
    label,
    value,
  }: {
    icon: string;
    label: string;
    value: string | null | undefined;
  }) => (
    <div className="flex items-start gap-2 text-sm">
      <Image src={icon} alt="" width={16} height={16} className="mt-0.5 flex-shrink-0 opacity-70" />
      <div>
        <span className="text-gray-400 text-xs block">{label}</span>
        <span className="text-gray-700">{value || "—"}</span>
      </div>
    </div>
  );

  return (
    <div className="flex-1 p-4 flex flex-col gap-4 xl:flex-row">
      {/* LEFT */}
      <div className="w-full xl:w-2/3 flex flex-col gap-4">
        {/* Profile Card */}
        <div className="bg-gradient-to-r from-lamaSky to-lamaSkyLight rounded-xl p-6 flex flex-col sm:flex-row gap-6">
          {/* Avatar */}
          <div className="flex-shrink-0 flex flex-col items-center gap-2">
            <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-md">
              <Image
                src={student.img || "/noAvatar.png"}
                alt={student.name}
                width={128}
                height={128}
                className="w-full h-full object-cover"
              />
            </div>
            <span
              className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                student.sex === "MALE"
                  ? "bg-blue-100 text-blue-600"
                  : "bg-pink-100 text-pink-600"
              }`}
            >
              {student.sex === "MALE" ? "Male" : "Female"}
            </span>
          </div>

          {/* Info */}
          <div className="flex-1">
            <div className="flex items-start justify-between gap-2 flex-wrap">
              <div>
                <h1 className="text-2xl font-bold text-gray-800">
                  {student.name} {student.surname}
                </h1>
                <p className="text-sm text-gray-500 font-mono">ID: {student.studentId}</p>
              </div>
              {role === "admin" && (
                <FormContainer table="student" type="update" data={student} />
              )}
            </div>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <InfoRow icon="/phone.png" label="Phone" value={student.phone} />
              <InfoRow icon="/blood.png" label="Blood Type" value={student.bloodType} />
              <InfoRow
                icon="/date.png"
                label="Date of Birth"
                value={new Intl.DateTimeFormat("en-GB", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                }).format(student.birthday)}
              />
              <InfoRow
                icon="/home.png"
                label="Address"
                value={student.address}
              />
              <InfoRow icon="/parent.png" label="Guardian" value={student.guardianName} />
              <InfoRow icon="/phone.png" label="Guardian Phone" value={student.guardianPhone} />
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
              <p className="text-xl font-bold">{student.class.name}</p>
              <p className="text-xs text-gray-400">Class</p>
            </div>
          </div>
        </div>

        {/* Schedule */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 h-[800px]">
          <h2 className="text-base font-semibold mb-2">Class Schedule</h2>
          <BigCalendarContainer type="classId" id={student.class.id} />
        </div>
      </div>

      {/* RIGHT */}
      <div className="w-full xl:w-1/3 flex flex-col gap-4">
        {/* Shortcuts */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <h2 className="text-base font-semibold mb-3">Quick Links</h2>
          <div className="flex flex-wrap gap-2 text-xs">
            <Link
              className="px-3 py-2 rounded-lg bg-lamaSkyLight text-lamaSky font-medium hover:bg-lamaSky hover:text-white transition-colors"
              href={`/list/lessons?classId=${student.class.id}`}
            >
              Lessons
            </Link>
            <Link
              className="px-3 py-2 rounded-lg bg-lamaPurpleLight text-purple-600 font-medium hover:bg-lamaPurple hover:text-white transition-colors"
              href={`/list/teachers?classId=${student.class.id}`}
            >
              Teachers
            </Link>
            <Link
              className="px-3 py-2 rounded-lg bg-pink-50 text-pink-600 font-medium hover:bg-pink-100 transition-colors"
              href={`/list/exams?classId=${student.class.id}`}
            >
              Exams
            </Link>
            <Link
              className="px-3 py-2 rounded-lg bg-lamaSkyLight text-lamaSky font-medium hover:bg-lamaSky hover:text-white transition-colors"
              href={`/routine?classId=${student.class.id}`}
            >
              Routine
            </Link>
            <Link
              className="px-3 py-2 rounded-lg bg-lamaYellowLight text-yellow-700 font-medium hover:bg-lamaYellow transition-colors"
              href={`/list/results?studentId=${student.id}`}
            >
              Results
            </Link>
            <Link
              className="px-3 py-2 rounded-lg bg-green-50 text-green-700 font-medium hover:bg-green-100 transition-colors"
              href={`/fees?studentId=${student.id}`}
            >
              Fees
            </Link>
          </div>
        </div>

        {/* Student ID Card preview */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold">Student ID</h2>
            <span className="text-xs text-gray-400 font-mono">#{student.studentId}</span>
          </div>
          <div className="border-2 border-dashed border-gray-200 rounded-lg p-3 flex items-center gap-3">
            <div className="w-14 h-14 rounded-lg overflow-hidden border border-gray-200 flex-shrink-0">
              <Image
                src={student.img || "/noAvatar.png"}
                alt=""
                width={56}
                height={56}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="text-xs">
              <p className="font-bold text-sm">{student.name} {student.surname}</p>
              <p className="text-gray-500">Class {student.class.name}</p>
              <p className="text-gray-400 mt-1">Progga Preparatory & High School</p>
            </div>
          </div>
        </div>

        <Announcements />
      </div>
    </div>
  );
};

export default SingleStudentPage;
