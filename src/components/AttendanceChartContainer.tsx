import Image from "next/image";
import AttendanceChart from "./AttendanceChart";
import prisma from "@/lib/prisma";
import { getSchoolDateString, parseDateOnlyUtc } from "@/lib/schoolDate";

const AttendanceChartContainer = async () => {
  const today = parseDateOnlyUtc(getSchoolDateString())!;
  const daysSinceSaturday = (today.getUTCDay() + 1) % 7;
  const weekStart = new Date(today.getTime() - daysSinceSaturday * 24 * 60 * 60 * 1000);
  const weekEnd = new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000);

  const resData = await prisma.attendance.findMany({
    where: {
      date: {
        gte: weekStart,
        lt: weekEnd,
      },
    },
    select: {
      date: true,
      present: true,
    },
  });

  // console.log(data)

  const daysOfWeek = ["Sat", "Sun", "Mon", "Tue", "Wed", "Thu"];
  const dayNameByUtcDay: Record<number, string> = {
    0: "Sun",
    1: "Mon",
    2: "Tue",
    3: "Wed",
    4: "Thu",
    6: "Sat",
  };

  const attendanceMap: { [key: string]: { present: number; absent: number } } =
    {
      Sat: { present: 0, absent: 0 },
      Sun: { present: 0, absent: 0 },
      Mon: { present: 0, absent: 0 },
      Tue: { present: 0, absent: 0 },
      Wed: { present: 0, absent: 0 },
      Thu: { present: 0, absent: 0 },
    };

  resData.forEach((item) => {
    const dayName = dayNameByUtcDay[item.date.getUTCDay()];

    if (dayName) {
      if (item.present) {
        attendanceMap[dayName].present += 1;
      } else {
        attendanceMap[dayName].absent += 1;
      }
    }
  });

  const data = daysOfWeek.map((day) => ({
    name: day,
    present: attendanceMap[day].present,
    absent: attendanceMap[day].absent,
  }));

  return (
    <div className="bg-white rounded-lg p-4 h-full">
      <div className="flex justify-between items-center">
        <h1 className="text-lg font-semibold">Attendance</h1>
        <Image src="/moreDark.png" alt="" width={20} height={20} />
      </div>
      <AttendanceChart data={data}/>
    </div>
  );
};

export default AttendanceChartContainer;
