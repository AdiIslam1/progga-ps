import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth-server";
import { redirect } from "next/navigation";
import NoticeBoardPortal from "./NoticeBoardPortal";

export default async function NoticesPage() {
  const { role, userId } = await auth();

  if (!role || !userId) {
    redirect("/");
  }

  // Fetch standard Class entities to populate target dropdown selectors
  const classes = await prisma.class.findMany({
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  // Fetch active SMS gateway configuration credentials
  const config = await prisma.smsConfig.findFirst({
    select: {
      apiUrl: true,
      apiKey: true,
      senderId: true,
    },
  });

  // Query notices based on role scope
  let noticeFilter: any = {};

  if (role === "student") {
    const student = await prisma.student.findUnique({
      where: { id: userId },
      select: { classId: true },
    });
    noticeFilter = {
      OR: [
        { classId: null },
        { classId: student?.classId || 0 },
        { recipientId: userId },
      ],
    };
  }

  // Fetch matching sent Notice records
  const notices = await prisma.notice.findMany({
    where: noticeFilter,
    include: {
      class: {
        select: { name: true },
      },
    },
    orderBy: {
      date: "desc",
    },
  });

  return (
    <div className="p-6 bg-[#f8fafe] min-h-screen flex flex-col gap-6">
      {/* HEADER SECTION */}
      <div>
        <h1 className="text-2xl font-extrabold text-gray-800 tracking-tight">Notice Board & SMS Portal</h1>
        <p className="text-sm text-gray-500 mt-0.5 font-medium text-gray-500">
          Broadcast announcements, notifications, and custom SMS alerts to student guardians.
        </p>
      </div>

      {/* PORTAL INTERFACE */}
      <NoticeBoardPortal
        role={role}
        classes={classes}
        currentConfig={config}
        notices={notices}
      />
    </div>
  );
}
