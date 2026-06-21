import FormContainer from "@/components/FormContainer";
import Pagination from "@/components/Pagination";
import Table from "@/components/Table";
import TableSearch from "@/components/TableSearch";
import prisma from "@/lib/prisma";
import { ITEM_PER_PAGE } from "@/lib/settings";
import { Class, Prisma, Teacher } from "@prisma/client";
import Image from "next/image";
import Link from "next/link";
import { auth } from "@/lib/auth-server";

type ClassList = Class & { supervisor: Teacher };

const ClassListPage = async ({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined };
}) => {

const { role } = await auth();


const columns = [
  {
    header: "Class Name",
    accessor: "name",
  },
  {
    header: "Capacity",
    accessor: "capacity",
    className: "hidden md:table-cell",
  },
  {
    header: "Supervisor",
    accessor: "supervisor",
    className: "hidden md:table-cell",
  },
  ...(role === "admin"
    ? [
        {
          header: "Actions",
          accessor: "action",
        },
      ]
    : []),
];

const renderRow = (item: ClassList) => (
  <tr
    key={item.id}
    className="relative text-sm hover:bg-blue-50 transition-colors cursor-pointer"
  >
    <td className="flex items-center gap-4 p-4">
      <Link href={`/list/classes/${item.id}/subjects`} className="absolute inset-0" />
      Class {item.name}
    </td>
    <td className="hidden md:table-cell">{item.capacity}</td>
    <td className="hidden md:table-cell">
      {item.supervisor
        ? item.supervisor.name + " " + item.supervisor.surname
        : "—"}
    </td>
    <td>
      <div className="relative z-10 flex items-center gap-2">
        {role === "admin" && (
          <>
            <FormContainer
              table="class"
              type="update"
              data={{
                id: item.id,
                name: item.name,
                capacity: item.capacity,
                supervisorId: item.supervisorId ?? "",
              }}
            />
            <FormContainer table="class" type="delete" id={item.id} />
          </>
        )}
      </div>
    </td>
  </tr>
);

  const { page, ...queryParams } = searchParams;

  const p = page ? parseInt(page) : 1;

  // URL PARAMS CONDITION

  const query: Prisma.ClassWhereInput = {};

  if (queryParams) {
    for (const [key, value] of Object.entries(queryParams)) {
      if (value !== undefined) {
        switch (key) {
          case "supervisorId":
            query.supervisorId = value;
            break;
          case "search":
            query.name = { contains: value, mode: "insensitive" };
            break;
          default:
            break;
        }
      }
    }
  }

  const [data, count] = await prisma.$transaction([
    prisma.class.findMany({
      where: query,
      include: {
        supervisor: true,
      },
      take: ITEM_PER_PAGE,
      skip: ITEM_PER_PAGE * (p - 1),
    }),
    prisma.class.count({ where: query }),
  ]);

  return (
    <div className="bg-white rounded-2xl shadow-sm ring-1 ring-slate-100 m-4 mt-0">
      {/* TOP */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 p-5 border-b border-slate-100">
        <h1 className="text-lg font-semibold text-slate-800">All Classes</h1>
        <div className="flex items-center gap-3">
          <TableSearch />
          {role === "admin" && <FormContainer table="class" type="create" />}
        </div>
      </div>
      {/* LIST */}
      <Table columns={columns} renderRow={renderRow} data={data} />
      {/* PAGINATION */}
      <Pagination page={p} count={count} />
    </div>
  );
};

export default ClassListPage;
