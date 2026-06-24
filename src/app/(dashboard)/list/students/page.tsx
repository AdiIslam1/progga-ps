import FormContainer from "@/components/FormContainer";
import Pagination from "@/components/Pagination";
import TableSearch from "@/components/TableSearch";
import StudentFilters from "@/components/StudentFilters";
import Link from "next/link";
import { Suspense } from "react";
import { Pencil } from "lucide-react";

import prisma from "@/lib/prisma";
import { ITEM_PER_PAGE } from "@/lib/settings";
import { Class, Prisma, Student } from "@prisma/client";
import Image from "next/image";

import { auth } from "@/lib/auth-server";

type StudentList = Student & { class: Class };

const StudentListPage = async ({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined };
}) => {
  const { role } = await auth();

  const renderCard = (item: StudentList) => (
    <div key={item.id} className="bg-white border border-gray-100 rounded-2xl p-5 hover:shadow-lg transition-all duration-300 flex flex-col gap-4 h-full relative group">
      <Link href={`/list/students/${item.id}`} className="absolute inset-0 z-0 rounded-2xl" />
      
      {/* Top Section: Photo and Basic Info */}
      <div className="flex gap-4 relative z-10 pointer-events-none">
        <div className="w-24 h-24 rounded-md overflow-hidden bg-white flex-shrink-0 relative shadow-sm border border-gray-200">
          <Image
            src={item.img || "/noAvatar.png"}
            alt=""
            fill
            className="object-contain p-1"
          />
        </div>
        <div className="flex flex-col justify-center flex-1">
          <h3 className="font-bold text-lg text-gray-800">{item.name} {item.surname}</h3>
          <span className="text-xs font-medium text-blue-600 bg-blue-50 w-max px-2.5 py-1 rounded-full mt-1 border border-blue-100">Class {item.class.name}</span>
          <p className="text-xs text-gray-400 mt-2 font-mono">ID: {item.studentId}</p>
        </div>
      </div>

      {/* Actions Menu */}
      {role === "admin" && (
        <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-20">
          <Link href={`/list/students/${item.id}/edit`} className="w-8 h-8 flex items-center justify-center rounded-full bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors shadow-sm">
            <Pencil size={14} />
          </Link>
          <div>
            <FormContainer table="student" type="delete" id={item.id} />
          </div>
        </div>
      )}

      {/* Bottom Section: Contact Details */}
      <div className="grid grid-cols-2 gap-y-2 gap-x-4 pt-4 border-t border-gray-50 text-sm mt-auto relative z-10 pointer-events-none">
        <div className="flex flex-col">
          <span className="text-[11px] text-gray-400 font-semibold uppercase tracking-wider">Phone</span>
          <span className="text-gray-700 truncate font-medium mt-0.5">{item.phone || "—"}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-[11px] text-gray-400 font-semibold uppercase tracking-wider">Address</span>
          <span className="text-gray-700 truncate font-medium mt-0.5">{item.address || "—"}</span>
        </div>
      </div>
    </div>
  );

  const { page, ...queryParams } = searchParams;
  const p = page ? parseInt(page) : 1;

  const query: Prisma.StudentWhereInput = {};

  if (queryParams) {
    for (const [key, value] of Object.entries(queryParams)) {
      if (value !== undefined) {
        switch (key) {
          case "teacherId":
            query.class = {
              lessons: { some: { teacherId: value } },
            };
            break;
          case "classId":
            query.classId = parseInt(value);
            break;
          case "search":
            const numericSearch = parseInt(value);
            query.OR = [
              { name: { contains: value, mode: "insensitive" } },
              { surname: { contains: value, mode: "insensitive" } },
              ...(!isNaN(numericSearch) ? [{ studentId: numericSearch }] : []),
            ];
            break;
          default:
            break;
        }
      }
    }
  }

  const [data, count, allClasses] = await prisma.$transaction([
    prisma.student.findMany({
      where: query,
      include: { class: true },
      orderBy: [{ class: { name: "asc" } }, { name: "asc" }],
      take: ITEM_PER_PAGE,
      skip: ITEM_PER_PAGE * (p - 1),
    }),
    prisma.student.count({ where: query }),
    prisma.class.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="bg-white rounded-2xl shadow-sm ring-1 ring-slate-100 m-4 mt-0">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 p-5 border-b border-slate-100">
        <div>
          <h1 className="text-lg font-semibold text-slate-800">All Students</h1>
          <p className="text-xs text-slate-400 mt-0.5">{count} student{count !== 1 ? "s" : ""} total</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <TableSearch />
          <Suspense fallback={null}>
            <StudentFilters classes={allClasses} />
          </Suspense>
          {role === "admin" && (
            <Link href="/list/students/admission-form">
              <button className="flex items-center gap-2 bg-blue-700 hover:bg-blue-800 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors">
                + New Admission
              </button>
            </Link>
          )}
        </div>
      </div>

      {/* Grid */}
      {data.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Image src="/noAvatar.png" alt="" width={48} height={48} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">No students found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 p-5">
          {data.map((item) => renderCard(item))}
        </div>
      )}

      {/* Pagination */}
      <Pagination page={p} count={count} />
    </div>
  );
};

export default StudentListPage;
