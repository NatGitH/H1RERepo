import { useState, useEffect } from "react";
import SearchIcon from "@mui/icons-material/Search";
import { useAuth } from "../../.Context/AuthContext";

export default function Requirements() {
  const { auth } = useAuth();
  const role = auth.role;

  const [requirements, setRequirements] = useState([]);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [newReq, setNewReq] = useState({
    job_title: "",
    description: "",
    qualifications: "",
  });

  useEffect(() => {
    fetch("/api/requirements/", {
      headers: { Authorization: `Bearer ${auth.token}` },
    })
      .then((res) => res.json())
      .then((data) => setRequirements(data))
      .catch(() => setRequirements([]));
  }, []);

  const handleCreate = () => {
    if (!newReq.job_title || !newReq.description || !newReq.qualifications) return;
    fetch("/api/requirements/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${auth.token}`,
      },
      body: JSON.stringify(newReq),
    })
      .then((res) => res.json())
      .then((created) => {
        setRequirements((prev) => [...prev, created]);
        setNewReq({ job_title: "", description: "", qualifications: "" });
        setShowForm(false);
      })
      .catch(console.error);
  };

  const handleStatus = (id, status) => {
    fetch(`/api/requirements/${id}/`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${auth.token}`,
      },
      body: JSON.stringify({ status }),
    })
      .then((res) => res.json())
      .then((updated) =>
        setRequirements((prev) =>
          prev.map((r) => (r.id === updated.id ? { ...r, status: updated.status } : r))
        )
      )
      .catch(console.error);
  };

  const pending = requirements.filter(
    (r) =>
      r.status === "pending" &&
      r.job_title?.toLowerCase().includes(search.toLowerCase())
  );

  const ReqForm = ({ onSave, onCancel, submitLabel = "Submit" }) => (
    <div className="bg-white border border-slate-200 rounded-[24px] px-6 py-5 flex flex-col gap-4 shadow-[0_20px_40px_rgba(15,23,42,0.08)] w-full">
      <input
        placeholder="Job Title (e.g. Software Tester)"
        value={newReq.job_title}
        onChange={(e) => setNewReq({ ...newReq, job_title: e.target.value })}
        className="font-bold text-[#0f172a] text-base outline-none border-b border-slate-200 pb-1 w-full bg-transparent"
      />
      <textarea
        placeholder="Description..."
        value={newReq.description}
        onChange={(e) => setNewReq({ ...newReq, description: e.target.value })}
        className="text-slate-600 leading-relaxed outline-none w-full min-h-[80px] bg-transparent resize-none border-b border-slate-200 pb-1"
      />
      <textarea
        placeholder="Qualifications..."
        value={newReq.qualifications}
        onChange={(e) => setNewReq({ ...newReq, qualifications: e.target.value })}
        className="text-slate-600 leading-relaxed outline-none w-full min-h-[80px] bg-transparent resize-none"
      />
      {role === "HRStaff" && (
        <p className="text-xs text-slate-400">
          This will be submitted for manager review.
        </p>
      )}
      <div className="flex gap-3">
        <button
          onClick={onSave}
          className="px-4 py-1.5 rounded-full font-bold text-xs text-white bg-green-600 border-none cursor-pointer"
        >
          {submitLabel}
        </button>
        <button
          onClick={onCancel}
          className="px-4 py-1.5 rounded-full font-bold text-xs text-white bg-red-600 border-none cursor-pointer"
        >
          Cancel
        </button>
      </div>
    </div>
  );

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
            Requirements
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

        {/* ── HRStaff View ── */}
        {role === "HRStaff" && (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            {!showForm ? (
              <>
                <span className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-teal-300 text-white shadow-lg">
                  <svg width="32" height="32" fill="none" viewBox="0 0 24 24">
                    <path
                      d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z"
                      stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                    />
                    <polyline points="14,2 14,8 20,8" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <line x1="16" y1="13" x2="8" y2="13" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                    <line x1="16" y1="17" x2="8" y2="17" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </span>
                <h2 className="text-xl font-extrabold text-[#0f172a]">
                  No Job Requirements added yet...
                </h2>
                <p className="text-slate-500 text-sm text-center max-w-xs">
                  Define the skills and criteria you're looking for, and let AI match the right candidates.
                </p>
                <button
                  onClick={() => setShowForm(true)}
                  className="flex items-center gap-2 bg-teal-400 hover:bg-teal-500 text-white font-bold rounded-full px-6 py-2.5 text-sm transition-colors"
                >
                  + Create New Requirement
                </button>
              </>
            ) : (
              <div className="w-full max-w-md">
                <ReqForm
                  onSave={handleCreate}
                  onCancel={() => setShowForm(false)}
                  submitLabel="Submit"
                />
              </div>
            )}
          </div>
        )}

        {/* ── HRManager View ── */}
        {role === "HRManager" && (
          <div className="grid grid-cols-2 gap-7 max-[850px]:grid-cols-1">
            {/* Pending Panel */}
            <div className="bg-[#fde8c0] rounded-[24px] p-6 min-h-[420px]">
              <h2 className="text-[1.3rem] font-extrabold text-[#0f172a] mb-5">
                Pending Requirements
              </h2>
              {pending.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-3 py-12">
                  <span className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-teal-300 text-white">
                    <svg width="22" height="22" fill="none" viewBox="0 0 24 24">
                      <path
                        d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z"
                        stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                  <p className="font-bold text-[#78350f]">No Pending Requirements</p>
                  <p className="text-sm text-[#92400e] text-center">
                    All caught up! Nothing waiting for review.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {pending.map((req) => (
                    <div
                      key={req.id}
                      className="bg-white border border-slate-200 rounded-[24px] px-6 py-5 flex flex-col gap-3 shadow-[0_20px_40px_rgba(15,23,42,0.08)]"
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-[#0f172a] text-base">{req.job_title}</span>
                        <span className="text-xs text-slate-400">{req.date_created}</span>
                      </div>
                      <p className="text-slate-600 text-sm leading-relaxed m-0">{req.description}</p>
                      <p className="text-slate-500 text-sm leading-relaxed m-0">{req.qualifications}</p>
                      <div className="flex gap-3">
                        <button
                          onClick={() => handleStatus(req.id, "approved")}
                          className="px-4 py-1.5 rounded-full font-bold text-xs text-white bg-green-600 cursor-pointer border-none"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleStatus(req.id, "rejected")}
                          className="px-4 py-1.5 rounded-full font-bold text-xs text-white bg-red-600 cursor-pointer border-none"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Create New Card */}
            <div>
              {!showForm ? (
                <div
                  onClick={() => setShowForm(true)}
                  className="border-[3px] border-dashed border-teal-400 rounded-2xl w-[170px] min-w-[170px] flex flex-col items-center justify-center gap-1 cursor-pointer hover:bg-teal-50 transition-colors px-4 py-8 min-h-[400px]"
                >
                  <span className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-teal-300 text-white text-[1.5rem] shadow-[0_20px_40px_rgba(0,0,0,0.25)]">
                    +
                  </span>
                  <h2 className="m-0 text-[1.3rem] font-extrabold text-[#0f172a]">Create new</h2>
                  <p className="m-0 text-slate-500 text-[0.95rem] lowercase">requirement</p>
                </div>
              ) : (
                <ReqForm
                  onSave={handleCreate}
                  onCancel={() => setShowForm(false)}
                  submitLabel="Save"
                />
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}