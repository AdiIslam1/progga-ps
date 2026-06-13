import FormContainer from "@/components/FormContainer";
import TableSearch from "@/components/TableSearch";
import Pagination from "@/components/Pagination";
import prisma from "@/lib/prisma";
import { ITEM_PER_PAGE } from "@/lib/settings";
import { Prisma } from "@prisma/client";
import Link from "next/link";
import { auth } from "@/lib/auth-server";

const ExamListPage = async ({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined };
}) => {
  const { role } = await auth();

  const { page, ...queryParams } = searchParams;
  const p = page ? parseInt(page) : 1;

  const query: Prisma.ExamWhereInput = {};
  if (queryParams.search) {
    query.title = { contains: queryParams.search, mode: "insensitive" };
  }

  const [exams, count] = await prisma.$transaction([
    prisma.exam.findMany({
      where: query,
      include: {
        _count: {
          select: { examSchedules: true },
        },
        examSchedules: {
          select: { classId: true },
          distinct: ["classId"],
        },
      },
      orderBy: { id: "desc" },
      take: ITEM_PER_PAGE,
      skip: ITEM_PER_PAGE * (p - 1),
    }),
    prisma.exam.count({ where: query }),
  ]);

  return (
    <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 mb-4">
        <div>
          <h1 className="text-lg font-semibold">Exams</h1>
          <p className="text-xs text-gray-400">{count} exam event{count !== 1 ? "s" : ""}</p>
        </div>
        <div className="flex items-center gap-3">
          <TableSearch />
          {role === "admin" && <FormContainer table="exam" type="create" />}
        </div>
      </div>

      {/* List */}
      {exams.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-sm">No exams yet.</p>
          {role === "admin" && (
            <p className="text-xs mt-1">Create one to get started.</p>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {exams.map((exam) => {
            const classCount = exam.examSchedules.length;
            const entryCount = exam._count.examSchedules;
            return (
              <div
                key={exam.id}
                className="flex items-center justify-between gap-4 border border-gray-100 rounded-xl p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-lamaPurpleLight flex items-center justify-center text-purple-600 font-bold text-sm flex-shrink-0">
                    {exam.title[0]}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-800 truncate">{exam.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {classCount > 0
                        ? `${classCount} class${classCount !== 1 ? "es" : ""} scheduled · ${entryCount} subject entr${entryCount !== 1 ? "ies" : "y"}`
                        : "No schedule set yet"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <Link
                    href={`/exams/schedule?examId=${exam.id}`}
                    className="text-xs font-semibold text-lamaSky border border-lamaSky px-3 py-1.5 rounded-lg hover:bg-lamaSkyLight transition-colors"
                  >
                    View Schedule
                  </Link>
                  {role === "admin" && (
                    <>
                      <FormContainer table="exam" type="update" data={{ id: exam.id, title: exam.title }} />
                      <FormContainer table="exam" type="delete" id={exam.id} />
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Pagination page={p} count={count} />
    </div>
  );
};

export default ExamListPage;
