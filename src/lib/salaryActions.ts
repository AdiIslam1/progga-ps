"use server";

import prisma from "./prisma";
import { revalidatePath } from "next/cache";
import { SalaryStatus } from "@prisma/client";

const revalidateAll = () => {
  revalidatePath("/salaries/billing");
  revalidatePath("/salaries/payroll");
  revalidatePath("/salaries/ledger");
  revalidatePath("/fees/reports");
};

// Bill a single teacher for a given month
export const billTeacherSalary = async (
  teacherId: string,
  month: string // "YYYY-MM"
) => {
  try {
    const teacher = await prisma.teacher.findUnique({
      where: { id: teacherId },
      select: { name: true, surname: true, monthlySalary: true },
    });

    if (!teacher) return { success: false, message: "Teacher not found." };
    if (!teacher.monthlySalary)
      return { success: false, message: "This teacher has no monthly salary set." };

    const existing = await prisma.salaryCollection.findFirst({
      where: { teacherId, month },
    });
    if (existing)
      return { success: false, message: `Salary already billed for ${month}.` };

    await prisma.salaryCollection.create({
      data: {
        teacherId,
        name: `${teacher.name} ${teacher.surname} — Salary ${month}`,
        amount: teacher.monthlySalary,
        month,
        status: SalaryStatus.UNPAID,
      },
    });

    revalidateAll();
    return { success: true, error: false };
  } catch (err) {
    console.error(err);
    return { success: false, error: true, message: "Unexpected error." };
  }
};

// Bill all teachers for a given month, skipping those already billed or with no salary set
export const billAllTeacherSalaries = async (
  currentState: any,
  data: { month: string }
) => {
  try {
    const { month } = data;

    const teachers = await prisma.teacher.findMany({
      where: { monthlySalary: { not: null } },
      select: { id: true, name: true, surname: true, monthlySalary: true },
    });

    if (teachers.length === 0)
      return { success: false, error: true, message: "No teachers have a monthly salary set." };

    const existingRecords = await prisma.salaryCollection.findMany({
      where: { month, teacherId: { in: teachers.map((t) => t.id) } },
      select: { teacherId: true },
    });
    const alreadyBilled = new Set(existingRecords.map((r) => r.teacherId));

    const toBill = teachers.filter((t) => !alreadyBilled.has(t.id));

    if (toBill.length === 0)
      return {
        success: true,
        error: false,
        message: `All teachers have already been billed for ${month}.`,
      };

    await prisma.salaryCollection.createMany({
      data: toBill.map((t) => ({
        teacherId: t.id,
        name: `${t.name} ${t.surname} — Salary ${month}`,
        amount: t.monthlySalary!,
        month,
        status: SalaryStatus.UNPAID,
      })),
    });

    const skipped = alreadyBilled.size;
    let message = `Billed ${toBill.length} teacher(s) for ${month}.`;
    if (skipped > 0) message += ` Skipped ${skipped} already billed.`;

    revalidateAll();
    return { success: true, error: false, message };
  } catch (err) {
    console.error(err);
    return { success: false, error: true, message: "Unexpected error." };
  }
};

// Mark selected salary collections as PAID and auto-log as Expense
export const processSalaryPayment = async (
  teacherId: string,
  collectionIds: number[],
  cashierUsername: string
) => {
  try {
    if (collectionIds.length === 0)
      return { success: false, message: "No salary records selected." };

    const collections = await prisma.salaryCollection.findMany({
      where: { id: { in: collectionIds }, teacherId },
    });

    if (collections.length === 0)
      return { success: false, message: "No matching salary records found." };

    const dateStr = new Date().toISOString().slice(0, 7).replace("-", "");
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const receiptNo = `SAL-${dateStr}-${randomSuffix}`;

    const totalAmount = collections.reduce((s, c) => s + c.amount, 0);

    await prisma.$transaction([
      ...collections.map((c) =>
        prisma.salaryCollection.update({
          where: { id: c.id },
          data: {
            status: SalaryStatus.PAID,
            paidAmount: c.amount,
            paidAt: new Date(),
            receiptNo: collections.length === 1 ? receiptNo : `${receiptNo}-${c.id}`,
            receivedById: cashierUsername,
          },
        })
      ),
      prisma.expense.create({
        data: {
          title: collections.map((c) => c.name).join(", "),
          amount: totalAmount,
          category: "Salaries & Payroll",
        },
      }),
    ]);

    revalidateAll();
    return { success: true, receiptNo };
  } catch (err) {
    console.error(err);
    return { success: false, message: "Failed to process salary payment." };
  }
};

// Delete a salary collection record
export const deleteSalaryCollection = async (id: number) => {
  try {
    await prisma.salaryCollection.delete({ where: { id } });
    revalidateAll();
    return { success: true };
  } catch (err) {
    console.error(err);
    return { success: false };
  }
};
