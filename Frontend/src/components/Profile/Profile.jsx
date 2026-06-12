import { useState, useEffect, useRef } from "react";
import { useAuth } from "../../.Context/AuthContext";
import { supabase } from "../../.Context/supabaseClient";

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

// Change Password Modal Steps
const STEP_EMAIL    = "email";
const STEP_CODE     = "code";
const STEP_NEWPASS  = "newpass";
const STEP_CONFIRM  = "confirm";
const STEP_SUCCESS  = "success";

export default function Profile() {
  const { auth, login } = useAuth();
  const role = auth.role;

  const [profile, setProfile]       = useState(null);
  const [loading, setLoading]       = useState(true);
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const statusRef = useRef(null);

  // Picture modal
  const [showPicModal, setShowPicModal]   = useState(false);
  const [newPicFile, setNewPicFile]       = useState(null);
  const [newPicPreview, setNewPicPreview] = useState(null);
  const [uploadingPic, setUploadingPic]   = useState(false);
  const picInputRef = useRef(null);

  // Dots menu
  const [showDotsMenu, setShowDotsMenu] = useState(false);
  const dotsRef = useRef(null);

  // Change password modal
  const [showPassModal, setShowPassModal] = useState(false);
  const [passStep, setPassStep]           = useState(STEP_EMAIL);
  const [passEmail, setPassEmail]         = useState("");
  const [passCode, setPassCode]           = useState("");
  const [newPassword, setNewPassword]     = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passLoading, setPassLoading]     = useState(false);
  const [passError, setPassError]         = useState("");

  const interviewApplicants = [];

  useEffect(() => {
    const endpoint = role === "owner" ? "/api/profile/owner/" : "/api/profile/hr/";
    fetch(`http://localhost:8000${endpoint}`, {
      headers: { Authorization: `Bearer ${auth.token}` },
    })
      .then((res) => res.json())
      .then((data) => { setProfile(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (statusRef.current && !statusRef.current.contains(e.target))
        setShowStatusMenu(false);
      if (dotsRef.current && !dotsRef.current.contains(e.target))
        setShowDotsMenu(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleStatusChange = async (newStatus) => {
    try {
      const res = await fetch("http://localhost:8000/api/profile/update-status/", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${auth.token}` },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setProfile((prev) => ({ ...prev, account_status: newStatus }));
      setShowStatusMenu(false);
    } catch (err) { alert(err.message); }
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
    const fileName = `${auth.email}.${fileExt}`;

    // List and delete all existing files for this user
    const { data: existingFiles } = await supabase.storage
      .from("avatars")
      .list("", { search: auth.email });

    if (existingFiles && existingFiles.length > 0) {
      const filesToDelete = existingFiles.map((f) => f.name);
      await supabase.storage.from("avatars").remove(filesToDelete);
    }

    // Upload new file
    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(fileName, newPicFile, { upsert: true });

    if (uploadError) throw new Error("Image upload failed: " + uploadError.message);

    const { data: urlData } = supabase.storage
  .from("avatars")
  .getPublicUrl(fileName);

  const publicUrl = `${urlData.publicUrl}?t=${Date.now()}`;

    const res = await fetch("http://localhost:8000/api/profile/update-picture/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${auth.token}`,
      },
      body: JSON.stringify({ profile_picture: publicUrl }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);

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

  const openPassModal = () => {
    setPassStep(STEP_EMAIL);
    setPassEmail(auth.email || "");
    setPassCode("");
    setNewPassword("");
    setConfirmPassword("");
    setPassError("");
    setShowDotsMenu(false);
    setShowPassModal(true);
  };

  const closePassModal = () => {
    setShowPassModal(false);
    setPassError("");
  };

  const handleSendCode = async () => {
    try {
      setPassLoading(true);
      setPassError("");
      const res = await fetch("http://localhost:8000/api/auth/send-reset-code/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: passEmail }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setPassStep(STEP_CODE);
    } catch (err) { setPassError(err.message); }
    finally { setPassLoading(false); }
  };

  const handleVerifyCode = async () => {
    try {
      setPassLoading(true);
      setPassError("");
      const res = await fetch("http://localhost:8000/api/auth/verify-reset-code/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: passEmail, code: passCode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setPassStep(STEP_NEWPASS);
    } catch (err) { setPassError(err.message); }
    finally { setPassLoading(false); }
  };

  const handleNewPassword = () => {
    if (!newPassword || !confirmPassword) {
      setPassError("Please fill in both fields."); return;
    }
    if (newPassword !== confirmPassword) {
      setPassError("Passwords do not match."); return;
    }
    if (newPassword.length < 6) {
      setPassError("Password must be at least 6 characters."); return;
    }
    setPassError("");
    setPassStep(STEP_CONFIRM);
  };

  const handleConfirmPassword = async () => {
    try {
      setPassLoading(true);
      setPassError("");
      const res = await fetch("http://localhost:8000/api/auth/reset-password/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: passEmail, code: passCode, new_password: newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setPassStep(STEP_SUCCESS);
    } catch (err) { setPassError(err.message); }
    finally { setPassLoading(false); }
  };

  const currentStatus = STATUS_OPTIONS.find(
    (s) => s.value === profile?.account_status
  ) || STATUS_OPTIONS[0];

  if (loading) {
    return (
      <section className="px-4 pt-1 bg-[#0B2447] min-h-screen flex items-center justify-center">
        <p className="text-white text-sm">Loading profile...</p>
      </section>
    );
  }

  return (
    <section className="px-4 pt-1 bg-[#0B2447] min-h-screen">
      <div
        className="max-w-[1200px] mx-auto bg-white rounded-3xl pt-4 px-10 pb-6 min-h-[600px] border-2 border-[#0B2447]"
        style={{ boxShadow: "6px 6px 0px #0B2447" }}
      >
        <div className="grid grid-cols-[1fr_380px] gap-6 items-start max-[900px]:grid-cols-1">

          {/* ── LEFT PANEL ── */}
          <div className="bg-[#f8fafc] rounded-[40px] p-8 min-h-[500px] border border-slate-200/20 flex flex-col gap-6">

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

                    {/* Birthdate */}
                    {profile?.birthdate && (
                      <div className="flex items-center gap-2 border border-slate-200 rounded-full px-4 py-1.5 self-start bg-white">
                        <span className="text-slate-400 text-sm">📅</span>
                        <span className="text-sm font-medium text-slate-600">{profile.birthdate}</span>
                      </div>
                    )}
                  </div>

                  {/* 3 dots menu */}
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
                          onClick={openPassModal}
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
                      await fetch("http://localhost:8000/api/profile/update-bio/", {
                        method: "POST",
                        headers: {
                          "Content-Type": "application/json",
                          Authorization: `Bearer ${auth.token}`,
                        },
                        body: JSON.stringify({ bio: e.target.value }),
                      });
                    } catch (err) { console.error(err); }
                  }}
                  placeholder="Tell us about yourself..."
                  className="w-full text-[0.9rem] text-slate-700 leading-[1.8] text-justify bg-transparent border-none outline-none resize-none min-h-[120px]"
                />
              </div>
              </>
            )}

            {/* Owner */}
            {role === "owner" && (
              <>
                <div className="flex items-start gap-5 relative">
                  <div className="w-[120px] min-w-[120px] h-[120px] border-2 border-slate-200 rounded-2xl overflow-hidden bg-slate-100 flex items-center justify-center">
                    <CompanyIcon />
                  </div>
                  <div className="flex flex-col gap-3 flex-1">
                    <div
                      className="font-extrabold text-[#0B2447] px-5 py-2 rounded-full border-2 border-[#0B2447] text-base self-start"
                      style={{ boxShadow: "3px 3px 0px #0B2447" }}
                    >
                      {profile?.company_name || "Company Name"}
                    </div>
                    <div className="flex flex-col gap-2">
                      {["Change Company Password", "Change Company Name", "Change Password", "Change Company Profile"].map((action) => (
                        <button key={action} className="border border-slate-300 rounded-full px-4 py-1.5 text-sm font-medium text-slate-600 bg-white hover:bg-slate-50 transition self-start cursor-pointer">
                          {action}
                        </button>
                      ))}
                      <button className="border border-red-300 rounded-full px-4 py-1.5 text-sm font-medium text-red-500 bg-white hover:bg-red-50 transition self-start cursor-pointer">
                        Delete Company
                      </button>
                    </div>
                  </div>
                </div>
                <div className="border-2 border-slate-200 rounded-[20px] p-6">
                  <p className="text-[0.9rem] text-slate-700 leading-[1.8] text-justify m-0">
                    {profile?.description || "No company description available."}
                  </p>
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
            {interviewApplicants.length > 0 ? (
              <div className="flex flex-col gap-5">
                {interviewApplicants.map((applicant) => (
                  <div key={applicant.id} className="flex flex-col gap-2">
                    <div className="flex items-center gap-1.5 text-[0.82rem] font-semibold text-slate-500">
                      <span>📅</span> {applicant.date}
                    </div>
                    <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center gap-4">
                      <div className="w-[80px] min-w-[80px] h-[90px] bg-slate-200 rounded-[10px] overflow-hidden flex items-center justify-center">
                        {applicant.photo ? (
                          <img src={applicant.photo} alt={applicant.name} className="w-full h-full object-cover" />
                        ) : <UserIcon />}
                      </div>
                      <div className="flex flex-col gap-2">
                        <span className="bg-slate-100 rounded-full px-4 py-1 text-[0.82rem] font-semibold text-[#0f172a]">{applicant.name}</span>
                        <span className="bg-slate-100 rounded-full px-4 py-1 text-[0.82rem] font-semibold text-[#0f172a]">
                          H!RE Score: <span className="text-green-500 font-bold">{applicant.score}%</span>
                        </span>
                        <span className="bg-slate-100 rounded-full px-4 py-1 text-[0.82rem] font-semibold text-[#0f172a]">{applicant.role}</span>
                        {role === "owner" && (
                          <span className="bg-slate-100 rounded-full px-4 py-1 text-[0.82rem] font-semibold text-[#0f172a]">
                            <strong>Interviewer: {applicant.interviewer}</strong>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-400 text-sm">No applicants scheduled for interview yet.</p>
            )}
          </div>
        </div>
      </div>

      {/* ── Change Profile Picture Modal ── */}
      {showPicModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div
            className="bg-white rounded-3xl p-8 w-full max-w-lg mx-4"
            style={{ border: "2px solid #1a1a2e", boxShadow: "4px 4px 0px #000000" }}
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-[#0B2447] flex items-center justify-center">
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                  <circle cx="12" cy="7" r="4" stroke="white" strokeWidth="2"/>
                </svg>
              </div>
              <h2 className="text-lg font-extrabold text-[#0B2447]">Change Profile Picture</h2>
            </div>
            <div
              onClick={() => picInputRef.current?.click()}
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              className="border-2 border-[#0B2447] rounded-2xl flex flex-col items-center justify-center gap-3 cursor-pointer hover:bg-slate-50 transition-colors mb-6"
              style={{ minHeight: "220px" }}
            >
              {newPicPreview ? (
                <img src={newPicPreview} alt="Preview" className="max-h-[200px] rounded-xl object-contain" />
              ) : (
                <>
                  <div className="w-14 h-14 rounded-full bg-[#0B2447] flex items-center justify-center">
                    <span className="text-white text-3xl font-light">+</span>
                  </div>
                  <p className="font-bold text-[#0B2447] text-sm m-0">Click or drag to upload</p>
                  <p className="text-slate-400 text-xs m-0">Upload Image File</p>
                </>
              )}
            </div>
            <input ref={picInputRef} type="file" accept="image/*" className="hidden" onChange={handlePicFileChange} />
            <div className="grid grid-cols-2 gap-3">
              <button onClick={handleCancelPic} className="bg-red-500 hover:bg-red-600 text-white font-bold rounded-full py-2.5 border-none cursor-pointer transition-colors">
                Cancel
              </button>
              <button
                onClick={handlePicChange}
                disabled={!newPicFile || uploadingPic}
                className="bg-green-500 hover:bg-green-600 text-white font-bold rounded-full py-2.5 border-none cursor-pointer transition-colors disabled:opacity-50"
              >
                {uploadingPic ? "Uploading..." : "Change"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Change Password Modal ── */}
      {showPassModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div
            className="bg-white rounded-3xl p-8 w-full max-w-md mx-4"
            style={{ border: "2px solid #1a1a2e", boxShadow: "4px 4px 0px #000000" }}
          >
            <h2 className="text-xl font-extrabold text-[#0B2447] text-center mb-6">Change Password</h2>

            {/* Step 1: Email */}
            {passStep === STEP_EMAIL && (
              <div className="flex flex-col gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1 block">Email:</label>
                  <input
                    type="email"
                    value={passEmail}
                    onChange={(e) => setPassEmail(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-slate-400 mt-2 text-center">
                    We'll send a verification code to this email if it matches an existing account.
                  </p>
                </div>
                {passError && <p className="text-red-500 text-xs text-center">{passError}</p>}
                <div className="grid grid-cols-2 gap-3 mt-2">
                  <button onClick={closePassModal} className="bg-red-500 hover:bg-red-600 text-white font-bold rounded-full py-2.5 border-none cursor-pointer">
                    Cancel
                  </button>
                  <button
                    onClick={handleSendCode}
                    disabled={passLoading}
                    className="bg-[#0B2447] hover:bg-[#162553] text-white font-bold rounded-full py-2.5 border-none cursor-pointer disabled:opacity-50"
                  >
                    {passLoading ? "Sending..." : "Send Code"}
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Code */}
            {passStep === STEP_CODE && (
              <div className="flex flex-col gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1 block">Code:</label>
                  <input
                    type="text"
                    value={passCode}
                    onChange={(e) => setPassCode(e.target.value)}
                    placeholder="Enter 6-digit code"
                    className="w-full border border-slate-300 rounded-lg px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-slate-400 mt-2 text-center">
                    Didn't receive a code?{" "}
                    <button onClick={handleSendCode} className="text-blue-500 font-semibold bg-transparent border-none cursor-pointer">
                      Resend Code
                    </button>
                  </p>
                </div>
                {passError && <p className="text-red-500 text-xs text-center">{passError}</p>}
                <div className="grid grid-cols-2 gap-3 mt-2">
                  <button onClick={closePassModal} className="bg-red-500 hover:bg-red-600 text-white font-bold rounded-full py-2.5 border-none cursor-pointer">
                    Cancel
                  </button>
                  <button
                    onClick={handleVerifyCode}
                    disabled={passLoading}
                    className="bg-green-500 hover:bg-green-600 text-white font-bold rounded-full py-2.5 border-none cursor-pointer disabled:opacity-50"
                  >
                    {passLoading ? "Verifying..." : "Proceed"}
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: New Password */}
            {passStep === STEP_NEWPASS && (
              <div className="flex flex-col gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1 block">New Password:</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1 block">Re-Enter New Password:</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                {passError && <p className="text-red-500 text-xs text-center">{passError}</p>}
                <div className="grid grid-cols-2 gap-3 mt-2">
                  <button onClick={closePassModal} className="bg-red-500 hover:bg-red-600 text-white font-bold rounded-full py-2.5 border-none cursor-pointer">
                    Cancel
                  </button>
                  <button
                    onClick={handleNewPassword}
                    className="bg-[#0B2447] hover:bg-[#162553] text-white font-bold rounded-full py-2.5 border-none cursor-pointer"
                  >
                    Change Password
                  </button>
                </div>
              </div>
            )}

            {/* Step 4: Confirm */}
            {passStep === STEP_CONFIRM && (
              <div className="flex flex-col gap-6">
                <p className="text-center text-[#0B2447] font-semibold text-base">
                  Are you sure you want to change your password?
                </p>
                {passError && <p className="text-red-500 text-xs text-center">{passError}</p>}
                <div className="grid grid-cols-2 gap-3">
                  <button onClick={closePassModal} className="bg-red-500 hover:bg-red-600 text-white font-bold rounded-full py-2.5 border-none cursor-pointer">
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmPassword}
                    disabled={passLoading}
                    className="bg-green-500 hover:bg-green-600 text-white font-bold rounded-full py-2.5 border-none cursor-pointer disabled:opacity-50"
                  >
                    {passLoading ? "Saving..." : "Proceed"}
                  </button>
                </div>
              </div>
            )}

            {/* Step 5: Success */}
            {passStep === STEP_SUCCESS && (
              <div className="flex flex-col items-center gap-6">
                <p className="text-2xl font-extrabold text-[#0B2447] text-center">Password Changed!</p>
                <button
                  onClick={closePassModal}
                  className="bg-[#0B2447] hover:bg-[#162553] text-white font-bold rounded-full px-8 py-2.5 border-none cursor-pointer"
                >
                  Back to profile
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}