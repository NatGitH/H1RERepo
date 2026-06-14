import { useState, useRef } from "react";

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
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-[#0B2447] flex items-center justify-center">
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="white" strokeWidth="2" strokeLinecap="round"/>
              <circle cx="12" cy="7" r="4" stroke="white" strokeWidth="2"/>
            </svg>
          </div>
          <h2 className="text-lg font-extrabold text-[#0B2447]">Change Profile Picture</h2>
        </div>

        {/* Drop zone */}
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

        {/* Actions */}
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
// Change Password Modal (HR roles)
// ─────────────────────────────────────────────

const STEP_EMAIL   = "email";
const STEP_CODE    = "code";
const STEP_NEWPASS = "newpass";
const STEP_CONFIRM = "confirm";
const STEP_SUCCESS = "success";

/**
 * Props:
 *   initialEmail  {string}    - pre-fills the email field (usually auth.email)
 *   onClose       {Function}  - called when the modal should close
 */
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
    if (!newPassword || !confirmPassword) {
      setError("Please fill in both fields.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
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

        {/* Step 1: Email */}
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
              <button onClick={onClose} className="bg-red-500 hover:bg-red-600 text-white font-bold rounded-full py-2.5 border-none cursor-pointer">
                Cancel
              </button>
              <button
                onClick={handleSendCode}
                disabled={loading}
                className="bg-[#0B2447] hover:bg-[#162553] text-white font-bold rounded-full py-2.5 border-none cursor-pointer disabled:opacity-50"
              >
                {loading ? "Sending..." : "Send Code"}
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Code */}
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
                <button onClick={handleSendCode} className="text-blue-500 font-semibold bg-transparent border-none cursor-pointer">
                  Resend Code
                </button>
              </p>
            </div>
            {error && <p className="text-red-500 text-xs text-center">{error}</p>}
            <div className="grid grid-cols-2 gap-3 mt-2">
              <button onClick={onClose} className="bg-red-500 hover:bg-red-600 text-white font-bold rounded-full py-2.5 border-none cursor-pointer">
                Cancel
              </button>
              <button
                onClick={handleVerifyCode}
                disabled={loading}
                className="bg-green-500 hover:bg-green-600 text-white font-bold rounded-full py-2.5 border-none cursor-pointer disabled:opacity-50"
              >
                {loading ? "Verifying..." : "Proceed"}
              </button>
            </div>
          </div>
        )}

        {/* Step 3: New Password */}
        {step === STEP_NEWPASS && (
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
            {error && <p className="text-red-500 text-xs text-center">{error}</p>}
            <div className="grid grid-cols-2 gap-3 mt-2">
              <button onClick={onClose} className="bg-red-500 hover:bg-red-600 text-white font-bold rounded-full py-2.5 border-none cursor-pointer">
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
        {step === STEP_CONFIRM && (
          <div className="flex flex-col gap-6">
            <p className="text-center text-[#0B2447] font-semibold text-base">
              Are you sure you want to change your password?
            </p>
            {error && <p className="text-red-500 text-xs text-center">{error}</p>}
            <div className="grid grid-cols-2 gap-3">
              <button onClick={onClose} className="bg-red-500 hover:bg-red-600 text-white font-bold rounded-full py-2.5 border-none cursor-pointer">
                Cancel
              </button>
              <button
                onClick={handleConfirmPassword}
                disabled={loading}
                className="bg-green-500 hover:bg-green-600 text-white font-bold rounded-full py-2.5 border-none cursor-pointer disabled:opacity-50"
              >
                {loading ? "Saving..." : "Proceed"}
              </button>
            </div>
          </div>
        )}

        {/* Step 5: Success */}
        {step === STEP_SUCCESS && (
          <div className="flex flex-col items-center gap-6">
            <p className="text-2xl font-extrabold text-[#0B2447] text-center">Password Changed!</p>
            <button
              onClick={onClose}
              className="bg-[#0B2447] hover:bg-[#162553] text-white font-bold rounded-full px-8 py-2.5 border-none cursor-pointer"
            >
              Back to profile
            </button>
          </div>
        )}
      </div>
    </div>
  );
}