import { currentUser } from "@/lib/auth-server";
import Link from "next/link";
import {
  Home,
  GraduationCap,
  Users,
  School,
  CalendarDays,
  ClipboardList,
  CalendarClock,
  IdCard,
  FilePen,
  BarChart3,
  Trophy,
  UserCheck,
  Package,
  Banknote,
  BookOpen,
  PieChart,
  Receipt,
  Wallet,
  MessageSquare,
  Megaphone,
  Calendar,
  UserCircle,
  Settings,
  LogOut,
  type LucideIcon,
} from "lucide-react";

const menuItems: {
  title: string;
  items: {
    icon: LucideIcon;
    label: string;
    href: string;
    visible: string[];
  }[];
}[] = [
  {
    title: "MENU",
    items: [
      { icon: Home, label: "Home", href: "/", visible: ["admin", "teacher", "student"] },
      { icon: GraduationCap, label: "Teachers", href: "/list/teachers", visible: ["admin", "teacher"] },
      { icon: Users, label: "Students", href: "/list/students", visible: ["admin", "teacher"] },
      { icon: School, label: "Classes", href: "/list/classes", visible: ["admin", "teacher"] },
      { icon: CalendarDays, label: "Class Routine", href: "/routine", visible: ["admin", "teacher", "student"] },
    ],
  },
  {
    title: "ACADEMICS",
    items: [
      { icon: ClipboardList, label: "Exams", href: "/list/exams", visible: ["admin", "teacher", "student"] },
      { icon: CalendarClock, label: "Exam Schedule", href: "/exams/schedule", visible: ["admin", "teacher", "student"] },
      { icon: IdCard, label: "Admit Cards", href: "/exams/admit-cards", visible: ["admin", "student"] },
      { icon: FilePen, label: "Marksheet Entry", href: "/exams/marksheet", visible: ["admin", "teacher"] },
      { icon: BarChart3, label: "Report Cards", href: "/report-cards", visible: ["admin", "teacher", "student"] },
      { icon: Trophy, label: "Exam Results", href: "/list/results", visible: ["admin", "teacher", "student"] },
      { icon: UserCheck, label: "Attendance", href: "/list/attendance", visible: ["admin", "teacher", "student"] },
    ],
  },
  {
    title: "ACCOUNTING",
    items: [
      { icon: Package, label: "Fee Packages", href: "/fees/packages", visible: ["admin"] },
      { icon: Banknote, label: "Collect Fees", href: "/fees/collect", visible: ["admin"] },
      { icon: BookOpen, label: "Ledger", href: "/fees/ledger", visible: ["admin", "student", "teacher"] },
      { icon: PieChart, label: "Finance Reports", href: "/fees/reports", visible: ["admin"] },
      { icon: Receipt, label: "Salary Billing", href: "/salaries/billing", visible: ["admin"] },
      { icon: Wallet, label: "Payroll Portal", href: "/salaries/payroll", visible: ["admin"] },
    ],
  },
  {
    title: "MESSAGING",
    items: [
      { icon: MessageSquare, label: "Notice & SMS Board", href: "/notices", visible: ["admin", "teacher", "student"] },
      { icon: Megaphone, label: "Announcements", href: "/list/announcements", visible: ["admin", "teacher", "student"] },
      { icon: Calendar, label: "Events Calendar", href: "/list/events", visible: ["admin", "teacher", "student"] },
    ],
  },
  {
    title: "OTHER",
    items: [
      { icon: UserCircle, label: "Profile", href: "/profile", visible: ["admin", "teacher", "student"] },
      { icon: Settings, label: "Settings", href: "/settings", visible: ["admin", "teacher", "student"] },
      { icon: LogOut, label: "Logout", href: "/logout", visible: ["admin", "teacher", "student"] },
    ],
  },
];

const Menu = async () => {
  const user = await currentUser();
  const role = user?.publicMetadata.role as string;
  return (
    <div className="mt-4 text-sm">
      {menuItems.map((section) => (
        <div className="flex flex-col gap-1" key={section.title}>
          <span className="text-gray-400 font-light my-4 text-xs uppercase tracking-wider">
            {section.title}
          </span>
          {section.items.map((item) => {
            if (!item.visible.includes(role)) return null;
            const Icon = item.icon;
            return (
              <Link
                href={item.href}
                key={item.label}
                className="flex items-center gap-3 text-gray-500 py-2 px-2 rounded-md hover:bg-lamaSkyLight transition-colors"
              >
                <Icon size={20} className="flex-shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      ))}
    </div>
  );
};

export default Menu;
