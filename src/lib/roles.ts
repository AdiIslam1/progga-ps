export type UserRole = "admin" | "teacher" | "student";

export const inferRoleFromUsername = (
  username?: string | null
): UserRole | undefined => {
  if (!username) return undefined;
  if (username.startsWith("admin")) return "admin";
  if (/^\d{7}$/.test(username)) return "student";
  return undefined;
};
