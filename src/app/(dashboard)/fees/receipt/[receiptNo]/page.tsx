import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import PrintButton from "./PrintButton";

const BLUE = "#1e3a8a";

function numberToWords(num: number): string {
  if (num === 0) return "Zero Taka Only";
  const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven",
    "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen",
    "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
  function helper(n: number): string {
    if (n === 0) return "";
    if (n < 20) return ones[n] + " ";
    if (n < 100) return tens[Math.floor(n / 10)] + " " + ones[n % 10] + " ";
    if (n < 1000) return ones[Math.floor(n / 100)] + " Hundred " + helper(n % 100);
    if (n < 100000) return helper(Math.floor(n / 1000)) + "Thousand " + helper(n % 1000);
    if (n < 10000000) return helper(Math.floor(n / 100000)) + "Lakh " + helper(n % 100000);
    return helper(Math.floor(n / 10000000)) + "Crore " + helper(n % 10000000);
  }
  return helper(num).trim().replace(/\s+/g, " ") + " Taka Only";
}

function DottedRow({ label, value }: { label: string; value?: string }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: "4px" }}>
      <span style={{ flexShrink: 0, fontSize: "9px", fontWeight: 700, color: BLUE, whiteSpace: "nowrap" }}>{label}</span>
      <span style={{
        flex: 1, fontSize: "9px", color: "#1f2937",
        borderBottom: `1px dotted ${BLUE}66`, paddingBottom: "1px", minWidth: 0,
      }}>{value || " "}</span>
    </div>
  );
}

function SummaryBox({ subtotal, totalPaid, outstanding }: { subtotal: number; totalPaid: number; outstanding: number }) {
  const rows = [
    { label: "মোট", value: subtotal.toLocaleString() },
    { label: "জমা", value: totalPaid.toLocaleString() },
    { label: "বকেয়া", value: outstanding.toLocaleString() },
  ];
  return (
    <div style={{ border: `1px solid ${BLUE}55`, display: "inline-block" }}>
      {rows.map((row, i) => (
        <div key={row.label} style={{
          display: "flex",
          borderBottom: i < rows.length - 1 ? `1px solid ${BLUE}44` : undefined,
        }}>
          <span style={{ padding: "2px 8px", fontWeight: 700, fontSize: "9px", color: BLUE, minWidth: "52px" }}>{row.label}</span>
          <span style={{
            padding: "2px 8px", fontSize: "9px", fontWeight: 600, color: "#111827",
            borderLeft: `1px solid ${BLUE}44`, minWidth: "60px", textAlign: "right",
          }}>{row.value}</span>
        </div>
      ))}
    </div>
  );
}

function ReceiptCopy({
  copyLabel, receiptNo, student, dateStr, cashierId,
  collections, subtotal, totalPaid, outstanding,
}: {
  copyLabel: string; receiptNo: string; student: any; dateStr: string;
  cashierId: string; collections: any[];
  subtotal: number; totalPaid: number; outstanding: number;
}) {
  const emptyRows = Math.max(0, 6 - collections.length);

  return (
    <div style={{
      display: "flex", flexDirection: "column", gap: "8px",
      padding: "12px", border: `1px solid ${BLUE}33`, fontSize: "9px",
      fontFamily: "serif",
    }}>
      {/* School header */}
      <div style={{ textAlign: "center", borderBottom: `1px solid ${BLUE}33`, paddingBottom: "8px" }}>
        <div style={{ fontSize: "15px", fontWeight: 900, color: BLUE, lineHeight: 1.2 }}>
          প্রজ্ঞা প্রিপ্যারেটরী এন্ড হাই স্কুল
        </div>
        <div style={{ fontSize: "8px", color: "#4b5563", marginTop: "2px" }}>
          ১৭০৯, নূরানী মসজিদ রোড, পূর্ব জুরাইন, কদমতলী, ঢাকা-১২০৪
        </div>
        <div style={{ fontSize: "8px", color: "#4b5563" }}>মোবাইল ঃ ০১৯৯০-২৬৮৩২২</div>
      </div>

      {/* Receipt no + copy label */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: "4px" }}>
          <span style={{ fontSize: "9px", fontWeight: 700, color: BLUE }}>নং ঃ</span>
          <span style={{ fontSize: "28px", fontWeight: 900, color: BLUE, lineHeight: 1 }}>{receiptNo}</span>
        </div>
        <div style={{
          border: `1px solid ${BLUE}`, padding: "2px 6px",
          fontSize: "8px", fontWeight: 700, color: BLUE,
        }}>{copyLabel}</div>
      </div>

      {/* Student info */}
      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
        <DottedRow label="ছাত্র/ছাত্রীর নাম ঃ" value={`${student.name} ${student.surname}`} />
        <div style={{ display: "flex", gap: "8px" }}>
          <div style={{ flex: 1 }}><DottedRow label="শ্রেণি" value={`Class ${student.class?.name ?? ""}`} /></div>
          <div style={{ flex: 1 }}><DottedRow label="শাখা" value="" /></div>
          <div style={{ flex: 1 }}><DottedRow label="ক্রমিক নং" value={student.studentId} /></div>
        </div>
      </div>

      {/* Fee table */}
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "9px" }}>
        <thead>
          <tr style={{ backgroundColor: BLUE }}>
            <th style={{ color: "white", fontWeight: 700, textAlign: "left", padding: "3px 6px", border: `1px solid ${BLUE}` }}>বিবরণ</th>
            <th style={{ color: "white", fontWeight: 700, textAlign: "right", padding: "3px 6px", border: `1px solid ${BLUE}`, width: "56px" }}>টাকা</th>
          </tr>
        </thead>
        <tbody>
          {collections.map((item) => (
            <tr key={item.id}>
              <td style={{ border: `1px solid ${BLUE}33`, padding: "3px 6px", color: "#374151" }}>
                {item.name}{item.month ? ` (${item.month})` : ""}
              </td>
              <td style={{ border: `1px solid ${BLUE}33`, padding: "3px 6px", textAlign: "right", fontWeight: 600, color: "#111827" }}>
                {item.amount.toLocaleString()}
              </td>
            </tr>
          ))}
          {Array.from({ length: emptyRows }).map((_, i) => (
            <tr key={`e${i}`}>
              <td style={{ border: `1px solid ${BLUE}22`, padding: "3px 6px" }}>&nbsp;</td>
              <td style={{ border: `1px solid ${BLUE}22`, padding: "3px 6px" }}>&nbsp;</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Due receipt row + summary box */}
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: "8px" }}>
        <div style={{ flex: 1 }}>
          <DottedRow label="বকেয়া রিসিট নং" value="" />
        </div>
        <SummaryBox subtotal={subtotal} totalPaid={totalPaid} outstanding={outstanding} />
      </div>

      {/* Amount in words */}
      <DottedRow label="কথায় ঃ" value={numberToWords(totalPaid)} />

      {/* Footer */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginTop: "12px", paddingTop: "4px" }}>
        <div>
          <div style={{ fontSize: "8px", fontWeight: 700, color: BLUE, marginBottom: "2px" }}>তারিখ</div>
          <div style={{ borderBottom: `1px dotted ${BLUE}55`, fontSize: "9px", color: "#374151", minWidth: "80px", paddingBottom: "1px" }}>
            {dateStr}
          </div>
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "9px", color: "#6b7280", marginBottom: "2px" }}>{cashierId}</div>
          <div style={{ borderTop: `1px solid ${BLUE}55`, fontSize: "8px", fontWeight: 700, color: BLUE, paddingTop: "2px", minWidth: "80px" }}>
            আদায়কারী
          </div>
        </div>
      </div>
    </div>
  );
}

export default async function PaymentReceiptPage({ params }: { params: { receiptNo: string } }) {
  const collections = await prisma.feeCollection.findMany({
    where: { receiptNo: params.receiptNo, status: "PAID" },
    include: { student: { include: { class: true } } },
  });

  if (collections.length === 0) notFound();

  const student = collections[0].student;
  const paidAt = collections[0].paidAt || new Date();
  const cashierId = collections[0].receivedById || "—";
  const subtotal = collections.reduce((s, i) => s + i.amount, 0);
  const totalPaid = collections.reduce((s, i) => s + i.paidAmount, 0);

  const unpaidFees = await prisma.feeCollection.aggregate({
    where: { studentId: student.id, status: { in: ["UNPAID", "PENDING"] } },
    _sum: { amount: true },
  });
  const outstanding = unpaidFees._sum.amount ?? 0;

  const dateStr = new Date(paidAt).toLocaleDateString("en-GB", {
    day: "2-digit", month: "2-digit", year: "numeric",
  });

  const copyProps = {
    receiptNo: params.receiptNo, student, dateStr, cashierId,
    collections, subtotal, totalPaid, outstanding,
  };

  return (
    <>
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #receipt-print, #receipt-print * { visibility: visible !important; }
          #receipt-print {
            position: fixed !important;
            inset: 0 !important;
            display: grid !important;
            grid-template-columns: 1fr 1fr !important;
            background: white !important;
          }
          .no-print { display: none !important; }
          @page { size: A4 landscape; margin: 8mm; }
        }
      `}</style>

      {/* Screen toolbar */}
      <div className="no-print p-4 bg-[#f8fafe] border-b border-gray-100 flex items-center justify-between">
        <Link href="/fees/collect" className="text-xs font-bold text-gray-500 hover:text-gray-700 flex items-center gap-1">
          ← Back to Collector
        </Link>
        <PrintButton />
      </div>

      {/* Screen preview label */}
      <div className="no-print px-6 pt-4 text-center">
        <p className="text-xs text-gray-400">Preview — prints as A4 landscape (Office Copy + Student Copy)</p>
      </div>

      {/* Receipt: two copies side by side */}
      <div
        id="receipt-print"
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          maxWidth: "900px",
          margin: "16px auto 32px",
          background: "white",
          borderRadius: "12px",
          overflow: "hidden",
          boxShadow: "0 1px 12px rgba(0,0,0,0.08)",
          borderRight: `2px dashed ${BLUE}33`,
        }}
      >
        <ReceiptCopy copyLabel="অফিস কপি" {...copyProps} />
        <div style={{ borderLeft: `2px dashed ${BLUE}44` }}>
          <ReceiptCopy copyLabel="নিকটির কপি" {...copyProps} />
        </div>
      </div>
    </>
  );
}
