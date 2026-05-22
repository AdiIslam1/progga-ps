import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth-server";
import { notFound } from "next/navigation";
import Link from "next/link";
import PrintButton from "./PrintButton";

export default async function PaymentReceiptPage({
  params,
}: {
  params: { receiptNo: string };
}) {
  const { role } = await auth();

  // Retrieve all paid items matching the receipt number
  const collections = await prisma.feeCollection.findMany({
    where: {
      receiptNo: params.receiptNo,
      status: "PAID",
    },
    include: {
      student: {
        include: {
          class: true,
          parent: true,
        },
      },
    },
  });

  if (collections.length === 0) {
    notFound();
  }

  // Get common student, parent, and transaction meta
  const student = collections[0].student;
  const parent = student.parent;
  const receiptNo = params.receiptNo;
  const paidAt = collections[0].paidAt || new Date();
  const cashierId = collections[0].receivedById || "System Cashier";

  // Calculate totals
  const totalPaid = collections.reduce((sum, item) => sum + item.paidAmount, 0);

  return (
    <div className="p-4 md:p-8 bg-[#f8fafe] min-h-screen flex flex-col items-center gap-6">
      {/* ACTION HEADER BUTTONS (HIDDEN ON PRINT) */}
      <div className="w-full max-w-2xl print:hidden flex items-center justify-between bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
        <Link
          href="/fees/collect"
          className="text-xs font-bold text-gray-500 hover:text-gray-700 transition-colors flex items-center gap-1.5"
        >
          ← Back to Collector
        </Link>
        <div className="flex gap-2">
          <PrintButton />
        </div>
      </div>

      {/* RECEIPT PAPER WRAPPER */}
      <div className="w-full max-w-2xl bg-white p-8 md:p-10 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden print:shadow-none print:border-none print:p-0 print:m-0">
        
        {/* TOP DECORATIVE BANNER (HIDDEN ON PRINT) */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-lamaSky to-lamaYellow print:hidden" />

        {/* SCHOOL HEADER */}
        <div className="flex flex-col items-center text-center pb-6 border-b border-gray-100">
          <h1 className="text-xl md:text-2xl font-black text-gray-800 uppercase tracking-wide">
            Bornomala High School
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Chashara, Narayanganj, Dhaka, Bangladesh • Phone: +880 1711-000000
          </p>
          <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold mt-1 bg-gray-50 px-3 py-1 rounded-full">
            Official Cash Payment Receipt
          </p>
        </div>

        {/* TRANSACTION METRICS GRID */}
        <div className="grid grid-cols-2 gap-4 py-6 border-b border-gray-50 text-xs">
          <div className="flex flex-col gap-1">
            <span className="text-gray-400 font-semibold uppercase text-[9px] tracking-wider">Receipt Details</span>
            <span className="text-gray-800 font-bold">Number: <span className="text-lamaSky">{receiptNo}</span></span>
            <span className="text-gray-500">Date Issued: {new Date(paidAt).toLocaleDateString("en-GB", {
              day: "numeric",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}</span>
            <span className="text-gray-500">Method: Cash (BDT ৳)</span>
          </div>

          <div className="flex flex-col gap-1 items-end text-right">
            <span className="text-gray-400 font-semibold uppercase text-[9px] tracking-wider">Guardian/Parent Contact</span>
            <span className="text-gray-800 font-bold">{parent.name} {parent.surname}</span>
            <span className="text-gray-500">Phone: {parent.phone}</span>
            <span className="text-gray-500">Address: {student.address}</span>
          </div>
        </div>

        {/* STUDENT BIO CARD */}
        <div className="bg-gray-50/50 p-4 rounded-xl border border-gray-100/50 grid grid-cols-2 md:grid-cols-4 gap-4 text-xs my-6">
          <div className="flex flex-col">
            <span className="text-gray-400 font-medium">Student Name</span>
            <span className="text-gray-800 font-bold mt-0.5">{student.name} {student.surname}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-gray-400 font-medium">Class / Grade</span>
            <span className="text-gray-800 font-bold mt-0.5">Class {student.class?.name || "Unassigned"}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-gray-400 font-medium">Student ID</span>
            <span className="text-gray-800 font-bold mt-0.5">{student.id}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-gray-400 font-medium">Username</span>
            <span className="text-gray-800 font-bold mt-0.5">{student.username}</span>
          </div>
        </div>

        {/* PAID ITEMS TABLE */}
        <div className="my-6">
          <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Itemized Payment Details</h3>
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50 text-gray-500 font-bold uppercase text-[9px]">
                <th className="py-2.5 px-3">SL</th>
                <th className="py-2.5 px-3">Description</th>
                <th className="py-2.5 px-3">Billing Cycle</th>
                <th className="py-2.5 px-3 text-right">Amount Paid</th>
              </tr>
            </thead>
            <tbody>
              {collections.map((item, index) => (
                <tr key={item.id} className="border-b border-gray-50 text-gray-700">
                  <td className="py-3 px-3 font-semibold text-gray-400">{index + 1}</td>
                  <td className="py-3 px-3 font-bold">{item.name}</td>
                  <td className="py-3 px-3 text-gray-400 font-medium">{item.month || "One-time Charge"}</td>
                  <td className="py-3 px-3 text-right font-bold text-gray-800">৳{item.paidAmount.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* TOTAL SUMMARY AND WORDS */}
        <div className="flex flex-col items-end gap-2 border-t border-gray-100 pt-5 my-6 text-xs">
          <div className="flex justify-between w-64 items-center">
            <span className="text-gray-500 font-semibold">Subtotal:</span>
            <span className="text-gray-700 font-bold">৳{totalPaid.toLocaleString()}</span>
          </div>
          <div className="flex justify-between w-64 items-center">
            <span className="text-gray-500 font-semibold">Taxes & Surcharges:</span>
            <span className="text-gray-700 font-bold">৳0</span>
          </div>
          <div className="flex justify-between w-64 items-center border-t border-gray-100 pt-2 text-sm">
            <span className="text-gray-800 font-bold">Net BDT Received:</span>
            <span className="text-base font-extrabold text-lamaSky">৳{totalPaid.toLocaleString()}</span>
          </div>
        </div>

        {/* SIGNATURES AND STAMPS */}
        <div className="grid grid-cols-3 gap-6 pt-16 text-center text-xs mt-12">
          {/* Guardian Slot */}
          <div className="flex flex-col items-center">
            <div className="w-full border-t border-dashed border-gray-200 pt-2 text-[10px] text-gray-400 uppercase font-semibold">
              Guardian Signature
            </div>
          </div>

          {/* School Stamp Placeholder */}
          <div className="flex flex-col items-center justify-center -mt-6">
            <div className="w-14 h-14 rounded-full border border-dashed border-gray-300 flex items-center justify-center text-[8px] text-gray-300 font-bold uppercase rotate-12 select-none">
              School Seal
            </div>
            <span className="text-[9px] text-gray-400 font-medium mt-1">Official Stamp</span>
          </div>

          {/* Accountant/Cashier Slot */}
          <div className="flex flex-col items-center">
            <div className="w-full border-t border-dashed border-gray-200 pt-2 text-[10px] text-gray-400 uppercase font-semibold">
              Cashier Signature
            </div>
            <span className="text-[9px] text-gray-500 mt-1 font-semibold">ID: {cashierId}</span>
          </div>
        </div>

        {/* PRINT WATERMARK NOTES */}
        <p className="text-[9px] text-gray-300 italic text-center mt-12 border-t border-gray-50 pt-3 select-none">
          This is an electronically generated statement. Generated via Bornomala SMS & Accounting Management System.
        </p>

      </div>

      {/* INLINE CSS FOR PRINT OVERRIDES */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body, html, main, #__next {
            background: white !important;
            color: black !important;
            padding: 0 !important;
            margin: 0 !important;
            width: 100% !important;
            height: auto !important;
          }
          /* Hide sidebar, navbar, header, print header container, and action buttons */
          header, footer, nav, aside, [role="navigation"], .print\\:hidden {
            display: none !important;
          }
          /* Override layout wrappers that limit width */
          .flex, .grid, .min-h-screen {
            display: block !important;
            background: white !important;
          }
          /* Force container to take full width and hide card borders */
          .max-w-2xl {
            max-width: 100% !important;
            width: 100% !important;
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          /* Force page print margins */
          @page {
            size: A4 portrait;
            margin: 15mm;
          }
        }
      `}} />
    </div>
  );
}
