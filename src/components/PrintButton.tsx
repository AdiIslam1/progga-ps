"use client";

export default function PrintButton({ label = "Print", className }: { label?: string; className?: string }) {
  return (
    <button
      onClick={() => window.print()}
      className={className ?? "flex items-center gap-1.5 bg-lamaSky text-white text-xs font-semibold px-3 py-2 rounded-xl hover:bg-[#38b1d8] transition-colors"}
    >
      🖨️ {label}
    </button>
  );
}
