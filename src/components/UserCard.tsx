import prisma from "@/lib/prisma";
import Link from "next/link";
import { GraduationCap, Users } from "lucide-react";

const config = {
  teacher: {
    label: "Teachers",
    Icon: GraduationCap,
    iconBg: "bg-blue-100",
    iconColor: "text-blue-600",
    accent: "border-l-4 border-blue-500",
  },
  student: {
    label: "Students",
    Icon: Users,
    iconBg: "bg-emerald-100",
    iconColor: "text-emerald-600",
    accent: "border-l-4 border-emerald-500",
  },
};

const UserCard = async ({
  type,
  href,
}: {
  type: "teacher" | "student";
  href?: string;
}) => {
  const count = await (type === "teacher"
    ? prisma.teacher.count()
    : prisma.student.count());

  const { label, Icon, iconBg, iconColor, accent } = config[type];

  const card = (
    <div className={`bg-white rounded-2xl shadow-sm ring-1 ring-slate-100 p-5 flex-1 min-w-[140px] hover:shadow-md transition-shadow ${accent}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</p>
          <h2 className="text-3xl font-bold text-slate-800 mt-1">{count}</h2>
        </div>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${iconBg}`}>
          <Icon size={20} className={iconColor} />
        </div>
      </div>
      <p className="text-[11px] text-slate-400 mt-3">Academic Year 2024/25</p>
    </div>
  );

  if (href) {
    return <Link href={href} className="flex-1 min-w-[140px]">{card}</Link>;
  }
  return card;
};

export default UserCard;
