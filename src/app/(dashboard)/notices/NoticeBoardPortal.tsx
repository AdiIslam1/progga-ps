"use client";

import { sendNoticeSms, saveSmsConfig, sendAbsenceAlerts } from "@/lib/noticeActions";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "react-toastify";

interface ClassItem { id: number; name: string; }
interface StudentItem { id: string; name: string; surname: string; classId: number; }
interface NoticeItem {
  id: number;
  title: string;
  content: string;
  date: Date;
  type: string;
  recipientCount: number;
  sentCount: number;
  status: string;
  class: { name: string } | null;
}

interface Props {
  role: string;
  classes: ClassItem[];
  students: StudentItem[];
  currentConfig: { apiUrl: string; apiKey: string; senderId: string } | null;
  notices: NoticeItem[];
  absentTodayCount: number;
  todayStr: string;
}

const statusBadge = (status: string, sent: number, total: number) => {
  const label = status === "SENT" ? "Sent" : status === "PARTIAL" ? "Partial" : status === "FAILED" ? "Failed" : "Mock";
  const colors = {
    SENT: "bg-emerald-100 text-emerald-700",
    PARTIAL: "bg-amber-100 text-amber-700",
    FAILED: "bg-red-100 text-red-600",
    MOCK: "bg-gray-100 text-gray-500",
    PENDING: "bg-gray-100 text-gray-400",
  }[status] ?? "bg-gray-100 text-gray-400";
  return (
    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${colors}`}>
      {label} {total > 0 ? `${sent}/${total}` : ""}
    </span>
  );
};

export default function NoticeBoardPortal({ role, classes, students, currentConfig, notices, absentTodayCount, todayStr }: Props) {
  const router = useRouter();
  const isStaff = role === "admin" || role === "teacher";
  const [activeTab, setActiveTab] = useState<"compose" | "logs" | "gateway">(isStaff ? "compose" : "logs");

  // Compose state
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [target, setTarget] = useState<"ALL" | "CLASS" | "STUDENT">("ALL");
  const [classId, setClassId] = useState("");
  const [studentFilterClassId, setStudentFilterClassId] = useState("");
  const [studentId, setStudentId] = useState("");

  // Absence alert state
  const [absenceLoading, setAbsenceLoading] = useState(false);
  const defaultAbsenceMsg = `Dear Guardian, your child {studentName} was absent from school today (${todayStr}). Please inform the school if needed. — Progga HS`;
  const [absenceMsg, setAbsenceMsg] = useState(defaultAbsenceMsg);

  // Gateway state
  const [gatewayLoading, setGatewayLoading] = useState(false);
  const [apiUrl, setApiUrl] = useState(currentConfig?.apiUrl || "https://api.greenweb.com.bd/api.php");
  const [apiKey, setApiKey] = useState(currentConfig?.apiKey || "");
  const [senderId, setSenderId] = useState(currentConfig?.senderId || "");

  const isUnicode = /[^\u0000-\u007F]/.test(content);
  const charsPerSegment = isUnicode ? 70 : 160;
  const segments = content.length > 0 ? Math.ceil(content.length / charsPerSegment) : 0;

  const filteredStudents = studentFilterClassId
    ? students.filter((s) => s.classId === parseInt(studentFilterClassId))
    : students;

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      toast.error("Title and message are required.");
      return;
    }
    if (target === "CLASS" && !classId) {
      toast.error("Please select a class.");
      return;
    }
    if (target === "STUDENT" && !studentId) {
      toast.error("Please select a student.");
      return;
    }
    setLoading(true);
    try {
      const res = await sendNoticeSms(null, {
        title,
        content,
        target,
        classId: target === "CLASS" ? classId : undefined,
        studentId: target === "STUDENT" ? studentId : undefined,
      });
      if (res.success) {
        toast.success(res.message);
        setTitle("");
        setContent("");
        setStudentId("");
        setClassId("");
        router.refresh();
        setActiveTab("logs");
      } else {
        toast.error(res.message || "Failed to send.");
      }
    } catch {
      toast.error("An error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const handleAbsenceAlerts = async () => {
    if (!absenceMsg.trim()) { toast.error("Message cannot be empty."); return; }
    setAbsenceLoading(true);
    try {
      const res = await sendAbsenceAlerts(null, { dateStr: todayStr, messageTemplate: absenceMsg });
      if (res.success) {
        toast.success(res.message);
        router.refresh();
        setActiveTab("logs");
      } else {
        toast.error(res.message || "Failed to send.");
      }
    } catch {
      toast.error("An error occurred.");
    } finally {
      setAbsenceLoading(false);
    }
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setGatewayLoading(true);
    try {
      const res = await saveSmsConfig(null, { apiUrl, apiKey, senderId });
      if (res.success) {
        toast.success("Gateway settings saved.");
        router.refresh();
      } else {
        toast.error(res.message || "Failed to save.");
      }
    } catch {
      toast.error("An error occurred.");
    } finally {
      setGatewayLoading(false);
    }
  };

  const tabCls = (tab: string) =>
    `px-4 py-2.5 text-xs font-bold transition-all border-b-2 -mb-px ${
      activeTab === tab ? "border-lamaSky text-lamaSky" : "border-transparent text-gray-400 hover:text-gray-600"
    }`;

  return (
    <div className="flex flex-col gap-6">
      {/* TABS */}
      <div className="border-b border-gray-100 flex gap-1">
        {isStaff && (
          <button onClick={() => setActiveTab("compose")} className={tabCls("compose")}>
            Compose SMS
          </button>
        )}
        <button onClick={() => setActiveTab("logs")} className={tabCls("logs")}>
          Sent Log ({notices.length})
        </button>
        {role === "admin" && (
          <button onClick={() => setActiveTab("gateway")} className={tabCls("gateway")}>
            Gateway Config
            {!currentConfig?.apiKey && (
              <span className="ml-1.5 w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" />
            )}
          </button>
        )}
      </div>

      {/* COMPOSE TAB */}
      {activeTab === "compose" && isStaff && (
        <div className="flex flex-col gap-6">

        {/* ABSENCE ALERT QUICK ACTION */}
        <div className={`rounded-2xl border p-5 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between ${
          absentTodayCount > 0 ? "bg-red-50 border-red-100" : "bg-gray-50 border-gray-100"
        }`}>
          <div className="flex items-center gap-3 flex-1">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg shrink-0 ${
              absentTodayCount > 0 ? "bg-red-100" : "bg-gray-100"
            }`}>
              {absentTodayCount > 0 ? "⚠️" : "✅"}
            </div>
            <div>
              <p className={`text-sm font-bold ${absentTodayCount > 0 ? "text-red-800" : "text-gray-600"}`}>
                {absentTodayCount > 0
                  ? `${absentTodayCount} student(s) absent today (${todayStr})`
                  : `No absences recorded today (${todayStr})`}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                {absentTodayCount > 0
                  ? "Send a personalized SMS to each absent student's guardian."
                  : "Attendance has been fully recorded with no absences."}
              </p>
            </div>
          </div>
          {absentTodayCount > 0 && (
            <button
              type="button"
              onClick={() => {
                const el = document.getElementById("absence-alert-panel");
                if (el) el.classList.toggle("hidden");
              }}
              className="shrink-0 bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-xl text-xs transition-all shadow-sm"
            >
              Send Absence Alerts
            </button>
          )}
        </div>

        {/* ABSENCE ALERT PANEL (expandable) */}
        {absentTodayCount > 0 && (
          <div id="absence-alert-panel" className="hidden bg-white rounded-2xl border border-red-100 p-5 flex flex-col gap-4">
            <div>
              <h3 className="text-sm font-bold text-gray-800">Absence Alert Message</h3>
              <p className="text-xs text-gray-400 mt-0.5">
                Use <code className="bg-gray-100 px-1 rounded text-red-500 font-mono">{"{studentName}"}</code> as a placeholder — it will be replaced with each student's actual name before sending.
              </p>
            </div>
            <textarea
              className="ring-1 ring-gray-200 p-2.5 rounded-xl text-sm w-full h-24 outline-none focus:ring-2 focus:ring-red-300 transition-all resize-none"
              value={absenceMsg}
              onChange={(e) => setAbsenceMsg(e.target.value)}
            />
            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setAbsenceMsg(defaultAbsenceMsg)}
                className="text-xs text-gray-400 hover:text-gray-600 underline"
              >
                Reset to default
              </button>
              <button
                type="button"
                onClick={handleAbsenceAlerts}
                disabled={absenceLoading}
                className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-6 rounded-xl text-xs transition-all shadow-sm disabled:opacity-50 flex items-center gap-1.5"
              >
                {absenceLoading ? "Sending..." : `Send to ${absentTodayCount} Guardian(s)`}
              </button>
            </div>
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-3">
          <form
            onSubmit={handleSend}
            className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col gap-5"
          >
            <div>
              <h2 className="text-base font-bold text-gray-800">Compose SMS</h2>
              <p className="text-xs text-gray-400 mt-0.5">Send a notice directly to guardian phone numbers.</p>
            </div>

            {/* Title */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-600">
                Notice Title <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g., Absence Alert, Parent Meeting Notice"
                className="ring-1 ring-gray-200 p-2.5 rounded-xl text-sm w-full outline-none focus:ring-2 focus:ring-lamaSky transition-all placeholder:text-gray-300"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            {/* Target */}
            <div className="flex flex-col gap-3">
              <label className="text-xs font-semibold text-gray-600">Send To</label>
              <div className="grid grid-cols-3 gap-2">
                {(["ALL", "CLASS", "STUDENT"] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => { setTarget(t); setClassId(""); setStudentId(""); setStudentFilterClassId(""); }}
                    className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                      target === t
                        ? "bg-lamaSky text-white border-lamaSky"
                        : "bg-white text-gray-500 border-gray-200 hover:border-lamaSky hover:text-lamaSky"
                    }`}
                  >
                    {t === "ALL" ? "All Guardians" : t === "CLASS" ? "By Class" : "Single Student"}
                  </button>
                ))}
              </div>

              {target === "CLASS" && (
                <select
                  className="ring-1 ring-gray-200 p-2.5 rounded-xl text-sm w-full outline-none focus:ring-2 focus:ring-lamaSky bg-white"
                  value={classId}
                  onChange={(e) => setClassId(e.target.value)}
                  required
                >
                  <option value="">-- Select Class --</option>
                  {classes.map((cls) => (
                    <option key={cls.id} value={cls.id}>Class {cls.name}</option>
                  ))}
                </select>
              )}

              {target === "STUDENT" && (
                <div className="flex flex-col gap-2">
                  <select
                    className="ring-1 ring-gray-200 p-2.5 rounded-xl text-sm w-full outline-none focus:ring-2 focus:ring-lamaSky bg-white"
                    value={studentFilterClassId}
                    onChange={(e) => { setStudentFilterClassId(e.target.value); setStudentId(""); }}
                  >
                    <option value="">Filter by class (optional)</option>
                    {classes.map((cls) => (
                      <option key={cls.id} value={cls.id}>Class {cls.name}</option>
                    ))}
                  </select>
                  <select
                    className="ring-1 ring-gray-200 p-2.5 rounded-xl text-sm w-full outline-none focus:ring-2 focus:ring-lamaSky bg-white"
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    required
                  >
                    <option value="">-- Select Student --</option>
                    {filteredStudents.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.surname}, {s.name} — Class {classes.find(c => c.id === s.classId)?.name ?? s.classId}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Message */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-600">
                Message <span className="text-red-400">*</span>
              </label>
              <textarea
                placeholder="Type your message here..."
                className="ring-1 ring-gray-200 p-2.5 rounded-xl text-sm w-full h-32 outline-none focus:ring-2 focus:ring-lamaSky transition-all placeholder:text-gray-300 resize-none"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                required
              />
              <div className="flex justify-between items-center text-[10px] text-gray-400 bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-100">
                <span>Characters: <strong className="text-gray-600">{content.length}</strong></span>
                <span>Encoding: <strong className="text-gray-600">{isUnicode ? "Unicode (Bangla)" : "English"}</strong></span>
                <span>SMS segments: <strong className="text-lamaSky">{segments || 0}</strong></span>
              </div>
            </div>

            {!currentConfig?.apiKey && (
              <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 text-xs text-amber-700 font-medium">
                ⚠ No SMS gateway configured. Notice will be logged but no SMS will be sent. Set up credentials in the Gateway Config tab.
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-lamaSky hover:bg-[#38b1d8] text-white font-bold py-2.5 rounded-xl text-sm transition-all shadow-sm disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? "Sending..." : "Send SMS"}
            </button>
          </form>

          {/* TIPS */}
          <div className="flex flex-col gap-4 h-fit">
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col gap-3">
              <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider">SMS Length Guide</h3>
              <div className="flex flex-col gap-2 text-xs text-gray-500">
                <div className="flex justify-between">
                  <span>English (1 segment)</span>
                  <span className="font-bold text-gray-700">160 chars</span>
                </div>
                <div className="flex justify-between">
                  <span>Bangla (1 segment)</span>
                  <span className="font-bold text-gray-700">70 chars</span>
                </div>
                <div className="flex justify-between">
                  <span>Greenweb max</span>
                  <span className="font-bold text-gray-700">800 chars</span>
                </div>
              </div>
              <p className="text-[10px] text-gray-400 leading-relaxed border-t border-gray-50 pt-2">
                Each segment is billed as one SMS unit by Greenweb. Keep messages short to reduce cost.
              </p>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col gap-2">
              <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider">Example Message</h3>
              <p className="text-xs text-gray-500 italic leading-relaxed">
                "Dear Guardian, your ward was absent on {new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short" })}. Please contact the school. — Progga HS"
              </p>
              <p className="text-[10px] text-gray-400">105 chars — 1 English segment</p>
            </div>
          </div>
        </div>
        </div>
      )}

      {/* LOGS TAB */}
      {activeTab === "logs" && (
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col gap-4">
          <div>
            <h2 className="text-base font-bold text-gray-800">Sent SMS Log</h2>
            <p className="text-xs text-gray-400 mt-0.5">History of all SMS broadcasts dispatched to guardians.</p>
          </div>

          {notices.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <p className="text-3xl mb-3">📭</p>
              <p className="text-sm font-semibold text-gray-500">No SMS sent yet</p>
              <p className="text-xs mt-1">Compose and send your first notice from the Compose SMS tab.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100 text-[9px] uppercase font-bold text-gray-400 tracking-wider">
                    <th className="p-3 text-left">Date</th>
                    <th className="p-3 text-left">Title</th>
                    <th className="p-3 text-left">Target</th>
                    <th className="p-3 text-left">Message</th>
                    <th className="p-3 text-center">Delivery</th>
                  </tr>
                </thead>
                <tbody>
                  {notices.map((n) => (
                    <tr key={n.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                      <td className="p-3 text-gray-400 font-medium whitespace-nowrap">
                        {new Date(n.date).toLocaleDateString("en-GB", {
                          day: "numeric", month: "short", year: "numeric",
                        })}
                        <br />
                        <span className="text-[9px]">
                          {new Date(n.date).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </td>
                      <td className="p-3 font-bold text-gray-800">{n.title}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                          n.class ? "bg-lamaSkyLight text-lamaSky" : "bg-lamaPurpleLight text-lamaPurple"
                        }`}>
                          {n.class ? `Class ${n.class.name}` : "School-Wide"}
                        </span>
                      </td>
                      <td className="p-3 text-gray-600 max-w-xs truncate">{n.content}</td>
                      <td className="p-3 text-center">
                        {statusBadge(n.status, n.sentCount, n.recipientCount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* GATEWAY CONFIG TAB */}
      {activeTab === "gateway" && role === "admin" && (
        <div className="grid gap-6 lg:grid-cols-3">
          <form
            onSubmit={handleSaveConfig}
            className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col gap-5"
          >
            <div>
              <h2 className="text-base font-bold text-gray-800">Greenweb SMS Gateway</h2>
              <p className="text-xs text-gray-400 mt-0.5">
                Configure your Greenweb bulk SMS credentials. Get your token from{" "}
                <span className="text-lamaSky font-semibold">sms.greenweb.com.bd</span>.
              </p>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-600">API Endpoint URL</label>
              <input
                type="url"
                className="ring-1 ring-gray-200 p-2.5 rounded-xl text-sm w-full outline-none focus:ring-2 focus:ring-lamaSky bg-gray-50 text-gray-500"
                value={apiUrl}
                onChange={(e) => setApiUrl(e.target.value)}
                placeholder="https://api.greenweb.com.bd/api.php"
              />
              <p className="text-[10px] text-gray-400">Default Greenweb endpoint — only change if instructed by provider.</p>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-600">
                API Token <span className="text-red-400">*</span>
              </label>
              <input
                type="password"
                placeholder="Your Greenweb token (from SMS panel → API Token)"
                className="ring-1 ring-gray-200 p-2.5 rounded-xl text-sm w-full outline-none focus:ring-2 focus:ring-lamaSky transition-all placeholder:text-gray-300"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                required
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-600">Sender ID / Masking Name</label>
              <input
                type="text"
                placeholder="e.g., PROGGA-HS (optional, requires masking approval)"
                className="ring-1 ring-gray-200 p-2.5 rounded-xl text-sm w-full outline-none focus:ring-2 focus:ring-lamaSky transition-all placeholder:text-gray-300"
                value={senderId}
                onChange={(e) => setSenderId(e.target.value)}
              />
              <p className="text-[10px] text-gray-400">Masking requires prior approval from Greenweb. Leave blank for non-masking.</p>
            </div>

            <button
              type="submit"
              disabled={gatewayLoading}
              className="bg-lamaSky hover:bg-[#38b1d8] text-white font-bold py-2.5 px-6 rounded-xl text-sm transition-all shadow-sm disabled:opacity-50 flex items-center justify-center gap-1.5 w-full"
            >
              {gatewayLoading ? "Saving..." : "Save Gateway Settings"}
            </button>
          </form>

          <div className="flex flex-col gap-4 h-fit">
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col gap-3">
              <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider">How It Works</h3>
              <ol className="flex flex-col gap-2 text-xs text-gray-500 list-decimal list-inside">
                <li>Buy SMS credits at <span className="text-lamaSky font-semibold">sms.greenweb.com.bd</span></li>
                <li>Copy your API token from the SMS panel</li>
                <li>Paste it above and save</li>
                <li>Each SMS sent deducts from your credit balance</li>
              </ol>
            </div>
            <div className="bg-amber-50 border border-amber-100 p-5 rounded-2xl flex flex-col gap-2">
              <h3 className="text-xs font-bold text-amber-700 uppercase tracking-wider">Pricing</h3>
              <p className="text-xs text-amber-700">
                ~0.18–0.31 BDT per SMS. Unicode (Bangla) messages count as 70 chars per segment vs 160 for English.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
