import { useState } from "react";
import { useNavigate } from "react-router";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import { useLogin } from "../../../../.Context/LoginContext";
import { useHRRegistration } from "../../../../.Context/HRRegistrationContext";
import { supabase } from "../../../../.Context/supabaseClient";

export default function CreateHRProfile() {
  const navigate = useNavigate();
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [showVerification, setShowVerification] = useState(false);
  const [uploading, setUploading] = useState(false);
  const { loginData, clearCompany } = useLogin();
  const { registrationData, updateData } = useHRRegistration();

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    dateOfBirth: "",
    bio: "",
  });

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onload = () => setAvatarPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    if (!form.firstName.trim() || !form.lastName.trim()) {
      alert("First name and last name are required.");
      return;
    }

    if (!registrationData.username || !registrationData.email || !registrationData.password) {
      alert("Registration session expired. Please start over.");
      navigate("/Create-HR-Account");
      return;
    }

    try {
      setUploading(true);
      let profilePictureUrl = null;

      if (avatarFile) {
        const fileExt = avatarFile.name.split(".").pop();
        const safeEmail = registrationData.email.replace(/[^a-zA-Z0-9_-]/g, "_");
        const fileName = `employee-profiles/${safeEmail}.${fileExt}`;

        const { data: existingFiles } = await supabase.storage
          .from("avatars")
          .list("employee-profiles", { search: safeEmail });

        if (existingFiles && existingFiles.length > 0)
          await supabase.storage
            .from("avatars")
            .remove(existingFiles.map((f) => `employee-profiles/${f.name}`));

        const { error: uploadError } = await supabase.storage
          .from("avatars")
          .upload(fileName, avatarFile, { upsert: true });

        if (uploadError) throw new Error("Image upload failed: " + uploadError.message);

        const { data: urlData } = supabase.storage
          .from("avatars")
          .getPublicUrl(fileName);

        profilePictureUrl = urlData.publicUrl;
      }

      const res = await fetch("http://localhost:8000/api/auth/create-hr-account/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username:        registrationData.username,
          email:           registrationData.email,
          password:        registrationData.password,
          company_id:      loginData.companyId,
          role:            "HRStaff",
          firstname:       form.firstName,
          lastname:        form.lastName,
          birthdate:       form.dateOfBirth || null,
          bio:             form.bio,
          profile_picture: profilePictureUrl,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create account");

      // Reset registration state now that the account is created
      updateData({ username: "", email: "", password: "" });
      setShowVerification(true);

    } catch (err) {
      alert(err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleBackToLogin = () => {
    clearCompany();
    navigate("/company-home");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0d1b3e] relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[350px] bg-blue-600 opacity-10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 right-1/4 translate-x-1/2 -translate-y-1/2 w-[400px] h-[300px] bg-blue-400 opacity-10 rounded-full blur-3xl" />
      </div>

      <div
        className="bg-white rounded-2xl px-8 pt-7 pb-8 w-full max-w-sm mx-4 relative z-10"
        style={{ border: "2px solid #1a1a2e", boxShadow: "6px 6px 0px #000000" }}
      >
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={() => navigate(-1)}
            className="w-8 h-8 flex items-center justify-center rounded-full border-2 border-black text-black hover:bg-slate-100 transition"
          >
            <ArrowBackIosNewIcon style={{ fontSize: 14 }} />
          </button>
          <h2 className="text-lg font-bold text-black">Create Profile</h2>
        </div>

        <div className="flex flex-col items-center mb-4">
          <label htmlFor="avatar" className="cursor-pointer relative">
            <div className="w-20 h-20 rounded-full border-2 border-gray-300 overflow-hidden bg-slate-100 flex items-center justify-center">
              {avatarPreview ? (
                <img src={avatarPreview} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              )}
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-6 bg-black/40 flex items-center justify-center rounded-b-full">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                <circle cx="12" cy="13" r="4" />
              </svg>
            </div>
          </label>
          <input id="avatar" type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
          <span className="text-xs text-gray-500 mt-1">Profile Picture</span>
        </div>

        <div className="space-y-3">
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-700 mb-1">First Name</label>
              <input
                type="text" name="firstName" value={form.firstName} onChange={handleChange}
                placeholder="First name"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-700 mb-1">Last Name</label>
              <input
                type="text" name="lastName" value={form.lastName} onChange={handleChange}
                placeholder="Last name"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Date of Birth</label>
            <input
              type="date" name="dateOfBirth" value={form.dateOfBirth} onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition [&::-webkit-calendar-picker-indicator]:filter [&::-webkit-calendar-picker-indicator]:brightness-0"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Bio</label>
            <textarea
              name="bio" value={form.bio} onChange={handleChange}
              placeholder="Tell us about yourself!" rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none transition"
            />
          </div>
        </div>

        <div className="mt-4">
          <button
            onClick={handleSubmit}
            disabled={uploading}
            className="w-full bg-[#0d1b3e] hover:bg-[#162553] text-white font-semibold py-2 rounded-lg transition duration-200 disabled:opacity-60"
          >
            {uploading ? "Saving..." : "Create Profile"}
          </button>
        </div>

        {showVerification && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div
              className="bg-white rounded-2xl px-10 pt-8 pb-8 w-full max-w-md mx-4 text-center"
              style={{ border: "2px solid #1a1a2e", boxShadow: "1px 1px 0px #000000" }}
            >
              <h2 className="text-xl font-bold text-black mb-10">Account for Verification</h2>
              <p className="text-gray-500 text-sm mb-10">Wait for the Email Confirmation...</p>
              <button
                onClick={handleBackToLogin}
                className="bg-[#0d1b3e] hover:bg-[#162553] text-white font-semibold px-6 py-2 rounded-lg transition duration-200"
              >
                Back to Login
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}