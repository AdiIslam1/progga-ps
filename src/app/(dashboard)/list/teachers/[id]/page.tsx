import BigCalendarContainer from "@/components/BigCalendarContainer";
import FormContainer from "@/components/FormContainer";
import ResetPasswordButton from "@/components/ResetPasswordButton";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth-server";
import { Teacher } from "@prisma/client";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

const SingleTeacherPage = async ({
  params: { id },
}: {
  params: { id: string };
}) => {
  const { role } = await auth();

  const teacher:
    | (Teacher & {
        _count: { subjects: number; lessons: number; classes: number };
      })
    | null = await prisma.teacher.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          subjects: true,
          lessons: true,
          classes: true,
        },
      },
    },
  });

  if (!teacher) {
    return notFound();
  }

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
  const Card = ({ title, children, isPlaceholder = false }: { title: string; children: React.ReactNode; isPlaceholder?: boolean }) => (
    <div className={`bg-white rounded-xl p-5 shadow-sm border ${isPlaceholder ? "border-dashed border-gray-300 bg-gray-50/50" : "border-gray-100"}`}>
      <h2 className="text-sm font-semibold text-slate-700 mb-4 pb-2 border-b border-slate-100">{title}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
        {children}
      </div>
    </div>
  );

  return (
    <div className="flex-1 p-4 flex flex-col gap-4 xl:flex-row">
      {/* LEFT */}
      <div className="w-full xl:w-2/3 flex flex-col gap-4">

        {/* Blue Profile Header */}
        <div className="bg-gradient-to-r from-blue-700 to-blue-600 rounded-xl p-6 flex flex-col sm:flex-row gap-6">
          {/* Avatar */}
          <div className="flex-shrink-0 flex flex-col items-center gap-2">
            <div className="w-28 h-28 rounded-xl overflow-hidden border-4 border-white shadow-md bg-white relative">
              <Image
                src={teacher.img || "/noAvatar.png"}
                alt={teacher.name}
                fill
                className="object-contain p-1"
              />
            </div>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${teacher.sex === "MALE" ? "bg-white/20 text-white" : "bg-pink-200/30 text-pink-100"}`}>
              {teacher.sex === "MALE" ? "Male" : "Female"}
            </span>
          </div>

          {/* Core identity */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 flex-wrap">
              <div>
                <h1 className="text-2xl font-bold text-white">{teacher.name} {teacher.surname}</h1>
                <p className="text-blue-200 text-sm font-mono mt-0.5">Teacher ID: {teacher.teacherId}</p>
              </div>
              {role === "admin" && (
                <div className="flex items-center gap-2">
                  <Link href={`/list/teachers/${teacher.id}/edit`}>
                    <button className="w-7 h-7 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 transition-colors">
                      <Image src="/update.png" alt="Edit" width={16} height={16} />
                    </button>
                  </Link>
                  <ResetPasswordButton role="teacher" id={teacher.id} />
                </div>
              )}
            </div>

            <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-2.5">
              <HeaderRow label="Date of Birth" value={new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "long", year: "numeric" }).format(teacher.birthday)} />
              <HeaderRow label="Blood Type" value={teacher.bloodType} />
              <HeaderRow label="Email" value={teacher.email} />
              <HeaderRow label="Phone" value={teacher.phone} />
              <div className="col-span-2">
                <HeaderRow label="Address" value={teacher.address} />
              </div>
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl p-4 flex items-center gap-3 shadow-sm border border-gray-100">
            <Image src="/singleAttendance.png" alt="" width={28} height={28} className="opacity-80" />
            <div>
              <p className="text-xl font-bold">90%</p>
              <p className="text-xs text-gray-400">Attendance</p>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 flex items-center gap-3 shadow-sm border border-gray-100">
            <Image src="/singleBranch.png" alt="" width={28} height={28} className="opacity-80" />
            <div>
              <p className="text-xl font-bold">{teacher._count.subjects}</p>
              <p className="text-xs text-gray-400">Branches</p>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 flex items-center gap-3 shadow-sm border border-gray-100">
            <Image src="/singleClass.png" alt="" width={28} height={28} className="opacity-80" />
            <div>
              <p className="text-xl font-bold">{teacher._count.classes}</p>
              <p className="text-xs text-gray-400">Classes</p>
            </div>
          </div>
        </div>

        {/* Professional & Financial Info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card title="Financial & Professional Details">
            {role === "admin" && (
              <Row label="Monthly Salary" value={teacher.monthlySalary ? `৳${teacher.monthlySalary}` : "Not Set"} />
            )}
            <Row label="Joined Date" value={new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric" }).format(teacher.createdAt)} />
          </Card>
          <Card title="Additional Information (Coming Soon)" isPlaceholder={true}>
             <div className="col-span-2 text-center py-2 text-gray-400 text-sm italic">
               Sections for emergency contacts, qualifications, and employment history will be added here.
             </div>
          </Card>
        </div>

        {/* Schedule */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 min-h-[400px] lg:h-[600px]">
          <h2 className="text-base font-semibold mb-2">Teacher&apos;s Schedule</h2>
          <BigCalendarContainer type="teacherId" id={teacher.id} />
        </div>
      </div>

      {/* RIGHT */}
      <div className="w-full xl:w-1/3 flex flex-col gap-4">
        
        {/* ID Card Display */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold">Teacher ID</h2>
            <span className="text-xs text-gray-400 font-mono">#{teacher.teacherId}</span>
          </div>
          <div className="border-2 border-dashed border-gray-200 rounded-lg p-3 flex items-center gap-3">
            <div className="w-14 h-14 rounded-lg overflow-hidden border border-gray-200 flex-shrink-0 bg-white relative">
              <Image src={teacher.img || "/noAvatar.png"} alt="" fill className="object-contain p-0.5" />
            </div>
            <div className="text-xs min-w-0">
              <p className="font-bold text-sm truncate">{teacher.name} {teacher.surname}</p>
              <p className="text-gray-500 truncate">{teacher.email || "No Email"}</p>
              <p className="text-gray-400 mt-1">Progga Preparatory & High School</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default SingleTeacherPage;
