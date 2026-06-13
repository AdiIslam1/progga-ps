import { z } from "zod";

export const subjectSchema = z.object({
  id: z.coerce.number().optional(),
  name: z.string().min(1, { message: "Subject name is required!" }),
  classId: z.coerce.number({ required_error: "Class is required!" }),
  teachers: z.array(z.string()), //teacher ids
});

export type SubjectSchema = z.infer<typeof subjectSchema>;

export const classSchema = z.object({
  id: z.coerce.number().optional(),
  name: z.string().min(1, { message: "Class name is required!" }),
  capacity: z.coerce.number().min(1, { message: "Capacity is required!" }),
  supervisorId: z.string().optional().transform(v => v === "" ? undefined : v),
});

export type ClassSchema = z.infer<typeof classSchema>;

export const teacherSchema = z.object({
  id: z.string().optional(),
  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters long!" })
    .optional()
    .or(z.literal("")),
  name: z.string().min(1, { message: "First name is required!" }),
  surname: z.string().min(1, { message: "Last name is required!" }),
  email: z
    .string()
    .email({ message: "Invalid email address!" })
    .optional()
    .or(z.literal("")),
  phone: z.string().optional(),
  address: z.string(),
  img: z.string().optional(),
  bloodType: z.string().min(1, { message: "Blood Type is required!" }),
  birthday: z.coerce.date({ message: "Birthday is required!" }),
  sex: z.enum(["MALE", "FEMALE"], { message: "Sex is required!" }),
  subjects: z.array(z.string()).optional(), // subject ids
  monthlySalary: z.coerce.number().min(0).optional().or(z.literal("")),
});

export type TeacherSchema = z.infer<typeof teacherSchema>;

export const studentSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, { message: "First name is required!" }),
  surname: z.string().min(1, { message: "Last name is required!" }),
  phone: z.string().optional(),
  address: z.string().min(1, { message: "Address is required!" }),
  img: z.string().optional(),
  bloodType: z.string().min(1, { message: "Blood Type is required!" }),
  birthday: z.coerce.date({ message: "Birthday is required!" }),
  sex: z.enum(["MALE", "FEMALE"], { message: "Sex is required!" }),
  classId: z.coerce.number().min(1, { message: "Class is required!" }),
  guardianName: z.string().optional(),
  guardianPhone: z.string().optional(),
  customTuitionFee: z.coerce.number().min(0).optional().or(z.literal("")),
});

export type StudentSchema = z.infer<typeof studentSchema>;

export const examSchema = z.object({
  id: z.coerce.number().optional(),
  title: z.string().min(1, { message: "Title is required!" }),
});

export type ExamSchema = z.infer<typeof examSchema>;

export const examScheduleSchema = z.object({
  id: z.coerce.number().optional(),
  examId: z.coerce.number({ required_error: "Exam is required!" }),
  classId: z.coerce.number({ required_error: "Class is required!" }),
  subjectId: z.coerce.number({ required_error: "Subject is required!" }).min(1, "Subject is required!"),
  date: z.string().min(1, { message: "Date is required!" }),
  startTime: z.string().min(1, { message: "Start time is required!" }),
  endTime: z.string().min(1, { message: "End time is required!" }),
  room: z.string().optional(),
  totalMarks: z.coerce.number().int().min(1, "Must be at least 1").default(100),
});

export type ExamScheduleSchema = z.infer<typeof examScheduleSchema>;

export const lessonSchema = z.object({
  id: z.coerce.number().optional(),
  day: z.enum(["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SAT"], {
    required_error: "Day is required!",
  }),
  subjectId: z.coerce.number({ required_error: "Subject is required!" }).min(1, "Subject is required!"),
  teacherId: z.string().min(1, { message: "Teacher is required!" }),
  classId: z.coerce.number(),
  startTime: z.string().min(1, { message: "Start time is required!" }),
  endTime: z.string().min(1, { message: "End time is required!" }),
});

export type LessonSchema = z.infer<typeof lessonSchema>;
