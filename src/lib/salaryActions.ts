"use server";

import prisma from "./prisma";
import { revalidatePath } from "next/cache";
import { Prisma, SalaryStatus, SalaryType } from "@prisma/client";
import { authorizeRoles } from "./auth-server";
import { randomUUID } from "crypto";

const requireAdmin = () => authorizeRoles(["admin"]);
const unauthorized = () => ({
  success: false as const,
  error: true as const,
  message: "Only admins can manage payroll.",
});

class SalaryPaymentConflictError extends Error {
  constructor(message: string) {
    super(message);
    Object.setPrototypeOf(this, SalaryPaymentConflictError.prototype);
  }
}

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
  if (!(await requireAdmin())) return unauthorized();
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
  if (!(await requireAdmin())) return unauthorized();
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
  if (!(await requireAdmin())) return unauthorized();
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
  if (!(await requireAdmin())) return unauthorized();
  try {
    if (collectionIds.length === 0)
      return { success: false, message: "No salary records selected." };

    const uniqueCollectionIds = Array.from(new Set(collectionIds));
    if (uniqueCollectionIds.length !== collectionIds.length) {
      return { success: false, message: "The payment request contains duplicate records." };
    }

    const dateStr = new Date().toISOString().slice(0, 7).replace("-", "");
    const randomSuffix = randomUUID().replace(/-/g, "").slice(0, 8).toUpperCase();
    const receiptNo = `SAL-${dateStr}-${randomSuffix}`;

    await prisma.$transaction(
      async (tx) => {
        const collections = await tx.salaryCollection.findMany({
          where: {
            id: { in: uniqueCollectionIds },
            teacherId,
            status: SalaryStatus.UNPAID,
          },
          orderBy: { id: "asc" },
        });

        if (collections.length !== uniqueCollectionIds.length) {
          throw new SalaryPaymentConflictError(
            "One or more salary records are invalid or have already been paid. Refresh before trying again."
          );
        }

        const totalAmount = collections.reduce(
          (sum, collection) =>
            sum + collection.amount + collection.bonus - collection.deduction,
          0
        );

        for (const collection of collections) {
          const updated = await tx.salaryCollection.updateMany({
            where: { id: collection.id, status: SalaryStatus.UNPAID },
            data: {
              status: SalaryStatus.PAID,
              paidAmount: collection.amount + collection.bonus - collection.deduction,
              paidAt: new Date(),
              receiptNo:
                collections.length === 1 ? receiptNo : `${receiptNo}-${collection.id}`,
              receivedById: cashierUsername,
            },
          });
          if (updated.count !== 1) {
            throw new SalaryPaymentConflictError(
              "A selected salary record changed while payment was processing. Refresh before trying again."
            );
          }
        }

        await tx.expense.create({
          data: {
            title: collections.map((collection) => collection.name).join(", "),
            amount: totalAmount,
            category: "Salaries & Payroll",
          },
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
    );

    revalidateAll();
    return { success: true, receiptNo };
  } catch (err) {
    console.error(err);
    if (
      err instanceof SalaryPaymentConflictError ||
      (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2034")
    ) {
      return {
        success: false,
        message:
          err instanceof SalaryPaymentConflictError
            ? err.message
            : "Another payment changed these records. Refresh before trying again.",
      };
    }
    return { success: false, message: "Failed to process salary payment." };
  }
};

export const createBonusPackage = async (
  name: string,
  amount: number,
  description: string
) => {
  if (!(await requireAdmin())) return unauthorized();
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
  if (!(await requireAdmin())) return unauthorized();
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
  if (!(await requireAdmin())) return unauthorized();
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
  if (!(await requireAdmin())) return unauthorized();
  try {
    await prisma.salaryCollection.delete({ where: { id } });
    revalidateAll();
    return { success: true };
  } catch (err) {
    console.error(err);
    return { success: false };
  }
};
