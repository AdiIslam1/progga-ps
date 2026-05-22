export type UserRole = "admin" | "teacher" | "student" | "parent";

export const inferRoleFromUsername = (
  username?: string | null
): UserRole | undefined => {
  if (!username) return undefined;
  if (username.startsWith("admin")) return "admin";
  if (username.startsWith("teacher")) return "teacher";
  if (username.startsWith("student")) return "student";
  if (username.startsWith("parent")) return "parent";
  return undefined;
};
