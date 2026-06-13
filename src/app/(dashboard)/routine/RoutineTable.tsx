"use client";

import Link from "next/link";
import Image from "next/image";

export type Period = {
  startTime: string;
  endTime: string;
  label: string;
  timeRange: string;
};

export type RoutineCell = {
  subjectName: string;
  teacherName: string;
} | null;

export type RoutineRow = {
  day: string;
  dayLabel: string;
  cells: RoutineCell[];
};

function PrintIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="6 9 6 2 18 2 18 9" />
      <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
      <rect x="6" y="14" width="12" height="8" />
    </svg>
  );
}

export default function RoutineTable({
  periods,
  rows,
  className,
  classId,
  role,
}: {
  periods: Period[];
  rows: RoutineRow[];
  className: string;
  classId: number | null;
  role: string;
}) {
  const year = new Date().getFullYear();
  const hasData = periods.length > 0;

  return (
    <>
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #routine-print-root,
          #routine-print-root * { visibility: visible !important; }
          #routine-print-root {
            position: fixed;
            inset: 0;
            padding: 28px 32px;
            background: #fff;
            overflow: visible;
          }
          .no-print { display: none !important; }
        }
      `}</style>

      <div id="routine-print-root">
        {/* Print-only header */}
        <div className="hidden print:block text-center mb-6">
          <p className="text-xs text-gray-500 uppercase tracking-widest mb-0.5">
            Progga Preparatory &amp; High School
          </p>
          <h1 className="text-2xl font-extrabold text-gray-900">Class Routine {year}</h1>
          <p className="text-base font-semibold text-gray-700 mt-1">Class: {className}</p>
          <div className="border-t-2 border-gray-800 mt-3" />
        </div>

        {/* Screen controls */}
        <div className="no-print flex items-center justify-between mb-4 flex-wrap gap-3">
          <div>
            <p className="text-xs text-gray-400">
              {hasData
                ? `${periods.length} period${periods.length !== 1 ? "s" : ""} · Class ${className}`
                : `Class ${className}`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {role === "admin" && classId && (
              <Link
                href={`/routine/edit?classId=${classId}`}
                className="no-print flex items-center gap-1.5 bg-lamaYellow text-gray-800 text-xs font-semibold px-3 py-2 rounded-xl hover:opacity-90 transition-opacity"
              >
                <Image src="/update.png" alt="" width={14} height={14} />
                Edit Routine
              </Link>
            )}
            {hasData && (
              <button
                onClick={() => window.print()}
                className="no-print flex items-center gap-1.5 bg-lamaSky text-white text-xs font-semibold px-3 py-2 rounded-xl hover:bg-[#38b1d8] transition-colors"
              >
                <PrintIcon />
                Print
              </button>
            )}
          </div>
        </div>

        {/* Table */}
        {!hasData ? (
          <div className="text-center py-20 text-gray-400 no-print">
            <p className="text-sm">No routine set for this class yet.</p>
            {role === "admin" && classId && (
              <Link
                href={`/routine/edit?classId=${classId}`}
                className="inline-block mt-3 text-xs text-lamaSky underline"
              >
                Add periods →
              </Link>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm min-w-[600px]">
              <thead>
                <tr>
                  {/* Top-left corner cell */}
                  <th className="border border-gray-300 bg-gray-50 px-3 py-3 text-left align-bottom print:border-gray-800">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">
                        Period →
                      </span>
                      <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">
                        Day ↓
                      </span>
                    </div>
                  </th>
                  {periods.map((period, i) => (
                    <th
                      key={i}
                      className="border border-gray-300 bg-gray-50 px-3 py-3 text-center font-semibold text-gray-700 min-w-[110px] print:border-gray-800"
                    >
                      <div className="text-xs font-bold">{period.label}</div>
                      <div className="text-[10px] text-gray-500 font-normal mt-0.5">
                        {period.timeRange}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, ri) => (
                  <tr
                    key={row.day}
                    className={ri % 2 === 0 ? "bg-white" : "bg-gray-50/50"}
                  >
                    <td className="border border-gray-300 px-3 py-3 font-semibold text-gray-700 text-sm whitespace-nowrap print:border-gray-800">
                      {row.dayLabel}
                    </td>
                    {row.cells.map((cell, ci) => (
                      <td
                        key={ci}
                        className="border border-gray-300 px-3 py-3 text-center print:border-gray-800"
                      >
                        {cell ? (
                          <div>
                            <p className="font-semibold text-gray-800 text-xs">
                              {cell.subjectName}
                            </p>
                            <p className="text-[10px] text-gray-400 mt-0.5 print:hidden">
                              {cell.teacherName}
                            </p>
                          </div>
                        ) : (
                          <span className="text-gray-200 text-xs">—</span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
