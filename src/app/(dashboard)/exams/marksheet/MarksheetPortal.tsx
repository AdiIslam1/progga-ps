"use client";

import { saveBulkResults } from "@/lib/actions";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { toast } from "react-toastify";

interface StudentItem {
  id: string;
  name: string;
  surname: string;
}

interface ResultItem {
  studentId: string;
  score: number;
  grade: string | null;
  gpa: number | null;
}

interface MarksheetPortalProps {
  examId: number;
  examTitle: string;
  subjectId: number;
  students: StudentItem[];
  existingResults: ResultItem[];
  totalMarks: number;
}

export default function MarksheetPortal({
  examId,
  examTitle,
  subjectId,
  students,
  existingResults,
  totalMarks,
}: MarksheetPortalProps) {
  const router = useRouter();
  const [scores, setScores] = useState<{ [studentId: string]: string }>({});
  const [loading, setLoading] = useState(false);

  // Pre-populate with existing results
  useEffect(() => {
    const initialScores: { [studentId: string]: string } = {};
    students.forEach((std) => {
      const match = existingResults.find((r) => r.studentId === std.id);
      initialScores[std.id] = match ? match.score.toString() : "";
    });
    setScores(initialScores);
  }, [students, existingResults]);

  const passThreshold = Math.ceil(totalMarks * 0.33);

  const handleScoreChange = (studentId: string, val: string) => {
    if (val === "") {
      setScores((prev) => ({ ...prev, [studentId]: "" }));
      return;
    }
    const parsed = parseInt(val);
    if (isNaN(parsed) || parsed < 0 || parsed > totalMarks) return;
    setScores((prev) => ({ ...prev, [studentId]: val }));
  };

  const calculateGradeAndGpa = (scoreVal: string) => {
    if (scoreVal === "") return { grade: "-", gpa: "-" };
    const pct = (parseInt(scoreVal) / totalMarks) * 100;
    if (pct >= 80) return { grade: "A+", gpa: "5.0" };
    if (pct >= 70) return { grade: "A",  gpa: "4.0" };
    if (pct >= 60) return { grade: "A-", gpa: "3.5" };
    if (pct >= 50) return { grade: "B",  gpa: "3.0" };
    if (pct >= 40) return { grade: "C",  gpa: "2.0" };
    if (pct >= 33) return { grade: "D",  gpa: "1.0" };
    return { grade: "F", gpa: "0.0" };
  };

  const handleSave = async () => {
    const payload: { studentId: string; score: number }[] = [];

    for (const std of students) {
      const val = scores[std.id];
      if (val === "") {
        toast.error(`Please enter a score for all students. ${std.name} has no score.`);
        return;
      }
      payload.push({
        studentId: std.id,
        score: parseInt(val),
      });
    }

    setLoading(true);
    try {
      const res = await saveBulkResults(examId, subjectId, payload);
      if (res.success) {
        toast.success(`Grades for "${examTitle}" recorded successfully!`);
        router.refresh();
      } else {
        toast.error("Failed to save results.");
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Compute breakdown metrics
  const scoreEntries = Object.values(scores).filter((v) => v !== "").map((v) => parseInt(v));
  const totalEntered = scoreEntries.length;
  const passed = scoreEntries.filter((s) => s >= passThreshold).length;
  const passRate = totalEntered > 0 ? ((passed / totalEntered) * 100).toFixed(0) : "0";
  const average = totalEntered > 0 ? (scoreEntries.reduce((a, b) => a + b, 0) / totalEntered).toFixed(1) : "0";

  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col gap-6">
      {/* PERFORMANCE SUMMARY BADGES */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-3 border-b border-gray-50 pb-5">
        <div className="bg-[#fcfdfa] p-3 rounded-xl border border-gray-100 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Average Score</span>
            <p className="text-lg font-black text-gray-800 mt-0.5">{average} / {totalMarks}</p>
          </div>
          <span className="text-lg">🎯</span>
        </div>
        <div className="bg-[#fbfdfd] p-3 rounded-xl border border-gray-100 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Pass Rate</span>
            <p className="text-lg font-black text-gray-800 mt-0.5">{passRate}%</p>
          </div>
          <span className="text-lg">📈</span>
        </div>
        <div className="bg-[#fdfbfd] p-3 rounded-xl border border-gray-100 flex items-center justify-between col-span-2 md:col-span-1">
          <div>
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Students Graded</span>
            <p className="text-lg font-black text-gray-800 mt-0.5">{totalEntered} / {students.length}</p>
          </div>
          <span className="text-lg">👥</span>
        </div>
      </div>

      {/* STUDENT MARKSHEET GRID */}
      <div className="overflow-x-auto pr-1">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50 text-gray-500 font-bold uppercase text-[9px] tracking-wider">
              <th className="p-3">Student Name</th>
              <th className="p-3">Student ID</th>
              <th className="p-3 w-36">Obtained Marks (/{totalMarks})</th>
              <th className="p-3 w-24">Letter Grade</th>
              <th className="p-3 w-24">Grade Point (GP)</th>
              <th className="p-3 text-right">Status</th>
            </tr>
          </thead>
          <tbody>
            {students.map((std) => {
              const val = scores[std.id] || "";
              const { grade, gpa } = calculateGradeAndGpa(val);
              const isFail = val !== "" && parseInt(val) < passThreshold;
              return (
                <tr
                  key={std.id}
                  className="border-b border-gray-50 text-gray-700 hover:bg-slate-50/50 transition-colors"
                >
                  <td className="p-3 font-bold text-gray-800">
                    {std.name} {std.surname}
                  </td>
                  <td className="p-3 font-medium text-gray-400">{std.id}</td>
                  <td className="p-3">
                    <input
                      type="number"
                      placeholder="Enter Marks"
                      min="0"
                      max={totalMarks}
                      className={`ring-1 p-2 rounded-xl text-xs w-full max-w-24 outline-none focus:ring-2 transition-all font-semibold ${
                        isFail
                          ? "ring-red-200 focus:ring-red-500 bg-red-50/50 text-red-700"
                          : val !== ""
                          ? "ring-green-200 focus:ring-green-500 bg-green-50/30 text-green-700"
                          : "ring-gray-200 focus:ring-lamaSky"
                      }`}
                      value={val}
                      onChange={(e) => handleScoreChange(std.id, e.target.value)}
                    />
                  </td>
                  <td className={`p-3 font-black text-sm ${isFail ? "text-red-600 animate-pulse" : "text-gray-800"}`}>
                    {grade}
                  </td>
                  <td className={`p-3 font-black text-sm ${isFail ? "text-red-600" : "text-gray-800"}`}>
                    {gpa}
                  </td>
                  <td className="p-3 text-right">
                    {val === "" ? (
                      <span className="text-[10px] text-gray-300 font-bold bg-gray-50 px-2 py-1 rounded-full">
                        Pending
                      </span>
                    ) : isFail ? (
                      <span className="text-[10px] text-red-600 font-bold bg-red-50 px-2 py-1 rounded-full">
                        Failed
                      </span>
                    ) : (
                      <span className="text-[10px] text-green-600 font-bold bg-green-50 px-2 py-1 rounded-full">
                        Passed
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* SAVE CONTROLS */}
      <div className="border-t border-gray-50 pt-5 flex items-center justify-between mt-2">
        <span className="text-[10px] text-gray-400 font-medium">
          Note: Board GPA standard calculations are fully integrated.
        </span>
        <button
          onClick={handleSave}
          disabled={loading || students.length === 0}
          className="bg-lamaSky hover:bg-[#1e40af] text-white font-bold py-2.5 px-6 rounded-xl text-xs transition-colors shadow-sm disabled:opacity-50 flex items-center gap-1.5"
        >
          {loading ? "Recording..." : "💾 Save Results Ledger"}
        </button>
      </div>
    </div>
  );
}
