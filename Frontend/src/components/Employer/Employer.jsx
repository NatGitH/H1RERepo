import { useState, useEffect } from "react";
import SearchIcon from "@mui/icons-material/Search";
import { useAuth } from "../../.Context/AuthContext";
import { apiFetch, getErrorMessage } from "../../api";

const UserIcon = () => (
  <svg className="w-8 h-8 text-slate-400" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
  </svg>
);

const roleLabel = (r) => (r === "HRManager" ? "Manager" : "Recruiter");

// Revision #7 — HR members are managed via email invites (no more owner-created
// staff accounts). Left = pending invites; right = active members.
export default function Employer() {
  const { auth } = useAuth();

  const [members, setMembers] = useState([]);
  const [search, setSearch]   = useState("");
  const [loading, setLoading] = useState(true);

  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole]   = useState("HRStaff");
  const [sending, setSending] = useState(false);

  const [menuFor, setMenuFor] = useState(null);   // access_id whose ⋯ menu is open

  const load = async () => {
    try {
      const data = await apiFetch("/api/members/", { token: auth.token });
      setMembers(Array.isArray(data) ? data : []);
    } catch { setMembers([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleInvite = async () => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inviteEmail.trim())) { window.showAlert("Please enter a valid email."); return; }
    setSending(true);
    try {
      await apiFetch("/api/members/invite/", { method: "POST", token: auth.token, body: { email: inviteEmail.trim().toLowerCase(), role: inviteRole } });
      setShowInvite(false); setInviteEmail(""); setInviteRole("HRStaff");
      window.showAlert("Invitation sent.", { type: "success" });
      load();
    } catch (err) { window.showAlert(getErrorMessage(err, "Couldn't send the invite.")); }
    finally { setSending(false); }
  };

  const changeRole = async (m) => {
    const next = m.role === "HRManager" ? "HRStaff" : "HRManager";
    setMenuFor(null);
    try {
      await apiFetch("/api/members/update/", { method: "POST", token: auth.token, body: { access_id: m.access_id, action: "role", role: next } });
      setMembers((prev) => prev.map((x) => x.access_id === m.access_id ? { ...x, role: next } : x));
    } catch (err) { window.showAlert(getErrorMessage(err)); }
  };

  const removeMember = async (m) => {
    setMenuFor(null);
    const isInvite = m.status === "invited";
    if (!(await window.showConfirm(`${isInvite ? "Cancel the invite for" : "Remove"} ${m.name || m.email}?`, { danger: true, confirmText: isInvite ? "Cancel Invite" : "Remove" }))) return;
    try {
      await apiFetch("/api/members/update/", { method: "POST", token: auth.token, body: { access_id: m.access_id, action: "remove" } });
      setMembers((prev) => prev.filter((x) => x.access_id !== m.access_id));
    } catch (err) { window.showAlert(getErrorMessage(err)); }
  };

  const filtered = members.filter((m) => (m.name || m.email).toLowerCase().includes(search.toLowerCase()));
  const invited = filtered.filter((m) => m.status === "invited");
  const active  = filtered.filter((m) => m.status === "active");

  if (loading) {
    return (
      <section className="px-4 pt-1 bg-[#0B2447] h-[calc(100vh-56px)] flex items-center justify-center">
        <p className="text-white text-sm">Loading...</p>
      </section>
    );
  }

  return (
    <section className="px-4 pt-1 bg-[#0B2447] h-[calc(100vh-56px)] overflow-hidden flex flex-col">
      <div
        className="max-w-[1200px] w-full mx-auto bg-white rounded-3xl pt-3 px-10 pb-4 border-2 border-[#0B2447] flex-1 flex flex-col min-h-0 mb-4"
        style={{ boxShadow: "6px 6px 0px #0B2447" }}
      >
        <div className="flex items-center justify-between gap-4 mb-3 flex-wrap">
          <div
            className="font-extrabold text-[#0B2447] rounded-full border-2 border-[#0B2447] text-lg tracking-wide px-6 h-[50px] flex items-center justify-center whitespace-nowrap"
            style={{ boxShadow: "3px 3px 0px #0B2447" }}
          >
            HR Members
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-2 border-2 border-[#0B2447] rounded-full px-4 py-2 w-[240px]">
              <input
                type="search" placeholder="Search" value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="border-none outline-none w-full text-sm text-[#0B2447] bg-transparent placeholder-slate-400"
              />
              <SearchIcon style={{ fontSize: 20, color: "#0B2447" }} />
            </div>
            <button
              onClick={() => setShowInvite(true)}
              className="bg-[#0B2447] hover:bg-[#162553] text-white font-bold text-sm px-5 h-[42px] rounded-full border-none cursor-pointer whitespace-nowrap"
            >
              + Invite HR
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6 max-[768px]:grid-cols-1 flex-1 min-h-0">
          {/* Pending invites */}
          <div className="bg-[#fde8c0] rounded-[24px] p-6 flex flex-col min-h-0">
            <div className="flex items-start justify-between gap-4 mb-5 flex-shrink-0">
              <h2 className="text-[1.3rem] font-extrabold text-[#0f172a] leading-snug m-0">Pending Invites</h2>
              <span className="px-3 py-1.5 rounded-full text-[0.8rem] font-bold whitespace-nowrap border-2 border-[#e07b2a] text-[#e07b2a] bg-transparent">{invited.length} pending</span>
            </div>
            {invited.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-1 py-12 flex-1">
                <p className="font-bold text-[#78350f] m-0">No pending invites</p>
                <p className="text-sm text-[#92400e] text-center m-0">Invite HR staff by email to get started.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3 overflow-y-auto pr-1 flex-1 min-h-0">
                {invited.map((m) => (
                  <div key={m.access_id} className="bg-white rounded-2xl p-4 flex items-center gap-3 shadow-[0_4px_16px_rgba(15,23,42,0.07)]">
                    <div className="w-11 h-11 rounded-xl bg-slate-200 flex items-center justify-center shrink-0"><UserIcon /></div>
                    <div className="flex flex-col flex-1 min-w-0">
                      <span className="text-sm font-bold text-[#0f172a] truncate">{m.email}</span>
                      <span className="text-xs text-slate-400">Invited as {roleLabel(m.role)} · {m.has_account ? "awaiting accept" : "awaiting signup"}</span>
                    </div>
                    <button onClick={() => removeMember(m)} className="text-xs font-bold text-red-500 hover:text-red-600 bg-transparent border-none cursor-pointer shrink-0">Cancel</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Active members */}
          <div className="bg-[#d4edb8] rounded-[24px] p-6 flex flex-col min-h-0">
            <div className="flex items-start justify-between gap-4 mb-5 flex-shrink-0">
              <h2 className="text-[1.3rem] font-extrabold text-[#0f172a] leading-snug m-0">Active HR Members</h2>
              <span className="px-3 py-1.5 rounded-full text-[0.8rem] font-bold whitespace-nowrap border-2 border-[#22a861] bg-[#22a861] text-white">{active.length} Total</span>
            </div>
            {active.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-1 py-12 flex-1">
                <p className="font-bold text-green-800 m-0">No active members yet</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3 overflow-y-auto pr-1 flex-1 min-h-0">
                {active.map((m) => (
                  <div key={m.access_id} className="bg-white rounded-2xl p-4 flex items-center gap-3 shadow-[0_4px_16px_rgba(15,23,42,0.07)] relative">
                    <div className="w-11 h-11 rounded-xl bg-slate-200 overflow-hidden flex items-center justify-center shrink-0">
                      {m.profile_picture ? <img src={m.profile_picture} alt={m.name} className="w-full h-full object-cover" /> : <UserIcon />}
                    </div>
                    <div className="flex flex-col flex-1 min-w-0">
                      <span className="text-sm font-bold text-[#0f172a] truncate">{m.name}</span>
                      <span className="text-xs text-slate-400 truncate">{m.email}</span>
                    </div>
                    <span className="text-[0.7rem] font-bold rounded-full px-2.5 py-1 bg-slate-100 text-[#0B2447] shrink-0">{roleLabel(m.role)}</span>
                    <button onClick={() => setMenuFor(menuFor === m.access_id ? null : m.access_id)} className="text-slate-400 text-xl font-bold px-1 bg-transparent border-none cursor-pointer hover:text-slate-600 shrink-0">⋯</button>
                    {menuFor === m.access_id && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setMenuFor(null)} />
                        <div className="absolute right-2 top-14 z-50 w-44 bg-white rounded-xl py-1.5 px-1.5" style={{ border: "2px solid #1a1a2e", boxShadow: "3px 3px 0px #000000" }}>
                          <button onClick={() => changeRole(m)} className="w-full text-left px-3 py-2 text-sm font-semibold text-[#0B2447] hover:bg-slate-50 rounded-lg border-none bg-transparent cursor-pointer">Make {m.role === "HRManager" ? "Recruiter" : "Manager"}</button>
                          <button onClick={() => removeMember(m)} className="w-full text-left px-3 py-2 text-sm font-semibold text-red-500 hover:bg-red-50 rounded-lg border-none bg-transparent cursor-pointer">Remove</button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {showInvite && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ backgroundColor: "rgba(0,0,0,0.6)" }} onClick={() => setShowInvite(false)}>
          <div className="bg-white rounded-2xl w-full max-w-sm p-6" style={{ border: "2px solid #1a1a2e", boxShadow: "8px 8px 0px #000000" }} onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-[#0B2447] mb-1">Invite HR</h3>
            <p className="text-xs text-slate-400 mb-4">They'll get an email to join. If they don't have an account yet, it'll prompt them to sign up.</p>
            <label className="block text-xs font-bold text-[#0B2447] mb-1">Email</label>
            <input type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="name@example.com"
              className="w-full border-2 border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#0B2447] mb-4" />
            <label className="block text-xs font-bold text-[#0B2447] mb-1">Role</label>
            <div className="grid grid-cols-2 gap-2 mb-5">
              {[["HRStaff", "Recruiter"], ["HRManager", "Manager"]].map(([val, lbl]) => (
                <button key={val} onClick={() => setInviteRole(val)}
                  className={`text-sm font-bold py-2 rounded-lg border-2 transition cursor-pointer ${inviteRole === val ? "bg-[#0B2447] text-white border-[#0B2447]" : "bg-white text-slate-600 border-slate-300 hover:bg-slate-50"}`}>{lbl}</button>
              ))}
            </div>
            <div className="flex gap-3">
              <button onClick={handleInvite} disabled={sending} className="flex-1 bg-[#0B2447] hover:bg-[#162553] text-white font-bold py-2.5 rounded-lg border-none cursor-pointer disabled:opacity-50">{sending ? "Sending..." : "Send Invite"}</button>
              <button onClick={() => setShowInvite(false)} className="flex-1 border-2 border-slate-300 text-slate-600 font-bold py-2.5 rounded-lg hover:bg-slate-50 bg-white cursor-pointer">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
