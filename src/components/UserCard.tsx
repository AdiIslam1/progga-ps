import prisma from "@/lib/prisma";
import Link from "next/link";

const UserCard = async ({
  type,
  href,
}: {
  type: "teacher" | "student";
  href?: string;
}) => {
  const count = await (type === "teacher"
    ? prisma.teacher.count()
    : prisma.student.count());

  const card = (
    <div className="rounded-2xl odd:bg-lamaPurple even:bg-lamaYellow p-4 flex-1 min-w-[130px] transition-shadow hover:shadow-md">
      <div className="flex justify-between items-center">
        <span className="text-[10px] bg-white px-2 py-1 rounded-full text-green-600">
          2024/25
        </span>
      </div>
      <h1 className="text-2xl font-semibold my-4">{count}</h1>
      <h2 className="capitalize text-sm font-medium text-gray-500">{type}s</h2>
    </div>
  );

  if (href) {
    return <Link href={href} className="flex-1 min-w-[130px]">{card}</Link>;
  }

  return card;
};

export default UserCard;
