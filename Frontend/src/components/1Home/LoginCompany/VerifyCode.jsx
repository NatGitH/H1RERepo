import { useState } from "react";
import { useNavigate } from "react-router";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";

export default function VerifyCode() {
  const navigate = useNavigate();
  const [code, setCode] = useState("");
  const [showResent, setShowResent] = useState(false);

  const handleResend = () => {
    setShowResent(true);
    setTimeout(() => setShowResent(false), 3000);
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

        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Code
            </label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Enter code"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
            />
          </div>

          <p className="text-sm text-gray-400">
            Didn't receive a code?{" "}
            <button
              onClick={handleResend}
              className="text-blue-600 hover:underline font-medium"
            >
              Resend Code
            </button>
          </p>
        </div>

        <div className="mt-6">
          <button
            onClick={() => navigate("/HR-New-Password")}
            className="w-full bg-[#0d1b3e] hover:bg-[#162553] text-white font-semibold py-2.5 rounded-lg transition duration-200"
          >
            Send Code
          </button>
        </div>

      </div>

      {/*eto yung modal for resend code */}
      {showResent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div
            className="bg-white rounded-2xl px-10 pt-8 pb-8 w-full max-w-md mx-4 text-center"
            style={{
                border: "2px solid #1a1a2e",
                boxShadow: "1px 1px 0px #000000",
            }}
            >
            <h2 className="text-xl font-bold text-black mb-4">
                Code Resent!
            </h2>

            <p className="text-sm text-gray-400 mb-8">
                Please check your email for the new verification code.
            </p>

            <button
                onClick={() => setShowResent(false)}
                className="bg-[#0d1b3e] hover:bg-[#162553] text-white font-semibold px-8 py-2.5 rounded-lg transition duration-200"
            >
                Okay
            </button>
            </div>
        </div>
        )}
    </div>
  );
}