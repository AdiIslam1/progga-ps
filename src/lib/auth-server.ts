import { getServerSession } from "next-auth";
import { authOptions } from "./auth";
import type { UserRole } from "./roles";

export async function auth() {
  const session = await getServerSession(authOptions);
  const user = session?.user;

  return {
    userId: user?.id,
    role: user?.role as UserRole | undefined,
    username: user?.username,
    session,
  };
}

export async function currentUser() {
  const session = await getServerSession(authOptions);
  const user = session?.user;
  if (!user) return null;

  return {
    id: user.id,
    username: user.username,
    publicMetadata: { role: user.role },
    firstName: user.name?.split(" ")[0],
    lastName: user.name?.split(" ").slice(1).join(" "),
  };
}
