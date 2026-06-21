import FormContainer from "@/components/FormContainer";
import TableSearch from "@/components/TableSearch";
import prisma from "@/lib/prisma";
import { Prisma, Subject, Teacher } from "@prisma/client";
import Link from "next/link";
import { auth } from "@/lib/auth-server";
import { notFound } from "next/navigation";

type SubjectList = Subject & { teachers: Teacher[] };

const ClassSubjectsPage = async ({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { [key: string]: string | undefined };
}) => {
  const { role } = await auth();
  const classId = parseInt(params.id);

  const classRecord = await prisma.class.findUnique({
    where: { id: classId },
    select: { id: true, name: true },
  });

  if (!classRecord) notFound();

  const query: Prisma.SubjectWhereInput = { classId };
  if (searchParams.search) {
    query.name = { contains: searchParams.search, mode: "insensitive" };
  }

  const [data, count] = await prisma.$transaction([
    prisma.subject.findMany({
      where: query,
      include: { teachers: true },
      orderBy: { name: "asc" },
    }),
    prisma.subject.count({ where: query }),
  ]);

  return (
    <div className="bg-white p-6 rounded-md m-4 mt-0">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <Link
            href="/list/classes"
            className="text-sm text-gray-400 hover:text-blue-500 flex items-center gap-1 mb-1"
          >
            ← All Classes
          </Link>
          <h1 className="text-xl font-bold text-gray-800">
            Class {classRecord.name} — Subjects
            <span className="ml-2 text-sm font-normal text-gray-400">
              ({count})
            </span>
          </h1>
        </div>
        {role === "admin" && (
          <FormContainer table="subject" type="create" data={{ classId }} />
        )}
      </div>

      {/* Search */}
      <TableSearch />

      {/* List */}
      <div className="divide-y divide-gray-100 mt-4">
        {data.length === 0 && (
          <p className="text-center text-gray-400 py-12 text-sm">
            No subjects yet. Add one to get started.
          </p>
        )}
        {data.map((item: SubjectList) => (
          <div
            key={item.id}
            className="flex items-center justify-between py-3 px-2 hover:bg-gray-50 rounded-md transition-colors"
          >
            {/* Subject name */}
            <span className="font-medium text-gray-800 w-48 shrink-0">
              {item.name}
            </span>

            {/* Teacher badges */}
            <div className="flex flex-wrap gap-1 flex-1 px-4">
              {item.teachers.length > 0 ? (
                item.teachers.map((t) => (
                  <span
                    key={t.id}
                    className="bg-sky-50 text-sky-700 text-xs px-2 py-0.5 rounded-full border border-sky-100"
                  >
                    {t.name} {t.surname}
                  </span>
                ))
              ) : (
                <span className="text-gray-300 text-sm">—</span>
              )}
            </div>

            {/* Actions */}
            {role === "admin" && (
              <div className="flex items-center gap-2 shrink-0">
                <FormContainer
                  table="subject"
                  type="update"
                  data={{ ...item, classId }}
                />
                <FormContainer table="subject" type="delete" id={item.id} />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ClassSubjectsPage;
