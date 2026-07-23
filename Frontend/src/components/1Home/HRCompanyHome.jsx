import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import LogoutIcon from "@mui/icons-material/Logout";
import { useAuth } from "../../.Context/AuthContext";
import { apiFetch, getErrorMessage } from "../../api";

// Revision #7 — HR "Company Home". After login, an HR user lands here and picks
// which of the companies they can access to enter. Selecting one returns a
// company-scoped token (features then follow that company's plan).
export default function HRCompanyHome() {
  const navigate = useNavigate();
  const { auth, login, logout } = useAuth();
  const [companies, setCompanies] = useState([]);
  const [invites, setInvites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    try {
      const [cs, iv] = await Promise.all([
        apiFetch("/api/auth/my-companies/", { token: auth.token }),
        apiFetch("/api/auth/my-invites/", { token: auth.token }),
      ]);
      setCompanies(Array.isArray(cs) ? cs : []);
      setInvites(Array.isArray(iv) ? iv : []);
    } catch (err) {
      setError(getErrorMessage(err, "Couldn't load your companies."));
    } finally { setLoading(false); }
  };

  useEffect(() => {
    if (!auth.token || !auth.user_id) { navigate("/"); return; }
    load();
  }, []);

  const respondInvite = async (access_id, accept) => {
    try {
      await apiFetch("/api/auth/respond-invite/", { method: "POST", token: auth.token, body: { access_id, accept } });
      setLoading(true);
      await load();
    } catch (err) {
      window.showAlert(getErrorMessage(err, "Couldn't respond to the invite."));
    }
  };

  const pick = async (company_id) => {
    try {
      const d = await apiFetch("/api/auth/select-company/", { method: "POST", token: auth.token, body: { company_id } });
      login({
        token: d.token, role: d.role, user_id: d.user_id, companyId: d.company_id,
        companyName: d.company_name, profile_picture: auth.profile_picture, email: auth.email,
        firstname: auth.firstname, lastname: auth.lastname, subscription_plan: d.subscription_plan,
      });
      navigate("/Applicants");
    } catch (err) {
      window.showAlert(getErrorMessage(err, "Couldn't open that company."));
    }
  };

  const roleLabel = (r) => (r === "HRManager" ? "Manager" : "Recruiter");

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0B2447] px-4 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[350px] bg-blue-600 opacity-10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 right-1/4 translate-x-1/2 -translate-y-1/2 w-[400px] h-[300px] bg-blue-400 opacity-10 rounded-full blur-3xl" />
      </div>

      <div
        className="bg-white rounded-2xl px-8 pt-7 pb-8 w-full max-w-md relative z-10"
        style={{ border: "2px solid #1a1a2e", boxShadow: "6px 6px 0px #000000" }}
      >
        <div className="text-center mb-1">
          <h1 className="text-[2.2rem] font-extrabold tracking-tight leading-none">
            <span className="text-black">H</span><span className="text-[#1a4ccc]">!</span><span className="text-black">RE</span>
          </h1>
        </div>
        <p className="text-center text-sm text-slate-400 mb-6">
          {auth.firstname ? `Welcome, ${auth.firstname}.` : "Welcome."} Choose a company to enter.
        </p>

        {!loading && invites.length > 0 && (
          <div className="mb-5">
            <p className="text-[0.65rem] font-bold uppercase tracking-wide text-slate-400 mb-2">Pending invitations</p>
            <div className="flex flex-col gap-2">
              {invites.map((iv) => (
                <div key={iv.access_id} className="flex items-center gap-3 p-3 rounded-2xl border-2 border-blue-100 bg-blue-50/60">
                  <div className="w-9 h-9 rounded-lg bg-slate-200 overflow-hidden flex items-center justify-center shrink-0">
                    {iv.company_logo ? <img src={iv.company_logo} alt={iv.company_name} className="w-full h-full object-cover" /> : <span className="text-slate-400 font-bold text-xs">{(iv.company_name || "?").charAt(0)}</span>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-[#0B2447] text-sm truncate m-0">{iv.company_name}</p>
                    <p className="text-[0.7rem] text-slate-400 m-0">invited as {iv.role === "HRManager" ? "Manager" : "Recruiter"}</p>
                  </div>
                  <button onClick={() => respondInvite(iv.access_id, true)} className="text-xs font-bold text-white bg-teal-500 hover:bg-teal-600 rounded-full px-3 py-1.5 border-none cursor-pointer">Accept</button>
                  <button onClick={() => respondInvite(iv.access_id, false)} className="text-xs font-bold text-slate-500 hover:text-red-500 bg-transparent border-none cursor-pointer">Decline</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {loading ? (
          <p className="text-slate-400 text-sm text-center py-6">Loading your companies...</p>
        ) : error ? (
          <p className="text-red-500 text-sm text-center py-6">{error}</p>
        ) : companies.length === 0 && invites.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-slate-500 text-sm m-0">You haven't been added to any company yet.</p>
            <p className="text-slate-400 text-xs mt-1">Ask a company owner or HR manager to invite your email — it'll appear here once you accept.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {companies.map((c) => (
              <button
                key={c.company_id}
                onClick={() => pick(c.company_id)}
                className="text-left flex items-center gap-3 p-3 rounded-2xl border-2 border-slate-200 hover:border-[#2255cc] hover:bg-slate-50 transition cursor-pointer bg-white"
              >
                <div className="w-11 h-11 rounded-xl bg-slate-200 overflow-hidden flex items-center justify-center shrink-0">
                  {c.company_logo ? (
                    <img src={c.company_logo} alt={c.company_name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-slate-400 font-bold">{(c.company_name || "?").charAt(0)}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-[#0B2447] text-sm truncate m-0">{c.company_name}</p>
                  <p className="text-xs text-slate-400 m-0">{roleLabel(c.role)}</p>
                </div>
                <span className="text-slate-400 text-lg shrink-0">›</span>
              </button>
            ))}
          </div>
        )}

        <button
          onClick={() => { logout(); navigate("/"); }}
          className="mt-6 mx-auto flex items-center gap-1.5 text-red-500 hover:text-red-600 text-sm font-medium bg-transparent border-none cursor-pointer"
        >
          <LogoutIcon style={{ fontSize: 16 }} /> Sign out
        </button>
      </div>
    </div>
  );
}
