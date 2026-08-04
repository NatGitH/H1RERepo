import { useState, useEffect } from "react";
import AddIcon from "@mui/icons-material/Add";
import SearchIcon from "@mui/icons-material/Search";
import GroupsIcon from "@mui/icons-material/Groups";
import PersonIcon from "@mui/icons-material/Person";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import { useAuth } from "../../.Context/AuthContext";
import { apiFetch, getErrorMessage, phtLocalToISO, fmtPHT, phtNowLocal } from "../../api";
import RemoveInterviewModal from "../Functions/RemoveInterviewModal";

export default function Applicants() {
  const { auth } = useAuth();
  const [search, setSearch] = useState("");
  const [applicants, setApplicants] = useState([]);
  const [selected, setSelected] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ done: 0, total: 0 });
  const [requirements, setRequirements] = useState([]);
  const [selectedReqId, setSelectedReqId] = useState("");
  const [showReqPicker, setShowReqPicker] = useState(false);
  const [pendingFiles, setPendingFiles] = useState([]);
  const [showInterviewModal, setShowInterviewModal] = useState(false);
  const [interviewDate, setInterviewDate] = useState("");
  const [meetingType, setMeetingType] = useState("Online Meeting");
  const [meetingLink, setMeetingLink] = useState("");
  const [interviewMessage, setInterviewMessage] = useState("");
  const [sortBy, setSortBy] = useState("status");

  // Tabs: the main evaluated-applicants grid vs. the "For Interview" list
  // (relocated here from My Profile so all applicant management lives in one place).
  const [view, setView] = useState("applicants");
  const [selectedInterview, setSelectedInterview] = useState(null);
  const [showRemoveInterview, setShowRemoveInterview] = useState(false);

  // Auto-reject now lives on the upload screen (requirement picker), so every
  // company user who can upload resumes can set it for their batch.
  const [autoReject, setAutoReject] = useState("");
  const [autoRejectInput, setAutoRejectInput] = useState("");
  const [arEnabled, setArEnabled] = useState(false);

  const feats = (() => {
    const M = {
      free:       { interview: false, reject: false, pros_cons: false },
      standard:   { interview: true,  reject: true,  pros_cons: true },
      enterprise: { interview: true,  reject: true,  pros_cons: true },
    };
    return M[(auth.subscription_plan || "free").toLowerCase()] || M.free;
  })();

  const fetchEvaluations = async () => {
    setLoading(true);
    try {
      const data = await apiFetch("/api/evaluations/", { token: auth.token });
      setApplicants(Array.isArray(data) ? data : []);
    } catch {
      setApplicants([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchRequirements = async () => {
    try {
      const data = await apiFetch("/api/requirements/", { token: auth.token });
      setRequirements(
        Array.isArray(data) ? data.filter((r) => r.status === "approved") : []
      );
    } catch {
      setRequirements([]);
    }
  };

  const fetchAutoReject = async () => {
    try {
      const data = await apiFetch("/api/auto-reject/", { token: auth.token });
      const t = data?.threshold;
      setAutoReject(t === null || t === undefined ? "" : String(t));
      setAutoRejectInput(t === null || t === undefined ? "" : String(t));
    } catch {  }
  };

  useEffect(() => {
    fetchEvaluations();
    fetchRequirements();
    fetchAutoReject();
  }, []);

  const MAX_FILE_MB = 20;
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || []);
    e.target.value = "";
    if (files.length === 0) return;

    const limit  = MAX_FILE_MB * 1024 * 1024;
    const tooBig = files.filter((f) => f.size > limit);
    const valid  = files.filter((f) => f.size <= limit);

    if (tooBig.length > 0) {
      const lines = tooBig
        .map((f) => `• ${f.name} (${(f.size / (1024 * 1024)).toFixed(1)} MB)`)
        .join("\n");
      window.showAlert(
        `These file(s) exceed the ${MAX_FILE_MB} MB limit and were skipped:\n\n${lines}`
      );
    }
    if (valid.length === 0) return;

    setPendingFiles(valid);
    // Seed the auto-reject control from the company's saved threshold.
    setArEnabled(autoReject !== "");
    setAutoRejectInput(autoReject);
    setShowReqPicker(true);
  };

  const handleUpload = async () => {
    if (pendingFiles.length === 0 || !selectedReqId) {
      window.showAlert("Please select a job requirement.");
      return;
    }
    setUploading(true);
    setShowReqPicker(false);
    setUploadProgress({ done: 0, total: pendingFiles.length });

    // Apply the auto-reject choice before the batch runs so it affects these uploads.
    try {
      const ar = await apiFetch("/api/auto-reject/", {
        method: "POST",
        token: auth.token,
        body: { threshold: arEnabled ? autoRejectInput : "" },
      });
      const t = ar?.threshold;
      setAutoReject(t === null || t === undefined ? "" : String(t));
    } catch {
      // Non-blocking: if saving the threshold fails, still evaluate the resumes.
    }

    const failed = [];
    for (let i = 0; i < pendingFiles.length; i++) {
      const formData = new FormData();
      formData.append("resume", pendingFiles[i]);
      formData.append("requirement_id", selectedReqId);
      try {
        await apiFetch("/api/evaluate/", {
          method: "POST",
          token: auth.token,
          body: formData,
        });
      } catch (err) {
        failed.push({ name: pendingFiles[i].name, reason: getErrorMessage(err, "") });
      }
      setUploadProgress({ done: i + 1, total: pendingFiles.length });
      if (i < pendingFiles.length - 1) await new Promise((r) => setTimeout(r, 1500));
    }

    setUploading(false);
    setPendingFiles([]);
    setSelectedReqId("");
    setUploadProgress({ done: 0, total: 0 });
    fetchEvaluations();
    if (failed.length > 0) {
      const lines = failed.map((f) => `• ${f.name}${f.reason ? ` — ${f.reason}` : ""}`).join("\n");
      window.showAlert(`${failed.length} of ${pendingFiles.length} file(s) could not be evaluated:\n\n${lines}`);
    }
  };

  const handleStatusUpdate = async (evaluationId, status, extra = {}) => {
    try {
      await apiFetch(`/api/evaluations/${evaluationId}/status/`, {
        method: "PATCH",
        token: auth.token,
        body: { status, ...extra },
      });
      setApplicants((prev) =>
        prev.map((a) => (a.evaluation_id === evaluationId ? { ...a, status } : a))
      );
      setSelected(null);
    } catch (err) {
      window.showAlert(getErrorMessage(err, "Failed to update status"));
    }
  };

  const handleRemove = async (evaluationId) => {
    if (!(await window.showConfirm("Remove this applicant permanently? This cannot be undone.", { danger: true, confirmText: "Remove" }))) return;
    try {
      await apiFetch(`/api/evaluations/${evaluationId}/remove/`, { method: "POST", token: auth.token });
      setApplicants((prev) => prev.filter((a) => a.evaluation_id !== evaluationId));
      setSelected(null);
    } catch (err) {
      window.showAlert(getErrorMessage(err, "Failed to remove applicant"));
    }
  };

  const handleRemoveInterview = async (reason) => {
    if (!selectedInterview) return;
    try {
      await apiFetch(`/api/evaluations/${selectedInterview.evaluation_id}/remove-interview/`, {
        method: "POST",
        token: auth.token,
        body: { reason },
      });
      setApplicants((prev) => prev.filter((a) => a.evaluation_id !== selectedInterview.evaluation_id));
      setShowRemoveInterview(false);
      setSelectedInterview(null);
      window.showAlert("Interview removed and the applicant was notified.", { type: "success" });
    } catch (err) {
      window.showAlert(getErrorMessage(err, "Failed to remove the interview."));
    }
  };

  const handleMarkHired = async () => {
    if (!selectedInterview) return;
    if (!(await window.showConfirm(`Mark ${selectedInterview.applicant_name || "this applicant"} as hired?`, { confirmText: "Mark Hired" }))) return;
    try {
      await apiFetch(`/api/evaluations/${selectedInterview.evaluation_id}/status/`, {
        method: "PATCH",
        token: auth.token,
        body: { status: "hired" },
      });
      setApplicants((prev) => prev.map((a) => (a.evaluation_id === selectedInterview.evaluation_id ? { ...a, status: "hired" } : a)));
      setSelectedInterview(null);
      window.showAlert("Applicant marked as hired.", { type: "success" });
    } catch (err) {
      window.showAlert(getErrorMessage(err, "Failed to mark as hired."));
    }
  };

  const handleSendInterview = () => {
    if (!interviewDate) return window.showAlert("Please choose an interview date and time.");
    if (new Date(phtLocalToISO(interviewDate)) <= new Date())
      return window.showAlert("The interview date must be in the future.");
    if (!meetingLink.trim())
      return window.showAlert(meetingType === "Online Meeting" ? "Please paste the meeting link." : "Please enter the location.");
    handleStatusUpdate(selected.evaluation_id, "interview_sent", {
      interview_date: phtLocalToISO(interviewDate),
      meeting_type: meetingType,
      meeting_link: meetingLink.trim(),
      message: interviewMessage.trim(),
    });
    fetchEvaluations();
    setShowInterviewModal(false);
    setInterviewDate(""); setMeetingLink(""); setInterviewMessage(""); setMeetingType("Online Meeting");
  };

  const [creatingLink, setCreatingLink] = useState(false);
  const createMeetLink = async () => {
    if (!interviewDate) {
      window.showAlert("Please choose the interview date and time first.");
      return;
    }
    setCreatingLink(true);
    try {
      const data = await apiFetch("/api/create-meet-link/", {
        method: "POST",
        token: auth.token,
        body: {
          applicant_name: selected?.applicant_name || "Applicant",
          job_title: selected?.job_title || "",
          interview_date: phtLocalToISO(interviewDate),
        },
      });
      if (data?.meet_link) setMeetingLink(data.meet_link);
      else throw new Error("No link returned");
    } catch (err) {
      window.showAlert(getErrorMessage(err, "Couldn't generate a Google Meet link. Please paste one manually."));
    } finally {
      setCreatingLink(false);
    }
  };

  const guessMime = (url = "") => {
    const u = url.toLowerCase();
    if (/\.(jpg|jpeg)(\?|$)/.test(u)) return "image/jpeg";
    if (/\.png(\?|$)/.test(u))  return "image/png";
    if (/\.webp(\?|$)/.test(u)) return "image/webp";
    if (/\.pdf(\?|$)/.test(u))  return "application/pdf";
    return "application/octet-stream";
  };
  const viewResume = async (filePath) => {
    if (!filePath) return;
    const url = `https://${import.meta.env.VITE_SUPABASE_URL?.replace("https://", "")}/storage/v1/object/public/${filePath}`;
    try {
      const res = await fetch(url);
      const buf = await res.arrayBuffer();
      const blobUrl = URL.createObjectURL(new Blob([buf], { type: guessMime(filePath) }));
      window.open(blobUrl, "_blank", "noopener,noreferrer");
      setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
    } catch {
      window.open(url, "_blank", "noopener,noreferrer");
    }
  };

  const filtered = applicants.filter((a) =>
    a.status !== "interview_sent" &&
    ((a.applicant_name || "").toLowerCase().includes(search.toLowerCase()) ||
     (a.job_title || "").toLowerCase().includes(search.toLowerCase()))
  );

  const statusRank = (s) => ({ interview_sent: 0, shortlisted: 1, pending: 2, rejected: 3 }[s] ?? 2);

  // Options that show ONLY applicants of a single status.
  const statusFilter = {
    status_shortlisted: "shortlisted",
    status_pending: "pending",
    status_rejected: "rejected",
  }[sortBy];

  const visibleApplicants = statusFilter
    ? filtered.filter((a) => a.status === statusFilter)
    : filtered;

  const sortedApplicants = [...visibleApplicants].sort((a, b) => {
    if (sortBy === "name_asc")
      return (a.applicant_name || "").localeCompare(b.applicant_name || "");
    if (sortBy === "name_desc")
      return (b.applicant_name || "").localeCompare(a.applicant_name || "");
    if (sortBy === "score_desc") return (b.hire_score || 0) - (a.hire_score || 0);
    if (sortBy === "score_asc") return (a.hire_score || 0) - (b.hire_score || 0);
    return statusRank(a.status) - statusRank(b.status);
  });

  const cardBorderStyle = (status) => {
    if (status === "interview_sent") return { border: "2px solid #3b82f6", boxShadow: "3px 3px 0px #3b82f6" };
    if (status === "shortlisted")    return { border: "2px solid #22c55e", boxShadow: "3px 3px 0px #22c55e" };
    if (status === "rejected")       return { border: "2px solid #ef4444", boxShadow: "3px 3px 0px #ef4444" };
    return { border: "2px solid #0f172a", boxShadow: "3px 3px 0px #0f172a" };
  };

  const handleCardClick = (applicant) => {
    const idx = sortedApplicants.findIndex((a) => a.evaluation_id === applicant.evaluation_id);
    setCurrentIndex(idx);
    setSelected(applicant);
  };

  const handlePrev = () => {
    const newIdx = (currentIndex - 1 + sortedApplicants.length) % sortedApplicants.length;
    setCurrentIndex(newIdx);
    setSelected(sortedApplicants[newIdx]);
  };

  const handleNext = () => {
    const newIdx = (currentIndex + 1) % sortedApplicants.length;
    setCurrentIndex(newIdx);
    setSelected(sortedApplicants[newIdx]);
  };

  const scoreColor = (score) =>
    score >= 80 ? "text-green-500"
    : score >= 60 ? "text-lime-500"
    : score >= 45 ? "text-yellow-500"
    : "text-red-500";

  // Interview-stage applicants (relocated from Profile). Owners/managers see all;
  // HR Staff see only the ones they personally handled.
  const canSeeAllInterviews = auth.role === "owner" || auth.role === "HRManager";
  const interviewApplicants = applicants
    .filter((ev) => ev.status === "interview_sent" && (canSeeAllInterviews || ev.action_made_by_user_id === auth.user_id))
    .filter((a) =>
      (a.applicant_name || "").toLowerCase().includes(search.toLowerCase()) ||
      (a.job_title || "").toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => new Date(a.interview_date || "9999") - new Date(b.interview_date || "9999"));

  return (
    <section className="px-4 pt-1 bg-[#0B2447] h-[calc(100vh-56px)] overflow-hidden flex flex-col">
      <div
        className="max-w-[1200px] w-full mx-auto bg-white rounded-3xl pt-3 px-10 pb-4 border-2 border-[#0B2447] flex-1 flex flex-col min-h-0 mb-4"
        style={{ boxShadow: "6px 6px 0px #0B2447" }}
      >
        <div className="flex items-center justify-between gap-4 mb-3 flex-wrap">
          <div className="flex items-center gap-2">
            <div
              className="flex items-center gap-1 rounded-full border-2 border-[#0B2447] p-1 h-[50px]"
              style={{ boxShadow: "3px 3px 0px #0B2447" }}
            >
              {[
                { key: "applicants", label: "Evaluated" },
                { key: "interview",  label: "For Interview", count: interviewApplicants.length },
              ].map((t) => (
                <button
                  key={t.key}
                  onClick={() => setView(t.key)}
                  className={`flex items-center gap-1.5 rounded-full px-4 h-full text-sm font-extrabold whitespace-nowrap border-none cursor-pointer transition-colors ${
                    view === t.key ? "bg-[#0B2447] text-white" : "bg-transparent text-[#0B2447] hover:bg-slate-100"
                  }`}
                >
                  {t.label}
                  {t.count > 0 && (
                    <span className={`rounded-full text-[0.65rem] font-black px-1.5 py-0.5 ${view === t.key ? "bg-white text-[#0B2447]" : "bg-[#0B2447] text-white"}`}>
                      {t.count}
                    </span>
                  )}
                </button>
              ))}
            </div>

            <div className="relative group">
              <button
                type="button"
                aria-label="How the H!RE Score works"
                className="w-8 h-8 flex items-center justify-center rounded-full border-2 border-[#0B2447] text-[#0B2447] bg-white cursor-help p-0"
                style={{ boxShadow: "2px 2px 0px #0B2447" }}
              >
                <InfoOutlinedIcon style={{ fontSize: 18 }} />
              </button>
              <div
                className="absolute left-0 top-10 z-40 w-[330px] bg-white rounded-xl p-4 text-left opacity-0 invisible group-hover:opacity-100 group-hover:visible group-focus-within:opacity-100 group-focus-within:visible transition-opacity"
                style={{ border: "2px solid #0B2447", boxShadow: "4px 4px 0px #0B2447" }}
              >
                <p className="font-extrabold text-[#0B2447] text-sm m-0 mb-1.5">How the H!RE Score works</p>
                <p className="text-xs text-slate-600 leading-relaxed m-0 mb-2">
                  H!RE uses a <span className="font-semibold">dual-model</span> approach: <span className="font-semibold">Sentence-BERT</span> measures
                  the semantic match between the resume and the job, and an <span className="font-semibold">LLM</span> then evaluates the fit against a
                  weighted rubric (skills &amp; domain match, role relevance, impact) to produce the final 0–100 score.
                </p>
                <div className="flex flex-col gap-1">
                  <span className="flex items-center gap-2 text-xs text-slate-600">
                    <span className="w-2.5 h-2.5 rounded-full bg-green-500 inline-block" /> <b>80–100</b> — Strong fit
                  </span>
                  <span className="flex items-center gap-2 text-xs text-slate-600">
                    <span className="w-2.5 h-2.5 rounded-full bg-lime-500 inline-block" /> <b>60–79</b> — Good fit, minor gaps
                  </span>
                  <span className="flex items-center gap-2 text-xs text-slate-600">
                    <span className="w-2.5 h-2.5 rounded-full bg-yellow-500 inline-block" /> <b>45–59</b> — Decent, evident gaps
                  </span>
                  <span className="flex items-center gap-2 text-xs text-slate-600">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" /> <b>0–44</b> — Weak fit
                  </span>
                </div>
              </div>
            </div>

          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {view === "applicants" && (
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="appearance-none border-2 border-[#0B2447] rounded-full pl-4 pr-10 py-2 text-sm font-semibold text-[#0B2447] bg-white outline-none cursor-pointer"
              >
                <option value="status">Sort: Status (default)</option>
                <option value="name_asc">Name (A–Z)</option>
                <option value="name_desc">Name (Z–A)</option>
                <option value="score_desc">H!RE Score (High → Low)</option>
                <option value="score_asc">H!RE Score (Low → High)</option>
                <option value="status_shortlisted">Shortlisted Only</option>
                <option value="status_pending">Pending Only</option>
                <option value="status_rejected">Rejected Only</option>
              </select>
              <KeyboardArrowDownIcon
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#0B2447]"
                style={{ fontSize: 20 }}
              />
            </div>
            )}

            <div className="flex items-center gap-2 border-2 border-[#0B2447] rounded-full px-4 py-2 w-[240px]">
              <input
                type="search"
                placeholder="Search by name"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="border-none outline-none w-full text-sm text-[#0B2447] bg-transparent placeholder-slate-400"
              />
              <SearchIcon style={{ fontSize: 20, color: "#0B2447" }} />
            </div>
          </div>
        </div>

        <div className="flex gap-6 items-stretch flex-1 min-h-0">
          {view === "applicants" && (
          <label className="border-[3px] border-dashed border-teal-400 rounded-2xl w-[170px] min-w-[170px] flex flex-col items-center justify-center gap-1 cursor-pointer hover:bg-teal-50 transition-colors px-4 py-8 flex-shrink-0">
            <input
              type="file"
              accept=".pdf,image/*"
              multiple
              className="hidden"
              onChange={handleFileChange}
              disabled={uploading}
            />
            <div className="w-16 h-16 rounded-full bg-teal-400 flex items-center justify-center shadow-[4px_4px_0px_#0f172a]">
              {uploading ? (
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <AddIcon style={{ fontSize: 32, color: "white" }} />
              )}
            </div>
            <p className="font-bold text-sm text-[#0f172a] m-0 text-center">
              {uploading ? "Analyzing..." : "Click to Upload"}
            </p>
            <p className="text-xs text-slate-500 m-0 text-center">
              {uploading
                ? `${uploadProgress.done}/${uploadProgress.total} done`
                : "upload one or more resumes"}
            </p>
          </label>
          )}

          <div className="flex-1 min-h-0 overflow-y-auto pr-1">
            {view === "interview" ? (
              interviewApplicants.length > 0 ? (
                <div className="flex flex-wrap gap-4 w-full content-start">
                  {interviewApplicants.map((applicant) => (
                    <div key={applicant.evaluation_id} className="flex flex-col gap-2 flex-[1_1_240px] max-w-[280px]">
                      <div className="flex items-center gap-1.5 text-[0.78rem] font-bold text-[#0B2447]">
                        <span>💼</span> <span className="truncate">{applicant.job_title || "Untitled Requirement"}</span>
                      </div>
                      <button
                        onClick={() => setSelectedInterview(applicant)}
                        className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center gap-4 cursor-pointer text-left transition-colors hover:bg-slate-50 w-full"
                      >
                        <div className="flex flex-col gap-2 flex-1 min-w-0">
                          <span className="bg-slate-100 border border-slate-300 rounded-full px-4 py-1 text-[0.82rem] font-semibold text-[#0f172a] self-start truncate max-w-full">
                            {applicant.applicant_name || "Unknown Applicant"}
                          </span>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="bg-slate-100 border border-slate-300 rounded-full px-3 py-1 text-[0.78rem] font-semibold text-[#0f172a]">
                              H!RE Score: <span className={`font-bold ${scoreColor(applicant.hire_score)}`}>{applicant.hire_score}%</span>
                            </span>
                            <span className="rounded-full px-3 py-1 text-[0.7rem] font-bold bg-blue-50 text-blue-600 border border-blue-200">
                              Interview Scheduled
                            </span>
                          </div>
                          {applicant.interview_date && (
                            <span className="text-[0.72rem] text-slate-500">📅 {fmtPHT(applicant.interview_date)}</span>
                          )}
                        </div>
                        <span className="text-slate-400 text-lg shrink-0">›</span>
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-400 text-sm">No applicants scheduled for interview yet.</p>
              )
            ) : loading ? (
              <div className="flex flex-col items-center justify-center gap-3 h-full">
                <div className="w-10 h-10 border-4 border-teal-400 border-t-transparent rounded-full animate-spin" />
                <p className="text-slate-500 text-sm">Loading evaluations...</p>
              </div>
            ) : filtered.length > 0 ? (
              <div className="flex flex-wrap gap-4 w-full content-start">
                {sortedApplicants.map((applicant) => (
                  <div
                    key={applicant.evaluation_id}
                    onClick={() => handleCardClick(applicant)}
                    className="bg-white rounded-2xl p-4 flex items-center gap-4 flex-[1_1_240px] max-w-[280px] cursor-pointer hover:shadow-lg transition-shadow"
                    style={cardBorderStyle(applicant.status)}
                  >
                    <div className="w-20 min-w-[80px] h-24 bg-slate-100 rounded-xl border-2 border-[#0f172a] overflow-hidden flex items-center justify-center">
                      <PersonIcon style={{ fontSize: 40, color: "#94a3b8" }} />
                    </div>
                    <div className="flex flex-col gap-2">
                      <span className="bg-slate-100 border border-slate-300 rounded-full px-3 py-1 text-xs font-semibold text-[#0f172a] truncate max-w-[140px]">
                        {applicant.applicant_name || "Unknown Applicant"}
                      </span>
                      <span className="bg-slate-100 border border-slate-300 rounded-full px-3 py-1 text-xs font-semibold text-[#0f172a]">
                        H!RE Score:{" "}
                        <span className={`font-bold ${scoreColor(applicant.hire_score)}`}>
                          {applicant.hire_score}%
                        </span>
                      </span>
                      <span className="bg-slate-100 border border-slate-300 rounded-full px-3 py-1 text-xs font-semibold text-[#0f172a] truncate max-w-[140px]">
                        {applicant.job_title}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center gap-4 text-center h-full">
                <div className="w-16 h-16 rounded-full bg-teal-400 flex items-center justify-center shadow-[4px_4px_0px_#0f172a]">
                  <GroupsIcon style={{ fontSize: 32, color: "white" }} />
                </div>
                <h2 className="text-xl font-extrabold text-[#0f172a] m-0">
                  No Applicants evaluated yet...
                </h2>
                <p className="text-slate-500 text-sm leading-relaxed m-0">
                  Upload a resume to start evaluating<br />
                  candidates with AI-powered insights.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {showReqPicker && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div
            className="bg-white rounded-2xl px-8 py-6 w-full max-w-md mx-4 max-h-[85vh] overflow-y-auto"
            style={{ border: "2px solid #0B2447", boxShadow: "6px 6px 0px #0B2447" }}
          >
            <h3 className="text-lg font-bold text-[#0B2447] mb-4">Select Job Requirement</h3>
            <p className="text-sm text-slate-500 mb-4">
              {pendingFiles.length > 1
                ? `Evaluating ${pendingFiles.length} resumes against:`
                : "Which job position is this resume for?"}
            </p>
            {requirements.length === 0 ? (
              <p className="text-sm text-red-500">
                No approved requirements found. Ask your manager to approve one first.
              </p>
            ) : (
              <div className="flex flex-col gap-2 mb-4 max-h-[240px] overflow-y-auto">
                <label
                  className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition ${
                    selectedReqId === "auto"
                      ? "border-teal-400 bg-teal-50"
                      : "border-slate-200 hover:border-teal-200"
                  }`}
                >
                  <input
                    type="radio"
                    name="requirement"
                    value="auto"
                    checked={selectedReqId === "auto"}
                    onChange={() => setSelectedReqId("auto")}
                    className="accent-teal-400"
                  />
                  <span className="text-sm font-bold text-[#0B2447]">✨ Auto Find Best Job Position</span>
                </label>
                {requirements.map((req) => (
                  <label
                    key={req.id}
                    className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition ${
                      selectedReqId === req.id
                        ? "border-teal-400 bg-teal-50"
                        : "border-slate-200 hover:border-teal-200"
                    }`}
                  >
                    <input
                      type="radio"
                      name="requirement"
                      value={req.id}
                      checked={selectedReqId === req.id}
                      onChange={() => setSelectedReqId(req.id)}
                      className="accent-teal-400"
                    />
                    <span className="text-sm font-semibold text-[#0f172a]">{req.job_title}</span>
                  </label>
                ))}
              </div>
            )}
            <div className="border-2 border-slate-200 rounded-xl p-3 mb-4">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={arEnabled}
                  onChange={(e) => {
                    setArEnabled(e.target.checked);
                    if (e.target.checked && !autoRejectInput) setAutoRejectInput("45");
                  }}
                  className="accent-teal-400 w-4 h-4"
                />
                <span className="text-sm font-bold text-[#0B2447]">Auto-reject low scores</span>
              </label>

              {arEnabled && (
                <div className="flex items-center gap-2 mt-3 ml-7">
                  <span className="text-xs font-semibold text-slate-600">Reject applicants scoring below</span>
                  <input
                    type="number" min="0" max="100"
                    value={autoRejectInput}
                    onChange={(e) => setAutoRejectInput(e.target.value)}
                    placeholder="45"
                    className="w-16 text-center text-sm font-bold text-[#0B2447] border-2 border-slate-200 rounded-lg px-2 py-1 outline-none focus:border-teal-400"
                  />
                  <span className="text-sm font-bold text-[#0B2447]">%</span>
                </div>
              )}

              <p className="text-[0.7rem] text-slate-400 leading-relaxed m-0 mt-2 ml-7">
                {arEnabled
                  ? "Resumes in this upload scoring below the threshold are rejected automatically. The applicant is emailed only after a 1-hour grace period, so you can still cancel."
                  : "Leave off to review every resume yourself."}
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleUpload}
                disabled={!selectedReqId || (arEnabled && !autoRejectInput)}
                className="flex-1 bg-teal-400 hover:bg-teal-500 text-white font-bold py-2.5 rounded-lg transition disabled:opacity-50"
              >
                {pendingFiles.length > 1 ? `Analyze ${pendingFiles.length} Resumes` : "Analyze Resume"}
              </button>
              <button
                onClick={() => { setShowReqPicker(false); setPendingFiles([]); }}
                className="flex-1 border-2 border-slate-300 text-slate-600 font-bold py-2.5 rounded-lg hover:bg-slate-50 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {selected && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() => setSelected(null)}
        >
          <div
            className="relative bg-white rounded-3xl w-full max-w-[480px] h-[600px] mx-4 flex flex-col"
            style={{ boxShadow: "6px 6px 0px #0B2447", border: "2px solid #0B2447" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex-1 overflow-y-auto p-6">
              <div className="flex items-center gap-4 mb-5">
                <div className="w-[100px] min-w-[100px] h-[110px] bg-slate-100 rounded-xl border-2 border-[#0f172a] overflow-hidden flex items-center justify-center">
                  <PersonIcon style={{ fontSize: 40, color: "#94a3b8" }} />
                </div>
                <div className="flex flex-col gap-2 flex-1">
                  <span className="bg-slate-100 border border-slate-300 rounded-full px-4 py-1.5 text-sm font-semibold text-[#0f172a] truncate">
                    {selected.applicant_name || "Unknown Applicant"}
                  </span>
                  <span className="bg-slate-100 border border-slate-300 rounded-full px-4 py-1.5 text-sm font-semibold text-[#0f172a]">
                    H!RE Score:{" "}
                    <span className={`font-bold ${scoreColor(selected.hire_score)}`}>
                      {selected.hire_score}%
                    </span>
                  </span>
                  <span className="bg-slate-100 border border-slate-300 rounded-full px-4 py-1.5 text-sm font-semibold text-[#0f172a]">
                    {selected.job_title}
                  </span>
                  {selected.applicant_phone && (
                    <span className="bg-slate-100 border border-slate-300 rounded-full px-4 py-1.5 text-sm font-semibold text-[#0f172a]">
                      📞 {selected.applicant_phone}
                    </span>
                  )}
                </div>
                <div className="self-start">
                  <button
                    onClick={() => viewResume(selected.file_path)}
                    className="mt-2 bg-teal-400 hover:bg-teal-500 text-white text-xs font-bold rounded-full px-3 py-1 border-none cursor-pointer block text-center"
                  >
                    View
                  </button>
                </div>
              </div>

              {feats.pros_cons && (
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div className="bg-teal-50 border border-teal-200 rounded-2xl p-4">
                    <p className="text-teal-600 font-bold text-sm mb-2">✓ Pros</p>
                    <ul className="list-none m-0 p-0">
                      {selected.pros.map((p, i) => (
                        <li key={i} className="text-slate-600 text-xs leading-relaxed">• {p}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
                    <p className="text-red-500 font-bold text-sm mb-2">✗ Cons</p>
                    <ul className="list-none m-0 p-0">
                      {selected.cons.map((c, i) => (
                        <li key={i} className="text-slate-600 text-xs leading-relaxed">• {c}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              <div className="bg-teal-50 border border-teal-200 rounded-2xl p-4">
                <p className="text-teal-600 font-bold text-sm mb-2">✦ AI Summary</p>
                <p className="text-slate-600 text-sm leading-relaxed m-0">{selected.summary}</p>
              </div>
            </div>

            <div className="border-t border-slate-200 p-4">
              {(() => {
                const s = selected.status;
                const removeBtn = (
                  <button onClick={() => handleRemove(selected.evaluation_id)} className="bg-red-500 hover:bg-red-600 text-white font-bold rounded-full py-2.5 text-sm border-none cursor-pointer transition-colors">🗑 Remove Resume</button>
                );
                if (s === "shortlisted") return (
                  <div className="grid grid-cols-2 gap-3">
                    {feats.interview ? (
                      <button onClick={() => setShowInterviewModal(true)} className="bg-[#0B2447] hover:bg-[#162553] text-white font-bold rounded-full py-2.5 text-sm border-none cursor-pointer transition-colors">📅 Send Interview</button>
                    ) : removeBtn}
                    <button onClick={() => handleStatusUpdate(selected.evaluation_id, "pending")} className="bg-slate-200 hover:bg-slate-300 text-[#0B2447] font-bold rounded-full py-2.5 text-sm border-none cursor-pointer transition-colors">Cancel Shortlist</button>
                  </div>
                );
                if (s === "rejected") return (
                  <div className="flex flex-col gap-2">
                    <p className="text-xs text-red-500 text-center m-0">This applicant will be permanently removed ~1 hour after rejection.</p>
                    <button onClick={() => handleStatusUpdate(selected.evaluation_id, "pending")} className="bg-amber-400 hover:bg-amber-500 text-[#0B2447] font-bold rounded-full py-2.5 text-sm border-none cursor-pointer transition-colors">↩ Cancel Rejection</button>
                  </div>
                );
                if (s === "interview_sent") return (
                  <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-center">
                    <p className="text-blue-600 font-bold text-sm m-0">✓ Interview Invitation Sent</p>
                    {selected.interview_date && <p className="text-slate-600 text-xs mt-1 m-0">Scheduled: {fmtPHT(selected.interview_date)}</p>}
                  </div>
                );
                return (
                  <div className="grid grid-cols-2 gap-3">
                    <button onClick={() => handleStatusUpdate(selected.evaluation_id, "shortlisted")} className="bg-green-500 hover:bg-green-600 text-white font-bold rounded-full py-2.5 text-sm border-none cursor-pointer transition-colors">✓ Shortlist</button>
                    {feats.reject ? (
                      <button onClick={() => handleStatusUpdate(selected.evaluation_id, "rejected")} className="bg-red-500 hover:bg-red-600 text-white font-bold rounded-full py-2.5 text-sm border-none cursor-pointer transition-colors">✗ Reject</button>
                    ) : removeBtn}
                  </div>
                );
              })()}
            </div>
          </div>

          {sortedApplicants.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); handlePrev(); }}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-[#0B2447] text-white flex items-center justify-center border-none cursor-pointer hover:bg-[#162553] transition-colors text-xl"
              >←</button>
              <button
                onClick={(e) => { e.stopPropagation(); handleNext(); }}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-[#0B2447] text-white flex items-center justify-center border-none cursor-pointer hover:bg-[#162553] transition-colors text-xl"
              >→</button>
            </>
          )}
        </div>
      )}

      {showInterviewModal && selected && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]" onClick={() => setShowInterviewModal(false)}>
          <div
            className="bg-white rounded-3xl w-full max-w-[460px] max-h-[85vh] overflow-y-auto p-6 mx-4"
            style={{ boxShadow: "6px 6px 0px #0B2447", border: "2px solid #0B2447" }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-[#0B2447] mb-1">Send Interview Invitation</h3>
            <p className="text-sm text-slate-500 mb-4">
              To:{" "}
              <span className="font-semibold text-[#0f172a]">
                {selected.applicant_email
                  ? selected.applicant_email
                  : "No email on file — invitation can't be sent"}
              </span>
            </p>

            <label className="block text-xs font-bold text-[#0B2447] mb-1">Interview Date & Time</label>
            <input type="datetime-local" value={interviewDate} min={phtNowLocal()} onChange={(e) => setInterviewDate(e.target.value)} className="w-full border-2 border-slate-200 rounded-lg px-3 py-2 text-sm mb-4 outline-none focus:border-teal-400" />

            <label className="block text-xs font-bold text-[#0B2447] mb-1">Meeting Type</label>
            <div className="grid grid-cols-2 gap-2 mb-4">
              {["Online Meeting", "Face to Face"].map((t) => (
                <button key={t} onClick={() => setMeetingType(t)} className={`py-2 rounded-lg text-sm font-bold border-2 transition ${meetingType === t ? "border-teal-400 bg-teal-50 text-[#0B2447]" : "border-slate-200 text-slate-500 hover:border-teal-200"}`}>{t}</button>
              ))}
            </div>

            <label className="block text-xs font-bold text-[#0B2447] mb-1">{meetingType === "Online Meeting" ? "Meeting Link" : "Location / Address"}</label>
            <div className="flex gap-2 mb-4">
              <input type="text" value={meetingLink} onChange={(e) => setMeetingLink(e.target.value)} placeholder={meetingType === "Online Meeting" ? "Paste a link, or click Create Link" : "Office address"} className="flex-1 border-2 border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-teal-400" />
              {meetingType === "Online Meeting" && (
                <button type="button" onClick={createMeetLink} disabled={creatingLink} className="shrink-0 bg-teal-400 hover:bg-teal-500 text-white font-bold rounded-lg px-3 text-xs border-none cursor-pointer whitespace-nowrap disabled:opacity-60">
                  {creatingLink ? "Creating..." : "Create Link"}
                </button>
              )}
            </div>

            <label className="block text-xs font-bold text-[#0B2447] mb-1">Message (optional)</label>
            <textarea value={interviewMessage} onChange={(e) => setInterviewMessage(e.target.value)} rows={3} placeholder="We look forward to meeting you..." className="w-full border-2 border-slate-200 rounded-lg px-3 py-2 text-sm mb-4 outline-none focus:border-teal-400 resize-none" />

            <div className="flex gap-3">
              <button
                onClick={handleSendInterview}
                disabled={!selected.applicant_email}
                className="flex-1 bg-teal-400 hover:bg-teal-500 text-white font-bold py-2.5 rounded-lg transition disabled:opacity-50"
              >
                Send Invitation
              </button>
              <button onClick={() => setShowInterviewModal(false)} className="flex-1 border-2 border-slate-300 text-slate-600 font-bold py-2.5 rounded-lg hover:bg-slate-50 transition">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {selectedInterview && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ backgroundColor: "rgba(0,0,0,0.6)" }}
          onClick={() => setSelectedInterview(null)}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-lg flex flex-col overflow-hidden"
            style={{ maxHeight: "85vh", border: "2px solid #1a1a2e", boxShadow: "6px 6px 0px #000000" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3 px-6 pt-5 pb-4 border-b border-slate-100 shrink-0">
              <div className="w-11 h-11 rounded-xl bg-[#0B2447] text-white flex items-center justify-center font-extrabold shrink-0">
                {(selectedInterview.applicant_name || "A").slice(0, 2).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-extrabold text-[#0B2447] text-base m-0 truncate">{selectedInterview.applicant_name || "Unknown Applicant"}</h3>
                <p className="text-xs text-slate-400 m-0 truncate">💼 {selectedInterview.job_title || "Untitled Requirement"}</p>
              </div>
              <span className="shrink-0 rounded-full px-2.5 py-1 text-[0.68rem] font-bold bg-blue-50 text-blue-600 border border-blue-200 whitespace-nowrap">Interview Scheduled</span>
              <button
                onClick={() => setSelectedInterview(null)}
                className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-200 hover:bg-slate-100 transition bg-transparent cursor-pointer shrink-0"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-4 text-sm">
              <div className="rounded-2xl border border-blue-100 bg-blue-50/60 p-4 flex flex-col gap-2">
                {selectedInterview.interview_date && (
                  <div className="flex items-center gap-2 text-blue-800">
                    <span className="text-base">📅</span>
                    <span className="font-semibold">{fmtPHT(selectedInterview.interview_date)}</span>
                  </div>
                )}
                {selectedInterview.interview_location && (
                  <div className="flex items-start gap-2 text-blue-800">
                    <span className="text-base">📍</span>
                    <span className="break-all">{selectedInterview.interview_location}</span>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 border border-slate-200 px-3 py-1.5 font-semibold text-[#0f172a]">
                  H!RE Score <span className={`font-extrabold ${scoreColor(selectedInterview.hire_score)}`}>{selectedInterview.hire_score}%</span>
                </span>
                {selectedInterview.applicant_email && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 border border-slate-200 px-3 py-1.5 text-slate-600 max-w-full truncate">✉️ {selectedInterview.applicant_email}</span>
                )}
                {selectedInterview.applicant_phone && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 border border-slate-200 px-3 py-1.5 text-slate-600">📞 {selectedInterview.applicant_phone}</span>
                )}
              </div>

              {selectedInterview.summary && (
                <div className="flex flex-col gap-1">
                  <p className="text-[0.65rem] font-bold uppercase tracking-wide text-slate-400 m-0">AI Summary</p>
                  <p className="text-slate-600 leading-relaxed m-0">{selectedInterview.summary}</p>
                </div>
              )}

              {(selectedInterview.pros?.length > 0 || selectedInterview.cons?.length > 0) && (
                <div className="grid grid-cols-2 gap-3 max-[480px]:grid-cols-1">
                  {selectedInterview.pros?.length > 0 && (
                    <div className="rounded-2xl border border-green-100 bg-green-50/60 p-3">
                      <p className="text-[0.7rem] font-bold uppercase tracking-wide text-green-700 m-0 mb-1.5">Strengths</p>
                      <ul className="list-none m-0 p-0 flex flex-col gap-1.5">
                        {selectedInterview.pros.map((p, i) => <li key={i} className="flex gap-1.5 text-slate-600 leading-snug"><span className="text-green-500 font-bold">✓</span>{p}</li>)}
                      </ul>
                    </div>
                  )}
                  {selectedInterview.cons?.length > 0 && (
                    <div className="rounded-2xl border border-red-100 bg-red-50/60 p-3">
                      <p className="text-[0.7rem] font-bold uppercase tracking-wide text-red-600 m-0 mb-1.5">Weaknesses</p>
                      <ul className="list-none m-0 p-0 flex flex-col gap-1.5">
                        {selectedInterview.cons.map((c, i) => <li key={i} className="flex gap-1.5 text-slate-600 leading-snug"><span className="text-red-400 font-bold">✕</span>{c}</li>)}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {(selectedInterview.job_description || selectedInterview.job_qualifications) && (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 flex flex-col gap-3">
                  <p className="text-[0.65rem] font-bold uppercase tracking-wide text-slate-400 m-0">Position details</p>
                  {selectedInterview.job_description && (
                    <div>
                      <p className="text-[0.72rem] font-bold text-[#0B2447] m-0 mb-0.5">Description</p>
                      <p className="text-slate-600 whitespace-pre-line break-words m-0 leading-relaxed">{selectedInterview.job_description}</p>
                    </div>
                  )}
                  {selectedInterview.job_qualifications && (
                    <div>
                      <p className="text-[0.72rem] font-bold text-[#0B2447] m-0 mb-0.5">Qualifications</p>
                      <p className="text-slate-600 whitespace-pre-line break-words m-0 leading-relaxed">{selectedInterview.job_qualifications}</p>
                    </div>
                  )}
                </div>
              )}

              <p className="text-slate-400 text-xs m-0">Handled by {selectedInterview.action_made_by || "—"}</p>
            </div>
            <div className="px-6 py-4 border-t border-slate-200 shrink-0 flex gap-3">
              <button
                onClick={handleMarkHired}
                className="flex-1 bg-teal-500 hover:bg-teal-600 text-white font-bold rounded-full py-2.5 text-sm border-none cursor-pointer"
              >
                ✓ Mark as Hired
              </button>
              <button
                onClick={() => setShowRemoveInterview(true)}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold rounded-full py-2.5 text-sm border-none cursor-pointer"
              >
                🗑 Remove Interview
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedInterview && showRemoveInterview && (
        <RemoveInterviewModal
          applicantName={selectedInterview.applicant_name || "this applicant"}
          onCancel={() => setShowRemoveInterview(false)}
          onConfirm={handleRemoveInterview}
        />
      )}
    </section>
  );
}
