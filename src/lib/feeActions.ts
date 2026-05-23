"use server";

import prisma from "./prisma";
import { revalidatePath } from "next/cache";
import { FeePackageType, FeeStatus } from "@prisma/client";

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
  try {
    if (collectionIds.length === 0) {
      return { success: false, message: "No unpaid items selected" };
    }

    const dateStr = new Date().toISOString().slice(0, 7).replace("-", "");
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const receiptNo = `REC-${dateStr}-${randomSuffix}`;

    const collections = await prisma.feeCollection.findMany({
      where: { id: { in: collectionIds }, studentId },
    });

    if (collections.length === 0) {
      return { success: false, message: "No matching fee records found" };
    }

    // Distribute discount proportionally across items; adjust last item for rounding
    const subtotal = collections.reduce((s, c) => s + c.amount, 0);
    const safeDiscount = Math.min(Math.max(discount, 0), subtotal);

    let distributed = 0;
    const paidAmounts = collections.map((c, i) => {
      if (i === collections.length - 1) {
        return c.amount - (safeDiscount - distributed);
      }
      const share = parseFloat(((c.amount / subtotal) * safeDiscount).toFixed(2));
      distributed += share;
      return c.amount - share;
    });

    await prisma.$transaction(
      collections.map((c, i) =>
        prisma.feeCollection.update({
          where: { id: c.id },
          data: {
            status: FeeStatus.PAID,
            paidAmount: Math.max(0, paidAmounts[i]),
            paidAt: new Date(),
            receiptNo,
            receivedById: cashierUsername,
          },
        })
      )
    );

    revalidatePath("/fees/collect");
    revalidatePath("/fees/ledger");
    revalidatePath("/fees/reports");

    return { success: true, receiptNo };
  } catch (err) {
    console.error(err);
    return { success: false, message: "Failed to confirm payments" };
  }
};

// Set or clear a student's individual tuition rate
export const setCustomTuitionFee = async (
  studentId: string,
  amount: number | null
) => {
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

// Create a new school expenditure
export const createExpense = async (
  currentState: any,
  data: {
    title: string;
    amount: number;
    category: string;
  }
) => {
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
