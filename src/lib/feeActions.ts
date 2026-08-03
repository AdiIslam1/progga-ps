"use server";

import prisma from "./prisma";
import { revalidatePath } from "next/cache";
import { FeePackageType, FeeStatus, Prisma } from "@prisma/client";
import { authorizeRoles } from "./auth-server";
import { randomUUID } from "crypto";

const requireAdmin = () => authorizeRoles(["admin"]);
const isPositiveAmount = (value: number) => Number.isFinite(value) && value > 0;
const isNonNegativeAmount = (value: number) => Number.isFinite(value) && value >= 0;
const isValidBillingMonth = (value: string) => /^\d{4}-(0[1-9]|1[0-2])$/.test(value);
const unauthorized = () => ({
  success: false as const,
  error: true as const,
  message: "Only admins can manage fees and expenses.",
});

class PaymentConflictError extends Error {
  constructor(message: string) {
    super(message);
    Object.setPrototypeOf(this, PaymentConflictError.prototype);
  }
}

// Create a fee package (tuition or other fee template)
export const createFeePackage = async (
  currentState: any,
  data: {
    name: string;
    description?: string;
    amount: number;
    classId?: string;
    type: "TUITION" | "OTHER_FEE";
  }
) => {
  if (!(await requireAdmin())) return unauthorized();
  if (!data.name.trim() || !isPositiveAmount(data.amount)) {
    return { success: false, error: true, message: "Name and a positive amount are required." };
  }
  try {
    const classIdNum = data.classId ? parseInt(data.classId) : undefined;
    await prisma.feePackage.create({
      data: {
        name: data.name,
        description: data.description || null,
        amount: data.amount,
        type: data.type as FeePackageType,
        classId: classIdNum,
      },
    });
    revalidatePath("/fees/packages");
    return { success: true, error: false };
  } catch (err: any) {
    console.error(err);
    return { success: false, error: true, message: err?.message || "Unknown error" };
  }
};

// Update an existing fee package
export const updateFeePackage = async (
  id: number,
  data: { name: string; amount: number; description?: string }
) => {
  if (!(await requireAdmin())) return unauthorized();
  if (!data.name.trim() || !isPositiveAmount(data.amount)) {
    return { success: false, message: "Name and a positive amount are required." };
  }
  try {
    await prisma.feePackage.update({
      where: { id },
      data: {
        name: data.name,
        amount: data.amount,
        description: data.description || null,
      },
    });
    revalidatePath("/fees/packages");
    return { success: true };
  } catch (err) {
    console.error(err);
    return { success: false };
  }
};

// Delete a fee package
export const deleteFeePackage = async (id: number) => {
  if (!(await requireAdmin())) return unauthorized();
  try {
    await prisma.feePackage.delete({
      where: { id },
    });
    revalidatePath("/fees/packages");
    return { success: true };
  } catch (err) {
    console.error(err);
    return { success: false };
  }
};

// Bill an additional custom fee (individual student or bulk class-wide)
export const billAdditionalFee = async (
  currentState: any,
  data: {
    name: string;
    amount: number;
    feePackageId?: string;
    classId?: string;
    studentId?: string;
    month?: string; // e.g. "2026-05" — required for monthly tuition billing
  }
) => {
  if (!(await requireAdmin())) return unauthorized();
  if (!data.name.trim() || !isPositiveAmount(data.amount)) {
    return { success: false, error: true, message: "Name and a positive amount are required." };
  }
  if (data.month && !isValidBillingMonth(data.month)) {
    return { success: false, error: true, message: "Billing month must use YYYY-MM format." };
  }
  try {
    const packageId = data.feePackageId ? parseInt(data.feePackageId) : null;
    const month = data.month || null;

    // 1. Single Student Billing
    if (data.studentId && data.studentId.trim() !== "") {
      if (packageId) {
        const existing = await prisma.feeCollection.findFirst({
          where: { studentId: data.studentId, feePackageId: packageId, month },
        });
        if (existing) {
          return {
            success: false,
            error: true,
            message: month
              ? `This package has already been billed to this student for ${month}.`
              : "This package has already been billed to this student.",
          };
        }
      }
      await prisma.feeCollection.create({
        data: {
          studentId: data.studentId,
          feePackageId: packageId,
          name: data.name,
          amount: data.amount,
          month,
          status: FeeStatus.UNPAID,
        },
      });
    }
    // 2. Bulk Class-Wide Billing
    else if (data.classId && data.classId.trim() !== "") {
      const students = await prisma.student.findMany({
        where: { classId: parseInt(data.classId) },
        select: { id: true, customTuitionFee: true },
      });

      if (students.length > 0) {
        let studentsToBill = students;
        if (packageId) {
          const existingCollections = await prisma.feeCollection.findMany({
            where: {
              feePackageId: packageId,
              month,
              studentId: { in: students.map((s) => s.id) },
            },
            select: { studentId: true },
          });
          const billedIds = new Set(existingCollections.map((c) => c.studentId));
          studentsToBill = students.filter((s) => !billedIds.has(s.id));
        }

        if (studentsToBill.length === 0) {
          return {
            success: true,
            error: false,
            message: month
              ? `All students in this class have already been billed for ${month}.`
              : "All students in this class have already been billed for this package.",
          };
        }

        let customCount = 0;
        const billData = studentsToBill.map((s) => {
          const billAmount = s.customTuitionFee ?? data.amount;
          if (s.customTuitionFee != null) customCount++;
          return {
            studentId: s.id,
            feePackageId: packageId,
            name: data.name,
            amount: billAmount,
            month,
            status: FeeStatus.UNPAID,
          };
        });
        await prisma.feeCollection.createMany({ data: billData });

        const skippedCount = students.length - studentsToBill.length;
        let message = `Billed ${studentsToBill.length} student(s) in this class.`;
        if (customCount > 0) message += ` ${customCount} billed at custom tuition rates.`;
        if (skippedCount > 0) message += ` Skipped ${skippedCount} already billed.`;
        return { success: true, error: false, message };
      }
    }
    // 3. School-Wide Bulk Billing
    else {
      const students = await prisma.student.findMany({
        select: { id: true, customTuitionFee: true },
      });
      if (students.length > 0) {
        let studentsToBill = students;
        if (packageId) {
          const existingCollections = await prisma.feeCollection.findMany({
            where: {
              feePackageId: packageId,
              month,
              studentId: { in: students.map((s) => s.id) },
            },
            select: { studentId: true },
          });
          const billedIds = new Set(existingCollections.map((c) => c.studentId));
          studentsToBill = students.filter((s) => !billedIds.has(s.id));
        }

        if (studentsToBill.length === 0) {
          return {
            success: true,
            error: false,
            message: month
              ? `All students have already been billed for ${month}.`
              : "All students school-wide have already been billed for this package.",
          };
        }

        let customCount = 0;
        const billData = studentsToBill.map((s) => {
          const billAmount = s.customTuitionFee ?? data.amount;
          if (s.customTuitionFee != null) customCount++;
          return {
            studentId: s.id,
            feePackageId: packageId,
            name: data.name,
            amount: billAmount,
            month,
            status: FeeStatus.UNPAID,
          };
        });
        await prisma.feeCollection.createMany({ data: billData });

        const skippedCount = students.length - studentsToBill.length;
        let message = `Billed ${studentsToBill.length} student(s) school-wide.`;
        if (customCount > 0) message += ` ${customCount} billed at custom tuition rates.`;
        if (skippedCount > 0) message += ` Skipped ${skippedCount} already billed.`;
        return { success: true, error: false, message };
      }
    }

    revalidatePath("/fees/collect");
    revalidatePath("/fees/ledger");
    return { success: true, error: false };
  } catch (err) {
    console.error(err);
    return { success: false, error: true, message: "An unexpected error occurred." };
  }
};

// Record multi-month tuition / dynamic fee payment (Accountant Portal Action)
export const collectFees = async (
  studentId: string,
  collectionIds: number[],
  cashierUsername: string,
  discount: number = 0
) => {
  if (!(await requireAdmin())) return unauthorized();
  try {
    if (!isNonNegativeAmount(discount)) {
      return { success: false, message: "Discount must be a valid non-negative amount." };
    }
    if (collectionIds.length === 0) {
      return { success: false, message: "No unpaid items selected" };
    }

    const uniqueCollectionIds = Array.from(new Set(collectionIds));
    if (uniqueCollectionIds.length !== collectionIds.length) {
      return { success: false, message: "The payment request contains duplicate items." };
    }

    const dateStr = new Date().toISOString().slice(0, 7).replace("-", "");
    const randomSuffix = randomUUID().replace(/-/g, "").slice(0, 8).toUpperCase();
    const receiptNo = `REC-${dateStr}-${randomSuffix}`;

    await prisma.$transaction(
      async (tx) => {
        const collections = await tx.feeCollection.findMany({
          where: {
            id: { in: uniqueCollectionIds },
            studentId,
            status: FeeStatus.UNPAID,
          },
          orderBy: { id: "asc" },
        });

        if (collections.length !== uniqueCollectionIds.length) {
          throw new PaymentConflictError(
            "One or more fee items are invalid or have already been paid. Refresh before trying again."
          );
        }

        // Distribute discount proportionally across items; adjust last item for rounding
        const subtotal = collections.reduce((sum, collection) => sum + collection.amount, 0);
        if (!isPositiveAmount(subtotal) || collections.some((collection) => !isPositiveAmount(collection.amount))) {
          throw new PaymentConflictError("Every selected fee must have a valid positive amount.");
        }
        if (discount >= subtotal) {
          throw new PaymentConflictError("Discount must be less than the selected fee total.");
        }
        const safeDiscount = Math.min(Math.max(discount, 0), subtotal);

        let distributed = 0;
        const paidAmounts = collections.map((collection, index) => {
          if (index === collections.length - 1) {
            return collection.amount - (safeDiscount - distributed);
          }
          const share = parseFloat(
            ((collection.amount / subtotal) * safeDiscount).toFixed(2)
          );
          distributed += share;
          return collection.amount - share;
        });

        for (let index = 0; index < collections.length; index++) {
          const collection = collections[index];
          const updated = await tx.feeCollection.updateMany({
            where: { id: collection.id, status: FeeStatus.UNPAID },
            data: {
              status: FeeStatus.PAID,
              paidAmount: Math.max(0, paidAmounts[index]),
              paidAt: new Date(),
              receiptNo,
              receivedById: cashierUsername,
            },
          });
          if (updated.count !== 1) {
            throw new PaymentConflictError(
              "A selected fee item changed while payment was processing. Refresh before trying again."
            );
          }
        }
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
    );

    revalidatePath("/fees/collect");
    revalidatePath("/fees/ledger");
    revalidatePath("/fees/reports");

    return { success: true, receiptNo };
  } catch (err) {
    console.error(err);
    if (err instanceof PaymentConflictError || (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2034")) {
      return {
        success: false,
        message:
          err instanceof PaymentConflictError
            ? err.message
            : "Another payment changed these items. Refresh before trying again.",
      };
    }
    return { success: false, message: "Failed to confirm payments" };
  }
};

// Set or clear a student's individual tuition rate
export const setCustomTuitionFee = async (
  studentId: string,
  amount: number | null
) => {
  if (!(await requireAdmin())) return unauthorized();
  if (amount !== null && !isPositiveAmount(amount)) {
    return { success: false, message: "Custom tuition must be a valid positive amount." };
  }
  try {
    await prisma.student.update({
      where: { id: studentId },
      data: { customTuitionFee: amount },
    });
    revalidatePath("/fees/collect");
    return { success: true };
  } catch (err) {
    console.error(err);
    return { success: false };
  }
};

// Edit the amount of an unpaid fee collection record
export const updateFeeAmount = async (id: number, amount: number) => {
  if (!(await requireAdmin())) return unauthorized();
  if (!isPositiveAmount(amount)) {
    return { success: false, message: "Fee amount must be a valid positive amount." };
  }
  try {
    const fee = await prisma.feeCollection.findUnique({ where: { id }, select: { status: true } });
    if (!fee || fee.status === "PAID") {
      return { success: false, message: "Cannot edit a paid fee." };
    }
    await prisma.feeCollection.update({ where: { id }, data: { amount } });
    revalidatePath("/fees/collect");
    revalidatePath("/fees/admission-fees");
    revalidatePath("/fees/ledger");
    return { success: true };
  } catch (err) {
    console.error(err);
    return { success: false, message: "Update failed." };
  }
};

// Bulk-create admission fees for all students in a class (or all classes) for a given year
export const bulkAdmissionFee = async (data: {
  classId: string;   // "all" or a numeric class id
  year: number;
  amount: number;
}) => {
  if (!(await requireAdmin())) return unauthorized();
  if (!Number.isInteger(data.year) || data.year < 2000 || data.year > 9999) {
    return { success: false, message: "Enter a valid four-digit billing year." };
  }
  if (!isPositiveAmount(data.amount)) {
    return { success: false, message: "Admission fee must be a valid positive amount." };
  }
  if (data.classId !== "all" && (!Number.isInteger(Number(data.classId)) || Number(data.classId) <= 0)) {
    return { success: false, message: "Select a valid class." };
  }
  try {
    const feeName = `Admission Fee ${data.year}`;

    const students = await prisma.student.findMany({
      where: data.classId === "all" ? {} : { classId: parseInt(data.classId) },
      select: { id: true },
    });

    if (students.length === 0) {
      return { success: false, message: "No students found." };
    }

    // Skip students who already have this year's admission fee
    const existing = await prisma.feeCollection.findMany({
      where: {
        name: feeName,
        studentId: { in: students.map((s) => s.id) },
      },
      select: { studentId: true },
    });
    const alreadyBilled = new Set(existing.map((e) => e.studentId));
    const toBill = students.filter((s) => !alreadyBilled.has(s.id));

    if (toBill.length === 0) {
      return { success: true, message: `All students already have Admission Fee ${data.year}.`, skipped: students.length, created: 0 };
    }

    await prisma.feeCollection.createMany({
      data: toBill.map((s) => ({
        studentId: s.id,
        name: feeName,
        amount: data.amount,
        status: FeeStatus.UNPAID,
      })),
    });

    revalidatePath("/fees/collect");
    revalidatePath("/fees/ledger");

    return {
      success: true,
      created: toBill.length,
      skipped: alreadyBilled.size,
      message: `Created admission fee for ${toBill.length} student(s).${alreadyBilled.size > 0 ? ` Skipped ${alreadyBilled.size} already billed.` : ""}`,
    };
  } catch (err) {
    console.error(err);
    return { success: false, message: "An unexpected error occurred." };
  }
};

// Create a new school expenditure
export const createExpense = async (
  currentState: any,
  data: {
    title: string;
    amount: number;
    category: string;
  }
) => {
  if (!(await requireAdmin())) return unauthorized();
  if (!data.title.trim() || !data.category.trim() || !isPositiveAmount(data.amount)) {
    return { success: false, error: true, message: "Title, category, and a positive amount are required." };
  }
  try {
    await prisma.expense.create({
      data: {
        title: data.title,
        amount: data.amount,
        category: data.category,
      },
    });

    revalidatePath("/fees/reports");
    return { success: true, error: false };
  } catch (err) {
    console.error(err);
    return { success: false, error: true };
  }
};

// Delete an expense record
export const deleteExpense = async (id: number) => {
  if (!(await requireAdmin())) return unauthorized();
  try {
    await prisma.expense.delete({
      where: { id },
    });
    revalidatePath("/fees/reports");
    return { success: true };
  } catch (err) {
    console.error(err);
    return { success: false };
  }
};
