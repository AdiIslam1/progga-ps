import AttendanceChartContainer from "@/components/AttendanceChartContainer";
import CountChartContainer from "@/components/CountChartContainer";
import EventCalendarContainer from "@/components/EventCalendarContainer";
import FinanceChartContainer from "@/components/FinanceChartContainer";
import PendingFeesCard from "@/components/PendingFeesCard";
import RecentPaymentsPanel from "@/components/RecentPaymentsPanel";
import TodayAttendanceCard from "@/components/TodayAttendanceCard";
import UpcomingExamsPanel from "@/components/UpcomingExamsPanel";
import UserCard from "@/components/UserCard";

const AdminPage = ({
  searchParams,
}: {
  searchParams: { [keys: string]: string | undefined };
}) => {
  return (
    <div className="p-4 flex gap-4 flex-col md:flex-row">
      {/* LEFT */}
      <div className="w-full lg:w-2/3 flex flex-col gap-8">
        {/* STAT CARDS */}
        <div className="flex gap-4 justify-between flex-wrap">
          <UserCard type="teacher" href="/list/teachers" />
          <UserCard type="student" href="/list/students" />
          <PendingFeesCard />
          <TodayAttendanceCard />
        </div>
        {/* MIDDLE CHARTS */}
        <div className="flex gap-4 flex-col lg:flex-row">
          <div className="w-full lg:w-1/3 h-[450px]">
            <CountChartContainer />
          </div>
          <div className="w-full lg:w-2/3 h-[450px]">
            <AttendanceChartContainer />
          </div>
        </div>
        {/* FINANCE CHART — real data */}
        <div className="w-full h-[500px]">
          <FinanceChartContainer />
        </div>
      </div>
      {/* RIGHT */}
      <div className="w-full lg:w-1/3 flex flex-col gap-6">
        <EventCalendarContainer searchParams={searchParams} />
        <UpcomingExamsPanel />
        <RecentPaymentsPanel />
      </div>
    </div>
  );
};

export default AdminPage;
