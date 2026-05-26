import React from "react";

interface AttendanceRecord {
  id: number;
  date: Date;
  present: boolean;
  subject: {
    name: string;
  };
}

interface AttendanceAnalyticsProps {
  studentName: string;
  studentId: string;
  records: AttendanceRecord[];
}

export default function AttendanceAnalytics({
  studentName,
  studentId,
  records,
}: AttendanceAnalyticsProps) {
  // Compute analytics metrics
  const totalDays = records.length;
  const daysPresent = records.filter((r) => r.present).length;
  const daysAbsent = totalDays - daysPresent;
  const attendanceRate = totalDays > 0 ? ((daysPresent / totalDays) * 100).toFixed(1) : "0.0";
  const attendanceNum = parseFloat(attendanceRate);

  // Group records chronologically (newest first)
  const sortedRecords = [...records].sort((a, b) => b.date.getTime() - a.date.getTime());

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* ANALYTICS HIGHLIGHT METRICS */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {/* Attendance Percentage Circle Card */}
        <div className="bg-gradient-to-br from-[#ffffff] to-[#fafbfe] p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between col-span-2">
          <div>
            <span className="text-[10px] text-gray-400 font-extrabold uppercase tracking-wider block">Overall Attendance Rate</span>
            <h2 className="text-3xl font-black text-gray-800 mt-1">{attendanceRate}%</h2>
            <p className="text-xs text-gray-400 mt-1.5 leading-relaxed">
              {attendanceNum >= 90
                ? "Excellent attendance record! Keep up the brilliant consistency."
                : attendanceNum >= 75
                ? "Good record, but try to stay regular to prevent missing crucial lectures."
                : "Warning: Attendance is below optimal boundaries. Requires immediate review."}
            </p>
          </div>
          
          {/* Radial Indicator Mockup */}
          <div className="relative w-20 h-20 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="40"
                cy="40"
                r="34"
                stroke="#f3f4f6"
                strokeWidth="6"
                fill="transparent"
              />
              <circle
                cx="40"
                cy="40"
                r="34"
                stroke={attendanceNum >= 90 ? "#10b981" : attendanceNum >= 75 ? "#38bdf8" : "#f43f5e"}
                strokeWidth="6"
                fill="transparent"
                strokeDasharray="213.6"
                strokeDashoffset={213.6 - (213.6 * attendanceNum) / 100}
                className="transition-all duration-1000 ease-out"
              />
            </svg>
            <span className="absolute text-xs font-black text-gray-700">
              {attendanceNum.toFixed(0)}%
            </span>
          </div>
        </div>

        {/* Days Present Card */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Classes Attended</span>
            <h3 className="text-2xl font-black text-green-600 mt-1">{daysPresent} / {totalDays}</h3>
            <span className="text-[10px] text-gray-400 block mt-1">Days Present</span>
          </div>
          <span className="text-2xl bg-green-50 w-10 h-10 rounded-full flex items-center justify-center">🟢</span>
        </div>

        {/* Days Absent Card */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Classes Missed</span>
            <h3 className="text-2xl font-black text-red-600 mt-1">{daysAbsent} / {totalDays}</h3>
            <span className="text-[10px] text-gray-400 block mt-1">Days Absent</span>
          </div>
          <span className="text-2xl bg-red-50 w-10 h-10 rounded-full flex items-center justify-center">🔴</span>
        </div>
      </div>

      {/* DETAILED ATTENDANCE LOG TABLE */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col gap-4">
        <div>
          <h3 className="text-base font-bold text-gray-800">Attendance Log History</h3>
          <p className="text-xs text-gray-400 mt-0.5">Chronological record of class attendance tracked inside Progga Preparatory and High School portals.</p>
        </div>

        {sortedRecords.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-gray-100 rounded-xl">
            <span className="text-2xl block mb-2">📅</span>
            <p className="text-gray-500 text-sm font-semibold">No attendance logged yet</p>
            <p className="text-[11px] text-gray-400">Daily routine lectures will populate this record summary.</p>
          </div>
        ) : (
          <div className="overflow-x-auto pr-1">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50 text-gray-500 font-bold uppercase text-[9px] tracking-wider">
                  <th className="p-3">Date</th>
                  <th className="p-3">Subject</th>
                  <th className="p-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody>
                {sortedRecords.map((rec) => (
                  <tr
                    key={rec.id}
                    className="border-b border-gray-50 text-gray-700 hover:bg-slate-50/50 transition-colors"
                  >
                    <td className="p-3 font-semibold text-gray-800">
                      {new Date(rec.date).toLocaleDateString("en-US", {
                        weekday: "short",
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </td>
                    <td className="p-3 font-semibold text-gray-700">{rec.subject.name}</td>
                    <td className="p-3 text-right">
                      {rec.present ? (
                        <span className="text-[10px] text-green-700 font-bold bg-green-50 px-2.5 py-0.5 rounded-full border border-green-100">
                          Present
                        </span>
                      ) : (
                        <span className="text-[10px] text-red-700 font-bold bg-red-50 px-2.5 py-0.5 rounded-full border border-red-100">
                          Absent
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
