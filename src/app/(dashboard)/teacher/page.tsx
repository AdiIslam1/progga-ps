import Announcements from "@/components/Announcements";
import BigCalendarContainer from "@/components/BigCalendarContainer";
import TodayLessonsPanel from "@/components/TodayLessonsPanel";
import UpcomingExamsPanel from "@/components/UpcomingExamsPanel";
import { auth } from "@/lib/auth-server";
import prisma from "@/lib/prisma";
import { GraduationCap, Users } from "lucide-react";

const TeacherPage = async () => {
  const { userId } = await auth();

  const myClasses = await prisma.class.findMany({
    where: { lessons: { some: { teacherId: userId! } } },
    include: { _count: { select: { students: true } } },
  });

  const totalStudents = myClasses.reduce((sum, c) => sum + c._count.students, 0);

  return (
    <div className="flex-1 p-4 flex gap-4 flex-col xl:flex-row">
      {/* LEFT */}
      <div className="w-full xl:w-2/3 flex flex-col gap-4">
        {/* Stat cards */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white p-4 rounded-xl border border-gray-100 flex items-center gap-3 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-lamaSkyLight flex items-center justify-center flex-shrink-0">
              <Users size={20} className="text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">{totalStudents}</p>
              <p className="text-xs text-gray-400">My Students</p>
            </div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-gray-100 flex items-center gap-3 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-lamaPurpleLight flex items-center justify-center flex-shrink-0">
              <GraduationCap size={20} className="text-purple-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">{myClasses.length}</p>
              <p className="text-xs text-gray-400">My Classes</p>
            </div>
          </div>
        </div>

        {/* Today's lessons with attendance status */}
        <TodayLessonsPanel teacherId={userId!} />

        {/* Weekly schedule */}
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <h1 className="text-lg font-semibold mb-2">My Schedule</h1>
          <BigCalendarContainer type="teacherId" id={userId!} />
        </div>
      </div>

      {/* RIGHT */}
      <div className="w-full xl:w-1/3 flex flex-col gap-4">
        <UpcomingExamsPanel />
        <Announcements />
      </div>
    </div>
  );
};

export default TeacherPage;
