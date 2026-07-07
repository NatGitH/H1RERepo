import { useState } from "react";
import { useNavigate } from "react-router";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import { useLogin } from "../../../../.Context/LoginContext";
import { apiFetch, getErrorMessage } from "../../../../api";

export default function HRForgotPassword() {
  const navigate = useNavigate();
  const { loginData } = useLogin();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSend = async () => {
    if (!email.trim()) { setError("Please enter your email."); return; }
    try {
      setLoading(true);
      setError("");
      // Tag the reset by where it came from so the backend can scope it:
      //  - Owner page  -> must be a registered company owner email.
      //  - Company page -> must be a staff/manager in THIS company (not the owner,
      //    not another company). We pass the signed-into company for that check.
      const origin = sessionStorage.getItem("pwreset_origin");
      const scope =
        origin === "/Login-Owner"   ? { origin: "owner" } :
        origin === "/Login-Company" ? { origin: "staff", company_id: loginData?.companyId || "" } :
        {};
      await apiFetch("/api/auth/send-reset-code/", {
        method: "POST",
        body: { email: email.trim(), ...scope },
      });
      sessionStorage.setItem("pwreset_email", email.trim());
      navigate("/Verify-Code");
    } catch (err) {
      setError(getErrorMessage(err, "Could not send code. Please try again."));
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
        style={{
          border: "2px solid #1a1a2e",
          boxShadow: "6px 6px 0px #000000",
        }}
      >

        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => navigate("/")}
            className="w-8 h-8 aspect-square flex items-center justify-center rounded-full border-2 border-black text-black hover:bg-slate-100 transition"
          >
            <ArrowBackIosNewIcon style={{ fontSize: 14 }} />
          </button>

          <h2 className="text-xl font-bold text-black">Forgot Password</h2>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
            />
          </div>

          <p className="text-center text-sm text-gray-400">
            We'll send a verification code to this email if it matches an existing account.
          </p>
        </div>

        {error && (
          <div className="mt-4 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
            <p className="text-red-600 text-sm font-medium text-center">{error}</p>
          </div>
        )}

        <div className="mt-6">
          <button
            onClick={handleSend}
            disabled={loading}
            className="w-full bg-[#0d1b3e] hover:bg-[#162553] text-white font-semibold py-2.5 rounded-lg transition duration-200 disabled:opacity-60"
          >
            {loading ? "Sending..." : "Send Code"}
          </button>
        </div>

      </div>
    </div>
  );
}