import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth-server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import StudentForm from "@/components/forms/StudentForm";

export default async function EditStudentPage({ params }: { params: { id: string } }) {
  const { role } = await auth();
  if (role !== "admin") redirect("/list/students");

  const [student, classes] = await Promise.all([
    prisma.student.findUnique({ where: { id: params.id } }),
    prisma.class.findMany({
      include: { _count: { select: { students: true } } },
      orderBy: { name: "asc" },
    }),
  ]);

  if (!student) notFound();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-100 px-6 py-3 flex items-center gap-3">
        <Link
          href="/list/students"
          className="flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-gray-800 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          All Students
        </Link>
        <span className="text-gray-300">/</span>
        <Link
          href={`/list/students/${student.id}`}
          className="text-xs font-bold text-gray-500 hover:text-gray-800 transition-colors"
        >
          {student.name} {student.surname}
        </Link>
        <span className="text-gray-300">/</span>
        <span className="text-xs font-bold text-gray-800">Edit</span>
      </div>

      <div className="max-w-2xl mx-auto p-6">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
          <StudentForm type="update" data={student} relatedData={{ classes }} />
        </div>
      </div>
    </div>
  );
}
