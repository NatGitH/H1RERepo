import { useState } from "react";
import { useNavigate } from "react-router";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import { useAuth } from "../../.Context/AuthContext";
import { apiFetch, getErrorMessage } from "../../api";
import PasswordInput from "../Functions/PasswordInput";

// Revision #7 — one login for everyone. The backend detects owner / HR / admin by
// email and returns account_type; we route accordingly. HR users go to Company Home
// to pick which of their companies to enter.
export default function UserLogin() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const change = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const submit = async () => {
    setLoading(true); setError("");
    try {
      const d = await apiFetch("/api/auth/login/", {
        method: "POST",
        body: { email: form.email.trim(), password: form.password },
      });
      if (d.account_type === "admin") {
        login({ token: d.token, role: "admin", adminId: d.admin_id, email: d.email });
        navigate("/Admin-Dashboard");
      } else if (d.account_type === "owner") {
        login({
          token: d.token, role: "owner", companyId: d.company_id, companyName: d.company_name,
          profile_picture: d.company_logo, email: form.email.trim(), subscription_plan: d.subscription_plan,
        });
        navigate("/Applicants");
      } else if (d.account_type === "hr") {
        login({
          token: d.token, role: "hr_identity", user_id: d.user_id, email: d.email,
          firstname: d.firstname, lastname: d.lastname, profile_picture: d.profile_picture,
        });
        navigate("/HR-Home");
      } else {
        setError("Unexpected response. Please try again.");
      }
    } catch (err) {
      setError(getErrorMessage(err, "Invalid credentials"));
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0B2447] px-4 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[350px] bg-blue-600 opacity-10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 right-1/4 translate-x-1/2 -translate-y-1/2 w-[400px] h-[300px] bg-blue-400 opacity-10 rounded-full blur-3xl" />
      </div>

      <div
        className="bg-white rounded-2xl px-8 pt-7 pb-8 w-full max-w-sm relative z-10"
        style={{ border: "2px solid #1a1a2e", boxShadow: "6px 6px 0px #000000" }}
      >
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => navigate("/")}
            className="w-8 h-8 flex items-center justify-center rounded-full border-2 border-black text-black hover:bg-slate-100 transition bg-white cursor-pointer"
          >
            <ArrowBackIosNewIcon style={{ fontSize: 14 }} />
          </button>
          <h2 className="text-xl font-bold text-black m-0">Log In</h2>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email" name="email" value={form.email} onChange={change}
              onKeyDown={(e) => e.key === "Enter" && submit()}
              placeholder="name@example.com"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <PasswordInput
              name="password" value={form.password} onChange={change}
              onKeyDown={(e) => e.key === "Enter" && submit()}
              placeholder="••••••••"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
            />
          </div>
        </div>

        {error && (
          <div className="mt-4 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
            <p className="text-red-600 text-sm font-medium text-center m-0">{error}</p>
          </div>
        )}

        <button
          onClick={submit}
          disabled={loading}
          className="cursor-pointer w-full mt-6 bg-[#2255cc] hover:bg-[#1a44bb] text-white font-semibold py-2.5 rounded-full transition disabled:opacity-60"
        >
          {loading ? "Logging in..." : "Log In"}
        </button>

        <p className="text-center text-sm text-gray-400 mt-4">
          No account?{" "}
          <button onClick={() => navigate("/Create-Account")} className="text-[#2255cc] font-semibold bg-transparent border-none cursor-pointer p-0">
            Create one
          </button>
        </p>
      </div>
    </div>
  );
}
