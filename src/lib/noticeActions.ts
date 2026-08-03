"use server";

import prisma from "./prisma";
import { revalidatePath } from "next/cache";
import { NoticeType } from "@prisma/client";
import { authorizeRoles } from "./auth-server";
import { parseDateOnlyUtc } from "./schoolDate";

const unauthorized = (message: string) => ({ success: false as const, message });

// Greenweb API: GET https://api.greenweb.com.bd/api.php?json&token=TOKEN&to=PHONE&message=MESSAGE
// Success response: { "success": "01812345678", "error": "" }
// Error response:  { "success": "", "error": "Invalid Number!" }
async function sendSingleSms(apiUrl: string, token: string, to: string, message: string): Promise<boolean> {
  try {
    const params = new URLSearchParams({ token, to, message });
    const res = await fetch(`${apiUrl}?json&${params.toString()}`, {
      method: "GET",
      headers: { "Accept": "application/json" },
      cache: "no-store",
    });
    if (!res.ok) return false;
    const json = await res.json();
    return typeof json.success === "string" && json.success.length > 0;
  } catch {
    return false;
  }
}

export const saveSmsConfig = async (
  _: any,
  data: { apiUrl: string; apiKey: string; senderId: string }
) => {
  if (!(await authorizeRoles(["admin"]))) {
    return unauthorized("Only admins can change SMS gateway settings.");
  }
  try {
    const existing = await prisma.smsConfig.findFirst();
    if (existing) {
      await prisma.smsConfig.update({
        where: { id: existing.id },
        data: { apiUrl: data.apiUrl, apiKey: data.apiKey, senderId: data.senderId },
      });
    } else {
      await prisma.smsConfig.create({ data });
    }
    revalidatePath("/notices");
    return { success: true };
  } catch (err) {
    console.error(err);
    return { success: false, message: "Failed to save gateway settings." };
  }
};

export const sendNoticeSms = async (
  _: any,
  data: {
    title: string;
    content: string;
    target: "ALL" | "CLASS" | "STUDENT";
    classId?: string;
    studentId?: string;
  }
) => {
  if (!(await authorizeRoles(["admin", "teacher"]))) {
    return unauthorized("Only staff can send notices.");
  }
  try {
    if (!data.title || !data.content) {
      return { success: false, message: "Title and message are required." };
    }

    // Resolve guardian phone numbers based on target scope
    let contacts: { phone: string }[] = [];

    if (data.target === "STUDENT" && data.studentId) {
      const student = await prisma.student.findUnique({
        where: { id: data.studentId },
        select: { guardianPhone: true },
      });
      if (student?.guardianPhone) contacts = [{ phone: student.guardianPhone }];
    } else if (data.target === "CLASS" && data.classId) {
      const students = await prisma.student.findMany({
        where: { classId: parseInt(data.classId), guardianPhone: { not: null } },
        select: { guardianPhone: true },
      });
      contacts = students.map((s) => ({ phone: s.guardianPhone! }));
    } else {
      const students = await prisma.student.findMany({
        where: { guardianPhone: { not: null } },
        select: { guardianPhone: true },
      });
      contacts = students.map((s) => ({ phone: s.guardianPhone! }));
    }

    if (contacts.length === 0) {
      return { success: false, message: "No guardian phone numbers found for the selected target." };
    }

    const config = await prisma.smsConfig.findFirst();
    let sentCount = 0;
    let status = "MOCK";

    if (config?.apiUrl && config?.apiKey) {
      // Send to all recipients in parallel
      const results = await Promise.allSettled(
        contacts.map((c) => sendSingleSms(config.apiUrl, config.apiKey, c.phone, data.content))
      );
      sentCount = results.filter((r) => r.status === "fulfilled" && r.value === true).length;
      status = sentCount === 0 ? "FAILED" : sentCount < contacts.length ? "PARTIAL" : "SENT";
    } else {
      // No gateway configured — log as mock
      sentCount = 0;
      status = "MOCK";
    }

    await prisma.notice.create({
      data: {
        title: data.title,
        content: data.content,
        type: NoticeType.SMS,
        classId: data.classId ? parseInt(data.classId) : null,
        recipientId: data.studentId || null,
        recipientCount: contacts.length,
        sentCount,
        status,
      },
    });

    revalidatePath("/notices");

    if (status === "MOCK") {
      return {
        success: true,
        message: `No SMS gateway configured. Notice logged for ${contacts.length} recipient(s). Configure the gateway to send real SMS.`,
      };
    }
    if (status === "FAILED") {
      return { success: false, message: `SMS delivery failed for all ${contacts.length} recipient(s). Check your gateway credentials.` };
    }
    return {
      success: true,
      message: `SMS sent to ${sentCount} of ${contacts.length} guardian(s).${status === "PARTIAL" ? " Some deliveries failed." : ""}`,
    };
  } catch (err) {
    console.error(err);
    return { success: false, message: "An unexpected error occurred." };
  }
};

// Send personalized absence alerts to guardians of students absent on a given date.
// Supports {studentName} placeholder in the message template.
export const sendAbsenceAlerts = async (
  _: any,
  data: { dateStr: string; messageTemplate: string }
) => {
  if (!(await authorizeRoles(["admin", "teacher"]))) {
    return unauthorized("Only staff can send absence alerts.");
  }
  try {
    const date = parseDateOnlyUtc(data.dateStr);
    if (!date) {
      return { success: false, message: "Absence date must be a valid YYYY-MM-DD date." };
    }
    const nextDay = new Date(date.getTime() + 24 * 60 * 60 * 1000);

    const absentStudents = await prisma.student.findMany({
      where: {
        attendances: {
          some: {
            date: { gte: date, lt: nextDay },
            present: false,
          },
        },
      },
      select: { id: true, name: true, surname: true, guardianPhone: true },
    });

    const contacts = absentStudents.filter((s) => s.guardianPhone);

    if (contacts.length === 0) {
      return { success: false, message: "No absent students found for this date, or none have guardian phone numbers." };
    }

    const config = await prisma.smsConfig.findFirst();
    let sentCount = 0;
    let status = "MOCK";

    if (config?.apiUrl && config?.apiKey) {
      const results = await Promise.allSettled(
        contacts.map((s) => {
          const msg = data.messageTemplate.replace(/\{studentName\}/g, `${s.name} ${s.surname}`);
          return sendSingleSms(config.apiUrl, config.apiKey, s.guardianPhone!, msg);
        })
      );
      sentCount = results.filter((r) => r.status === "fulfilled" && r.value === true).length;
      status = sentCount === 0 ? "FAILED" : sentCount < contacts.length ? "PARTIAL" : "SENT";
    }

    await prisma.notice.create({
      data: {
        title: `Absence Alert — ${data.dateStr}`,
        content: data.messageTemplate,
        type: NoticeType.SMS,
        recipientCount: contacts.length,
        sentCount,
        status,
      },
    });

    revalidatePath("/notices");

    if (status === "MOCK") {
      return { success: true, message: `${contacts.length} absent student(s) found. No gateway configured — notice logged only.` };
    }
    if (status === "FAILED") {
      return { success: false, message: `Delivery failed for all ${contacts.length} guardian(s). Check gateway credentials.` };
    }
    return {
      success: true,
      message: `Absence alerts sent to ${sentCount}/${contacts.length} guardian(s).${status === "PARTIAL" ? " Some deliveries failed." : ""}`,
    };
  } catch (err) {
    console.error(err);
    return { success: false, message: "An unexpected error occurred." };
  }
};
