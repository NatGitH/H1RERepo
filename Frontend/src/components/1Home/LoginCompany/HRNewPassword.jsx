import { useState } from "react";
import { useNavigate } from "react-router";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";

export default function HRNewPassword() {
  const navigate = useNavigate();
  const [showSuccess, setShowSuccess] = useState(false);

  const [form, setForm] = useState({
    newPassword: "",
    confirmPassword: "",
  });

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = () => {
    if (form.newPassword !== form.confirmPassword) {
      alert("Passwords do not match.");
      return;
    }
    setShowSuccess(true);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0d1b3e] relative overflow-hidden">

      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[350px] bg-blue-600 opacity-10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 right-1/4 translate-x-1/2 -translate-y-1/2 w-[400px] h-[300px] bg-blue-400 opacity-10 rounded-full blur-3xl" />
      </div>

      <div
        className="bg-white rounded-2xl px-8 pt-7 pb-8 w-full max-w-sm mx-4 relative z-10"
        style={{
          border: "2px solid #1a1a2e",
          boxShadow: "6px 6px 0px #000000",
        }}
      >

        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => navigate(-1)}
            className="w-8 h-8 aspect-square flex items-center justify-center rounded-full border-2 border-black text-black hover:bg-slate-100 transition"
          >
            <ArrowBackIosNewIcon style={{ fontSize: 14 }} />
          </button>
          <h2 className="text-xl font-bold text-black">Forgot Password</h2>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              New Password
            </label>
            <input
              type="password"
              name="newPassword"
              value={form.newPassword}
              onChange={handleChange}
              placeholder="••••••••"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Re-Enter New Password
            </label>
            <input
              type="password"
              name="confirmPassword"
              value={form.confirmPassword}
              onChange={handleChange}
              placeholder="••••••••"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
            />
          </div>
        </div>

        <div className="mt-6">
          <button
            onClick={handleSubmit}
            className="w-full bg-[#0d1b3e] hover:bg-[#162553] text-white font-semibold py-2.5 rounded-lg transition duration-200"
          >
            Change Password
          </button>
        </div>

      </div>

       {/*modal for success */}
      {showSuccess && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div
            className="bg-white rounded-2xl px-10 pt-8 pb-8 w-full max-w-md mx-4 text-center"
            style={{
              border: "2px solid #1a1a2e",
              boxShadow: "1px 1px 0px #000000",
            }}
          >
            
            <div className="flex justify-center mb-4">
              <div className="w-14 h-14 rounded-full bg-green-500 flex items-center justify-center">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
            </div>

            <h2 className="text-xl font-bold text-black mb-6">
              Password Change Successfully!
            </h2>

            <button
              onClick={() => navigate("/Login-HR-Account")}
              className="bg-[#0d1b3e] hover:bg-[#162553] text-white font-semibold px-8 py-2.5 rounded-lg transition duration-200"
            >
              Go to Login
            </button>
          </div>
        </div>
      )}

    </div>
  );
}