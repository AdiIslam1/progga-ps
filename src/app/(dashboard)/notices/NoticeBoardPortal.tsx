"use client";

import { sendNoticeSms, saveSmsConfig } from "@/lib/noticeActions";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "react-toastify";

interface ClassItem {
  id: number;
  name: string;
}

interface NoticeItem {
  id: number;
  title: string;
  content: string;
  date: Date;
  type: string;
  class: { name: string } | null;
}

interface NoticeBoardPortalProps {
  role: string;
  classes: ClassItem[];
  currentConfig: { apiUrl: string; apiKey: string; senderId: string } | null;
  notices: NoticeItem[];
}

export default function NoticeBoardPortal({
  role,
  classes,
  currentConfig,
  notices,
}: NoticeBoardPortalProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"compose" | "logs" | "gateway">(
    role === "admin" || role === "teacher" ? "compose" : "logs"
  );

  // Composer States
  const [composeLoading, setComposeLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [target, setTarget] = useState<"ALL" | "CLASS" | "STUDENT">("ALL");
  const [classId, setClassId] = useState("");
  const [studentId, setStudentId] = useState("");

  // Gateway States
  const [gatewayLoading, setGatewayLoading] = useState(false);
  const [apiUrl, setApiUrl] = useState(currentConfig?.apiUrl || "");
  const [apiKey, setApiKey] = useState(currentConfig?.apiKey || "");
  const [senderId, setSenderId] = useState(currentConfig?.senderId || "");

  // Character count calculations (Standard: 160 chars per SMS segment)
  const totalChars = content.length;
  const isUnicode = /[^\u0000-\u007F]/.test(content); // Detect Unicode Bangla characters
  const charsPerSms = isUnicode ? 70 : 160;
  const smsSegments = totalChars > 0 ? Math.ceil(totalChars / charsPerSms) : 0;

  const handleSendNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !content) {
      toast.error("Please fill in notice title and body");
      return;
    }

    setComposeLoading(true);
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
        router.refresh();
        setActiveTab("logs");
      } else {
        toast.error(res.message || "Failed to dispatch announcement.");
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred. Please try again.");
    } finally {
      setComposeLoading(false);
    }
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setGatewayLoading(true);
    try {
      const res = await saveSmsConfig(null, { apiUrl, apiKey, senderId });
      if (res.success) {
        toast.success("SMS Gateway settings saved successfully!");
        router.refresh();
      } else {
        toast.error("Failed to save credentials.");
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred saving configurations.");
    } finally {
      setGatewayLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* TABS SELECTOR */}
      <div className="border-b border-gray-150 flex gap-2">
        {(role === "admin" || role === "teacher") && (
          <button
            onClick={() => setActiveTab("compose")}
            className={`px-4 py-2 text-xs font-bold transition-all border-b-2 -mb-0.5 ${
              activeTab === "compose"
                ? "border-lamaSky text-lamaSky"
                : "border-transparent text-gray-400 hover:text-gray-600"
            }`}
          >
            Compose Broadcast
          </button>
        )}
        <button
          onClick={() => setActiveTab("logs")}
          className={`px-4 py-2 text-xs font-bold transition-all border-b-2 -mb-0.5 ${
            activeTab === "logs"
              ? "border-lamaSky text-lamaSky"
              : "border-transparent text-gray-400 hover:text-gray-600"
          }`}
        >
          Sent Announcements ({notices.length})
        </button>
        {role === "admin" && (
          <button
            onClick={() => setActiveTab("gateway")}
            className={`px-4 py-2 text-xs font-bold transition-all border-b-2 -mb-0.5 ${
              activeTab === "gateway"
                ? "border-lamaSky text-lamaSky"
                : "border-transparent text-gray-400 hover:text-gray-600"
            }`}
          >
            SMS Gateway Configuration
          </button>
        )}
      </div>

      {/* COMPOSE BROADCAST TAB */}
      {activeTab === "compose" && (role === "admin" || role === "teacher") && (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* COMPOSER FORM */}
          <form
            onSubmit={handleSendNotice}
            className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col gap-5"
          >
            <div>
              <h2 className="text-base font-bold text-gray-800 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-lamaSky inline-block"></span>
                Compose Announcement SMS
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">Send custom broadcasts or event notices directly to parents.</p>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-600">Notice Title <span className="text-red-500">*</span></label>
              <input
                type="text"
                placeholder="e.g., Attendance Missed Warning"
                className="ring-1 ring-gray-200 p-2.5 rounded-xl text-sm w-full outline-none focus:ring-2 focus:ring-lamaSky transition-all placeholder:text-gray-300 font-medium"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-600">Broadcast Target</label>
                <select
                  className="ring-1 ring-gray-200 p-2.5 rounded-xl text-sm w-full outline-none focus:ring-2 focus:ring-lamaSky transition-all bg-white"
                  value={target}
                  onChange={(e) => setTarget(e.target.value as any)}
                >
                  <option value="ALL">All Parents (School-Wide)</option>
                  <option value="CLASS">Class Parents</option>
                  <option value="STUDENT">Single Student&apos;s Parent</option>
                </select>
              </div>

              {target === "CLASS" && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-gray-600">Select Class</label>
                  <select
                    className="ring-1 ring-gray-200 p-2.5 rounded-xl text-sm w-full outline-none focus:ring-2 focus:ring-lamaSky transition-all bg-white"
                    value={classId}
                    onChange={(e) => setClassId(e.target.value)}
                    required
                  >
                    <option value="">-- Choose Class --</option>
                    {classes.map((cls) => (
                      <option key={cls.id} value={cls.id}>
                        Class {cls.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {target === "STUDENT" && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-gray-600">Student Username / ID</label>
                  <input
                    type="text"
                    placeholder="e.g., student-101"
                    className="ring-1 ring-gray-200 p-2.5 rounded-xl text-sm w-full outline-none focus:ring-2 focus:ring-lamaSky transition-all placeholder:text-gray-300"
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    required
                  />
                </div>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-600">Message Body <span className="text-red-500">*</span></label>
              <textarea
                placeholder="Type your notice body here..."
                className="ring-1 ring-gray-200 p-2.5 rounded-xl text-sm w-full h-32 outline-none focus:ring-2 focus:ring-lamaSky transition-all placeholder:text-gray-300 resize-none font-medium"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                required
              />
              {/* Dynamic SMS counter metrics */}
              <div className="flex justify-between items-center text-[10px] text-gray-400 mt-1 bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-100">
                <span>Total Characters: <strong className="text-gray-700">{totalChars}</strong></span>
                <span>Encoding: <strong className="text-gray-700">{isUnicode ? "Unicode Bangla" : "Standard English"}</strong></span>
                <span>Billing cost: <strong className="text-lamaSky">{smsSegments} SMS Segment(s)</strong></span>
              </div>
            </div>

            <button
              type="submit"
              disabled={composeLoading}
              className="w-full bg-lamaSky hover:bg-[#38b1d8] text-white font-bold py-2.5 px-4 rounded-xl transition-all duration-200 text-sm shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {composeLoading ? "Dispatching Broadcast..." : "📢 Dispatch Announcement"}
            </button>
          </form>

          {/* BULK CARRIER NOTES */}
          <div className="flex flex-col gap-4">
            <div className="bg-gradient-to-br from-[#fbfdfd] to-[#f5fafc] p-6 rounded-2xl border border-sky-100 shadow-sm flex flex-col gap-3">
              <h3 className="text-xs font-bold text-sky-800 uppercase tracking-wider flex items-center gap-1.5">
                💡 Bangladeshi Carrier Cost Rules
              </h3>
              <p className="text-xs text-sky-950/80 leading-relaxed m-0">
                Standard SMS counts are **160 characters** for English (GSM 03.38 format) and **70 characters** for Unicode languages like Bangla. Segments are charged as individual message units by gateways like Teletalk, Greenweb or Elitbuzz.
              </p>
            </div>
            <div className="bg-gradient-to-br from-[#fdfbf7] to-[#fffefc] p-6 rounded-2xl border border-amber-100 shadow-sm flex flex-col gap-3">
              <h3 className="text-xs font-bold text-amber-800 uppercase tracking-wider flex items-center gap-1.5">
                ⚡ Template Suggestion
              </h3>
              <p className="text-xs text-amber-900/80 italic leading-relaxed m-0">
                &quot;Dear Guardian, your student was recorded ABSENT on May 24th Bornomala High School. Please verify.&quot; (106 characters - 1 English SMS segment)
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ANNOUNCEMENT LOGS TAB */}
      {activeTab === "logs" && (
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col gap-4">
          <div>
            <h2 className="text-base font-bold text-gray-800">Notice Board Logs</h2>
            <p className="text-xs text-gray-500 mt-0.5">Audit log of SMS broadcasts dispatched to student guardians.</p>
          </div>

          {notices.length === 0 ? (
            <p className="text-xs text-gray-400 italic py-10 text-center">No notices logged on the board yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50 text-gray-500 font-bold uppercase text-[9px] tracking-wider">
                    <th className="p-3">Date Dispatched</th>
                    <th className="p-3">Title / Subject</th>
                    <th className="p-3">Target Scope</th>
                    <th className="p-3 max-w-sm">Message Content</th>
                  </tr>
                </thead>
                <tbody>
                  {notices.map((n) => (
                    <tr key={n.id} className="border-b border-gray-50 text-gray-700 hover:bg-slate-50/50 transition-colors">
                      <td className="p-3 font-semibold text-gray-400 whitespace-nowrap">
                        {new Date(n.date).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="p-3 font-bold text-gray-800">{n.title}</td>
                      <td className="p-3 font-medium text-gray-400 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded-full text-[8px] uppercase font-bold ${
                          n.class ? "bg-lamaSkyLight text-lamaSky" : "bg-lamaPurpleLight text-lamaPurple"
                        }`}>
                          {n.class ? `Class ${n.class.name}` : "School-Wide"}
                        </span>
                      </td>
                      <td className="p-3 text-gray-600 font-medium max-w-sm">{n.content}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* GATEWAY CONFIGURATION TAB */}
      {activeTab === "gateway" && role === "admin" && (
        <div className="grid gap-6 lg:grid-cols-3">
          <form
            onSubmit={handleSaveConfig}
            className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col gap-5"
          >
            <div>
              <h2 className="text-base font-bold text-gray-800 flex items-center gap-2">
                ⚙️ Provider Credentials Setup
              </h2>
              <p className="text-xs text-gray-500 mt-0.5 font-medium">Link your school&apos;s Bulk SMS Gateway API parameters.</p>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-600">Gateway API Endpoint URL <span className="text-red-500">*</span></label>
              <input
                type="url"
                placeholder="https://api.bulksms-provider.com.bd/send"
                className="ring-1 ring-gray-200 p-2.5 rounded-xl text-sm w-full outline-none focus:ring-2 focus:ring-lamaSky transition-all placeholder:text-gray-300"
                value={apiUrl}
                onChange={(e) => setApiUrl(e.target.value)}
                required
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-600">API Key / Token <span className="text-red-500">*</span></label>
                <input
                  type="password"
                  placeholder="••••••••••••••••"
                  className="ring-1 ring-gray-200 p-2.5 rounded-xl text-sm w-full outline-none focus:ring-2 focus:ring-lamaSky transition-all placeholder:text-gray-300"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-600">Sender ID / Masking Mask</label>
                <input
                  type="text"
                  placeholder="e.g., BORNOMALAHS"
                  className="ring-1 ring-gray-200 p-2.5 rounded-xl text-sm w-full outline-none focus:ring-2 focus:ring-lamaSky transition-all placeholder:text-gray-300"
                  value={senderId}
                  onChange={(e) => setSenderId(e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={gatewayLoading}
              className="w-full bg-lamaSky hover:bg-[#38b1d8] text-white font-bold py-2.5 px-4 rounded-xl transition-all duration-200 text-sm shadow-sm hover:shadow-md disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              {gatewayLoading ? "Saving settings..." : "💾 Save Gateway Configurations"}
            </button>
          </form>

          {/* GATEWAY NOTES */}
          <div className="bg-gradient-to-br from-[#fbfdfd] to-[#f5fafc] p-6 rounded-2xl border border-sky-100 shadow-sm flex flex-col gap-3 h-fit">
            <h3 className="text-xs font-bold text-sky-800 uppercase tracking-wider flex items-center gap-1.5">
              📡 Dynamically Parameterized Dispatcher
            </h3>
            <p className="text-xs text-sky-950/80 leading-relaxed m-0">
              The notices dispatcher automatically routes GET requests to your carrier url using parameters: **apikey**, **senderid**, **contacts** (comma separated phones), and **msg** (urlencoded body text). If no provider key is saved, the dashboard automatically outputs fallback warnings to the console, ensuring sandbox compatibility.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
