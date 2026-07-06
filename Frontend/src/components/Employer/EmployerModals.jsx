import { useState } from "react";
import RemoveInterviewModal from "../Functions/RemoveInterviewModal";

const UserIcon = () => (
  <svg className="w-10 h-10 text-slate-400" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
  </svg>
);

// H!RE Score bands, kept in sync with Applicants/Profile.
const scoreColor = (score) =>
  score >= 85 ? "text-green-500" : score >= 65 ? "text-lime-500" : score >= 50 ? "text-yellow-500" : "text-red-500";

export const STATUS_OPTIONS = [
  { value: "active",   label: "Active",   dot: "bg-green-400",  bg: "bg-green-50",  text: "text-green-700",  border: "border-green-200" },
  { value: "on_break", label: "On Break", dot: "bg-orange-400", bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-200" },
  { value: "on_leave", label: "On Leave", dot: "bg-red-400",    bg: "bg-red-50",    text: "text-red-700",    border: "border-red-200" },
  { value: "offline",  label: "Offline",  dot: "bg-slate-400",  bg: "bg-slate-100", text: "text-slate-600",  border: "border-slate-300" },
];

export const getStatusMeta = (value) =>
  STATUS_OPTIONS.find((s) => s.value === value) || STATUS_OPTIONS[0];

// ─────────────────────────────────────────────
// ProfileOverlay — full member profile view
// ─────────────────────────────────────────────

/**
 * Props:
 *   member           {object}    - the selected member object
 *   role             {string}    - auth role ("owner", "HRManager", etc.)
 *   showDotsMenu     {boolean}
 *   onToggleDotsMenu {Function}
 *   onClose          {Function}
 *   onOpenRoleModal  {Function}
 *   onOpenDeleteConfirm {Function}
 */
export function ProfileOverlay({
  member,
  role,
  showDotsMenu,
  onToggleDotsMenu,
  onClose,
  onOpenRoleModal,
  onOpenDeleteConfirm,
  interviewApplicants,
  onRemoveInterview,
}) {
  const currentStatus =
    STATUS_OPTIONS.find((s) => s.value === member.account_status) || STATUS_OPTIONS[0];
  const [selectedInterview, setSelectedInterview] = useState(null);
  const [showRemoveInterview, setShowRemoveInterview] = useState(false);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
      <div className="w-full max-w-[1100px] grid grid-cols-[1fr_360px] gap-6 max-[900px]:grid-cols-1 items-stretch max-h-[80vh]">

        {/* Left: Profile Card (min-w-0 lets long bios wrap instead of stretching) */}
        <div
          className="bg-white rounded-[40px] p-8 flex flex-col gap-6 relative min-w-0 max-h-[80vh]"
          style={{ border: "2px solid #0B2447", boxShadow: "6px 6px 0px #0B2447" }}
        >
          <div className="flex items-start gap-5 relative shrink-0">
            {/* Avatar */}
            <div className="w-[120px] min-w-[120px] h-[120px] border-2 border-slate-200 rounded-2xl overflow-hidden bg-slate-100 flex items-center justify-center">
              {member.profile_picture ? (
                <img src={member.profile_picture} alt={member.name} className="w-full h-full object-cover" />
              ) : <UserIcon />}
            </div>

            {/* Info */}
            <div className="flex flex-col gap-3 flex-1">
              <div
                className="font-extrabold text-[#0B2447] px-5 py-2 rounded-full border-2 border-[#0B2447] text-base self-start"
                style={{ boxShadow: "3px 3px 0px #0B2447" }}
              >
                {member.name}
              </div>
              <div className={`flex items-center gap-2 border rounded-full px-4 py-1.5 self-start ${currentStatus.bg} ${currentStatus.border}`}>
                <span className={`w-2.5 h-2.5 rounded-full ${currentStatus.dot}`} />
                <span className={`text-sm font-semibold ${currentStatus.text}`}>{currentStatus.label}</span>
              </div>
              <div className="flex items-center gap-2 border border-slate-200 rounded-full px-4 py-1.5 self-start bg-white">
                <span className="text-sm font-medium text-slate-600">{member.role_name || "HRStaff"}</span>
              </div>
            </div>

            {/* ⋯ dots — Owner / Manager */}
            {(role === "owner" || role === "HRManager") && (
              <div className="absolute top-0 right-0">
                <button
                  onClick={onToggleDotsMenu}
                  className="text-slate-400 text-xl font-bold px-2 cursor-pointer bg-transparent border-none hover:text-slate-600"
                >
                  ⋯
                </button>
                {showDotsMenu && (
                  <div
                    className="absolute right-0 top-8 bg-white rounded-xl py-2 px-2 w-48 z-50 flex flex-col gap-1"
                    style={{ border: "2px solid #1a1a2e", boxShadow: "3px 3px 0px #000000" }}
                  >
                    <button
                      onClick={onOpenRoleModal}
                      className="w-full text-left px-3 py-2 text-sm font-semibold text-[#0B2447] hover:bg-slate-50 rounded-lg border-none bg-transparent cursor-pointer"
                    >
                      Change Role
                    </button>
                    {(role === "owner" || role === "HRManager") && (
                      <button
                        onClick={onOpenDeleteConfirm}
                        className="w-full text-left px-3 py-2 text-sm font-semibold text-red-500 hover:bg-red-50 rounded-lg border-none bg-transparent cursor-pointer"
                      >
                        Delete Employer
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Close button — HR Staff view */}
            {role !== "owner" && role !== "HRManager" && (
              <button
                onClick={onClose}
                className="absolute top-0 right-0 text-slate-400 text-xl font-bold px-2 cursor-pointer bg-transparent border-none hover:text-slate-600"
              >
                ✕
              </button>
            )}
          </div>

          {/* Bio — grows to fill the card (min 300px), wraps long unbroken text, scrolls if long */}
          <div className="border-2 border-slate-200 rounded-[20px] p-6 flex-1 min-h-[300px] overflow-y-auto">
            <p className="text-[0.9rem] text-slate-700 leading-[1.8] text-justify m-0 break-words [overflow-wrap:anywhere] whitespace-pre-wrap">
              {member.bio || "No bio available."}
            </p>
          </div>

          <button
            onClick={onClose}
            className="self-start shrink-0 text-sm text-[#0B2447] hover:text-[#162553] border-none bg-transparent cursor-pointer font-semibold"
          >
            ← Back to Employers
          </button>
        </div>

        {/* Right: Interviews scheduled by this member */}
        <div
          className="bg-white rounded-[40px] p-8 flex flex-col min-h-0 max-h-[80vh]"
          style={{ border: "2px solid #0B2447", boxShadow: "6px 6px 0px #0B2447" }}
        >
          <div
            className="font-extrabold text-[#0B2447] px-6 py-2.5 rounded-full border-2 border-[#0B2447] text-base tracking-wide self-start mb-6 shrink-0"
            style={{ boxShadow: "3px 3px 0px #0B2447" }}
          >
            For Interview Applicants
          </div>
          <div className="flex-1 min-h-0 overflow-y-auto pr-1">
            {!interviewApplicants ? (
              <p className="text-slate-400 text-sm">Loading applicants...</p>
            ) : interviewApplicants.length === 0 ? (
              <p className="text-slate-400 text-sm">No applicants scheduled for interview yet.</p>
            ) : (
              <div className="flex flex-col gap-4">
                {interviewApplicants.map((a) => (
                  <div key={a.evaluation_id} className="flex flex-col gap-2">
                    <div className="flex items-center gap-1.5 text-[0.78rem] font-bold text-[#0B2447]">
                      <span>💼</span> {a.job_title || "Untitled Requirement"}
                    </div>
                    <button
                      onClick={() => setSelectedInterview(a)}
                      className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-center gap-3 text-left cursor-pointer transition-colors hover:bg-slate-100 w-full"
                    >
                      <div className="flex flex-col gap-2 flex-1 min-w-0">
                        <span className="bg-slate-100 border border-slate-300 rounded-full px-4 py-1 text-[0.82rem] font-semibold text-[#0f172a] self-start truncate max-w-full">
                          {a.applicant_name}
                        </span>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="bg-slate-100 border border-slate-300 rounded-full px-4 py-1 text-[0.82rem] font-semibold text-[#0f172a]">
                            H!RE Score: <span className="font-bold">{a.hire_score}%</span>
                          </span>
                          <span className="rounded-full px-3 py-1 text-[0.72rem] font-bold bg-blue-50 text-blue-600 border border-blue-200">
                            Interview Scheduled
                          </span>
                        </div>
                      </div>
                      <span className="text-slate-400 text-lg shrink-0">›</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Interview applicant detail (opens on top of the overlay) */}
      {selectedInterview && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center px-4"
          style={{ backgroundColor: "rgba(0,0,0,0.6)" }}
          onClick={() => setSelectedInterview(null)}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-lg flex flex-col overflow-hidden"
            style={{ maxHeight: "85vh", border: "2px solid #1a1a2e", boxShadow: "6px 6px 0px #000000" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 shrink-0">
              <h3 className="font-extrabold text-[#0B2447] text-base m-0">{selectedInterview.applicant_name}</h3>
              <button
                onClick={() => setSelectedInterview(null)}
                className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-300 hover:bg-slate-100 transition bg-transparent cursor-pointer"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-3 text-sm">
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 flex flex-col gap-1">
                {selectedInterview.interview_date && (
                  <p className="text-blue-700 m-0"><span className="font-semibold">📅 Interview Date:</span> {new Date(selectedInterview.interview_date).toLocaleString()}</p>
                )}
                {selectedInterview.interview_location && (
                  <p className="text-blue-700 m-0 break-words"><span className="font-semibold">📍 Location / Link:</span> {selectedInterview.interview_location}</p>
                )}
              </div>
              <div className="bg-slate-50 rounded-xl p-3 flex flex-col gap-1">
                <p className="text-[#0B2447] m-0 font-bold">💼 {selectedInterview.job_title || "Untitled Requirement"}</p>
                {selectedInterview.job_description && (
                  <p className="text-slate-600 m-0"><span className="font-semibold text-[#0B2447]">Description:</span> {selectedInterview.job_description}</p>
                )}
                {selectedInterview.job_qualifications && (
                  <p className="text-slate-600 m-0"><span className="font-semibold text-[#0B2447]">Qualifications:</span> {selectedInterview.job_qualifications}</p>
                )}
              </div>
              <p className="text-slate-600 m-0">
                <span className="font-semibold text-[#0B2447]">H!RE Score:</span>{" "}
                <span className={`font-bold ${scoreColor(selectedInterview.hire_score)}`}>{selectedInterview.hire_score}%</span>
              </p>
              {selectedInterview.applicant_email && (
                <p className="text-slate-600 m-0"><span className="font-semibold text-[#0B2447]">Email:</span> {selectedInterview.applicant_email}</p>
              )}
              {selectedInterview.applicant_phone && (
                <p className="text-slate-600 m-0"><span className="font-semibold text-[#0B2447]">Phone:</span> {selectedInterview.applicant_phone}</p>
              )}
              {selectedInterview.summary && (
                <p className="text-slate-600 m-0"><span className="font-semibold text-[#0B2447]">AI Summary:</span> {selectedInterview.summary}</p>
              )}
              {selectedInterview.pros?.length > 0 && (
                <div>
                  <p className="font-semibold text-green-600 m-0 mb-1">Pros</p>
                  <ul className="list-disc pl-5 m-0 text-slate-600">{selectedInterview.pros.map((p, i) => <li key={i}>{p}</li>)}</ul>
                </div>
              )}
              {selectedInterview.cons?.length > 0 && (
                <div>
                  <p className="font-semibold text-red-500 m-0 mb-1">Cons</p>
                  <ul className="list-disc pl-5 m-0 text-slate-600">{selectedInterview.cons.map((c, i) => <li key={i}>{c}</li>)}</ul>
                </div>
              )}
            </div>
            {onRemoveInterview && (
              <div className="px-6 py-4 border-t border-slate-200 shrink-0">
                <button
                  onClick={() => setShowRemoveInterview(true)}
                  className="w-full bg-red-500 hover:bg-red-600 text-white font-bold rounded-full py-2.5 text-sm border-none cursor-pointer"
                >
                  🗑 Remove Interview
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {selectedInterview && showRemoveInterview && (
        <RemoveInterviewModal
          applicantName={selectedInterview.applicant_name}
          onCancel={() => setShowRemoveInterview(false)}
          onConfirm={async (reason) => {
            await onRemoveInterview(selectedInterview.evaluation_id, reason);
            setShowRemoveInterview(false);
            setSelectedInterview(null);
          }}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// ChangeRoleModal
// ─────────────────────────────────────────────

/**
 * Props:
 *   selectedRole  {string}    - currently selected role value
 *   onSelectRole  {Function}  - called with the new role string
 *   onCancel      {Function}
 *   onDone        {Function}  - called when user clicks "Done"
 */
export function ChangeRoleModal({ selectedRole, onSelectRole, onCancel, onDone }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-60">
      <div
        className="bg-white rounded-3xl px-10 py-8 w-full max-w-sm mx-4 flex flex-col gap-5"
        style={{ border: "2px solid #0B2447", boxShadow: "4px 4px 0px #0B2447" }}
      >
        <h2 className="text-xl font-extrabold text-[#0B2447] text-center">Change Role</h2>
        <div className="flex flex-col gap-2">
          <p className="text-sm font-semibold text-slate-700">Roles:</p>
          {["HRManager", "HRStaff"].map((r) => (
            <button
              key={r}
              onClick={() => onSelectRole(r)}
              className={`w-full py-3 rounded-full text-sm font-semibold border-2 cursor-pointer transition-colors ${
                selectedRole === r
                  ? "bg-slate-200 border-slate-400 text-[#0B2447]"
                  : "bg-white border-slate-200 text-[#0B2447] hover:bg-slate-50"
              }`}
            >
              {r === "HRManager" ? "HR Manager" : "HR Staff"}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={onCancel}
            className="bg-red-500 hover:bg-red-600 text-white font-bold rounded-full py-2.5 border-none cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={onDone}
            className="bg-[#0B2447] hover:bg-[#162553] text-white font-bold rounded-full py-2.5 border-none cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// ConfirmRoleModal
// ─────────────────────────────────────────────

/**
 * Props:
 *   memberName    {string}    - the member's full name
 *   selectedRole  {string}    - the new role being applied
 *   onCancel      {Function}
 *   onConfirm     {Function}
 */
export function ConfirmRoleModal({ memberName, selectedRole, onCancel, onConfirm }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-60">
      <div
        className="bg-white rounded-3xl px-10 py-8 w-full max-w-sm mx-4 flex flex-col gap-5"
        style={{ border: "2px solid #0B2447", boxShadow: "4px 4px 0px #0B2447" }}
      >
        <h2 className="text-xl font-extrabold text-[#0B2447] text-center">Confirm Change Role</h2>
        <p className="text-center text-slate-600 text-sm">
          Are you sure you want to change{" "}
          <strong>{memberName.split(" ")[0]}'s</strong> Role to{" "}
          <strong>{selectedRole === "HRManager" ? "HR Manager" : "HR Staff"}</strong>?
        </p>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={onCancel}
            className="bg-red-500 hover:bg-red-600 text-white font-bold rounded-full py-2.5 border-none cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="bg-green-500 hover:bg-green-600 text-white font-bold rounded-full py-2.5 border-none cursor-pointer"
          >
            Yes
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// DeleteConfirmModal
// ─────────────────────────────────────────────

/**
 * Props:
 *   memberName  {string}    - the member's full name
 *   onCancel    {Function}
 *   onConfirm   {Function}
 */
export function DeleteConfirmModal({ memberName, onCancel, onConfirm }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-60">
      <div
        className="bg-white rounded-3xl px-10 py-8 w-full max-w-sm mx-4 flex flex-col gap-5"
        style={{ border: "2px solid #0B2447", boxShadow: "4px 4px 0px #0B2447" }}
      >
        <h2 className="text-xl font-extrabold text-[#0B2447] text-center">Delete Employer?</h2>
        <p className="text-center text-slate-600 text-sm">
          Are you sure you want to permanently delete{" "}
          <strong>{memberName}</strong>? This action cannot be undone.
        </p>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={onCancel}
            className="bg-red-500 hover:bg-red-600 text-white font-bold rounded-full py-2.5 border-none cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="bg-[#0B2447] hover:bg-[#162553] text-white font-bold rounded-full py-2.5 border-none cursor-pointer"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}