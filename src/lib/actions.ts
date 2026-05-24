"use server";

import { revalidatePath } from "next/cache";
import {
  ClassSchema,
  ExamSchema,
  StudentSchema,
  SubjectSchema,
  TeacherSchema,
} from "./formValidationSchemas";
import prisma from "./prisma";
import { hashPassword } from "./password";
import { randomUUID } from "crypto";

type CurrentState = { success: boolean; error: boolean; id?: string };

export const createSubject = async (
  currentState: CurrentState,
  data: SubjectSchema
) => {
  try {
    await prisma.subject.create({
      data: {
        name: data.name,
        teachers: {
          connect: data.teachers.map((teacherId) => ({ id: teacherId })),
        },
      },
    });

    // revalidatePath("/list/subjects");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const updateSubject = async (
  currentState: CurrentState,
  data: SubjectSchema
) => {
  try {
    await prisma.subject.update({
      where: {
        id: data.id,
      },
      data: {
        name: data.name,
        teachers: {
          set: data.teachers.map((teacherId) => ({ id: teacherId })),
        },
      },
    });

    // revalidatePath("/list/subjects");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const deleteSubject = async (
  currentState: CurrentState,
  data: FormData
) => {
  const id = data.get("id") as string;
  try {
    await prisma.subject.delete({
      where: {
        id: parseInt(id),
      },
    });

    // revalidatePath("/list/subjects");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const createClass = async (
  currentState: CurrentState,
  data: ClassSchema
) => {
  try {
    await prisma.class.create({
      data,
    });

    // revalidatePath("/list/class");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const updateClass = async (
  currentState: CurrentState,
  data: ClassSchema
) => {
  try {
    await prisma.class.update({
      where: {
        id: data.id,
      },
      data,
    });

    // revalidatePath("/list/class");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const deleteClass = async (
  currentState: CurrentState,
  data: FormData
) => {
  const id = data.get("id") as string;
  try {
    await prisma.class.delete({
      where: {
        id: parseInt(id),
      },
    });

    // revalidatePath("/list/class");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const createTeacher = async (
  currentState: CurrentState,
  data: TeacherSchema
) => {
  try {
    if (!data.password) {
      return { success: false, error: true };
    }

    const hashedPassword = await hashPassword(data.password);

    await prisma.teacher.create({
      data: {
        id: randomUUID(),
        password: hashedPassword,
        username: data.username,
        name: data.name,
        surname: data.surname,
        email: data.email || null,
        phone: data.phone || null,
        address: data.address,
        img: data.img || null,
        bloodType: data.bloodType,
        sex: data.sex,
        birthday: data.birthday,
        subjects: {
          connect: data.subjects?.map((subjectId: string) => ({
            id: parseInt(subjectId),
          })),
        },
      },
    });

    // revalidatePath("/list/teachers");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const updateTeacher = async (
  currentState: CurrentState,
  data: TeacherSchema
) => {
  if (!data.id) {
    return { success: false, error: true };
  }
  try {
    const teacherPasswordUpdate =
      data.password && data.password !== ""
        ? { password: await hashPassword(data.password) }
        : {};

    await prisma.teacher.update({
      where: {
        id: data.id,
      },
      data: {
        ...teacherPasswordUpdate,
        username: data.username,
        name: data.name,
        surname: data.surname,
        email: data.email || null,
        phone: data.phone || null,
        address: data.address,
        img: data.img || null,
        bloodType: data.bloodType,
        sex: data.sex,
        birthday: data.birthday,
        subjects: {
          set: data.subjects?.map((subjectId: string) => ({
            id: parseInt(subjectId),
          })),
        },
      },
    });
    // revalidatePath("/list/teachers");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const deleteTeacher = async (
  currentState: CurrentState,
  data: FormData
) => {
  const id = data.get("id") as string;
  try {
    await prisma.teacher.delete({
      where: {
        id: id,
      },
    });

    // revalidatePath("/list/teachers");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

const generateStudentId = async (classId: number): Promise<number> => {
  const cls = await prisma.class.findUnique({ where: { id: classId } });
  if (!cls) throw new Error("Class not found");
  const classLevel = parseInt(cls.name);
  if (isNaN(classLevel)) throw new Error("Class name must be a number");
  const year = new Date().getFullYear() % 100;
  const prefix = year * 100000 + classLevel * 1000;
  const last = await prisma.student.findFirst({
    where: { studentId: { gte: prefix, lt: prefix + 1000 } },
    orderBy: { studentId: "desc" },
  });
  const serial = last ? (last.studentId % 1000) + 1 : 1;
  if (serial > 999) throw new Error("Student ID limit reached for this class and year");
  return prefix + serial;
};

export const createStudent = async (
  currentState: CurrentState,
  data: StudentSchema
) => {
  try {
    const classItem = await prisma.class.findUnique({
      where: { id: data.classId },
      include: { _count: { select: { students: true } } },
    });

    if (classItem && classItem.capacity === classItem._count.students) {
      return { success: false, error: true };
    }

    const studentId = await generateStudentId(data.classId);
    const hashedPassword = await hashPassword(studentId.toString());
    const newId = randomUUID();

    await prisma.student.create({
      data: {
        id: newId,
        studentId,
        password: hashedPassword,
        name: data.name,
        surname: data.surname,
        phone: data.phone || null,
        address: data.address,
        img: data.img || null,
        bloodType: data.bloodType,
        sex: data.sex,
        birthday: data.birthday,
        classId: data.classId,
        guardianName: data.guardianName || null,
        guardianPhone: data.guardianPhone || null,
        customTuitionFee: data.customTuitionFee !== "" && data.customTuitionFee != null ? Number(data.customTuitionFee) : null,
      },
    });

    revalidatePath("/list/students");
    return { success: true, error: false, id: newId };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const updateStudent = async (
  currentState: CurrentState,
  data: StudentSchema
) => {
  if (!data.id) {
    return { success: false, error: true };
  }
  try {
    await prisma.student.update({
      where: {
        id: data.id,
      },
      data: {
        name: data.name,
        surname: data.surname,
        phone: data.phone || null,
        address: data.address,
        img: data.img || null,
        bloodType: data.bloodType,
        sex: data.sex,
        birthday: data.birthday,
        classId: data.classId,
        guardianName: data.guardianName || null,
        guardianPhone: data.guardianPhone || null,
        customTuitionFee: data.customTuitionFee !== "" && data.customTuitionFee != null ? Number(data.customTuitionFee) : null,
      },
    });
    revalidatePath("/list/students");
    revalidatePath(`/list/students/${data.id}`);
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const deleteStudent = async (
  currentState: CurrentState,
  data: FormData
) => {
  const id = data.get("id") as string;
  try {
    await prisma.student.delete({
      where: {
        id: id,
      },
    });

    revalidatePath("/list/students");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const createExam = async (
  currentState: CurrentState,
  data: ExamSchema
) => {
  // const { userId, sessionClaims } = auth();
  // const role = (sessionClaims?.metadata as { role?: string })?.role;

  try {
    // if (role === "teacher") {
    //   const teacherLesson = await prisma.lesson.findFirst({
    //     where: {
    //       teacherId: userId!,
    //       id: data.lessonId,
    //     },
    //   });

    //   if (!teacherLesson) {
    //     return { success: false, error: true };
    //   }
    // }

    await prisma.exam.create({
      data: {
        title: data.title,
        startTime: data.startTime,
        endTime: data.endTime,
        lessonId: data.lessonId,
      },
    });

    // revalidatePath("/list/subjects");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const updateExam = async (
  currentState: CurrentState,
  data: ExamSchema
) => {
  // const { userId, sessionClaims } = auth();
  // const role = (sessionClaims?.metadata as { role?: string })?.role;

  try {
    // if (role === "teacher") {
    //   const teacherLesson = await prisma.lesson.findFirst({
    //     where: {
    //       teacherId: userId!,
    //       id: data.lessonId,
    //     },
    //   });

    //   if (!teacherLesson) {
    //     return { success: false, error: true };
    //   }
    // }

    await prisma.exam.update({
      where: {
        id: data.id,
      },
      data: {
        title: data.title,
        startTime: data.startTime,
        endTime: data.endTime,
        lessonId: data.lessonId,
      },
    });

    // revalidatePath("/list/subjects");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const deleteExam = async (
  currentState: CurrentState,
  data: FormData
) => {
  const id = data.get("id") as string;

  // const { userId, sessionClaims } = auth();
  // const role = (sessionClaims?.metadata as { role?: string })?.role;

  try {
    await prisma.exam.delete({
      where: {
        id: parseInt(id),
        // ...(role === "teacher" ? { lesson: { teacherId: userId! } } : {}),
      },
    });

    // revalidatePath("/list/subjects");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

// Save bulk student marks for a given exam
export const saveBulkResults = async (
  examId: number,
  results: { studentId: string; score: number }[]
) => {
  try {
    const calculateGradeAndGpa = (score: number) => {
      if (score >= 80) return { grade: "A+", gpa: 5.0 };
      if (score >= 70) return { grade: "A", gpa: 4.0 };
      if (score >= 60) return { grade: "A-", gpa: 3.5 };
      if (score >= 50) return { grade: "B", gpa: 3.0 };
      if (score >= 40) return { grade: "C", gpa: 2.0 };
      if (score >= 33) return { grade: "D", gpa: 1.0 };
      return { grade: "F", gpa: 0.0 };
    };

    // Find existing results for this exam to decide between update and create
    const existingResults = await prisma.result.findMany({
      where: { examId },
    });

    const existingMap = new Map(existingResults.map((r) => [r.studentId, r.id]));

    await prisma.$transaction(
      results.map((r) => {
        const { grade, gpa } = calculateGradeAndGpa(r.score);
        const existingId = existingMap.get(r.studentId);

        if (existingId) {
          return prisma.result.update({
            where: { id: existingId },
            data: { score: r.score, grade, gpa },
          });
        } else {
          return prisma.result.create({
            data: {
              studentId: r.studentId,
              examId,
              score: r.score,
              grade,
              gpa,
            },
          });
        }
      })
    );

    revalidatePath("/exams/marksheet");
    revalidatePath("/list/results");
    return { success: true };
  } catch (err) {
    console.error(err);
    return { success: false, message: "Failed to record marks." };
  }
};

// Save bulk student attendance for a given lesson and date
export const saveBulkAttendance = async (
  lessonId: number,
  dateStr: string, // "YYYY-MM-DD"
  attendances: { studentId: string; present: boolean }[]
) => {
  try {
    const attendanceDate = new Date(dateStr);
    attendanceDate.setHours(0, 0, 0, 0); // Normalize time boundary

    // Find existing attendance records for this lesson and date
    const existing = await prisma.attendance.findMany({
      where: {
        lessonId,
        date: {
          gte: attendanceDate,
          lt: new Date(attendanceDate.getTime() + 24 * 60 * 60 * 1000),
        },
      },
    });

    const existingMap = new Map(existing.map((a) => [a.studentId, a.id]));

    await prisma.$transaction(
      attendances.map((a) => {
        const existingId = existingMap.get(a.studentId);

        if (existingId) {
          return prisma.attendance.update({
            where: { id: existingId },
            data: { present: a.present },
          });
        } else {
          return prisma.attendance.create({
            data: {
              studentId: a.studentId,
              lessonId,
              date: attendanceDate,
              present: a.present,
            },
          });
        }
      })
    );

    revalidatePath("/list/attendance");
    return { success: true };
  } catch (err) {
    console.error(err);
    return { success: false, message: "Failed to record attendance." };
  }
};

