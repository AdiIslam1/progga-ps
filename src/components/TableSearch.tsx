"use client";

import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

const TableSearch = () => {
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const value = (e.currentTarget[0] as HTMLInputElement).value;
    const params = new URLSearchParams(window.location.search);
    params.set("search", value);
    router.push(`${window.location.pathname}?${params}`);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2 w-full md:w-64 shadow-sm"
    >
      <Search size={14} className="text-slate-400 flex-shrink-0" />
      <input
        type="text"
        placeholder="Search..."
        className="bg-transparent outline-none text-sm text-slate-700 placeholder-slate-400 w-full"
      />
    </form>
  );
};

export default TableSearch;
