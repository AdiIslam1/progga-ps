"use client";

export default function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="bg-lamaSky hover:bg-[#1e40af] text-white font-bold py-2 px-4 rounded-xl text-xs shadow-sm transition-all duration-200 flex items-center gap-1.5"
    >
      🖨️ Print Receipt
    </button>
  );
}
