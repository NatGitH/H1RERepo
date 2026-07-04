import { useState, useEffect } from "react";
import AddIcon from "@mui/icons-material/Add";
import SearchIcon from "@mui/icons-material/Search";
import GroupsIcon from "@mui/icons-material/Groups";
import PersonIcon from "@mui/icons-material/Person";
import { useAuth } from "../../.Context/AuthContext";
import { apiFetch, getErrorMessage } from "../../api";

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
  const [pendingFiles, setPendingFiles] = useState([]);   // now an array (multi-upload)
  const [showInterviewModal, setShowInterviewModal] = useState(false);
  const [interviewDate, setInterviewDate] = useState("");
  const [meetingType, setMeetingType] = useState("Zoom Meeting");
  const [meetingLink, setMeetingLink] = useState("");
  const [interviewMessage, setInterviewMessage] = useState("");
  const [sortBy, setSortBy] = useState("status"); // status | name_asc | name_desc | score_desc | score_asc

  // Plan-based feature flags (free tier: no pros/cons, no interview/reject).
  const feats = (() => {
    const M = {
      free:       { interview: false, reject: false, pros_cons: false },
      standard:   { interview: true,  reject: true,  pros_cons: true },
      enterprise: { interview: true,  reject: true,  pros_cons: true },
    };
    return M[(auth.subscription_plan || "free").toLowerCase()] || M.free;
  })();

  // Fetch evaluations
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

  // Fetch approved requirements for the picker
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

  useEffect(() => {
    fetchEvaluations();
    fetchRequirements();
  }, []);

  // Accept multiple files at once
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setPendingFiles(files);
    setShowReqPicker(true);
    e.target.value = ""; // allow re-selecting the same files later
  };

  // Upload every selected file one-by-one against the chosen requirement
  const handleUpload = async () => {
    if (pendingFiles.length === 0 || !selectedReqId) {
      alert("Please select a job requirement.");
      return;
    }
    setUploading(true);
    setShowReqPicker(false);
    setUploadProgress({ done: 0, total: pendingFiles.length });

    let failures = 0;
    let lastError = "";
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
        failures++;
        lastError = getErrorMessage(err, "");
      }
      setUploadProgress({ done: i + 1, total: pendingFiles.length });
    }

    setUploading(false);
    setPendingFiles([]);
    setSelectedReqId("");
    setUploadProgress({ done: 0, total: 0 });
    fetchEvaluations();
    // Surface the reason (e.g. a plan resume-limit message) rather than a bare count.
    if (failures > 0)
      alert(`${failures} of ${pendingFiles.length} resume(s) failed to evaluate.` + (lastError ? `\n\n${lastError}` : ""));
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
      alert(getErrorMessage(err, "Failed to update status"));
    }
  };

  // Free tier "Remove Resume" — permanently deletes the applicant (it has no
  // reject-with-email). Available to any plan.
  const handleRemove = async (evaluationId) => {
    if (!window.confirm("Remove this applicant permanently? This cannot be undone.")) return;
    try {
      await apiFetch(`/api/evaluations/${evaluationId}/remove/`, { method: "POST", token: auth.token });
      setApplicants((prev) => prev.filter((a) => a.evaluation_id !== evaluationId));
      setSelected(null);
    } catch (err) {
      alert(getErrorMessage(err, "Failed to remove applicant"));
    }
  };

  const handleSendInterview = () => {
    if (!interviewDate) return alert("Please choose an interview date and time.");
    if (!meetingLink.trim())
      return alert(meetingType === "Zoom Meeting" ? "Please paste the Zoom link." : "Please enter the location.");
    handleStatusUpdate(selected.evaluation_id, "interview_sent", {
      interview_date: new Date(interviewDate).toISOString(),
      meeting_type: meetingType,
      meeting_link: meetingLink.trim(),
      message: interviewMessage.trim(),
    });
    fetchEvaluations(); // pull the saved interview_date back
    setShowInterviewModal(false);
    setInterviewDate(""); setMeetingLink(""); setInterviewMessage(""); setMeetingType("Zoom Meeting");
  };

  // Search by applicant NAME (and still allow job title). Interview-sent
  // applicants leave this list once the invite is sent (they live in the
  // Profile "For Interview" panel) — same idea as rejected ones disappearing.
  const filtered = applicants.filter((a) =>
    a.status !== "interview_sent" &&
    ((a.applicant_name || "").toLowerCase().includes(search.toLowerCase()) ||
     (a.job_title || "").toLowerCase().includes(search.toLowerCase()))
  );

  // status priority: blue (interview_sent), green (shortlisted), black (pending), red (rejected)
  const statusRank = (s) => ({ interview_sent: 0, shortlisted: 1, pending: 2, rejected: 3 }[s] ?? 2);

  const sortedApplicants = [...filtered].sort((a, b) => {
    if (sortBy === "name_asc")
      return (a.applicant_name || "").localeCompare(b.applicant_name || "");
    if (sortBy === "name_desc")
      return (b.applicant_name || "").localeCompare(a.applicant_name || "");
    if (sortBy === "score_desc") return (b.hire_score || 0) - (a.hire_score || 0);
    if (sortBy === "score_asc") return (a.hire_score || 0) - (b.hire_score || 0);
    // default: keep the blue/green/black/red grouping
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
    score >= 80 ? "text-emerald-600" : score >= 60 ? "text-orange-500" : "text-red-500";

  return (
    <section className="px-4 pt-1 bg-[#0B2447] h-[calc(100vh-56px)] overflow-hidden flex flex-col">
      <div
        className="max-w-[1200px] w-full mx-auto bg-white rounded-3xl pt-3 px-10 pb-4 border-2 border-[#0B2447] flex-1 flex flex-col min-h-0 mb-4"
        style={{ boxShadow: "6px 6px 0px #0B2447" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-4 mb-3 flex-wrap">
          <div
            className="font-extrabold text-[#0B2447] rounded-full border-2 border-[#0B2447] text-lg tracking-wide w-[260px] h-[50px] flex items-center justify-center whitespace-nowrap"
            style={{ boxShadow: "3px 3px 0px #0B2447" }}
          >
            Evaluated Applicants
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Sort / Filter dropdown */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="border-2 border-[#0B2447] rounded-full px-4 py-2 text-sm font-semibold text-[#0B2447] bg-white outline-none cursor-pointer"
            >
              <option value="status">Sort: Status (default)</option>
              <option value="name_asc">Name (A–Z)</option>
              <option value="name_desc">Name (Z–A)</option>
              <option value="score_desc">H!RE Score (High → Low)</option>
              <option value="score_asc">H!RE Score (Low → High)</option>
            </select>

            {/* Search */}
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
          {/* Upload Zone (multiple) */}
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

          {/* Applicant Cards */}
          <div className="flex-1 min-h-0 overflow-y-auto pr-1">
            {loading ? (
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
                      {applicant.applicant_phone && (
                        <span className="bg-slate-100 border border-slate-300 rounded-full px-3 py-1 text-xs font-semibold text-[#0f172a] truncate max-w-[140px]">
                          📞 {applicant.applicant_phone}
                        </span>
                      )}
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

      {/* Requirement Picker Modal */}
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
              <div className="flex flex-col gap-2 mb-4 max-h-[200px] overflow-y-auto">
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
            <div className="flex gap-3">
              <button
                onClick={handleUpload}
                disabled={!selectedReqId}
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

      {/* Applicant Detail Modal (fixed size, scrollable) */}
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
            {/* scrollable content */}
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
                  <a
                    href={`https://${import.meta.env.VITE_SUPABASE_URL?.replace("https://", "")}/storage/v1/object/public/${selected.file_path}`}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 bg-teal-400 text-white text-xs font-bold rounded-full px-3 py-1 border-none cursor-pointer block text-center"
                  >
                    View
                  </a>
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

            {/* pinned action footer */}
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
                    {selected.interview_date && <p className="text-slate-600 text-xs mt-1 m-0">Scheduled: {new Date(selected.interview_date).toLocaleString()}</p>}
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

      {/* Interview Modal (fixed size, scrollable) */}
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
            <input type="datetime-local" value={interviewDate} onChange={(e) => setInterviewDate(e.target.value)} className="w-full border-2 border-slate-200 rounded-lg px-3 py-2 text-sm mb-4 outline-none focus:border-teal-400" />

            <label className="block text-xs font-bold text-[#0B2447] mb-1">Meeting Type</label>
            <div className="grid grid-cols-2 gap-2 mb-4">
              {["Zoom Meeting", "Face to Face"].map((t) => (
                <button key={t} onClick={() => setMeetingType(t)} className={`py-2 rounded-lg text-sm font-bold border-2 transition ${meetingType === t ? "border-teal-400 bg-teal-50 text-[#0B2447]" : "border-slate-200 text-slate-500 hover:border-teal-200"}`}>{t}</button>
              ))}
            </div>

            <label className="block text-xs font-bold text-[#0B2447] mb-1">{meetingType === "Zoom Meeting" ? "Zoom Link" : "Location / Address"}</label>
            <input type="text" value={meetingLink} onChange={(e) => setMeetingLink(e.target.value)} placeholder={meetingType === "Zoom Meeting" ? "https://zoom.us/j/..." : "Office address"} className="w-full border-2 border-slate-200 rounded-lg px-3 py-2 text-sm mb-4 outline-none focus:border-teal-400" />

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
    </section>
  );
}
