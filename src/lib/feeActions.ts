"use server";

import prisma from "./prisma";
import { revalidatePath } from "next/cache";
import { FeeStatus } from "@prisma/client";

// Create a standard fee package (e.g. Class 1 Monthly Fee)
export const createFeePackage = async (
  currentState: any,
  data: {
    name: string;
    description?: string;
    amount: number;
    classId?: string;
  }
) => {
  try {
    const classIdNum = data.classId ? parseInt(data.classId) : undefined;
    await prisma.feePackage.create({
      data: {
        name: data.name,
        description: data.description || null,
        amount: data.amount,
        classId: classIdNum,
      },
    });

    revalidatePath("/fees/packages");
    return { success: true, error: false };
  } catch (err) {
    console.error(err);
    return { success: false, error: true };
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
  }
) => {
  try {
    const packageId = data.feePackageId ? parseInt(data.feePackageId) : null;
    
    // 1. Single Student Billing
    if (data.studentId && data.studentId.trim() !== "") {
      await prisma.feeCollection.create({
        data: {
          studentId: data.studentId,
          feePackageId: packageId,
          name: data.name,
          amount: data.amount,
          month: null, // Additional one-time fee
          status: FeeStatus.UNPAID,
        },
      });
    } 
    // 2. Bulk Class-Wide Billing
    else if (data.classId && data.classId.trim() !== "") {
      const students = await prisma.student.findMany({
        where: { classId: parseInt(data.classId) },
        select: { id: true },
      });

      if (students.length > 0) {
        await prisma.feeCollection.createMany({
          data: students.map((s) => ({
            studentId: s.id,
            feePackageId: packageId,
            name: data.name,
            amount: data.amount,
            month: null,
            status: FeeStatus.UNPAID,
          })),
        });
      }
    } 
    // 3. School-Wide Bulk Billing
    else {
      const students = await prisma.student.findMany({ select: { id: true } });
      if (students.length > 0) {
        await prisma.feeCollection.createMany({
          data: students.map((s) => ({
            studentId: s.id,
            feePackageId: packageId,
            name: data.name,
            amount: data.amount,
            month: null,
            status: FeeStatus.UNPAID,
          })),
        });
      }
    }

    revalidatePath("/fees/collect");
    revalidatePath("/fees/ledger");
    return { success: true, error: false };
  } catch (err) {
    console.error(err);
    return { success: false, error: true };
  }
};

// Record multi-month tuition / dynamic fee payment (Accountant Portal Action)
export const collectFees = async (
  studentId: string,
  collectionIds: number[],
  cashierUsername: string
) => {
  try {
    if (collectionIds.length === 0) {
      return { success: false, message: "No unpaid items selected" };
    }

    // Generate a unique receipt number based on Bangladeshi conventions
    const dateStr = new Date().toISOString().slice(0, 7).replace("-", ""); // e.g., "202605"
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const receiptNo = `REC-${dateStr}-${randomSuffix}`;

    // 1. Fetch matching collections first to read their billed amounts
    const collections = await prisma.feeCollection.findMany({
      where: { id: { in: collectionIds }, studentId },
    });

    if (collections.length === 0) {
      return { success: false, message: "No matching fee records found" };
    }

    // 2. Perform inside a database transaction to ensure atomicity
    await prisma.$transaction(
      collections.map((c) =>
        prisma.feeCollection.update({
          where: { id: c.id },
          data: {
            status: FeeStatus.PAID,
            paidAmount: c.amount, // Set paidAmount to standard billed amount
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
