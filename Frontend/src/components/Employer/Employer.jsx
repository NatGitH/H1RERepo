import { useState, useEffect } from "react";
import SearchIcon from "@mui/icons-material/Search";
import { useAuth } from "../../.Context/AuthContext";

const UserIcon = () => (
  <svg className="w-10 h-10 text-slate-400" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
  </svg>
);

const STATUS_OPTIONS = [
  { value: "active",   label: "Active",   dot: "bg-green-400",  bg: "bg-green-50",  text: "text-green-700",  border: "border-green-200" },
  { value: "on_break", label: "On Break", dot: "bg-orange-400", bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-200" },
  { value: "on_leave", label: "On Leave", dot: "bg-red-400",    bg: "bg-red-50",    text: "text-red-700",    border: "border-red-200" },
];

export default function Employer() {
  const { auth } = useAuth();
  const role = auth.role;

  const [members, setMembers]   = useState([]);
  const [search, setSearch]     = useState("");
  const [loading, setLoading]   = useState(true);

  // Profile overlay
  const [selectedMember, setSelectedMember] = useState(null);
  const [showDotsMenu, setShowDotsMenu]     = useState(false);

  // Change role modal
  const [showRoleModal, setShowRoleModal]       = useState(false);
  const [selectedRole, setSelectedRole]         = useState("");
  const [showConfirmRole, setShowConfirmRole]   = useState(false);

  // Delete confirm
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    fetch("http://localhost:8000/api/employers/", {
      headers: { Authorization: `Bearer ${auth.token}` },
    })
      .then((res) => res.json())
      .then((data) => { setMembers(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => { setMembers([]); setLoading(false); });
  }, []);

  const handleApproveReject = async (userId, status) => {
  try {
    const res = await fetch("http://localhost:8000/api/employers/approve-reject/", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${auth.token}` },
      body: JSON.stringify({ user_id: userId, status }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);

    if (status === "rejected") {
      // Remove from list entirely
      setMembers((prev) => prev.filter((m) => m.id !== userId));
    } else {
      setMembers((prev) => prev.map((m) => m.id === userId ? { ...m, account_status: status } : m));
    }
  } catch (err) { alert(err.message); }
};

  const handleChangeRole = async () => {
    try {
      const res = await fetch("http://localhost:8000/api/employers/change-role/", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${auth.token}` },
        body: JSON.stringify({ user_id: selectedMember.id, role_name: selectedRole }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMembers((prev) => prev.map((m) => m.id === selectedMember.id ? { ...m, role_name: selectedRole } : m));
      setSelectedMember((prev) => ({ ...prev, role_name: selectedRole }));
      setShowConfirmRole(false);
      setShowRoleModal(false);
    } catch (err) { alert(err.message); }
  };

  const handleDelete = async () => {
    try {
      const res = await fetch("http://localhost:8000/api/employers/delete/", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${auth.token}` },
        body: JSON.stringify({ user_id: selectedMember.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMembers((prev) => prev.filter((m) => m.id !== selectedMember.id));
      setShowDeleteConfirm(false);
      setSelectedMember(null);
    } catch (err) { alert(err.message); }
  };

  const filtered = members.filter((m) =>
    m.name.toLowerCase().includes(search.toLowerCase())
  );

  const pending = filtered.filter((m) => m.account_status === "pending");
  const active  = filtered.filter((m) => ["active", "on_break", "on_leave"].includes(m.account_status));

  const currentStatus = selectedMember
    ? STATUS_OPTIONS.find((s) => s.value === selectedMember.account_status) || STATUS_OPTIONS[0]
    : STATUS_OPTIONS[0];

  if (loading) {
    return (
      <section className="px-4 pt-1 bg-[#0B2447] min-h-screen flex items-center justify-center">
        <p className="text-white text-sm">Loading...</p>
      </section>
    );
  }

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
            Employer
          </div>
          <div className="flex items-center gap-2 border-2 border-[#0B2447] rounded-full px-4 py-2 w-[260px]">
            <input
              type="search" placeholder="Search" value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="border-none outline-none w-full text-sm text-[#0B2447] bg-transparent placeholder-slate-400"
            />
            <SearchIcon style={{ fontSize: 20, color: "#0B2447" }} />
          </div>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 gap-6 max-[768px]:grid-cols-1">

          {/* Pending Panel */}
          <div className="bg-[#fde8c0] rounded-[24px] p-6 min-h-[420px]">
            <div className="flex items-start justify-between gap-4 mb-5">
              <h2 className="text-[1.3rem] font-extrabold text-[#0f172a] leading-snug m-0">
                Pending Account Creation
              </h2>
              <span className="px-3 py-1.5 rounded-full text-[0.8rem] font-bold whitespace-nowrap border-2 border-[#e07b2a] text-[#e07b2a] bg-transparent">
                {pending.length} pending
              </span>
            </div>
            {pending.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 py-12">
                <p className="font-bold text-[#78350f]">No pending accounts</p>
                <p className="text-sm text-[#92400e] text-center">All caught up!</p>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {pending.map((member) => (
                  <div key={member.id} className="bg-white rounded-2xl p-4 flex items-center gap-4 shadow-[0_4px_16px_rgba(15,23,42,0.07)]">
                    <div className="w-[70px] min-w-[70px] h-[80px] bg-slate-200 rounded-[10px] overflow-hidden flex items-center justify-center">
                      {member.profile_picture ? (
                        <img src={member.profile_picture} alt={member.name} className="w-full h-full object-cover" />
                      ) : <UserIcon />}
                    </div>
                    <div className="flex flex-col gap-1 flex-1">
                      <span className="bg-slate-100 rounded-full px-3 py-1 text-[0.85rem] font-bold text-[#0f172a] self-start">
                        {member.name}
                      </span>
                      <span className="text-xs text-slate-400">{member.email}</span>
                    </div>
                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => handleApproveReject(member.id, "active")}
                        className="px-4 py-1.5 rounded-full font-bold text-xs text-white bg-green-500 hover:bg-green-600 border-none cursor-pointer"
                      >
                        Approved
                      </button>
                      <button
                        onClick={() => handleApproveReject(member.id, "rejected")}
                        className="px-4 py-1.5 rounded-full font-bold text-xs text-white bg-red-500 hover:bg-red-600 border-none cursor-pointer"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Active Panel */}
          <div className="bg-[#d4edb8] rounded-[24px] p-6 min-h-[420px]">
            <div className="flex items-start justify-between gap-4 mb-5">
              <h2 className="text-[1.3rem] font-extrabold text-[#0f172a] leading-snug m-0">
                Active HR Members
              </h2>
              <span className="px-3 py-1.5 rounded-full text-[0.8rem] font-bold whitespace-nowrap border-2 border-[#22a861] bg-[#22a861] text-white">
                {active.length} Active
              </span>
            </div>
            {active.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 py-12">
                <p className="font-bold text-green-800">No active members yet</p>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {active.map((member) => (
                  <div
                    key={member.id}
                    onClick={() => { setSelectedMember(member); setShowDotsMenu(false); }}
                    className="bg-white rounded-2xl p-4 flex items-center gap-4 shadow-[0_4px_16px_rgba(15,23,42,0.07)] cursor-pointer hover:shadow-md transition-shadow"
                  >
                    <div className="w-[70px] min-w-[70px] h-[80px] bg-slate-200 rounded-[10px] overflow-hidden flex items-center justify-center">
                      {member.profile_picture ? (
                        <img src={member.profile_picture} alt={member.name} className="w-full h-full object-cover" />
                      ) : <UserIcon />}
                    </div>
                    <div className="flex flex-col gap-1 flex-1 min-w-0">
                      <span className="bg-slate-100 rounded-full px-3 py-1 text-[0.85rem] font-bold text-[#0f172a] self-start">
                        {member.name}
                      </span>
                      <p className="text-[0.75rem] text-slate-500 leading-relaxed m-0 line-clamp-2">
                        {member.bio || "No bio available."}
                      </p>
                      <span className="text-xs text-slate-400 font-medium">{member.role_name || "HRStaff"}</span>
                    </div>
                    <span className="px-3 py-1 rounded-full text-[0.75rem] font-bold border-2 border-[#22a861] bg-[#22a861] text-white whitespace-nowrap">
                      Active
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Profile Overlay ── */}
      {selectedMember && (
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
                  {selectedMember.profile_picture ? (
                    <img src={selectedMember.profile_picture} alt={selectedMember.name} className="w-full h-full object-cover" />
                  ) : <UserIcon />}
                </div>

                {/* Info */}
                <div className="flex flex-col gap-3 flex-1">
                  <div
                    className="font-extrabold text-[#0B2447] px-5 py-2 rounded-full border-2 border-[#0B2447] text-base self-start"
                    style={{ boxShadow: "3px 3px 0px #0B2447" }}
                  >
                    {selectedMember.name}
                  </div>

                  {/* Status badge */}
                  <div className={`flex items-center gap-2 border rounded-full px-4 py-1.5 self-start ${currentStatus.bg} ${currentStatus.border}`}>
                    <span className={`w-2.5 h-2.5 rounded-full ${currentStatus.dot}`} />
                    <span className={`text-sm font-semibold ${currentStatus.text}`}>{currentStatus.label}</span>
                  </div>

                  {/* Role */}
                  <div className="flex items-center gap-2 border border-slate-200 rounded-full px-4 py-1.5 self-start bg-white">
                    <span className="text-sm font-medium text-slate-600">{selectedMember.role_name || "HRStaff"}</span>
                  </div>
                </div>

                {/* ⋯ dots — Owner only */}
                {role === "owner" && (
                  <div className="absolute top-0 right-0">
                    <button
                      onClick={() => setShowDotsMenu((v) => !v)}
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
                          onClick={() => { setSelectedRole(selectedMember.role_name || "HRStaff"); setShowRoleModal(true); setShowDotsMenu(false); }}
                          className="w-full text-left px-3 py-2 text-sm font-semibold text-[#0B2447] hover:bg-slate-50 rounded-lg border-none bg-transparent cursor-pointer"
                        >
                          Change Role
                        </button>
                        <button
                          onClick={() => { setShowDeleteConfirm(true); setShowDotsMenu(false); }}
                          className="w-full text-left px-3 py-2 text-sm font-semibold text-red-500 hover:bg-red-50 rounded-lg border-none bg-transparent cursor-pointer"
                        >
                          Delete Employer
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Close button — top right for non-owner */}
                {role !== "owner" && (
                  <button
                    onClick={() => setSelectedMember(null)}
                    className="absolute top-0 right-0 text-slate-400 text-xl font-bold px-2 cursor-pointer bg-transparent border-none hover:text-slate-600"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Bio */}
              <div className="border-2 border-slate-200 rounded-[20px] p-6">
                <p className="text-[0.9rem] text-slate-700 leading-[1.8] text-justify m-0">
                  {selectedMember.bio || "No bio available."}
                </p>
              </div>

              {/* Close button at bottom */}
              <button
                onClick={() => { setSelectedMember(null); setShowDotsMenu(false); }}
                className="self-start mt-2 text-sm text-slate-400 hover:text-slate-600 border-none bg-transparent cursor-pointer font-medium"
              >
                ← Back to Employers
              </button>
            </div>

            {/* Right: For Interview Applicants (placeholder) */}
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

          {/* ── Change Role Modal ── */}
          {showRoleModal && (
            <div className="absolute inset-0 flex items-center justify-center z-60">
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
                      onClick={() => setSelectedRole(r)}
                      className={`w-full py-3 rounded-full text-sm font-semibold border-2 cursor-pointer transition-colors ${
                        selectedRole === r
                          ? "bg-slate-200 border-slate-400 text-[#0B2447]"
                          : "bg-white border-slate-200 text-[#0B2447] hover:bg-slate-50"
                      }`}
                    >
                      {r === "HRManager" ? "HR Manager" : "Employer"}
                    </button>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setShowRoleModal(false)}
                    className="bg-red-500 hover:bg-red-600 text-white font-bold rounded-full py-2.5 border-none cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => { setShowRoleModal(false); setShowConfirmRole(true); }}
                    className="bg-[#0B2447] hover:bg-[#162553] text-white font-bold rounded-full py-2.5 border-none cursor-pointer"
                  >
                    Done
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── Confirm Change Role Modal ── */}
          {showConfirmRole && (
            <div className="absolute inset-0 flex items-center justify-center z-60">
              <div
                className="bg-white rounded-3xl px-10 py-8 w-full max-w-sm mx-4 flex flex-col gap-5"
                style={{ border: "2px solid #0B2447", boxShadow: "4px 4px 0px #0B2447" }}
              >
                <h2 className="text-xl font-extrabold text-[#0B2447] text-center">Confirm Change Role</h2>
                <p className="text-center text-slate-600 text-sm">
                  Are you sure you want to change{" "}
                  <strong>{selectedMember.name.split(" ")[0]}'s</strong> Role to{" "}
                  <strong>{selectedRole === "HRManager" ? "HR Manager" : "Employer"}</strong>?
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setShowConfirmRole(false)}
                    className="bg-red-500 hover:bg-red-600 text-white font-bold rounded-full py-2.5 border-none cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleChangeRole}
                    className="bg-green-500 hover:bg-green-600 text-white font-bold rounded-full py-2.5 border-none cursor-pointer"
                  >
                    Yes
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── Delete Confirm Modal ── */}
          {showDeleteConfirm && (
            <div className="absolute inset-0 flex items-center justify-center z-60">
              <div
                className="bg-white rounded-3xl px-10 py-8 w-full max-w-sm mx-4 flex flex-col gap-5"
                style={{ border: "2px solid #0B2447", boxShadow: "4px 4px 0px #0B2447" }}
              >
                <h2 className="text-xl font-extrabold text-[#0B2447] text-center">Delete Employer?</h2>
                <p className="text-center text-slate-600 text-sm">
                  Are you sure you want to permanently delete{" "}
                  <strong>{selectedMember.name}</strong>? This action cannot be undone.
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="bg-red-500 hover:bg-red-600 text-white font-bold rounded-full py-2.5 border-none cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDelete}
                    className="bg-[#0B2447] hover:bg-[#162553] text-white font-bold rounded-full py-2.5 border-none cursor-pointer"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}