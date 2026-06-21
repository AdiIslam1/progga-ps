"use server";

import { revalidatePath } from "next/cache";
import {
  ClassSchema,
  ExamScheduleSchema,
  ExamSchema,
  LessonSchema,
  StudentSchema,
  SubjectSchema,
  TeacherSchema,
} from "./formValidationSchemas";
import { Day } from "@prisma/client";
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
        classId: data.classId,
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
      data: {
        ...data,
        supervisorId: data.supervisorId || null,
      },
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
      data: {
        ...data,
        supervisorId: data.supervisorId || null,
      },
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
    const rawPassword = data.password || data.phone || "12345678";
    const hashedPassword = await hashPassword(rawPassword);

    await prisma.teacher.create({
      data: {
        id: randomUUID(),
        password: hashedPassword,
        name: data.name,
        surname: data.surname,
        email: data.email || null,
        phone: data.phone || null,
        address: data.address,
        img: data.img || null,
        bloodType: data.bloodType,
        sex: data.sex,
        birthday: data.birthday,
        monthlySalary: data.monthlySalary ? Number(data.monthlySalary) : null,
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
        name: data.name,
        surname: data.surname,
        email: data.email || null,
        phone: data.phone || null,
        address: data.address,
        img: data.img || null,
        bloodType: data.bloodType,
        sex: data.sex,
        birthday: data.birthday,
        monthlySalary: data.monthlySalary ? Number(data.monthlySalary) : null,
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
        section: data.section || null,
        fatherName: data.fatherName || null,
        motherName: data.motherName || null,
        rollNo: data.rollNo !== "" && data.rollNo != null ? Number(data.rollNo) : null,
        group: data.group || null,
        shift: data.shift || null,
        guardianName: data.guardianName || null,
        guardianPhone: data.guardianPhone || null,
        customTuitionFee: data.customTuitionFee !== "" && data.customTuitionFee != null ? Number(data.customTuitionFee) : null,
        admissionYear: data.admissionYear !== "" && data.admissionYear != null ? Number(data.admissionYear) : null,
        nameBn: data.nameBn || null,
        birthRegNo: data.birthRegNo || null,
        prevSchoolName: data.prevSchoolName || null,
        prevSchoolClass: data.prevSchoolClass || null,
        prevSchoolSection: data.prevSchoolSection || null,
        prevSchoolRoll: data.prevSchoolRoll || null,
        prevTutors: data.prevTutors || null,
        fatherNameEn: data.fatherNameEn || null,
        fatherPhone: data.fatherPhone || null,
        fatherNid: data.fatherNid || null,
        fatherAddress: data.fatherAddress || null,
        fatherUpazila: data.fatherUpazila || null,
        fatherWorkAddress: data.fatherWorkAddress || null,
        motherNameEn: data.motherNameEn || null,
        motherNid: data.motherNid || null,
        religion: data.religion || null,
        birthVillage: data.birthVillage || null,
        birthDistrict: data.birthDistrict || null,
        birthUpazila: data.birthUpazila || null,
        birthThana: data.birthThana || null,
        permVillage: data.permVillage || null,
        permDistrict: data.permDistrict || null,
        permUpazila: data.permUpazila || null,
        permThana: data.permThana || null,
        prevPassMarks: data.prevPassMarks !== "" && data.prevPassMarks != null ? Number(data.prevPassMarks) : null,
        prevSubjectCount: data.prevSubjectCount !== "" && data.prevSubjectCount != null ? Number(data.prevSubjectCount) : null,
        prevSession: data.prevSession || null,
      },
    });

    const admissionFeeAmount = Number(data.admissionFee);
    if (admissionFeeAmount > 0) {
      const year = data.admissionYear ? Number(data.admissionYear) : new Date().getFullYear();
      await prisma.feeCollection.create({
        data: {
          studentId: newId,
          name: `Admission Fee ${year}`,
          amount: admissionFeeAmount,
          status: "UNPAID",
        },
      });
    }

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
        section: data.section || null,
        fatherName: data.fatherName || null,
        motherName: data.motherName || null,
        rollNo: data.rollNo !== "" && data.rollNo != null ? Number(data.rollNo) : null,
        group: data.group || null,
        shift: data.shift || null,
        guardianName: data.guardianName || null,
        guardianPhone: data.guardianPhone || null,
        customTuitionFee: data.customTuitionFee !== "" && data.customTuitionFee != null ? Number(data.customTuitionFee) : null,
        admissionYear: data.admissionYear !== "" && data.admissionYear != null ? Number(data.admissionYear) : null,
        nameBn: data.nameBn || null,
        birthRegNo: data.birthRegNo || null,
        prevSchoolName: data.prevSchoolName || null,
        prevSchoolClass: data.prevSchoolClass || null,
        prevSchoolSection: data.prevSchoolSection || null,
        prevSchoolRoll: data.prevSchoolRoll || null,
        prevTutors: data.prevTutors || null,
        fatherNameEn: data.fatherNameEn || null,
        fatherPhone: data.fatherPhone || null,
        fatherNid: data.fatherNid || null,
        fatherAddress: data.fatherAddress || null,
        fatherUpazila: data.fatherUpazila || null,
        fatherWorkAddress: data.fatherWorkAddress || null,
        motherNameEn: data.motherNameEn || null,
        motherNid: data.motherNid || null,
        religion: data.religion || null,
        birthVillage: data.birthVillage || null,
        birthDistrict: data.birthDistrict || null,
        birthUpazila: data.birthUpazila || null,
        birthThana: data.birthThana || null,
        permVillage: data.permVillage || null,
        permDistrict: data.permDistrict || null,
        permUpazila: data.permUpazila || null,
        permThana: data.permThana || null,
        prevPassMarks: data.prevPassMarks !== "" && data.prevPassMarks != null ? Number(data.prevPassMarks) : null,
        prevSubjectCount: data.prevSubjectCount !== "" && data.prevSubjectCount != null ? Number(data.prevSubjectCount) : null,
        prevSession: data.prevSession || null,
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
  try {
    await prisma.exam.create({
      data: {
        title: data.title,
        semesterNumber: data.semesterNumber !== "" && data.semesterNumber != null ? Number(data.semesterNumber) : null,
        year: data.year !== "" && data.year != null ? Number(data.year) : null,
        semStartDate: data.semStartDate ? new Date(data.semStartDate) : null,
        semEndDate: data.semEndDate ? new Date(data.semEndDate) : null,
      },
    });

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
  try {
    await prisma.exam.update({
      where: { id: data.id },
      data: {
        title: data.title,
        semesterNumber: data.semesterNumber !== "" && data.semesterNumber != null ? Number(data.semesterNumber) : null,
        year: data.year !== "" && data.year != null ? Number(data.year) : null,
        semStartDate: data.semStartDate ? new Date(data.semStartDate) : null,
        semEndDate: data.semEndDate ? new Date(data.semEndDate) : null,
      },
    });

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

// Save bulk student marks for a given exam and subject
export const saveBulkResults = async (
  examId: number,
  subjectId: number,
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

    // Find existing results for this exam+subject pair
    const existingResults = await prisma.result.findMany({
      where: { examId, subjectId },
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
              subjectId,
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

export const saveBulkAttendance = async (
  classId: number,
  dateStr: string, // "YYYY-MM-DD"
  attendances: { studentId: string; present: boolean }[]
) => {
  try {
    const attendanceDate = new Date(dateStr);
    attendanceDate.setHours(0, 0, 0, 0);

    const existing = await prisma.attendance.findMany({
      where: {
        classId,
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
              classId,
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


// ── LESSON ACTIONS ────────────────────────────────────────────────────────────

const timeToDate = (timeStr: string): Date => {
  const [h, m] = timeStr.split(":").map(Number);
  return new Date(2025, 0, 1, h, m, 0);
};

export const createLesson = async (
  currentState: { success: boolean; error: boolean; message?: string },
  data: LessonSchema
) => {
  try {
    const subject = await prisma.subject.findUnique({
      where: { id: data.subjectId },
      select: { name: true },
    });
    await prisma.lesson.create({
      data: {
        name: subject?.name || "Lesson",
        day: data.day as Day,
        startTime: timeToDate(data.startTime),
        endTime: timeToDate(data.endTime),
        subjectId: data.subjectId,
        classId: data.classId,
        teacherId: data.teacherId,
      },
    });
    revalidatePath("/routine");
    return { success: true, error: false };
  } catch (err) {
    console.error(err);
    return { success: false, error: true, message: "Failed to create lesson." };
  }
};

export const updateLesson = async (
  currentState: { success: boolean; error: boolean; message?: string },
  data: LessonSchema
) => {
  if (!data.id) return { success: false, error: true };
  try {
    const subject = await prisma.subject.findUnique({
      where: { id: data.subjectId },
      select: { name: true },
    });
    await prisma.lesson.update({
      where: { id: data.id },
      data: {
        name: subject?.name || "Lesson",
        day: data.day as Day,
        startTime: timeToDate(data.startTime),
        endTime: timeToDate(data.endTime),
        subjectId: data.subjectId,
        classId: data.classId,
        teacherId: data.teacherId,
      },
    });
    revalidatePath("/routine");
    return { success: true, error: false };
  } catch (err) {
    console.error(err);
    return { success: false, error: true, message: "Failed to update lesson." };
  }
};

export const deleteLesson = async (
  currentState: { success: boolean; error: boolean },
  formData: FormData
) => {
  const id = parseInt(formData.get("id") as string);
  try {
    await prisma.lesson.delete({ where: { id } });
    revalidatePath("/routine");
    return { success: true, error: false };
  } catch (err) {
    console.error(err);
    return { success: false, error: true };
  }
};

// ── EXAM SCHEDULE ACTIONS ──────────────────────────────────────────────────────

const dateToDateTime = (dateStr: string): Date => new Date(dateStr + "T00:00:00");

export const createExamSchedule = async (
  currentState: { success: boolean; error: boolean; message?: string },
  data: ExamScheduleSchema
) => {
  try {
    await prisma.examSchedule.create({
      data: {
        examId: data.examId,
        classId: data.classId,
        subjectId: data.subjectId,
        date: dateToDateTime(data.date),
        startTime: timeToDate(data.startTime),
        endTime: timeToDate(data.endTime),
        room: data.room || null,
        totalMarks: data.totalMarks,
      },
    });
    revalidatePath("/exams/schedule");
    return { success: true, error: false };
  } catch (err) {
    console.error(err);
    return { success: false, error: true, message: "Failed to create schedule entry." };
  }
};

export const updateExamSchedule = async (
  currentState: { success: boolean; error: boolean; message?: string },
  data: ExamScheduleSchema
) => {
  if (!data.id) return { success: false, error: true };
  try {
    await prisma.examSchedule.update({
      where: { id: data.id },
      data: {
        subjectId: data.subjectId,
        date: dateToDateTime(data.date),
        startTime: timeToDate(data.startTime),
        endTime: timeToDate(data.endTime),
        room: data.room || null,
        totalMarks: data.totalMarks,
      },
    });
    revalidatePath("/exams/schedule");
    return { success: true, error: false };
  } catch (err) {
    console.error(err);
    return { success: false, error: true, message: "Failed to update schedule entry." };
  }
};

export const deleteExamSchedule = async (
  currentState: { success: boolean; error: boolean },
  formData: FormData
) => {
  const id = parseInt(formData.get("id") as string);
  try {
    await prisma.examSchedule.delete({ where: { id } });
    revalidatePath("/exams/schedule");
    return { success: true, error: false };
  } catch (err) {
    console.error(err);
    return { success: false, error: true };
  }
};

export const deleteScheduleEntry = async (id: number): Promise<{ success: boolean }> => {
  try {
    await prisma.examSchedule.delete({ where: { id } });
    revalidatePath("/exams/schedule");
    return { success: true };
  } catch (err) {
    console.error(err);
    return { success: false };
  }
};

export const saveBulkSchedule = async (
  examId: number,
  classId: number,
  entries: {
    subjectId: number;
    entryId: number | null;
    date: string;
    startTime: string;
    endTime: string;
    room: string;
    totalMarks: number;
  }[]
): Promise<{ success: boolean }> => {
  try {
    for (const entry of entries) {
      if (!entry.date) continue;

      const data = {
        date: dateToDateTime(entry.date),
        startTime: entry.startTime ? timeToDate(entry.startTime) : null,
        endTime: entry.endTime ? timeToDate(entry.endTime) : null,
        room: entry.room || null,
        totalMarks: entry.totalMarks,
      };

      if (entry.entryId) {
        await prisma.examSchedule.update({ where: { id: entry.entryId }, data });
      } else {
        await prisma.examSchedule.create({
          data: { examId, classId, subjectId: entry.subjectId, ...data },
        });
      }
    }
    revalidatePath("/exams/schedule");
    return { success: true };
  } catch (err) {
    console.error(err);
    return { success: false };
  }
};

export const resetPassword = async (
  role: "teacher" | "student" | "admin",
  id: string,
  newPassword: string
): Promise<{ success: boolean }> => {
  try {
    const hashedPassword = await hashPassword(newPassword);

    if (role === "teacher") {
      await prisma.teacher.update({ where: { id }, data: { password: hashedPassword } });
    } else if (role === "student") {
      await prisma.student.update({ where: { id }, data: { password: hashedPassword } });
    } else {
      await prisma.admin.update({ where: { id }, data: { password: hashedPassword } });
    }

    return { success: true };
  } catch (err) {
    console.error(err);
    return { success: false };
  }
};

export const upsertReportCard = async (
  studentId: string,
  academicYear: string,
  data: {
    comments?: string;
    moralBehavior?: string;
    sports?: boolean;
    culturalFunction?: boolean;
    scoutBnc?: boolean;
    mathOlympiad?: boolean;
  }
): Promise<{ success: boolean }> => {
  try {
    await prisma.reportCard.upsert({
      where: { studentId_academicYear: { studentId, academicYear } },
      create: { studentId, academicYear, ...data },
      update: data,
    });
    revalidatePath("/report-cards");
    return { success: true };
  } catch (err) {
    console.error(err);
    return { success: false };
  }
};
