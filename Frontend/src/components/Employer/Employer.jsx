import { useState, useEffect } from "react";
import SearchIcon from "@mui/icons-material/Search";
import { useAuth } from "../../.Context/AuthContext";
import {
  ProfileOverlay,
  ChangeRoleModal,
  ConfirmRoleModal,
  DeleteConfirmModal,
} from "./EmployerModals";
import { API_BASE_URL } from "../../api";

const UserIcon = () => (
  <svg className="w-10 h-10 text-slate-400" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
  </svg>
);

export default function Employer() {
  const { auth } = useAuth();
  const role = auth.role;

  const [members, setMembers] = useState([]);
  const [search, setSearch]   = useState("");
  const [loading, setLoading] = useState(true);

  // Profile overlay
  const [selectedMember, setSelectedMember] = useState(null);
  const [showDotsMenu, setShowDotsMenu]     = useState(false);

  // Change role modal
  const [showRoleModal, setShowRoleModal]     = useState(false);
  const [selectedRole, setSelectedRole]       = useState("");
  const [showConfirmRole, setShowConfirmRole] = useState(false);

  // Delete confirm
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/employers/`, {
      headers: { Authorization: `Bearer ${auth.token}` },
    })
      .then((res) => res.json())
      .then((data) => { setMembers(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => { setMembers([]); setLoading(false); });
  }, []);

  const handleApproveReject = async (userId, status) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/employers/approve-reject/`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${auth.token}` },
        body: JSON.stringify({ user_id: userId, status }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      if (status === "rejected") {
        setMembers((prev) => prev.filter((m) => m.id !== userId));
      } else {
        setMembers((prev) => prev.map((m) => m.id === userId ? { ...m, account_status: status } : m));
      }
    } catch (err) { alert(err.message); }
  };

  const handleChangeRole = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/employers/change-role/`, {
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
      const res = await fetch(`${API_BASE_URL}/api/employers/delete/`, {
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
        className="max-w-[1200px] mx-auto bg-white rounded-3xl pt-3 px-10 pb-4 border-2 border-[#0B2447]"
        style={{ boxShadow: "6px 6px 0px #0B2447" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-4 mb-3 flex-wrap">
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
          <div className="bg-[#fde8c0] rounded-[24px] p-6 flex flex-col">
            <div className="flex items-start justify-between gap-4 mb-5 flex-shrink-0">
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
              <div className="flex flex-col gap-4 overflow-y-auto pr-1 h-[300px]">
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
          <div className="bg-[#d4edb8] rounded-[24px] p-6 flex flex-col">
            <div className="flex items-start justify-between gap-4 mb-5 flex-shrink-0">
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
              <div className="flex flex-col gap-4 overflow-y-auto pr-1 h-[300px]">
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

      {/* ── Overlays & Modals ── */}
      {selectedMember && (
        <ProfileOverlay
          member={selectedMember}
          role={role}
          showDotsMenu={showDotsMenu}
          onToggleDotsMenu={() => setShowDotsMenu((v) => !v)}
          onClose={() => { setSelectedMember(null); setShowDotsMenu(false); }}
          onOpenRoleModal={() => { setSelectedRole(selectedMember.role_name || "HRStaff"); setShowRoleModal(true); setShowDotsMenu(false); }}
          onOpenDeleteConfirm={() => { setShowDeleteConfirm(true); setShowDotsMenu(false); }}
        />
      )}

      {showRoleModal && (
        <ChangeRoleModal
          selectedRole={selectedRole}
          onSelectRole={setSelectedRole}
          onCancel={() => setShowRoleModal(false)}
          onDone={() => { setShowRoleModal(false); setShowConfirmRole(true); }}
        />
      )}

      {showConfirmRole && (
        <ConfirmRoleModal
          memberName={selectedMember.name}
          selectedRole={selectedRole}
          onCancel={() => setShowConfirmRole(false)}
          onConfirm={handleChangeRole}
        />
      )}

      {showDeleteConfirm && (
        <DeleteConfirmModal
          memberName={selectedMember.name}
          onCancel={() => setShowDeleteConfirm(false)}
          onConfirm={handleDelete}
        />
      )}
    </section>
  );
}