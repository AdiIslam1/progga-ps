"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveBulkSchedule, deleteScheduleEntry } from "@/lib/actions";
import { toast } from "react-toastify";
import { Trash2 } from "lucide-react";

export type SubjectRow = {
  id: number;
  name: string;
  entry: {
    id: number;
    date: string;
    startTime: string | null;
    endTime: string | null;
    room: string | null;
    totalMarks: number;
  } | null;
};

type RowState = {
  date: string;
  startTime: string;
  endTime: string;
  totalMarks: number;
  entryId: number | null;
};

// Parse a UTC ISO date string into a YYYY-MM-DD string without shifting timezone
function toDateInput(iso: string) {
  return iso.split("T")[0];
}

function toTimeInput(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  return `${String(d.getUTCHours()).padStart(2, "0")}:${String(d.getUTCMinutes()).padStart(2, "0")}`;
}

export default function ScheduleEditor({
  subjects,
  examId,
  classId,
}: {
  subjects: SubjectRow[];
  examId: number;
  classId: number;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [rows, setRows] = useState<Record<number, RowState>>(() => {
    const init: Record<number, RowState> = {};
    subjects.forEach((sub) => {
      init[sub.id] = {
        date: sub.entry ? toDateInput(sub.entry.date) : "",
        startTime: sub.entry ? toTimeInput(sub.entry.startTime) : "",
        endTime: sub.entry ? toTimeInput(sub.entry.endTime) : "",
        totalMarks: sub.entry?.totalMarks ?? 100,
        entryId: sub.entry?.id ?? null,
      };
    });
    return init;
  });

  const update = (subjectId: number, field: keyof RowState, value: string | number) => {
    setRows((prev) => ({ ...prev, [subjectId]: { ...prev[subjectId], [field]: value } }));
  };

  const handleSave = () => {
    startTransition(async () => {
      const payload = subjects.map((sub) => ({
        subjectId: sub.id,
        entryId: rows[sub.id].entryId,
        date: rows[sub.id].date,
        startTime: rows[sub.id].startTime,
        endTime: rows[sub.id].endTime,
        room: "",
        totalMarks: rows[sub.id].totalMarks,
      }));

      const res = await saveBulkSchedule(examId, classId, payload);
      if (res.success) {
        toast.success("Schedule saved!");
        router.refresh();
      } else {
        toast.error("Failed to save schedule.");
      }
    });
  };

  const handleClear = (subjectId: number) => {
    const entryId = rows[subjectId].entryId;
    if (entryId) {
      if (!confirm("Remove this subject from the schedule?")) return;
      startTransition(async () => {
        const res = await deleteScheduleEntry(entryId);
        if (res.success) {
          toast("Entry removed.");
          setRows((prev) => ({
            ...prev,
            [subjectId]: { date: "", startTime: "", endTime: "", totalMarks: 100, entryId: null },
          }));
          router.refresh();
        } else {
          toast.error("Failed to remove entry.");
        }
      });
    } else {
      setRows((prev) => ({
        ...prev,
        [subjectId]: { ...prev[subjectId], date: "", startTime: "", endTime: "" },
      }));
    }
  };

  const scheduledCount = subjects.filter((s) => rows[s.id]?.date).length;

  return (
    <div className="flex flex-col gap-4">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
              <th className="border border-gray-200 px-4 py-3 text-left">Subject</th>
              <th className="border border-gray-200 px-3 py-3 text-center w-28">Total Marks</th>
              <th className="border border-gray-200 px-3 py-3 text-left w-44">Date</th>
              <th className="border border-gray-200 px-3 py-3 text-left w-36">
                Start <span className="normal-case font-normal text-gray-400">(opt)</span>
              </th>
              <th className="border border-gray-200 px-3 py-3 text-left w-36">
                End <span className="normal-case font-normal text-gray-400">(opt)</span>
              </th>
              <th className="border border-gray-200 px-2 py-3 w-10"></th>
            </tr>
          </thead>
          <tbody>
            {subjects.map((sub) => {
              const row = rows[sub.id];
              const scheduled = !!row?.date;
              return (
                <tr
                  key={sub.id}
                  className={`transition-colors ${scheduled ? "bg-white" : "bg-gray-50/50 opacity-70"}`}
                >
                  <td className="border border-gray-100 px-4 py-3 font-semibold text-gray-800 text-sm">
                    <div className="flex items-center gap-2">
                      {sub.name}
                      {row?.entryId && (
                        <span className="text-[9px] font-bold text-green-600 bg-green-50 border border-green-100 px-1.5 py-0.5 rounded-full uppercase tracking-wide">
                          saved
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="border border-gray-100 px-2 py-2 text-center">
                    <input
                      type="number"
                      min="1"
                      value={row?.totalMarks ?? 100}
                      onChange={(e) => update(sub.id, "totalMarks", parseInt(e.target.value) || 100)}
                      className="w-20 text-center ring-1 ring-gray-200 rounded-lg px-2 py-2 text-sm outline-none focus:ring-2 focus:ring-lamaSky"
                    />
                  </td>
                  <td className="border border-gray-100 px-2 py-2">
                    <input
                      type="date"
                      value={row?.date ?? ""}
                      onChange={(e) => update(sub.id, "date", e.target.value)}
                      className="ring-1 ring-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-lamaSky w-full"
                    />
                  </td>
                  <td className="border border-gray-100 px-2 py-2">
                    <input
                      type="time"
                      value={row?.startTime ?? ""}
                      onChange={(e) => update(sub.id, "startTime", e.target.value)}
                      className="ring-1 ring-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-lamaSky w-full"
                    />
                  </td>
                  <td className="border border-gray-100 px-2 py-2">
                    <input
                      type="time"
                      value={row?.endTime ?? ""}
                      onChange={(e) => update(sub.id, "endTime", e.target.value)}
                      className="ring-1 ring-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-lamaSky w-full"
                    />
                  </td>
                  <td className="border border-gray-100 px-2 py-2 text-center">
                    {scheduled && (
                      <button
                        type="button"
                        onClick={() => handleClear(sub.id)}
                        disabled={isPending}
                        className="text-gray-300 hover:text-red-400 transition-colors disabled:opacity-50"
                        title="Remove"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-400">
          {scheduledCount} of {subjects.length} subjects scheduled. Only date is required — times are optional.
        </p>
        <button
          onClick={handleSave}
          disabled={isPending}
          className="bg-lamaSky text-white font-semibold py-2.5 px-6 rounded-xl text-sm hover:bg-[#1e40af] transition-colors disabled:opacity-50"
        >
          {isPending ? "Saving…" : "Save Schedule"}
        </button>
      </div>
    </div>
  );
}
