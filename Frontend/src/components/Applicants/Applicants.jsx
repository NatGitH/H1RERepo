import { useState, useEffect } from "react";
import AddIcon from "@mui/icons-material/Add";
import SearchIcon from "@mui/icons-material/Search";
import GroupsIcon from "@mui/icons-material/Groups";
import PersonIcon from "@mui/icons-material/Person";
import { useAuth } from "../../.Context/AuthContext";
import { API_BASE_URL } from "../../api";

export default function Applicants() {
  const { auth } = useAuth();
  const [search, setSearch] = useState("");
  const [applicants, setApplicants] = useState([]);
  const [selected, setSelected] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [requirements, setRequirements] = useState([]);
  const [selectedReqId, setSelectedReqId] = useState("");
  const [showReqPicker, setShowReqPicker] = useState(false);
  const [pendingFile, setPendingFile] = useState(null);

  // Fetch evaluations
  const fetchEvaluations = () => {
    setLoading(true);
    fetch(`${API_BASE_URL}/api/evaluations/`, {
      headers: { Authorization: `Bearer ${auth.token}` },
    })
      .then((res) => res.json())
      .then((data) => setApplicants(Array.isArray(data) ? data : []))
      .catch(() => setApplicants([]))
      .finally(() => setLoading(false));
  };

  // Fetch approved requirements for the picker
  const fetchRequirements = () => {
    fetch(`${API_BASE_URL}/api/requirements/`, {
      headers: { Authorization: `Bearer ${auth.token}` },
    })
      .then((res) => res.json())
      .then((data) =>
        setRequirements(
          Array.isArray(data)
            ? data.filter((r) => r.status === "approved")
            : []
        )
      )
      .catch(() => setRequirements([]));
  };

  useEffect(() => {
    fetchEvaluations();
    fetchRequirements();
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setPendingFile(file);
    setShowReqPicker(true);
  };

  const handleUpload = async () => {
    if (!pendingFile || !selectedReqId) {
      alert("Please select a job requirement.");
      return;
    }
    setUploading(true);
    setShowReqPicker(false);

    const formData = new FormData();
    formData.append("resume", pendingFile);
    formData.append("requirement_id", selectedReqId);

    try {
      const res = await fetch(`${API_BASE_URL}/api/evaluate/`, {
        method: "POST",
        headers: { Authorization: `Bearer ${auth.token}` },
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Evaluation failed");
      fetchEvaluations();
    } catch (err) {
      alert(err.message);
    } finally {
      setUploading(false);
      setPendingFile(null);
      setSelectedReqId("");
    }
  };

  const handleStatusUpdate = async (evaluationId, status) => {
    try {
      await fetch(
        `${API_BASE_URL}/api/evaluations/${evaluationId}/status/`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${auth.token}`,
          },
          body: JSON.stringify({ status }),
        }
      );
      setApplicants((prev) =>
        prev.map((a) =>
          a.evaluation_id === evaluationId ? { ...a, status } : a
        )
      );
      setSelected(null);
    } catch (err) {
      alert("Failed to update status");
    }
  };

  const filtered = applicants.filter((a) =>
    (a.file_name || "").toLowerCase().includes(search.toLowerCase()) ||
    (a.job_title || "").toLowerCase().includes(search.toLowerCase())
  );

  const handleCardClick = (applicant) => {
    const idx = filtered.findIndex(
      (a) => a.evaluation_id === applicant.evaluation_id
    );
    setCurrentIndex(idx);
    setSelected(applicant);
  };

  const handlePrev = () => {
    const newIdx = (currentIndex - 1 + filtered.length) % filtered.length;
    setCurrentIndex(newIdx);
    setSelected(filtered[newIdx]);
  };

  const handleNext = () => {
    const newIdx = (currentIndex + 1) % filtered.length;
    setCurrentIndex(newIdx);
    setSelected(filtered[newIdx]);
  };

  const scoreColor = (score) =>
    score >= 80 ? "text-emerald-600" : score >= 60 ? "text-orange-500" : "text-red-500";

  return (
    <section className="px-4 pt-1 bg-[#0B2447] min-h-screen">
      <div
        className="max-w-[1200px] mx-auto bg-white rounded-3xl pt-4 px-10 pb-6 border-2 border-[#0B2447]"
        style={{ boxShadow: "6px 6px 0px #0B2447" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-4 mb-4 flex-wrap">
          <div
            className="font-extrabold text-[#0B2447] rounded-full border-2 border-[#0B2447] text-lg tracking-wide w-[260px] h-[50px] flex items-center justify-center whitespace-nowrap"
            style={{ boxShadow: "3px 3px 0px #0B2447" }}
          >
            Evaluated Applicants
          </div>
          <div className="flex items-center gap-2 border-2 border-[#0B2447] rounded-full px-4 py-2 w-[260px]">
            <input
              type="search"
              placeholder="Search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="border-none outline-none w-full text-sm text-[#0B2447] bg-transparent placeholder-slate-400"
            />
            <SearchIcon style={{ fontSize: 20, color: "#0B2447" }} />
          </div>
        </div>

        <div className="flex gap-6 items-stretch">
          {/* Upload Zone */}
          <label className="border-[3px] border-dashed border-teal-400 rounded-2xl w-[170px] min-w-[170px] flex flex-col items-center justify-center gap-1 cursor-pointer hover:bg-teal-50 transition-colors px-4 py-8 min-h-[400px]">
            <input
              type="file"
              accept=".pdf,image/*"
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
              {uploading ? "Analyzing..." : "Click or drag"}
            </p>
            <p className="text-xs text-slate-500 m-0 text-center">
              {uploading ? "Please wait" : "to upload resume"}
            </p>
          </label>

          {/* Applicant Cards */}
          <div className="flex-1 flex items-center justify-center min-h-[400px]">
            {loading ? (
              <div className="flex flex-col items-center gap-3">
                <div className="w-10 h-10 border-4 border-teal-400 border-t-transparent rounded-full animate-spin" />
                <p className="text-slate-500 text-sm">Loading evaluations...</p>
              </div>
            ) : filtered.length > 0 ? (
              <div className="flex flex-wrap gap-4 w-full">
                {filtered.map((applicant) => (
                  <div
                    key={applicant.evaluation_id}
                    onClick={() => handleCardClick(applicant)}
                    className="bg-white rounded-2xl border-2 border-[#0f172a] p-4 flex items-center gap-4 flex-[1_1_240px] max-w-[280px] cursor-pointer hover:shadow-lg transition-shadow"
                    style={{ boxShadow: "3px 3px 0px #0f172a" }}
                  >
                    <div className="w-20 min-w-[80px] h-24 bg-slate-100 rounded-xl border-2 border-[#0f172a] overflow-hidden flex items-center justify-center">
                      <PersonIcon style={{ fontSize: 40, color: "#94a3b8" }} />
                    </div>
                    <div className="flex flex-col gap-2">
                      <span className="bg-slate-100 rounded-full px-3 py-1 text-xs font-semibold text-[#0f172a] truncate max-w-[140px]">
                        {applicant.applicant_name || "Unknown Applicant"}
                      </span>
                      <span className="bg-slate-100 rounded-full px-3 py-1 text-xs font-semibold text-[#0f172a]">
                        H!RE Score:{" "}
                        <span className={`font-bold ${scoreColor(applicant.hire_score)}`}>
                          {applicant.hire_score}%
                        </span>
                      </span>
                      <span className="bg-slate-100 rounded-full px-3 py-1 text-xs font-semibold text-[#0f172a] truncate max-w-[140px]">
                        {applicant.job_title}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center gap-4 text-center">
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
            className="bg-white rounded-2xl px-8 py-6 w-full max-w-md mx-4"
            style={{ border: "2px solid #0B2447", boxShadow: "6px 6px 0px #0B2447" }}
          >
            <h3 className="text-lg font-bold text-[#0B2447] mb-4">
              Select Job Requirement
            </h3>
            <p className="text-sm text-slate-500 mb-4">
              Which job position is this resume for?
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
                    <span className="text-sm font-semibold text-[#0f172a]">
                      {req.job_title}
                    </span>
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
                Analyze Resume
              </button>
              <button
                onClick={() => { setShowReqPicker(false); setPendingFile(null); }}
                className="flex-1 border-2 border-slate-300 text-slate-600 font-bold py-2.5 rounded-lg hover:bg-slate-50 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Applicant Detail Modal */}
      {selected && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() => setSelected(null)}
        >
          <div
            className="relative bg-white rounded-3xl p-6 w-full max-w-[480px] mx-4"
            style={{ boxShadow: "6px 6px 0px #0B2447", border: "2px solid #0B2447" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-4 mb-5">
              <div className="w-[100px] min-w-[100px] h-[110px] bg-slate-100 rounded-xl border-2 border-[#0f172a] overflow-hidden flex items-center justify-center">
                <PersonIcon style={{ fontSize: 40, color: "#94a3b8" }} />
              </div>
              <div className="flex flex-col gap-2 flex-1">
                <span className="bg-slate-100 rounded-full px-4 py-1.5 text-sm font-semibold text-[#0f172a] truncate">
                  {selected.applicant_name || "Unknown Applicant"}
                </span>
                <span className="bg-slate-100 rounded-full px-4 py-1.5 text-sm font-semibold text-[#0f172a]">
                  H!RE Score:{" "}
                  <span className={`font-bold ${scoreColor(selected.hire_score)}`}>
                    {selected.hire_score}%
                  </span>
                </span>
                <span className="bg-slate-100 rounded-full px-4 py-1.5 text-sm font-semibold text-[#0f172a]">
                  {selected.job_title}
                </span>
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

            <div className="bg-teal-50 border border-teal-200 rounded-2xl p-4 mb-5">
              <p className="text-teal-600 font-bold text-sm mb-2">✦ AI Summary</p>
              <p className="text-slate-600 text-sm leading-relaxed m-0">{selected.summary}</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handleStatusUpdate(selected.evaluation_id, "shortlisted")}
                className="bg-green-500 hover:bg-green-600 text-white font-bold rounded-full py-2.5 text-sm border-none cursor-pointer transition-colors"
              >
                ✓ Shortlist
              </button>
              <button
                onClick={() => handleStatusUpdate(selected.evaluation_id, "rejected")}
                className="bg-red-500 hover:bg-red-600 text-white font-bold rounded-full py-2.5 text-sm border-none cursor-pointer transition-colors"
              >
                ✗ Reject
              </button>
            </div>
          </div>

          {filtered.length > 1 && (
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
    </section>
  );
}