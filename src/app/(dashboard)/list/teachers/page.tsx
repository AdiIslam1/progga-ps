import FormContainer from "@/components/FormContainer";
import Pagination from "@/components/Pagination";
import Table from "@/components/Table";
import TableSearch from "@/components/TableSearch";
import ClickableRow from "@/components/ClickableRow";
import StudentActionCell from "@/components/StudentActionCell";
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

  const columns = [
    { header: "Teacher", accessor: "info" },
    { header: "Teacher ID", accessor: "teacherId", className: "hidden md:table-cell" },
    { header: "Subjects", accessor: "subjects", className: "hidden md:table-cell" },
    { header: "Classes", accessor: "classes", className: "hidden md:table-cell" },
    { header: "Phone", accessor: "phone", className: "hidden lg:table-cell" },
    { header: "Address", accessor: "address", className: "hidden lg:table-cell" },
    ...(role === "admin" ? [{ header: "Actions", accessor: "action" }] : []),
  ];

  const renderRow = (item: TeacherList) => (
    <ClickableRow
      key={item.id}
      href={`/list/teachers/${item.id}`}
      className="text-sm hover:bg-blue-50 transition-colors"
    >
      <td className="flex items-center gap-3 p-4">
        <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-100 flex-shrink-0 hidden xl:block">
          <Image
            src={item.img || "/noAvatar.png"}
            alt=""
            width={40}
            height={40}
            className="w-full h-full object-cover"
          />
        </div>
        <div>
          <p className="font-semibold">{item.name} {item.surname}</p>
          <p className="text-xs text-gray-400">{item.email || "—"}</p>
        </div>
      </td>
      <td className="hidden md:table-cell text-gray-600 text-xs font-mono">{item.teacherId}</td>
      <td className="hidden md:table-cell text-sm text-gray-600">
        {item.subjects.length > 0
          ? item.subjects.map((s) => s.name).join(", ")
          : <span className="text-gray-300">—</span>}
      </td>
      <td className="hidden md:table-cell text-sm text-gray-600">
        {item.classes.length > 0
          ? item.classes.map((c) => c.name).join(", ")
          : <span className="text-gray-300">—</span>}
      </td>
      <td className="hidden lg:table-cell text-sm text-gray-600">{item.phone || "—"}</td>
      <td className="hidden lg:table-cell text-sm text-gray-600 max-w-[160px] truncate">{item.address}</td>
      {role === "admin" && (
        <StudentActionCell>
          <Link href={`/list/teachers/${item.id}/edit`}>
            <button className="w-7 h-7 flex items-center justify-center rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors">
              <Pencil size={13} />
            </button>
          </Link>
          <FormContainer table="teacher" type="delete" id={item.id} />
        </StudentActionCell>
      )}
    </ClickableRow>
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

      {/* Table */}
      {data.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Image src="/noAvatar.png" alt="" width={48} height={48} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">No teachers found</p>
        </div>
      ) : (
        <Table columns={columns} renderRow={renderRow} data={data} />
      )}

      {/* Pagination */}
      <Pagination page={p} count={count} />
    </div>
  );
};

export default TeacherListPage;
