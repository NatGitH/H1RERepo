import { useState } from "react";
import { useNavigate } from "react-router";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import { apiFetch, getErrorMessage } from "../../api";
import { supabase } from "../../.Context/supabaseClient";
import { checkFileSize } from "../../fileLimit";
import PasswordInput from "../Functions/PasswordInput";

// Revision #7 — HR self-signup. Step 1: the required credentials. Step 2: profile
// picture + bio. No admin approval; company membership comes later via invites.
export default function HRSignup() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ email: "", password: "", confirm: "", birthdate: "" });
  const [bio, setBio] = useState("");
  const [picFile, setPicFile] = useState(null);
  const [picPreview, setPicPreview] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const change = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const goNext = () => {
    setError("");
    if (!form.email || !form.password || !form.confirm || !form.birthdate) { setError("Please fill in all fields."); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) { setError("Please enter a valid email."); return; }
    if (form.password.length < 8) { setError("Password must be at least 8 characters."); return; }
    if (form.password !== form.confirm) { setError("Passwords do not match."); return; }
    setStep(2);
  };

  const onPic = (e) => {
    const file = e.target.files[0];
    if (!file || !checkFileSize(file)) return;
    setPicFile(file);
    const r = new FileReader();
    r.onload = () => setPicPreview(r.result);
    r.readAsDataURL(file);
  };

  const submit = async () => {
    setLoading(true); setError("");
    try {
      const data = await apiFetch("/api/auth/hr-signup/", {
        method: "POST",
        body: { email: form.email.trim().toLowerCase(), password: form.password, birthdate: form.birthdate, bio: bio.trim() },
      });
      const token = data?.token;
      if (picFile && token) {
        try {
          const ext = picFile.name.split(".").pop();
          const safe = form.email.trim().toLowerCase().replace(/[^a-zA-Z0-9_-]/g, "_");
          const path = `employee-profiles/${safe}.${ext}`;
          await supabase.storage.from("avatars").upload(path, picFile, { upsert: true });
          const { data: u } = supabase.storage.from("avatars").getPublicUrl(path);
          await apiFetch("/api/profile/update-picture/", { method: "POST", token, body: { profile_picture: `${u.publicUrl}?t=${Date.now()}` } });
        } catch (picErr) { console.error(picErr); }
      }
      window.showAlert("Your HR account was created! You can now log in.", { type: "success", title: "Welcome to H!RE" });
      navigate("/");
    } catch (err) {
      setError(getErrorMessage(err, "Could not create your account."));
      setStep(1);
    } finally { setLoading(false); }
  };

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
        <div className="flex items-center gap-3 mb-1">
          <button
            onClick={() => (step === 1 ? navigate("/Create-Account") : setStep(1))}
            className="w-8 h-8 flex items-center justify-center rounded-full border-2 border-black text-black hover:bg-slate-100 transition bg-white cursor-pointer"
          >
            <ArrowBackIosNewIcon style={{ fontSize: 14 }} />
          </button>
          <h2 className="text-xl font-bold text-black m-0">HR Account</h2>
        </div>
        <p className="text-xs text-slate-400 mb-5 ml-11">Step {step} of 2 — {step === 1 ? "your credentials" : "your profile"}</p>

        {step === 1 ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input type="email" name="email" value={form.email} onChange={change} placeholder="name@example.com"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <PasswordInput name="password" value={form.password} onChange={change} placeholder="At least 8 characters"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
              <PasswordInput name="confirm" value={form.confirm} onChange={change} placeholder="Re-enter your password"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
              <input type="date" name="birthdate" value={form.birthdate} onChange={change} max={new Date().toISOString().slice(0, 10)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition text-gray-700" />
            </div>

            {error && <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3"><p className="text-red-600 text-sm font-medium text-center m-0">{error}</p></div>}

            <button onClick={goNext} className="cursor-pointer w-full bg-[#2255cc] hover:bg-[#1a44bb] text-white font-semibold py-2.5 rounded-full transition">Continue</button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-col items-center gap-2">
              <label className="w-28 h-28 rounded-full border-2 border-slate-200 bg-slate-100 overflow-hidden flex items-center justify-center cursor-pointer relative group">
                {picPreview ? <img src={picPreview} alt="Preview" className="w-full h-full object-cover" /> : <span className="text-slate-400 text-xs font-semibold">Add photo</span>}
                <input type="file" accept="image/*" onChange={onPic} className="hidden" />
                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-xs font-bold">Change</div>
              </label>
              <span className="text-xs text-slate-400">Profile picture (optional)</span>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Bio <span className="text-slate-400 font-normal">(optional)</span></label>
              <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={4} maxLength={500} placeholder="Tell companies a little about yourself..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition resize-none" />
              <p className="text-[0.7rem] text-slate-400 text-right mt-1">{bio.length}/500</p>
            </div>

            {error && <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3"><p className="text-red-600 text-sm font-medium text-center m-0">{error}</p></div>}

            <button onClick={submit} disabled={loading} className="cursor-pointer w-full bg-[#0d1b3e] hover:bg-[#162553] text-white font-semibold py-2.5 rounded-full transition disabled:opacity-60">
              {loading ? "Creating account..." : "Create Account"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
