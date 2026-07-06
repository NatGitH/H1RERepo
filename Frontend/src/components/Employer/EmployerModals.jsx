const UserIcon = () => (
  <svg className="w-10 h-10 text-slate-400" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
  </svg>
);

export const STATUS_OPTIONS = [
  { value: "active",   label: "Active",   dot: "bg-green-400",  bg: "bg-green-50",  text: "text-green-700",  border: "border-green-200" },
  { value: "on_break", label: "On Break", dot: "bg-orange-400", bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-200" },
  { value: "on_leave", label: "On Leave", dot: "bg-red-400",    bg: "bg-red-50",    text: "text-red-700",    border: "border-red-200" },
];

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
}) {
  const currentStatus =
    STATUS_OPTIONS.find((s) => s.value === member.account_status) || STATUS_OPTIONS[0];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
      <div className="w-full max-w-[1100px] grid grid-cols-[1fr_360px] gap-6 max-[900px]:grid-cols-1">

        {/* Left: Profile Card */}
        <div
          className="bg-white rounded-[40px] p-8 flex flex-col gap-6 relative"
          style={{ border: "2px solid #0B2447", boxShadow: "6px 6px 0px #0B2447" }}
        >
          <div className="flex items-start gap-5 relative">
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

          {/* Bio */}
          <div className="border-2 border-slate-200 rounded-[20px] p-6">
            <p className="text-[0.9rem] text-slate-700 leading-[1.8] text-justify m-0">
              {member.bio || "No bio available."}
            </p>
          </div>

          <button
            onClick={onClose}
            className="self-start mt-2 text-sm text-slate-400 hover:text-slate-600 border-none bg-transparent cursor-pointer font-medium"
          >
            ← Back to Employers
          </button>
        </div>

        {/* Right: Interview Applicants placeholder */}
        <div
          className="bg-white rounded-[40px] p-8 flex flex-col"
          style={{ border: "2px solid #0B2447", boxShadow: "6px 6px 0px #0B2447" }}
        >
          <div
            className="font-extrabold text-[#0B2447] px-6 py-2.5 rounded-full border-2 border-[#0B2447] text-base tracking-wide self-start mb-6"
            style={{ boxShadow: "3px 3px 0px #0B2447" }}
          >
            For Interview Applicants
          </div>
          <p className="text-slate-400 text-sm">No applicants scheduled for interview yet.</p>
        </div>
      </div>
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