"use client";

import { useSidebar } from "./SidebarContext";

export default function HamburgerButton() {
  const { setOpen } = useSidebar();
  return (
    <button
      className="md:hidden p-1 text-gray-500 hover:text-gray-700 flex-shrink-0"
      onClick={() => setOpen(true)}
      aria-label="Open menu"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <line x1="3" y1="6" x2="21" y2="6" />
        <line x1="3" y1="12" x2="21" y2="12" />
        <line x1="3" y1="18" x2="21" y2="18" />
      </svg>
    </button>
  );
}
