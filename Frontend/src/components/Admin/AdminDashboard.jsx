import { useState, useEffect } from "react";
import { useAuth } from "../../.Context/AuthContext";
import { useNavigate } from "react-router";
import SearchIcon from "@mui/icons-material/Search";
import NotificationsNoneIcon from "@mui/icons-material/NotificationsNone";
import LogoutIcon from "@mui/icons-material/Logout";
import DescriptionIcon from "@mui/icons-material/Description";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import { API_BASE_URL } from "../../api";

export default function AdminDashboard() {
  const { auth, logout } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats]           = useState(null);
  const [pending, setPending]       = useState([]);
  const [companies, setCompanies]   = useState([]);
  const [search, setSearch]         = useState("");
  const [loading, setLoading]       = useState(true);
  const [activeNav, setActiveNav]   = useState("home");
  const [docsByCompany, setDocsByCompany] = useState({});
  const [expandedDocs, setExpandedDocs]   = useState(null);
  const [previewDoc, setPreviewDoc]       = useState(null);
  const [showNotifs, setShowNotifs]       = useState(false);
  const [confirmAction, setConfirmAction] = useState(null); // { type: "revoke"|"restore"|"delete", id, name }

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    try {
      const headers = { Authorization: `Bearer ${auth.token}` };

      const [statsRes, pendingRes, companiesRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/admin/dashboard/`, { headers }),
        fetch(`${API_BASE_URL}/api/admin/companies/pending/`, { headers }),
        fetch(`${API_BASE_URL}/api/admin/companies/`, { headers }),
      ]);

      const statsData     = await statsRes.json();
      const pendingData   = await pendingRes.json();
      const companiesData = await companiesRes.json();

      setStats(statsData);
      setPending(Array.isArray(pendingData) ? pendingData : []);
      setCompanies(Array.isArray(companiesData) ? companiesData : []);
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
    } catch (err) { alert(err.message); }
  };

  const handleRevoke = async (company_id) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/companies/revoke/`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${auth.token}` },
        body: JSON.stringify({ company_id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      fetchAll();
    } catch (err) { alert(err.message); }
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
  } catch (err) { alert(err.message); }
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
  } catch (err) { alert(err.message); }
};

  const runConfirm = () => {
    if (!confirmAction) return;
    const { type, id, apId } = confirmAction;
    if (type === "revoke") handleRevoke(id);
    else if (type === "restore") handleRestore(id);
    else if (type === "delete") handleDelete(id);
    else if (type === "reject") handleApproveReject(apId, "rejected");
    setConfirmAction(null);
  };

  const filteredCompanies = companies.filter((c) =>
    c.company_name.toLowerCase().includes(search.toLowerCase())
  );

  // "Open in new tab" must VIEW the file, not download it. Images open directly;
  // everything else (PDFs, docs) goes through the Google Docs viewer so the
  // browser renders it in-tab instead of downloading the raw Supabase object.
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

  // Only approved companies count toward "Total Companies" and "Active Subscription".
  // Pending companies are tracked separately and shouldn't inflate these totals.
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
            onClick={() => { logout(); navigate("/"); }}
            className="flex items-center gap-1 text-red-400 hover:text-red-300 text-sm font-medium bg-transparent border-none cursor-pointer"
          >
            <LogoutIcon style={{ fontSize: 18 }} />
            Sign out
          </button>
        </div>
      </nav>

      <div className="max-w-[1200px] mx-auto px-6 py-6">

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
                { label: "Active Subscription",value: activeSubscriptionCount,      sub: "this week",     color: "text-teal-500" },
                { label: "Revoked Accounts",   value: stats?.revoked || 0,          sub: "this week",     color: "text-red-500" },
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
                <div className="flex items-center justify-between mb-4 shrink-0">
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
                  <div className="flex flex-col gap-3 overflow-y-auto flex-1 min-h-0 pr-1">
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

            <div className="overflow-y-auto flex-1 min-h-0 pr-1">
            {/* Active Companies */}
            <h3 className="font-bold text-[#0B2447] text-sm mb-3">Active</h3>
            <div className="grid grid-cols-2 gap-4 max-[700px]:grid-cols-1 mb-8 items-start">
              {filteredCompanies.filter((c) => c.approval_status === "approved").map((c) => (
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
                    <div className="flex flex-col gap-1">
                      <button
                        onClick={() => setConfirmAction({ type: "revoke", id: c.id, name: c.company_name })}
                        className="text-xs font-bold text-white bg-red-500 hover:bg-red-600 rounded-full px-3 py-1 border-none cursor-pointer"
                      >
                        Revoke
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

            {/* Revoked Companies */}
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
                <a
                  href={docOpenUrl(previewDoc)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-bold text-teal-600 hover:text-teal-700 no-underline"
                >
                  Open in new tab
                </a>
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

      {/* Confirmation modal — Revoke / Restore / Delete */}
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
            onClick={() => setConfirmAction(null)}
          >
            <div
              className="bg-white rounded-2xl w-full max-w-sm p-6"
              style={{ border: "2px solid #1a1a2e", boxShadow: "8px 8px 0px #000000" }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-bold text-[#0B2447] mb-2">{cfg.title}</h3>
              <p className="text-sm text-slate-500 mb-6">{cfg.msg}</p>
              <div className="flex gap-3">
                <button
                  onClick={runConfirm}
                  className={`flex-1 text-white font-bold py-2.5 rounded-lg transition border-none cursor-pointer ${cfg.color}`}
                >
                  {cfg.label}
                </button>
                <button
                  onClick={() => setConfirmAction(null)}
                  className="flex-1 border-2 border-slate-300 text-slate-600 font-bold py-2.5 rounded-lg hover:bg-slate-50 transition bg-white cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}