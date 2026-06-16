import { useState, useRef } from "react";

// ─────────────────────────────────────────────
// Change Profile Picture Modal (HR roles)
// ─────────────────────────────────────────────
export function ChangeProfilePictureModal({
  newPicPreview,
  newPicFile,
  uploadingPic,
  onFileChange,
  onDrop,
  onConfirm,
  onCancel,
}) {
  const picInputRef = useRef(null);

  return (
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
          onDrop={onDrop}
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

        <input
          ref={picInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={onFileChange}
        />

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={onCancel}
            className="bg-red-500 hover:bg-red-600 text-white font-bold rounded-full py-2.5 border-none cursor-pointer transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={!newPicFile || uploadingPic}
            className="bg-green-500 hover:bg-green-600 text-white font-bold rounded-full py-2.5 border-none cursor-pointer transition-colors disabled:opacity-50"
          >
            {uploadingPic ? "Uploading..." : "Change"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Change Company Logo Modal (Owner)
// ─────────────────────────────────────────────
export function ChangeCompanyLogoModal({
  newPicPreview,
  newPicFile,
  uploadingPic,
  onFileChange,
  onDrop,
  onConfirm,
  onCancel,
}) {
  const picInputRef = useRef(null);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div
        className="bg-white rounded-3xl p-8 w-full max-w-lg mx-4"
        style={{ border: "2px solid #1a1a2e", boxShadow: "4px 4px 0px #000000" }}
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-[#0B2447] flex items-center justify-center">
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <polyline points="9 22 9 12 15 12 15 22" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h2 className="text-lg font-extrabold text-[#0B2447]">Change Company Logo</h2>
        </div>

        <div
          onClick={() => picInputRef.current?.click()}
          onDrop={onDrop}
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
              <p className="text-slate-400 text-xs m-0">Upload Company Logo</p>
            </>
          )}
        </div>

        <input
          ref={picInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={onFileChange}
        />

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={onCancel}
            className="bg-red-500 hover:bg-red-600 text-white font-bold rounded-full py-2.5 border-none cursor-pointer transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={!newPicFile || uploadingPic}
            className="bg-green-500 hover:bg-green-600 text-white font-bold rounded-full py-2.5 border-none cursor-pointer transition-colors disabled:opacity-50"
          >
            {uploadingPic ? "Uploading..." : "Save Logo"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Change Company Name Modal (Owner)
// ─────────────────────────────────────────────
export function ChangeCompanyNameModal({ currentName = "", token, onSuccess, onClose }) {
  const [newName, setNewName]   = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const [confirmed, setConfirmed] = useState(false);

  const handleProceed = () => {
    if (!newName.trim()) { setError("Please enter a new company name."); return; }
    setError("");
    setConfirmed(true);
  };

  const handleConfirm = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await fetch("http://localhost:8000/api/profile/update-company-name/", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ company_name: newName.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update company name.");
      onSuccess(newName.trim());
    } catch (err) {
      setError(err.message);
      setConfirmed(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div
        className="bg-white rounded-3xl p-8 w-full max-w-md mx-4"
        style={{ border: "2px solid #1a1a2e", boxShadow: "4px 4px 0px #000000" }}
      >
        <h2 className="text-xl font-extrabold text-[#0B2447] text-center mb-6">Change Company Name</h2>

        {!confirmed ? (
          <div className="flex flex-col gap-4">
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 block">Current Name:</label>
              <div className="w-full border border-slate-200 rounded-lg px-4 py-2 text-sm text-slate-400 bg-slate-50">
                {currentName}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 block">New Company Name:</label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Enter new name"
                className="w-full border border-slate-300 rounded-lg px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            {error && <p className="text-red-500 text-xs text-center">{error}</p>}
            <div className="grid grid-cols-2 gap-3 mt-2">
              <button onClick={onClose} className="bg-red-500 hover:bg-red-600 text-white font-bold rounded-full py-2.5 border-none cursor-pointer">
                Cancel
              </button>
              <button
                onClick={handleProceed}
                className="bg-[#0B2447] hover:bg-[#162553] text-white font-bold rounded-full py-2.5 border-none cursor-pointer"
              >
                Proceed
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            <p className="text-center text-[#0B2447] font-semibold text-base">
              Change company name to <span className="font-extrabold">"{newName}"</span>?
            </p>
            {error && <p className="text-red-500 text-xs text-center">{error}</p>}
            <div className="grid grid-cols-2 gap-3">
              <button onClick={onClose} className="bg-red-500 hover:bg-red-600 text-white font-bold rounded-full py-2.5 border-none cursor-pointer">
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                disabled={loading}
                className="bg-green-500 hover:bg-green-600 text-white font-bold rounded-full py-2.5 border-none cursor-pointer disabled:opacity-50"
              >
                {loading ? "Saving..." : "Confirm"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Change Company Password Modal (Owner)
// ─────────────────────────────────────────────
export function ChangeCompanyPasswordModal({ token, onClose }) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword]         = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading]                 = useState(false);
  const [error, setError]                     = useState("");
  const [confirmed, setConfirmed]             = useState(false);
  const [success, setSuccess]                 = useState(false);

  const handleProceed = () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      setError("Please fill in all fields."); return;
    }
    if (newPassword !== confirmPassword) {
      setError("New passwords do not match."); return;
    }
    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters."); return;
    }
    setError("");
    setConfirmed(true);
  };

  const handleConfirm = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await fetch("http://localhost:8000/api/profile/update-company-password/", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update password.");
      setSuccess(true);
    } catch (err) {
      setError(err.message);
      setConfirmed(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div
        className="bg-white rounded-3xl p-8 w-full max-w-md mx-4"
        style={{ border: "2px solid #1a1a2e", boxShadow: "4px 4px 0px #000000" }}
      >
        <h2 className="text-xl font-extrabold text-[#0B2447] text-center mb-6">Change Company Password</h2>

        {success ? (
          <div className="flex flex-col items-center gap-6">
            <p className="text-2xl font-extrabold text-[#0B2447] text-center">Password Changed!</p>
            <button
              onClick={onClose}
              className="bg-[#0B2447] hover:bg-[#162553] text-white font-bold rounded-full px-8 py-2.5 border-none cursor-pointer"
            >
              Back to Profile
            </button>
          </div>
        ) : !confirmed ? (
          <div className="flex flex-col gap-4">
            {[
              { label: "Current Staff Password", value: currentPassword, setter: setCurrentPassword },
              { label: "New Staff Password",     value: newPassword,     setter: setNewPassword },
              { label: "Re-Enter New Password",  value: confirmPassword, setter: setConfirmPassword },
            ].map(({ label, value, setter }) => (
              <div key={label}>
                <label className="text-sm font-medium text-slate-700 mb-1 block">{label}:</label>
                <input
                  type="password"
                  value={value}
                  onChange={(e) => setter(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="••••••••"
                />
              </div>
            ))}
            {error && <p className="text-red-500 text-xs text-center">{error}</p>}
            <div className="grid grid-cols-2 gap-3 mt-2">
              <button onClick={onClose} className="bg-red-500 hover:bg-red-600 text-white font-bold rounded-full py-2.5 border-none cursor-pointer">
                Cancel
              </button>
              <button
                onClick={handleProceed}
                className="bg-[#0B2447] hover:bg-[#162553] text-white font-bold rounded-full py-2.5 border-none cursor-pointer"
              >
                Proceed
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            <p className="text-center text-[#0B2447] font-semibold text-base">
              Are you sure you want to change the company (staff) password?
            </p>
            {error && <p className="text-red-500 text-xs text-center">{error}</p>}
            <div className="grid grid-cols-2 gap-3">
              <button onClick={onClose} className="bg-red-500 hover:bg-red-600 text-white font-bold rounded-full py-2.5 border-none cursor-pointer">
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                disabled={loading}
                className="bg-green-500 hover:bg-green-600 text-white font-bold rounded-full py-2.5 border-none cursor-pointer disabled:opacity-50"
              >
                {loading ? "Saving..." : "Confirm"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Change Company Profile (Description) Modal (Owner)
// ─────────────────────────────────────────────
export function ChangeCompanyProfileModal({ currentDescription = "", token, onSuccess, onClose }) {
  const [description, setDescription] = useState(currentDescription);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState("");

  const handleSave = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await fetch("http://localhost:8000/api/profile/update-company-description/", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ description }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update description.");
      onSuccess(description);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div
        className="bg-white rounded-3xl p-8 w-full max-w-lg mx-4"
        style={{ border: "2px solid #1a1a2e", boxShadow: "4px 4px 0px #000000" }}
      >
        <h2 className="text-xl font-extrabold text-[#0B2447] text-center mb-6">Edit Company Profile</h2>
        <div className="flex flex-col gap-4">
          <div>
            <label className="text-sm font-medium text-slate-700 mb-1 block">Company Description:</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={6}
              placeholder="Tell applicants about your company..."
              className="w-full border border-slate-300 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>
          {error && <p className="text-red-500 text-xs text-center">{error}</p>}
          <div className="grid grid-cols-2 gap-3 mt-2">
            <button onClick={onClose} className="bg-red-500 hover:bg-red-600 text-white font-bold rounded-full py-2.5 border-none cursor-pointer">
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={loading}
              className="bg-[#0B2447] hover:bg-[#162553] text-white font-bold rounded-full py-2.5 border-none cursor-pointer disabled:opacity-50"
            >
              {loading ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Delete Company Modal (Owner)
// ─────────────────────────────────────────────
export function DeleteCompanyModal({ companyName = "", token, onSuccess, onClose }) {
  const [confirmText, setConfirmText] = useState("");
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState("");

  const handleDelete = async () => {
    if (confirmText !== companyName) {
      setError(`Please type "${companyName}" exactly to confirm.`); return;
    }
    try {
      setLoading(true);
      setError("");
      const res = await fetch("http://localhost:8000/api/profile/delete-company/", {
        method: "DELETE",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete company.");
      onSuccess();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div
        className="bg-white rounded-3xl p-8 w-full max-w-md mx-4"
        style={{ border: "2px solid #1a1a2e", boxShadow: "4px 4px 0px #000000" }}
      >
        <h2 className="text-xl font-extrabold text-red-600 text-center mb-2">Delete Company</h2>
        <p className="text-center text-slate-500 text-sm mb-6">
          This action is <span className="font-bold text-red-500">permanent</span> and cannot be undone.
          All data associated with this company will be lost.
        </p>

        <div className="flex flex-col gap-4">
          <div>
            <label className="text-sm font-medium text-slate-700 mb-1 block">
              Type <span className="font-bold text-red-500">"{companyName}"</span> to confirm:
            </label>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder={companyName}
              className="w-full border border-red-300 rounded-lg px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-red-400"
            />
          </div>
          {error && <p className="text-red-500 text-xs text-center">{error}</p>}
          <div className="grid grid-cols-2 gap-3 mt-2">
            <button onClick={onClose} className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-full py-2.5 border-none cursor-pointer">
              Cancel
            </button>
            <button
              onClick={handleDelete}
              disabled={loading || confirmText !== companyName}
              className="bg-red-500 hover:bg-red-600 text-white font-bold rounded-full py-2.5 border-none cursor-pointer disabled:opacity-50"
            >
              {loading ? "Deleting..." : "Delete Forever"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Change Password Modal (HR roles)
// ─────────────────────────────────────────────

const STEP_EMAIL   = "email";
const STEP_CODE    = "code";
const STEP_NEWPASS = "newpass";
const STEP_CONFIRM = "confirm";
const STEP_SUCCESS = "success";

export function ChangePasswordModal({ initialEmail = "", onClose }) {
  const [step, setStep]                       = useState(STEP_EMAIL);
  const [email, setEmail]                     = useState(initialEmail);
  const [code, setCode]                       = useState("");
  const [newPassword, setNewPassword]         = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading]                 = useState(false);
  const [error, setError]                     = useState("");

  const handleSendCode = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await fetch("http://localhost:8000/api/auth/send-reset-code/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setStep(STEP_CODE);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await fetch("http://localhost:8000/api/auth/verify-reset-code/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setStep(STEP_NEWPASS);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleNewPassword = () => {
    if (!newPassword || !confirmPassword) { setError("Please fill in both fields."); return; }
    if (newPassword !== confirmPassword)  { setError("Passwords do not match.");      return; }
    if (newPassword.length < 6)           { setError("Password must be at least 6 characters."); return; }
    setError("");
    setStep(STEP_CONFIRM);
  };

  const handleConfirmPassword = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await fetch("http://localhost:8000/api/auth/reset-password/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code, new_password: newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setStep(STEP_SUCCESS);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div
        className="bg-white rounded-3xl p-8 w-full max-w-md mx-4"
        style={{ border: "2px solid #1a1a2e", boxShadow: "4px 4px 0px #000000" }}
      >
        <h2 className="text-xl font-extrabold text-[#0B2447] text-center mb-6">Change Password</h2>

        {step === STEP_EMAIL && (
          <div className="flex flex-col gap-4">
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 block">Email:</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-slate-400 mt-2 text-center">
                We'll send a verification code to this email if it matches an existing account.
              </p>
            </div>
            {error && <p className="text-red-500 text-xs text-center">{error}</p>}
            <div className="grid grid-cols-2 gap-3 mt-2">
              <button onClick={onClose} className="bg-red-500 hover:bg-red-600 text-white font-bold rounded-full py-2.5 border-none cursor-pointer">Cancel</button>
              <button onClick={handleSendCode} disabled={loading} className="bg-[#0B2447] hover:bg-[#162553] text-white font-bold rounded-full py-2.5 border-none cursor-pointer disabled:opacity-50">
                {loading ? "Sending..." : "Send Code"}
              </button>
            </div>
          </div>
        )}

        {step === STEP_CODE && (
          <div className="flex flex-col gap-4">
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 block">Code:</label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Enter 6-digit code"
                className="w-full border border-slate-300 rounded-lg px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-slate-400 mt-2 text-center">
                Didn't receive a code?{" "}
                <button onClick={handleSendCode} className="text-blue-500 font-semibold bg-transparent border-none cursor-pointer">Resend Code</button>
              </p>
            </div>
            {error && <p className="text-red-500 text-xs text-center">{error}</p>}
            <div className="grid grid-cols-2 gap-3 mt-2">
              <button onClick={onClose} className="bg-red-500 hover:bg-red-600 text-white font-bold rounded-full py-2.5 border-none cursor-pointer">Cancel</button>
              <button onClick={handleVerifyCode} disabled={loading} className="bg-green-500 hover:bg-green-600 text-white font-bold rounded-full py-2.5 border-none cursor-pointer disabled:opacity-50">
                {loading ? "Verifying..." : "Proceed"}
              </button>
            </div>
          </div>
        )}

        {step === STEP_NEWPASS && (
          <div className="flex flex-col gap-4">
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 block">New Password:</label>
              <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full border border-slate-300 rounded-lg px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 block">Re-Enter New Password:</label>
              <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full border border-slate-300 rounded-lg px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            {error && <p className="text-red-500 text-xs text-center">{error}</p>}
            <div className="grid grid-cols-2 gap-3 mt-2">
              <button onClick={onClose} className="bg-red-500 hover:bg-red-600 text-white font-bold rounded-full py-2.5 border-none cursor-pointer">Cancel</button>
              <button onClick={handleNewPassword} className="bg-[#0B2447] hover:bg-[#162553] text-white font-bold rounded-full py-2.5 border-none cursor-pointer">Change Password</button>
            </div>
          </div>
        )}

        {step === STEP_CONFIRM && (
          <div className="flex flex-col gap-6">
            <p className="text-center text-[#0B2447] font-semibold text-base">Are you sure you want to change your password?</p>
            {error && <p className="text-red-500 text-xs text-center">{error}</p>}
            <div className="grid grid-cols-2 gap-3">
              <button onClick={onClose} className="bg-red-500 hover:bg-red-600 text-white font-bold rounded-full py-2.5 border-none cursor-pointer">Cancel</button>
              <button onClick={handleConfirmPassword} disabled={loading} className="bg-green-500 hover:bg-green-600 text-white font-bold rounded-full py-2.5 border-none cursor-pointer disabled:opacity-50">
                {loading ? "Saving..." : "Proceed"}
              </button>
            </div>
          </div>
        )}

        {step === STEP_SUCCESS && (
          <div className="flex flex-col items-center gap-6">
            <p className="text-2xl font-extrabold text-[#0B2447] text-center">Password Changed!</p>
            <button onClick={onClose} className="bg-[#0B2447] hover:bg-[#162553] text-white font-bold rounded-full px-8 py-2.5 border-none cursor-pointer">
              Back to profile
            </button>
          </div>
        )}
      </div>
    </div>
  );
}