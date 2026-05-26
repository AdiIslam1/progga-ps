"use client";

import { saveBulkAttendance } from "@/lib/actions";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { toast } from "react-toastify";

interface StudentItem {
  id: string;
  name: string;
  surname: string;
}

interface AttendanceItem {
  studentId: string;
  present: boolean;
}

interface AttendancePortalProps {
  subjectId: number;
  subjectTitle: string;
  date: string;
  students: StudentItem[];
  existingAttendance: AttendanceItem[];
}

export default function AttendancePortal({
  subjectId,
  subjectTitle,
  date,
  students,
  existingAttendance,
}: AttendancePortalProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [attendanceMap, setAttendanceMap] = useState<{ [studentId: string]: boolean }>({});

  // Pre-populate with existing attendance records or default to present (true)
  useEffect(() => {
    const initialMap: { [studentId: string]: boolean } = {};
    students.forEach((std) => {
      const match = existingAttendance.find((a) => a.studentId === std.id);
      initialMap[std.id] = match ? match.present : true; // Default to present
    });
    setAttendanceMap(initialMap);
  }, [students, existingAttendance]);

  const handleToggle = (studentId: string) => {
    setAttendanceMap((prev) => ({
      ...prev,
      [studentId]: !prev[studentId],
    }));
  };

  const markAll = (status: boolean) => {
    const updatedMap: { [studentId: string]: boolean } = {};
    students.forEach((std) => {
      updatedMap[std.id] = status;
    });
    setAttendanceMap(updatedMap);
    toast.info(`Marked all students as ${status ? "Present" : "Absent"}`);
  };

  const handleSave = async () => {
    const payload = students.map((std) => ({
      studentId: std.id,
      present: attendanceMap[std.id] ?? true,
    }));

    setLoading(true);
    try {
      const res = await saveBulkAttendance(subjectId, date, payload);
      if (res.success) {
        toast.success(`Attendance for "${subjectTitle}" saved successfully!`);
        router.refresh();
      } else {
        toast.error("Failed to save attendance.");
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Metrics calculation
  const total = students.length;
  const presentCount = Object.values(attendanceMap).filter(Boolean).length;
  const absentCount = total - presentCount;
  const attendanceRate = total > 0 ? ((presentCount / total) * 100).toFixed(0) : "0";

  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col gap-6">
      {/* HEADER ACTION AREA */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-gray-50 pb-5">
        <div>
          <span className="text-[10px] uppercase font-extrabold tracking-wider px-2.5 py-1 bg-lamaSkyLight text-lamaSky rounded-full">
            Subject: {subjectTitle}
          </span>
          <h2 className="text-base font-bold text-gray-800 mt-2">
            Class Attendance Register - <span className="text-lamaSky">{date}</span>
          </h2>
        </div>

        {/* BULK SELECTION CONTROLS */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => markAll(true)}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-green-50 border border-green-100 hover:bg-green-100/50 hover:border-green-200 text-green-700 transition-all duration-200"
          >
            ✓ Mark All Present
          </button>
          <button
            onClick={() => markAll(false)}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-red-50 border border-red-100 hover:bg-red-100/50 hover:border-red-200 text-red-700 transition-all duration-200"
          >
            ✗ Mark All Absent
          </button>
        </div>
      </div>

      {/* METRICS SUMMARY */}
      <div className="grid gap-4 grid-cols-3">
        <div className="bg-[#fafdfb] p-3.5 rounded-xl border border-gray-50 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Present</span>
            <p className="text-lg font-black text-green-600 mt-0.5">{presentCount} Students</p>
          </div>
          <span className="text-lg bg-green-50 w-8 h-8 rounded-full flex items-center justify-center">🟢</span>
        </div>
        <div className="bg-[#fdfafb] p-3.5 rounded-xl border border-gray-50 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Absent</span>
            <p className="text-lg font-black text-red-600 mt-0.5">{absentCount} Students</p>
          </div>
          <span className="text-lg bg-red-50 w-8 h-8 rounded-full flex items-center justify-center">🔴</span>
        </div>
        <div className="bg-[#fafbfe] p-3.5 rounded-xl border border-gray-50 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Attendance Rate</span>
            <p className="text-lg font-black text-lamaSky mt-0.5">{attendanceRate}%</p>
          </div>
          <span className="text-lg bg-lamaSkyLight w-8 h-8 rounded-full flex items-center justify-center text-xs">📊</span>
        </div>
      </div>

      {/* ATTENDANCE CHECKLIST SPREADSHEET */}
      <div className="overflow-x-auto pr-1">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50 text-gray-500 font-bold uppercase text-[9px] tracking-wider">
              <th className="p-3.5">Student Name</th>
              <th className="p-3.5">Student ID</th>
              <th className="p-3.5 text-center w-36">Attendance Toggle</th>
              <th className="p-3.5 text-right w-28">Status Badge</th>
            </tr>
          </thead>
          <tbody>
            {students.map((std) => {
              const isPresent = attendanceMap[std.id] ?? true;
              return (
                <tr
                  key={std.id}
                  className="border-b border-gray-50 text-gray-700 hover:bg-slate-50/50 transition-colors"
                >
                  <td className="p-3.5 font-bold text-gray-800">
                    {std.name} {std.surname}
                  </td>
                  <td className="p-3.5 font-medium text-gray-400">{std.id}</td>
                  <td className="p-3.5 text-center">
                    <div className="inline-flex items-center justify-center">
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isPresent}
                          onChange={() => handleToggle(std.id)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500 transition-all duration-300"></div>
                      </label>
                    </div>
                  </td>
                  <td className="p-3.5 text-right">
                    {isPresent ? (
                      <span className="text-[10px] text-green-700 font-extrabold bg-green-50 px-3 py-1 rounded-full shadow-sm border border-green-100">
                        Present
                      </span>
                    ) : (
                      <span className="text-[10px] text-red-700 font-extrabold bg-red-50 px-3 py-1 rounded-full shadow-sm border border-red-100">
                        Absent
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* SAVE FOOTER */}
      <div className="border-t border-gray-50 pt-5 flex items-center justify-between mt-2">
        <span className="text-[10px] text-gray-400 font-medium">
          Once confirmed, this will log attendance histories for all students.
        </span>
        <button
          onClick={handleSave}
          disabled={loading || students.length === 0}
          className="bg-lamaSky hover:bg-[#38b1d8] text-white font-bold py-2.5 px-6 rounded-xl text-xs transition-all duration-200 shadow-sm disabled:opacity-50 flex items-center gap-1.5 transform hover:scale-[1.01] active:scale-[0.99]"
        >
          {loading ? "Saving Records..." : "💾 Save Attendance Register"}
        </button>
      </div>
    </div>
  );
}
