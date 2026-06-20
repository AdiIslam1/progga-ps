"use server";

import prisma from "./prisma";
import { revalidatePath } from "next/cache";
import { SalaryStatus, SalaryType } from "@prisma/client";

const revalidateAll = () => {
  revalidatePath("/salaries/billing");
  revalidatePath("/salaries/payroll");
  revalidatePath("/salaries/ledger");
  revalidatePath("/fees/reports");
};

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

export const billAllTeacherSalaries = async (month: string) => {
  try {
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

export const updateSalaryAdjustment = async (
  id: number,
  bonus: number,
  deduction: number,
  note: string
) => {
  try {
    await prisma.salaryCollection.update({
      where: { id },
      data: { bonus, deduction, note: note || null },
    });
    revalidateAll();
    return { success: true };
  } catch (err) {
    console.error(err);
    return { success: false, message: "Failed to update adjustment." };
  }
};

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

    const totalAmount = collections.reduce(
      (s, c) => s + c.amount + c.bonus - c.deduction,
      0
    );

    await prisma.$transaction([
      ...collections.map((c) =>
        prisma.salaryCollection.update({
          where: { id: c.id },
          data: {
            status: SalaryStatus.PAID,
            paidAmount: c.amount + c.bonus - c.deduction,
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

export const createBonusPackage = async (
  name: string,
  amount: number,
  description: string
) => {
  try {
    await prisma.bonusPackage.create({
      data: { name, amount, description: description || null },
    });
    revalidateAll();
    return { success: true };
  } catch (err) {
    console.error(err);
    return { success: false, message: "Failed to create bonus package." };
  }
};

export const deleteBonusPackage = async (id: number) => {
  try {
    await prisma.bonusPackage.delete({ where: { id } });
    revalidateAll();
    return { success: true };
  } catch (err) {
    console.error(err);
    return { success: false, message: "Failed to delete bonus package." };
  }
};

export const applyBonusPackage = async (packageId: number, month: string) => {
  try {
    const pkg = await prisma.bonusPackage.findUnique({ where: { id: packageId } });
    if (!pkg) return { success: false, message: "Bonus package not found." };

    const teachers = await prisma.teacher.findMany({
      select: { id: true, name: true, surname: true },
    });

    if (teachers.length === 0)
      return { success: false, message: "No teachers found." };

    const existing = await prisma.salaryCollection.findMany({
      where: { bonusPackageId: packageId, month },
      select: { teacherId: true },
    });
    const alreadyApplied = new Set(existing.map((r) => r.teacherId));
    const toApply = teachers.filter((t) => !alreadyApplied.has(t.id));

    if (toApply.length === 0)
      return {
        success: true,
        message: `All teachers already received "${pkg.name}" for ${month}.`,
      };

    await prisma.salaryCollection.createMany({
      data: toApply.map((t) => ({
        teacherId: t.id,
        name: `${t.name} ${t.surname} — ${pkg.name}`,
        amount: pkg.amount,
        month,
        type: SalaryType.BONUS,
        bonusPackageId: packageId,
        status: SalaryStatus.UNPAID,
      })),
    });

    const skipped = alreadyApplied.size;
    let message = `Applied "${pkg.name}" to ${toApply.length} teacher(s) for ${month}.`;
    if (skipped > 0) message += ` Skipped ${skipped} already applied.`;

    revalidateAll();
    return { success: true, message };
  } catch (err) {
    console.error(err);
    return { success: false, message: "Failed to apply bonus package." };
  }
};

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
