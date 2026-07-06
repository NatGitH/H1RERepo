import { useState } from "react";
import { useNavigate } from "react-router";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import { useAuth } from "../../.Context/AuthContext";
import { apiFetch, getErrorMessage } from "../../api";
import PasswordInput from "../Functions/PasswordInput";

export default function LoginAdmin() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [form, setForm]     = useState({ username: "", email: "", password: "" });
  const [error, setError]   = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleLogin = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await apiFetch("/api/auth/login-admin/", {
        method: "POST",
        body: {
          username: form.username,
          email:    form.email,
          password: form.password,
        },
      });

      login({
        token:   data.token,
        role:    data.role,
        adminId: data.admin_id,
        email:   form.email,
      });

      navigate("/Admin-Dashboard");
    } catch (err) {
      setError(getErrorMessage(err, "Invalid credentials"));
    } finally {
      setLoading(false);
    }
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
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => navigate("/")}
            className="w-8 h-8 aspect-square flex items-center justify-center rounded-full border-2 border-black text-black hover:bg-slate-100 transition"
          >
            <ArrowBackIosNewIcon style={{ fontSize: 14 }} />
          </button>
          <h2 className="text-xl font-bold text-black">Admin</h2>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Username:</label>
            <input
              type="text"
              name="username"
              value={form.username}
              onChange={handleChange}
              placeholder="Enter username"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email:</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="name@example.com"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password:</label>
            <PasswordInput
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="••••••••"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
            />
          </div>
        </div>

        {error && (
          <div className="mt-4 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
            <p className="text-red-600 text-sm font-medium text-center">{error}</p>
          </div>
        )}

        <div className="mt-6">
          <button
            onClick={handleLogin}
            disabled={loading}
            className="cursor-pointer w-full bg-[#1a3a8f] hover:bg-[#162553] text-white font-semibold py-2.5 rounded-full transition duration-200 disabled:opacity-60"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </div>
      </div>
    </div>
  );
}