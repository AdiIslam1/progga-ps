import FormContainer from "@/components/FormContainer";
import Pagination from "@/components/Pagination";
import TableSearch from "@/components/TableSearch";
import prisma from "@/lib/prisma";
import { Class, Prisma, Subject, Teacher } from "@prisma/client";
import Image from "next/image";
import Link from "next/link";
import { Pencil } from "lucide-react";
import { ITEM_PER_PAGE } from "@/lib/settings";
import { auth } from "@/lib/auth-server";

type TeacherList = Teacher & { subjects: Subject[] } & { classes: Class[] };

const TeacherListPage = async ({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined };
}) => {
  const { role } = await auth();

  const renderCard = (item: TeacherList) => (
    <div key={item.id} className="bg-white border border-gray-100 rounded-2xl p-5 hover:shadow-lg transition-all duration-300 flex flex-col gap-4 h-full relative group">
      <Link href={`/list/teachers/${item.id}`} className="absolute inset-0 z-0 rounded-2xl" />
      
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
          <p className="text-xs text-gray-400 mt-1">{item.email || "No Email"}</p>
          <p className="text-xs font-mono text-gray-500 mt-2">ID: {item.teacherId}</p>
        </div>
      </div>

      {/* Actions Menu */}
      {role === "admin" && (
        <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-20">
          <Link href={`/list/teachers/${item.id}/edit`} className="w-8 h-8 flex items-center justify-center rounded-full bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors shadow-sm">
            <Pencil size={14} />
          </Link>
          <div>
            <FormContainer table="teacher" type="delete" id={item.id} />
          </div>
        </div>
      )}

      {/* Bottom Section: Details */}
      <div className="grid grid-cols-2 gap-y-4 gap-x-4 pt-4 border-t border-gray-50 text-sm mt-auto relative z-10 pointer-events-none">
        <div className="flex flex-col">
          <span className="text-[11px] text-gray-400 font-semibold uppercase tracking-wider">Subjects</span>
          <span className="text-gray-700 font-medium line-clamp-1 mt-0.5">
            {item.subjects.length > 0 ? item.subjects.map((s) => s.name).join(", ") : "—"}
          </span>
        </div>
        <div className="flex flex-col">
          <span className="text-[11px] text-gray-400 font-semibold uppercase tracking-wider">Classes</span>
          <span className="text-gray-700 font-medium line-clamp-1 mt-0.5">
            {item.classes.length > 0 ? item.classes.map((c) => c.name).join(", ") : "—"}
          </span>
        </div>
        <div className="flex flex-col">
          <span className="text-[11px] text-gray-400 font-semibold uppercase tracking-wider">Phone</span>
          <span className="text-gray-700 font-medium truncate mt-0.5">{item.phone || "—"}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-[11px] text-gray-400 font-semibold uppercase tracking-wider">Address</span>
          <span className="text-gray-700 font-medium truncate mt-0.5">{item.address || "—"}</span>
        </div>
      </div>
    </div>
  );

  const { page, ...queryParams } = searchParams;
  const p = page ? parseInt(page) : 1;

  const query: Prisma.TeacherWhereInput = {};

  if (queryParams) {
    for (const [key, value] of Object.entries(queryParams)) {
      if (value !== undefined) {
        switch (key) {
          case "classId":
            query.lessons = { some: { classId: parseInt(value) } };
            break;
          case "search":
            query.OR = [
              { name: { contains: value, mode: "insensitive" } },
              { surname: { contains: value, mode: "insensitive" } },
              { email: { contains: value, mode: "insensitive" } },
            ];
            break;
          default:
            break;
        }
      }
    }
  }

  const [data, count] = await prisma.$transaction([
    prisma.teacher.findMany({
      where: query,
      include: { subjects: true, classes: true },
      orderBy: [{ name: "asc" }],
      take: ITEM_PER_PAGE,
      skip: ITEM_PER_PAGE * (p - 1),
    }),
    prisma.teacher.count({ where: query }),
  ]);

  return (
    <div className="bg-white rounded-2xl shadow-sm ring-1 ring-slate-100 m-4 mt-0">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 p-5 border-b border-slate-100">
        <div>
          <h1 className="text-lg font-semibold text-slate-800">All Teachers</h1>
          <p className="text-xs text-slate-400 mt-0.5">{count} teacher{count !== 1 ? "s" : ""} total</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <TableSearch />
          {role === "admin" && (
            <Link href="/list/teachers/new">
              <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors">
                + Add Teacher
              </button>
            </Link>
          )}
        </div>
      </div>

      {/* Grid */}
      {data.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Image src="/noAvatar.png" alt="" width={48} height={48} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">No teachers found</p>
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

export default TeacherListPage;
