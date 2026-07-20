import { useState, useEffect } from "react";
import { useAuth } from "../../.Context/AuthContext";
import { useNavigate } from "react-router";
import SearchIcon from "@mui/icons-material/Search";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import NotificationsNoneIcon from "@mui/icons-material/NotificationsNone";
import LogoutIcon from "@mui/icons-material/Logout";
import DescriptionIcon from "@mui/icons-material/Description";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import { API_BASE_URL, apiFetch } from "../../api";
import { MetricsView, AiLogTable, fmtHours } from "../Metrics/MetricsView";

export default function AdminDashboard() {
  const { auth, logout } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats]           = useState(null);
  const [pending, setPending]       = useState([]);
  const [pendingPlans, setPendingPlans] = useState([]);
  const [companies, setCompanies]   = useState([]);
  const [search, setSearch]         = useState("");
  const [companySort, setCompanySort] = useState("name");
  const [loading, setLoading]       = useState(true);
  const [activeNav, setActiveNav]   = useState("home");
  const [docsByCompany, setDocsByCompany] = useState({});
  const [expandedDocs, setExpandedDocs]   = useState(null);
  const [previewDoc, setPreviewDoc]       = useState(null);
  const [showNotifs, setShowNotifs]       = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [planModal, setPlanModal]         = useState(null);
  const [revokeReason, setRevokeReason]   = useState("");

  // Revision #4 — platform-wide metrics + AI-procedure log (lazy-loaded on tab open)
  const [adminMetrics, setAdminMetrics]   = useState(null);
  const [adminLogs, setAdminLogs]         = useState([]);
  const [metricsLoading, setMetricsLoading] = useState(false);

  // Revision #12 — dynamic admin user management
  const [adminUsers, setAdminUsers]       = useState([]);
  const [adminsLoading, setAdminsLoading] = useState(false);
  const [showAddAdmin, setShowAddAdmin]   = useState(false);
  const [adminForm, setAdminForm]         = useState({ username: "", email: "", password: "" });
  const [savingAdmin, setSavingAdmin]     = useState(false);
  const [deleteAdmin, setDeleteAdmin]     = useState(null);

  const fetchAdmins = async () => {
    setAdminsLoading(true);
    try {
      const data = await apiFetch("/api/admin/admins/", { token: auth.token });
      setAdminUsers(Array.isArray(data) ? data : []);
    } catch { setAdminUsers([]); }
    finally { setAdminsLoading(false); }
  };

  const handleAddAdmin = async () => {
    if (!adminForm.username.trim() || !adminForm.email.trim() || !adminForm.password) {
      window.showAlert("Please fill in all fields."); return;
    }
    if (adminForm.password.length < 8) { window.showAlert("Password must be at least 8 characters."); return; }
    setSavingAdmin(true);
    try {
      await apiFetch("/api/admin/admins/create/", {
        method: "POST", token: auth.token,
        body: { username: adminForm.username.trim(), email: adminForm.email.trim(), password: adminForm.password },
      });
      setShowAddAdmin(false);
      setAdminForm({ username: "", email: "", password: "" });
      fetchAdmins();
    } catch (err) { window.showAlert(err.message); }
    finally { setSavingAdmin(false); }
  };

  const handleDeleteAdmin = async (id) => {
    try {
      await apiFetch("/api/admin/admins/delete/", { method: "POST", token: auth.token, body: { admin_id: id } });
      setDeleteAdmin(null);
      fetchAdmins();
    } catch (err) { window.showAlert(err.message); }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  useEffect(() => {
    if (activeNav === "admins") { fetchAdmins(); return; }
    if (activeNav !== "metrics" || adminMetrics) return;
    let cancelled = false;
    (async () => {
      setMetricsLoading(true);
      try {
        const [m, l] = await Promise.all([
          apiFetch("/api/admin/metrics/", { token: auth.token }),
          apiFetch("/api/ai-logs/", { token: auth.token }),
        ]);
        if (cancelled) return;
        setAdminMetrics(m);
        setAdminLogs(Array.isArray(l) ? l : []);
      } catch {
        if (!cancelled) setAdminMetrics({ overall: null, companies: [] });
      } finally {
        if (!cancelled) setMetricsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [activeNav]);

  const fetchAll = async () => {
    try {
      const headers = { Authorization: `Bearer ${auth.token}` };

      const [statsRes, pendingRes, companiesRes, plansRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/admin/dashboard/`, { headers }),
        fetch(`${API_BASE_URL}/api/admin/companies/pending/`, { headers }),
        fetch(`${API_BASE_URL}/api/admin/companies/`, { headers }),
        fetch(`${API_BASE_URL}/api/admin/plans/pending/`, { headers }),
      ]);

      const statsData     = await statsRes.json();
      const pendingData   = await pendingRes.json();
      const companiesData = await companiesRes.json();
      const plansData     = await plansRes.json();

      setStats(statsData);
      setPending(Array.isArray(pendingData) ? pendingData : []);
      setCompanies(Array.isArray(companiesData) ? companiesData : []);
      setPendingPlans(Array.isArray(plansData) ? plansData : []);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const fetchDocuments = async (companyId) => {
    if (docsByCompany[companyId]) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/companies/${companyId}/documents/`, {
        headers: { Authorization: `Bearer ${auth.token}` },
      });
      const data = await res.json();
      setDocsByCompany((prev) => ({ ...prev, [companyId]: Array.isArray(data) ? data : [] }));
    } catch (err) {
      console.error(err);
    }
  };

  const toggleDocs = (companyId) => {
    if (expandedDocs === companyId) {
      setExpandedDocs(null);
    } else {
      setExpandedDocs(companyId);
      fetchDocuments(companyId);
    }
  };

  const handlePlanDecision = async (id, status) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/plans/approve-reject/`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${auth.token}` },
        body: JSON.stringify({ id, status }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setPendingPlans((prev) => prev.filter((p) => p.id !== id));
      fetchAll();
    } catch (err) { window.showAlert(err.message); }
  };

  const handleSetPlan = async (company_id, plan, expiry) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/plans/set/`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${auth.token}` },
        body: JSON.stringify({ company_id, plan, expiry }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      window.showAlert(`Plan set to ${plan}. Expires ${data.subscription_expiry}.`, { type: "success" });
      fetchAll();
    } catch (err) { window.showAlert(err.message); }
  };

  const handleApproveReject = async (ap_id, status) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/companies/approve-reject/`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${auth.token}` },
        body: JSON.stringify({ ap_id, status }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setPending((prev) => prev.filter((p) => p.ap_id !== ap_id));
      fetchAll();
    } catch (err) { window.showAlert(err.message); }
  };

  const handleRevoke = async (company_id, reason) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/companies/revoke/`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${auth.token}` },
        body: JSON.stringify({ company_id, reason }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      fetchAll();
    } catch (err) { window.showAlert(err.message); }
  };

const handleRestore = async (company_id) => {
  try {
    const res = await fetch(`${API_BASE_URL}/api/admin/companies/restore/`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${auth.token}` },
      body: JSON.stringify({ company_id }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    fetchAll();
  } catch (err) { window.showAlert(err.message); }
};

const handleDelete = async (company_id) => {
  try {
    const res = await fetch(`${API_BASE_URL}/api/admin/companies/delete/`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${auth.token}` },
      body: JSON.stringify({ company_id }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    fetchAll();
  } catch (err) { window.showAlert(err.message); }
};

  const guessMime = (url = "") => {
    const u = url.toLowerCase();
    if (/\.(jpg|jpeg)(\?|$)/.test(u)) return "image/jpeg";
    if (/\.png(\?|$)/.test(u)) return "image/png";
    if (/\.gif(\?|$)/.test(u)) return "image/gif";
    if (/\.webp(\?|$)/.test(u)) return "image/webp";
    if (/\.pdf(\?|$)/.test(u)) return "application/pdf";
    return "application/octet-stream";
  };

  const openDocInNewTab = async (doc) => {
    try {
      const res = await fetch(doc.document_url);
      const buf = await res.arrayBuffer();
      const blob = new Blob([buf], { type: guessMime(doc.document_url) });
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank", "noopener,noreferrer");
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch {
      window.open(doc.document_url, "_blank", "noopener,noreferrer");
    }
  };

  const downloadDoc = async (doc) => {
    try {
      const res = await fetch(doc.document_url);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = doc.document_name || doc.document_type || "document";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      window.open(doc.document_url, "_blank", "noopener,noreferrer");
    }
  };

  const runConfirm = () => {
    if (!confirmAction) return;
    const { type, id, apId } = confirmAction;
    if (type === "revoke") {
      if (!revokeReason.trim()) { window.showAlert("Please enter a reason for revoking."); return; }
      handleRevoke(id, revokeReason.trim());
    }
    else if (type === "restore") handleRestore(id);
    else if (type === "delete") handleDelete(id);
    else if (type === "reject") handleApproveReject(apId, "rejected");
    setConfirmAction(null);
    setRevokeReason("");
  };

  const toDateInput = (val) => {
    let d = val ? new Date(val) : null;
    if (!d || isNaN(d.getTime())) {
      d = new Date();
      d.setDate(d.getDate() + 30);
    }
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };

  const filteredCompanies = companies.filter((c) =>
    c.company_name.toLowerCase().includes(search.toLowerCase())
  );

  const sortCompanies = (list) => {
    const arr = [...list];
    if (companySort === "name")
      arr.sort((a, b) => (a.company_name || "").localeCompare(b.company_name || ""));
    else if (companySort === "expiry")
      arr.sort((a, b) => new Date(a.subscription_expiry || 0) - new Date(b.subscription_expiry || 0));
    return arr;
  };

  const docOpenUrl = (doc) => {
    const url = doc?.document_url || "";
    const isImage = /\.(jpg|jpeg|png|gif|webp)(\?|$)/i.test(url);
    return isImage ? url : `https://docs.google.com/viewer?url=${encodeURIComponent(url)}`;
  };

  const getSubStatusColor = (status) => {
    if (status === "active") return "bg-green-500";
    if (status === "expiring") return "bg-orange-400";
    if (status === "expired") return "bg-red-500";
    return "bg-slate-400";
  };

  const approvedCompanies = companies.filter((c) => c.approval_status === "approved");
  const totalCompaniesCount = approvedCompanies.length;
  const activeSubscriptionCount = approvedCompanies.filter((c) => c.subscription_status === "active").length;

  const DocumentsList = ({ companyId }) => {
    const docs = docsByCompany[companyId];
    if (!docs) return <p className="text-xs text-slate-400 py-2">Loading documents...</p>;
    if (docs.length === 0) return <p className="text-xs text-slate-400 py-2">No documents uploaded.</p>;

    return (
      <div className="flex flex-col gap-1.5 py-2">
        {docs.map((doc) => (
          <button
            key={doc.id}
            onClick={() => setPreviewDoc(doc)}
            className="flex items-center gap-2 text-xs font-semibold text-[#0B2447] hover:text-teal-600 bg-white rounded-lg px-3 py-2 border border-slate-200 transition cursor-pointer text-left"
          >
            <DescriptionIcon style={{ fontSize: 16 }} />
            {doc.document_name || doc.document_type}
          </button>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B2447] flex items-center justify-center">
        <p className="text-white">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B2447]">
      <nav className="bg-[#0B2447] text-white px-6 h-14 flex items-center justify-between border-b border-white/10">
        <div className="flex items-center gap-2 relative">
          <span className="font-extrabold text-3xl tracking-tight">
            H<span className="text-sky-400">!</span>RE
          </span>
          <button
            onClick={() => setShowNotifs((v) => !v)}
            className="relative w-10 h-10 rounded-full bg-teal-400 flex items-center justify-center ml-2 border-none cursor-pointer hover:bg-teal-300 transition-colors"
          >
            <NotificationsNoneIcon style={{ fontSize: 20 }} />
            {pending.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-orange-400 text-white text-[0.6rem] font-black flex items-center justify-center">
                {pending.length}
              </span>
            )}
          </button>

          {showNotifs && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowNotifs(false)} />
              <div className="absolute left-12 top-12 z-50 w-[320px] bg-white rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.18)] overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                  <h3 className="text-[1.1rem] font-extrabold text-[#0f172a] m-0">Notifications</h3>
                  {pending.length > 0 && (
                    <span className="bg-orange-100 text-orange-600 text-xs font-bold px-3 py-1 rounded-full">
                      {pending.length} Pending
                    </span>
                  )}
                </div>
                <div className="flex flex-col divide-y divide-slate-100 max-h-[420px] overflow-y-auto">
                  {pending.length === 0 ? (
                    <p className="text-center text-slate-400 text-sm py-8">No notifications yet.</p>
                  ) : (
                    pending.map((p) => (
                      <button
                        key={p.ap_id}
                        onClick={() => { setActiveNav("home"); setShowNotifs(false); }}
                        className="flex items-start gap-3 px-5 py-4 bg-slate-50 hover:bg-slate-100 text-left border-none cursor-pointer w-full"
                      >
                        <div className="w-10 h-10 min-w-[2.5rem] rounded-xl flex items-center justify-center text-lg bg-teal-100">
                          🏢
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <span className="text-[0.88rem] font-bold text-[#0f172a]">New Company Registration</span>
                            {p.date_created && <span className="text-[0.75rem] text-slate-400">{p.date_created}</span>}
                          </div>
                          <p className="text-[0.78rem] text-slate-500">
                            <span className="font-semibold">{p.company_name}</span> is awaiting your approval.
                          </p>
                        </div>
                        <div className="w-2 h-2 rounded-full bg-orange-400 mt-1.5" />
                      </button>
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </div>
        <div className="flex items-center gap-6">
          <button
            onClick={() => setActiveNav("home")}
            className={`text-base font-semibold pb-1 bg-transparent border-0 border-b-2 border-solid cursor-pointer transition-colors ${
              activeNav === "home" ? "text-white border-sky-400" : "text-slate-400 border-transparent"
            }`}
          >
            Home
          </button>
          <button
            onClick={() => setActiveNav("companies")}
            className={`text-base font-semibold pb-1 bg-transparent border-0 border-b-2 border-solid cursor-pointer transition-colors ${
              activeNav === "companies" ? "text-white border-sky-400" : "text-slate-400 border-transparent"
            }`}
          >
            Companies
          </button>
          <button
            onClick={() => setActiveNav("metrics")}
            className={`text-base font-semibold pb-1 bg-transparent border-0 border-b-2 border-solid cursor-pointer transition-colors ${
              activeNav === "metrics" ? "text-white border-sky-400" : "text-slate-400 border-transparent"
            }`}
          >
            Metrics
          </button>
          <button
            onClick={() => setActiveNav("admins")}
            className={`text-base font-semibold pb-1 bg-transparent border-0 border-b-2 border-solid cursor-pointer transition-colors ${
              activeNav === "admins" ? "text-white border-sky-400" : "text-slate-400 border-transparent"
            }`}
          >
            Admins
          </button>
          <button
            onClick={() => { logout(); navigate("/"); }}
            className="flex items-center gap-1 text-red-400 hover:text-red-300 text-sm font-medium bg-transparent border-none cursor-pointer"
          >
            <LogoutIcon style={{ fontSize: 18 }} />
            Sign out
          </button>
        </div>
      </nav>

      <div className="max-w-[1200px] mx-auto px-6 py-6">

        {activeNav === "metrics" && (
          <div
            className="bg-white rounded-3xl p-8 border-2 border-[#0B2447] flex flex-col"
            style={{ boxShadow: "6px 6px 0px #0B2447", height: "calc(100vh - 104px)", overflow: "hidden" }}
          >
            <div
              className="font-extrabold text-[#0B2447] rounded-full border-2 border-[#0B2447] text-lg px-6 h-[50px] flex items-center justify-center mb-6 shrink-0 self-start"
              style={{ boxShadow: "3px 3px 0px #0B2447" }}
            >
              Platform Metrics
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto pr-1 flex flex-col gap-5">
              {metricsLoading ? (
                <p className="text-slate-400 text-sm">Loading metrics...</p>
              ) : (
                <>
                  <MetricsView metrics={adminMetrics?.overall} title="Across all companies" />

                  <div className="bg-white border-2 border-slate-200 rounded-2xl p-4">
                    <p className="text-[0.7rem] font-bold uppercase tracking-wide text-slate-400 m-0 mb-2">By company</p>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs border-collapse">
                        <thead>
                          <tr className="text-left text-slate-400">
                            {["Company", "Evaluated", "Shortlist %", "Hired", "Avg Score", "Avg TTS", "Avg TTF"].map((h) => (
                              <th key={h} className="py-1.5 px-2 font-bold whitespace-nowrap border-b border-slate-200">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {(adminMetrics?.companies || []).length === 0 ? (
                            <tr><td colSpan={7} className="py-4 text-center text-slate-400">No data yet.</td></tr>
                          ) : adminMetrics.companies.map((c) => (
                            <tr key={c.company_id} className="border-b border-slate-100">
                              <td className="py-1.5 px-2 font-semibold text-[#0B2447] whitespace-nowrap">{c.company_name}</td>
                              <td className="py-1.5 px-2 tabular-nums">{c.total_evaluated}</td>
                              <td className="py-1.5 px-2 tabular-nums">{c.shortlist_rate != null ? `${c.shortlist_rate}%` : "—"}</td>
                              <td className="py-1.5 px-2 tabular-nums">{c.hired}</td>
                              <td className="py-1.5 px-2 tabular-nums">{c.avg_hire_score ?? "—"}</td>
                              <td className="py-1.5 px-2 tabular-nums">{fmtHours(c.avg_time_to_shortlist_hours)}</td>
                              <td className="py-1.5 px-2 tabular-nums">{fmtHours(c.avg_time_to_fill_hours)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <AiLogTable logs={adminLogs} model={adminMetrics?.model} />
                </>
              )}
            </div>
          </div>
        )}

        {activeNav === "admins" && (
          <div
            className="bg-white rounded-3xl p-8 border-2 border-[#0B2447] flex flex-col"
            style={{ boxShadow: "6px 6px 0px #0B2447", height: "calc(100vh - 104px)", overflow: "hidden" }}
          >
            <div className="flex items-center justify-between mb-6 shrink-0 gap-4 flex-wrap">
              <div
                className="font-extrabold text-[#0B2447] rounded-full border-2 border-[#0B2447] text-lg px-6 h-[50px] flex items-center justify-center"
                style={{ boxShadow: "3px 3px 0px #0B2447" }}
              >
                Admin Users
              </div>
              <button
                onClick={() => { setAdminForm({ username: "", email: "", password: "" }); setShowAddAdmin(true); }}
                className="bg-[#0B2447] hover:bg-[#162553] text-white font-bold text-sm px-5 py-2.5 rounded-full border-none cursor-pointer"
              >
                + Add Admin
              </button>
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto pr-1">
              {adminsLoading ? (
                <p className="text-slate-400 text-sm">Loading admins...</p>
              ) : adminUsers.length === 0 ? (
                <p className="text-slate-400 text-sm">No admin users.</p>
              ) : (
                <div className="flex flex-col gap-3">
                  {adminUsers.map((a) => (
                    <div key={a.admin_id} className="flex items-center gap-4 bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4">
                      <div className="w-10 h-10 rounded-full bg-[#0B2447] text-white flex items-center justify-center font-bold shrink-0">
                        {(a.admin_username || "A").slice(0, 2).toUpperCase()}
                      </div>
                      <div className="flex flex-col min-w-0 flex-1">
                        <span className="font-bold text-[#0B2447] text-sm truncate">
                          {a.admin_username}
                          {a.is_self && <span className="ml-2 text-[0.65rem] font-black bg-teal-100 text-teal-700 rounded-full px-2 py-0.5">You</span>}
                        </span>
                        <span className="text-xs text-slate-500 truncate">{a.admin_email}</span>
                      </div>
                      <button
                        onClick={() => setDeleteAdmin(a)}
                        disabled={a.is_self}
                        title={a.is_self ? "You can't remove your own account" : "Remove admin"}
                        className="text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-full px-4 py-2 border-2 border-red-200 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeNav === "home" && (
          <div
            className="bg-white rounded-3xl p-8 border-2 border-[#0B2447] flex flex-col"
            style={{ boxShadow: "6px 6px 0px #0B2447", height: "calc(100vh - 104px)", overflow: "hidden" }}
          >
            <div
              className="font-extrabold text-[#0B2447] rounded-full border-2 border-[#0B2447] text-lg w-[200px] h-[50px] flex items-center justify-center mb-6 shrink-0"
              style={{ boxShadow: "3px 3px 0px #0B2447" }}
            >
              Dashboard
            </div>

            <div className="grid grid-cols-4 gap-4 mb-6 max-[900px]:grid-cols-2 shrink-0">
              {[
                { label: "Total Companies",    value: totalCompaniesCount,          sub: "approved",      color: "text-teal-500" },
                { label: "Pending Approval",   value: pending.length,               sub: "Needs Review",  color: "text-orange-500" },
                { label: "Active Subscription",value: activeSubscriptionCount,      sub: "Total",         color: "text-teal-500" },
                { label: "Revoked Accounts",   value: stats?.revoked || 0,          sub: "Total",         color: "text-red-500" },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-2xl p-5 border"
                  style={{ backgroundColor: "#e6fbf8", borderColor: "#b2f0e6" }}
                >
                  <p className="text-xs font-semibold text-slate-500 mb-1">{stat.label}</p>
                  <p className="text-3xl font-extrabold text-[#0B2447]">{stat.value}</p>
                  <p className={`text-xs font-semibold mt-1 ${stat.color}`}>{stat.sub}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 grid-rows-1 gap-6 max-[900px]:grid-cols-1 flex-1 min-h-0">
              <div className="border-2 border-slate-200 rounded-2xl p-5 flex flex-col min-h-0">
                <div className="overflow-y-auto flex-1 min-h-0 pr-1 flex flex-col gap-6">
                <div>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="font-extrabold text-[#0B2447] text-base">Pending Companies Approval</h2>
                  {pending.length > 0 && (
                    <span className="bg-orange-100 text-orange-600 text-xs font-bold px-3 py-1 rounded-full">
                      {pending.length} Pending
                    </span>
                  )}
                </div>
                {pending.length === 0 ? (
                  <p className="text-slate-400 text-sm">No pending companies.</p>
                ) : (
                  <div className="flex flex-col gap-3">
                    {pending.map((p) => (
                      <div key={p.ap_id} className="bg-slate-50 rounded-xl p-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden flex items-center justify-center shrink-0">
                            {p.company_logo ? (
                              <img src={p.company_logo} alt={p.company_name} className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-slate-400 font-bold text-sm">
                                {p.company_name?.charAt(0)}
                              </span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-[#0B2447] text-sm truncate">{p.company_name}</p>
                            <p className="text-xs text-slate-400">Registered {p.date_created}</p>
                          </div>
                          <div className="flex flex-col gap-1">
                            <button
                              onClick={() => handleApproveReject(p.ap_id, "approved")}
                              className="bg-green-500 hover:bg-green-600 text-white text-xs font-bold rounded-full px-3 py-1 border-none cursor-pointer"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => setConfirmAction({ type: "reject", apId: p.ap_id, name: p.company_name })}
                              className="bg-red-500 hover:bg-red-600 text-white text-xs font-bold rounded-full px-3 py-1 border-none cursor-pointer"
                            >
                              Reject
                            </button>
                          </div>
                        </div>

                        <button
                          onClick={() => toggleDocs(p.id)}
                          className="flex items-center gap-1 text-xs font-bold text-teal-600 hover:text-teal-700 bg-transparent border-none cursor-pointer mt-2"
                        >
                          <DescriptionIcon style={{ fontSize: 14 }} />
                          View Documents
                          {expandedDocs === p.id ? (
                            <ExpandLessIcon style={{ fontSize: 16 }} />
                          ) : (
                            <ExpandMoreIcon style={{ fontSize: 16 }} />
                          )}
                        </button>

                        {expandedDocs === p.id && <DocumentsList companyId={p.id} />}
                      </div>
                    ))}
                  </div>
                )}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="font-extrabold text-[#0B2447] text-base">Pending Change Plans</h2>
                    {pendingPlans.length > 0 && (
                      <span className="bg-orange-100 text-orange-600 text-xs font-bold px-3 py-1 rounded-full">
                        {pendingPlans.length} Pending
                      </span>
                    )}
                  </div>
                  {pendingPlans.length === 0 ? (
                    <p className="text-slate-400 text-sm">No pending plan changes.</p>
                  ) : (
                    <div className="flex flex-col gap-3">
                      {pendingPlans.map((p) => (
                        <div key={p.id} className="bg-slate-50 rounded-xl p-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden flex items-center justify-center shrink-0">
                              {p.company_logo ? (
                                <img src={p.company_logo} alt={p.company_name} className="w-full h-full object-cover" />
                              ) : (
                                <span className="text-slate-400 font-bold text-sm">{p.company_name?.charAt(0)}</span>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-[#0B2447] text-sm truncate">{p.company_name}</p>
                              <p className="text-xs text-slate-400 capitalize">{p.current_plan} → {p.requested_plan}</p>
                            </div>
                            <div className="flex flex-col gap-1">
                              <button
                                onClick={() => handlePlanDecision(p.id, "approved")}
                                className="bg-green-500 hover:bg-green-600 text-white text-xs font-bold rounded-full px-3 py-1 border-none cursor-pointer"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handlePlanDecision(p.id, "rejected")}
                                className="bg-red-500 hover:bg-red-600 text-white text-xs font-bold rounded-full px-3 py-1 border-none cursor-pointer"
                              >
                                Reject
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                </div>
              </div>

              <div className="border-2 border-slate-200 rounded-2xl p-5 flex flex-col min-h-0">
                <h2 className="font-extrabold text-[#0B2447] text-base mb-4 shrink-0">Subscription Status</h2>
                <div className="grid grid-cols-2 gap-3 overflow-y-auto flex-1 min-h-0 pr-1 content-start">
                  {[...approvedCompanies]
                    .sort((a, b) => new Date(a.subscription_expiry || 0) - new Date(b.subscription_expiry || 0))
                    .map((c) => (
                    <div key={c.id} className="bg-slate-50 rounded-xl p-3 flex items-center gap-2">
                      <div className="w-9 h-9 rounded-lg bg-slate-200 overflow-hidden flex items-center justify-center shrink-0">
                        {c.company_logo ? (
                          <img src={c.company_logo} alt={c.company_name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-slate-400 font-bold text-xs">{c.company_name?.charAt(0)}</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-[#0B2447] text-xs truncate">{c.company_name}</p>
                        <p className="text-[0.7rem] text-slate-400">Plan: {c.subscription_plan}</p>
                        <p className="text-[0.7rem] text-slate-400">Expires {c.subscription_expiry}</p>
                      </div>
                      <div className="flex flex-col gap-1 items-end">
                        <span className={`text-white text-[0.65rem] font-bold px-2 py-0.5 rounded-full capitalize ${getSubStatusColor(c.subscription_status)}`}>
                          {c.subscription_status}
                        </span>
                        <button
                          onClick={() => setConfirmAction({ type: "revoke", id: c.id, name: c.company_name })}
                          className="text-[0.65rem] font-bold text-white bg-red-500 hover:bg-red-600 rounded-full px-2 py-0.5 border-none cursor-pointer"
                        >
                          Revoke
                        </button>
                      </div>
                    </div>
                  ))}
                  {approvedCompanies.length === 0 && (
                    <p className="text-slate-400 text-sm col-span-2">No approved companies.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeNav === "companies" && (
          <div
            className="bg-white rounded-3xl p-8 border-2 border-[#0B2447] flex flex-col"
            style={{ boxShadow: "6px 6px 0px #0B2447", height: "calc(100vh - 104px)", overflow: "hidden" }}
          >
            <div className="flex items-center justify-between mb-6 flex-wrap gap-4 shrink-0">
              <div
                className="font-extrabold text-[#0B2447] rounded-full border-2 border-[#0B2447] text-lg w-[200px] h-[50px] flex items-center justify-center"
                style={{ boxShadow: "3px 3px 0px #0B2447" }}
              >
                Companies
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <select
                    value={companySort}
                    onChange={(e) => setCompanySort(e.target.value)}
                    className="appearance-none border-2 border-[#0B2447] rounded-full pl-4 pr-10 py-2 text-sm font-semibold text-[#0B2447] bg-white outline-none cursor-pointer"
                  >
                    <option value="name">Sort: Name (A–Z)</option>
                    <option value="expiry">Sort: Expiry date</option>
                  </select>
                  <KeyboardArrowDownIcon className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#0B2447]" style={{ fontSize: 20 }} />
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
            </div>

            <div className="overflow-y-auto flex-1 min-h-0 pr-1">
            <h3 className="font-bold text-[#0B2447] text-sm mb-3">Active</h3>
            <div className="grid grid-cols-2 gap-4 max-[700px]:grid-cols-1 mb-8 items-start">
              {sortCompanies(filteredCompanies.filter((c) => c.approval_status === "approved")).map((c) => (
                <div
                  key={c.id}
                  className="bg-slate-50 rounded-2xl p-4 border border-slate-200"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-xl bg-slate-200 overflow-hidden flex items-center justify-center shrink-0">
                      {c.company_logo ? (
                        <img src={c.company_logo} alt={c.company_name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-slate-400 font-bold text-lg">{c.company_name?.charAt(0)}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-[#0B2447] text-sm truncate">{c.company_name}</p>
                        <span className={`text-white text-[0.65rem] font-bold px-2 py-0.5 rounded-full shrink-0 capitalize ${getSubStatusColor(c.subscription_status)}`}>
                          {c.subscription_status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500">Plan: {c.subscription_plan}</p>
                      <p className="text-xs text-slate-400">Expires {c.subscription_expiry}</p>
                      <p className="text-xs text-slate-400">{c.active_employees} employees active</p>
                    </div>
                    <div className="flex flex-col gap-1 items-end">
                      <button
                        onClick={() => setConfirmAction({ type: "revoke", id: c.id, name: c.company_name })}
                        className="text-xs font-bold text-white bg-red-500 hover:bg-red-600 rounded-full px-3 py-1 border-none cursor-pointer"
                      >
                        Revoke
                      </button>
                      <button
                        onClick={() => setPlanModal({
                          id: c.id,
                          name: c.company_name,
                          plan: (c.subscription_plan || "free").toLowerCase(),
                          expiry: toDateInput(c.subscription_expiry),
                        })}
                        className="text-[0.7rem] font-semibold text-[#0B2447] border border-slate-300 rounded-md px-2 py-1 bg-white hover:bg-slate-50 cursor-pointer outline-none"
                      >
                        Change Plan
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={() => toggleDocs(c.id)}
                    className="flex items-center gap-1 text-xs font-bold text-teal-600 hover:text-teal-700 bg-transparent border-none cursor-pointer mt-2"
                  >
                    <DescriptionIcon style={{ fontSize: 14 }} />
                    View Documents
                    {expandedDocs === c.id ? (
                      <ExpandLessIcon style={{ fontSize: 16 }} />
                    ) : (
                      <ExpandMoreIcon style={{ fontSize: 16 }} />
                    )}
                  </button>

                  {expandedDocs === c.id && <DocumentsList companyId={c.id} />}
                </div>
              ))}
              {filteredCompanies.filter((c) => c.approval_status === "approved").length === 0 && (
                <p className="text-slate-400 text-sm col-span-2">No active companies.</p>
              )}
            </div>

            <h3 className="font-bold text-red-500 text-sm mb-3">Revoked</h3>
            <div className="grid grid-cols-2 gap-4 max-[700px]:grid-cols-1 items-start">
              {filteredCompanies.filter((c) => c.approval_status === "rejected").map((c) => (
                <div
                  key={c.id}
                  className="bg-red-50 rounded-2xl p-4 border border-red-200"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-xl bg-slate-200 overflow-hidden flex items-center justify-center shrink-0">
                      {c.company_logo ? (
                        <img src={c.company_logo} alt={c.company_name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-slate-400 font-bold text-lg">{c.company_name?.charAt(0)}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-[#0B2447] text-sm truncate">{c.company_name}</p>
                        <span className="text-white text-[0.65rem] font-bold px-2 py-0.5 rounded-full shrink-0 bg-red-500">
                          Revoked
                        </span>
                      </div>
                      <p className="text-xs text-slate-500">Plan: {c.subscription_plan}</p>
                      <p className="text-xs text-slate-400">Expires {c.subscription_expiry}</p>
                      <p className="text-xs text-slate-400">{c.active_employees} employees active</p>
                    </div>
                    <div className="flex flex-col gap-1">
                      <button
                        onClick={() => setConfirmAction({ type: "restore", id: c.id, name: c.company_name })}
                        className="text-xs font-bold text-white bg-[#0B2447] hover:bg-[#162553] rounded-full px-3 py-1 border-none cursor-pointer"
                      >
                        Restore
                      </button>
                      <button
                        onClick={() => setConfirmAction({ type: "delete", id: c.id, name: c.company_name })}
                        className="text-xs font-bold text-white bg-red-500 hover:bg-red-600 rounded-full px-3 py-1 border-none cursor-pointer"
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={() => toggleDocs(c.id)}
                    className="flex items-center gap-1 text-xs font-bold text-teal-600 hover:text-teal-700 bg-transparent border-none cursor-pointer mt-2"
                  >
                    <DescriptionIcon style={{ fontSize: 14 }} />
                    View Documents
                    {expandedDocs === c.id ? (
                      <ExpandLessIcon style={{ fontSize: 16 }} />
                    ) : (
                      <ExpandMoreIcon style={{ fontSize: 16 }} />
                    )}
                  </button>

                  {expandedDocs === c.id && <DocumentsList companyId={c.id} />}
                </div>
              ))}
              {filteredCompanies.filter((c) => c.approval_status === "rejected").length === 0 && (
                <p className="text-slate-400 text-sm col-span-2">No revoked companies.</p>
              )}
            </div>
            </div>
          </div>
        )}
      </div>

      {previewDoc && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ backgroundColor: "rgba(0,0,0,0.7)" }}
          onClick={() => setPreviewDoc(null)}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-3xl flex flex-col overflow-hidden"
            style={{ height: "85vh", border: "2px solid #1a1a2e", boxShadow: "8px 8px 0px #000000" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 shrink-0">
              <h3 className="font-bold text-[#0B2447] text-base m-0">
                {previewDoc.document_name || previewDoc.document_type}
              </h3>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => openDocInNewTab(previewDoc)}
                  className="text-xs font-bold text-teal-600 hover:text-teal-700 bg-transparent border-none cursor-pointer"
                >
                  Open in New Tab
                </button>
                <button
                  onClick={() => downloadDoc(previewDoc)}
                  className="text-xs font-bold text-[#0B2447] hover:text-teal-600 bg-transparent border-none cursor-pointer"
                >
                  Download
                </button>
                <button
                  onClick={() => setPreviewDoc(null)}
                  className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-300 hover:bg-slate-100 transition bg-transparent cursor-pointer"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-auto bg-slate-100">
              {previewDoc.document_url.match(/\.(jpg|jpeg|png|gif|webp)(\?|$)/i) ? (
                <img
                  src={previewDoc.document_url}
                  alt={previewDoc.document_name}
                  className="w-full h-full object-contain"
                />
              ) : (
                <iframe
                  src={`https://docs.google.com/viewer?url=${encodeURIComponent(previewDoc.document_url)}&embedded=true`}
                  title={previewDoc.document_name}
                  className="w-full h-full border-none"
                />
              )}
            </div>
          </div>
        </div>
      )}

      {confirmAction && (() => {
        const cfg = {
          revoke:  { title: "Revoke Company",  msg: `Revoke "${confirmAction.name}"? They'll be moved to Revoked and dropped to the free tier.`, label: "Revoke",  color: "bg-red-500 hover:bg-red-600" },
          restore: { title: "Restore Company", msg: `Restore "${confirmAction.name}" back to active?`,                                          label: "Restore", color: "bg-[#0B2447] hover:bg-[#162553]" },
          delete:  { title: "Delete Company",  msg: `Permanently delete "${confirmAction.name}"? This cannot be undone.`,                       label: "Delete",  color: "bg-red-500 hover:bg-red-600" },
          reject:  { title: "Reject Company",  msg: `Reject and permanently remove "${confirmAction.name}"? This cannot be undone.`,             label: "Reject",  color: "bg-red-500 hover:bg-red-600" },
        }[confirmAction.type];
        return (
          <div
            className="fixed inset-0 z-[60] flex items-center justify-center px-4"
            style={{ backgroundColor: "rgba(0,0,0,0.6)" }}
            onClick={() => { setConfirmAction(null); setRevokeReason(""); }}
          >
            <div
              className="bg-white rounded-2xl w-full max-w-sm p-6"
              style={{ border: "2px solid #1a1a2e", boxShadow: "8px 8px 0px #000000" }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-bold text-[#0B2447] mb-2">{cfg.title}</h3>
              <p className="text-sm text-slate-500 mb-4">{cfg.msg}</p>
              {confirmAction.type === "revoke" && (
                <div className="mb-6">
                  <label className="block text-xs font-bold text-[#0B2447] mb-1">Reason for revoking <span className="text-red-500">*</span></label>
                  <textarea
                    value={revokeReason}
                    onChange={(e) => setRevokeReason(e.target.value)}
                    rows={3}
                    placeholder="e.g. Terms of service violation, non-payment, fraudulent documents…"
                    className="w-full border-2 border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-red-400 resize-none"
                  />
                  <p className="text-[0.7rem] text-slate-400 mt-1">Recorded in the audit log and included in the company's notice email.</p>
                </div>
              )}
              <div className="flex gap-3">
                <button
                  onClick={runConfirm}
                  disabled={confirmAction.type === "revoke" && !revokeReason.trim()}
                  className={`flex-1 text-white font-bold py-2.5 rounded-lg transition border-none cursor-pointer disabled:opacity-50 ${cfg.color}`}
                >
                  {cfg.label}
                </button>
                <button
                  onClick={() => { setConfirmAction(null); setRevokeReason(""); }}
                  className="flex-1 border-2 border-slate-300 text-slate-600 font-bold py-2.5 rounded-lg hover:bg-slate-50 transition bg-white cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {showAddAdmin && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center px-4" style={{ backgroundColor: "rgba(0,0,0,0.6)" }} onClick={() => setShowAddAdmin(false)}>
          <div className="bg-white rounded-2xl w-full max-w-sm p-6" style={{ border: "2px solid #1a1a2e", boxShadow: "8px 8px 0px #000000" }} onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-[#0B2447] mb-4">Add Admin</h3>
            <label className="block text-xs font-bold text-[#0B2447] mb-1">Username</label>
            <input value={adminForm.username} onChange={(e) => setAdminForm((f) => ({ ...f, username: e.target.value }))} className="w-full border-2 border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#0B2447] mb-3" />
            <label className="block text-xs font-bold text-[#0B2447] mb-1">Email</label>
            <input type="email" value={adminForm.email} onChange={(e) => setAdminForm((f) => ({ ...f, email: e.target.value }))} className="w-full border-2 border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#0B2447] mb-3" />
            <label className="block text-xs font-bold text-[#0B2447] mb-1">Password</label>
            <input type="password" value={adminForm.password} onChange={(e) => setAdminForm((f) => ({ ...f, password: e.target.value }))} placeholder="At least 8 characters" className="w-full border-2 border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#0B2447] mb-5" />
            <div className="flex gap-3">
              <button onClick={handleAddAdmin} disabled={savingAdmin} className="flex-1 bg-[#0B2447] hover:bg-[#162553] text-white font-bold py-2.5 rounded-lg border-none cursor-pointer disabled:opacity-50">{savingAdmin ? "Adding..." : "Add Admin"}</button>
              <button onClick={() => setShowAddAdmin(false)} className="flex-1 border-2 border-slate-300 text-slate-600 font-bold py-2.5 rounded-lg hover:bg-slate-50 bg-white cursor-pointer">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {deleteAdmin && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center px-4" style={{ backgroundColor: "rgba(0,0,0,0.6)" }} onClick={() => setDeleteAdmin(null)}>
          <div className="bg-white rounded-2xl w-full max-w-sm p-6" style={{ border: "2px solid #1a1a2e", boxShadow: "8px 8px 0px #000000" }} onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-[#0B2447] mb-2">Remove Admin</h3>
            <p className="text-sm text-slate-500 mb-6">Remove <b>{deleteAdmin.admin_username}</b> as an admin? They will no longer be able to sign in.</p>
            <div className="flex gap-3">
              <button onClick={() => handleDeleteAdmin(deleteAdmin.admin_id)} className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-2.5 rounded-lg border-none cursor-pointer">Remove</button>
              <button onClick={() => setDeleteAdmin(null)} className="flex-1 border-2 border-slate-300 text-slate-600 font-bold py-2.5 rounded-lg hover:bg-slate-50 bg-white cursor-pointer">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {planModal && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center px-4"
          style={{ backgroundColor: "rgba(0,0,0,0.6)" }}
          onClick={() => setPlanModal(null)}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-sm p-6"
            style={{ border: "2px solid #1a1a2e", boxShadow: "8px 8px 0px #000000" }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-[#0B2447] mb-1">Change Plan</h3>
            <p className="text-sm text-slate-500 mb-4 truncate">{planModal.name}</p>

            <label className="block text-xs font-bold text-[#0B2447] mb-2">Plan</label>
            <div className="grid grid-cols-3 gap-2 mb-5">
              {["free", "standard", "enterprise"].map((p) => (
                <button
                  key={p}
                  onClick={() => setPlanModal((m) => ({ ...m, plan: p }))}
                  className={`capitalize text-xs font-bold py-2 rounded-lg border-2 transition cursor-pointer ${
                    planModal.plan === p
                      ? "bg-[#0B2447] text-white border-[#0B2447]"
                      : "bg-white text-slate-600 border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>

            <label className="block text-xs font-bold text-[#0B2447] mb-2">Expires On</label>
            <input
              type="date"
              value={planModal.expiry}
              min={toDateInput(new Date())}
              onChange={(e) => setPlanModal((m) => ({ ...m, expiry: e.target.value }))}
              className="w-full border-2 border-slate-300 rounded-lg px-3 py-2 text-sm text-[#0B2447] outline-none focus:border-[#0B2447] mb-6"
            />

            <div className="flex gap-3">
              <button
                onClick={() => setPlanModal(null)}
                className="flex-1 border-2 border-slate-300 text-slate-600 font-bold py-2.5 rounded-lg hover:bg-slate-50 transition bg-white cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (!planModal.expiry) { window.showAlert("Please pick an expiry date."); return; }
                  handleSetPlan(planModal.id, planModal.plan, planModal.expiry);
                  setPlanModal(null);
                }}
                className="flex-1 text-white font-bold py-2.5 rounded-lg transition border-none cursor-pointer bg-[#0B2447] hover:bg-[#162553]"
              >
                Change Plan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}