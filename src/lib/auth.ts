import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { inferRoleFromUsername, type UserRole } from "./roles";
import { verifyPassword } from "./password";
import prisma from "./prisma";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const username = credentials?.username?.trim();
        const password = credentials?.password;

        if (!username || !password) {
          return null;
        }

        const admin = await prisma.admin.findUnique({ where: { username } });
        if (admin && (await verifyPassword(password, admin.password))) {
          return {
            id: admin.id,
            username: admin.username,
            role: "admin" as UserRole,
          };
        }

        const teacher = await prisma.teacher.findUnique({ where: { username } });
        if (teacher && (await verifyPassword(password, teacher.password))) {
          return {
            id: teacher.id,
            username: teacher.username,
            role: "teacher" as UserRole,
            name: `${teacher.name} ${teacher.surname}`,
          };
        }

        const studentIdNum = parseInt(username, 10);
        if (!isNaN(studentIdNum)) {
          const student = await prisma.student.findUnique({ where: { studentId: studentIdNum } });
          if (student && (await verifyPassword(password, student.password))) {
            return {
              id: student.id,
              username: student.studentId.toString(),
              role: "student" as UserRole,
              name: `${student.name} ${student.surname}`,
            };
          }
        }

        return null;
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.username = user.username;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.username = token.username;
        session.user.role =
          token.role || inferRoleFromUsername(token.username) || "student";
      }
      return session;
    },
  },
};
