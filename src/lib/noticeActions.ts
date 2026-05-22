"use server";

import prisma from "./prisma";
import { revalidatePath } from "next/cache";
import { NoticeType } from "@prisma/client";

// Save or update active bulk SMS provider credentials
export const saveSmsConfig = async (
  currentState: any,
  data: {
    apiUrl: string;
    apiKey: string;
    senderId: string;
  }
) => {
  try {
    const existing = await prisma.smsConfig.findFirst();

    if (existing) {
      await prisma.smsConfig.update({
        where: { id: existing.id },
        data: {
          apiUrl: data.apiUrl,
          apiKey: data.apiKey,
          senderId: data.senderId,
        },
      });
    } else {
      await prisma.smsConfig.create({
        data: {
          apiUrl: data.apiUrl,
          apiKey: data.apiKey,
          senderId: data.senderId,
        },
      });
    }

    revalidatePath("/notices");
    return { success: true, error: false };
  } catch (err) {
    console.error(err);
    return { success: false, error: true };
  }
};

// Send bulk notice / SMS to parent guardians
export const sendNoticeSms = async (
  currentState: any,
  data: {
    title: string;
    content: string;
    target: "ALL" | "CLASS" | "STUDENT";
    classId?: string;
    studentId?: string;
  }
) => {
  try {
    if (!data.title || !data.content) {
      return { success: false, error: true, message: "Missing title or content" };
    }

    // 1. Resolve recipient parent phone numbers and identities
    let parentContacts: { name: string; phone: string; studentName: string }[] = [];

    if (data.target === "STUDENT" && data.studentId) {
      const student = await prisma.student.findUnique({
        where: { id: data.studentId },
        include: { parent: true },
      });
      if (student && student.parent.phone) {
        parentContacts.push({
          name: `${student.parent.name} ${student.parent.surname}`,
          phone: student.parent.phone,
          studentName: `${student.name} ${student.surname}`,
        });
      }
    } else if (data.target === "CLASS" && data.classId) {
      const students = await prisma.student.findMany({
        where: { classId: parseInt(data.classId) },
        include: { parent: true },
      });
      students.forEach((s) => {
        if (s.parent.phone) {
          parentContacts.push({
            name: `${s.parent.name} ${s.parent.surname}`,
            phone: s.parent.phone,
            studentName: `${s.name} ${s.surname}`,
          });
        }
      });
    } else {
      // Broad / All Broadcast
      const parents = await prisma.parent.findMany({
        select: { name: true, surname: true, phone: true, students: { select: { name: true, surname: true } } },
      });
      parents.forEach((p) => {
        if (p.phone) {
          parentContacts.push({
            name: `${p.name} ${p.surname}`,
            phone: p.phone,
            studentName: p.students.length > 0 ? `${p.students[0].name} ${p.students[0].surname}` : "Student",
          });
        }
      });
    }

    if (parentContacts.length === 0) {
      return { success: false, error: true, message: "No recipient phone numbers resolved." };
    }

    // 2. Fetch bulk SMS gateway configuration
    const config = await prisma.smsConfig.findFirst();

    // 3. Trigger HTTP request to the active bulk gateway endpoint
    let apiStatus = "MOCK_FALLBACK";

    if (config && config.apiUrl && config.apiKey) {
      console.log(`[SMS Gateway Trigger] Connecting to active endpoint: ${config.apiUrl}`);
      
      // Perform server-side fetch trigger in background
      // In Bangladesh, bulk SMS gateways take GET or POST queries:
      // Constructing request payload dynamically
      const numbersList = parentContacts.map((c) => c.phone).join(",");
      const gatewayUrl = `${config.apiUrl}?apikey=${config.apiKey}&senderid=${config.senderId}&contacts=${numbersList}&msg=${encodeURIComponent(data.content)}`;

      try {
        const response = await fetch(gatewayUrl, { method: "GET" });
        if (response.ok) {
          apiStatus = "DELIVERED";
          console.log("[SMS Gateway Success] Messages successfully pushed to endpoint.");
        } else {
          apiStatus = "GATEWAY_ERROR";
          console.warn("[SMS Gateway Warning] Provider returned non-OK status.");
        }
      } catch (gatewayErr) {
        console.error("[SMS Gateway Error] Fetch connection failed.", gatewayErr);
        apiStatus = "CONNECTION_FAILED";
      }
    } else {
      console.log("[SMS Gateway Sandbox] No provider configuration active. Mock logs generated.");
    }

    // 4. Save Notice log in database
    const classIdNum = data.classId ? parseInt(data.classId) : null;
    await prisma.notice.create({
      data: {
        title: data.title,
        content: `${data.content} [Gateway Status: ${apiStatus}]`,
        type: NoticeType.SMS,
        classId: classIdNum,
        recipientId: data.studentId || null,
      },
    });

    revalidatePath("/notices");
    return {
      success: true,
      error: false,
      message: `Announcement sent! Resolved ${parentContacts.length} recipients. Gateway Status: ${apiStatus}`,
    };
  } catch (err) {
    console.error(err);
    return { success: false, error: true, message: "Failed to dispatch notices." };
  }
};
