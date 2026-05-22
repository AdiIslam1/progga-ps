"use client";

import { signOut, useSession } from "next-auth/react";
import Image from "next/image";

const UserNav = () => {
  const { data: session } = useSession();
  const user = session?.user;

  return (
    <div className="flex items-center gap-3">
      <div className="flex flex-col">
        <span className="text-xs leading-3 font-medium">
          {user?.name || user?.username || "User"}
        </span>
        <span className="text-[10px] text-gray-500 text-right capitalize">
          {user?.role}
        </span>
      </div>
      <button
        type="button"
        onClick={() => signOut({ callbackUrl: "/" })}
        className="bg-white rounded-full w-9 h-9 flex items-center justify-center cursor-pointer ring-1 ring-gray-200 hover:bg-gray-50"
        title="Sign out"
      >
        <Image src="/logout.png" alt="Sign out" width={18} height={18} />
      </button>
    </div>
  );
};

export default UserNav;
