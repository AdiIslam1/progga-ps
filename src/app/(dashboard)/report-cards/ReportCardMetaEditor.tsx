"use client";

import { useState } from "react";
import { upsertReportCard } from "@/lib/actions";
import { toast } from "react-toastify";

const MORAL_OPTIONS = ["Best", "Better", "Good", "Need Improvement"];

export default function ReportCardMetaEditor({
  studentId,
  studentName,
  academicYear,
  initialData,
}: {
  studentId: string;
  studentName: string;
  academicYear: string;
  initialData: {
    comments: string;
    moralBehavior: string;
    sports: boolean;
    culturalFunction: boolean;
    scoutBnc: boolean;
    mathOlympiad: boolean;
  };
}) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(initialData);

  const save = async () => {
    setSaving(true);
    const res = await upsertReportCard(studentId, academicYear, form);
    setSaving(false);
    if (res.success) {
      toast(`Saved for ${studentName}`);
      setOpen(false);
    } else {
      toast("Failed to save. Please try again.");
    }
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="text-[10px] text-blue-600 underline hover:text-blue-800"
      >
        Edit comments &amp; evaluation for {studentName}
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-3 text-xs">
      <div className="font-semibold text-gray-700 text-[11px]">Editing: {studentName}</div>

      <div className="flex flex-col gap-1">
        <label className="text-[10px] font-semibold text-gray-500">Comments</label>
        <input
          type="text"
          className="ring-1 ring-gray-300 rounded p-1.5 text-xs w-full"
          value={form.comments}
          onChange={(e) => setForm({ ...form, comments: e.target.value })}
          placeholder="e.g. YOUR RESULT IS SATISFACTORY"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-[10px] font-semibold text-gray-500">Moral &amp; Behavior</label>
        <div className="flex gap-3">
          {MORAL_OPTIONS.map((opt) => (
            <label key={opt} className="flex items-center gap-1 cursor-pointer">
              <input
                type="radio"
                name={`moral-${studentId}`}
                checked={form.moralBehavior === opt}
                onChange={() => setForm({ ...form, moralBehavior: opt })}
              />
              <span>{opt}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-[10px] font-semibold text-gray-500">Co-Curricular Activities</label>
        <div className="flex gap-4">
          {(
            [
              { key: "sports", label: "Sports" },
              { key: "culturalFunction", label: "Cultural Function" },
              { key: "scoutBnc", label: "Scout/BNC" },
              { key: "mathOlympiad", label: "Math/Olympiad" },
            ] as { key: keyof typeof form; label: string }[]
          ).map(({ key, label }) => (
            <label key={key} className="flex items-center gap-1 cursor-pointer">
              <input
                type="checkbox"
                checked={!!form[key]}
                onChange={(e) => setForm({ ...form, [key]: e.target.checked })}
              />
              <span>{label}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={save}
          disabled={saving}
          className="bg-blue-700 hover:bg-blue-800 disabled:opacity-60 text-white px-4 py-1.5 rounded text-[11px] font-semibold"
        >
          {saving ? "Saving…" : "Save"}
        </button>
        <button
          onClick={() => { setForm(initialData); setOpen(false); }}
          className="text-gray-500 hover:text-gray-700 px-3 py-1.5 text-[11px]"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
