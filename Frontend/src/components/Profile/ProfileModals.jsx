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
// Manage Subscription Modal (Owner)
// ─────────────────────────────────────────────
const SUBSCRIPTION_PLANS = [
  {
    name: "Basic",
    planType: "free",
    price: "FREE",
    priceLabel: null,
    features: ["1 active job post", "30 resume evaluations/month", "Basic HIRE Score", "AI summary (limited)"],
  },
  {
    name: "Standard",
    planType: "standard",
    price: "₱899",
    priceLabel: "per branch / month",
    features: ["All in Basic +", "5 active job posts", "500 resume evaluations / month", "Full HIRE Score with pros & cons", "Interview scheduling"],
  },
  {
    name: "Enterprise",
    planType: "enterprise",
    price: "₱1,999",
    priceLabel: "per branch / month",
    features: ["All in Basic + Standard", "Unlimited job posts", "Unlimited resume evaluations", "Audit logs & advanced analytics", "Priority support & SLA"],
  },
];

export function ManageSubscriptionModal({ currentPlan = "free", currentExpiry = "", token, onSuccess, onClose }) {
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState("");
  const [confirmed, setConfirmed]       = useState(false);

  const handleSelect = (planType) => {
    setSelectedPlan(planType);
    setError("");
  };

  const handleProceed = () => {
    if (!selectedPlan) { setError("Please select a plan."); return; }
    setConfirmed(true);
  };

  const handleConfirm = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await fetch("http://localhost:8000/api/profile/renew-subscription/", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ plan: selectedPlan }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update subscription.");
      onSuccess(data.subscription_plan, data.subscription_expiry, data.was_renewal);
    } catch (err) {
      setError(err.message);
      setConfirmed(false);
    } finally {
      setLoading(false);
    }
  };

  const isRenewal = selectedPlan === currentPlan;
  const selectedPlanData = SUBSCRIPTION_PLANS.find((p) => p.planType === selectedPlan);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
      <div
        className="bg-white rounded-3xl p-8 w-full max-w-3xl"
        style={{ border: "2px solid #1a1a2e", boxShadow: "4px 4px 0px #000000" }}
      >
        {!confirmed ? (
          <>
            <h2 className="text-xl font-extrabold text-[#0B2447] text-center mb-1">Manage Subscription</h2>
            <p className="text-center text-slate-400 text-xs mb-6">
              Current plan: <span className="font-semibold text-slate-600 capitalize">{currentPlan}</span>
              {currentExpiry && <> · Expires <span className="font-semibold text-slate-600">{currentExpiry}</span></>}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {SUBSCRIPTION_PLANS.map((plan) => {
                const isCurrent  = plan.planType === currentPlan;
                const isSelected = plan.planType === selectedPlan;
                return (
                  <button
                    key={plan.planType}
                    onClick={() => handleSelect(plan.planType)}
                    className={`text-left rounded-2xl p-5 flex flex-col bg-[#1a2e6b] text-white border-2 cursor-pointer transition-all ${
                      isSelected ? "border-teal-400 scale-[1.02]" : "border-transparent"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="text-sm font-semibold text-white">{plan.name}</h3>
                      {isCurrent && (
                        <span className="bg-teal-500 text-white text-[0.65rem] font-bold px-2 py-0.5 rounded-full">
                          Current
                        </span>
                      )}
                    </div>
                    <p className="text-2xl font-extrabold text-white mb-1">{plan.price}</p>
                    {plan.priceLabel && <p className="text-[0.7rem] text-slate-300 mb-3">{plan.priceLabel}</p>}
                    <hr className="border-[#2a3e7b] mb-3" />
                    <ul className="flex-1 space-y-1.5">
                      {plan.features.map((f) => (
                        <li key={f} className="flex items-start gap-1.5 text-[0.7rem] text-slate-200">
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 text-green-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                          {f}
                        </li>
                      ))}
                    </ul>
                  </button>
                );
              })}
            </div>

            {error && <p className="text-red-500 text-xs text-center mb-3">{error}</p>}

            <div className="grid grid-cols-2 gap-3">
              <button onClick={onClose} className="bg-red-500 hover:bg-red-600 text-white font-bold rounded-full py-2.5 border-none cursor-pointer">
                Cancel
              </button>
              <button
                onClick={handleProceed}
                disabled={!selectedPlan}
                className="bg-[#0B2447] hover:bg-[#162553] text-white font-bold rounded-full py-2.5 border-none cursor-pointer disabled:opacity-50"
              >
                Proceed
              </button>
            </div>
          </>
        ) : (
          <div className="flex flex-col gap-6 max-w-md mx-auto">
            <h2 className="text-xl font-extrabold text-[#0B2447] text-center">
              {isRenewal ? "Confirm Renewal" : "Confirm Plan Change"}
            </h2>
            <p className="text-center text-[#0B2447] font-semibold text-base">
              {isRenewal
                ? <>Renew your <span className="font-extrabold">{selectedPlanData?.name}</span> plan? Your subscription will be extended by 30 days from your current expiry.</>
                : <>Switch to the <span className="font-extrabold">{selectedPlanData?.name}</span> plan? This will reset your billing cycle, starting a fresh 30-day period from today.</>
              }
            </p>
            {error && <p className="text-red-500 text-xs text-center">{error}</p>}
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => setConfirmed(false)} className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-full py-2.5 border-none cursor-pointer">
                Back
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