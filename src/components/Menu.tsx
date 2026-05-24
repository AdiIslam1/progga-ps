import { currentUser } from "@/lib/auth-server";
import Image from "next/image";
import Link from "next/link";

const menuItems = [
  {
    title: "MENU",
    items: [
      {
        icon: "/home.png",
        label: "Home",
        href: "/",
        visible: ["admin", "teacher", "student"],
      },
      {
        icon: "/teacher.png",
        label: "Teachers",
        href: "/list/teachers",
        visible: ["admin", "teacher"],
      },
      {
        icon: "/student.png",
        label: "Students",
        href: "/list/students",
        visible: ["admin", "teacher"],
      },
      {
        icon: "/subject.png",
        label: "Subjects",
        href: "/list/subjects",
        visible: ["admin"],
      },
      {
        icon: "/class.png",
        label: "Classes",
        href: "/list/classes",
        visible: ["admin", "teacher"],
      },
      {
        icon: "/calendar.png",
        label: "Class Routine",
        href: "/routine",
        visible: ["admin", "teacher", "student"],
      },
    ],
  },
  {
    title: "ACADEMICS",
    items: [
      {
        icon: "/exam.png",
        label: "Exams",
        href: "/list/exams",
        visible: ["admin", "teacher", "student"],
      },
      {
        icon: "/calendar.png",
        label: "Exam Schedule",
        href: "/exams/schedule",
        visible: ["admin", "teacher", "student"],
      },
      {
        icon: "/exam.png",
        label: "Marksheet Entry",
        href: "/exams/marksheet",
        visible: ["admin", "teacher"],
      },
      {
        icon: "/result.png",
        label: "Report Cards",
        href: "/report-cards",
        visible: ["admin", "teacher", "student"],
      },
      {
        icon: "/result.png",
        label: "Exam Results",
        href: "/list/results",
        visible: ["admin", "teacher", "student"],
      },
      {
        icon: "/attendance.png",
        label: "Attendance",
        href: "/list/attendance",
        visible: ["admin", "teacher", "student"],
      },
    ],
  },
  {
    title: "ACCOUNTING",
    items: [
      {
        icon: "/finance.png",
        label: "Fee Packages",
        href: "/fees/packages",
        visible: ["admin"],
      },
      {
        icon: "/finance.png",
        label: "Collect Fees",
        href: "/fees/collect",
        visible: ["admin"],
      },
      {
        icon: "/finance.png",
        label: "Fee Ledger",
        href: "/fees/ledger",
        visible: ["admin", "student"],
      },
      {
        icon: "/finance.png",
        label: "Finance Reports",
        href: "/fees/reports",
        visible: ["admin"],
      },
    ],
  },
  {
    title: "MESSAGING",
    items: [
      {
        icon: "/message.png",
        label: "Notice & SMS Board",
        href: "/notices",
        visible: ["admin", "teacher", "student"],
      },
      {
        icon: "/announcement.png",
        label: "Announcements",
        href: "/list/announcements",
        visible: ["admin", "teacher", "student"],
      },
      {
        icon: "/calendar.png",
        label: "Events Calendar",
        href: "/list/events",
        visible: ["admin", "teacher", "student"],
      },
    ],
  },
  {
    title: "OTHER",
    items: [
      {
        icon: "/profile.png",
        label: "Profile",
        href: "/profile",
        visible: ["admin", "teacher", "student"],
      },
      {
        icon: "/setting.png",
        label: "Settings",
        href: "/settings",
        visible: ["admin", "teacher", "student"],
      },
      {
        icon: "/logout.png",
        label: "Logout",
        href: "/logout",
        visible: ["admin", "teacher", "student"],
      },
    ],
  },
];

const Menu = async () => {
  const user = await currentUser();
  const role = user?.publicMetadata.role as string;
  return (
    <div className="mt-4 text-sm">
      {menuItems.map((i) => (
        <div className="flex flex-col gap-2" key={i.title}>
          <span className="hidden lg:block text-gray-400 font-light my-4">
            {i.title}
          </span>
          {i.items.map((item) => {
            if (item.visible.includes(role)) {
              return (
                <Link
                  href={item.href}
                  key={item.label}
                  className="flex items-center justify-center lg:justify-start gap-4 text-gray-500 py-2 md:px-2 rounded-md hover:bg-lamaSkyLight"
                >
                  <Image src={item.icon} alt="" width={20} height={20} />
                  <span className="hidden lg:block">{item.label}</span>
                </Link>
              );
            }
          })}
        </div>
      ))}
    </div>
  );
};

export default Menu;
