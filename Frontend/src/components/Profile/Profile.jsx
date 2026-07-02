import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "../../.Context/AuthContext";
import { supabase } from "../../.Context/supabaseClient";
import {
  ChangeProfilePictureModal,
  ChangePasswordModal,
  ChangeCompanyLogoModal,
  ChangeCompanyNameModal,
  ChangeCompanyPasswordModal,
  DeleteCompanyModal,
  ManageSubscriptionModal,
} from "./ProfileModals";
import { apiFetch, getErrorMessage } from "../../api";

const UserIcon = () => (
  <svg className="w-10 h-10 text-slate-400" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
  </svg>
);

const CompanyIcon = () => (
  <svg className="w-12 h-12" xmlns="http://www.w3.org/2000/svg" fill="#94a3b8" viewBox="0 0 24 24">
    <path d="M12 7V3H2v18h20V7H12zM6 19H4v-2h2v2zm0-4H4v-2h2v2zm0-4H4V9h2v2zm0-4H4V5h2v2zm4 12H8v-2h2v2zm0-4H8v-2h2v2zm0-4H8V9h2v2zm0-4H8V5h2v2zm10 12h-8v-2h2v-2h-2v-2h2v-2h-2V9h8v10zm-2-8h-2v2h2v-2zm0 4h-2v2h2v-2z" />
  </svg>
);

const STATUS_OPTIONS = [
  { value: "active",   label: "Active",   dot: "bg-green-400",  bg: "bg-green-50",  text: "text-green-700",  border: "border-green-200" },
  { value: "on_break", label: "On Break", dot: "bg-orange-400", bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-200" },
  { value: "on_leave", label: "On Leave", dot: "bg-red-400",    bg: "bg-red-50",    text: "text-red-700",    border: "border-red-200" },
];

export default function Profile() {
  const { auth, login, logout } = useAuth();
  const navigate = useNavigate();
  const role = auth.role;

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const statusRef = useRef(null);

  const [showPicModal, setShowPicModal]     = useState(false);
  const [newPicFile, setNewPicFile]         = useState(null);
  const [newPicPreview, setNewPicPreview]   = useState(null);
  const [uploadingPic, setUploadingPic]     = useState(false);

  const [showDotsMenu, setShowDotsMenu]   = useState(false);
  const dotsRef = useRef(null);
  const [showPassModal, setShowPassModal] = useState(false);

  const [showOwnerDotsMenu, setShowOwnerDotsMenu] = useState(false);
  const ownerDotsRef = useRef(null);

  const [showLogoModal, setShowLogoModal]     = useState(false);
  const [newLogoFile, setNewLogoFile]         = useState(null);
  const [newLogoPreview, setNewLogoPreview]   = useState(null);
  const [uploadingLogo, setUploadingLogo]     = useState(false);

  const [showCompanyNameModal, setShowCompanyNameModal]   = useState(false);
  const [showCompanyPassModal, setShowCompanyPassModal]   = useState(false);
  const [showOwnerPassModal, setShowOwnerPassModal]       = useState(false);
  const [showDeleteModal, setShowDeleteModal]             = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);

  // ── Interview Applicants (shortlisted / interview_sent evaluations) ──
  const [interviewApplicants, setInterviewApplicants] = useState([]);
  const [loadingApplicants, setLoadingApplicants]     = useState(true);
  const [applicantsError, setApplicantsError]         = useState("");
  const [selectedInterview, setSelectedInterview]     = useState(null);

  useEffect(() => {
    const endpoint = role === "owner" ? "/api/profile/owner/" : "/api/profile/hr/";
    (async () => {
      try {
        const data = await apiFetch(endpoint, { token: auth.token });
        setProfile(data);
      } catch {
        /* leave profile empty */
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    let cancelled = false;

    const fetchApplicants = async () => {
      setLoadingApplicants(true);
      setApplicantsError("");
      try {
        const data = await apiFetch("/api/evaluations/", { token: auth.token });
        if (cancelled) return;
        // Only applicants actually sent to interview (not merely shortlisted).
        // Owners and HR managers see every recruiter's interviews; an HR staff
        // only sees the interviews they personally sent.
        const canSeeAll = role === "owner" || role === "HRManager";
        const filtered = (data || []).filter((ev) => {
          if (ev.status !== "interview_sent") return false;
          if (canSeeAll) return true;
          return ev.action_made_by_user_id === auth.user_id;
        });
        setInterviewApplicants(filtered);
      } catch (err) {
        if (!cancelled) setApplicantsError(getErrorMessage(err, "Failed to load applicants."));
      } finally {
        if (!cancelled) setLoadingApplicants(false);
      }
    };

    fetchApplicants();
    return () => { cancelled = true; };
  }, [auth.token]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (statusRef.current && !statusRef.current.contains(e.target))
        setShowStatusMenu(false);
      if (dotsRef.current && !dotsRef.current.contains(e.target))
        setShowDotsMenu(false);
      if (ownerDotsRef.current && !ownerDotsRef.current.contains(e.target))
        setShowOwnerDotsMenu(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleStatusChange = async (newStatus) => {
    try {
      await apiFetch("/api/profile/update-status/", {
        method: "POST",
        token: auth.token,
        body: { status: newStatus },
      });
      setProfile((prev) => ({ ...prev, account_status: newStatus }));
      setShowStatusMenu(false);
    } catch (err) { alert(getErrorMessage(err)); }
  };

  const handlePicFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setNewPicFile(file);
    const reader = new FileReader();
    reader.onload = () => setNewPicPreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (!file) return;
    setNewPicFile(file);
    const reader = new FileReader();
    reader.onload = () => setNewPicPreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handlePicChange = async () => {
    if (!newPicFile) return;
    try {
      setUploadingPic(true);
      const fileExt = newPicFile.name.split(".").pop();
      const safeEmail = auth.email.replace(/[^a-zA-Z0-9_-]/g, "_");
      const fileName = `employee-profiles/${safeEmail}.${fileExt}`;

      const { data: existingFiles } = await supabase.storage.from("avatars").list("employee-profiles", { search: safeEmail });
      if (existingFiles && existingFiles.length > 0)
        await supabase.storage.from("avatars").remove(existingFiles.map((f) => `employee-profiles/${f.name}`));

      const { error: uploadError } = await supabase.storage.from("avatars").upload(fileName, newPicFile, { upsert: true });
      if (uploadError) throw new Error("Image upload failed: " + uploadError.message);

      const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(fileName);
      const publicUrl = `${urlData.publicUrl}?t=${Date.now()}`;

      await apiFetch("/api/profile/update-picture/", {
        method: "POST",
        token: auth.token,
        body: { profile_picture: publicUrl },
      });

      setProfile((prev) => ({ ...prev, profile_picture: publicUrl }));
      login({ ...auth, profile_picture: publicUrl });
      setShowPicModal(false);
      setNewPicFile(null);
      setNewPicPreview(null);
    } catch (err) {
      alert(err.message);
    } finally {
      setUploadingPic(false);
    }
  };

  const handleCancelPic = () => {
    setShowPicModal(false);
    setNewPicFile(null);
    setNewPicPreview(null);
  };

  const handleLogoFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setNewLogoFile(file);
    const reader = new FileReader();
    reader.onload = () => setNewLogoPreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleLogoDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (!file) return;
    setNewLogoFile(file);
    const reader = new FileReader();
    reader.onload = () => setNewLogoPreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleLogoChange = async () => {
    if (!newLogoFile) return;
    try {
      setUploadingLogo(true);
      const fileExt = newLogoFile.name.split(".").pop();
      const safeName = (profile?.company_name || "company").replace(/[^a-zA-Z0-9_-]/g, "_");
      const fileName = `company-logos/${safeName}.${fileExt}`;

      const { data: existingFiles } = await supabase.storage.from("avatars").list("company-logos", { search: safeName });
      if (existingFiles && existingFiles.length > 0)
        await supabase.storage.from("avatars").remove(existingFiles.map((f) => `company-logos/${f.name}`));

      const { error: uploadError } = await supabase.storage.from("avatars").upload(fileName, newLogoFile, { upsert: true });
      if (uploadError) throw new Error("Logo upload failed: " + uploadError.message);

      const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(fileName);
      const savedUrl   = urlData.publicUrl;
      const displayUrl = `${savedUrl}?t=${Date.now()}`;

      await apiFetch("/api/profile/update-company-logo/", {
        method: "POST",
        token: auth.token,
        body: { logo: savedUrl },
      });

      setProfile((prev) => ({ ...prev, logo: displayUrl }));
      setShowLogoModal(false);
      setNewLogoFile(null);
      setNewLogoPreview(null);
    } catch (err) {
      alert(err.message);
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleCancelLogo = () => {
    setShowLogoModal(false);
    setNewLogoFile(null);
    setNewLogoPreview(null);
  };

  const ownerMenuItems = [
    { label: "Change Company Logo",     action: () => { setShowOwnerDotsMenu(false); setShowLogoModal(true); } },
    { label: "Change Company Password", action: () => { setShowOwnerDotsMenu(false); setShowCompanyPassModal(true); } },
    { label: "Change Company Name",     action: () => { setShowOwnerDotsMenu(false); setShowCompanyNameModal(true); } },
    { label: "Change Password",         action: () => { setShowOwnerDotsMenu(false); setShowOwnerPassModal(true); } },
    { label: "Manage Subscription",     action: () => { setShowOwnerDotsMenu(false); setShowSubscriptionModal(true); } },
    { label: "Delete Company",          action: () => { setShowOwnerDotsMenu(false); setShowDeleteModal(true); }, danger: true },
  ];

  const currentStatus = STATUS_OPTIONS.find((s) => s.value === profile?.account_status) || STATUS_OPTIONS[0];

  if (loading) {
    return (
      <section
        className="px-4 pt-1 bg-[#0B2447] flex items-center justify-center"
        style={{ height: "calc(100vh - 56px)" }}
      >
        <p className="text-white text-sm">Loading profile...</p>
      </section>
    );
  }

  return (
    <section
      className="px-4 pt-1 bg-[#0B2447]"
      style={{ height: "calc(100vh - 56px)", display: "flex", flexDirection: "column", overflow: "hidden" }}
    >
      {/* ── White box ── */}
      <div
        className="max-w-[1200px] w-full mx-auto bg-white rounded-3xl pt-4 px-10 pb-6 border-2 border-[#0B2447]"
        style={{
          boxShadow: "6px 6px 0px #0B2447",
          flex: "1 1 0",
          minHeight: 0,
          display: "flex",
          flexDirection: "column",
          marginBottom: "1rem",
          overflow: "hidden",
        }}
      >
        {/* ── Scrollable inner area ── */}
        <div style={{ flex: "1 1 0", minHeight: 0, overflowY: "auto" }}>
          <div className="grid grid-cols-[1fr_380px] gap-6 items-start max-[900px]:grid-cols-1">

            {/* ── LEFT PANEL ── */}
            <div className="bg-[#f8fafc] rounded-[40px] p-8 min-h-[500px] border border-slate-200/20 flex flex-col gap-6">

              {/* ── HR Staff / Manager ── */}
              {(role === "HRStaff" || role === "HRManager") && (
                <>
                  <div className="flex items-start gap-5 relative">
                    {/* Avatar */}
                    <div
                      onClick={() => setShowPicModal(true)}
                      className="w-[120px] min-w-[120px] h-[120px] border-2 border-slate-200 rounded-2xl overflow-hidden bg-slate-100 flex items-center justify-center cursor-pointer relative group"
                    >
                      {profile?.profile_picture ? (
                        <img src={profile.profile_picture} alt="Profile" className="w-full h-full object-cover" />
                      ) : <UserIcon />}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-2xl">
                        <span className="text-white text-xs font-bold">Change</span>
                      </div>
                    </div>

                    {/* Info */}
                    <div className="flex flex-col gap-3 flex-1">
                      <div
                        className="font-extrabold text-[#0B2447] px-5 py-2 rounded-full border-2 border-[#0B2447] text-base self-start"
                        style={{ boxShadow: "3px 3px 0px #0B2447" }}
                      >
                        {profile?.firstname && profile?.lastname
                          ? `${profile.firstname} ${profile.lastname}`
                          : profile?.username || "No Name"}
                      </div>

                      {/* Status Dropdown */}
                      <div className="relative self-start" ref={statusRef}>
                        <button
                          onClick={() => setShowStatusMenu((v) => !v)}
                          className={`flex items-center gap-2 border rounded-full px-4 py-1.5 cursor-pointer transition-colors ${currentStatus.bg} ${currentStatus.border}`}
                        >
                          <span className={`w-2.5 h-2.5 rounded-full ${currentStatus.dot}`} />
                          <span className={`text-sm font-semibold ${currentStatus.text}`}>{currentStatus.label}</span>
                        </button>
                        {showStatusMenu && (
                          <div className="absolute left-0 top-10 bg-white rounded-2xl shadow-lg border border-slate-200 z-50 overflow-hidden min-w-[160px]">
                            {STATUS_OPTIONS.filter((s) => s.value !== profile?.account_status).map((s) => (
                              <button
                                key={s.value}
                                onClick={() => handleStatusChange(s.value)}
                                className={`flex items-center gap-2 w-full px-4 py-2.5 text-sm font-semibold cursor-pointer border-none transition-colors ${s.bg} ${s.text} hover:opacity-80`}
                              >
                                <span className={`w-2.5 h-2.5 rounded-full ${s.dot}`} />
                                {s.label}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      {profile?.birthdate && (
                        <div className="flex items-center gap-2 border border-slate-200 rounded-full px-4 py-1.5 self-start bg-white">
                          <span className="text-slate-400 text-sm">📅</span>
                          <span className="text-sm font-medium text-slate-600">{profile.birthdate}</span>
                        </div>
                      )}
                    </div>

                    {/* 3 dots menu — HR */}
                    <div className="absolute top-0 right-0" ref={dotsRef}>
                      <button
                        onClick={() => setShowDotsMenu((v) => !v)}
                        className="text-slate-400 text-xl font-bold px-2 cursor-pointer bg-transparent border-none hover:text-slate-600"
                      >
                        ⋯
                      </button>
                      {showDotsMenu && (
                        <div
                          className="absolute right-0 top-8 bg-white rounded-xl py-2 px-2 w-44 z-50"
                          style={{ border: "2px solid #1a1a2e", boxShadow: "3px 3px 0px #000000" }}
                        >
                          <button
                            onClick={() => { setShowDotsMenu(false); setShowPassModal(true); }}
                            className="w-full text-left px-3 py-2 text-sm font-semibold text-[#0B2447] hover:bg-slate-50 rounded-lg border-none bg-transparent cursor-pointer"
                          >
                            Change Password
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Bio */}
                  <div className="border-2 border-slate-200 rounded-[20px] p-6">
                    <textarea
                      value={profile?.bio || ""}
                      onChange={(e) => setProfile((prev) => ({ ...prev, bio: e.target.value }))}
                      onBlur={async (e) => {
                        try {
                          await apiFetch("/api/profile/update-bio/", {
                            method: "POST",
                            token: auth.token,
                            body: { bio: e.target.value },
                          });
                        } catch (err) { console.error(err); }
                      }}
                      placeholder="Tell us about yourself..."
                      className="w-full text-[0.9rem] text-slate-700 leading-[1.8] text-justify bg-transparent border-none outline-none resize-none min-h-[120px]"
                    />
                  </div>
                </>
              )}

              {/* ── Owner ── */}
              {role === "owner" && (
                <>
                  <div className="flex items-start gap-5 relative">
                    {/* Company logo */}
                    <div
                      onClick={() => setShowLogoModal(true)}
                      className="w-[120px] min-w-[120px] h-[120px] border-2 border-slate-200 rounded-2xl overflow-hidden bg-slate-100 flex items-center justify-center cursor-pointer relative group"
                    >
                      {profile?.logo ? (
                        <img src={profile.logo} alt="Company Logo" className="w-full h-full object-cover" />
                      ) : (
                        <CompanyIcon />
                      )}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-2xl">
                        <span className="text-white text-xs font-bold">Change Logo</span>
                      </div>
                    </div>

                    {/* Company name badge */}
                    <div className="flex flex-col gap-3 flex-1">
                      <div
                        className="font-extrabold text-[#0B2447] px-5 py-2 rounded-full border-2 border-[#0B2447] text-base self-start"
                        style={{ boxShadow: "3px 3px 0px #0B2447" }}
                      >
                        {profile?.company_name || "Company Name"}
                      </div>

                      {/* Subscription badge */}
                      <div className="flex items-center gap-2 border border-slate-200 rounded-full px-4 py-1.5 self-start bg-white">
                        <span className="text-sm font-semibold text-slate-600 capitalize">
                          {profile?.subscription_plan || "free"} plan
                        </span>
                        {profile?.subscription_expiry && (
                          <span className="text-xs text-slate-400">
                            · expires {profile.subscription_expiry}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* 3 dots menu — Owner */}
                    <div className="absolute top-0 right-0" ref={ownerDotsRef}>
                      <button
                        onClick={() => setShowOwnerDotsMenu((v) => !v)}
                        className="text-slate-400 text-xl font-bold px-2 cursor-pointer bg-transparent border-none hover:text-slate-600"
                      >
                        ⋯
                      </button>
                      {showOwnerDotsMenu && (
                        <div
                          className="absolute right-0 top-8 bg-white rounded-xl py-2 px-2 w-52 z-50"
                          style={{ border: "2px solid #1a1a2e", boxShadow: "3px 3px 0px #000000" }}
                        >
                          {ownerMenuItems.map(({ label, action, danger }) => (
                            <button
                              key={label}
                              onClick={action}
                              className={`w-full text-left px-3 py-2 text-sm font-semibold rounded-lg border-none bg-transparent cursor-pointer transition-colors ${
                                danger ? "text-red-500 hover:bg-red-50" : "text-[#0B2447] hover:bg-slate-50"
                              }`}
                            >
                              {label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Company description */}
                  <div className="border-2 border-slate-200 rounded-[20px] p-6">
                    <textarea
                      value={profile?.description || ""}
                      onChange={(e) => setProfile((prev) => ({ ...prev, description: e.target.value }))}
                      onBlur={async (e) => {
                        try {
                          await apiFetch("/api/profile/update-company-description/", {
                            method: "POST",
                            token: auth.token,
                            body: { description: e.target.value },
                          });
                        } catch (err) { console.error(err); }
                      }}
                      placeholder="Tell applicants about your company..."
                      className="w-full text-[0.9rem] text-slate-700 leading-[1.8] text-justify bg-transparent border-none outline-none resize-none min-h-[120px]"
                    />
                  </div>
                </>
              )}
            </div>

            {/* ── RIGHT PANEL ── */}
            <div className="bg-[#f8fafc] rounded-[40px] p-8 min-h-[500px] border border-slate-200/20 flex flex-col">
              <div
                className="font-extrabold text-[#0B2447] px-6 py-2.5 rounded-full border-2 border-[#0B2447] text-base tracking-wide self-start mb-6"
                style={{ boxShadow: "3px 3px 0px #0B2447" }}
              >
                For Interview Applicants
              </div>

              {loadingApplicants ? (
                <p className="text-slate-400 text-sm">Loading applicants...</p>
              ) : applicantsError ? (
                <p className="text-red-500 text-sm">{applicantsError}</p>
              ) : interviewApplicants.length > 0 ? (
                <div className="flex flex-col gap-4">
                  {interviewApplicants.map((applicant) => (
                    <div key={applicant.evaluation_id} className="flex flex-col gap-2">
                      {/* Job requirement label */}
                      <div className="flex items-center gap-1.5 text-[0.78rem] font-bold text-[#0B2447]">
                        <span>💼</span> {applicant.job_title || "Untitled Requirement"}
                      </div>

                      <button
                        onClick={() => setSelectedInterview(applicant)}
                        className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center gap-4 cursor-pointer text-left transition-colors hover:bg-slate-50"
                        style={{ border: "1px solid #e2e8f0" }}
                      >
                        <div className="w-[60px] min-w-[60px] h-[60px] bg-slate-200 rounded-[10px] overflow-hidden flex items-center justify-center">
                          <UserIcon />
                        </div>
                        <div className="flex flex-col gap-2 flex-1 min-w-0">
                          <span className="bg-slate-100 border border-slate-300 rounded-full px-4 py-1 text-[0.82rem] font-semibold text-[#0f172a] self-start truncate max-w-full">
                            {applicant.applicant_name}
                          </span>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="bg-slate-100 border border-slate-300 rounded-full px-4 py-1 text-[0.82rem] font-semibold text-[#0f172a]">
                              H!RE Score: <span className="text-green-500 font-bold">{applicant.hire_score}%</span>
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
              ) : (
                <p className="text-slate-400 text-sm">No applicants scheduled for interview yet.</p>
              )}
            </div>

          </div>
        </div>
      </div>

      {/* ══ Interview applicant detail modal ══ */}
      {selectedInterview && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
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
              {/* Interview date + location at the top */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 flex flex-col gap-1">
                {selectedInterview.interview_date && (
                  <p className="text-blue-700 m-0">
                    <span className="font-semibold">📅 Interview Date:</span>{" "}
                    {new Date(selectedInterview.interview_date).toLocaleString()}
                  </p>
                )}
                {selectedInterview.interview_location && (
                  <p className="text-blue-700 m-0 break-words">
                    <span className="font-semibold">📍 Location / Link:</span> {selectedInterview.interview_location}
                  </p>
                )}
              </div>

              {/* Requirement */}
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
                <span className="text-green-500 font-bold">{selectedInterview.hire_score}%</span>
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
                  <ul className="list-disc pl-5 m-0 text-slate-600">
                    {selectedInterview.pros.map((p, i) => <li key={i}>{p}</li>)}
                  </ul>
                </div>
              )}
              {selectedInterview.cons?.length > 0 && (
                <div>
                  <p className="font-semibold text-red-500 m-0 mb-1">Cons</p>
                  <ul className="list-disc pl-5 m-0 text-slate-600">
                    {selectedInterview.cons.map((c, i) => <li key={i}>{c}</li>)}
                  </ul>
                </div>
              )}
              <p className="text-slate-400 text-xs m-0">Handled by: {selectedInterview.action_made_by || "—"}</p>
            </div>
          </div>
        </div>
      )}

      {/* ══ HR Modals ══ */}
      {showPicModal && (
        <ChangeProfilePictureModal
          newPicPreview={newPicPreview}
          newPicFile={newPicFile}
          uploadingPic={uploadingPic}
          onFileChange={handlePicFileChange}
          onDrop={handleDrop}
          onConfirm={handlePicChange}
          onCancel={handleCancelPic}
        />
      )}

      {showPassModal && (
        <ChangePasswordModal
          initialEmail={auth.email || ""}
          onClose={() => setShowPassModal(false)}
        />
      )}

      {/* ══ Owner Modals ══ */}
      {showLogoModal && (
        <ChangeCompanyLogoModal
          newPicPreview={newLogoPreview}
          newPicFile={newLogoFile}
          uploadingPic={uploadingLogo}
          onFileChange={handleLogoFileChange}
          onDrop={handleLogoDrop}
          onConfirm={handleLogoChange}
          onCancel={handleCancelLogo}
        />
      )}

      {showCompanyNameModal && (
        <ChangeCompanyNameModal
          currentName={profile?.company_name || ""}
          token={auth.token}
          onSuccess={(newName) => {
            setProfile((prev) => ({ ...prev, company_name: newName }));
            setShowCompanyNameModal(false);
          }}
          onClose={() => setShowCompanyNameModal(false)}
        />
      )}

      {showCompanyPassModal && (
        <ChangeCompanyPasswordModal
          token={auth.token}
          onClose={() => setShowCompanyPassModal(false)}
        />
      )}

      {showOwnerPassModal && (
        <ChangePasswordModal
          initialEmail={auth.email || ""}
          onClose={() => setShowOwnerPassModal(false)}
        />
      )}

      {showSubscriptionModal && (
        <ManageSubscriptionModal
          currentPlan={profile?.subscription_plan || "free"}
          currentExpiry={profile?.subscription_expiry || ""}
          token={auth.token}
          onSuccess={(newPlan, newExpiry) => {
            setProfile((prev) => ({ ...prev, subscription_plan: newPlan, subscription_expiry: newExpiry }));
            setShowSubscriptionModal(false);
          }}
          onClose={() => setShowSubscriptionModal(false)}
        />
      )}

      {showDeleteModal && (
        <DeleteCompanyModal
          companyName={profile?.company_name || ""}
          token={auth.token}
          onSuccess={() => {
            logout();
            navigate("/");
          }}
          onClose={() => setShowDeleteModal(false)}
        />
      )}
    </section>
  );
}