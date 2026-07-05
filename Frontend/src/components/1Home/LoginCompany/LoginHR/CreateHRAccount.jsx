import { useState } from "react";
import { useNavigate } from "react-router";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import { useLogin } from '../../../../.Context/LoginContext';
import { useAuth } from '../../../../.Context/AuthContext';
import { useHRRegistration } from '../../../../.Context/HRRegistrationContext';

export default function CreateHRAccount() {
  const navigate = useNavigate();

  const { loginData } = useLogin();
  const { auth } = useAuth();
  const { updateData } = useHRRegistration();

  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = () => {
    if (!form.username || !form.email || !form.password) {
      window.showAlert("Please fill in all fields.");
      return;
    }
    if (form.password !== form.confirmPassword) {
      window.showAlert("Passwords do not match.");
      return;
    }

    const company_id = loginData.companyId || auth.companyId;
    if (!company_id) {
      window.showAlert("Missing company information. Please restart registration.");
      return;
    }

    updateData({
      username: form.username,
      email: form.email,
      password: form.password,
    });

    navigate("/Create-HR-Profile");
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
            onClick={() => navigate("/")}
            className="w-8 h-8 flex items-center justify-center rounded-full border-2 border-black text-black hover:bg-slate-100 transition"
          >
            <ArrowBackIosNewIcon style={{ fontSize: 14 }} />
          </button>

          <h2 className="text-center text-xl font-bold text-black">
            Create an account
          </h2>
        </div>

        <div className="space-y-4">

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Username
            </label>

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
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>

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
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>

            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="••••••••"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Confirm Password
            </label>

            <input
              type="password"
              name="confirmPassword"
              value={form.confirmPassword}
              onChange={handleChange}
              placeholder="••••••••"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
            />
          </div>
        </div>

        <p className="text-center text-sm text-gray-500 mt-6">
          Already have an account?{" "}
          <button
            onClick={() => navigate("/Login-HR-Account")}
            className="text-blue-600 hover:underline font-medium"
          >
            Click Here
          </button>
        </p>

        <div className="mt-5">
          <button
            onClick={handleSubmit}
            className="w-full bg-[#0d1b3e] hover:bg-[#162553] text-white font-semibold py-4 rounded-2xl transition duration-200"
            >
            Create Account
          </button>
        </div>
      </div>
    </div>
  );
}