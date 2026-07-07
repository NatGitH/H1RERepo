import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import { useCompanyRegistration } from "../../../.Context/CompanyRegistrationContext";
import { apiFetch } from "../../../api";

export default function AccountVerification() {
  const navigate = useNavigate();
  const { registrationData } = useCompanyRegistration();

  const [status, setStatus]   = useState("pending");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const data = await apiFetch("/api/auth/check-approval-status/", {
          method: "POST",
          body: { email: registrationData.email },
        });
        setStatus(data.status);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    checkStatus();
    const interval = setInterval(checkStatus, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0B2447] relative overflow-hidden">

      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[350px] bg-blue-600 opacity-10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 right-1/4 translate-x-1/2 -translate-y-1/2 w-[400px] h-[300px] bg-blue-400 opacity-8 rounded-full blur-3xl" />
      </div>

      <div
        className="bg-white rounded-2xl px-12 pt-8 pb-8 w-full max-w-md mx-4 relative z-10"
        style={{ border: "2px solid #1a1a2e", boxShadow: "6px 6px 0px #000000" }}
      >
        <button
          onClick={() => navigate("/")}
          className="absolute top-6 left-6 w-9 h-9 flex items-center justify-center rounded-full border-2 border-black hover:bg-slate-100 transition cursor-pointer"
        >
          <ArrowBackIosNewIcon style={{ fontSize: 15 }} />
        </button>

        <div className="flex flex-col items-center text-center pt-6">

          <div className="w-20 h-20 rounded-full border-2 border-[#1a1a2e] flex items-center justify-center mb-5">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-10 h-10 text-slate-800"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.8}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
          </div>

          <h2 className="text-xl font-bold text-black mb-1">
            Account for Verification
          </h2>

          {loading ? (
            <p className="text-sm text-slate-400 mb-5">Checking status...</p>
          ) : status === "pending" ? (
            <p className="text-sm text-slate-400 mb-5">
              Wait for the Admin's Approval...
            </p>
          ) : status === "approved" ? (
            <p className="text-sm text-green-600 font-semibold mb-5">
              Your company has been approved!
            </p>
          ) : (
            <p className="text-sm text-red-500 font-semibold mb-5">
              Your company registration was rejected.
            </p>
          )}

          <hr className="w-full border-slate-200 mb-5" />

          <p className="text-sm text-slate-500 leading-relaxed mb-6">
            {status === "approved"
              ? "You can now log in and start using H!RE."
              : "The System Admin will review your company and subscription. This page will automatically update once a decision is made."}
          </p>

          {status === "approved" && (
            <button
              onClick={() => navigate("/Login-Owner")}
              className="w-full bg-[#0d1b3e] hover:bg-[#162553] text-white font-semibold py-3 rounded-lg transition duration-200 text-sm"
            >
              Go to Login
            </button>
          )}

        </div>
      </div>
    </div>
  );
}