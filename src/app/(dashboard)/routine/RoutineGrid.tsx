"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useFormState } from "react-dom";
import { lessonSchema, LessonSchema } from "@/lib/formValidationSchemas";
import { createLesson, updateLesson, deleteLesson } from "@/lib/actions";
import { toast } from "react-toastify";

type Subject = { id: number; name: string };
type Teacher = { id: string; name: string; surname: string };
type LessonItem = {
  id: number;
  day: string;
  startTime: string;
  endTime: string;
  subject: Subject;
  teacher: Teacher;
};

const DAYS = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SAT"] as const;
const DAY_LABELS: Record<string, string> = {
  MONDAY: "Monday",
  TUESDAY: "Tuesday",
  WEDNESDAY: "Wednesday",
  THURSDAY: "Thursday",
  FRIDAY: "Friday",
  SAT: "Saturday",
};
const DAY_COLORS: Record<string, string> = {
  MONDAY: "bg-lamaSkyLight border-b border-sky-100 text-lamaSky",
  TUESDAY: "bg-lamaPurpleLight border-b border-purple-100 text-purple-600",
  WEDNESDAY: "bg-lamaYellowLight border-b border-yellow-100 text-yellow-700",
  THURSDAY: "bg-green-50 border-b border-green-100 text-green-700",
  FRIDAY: "bg-pink-50 border-b border-pink-100 text-pink-600",
  SAT: "bg-amber-50 border-b border-amber-100 text-amber-600",
};

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });
}

function toTimeInput(iso: string) {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export default function RoutineGrid({
  lessons,
  subjects,
  teachers,
  classId,
  role,
}: {
  lessons: LessonItem[];
  subjects: Subject[];
  teachers: Teacher[];
  classId: number;
  role: string;
}) {
  const [panelOpen, setPanelOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<LessonItem | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<LessonSchema>({ resolver: zodResolver(lessonSchema) });

  const [createState, createAction] = useFormState(createLesson, { success: false, error: false });
  const [updateState, updateAction] = useFormState(updateLesson, { success: false, error: false });
  const [deleteState, deleteAction] = useFormState(deleteLesson, { success: false, error: false });

  const openAdd = (day: string) => {
    setEditTarget(null);
    reset({
      classId,
      day: day as LessonSchema["day"],
      subjectId: undefined as any,
      teacherId: "",
      startTime: "",
      endTime: "",
      id: undefined,
    });
    setPanelOpen(true);
  };

  const openEdit = (lesson: LessonItem) => {
    setEditTarget(lesson);
    reset({
      id: lesson.id,
      day: lesson.day as LessonSchema["day"],
      classId,
      subjectId: lesson.subject.id,
      teacherId: lesson.teacher.id,
      startTime: toTimeInput(lesson.startTime),
      endTime: toTimeInput(lesson.endTime),
    });
    setPanelOpen(true);
  };

  const closePanel = () => {
    setPanelOpen(false);
    setEditTarget(null);
  };

  const onSubmit = handleSubmit((data) => {
    if (editTarget) {
      updateAction(data);
    } else {
      createAction(data);
    }
  });

  useEffect(() => {
    if (createState.success) {
      toast("Period added!");
      closePanel();
    } else if (createState.error) {
      toast.error((createState as any).message || "Failed to add period");
    }
  }, [createState]);

  useEffect(() => {
    if (updateState.success) {
      toast("Period updated!");
      closePanel();
    } else if (updateState.error) {
      toast.error((updateState as any).message || "Failed to update period");
    }
  }, [updateState]);

  useEffect(() => {
    if (deleteState.success) toast("Period deleted!");
    else if (deleteState.error) toast.error("Failed to delete period");
  }, [deleteState]);

  const isAdmin = role === "admin";

  const lessonsByDay = DAYS.map((day) => ({
    day,
    items: [...lessons]
      .filter((l) => l.day === day)
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()),
  }));

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {lessonsByDay.map(({ day, items }) => (
          <div
            key={day}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col min-h-[240px]"
          >
            <div className={`px-3 py-2.5 flex items-center justify-between ${DAY_COLORS[day]}`}>
              <span className="text-xs font-bold uppercase tracking-wide">{DAY_LABELS[day]}</span>
              <span className="text-[10px] opacity-60 font-medium">{items.length}p</span>
            </div>

            <div className="flex flex-col gap-2 p-2 flex-1">
              {items.map((lesson) => (
                <div
                  key={lesson.id}
                  className="group relative bg-gray-50/70 border border-gray-100 hover:border-gray-200 rounded-xl p-2.5 transition-all"
                >
                  <p className="text-xs font-semibold text-gray-800 pr-10 truncate">
                    {lesson.subject.name}
                  </p>
                  <p className="text-[10px] text-gray-500 mt-0.5 font-medium">
                    {fmtTime(lesson.startTime)}–{fmtTime(lesson.endTime)}
                  </p>
                  <p className="text-[10px] text-gray-400 truncate">
                    Tr. {lesson.teacher.name} {lesson.teacher.surname[0]}.
                  </p>

                  {isAdmin && (
                    <div className="absolute top-2 right-2 hidden group-hover:flex gap-1">
                      <button
                        type="button"
                        onClick={() => openEdit(lesson)}
                        className="w-5 h-5 rounded bg-lamaSky hover:bg-[#1e40af] text-white text-[10px] flex items-center justify-center"
                        title="Edit"
                      >
                        ✎
                      </button>
                      <form action={deleteAction}>
                        <input type="hidden" name="id" value={lesson.id} />
                        <button
                          type="submit"
                          className="w-5 h-5 rounded bg-red-400 hover:bg-red-500 text-white text-[10px] flex items-center justify-center"
                          title="Delete"
                          onClick={(e) => {
                            if (!confirm("Delete this period?")) e.preventDefault();
                          }}
                        >
                          ✕
                        </button>
                      </form>
                    </div>
                  )}
                </div>
              ))}

              {items.length === 0 && !isAdmin && (
                <div className="flex-1 flex items-center justify-center py-4">
                  <span className="text-[10px] text-gray-300 italic">No classes</span>
                </div>
              )}

              {isAdmin && (
                <button
                  type="button"
                  onClick={() => openAdd(day)}
                  className="mt-auto border border-dashed border-gray-200 rounded-xl py-2 text-[11px] text-gray-400 hover:text-lamaSky hover:border-lamaSky transition-colors w-full"
                >
                  + Add Period
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {panelOpen && isAdmin && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-4"
          onClick={closePanel}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 flex flex-col gap-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-gray-800">
                {editTarget ? "Edit Period" : "Add Period"}
              </h2>
              <button
                type="button"
                onClick={closePanel}
                className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
              >
                ×
              </button>
            </div>

            <form onSubmit={onSubmit} className="flex flex-col gap-3">
              <input type="hidden" {...register("classId")} />
              <input type="hidden" {...register("id")} />

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-gray-500">Day</label>
                <select
                  {...register("day")}
                  className="ring-1 ring-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-lamaSky bg-white"
                >
                  {DAYS.map((d) => (
                    <option key={d} value={d}>
                      {DAY_LABELS[d]}
                    </option>
                  ))}
                </select>
                {errors.day && <p className="text-xs text-red-400">{errors.day.message}</p>}
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-gray-500">Subject</label>
                <select
                  {...register("subjectId")}
                  className="ring-1 ring-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-lamaSky bg-white"
                >
                  <option value="">Select subject…</option>
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
                {errors.subjectId && (
                  <p className="text-xs text-red-400">{errors.subjectId.message}</p>
                )}
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-gray-500">Teacher</label>
                <select
                  {...register("teacherId")}
                  className="ring-1 ring-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-lamaSky bg-white"
                >
                  <option value="">Select teacher…</option>
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} {t.surname}
                    </option>
                  ))}
                </select>
                {errors.teacherId && (
                  <p className="text-xs text-red-400">{errors.teacherId.message}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-gray-500">Start Time</label>
                  <input
                    type="time"
                    {...register("startTime")}
                    className="ring-1 ring-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-lamaSky"
                  />
                  {errors.startTime && (
                    <p className="text-xs text-red-400">{errors.startTime.message}</p>
                  )}
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-gray-500">End Time</label>
                  <input
                    type="time"
                    {...register("endTime")}
                    className="ring-1 ring-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-lamaSky"
                  />
                  {errors.endTime && (
                    <p className="text-xs text-red-400">{errors.endTime.message}</p>
                  )}
                </div>
              </div>

              <button
                type="submit"
                className="mt-2 bg-lamaSky text-white font-semibold py-2.5 rounded-xl hover:bg-[#1e40af] transition-colors text-sm"
              >
                {editTarget ? "Update Period" : "Add Period"}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
