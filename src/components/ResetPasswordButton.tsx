"use client";

import { useState, useTransition } from "react";
import { resetPassword } from "@/lib/actions";

export default function ResetPasswordButton({
  role,
  id,
}: {
  role: "teacher" | "student" | "admin";
  id: string;
}) {
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [isPending, startTransition] = useTransition();
  const [done, setDone] = useState(false);
  const [failed, setFailed] = useState(false);

  const handleSubmit = () => {
    if (!password.trim()) return;
    setFailed(false);
    startTransition(async () => {
      const result = await resetPassword(role, id, password);
      if (result.success) {
        setDone(true);
        setOpen(false);
        setPassword("");
        setTimeout(() => setDone(false), 3000);
      } else {
        setFailed(true);
      }
    });
  };

  if (done) {
    return (
      <span className="text-xs text-green-600 font-medium">Password updated.</span>
    );
  }

  if (open) {
    return (
      <div className="flex items-center gap-2">
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          placeholder="New password"
          autoFocus
          className="text-xs border border-gray-300 rounded-md px-2 py-1.5 outline-none focus:border-orange-400 w-36"
        />
        <button
          onClick={handleSubmit}
          disabled={isPending || !password.trim()}
          className="text-xs bg-orange-500 hover:bg-orange-600 text-white rounded-md px-3 py-1.5 transition-colors disabled:opacity-50"
        >
          {isPending ? "Saving…" : "Save"}
        </button>
        <button
          onClick={() => { setOpen(false); setPassword(""); setFailed(false); }}
          className="text-xs text-gray-400 hover:text-gray-600"
        >
          Cancel
        </button>
        {failed && <span className="text-xs text-red-500">Failed</span>}
      </div>
    );
  }

  return (
    <button
      onClick={() => setOpen(true)}
      className="text-xs bg-orange-50 hover:bg-orange-100 border border-orange-200 text-orange-700 rounded-md px-3 py-1.5 transition-colors"
    >
      Reset Password
    </button>
  );
}
