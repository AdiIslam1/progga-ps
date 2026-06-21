import { currentUser } from "@/lib/auth-server";
import HamburgerButton from "./HamburgerButton";
import UserNav from "./UserNav";
import { Search, Bell } from "lucide-react";

const Navbar = async () => {
  const user = await currentUser();

  return (
    <div className="flex items-center justify-between px-6 py-3 bg-white border-b border-slate-200 shadow-sm gap-4 sticky top-0 z-30 print:hidden">
      <div className="flex items-center gap-4 flex-1 min-w-0">
        <HamburgerButton />
        <div className="hidden md:flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 flex-1 max-w-sm">
          <Search size={14} className="text-slate-400 flex-shrink-0" />
          <input
            type="text"
            placeholder="Search..."
            className="bg-transparent outline-none text-sm text-slate-700 placeholder-slate-400 w-full"
          />
        </div>
      </div>

      <div className="flex items-center gap-3 flex-shrink-0">
        <button className="relative w-9 h-9 flex items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors">
          <Bell size={17} className="text-slate-600" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-blue-600 rounded-full" />
        </button>
        <UserNav key={user?.id} />
      </div>
    </div>
  );
};

export default Navbar;
