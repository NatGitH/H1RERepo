import { useNavigate } from "react-router";

export default function AccountActivated() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0B2447] relative overflow-hidden">

      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[350px] bg-blue-600 opacity-10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 right-1/4 translate-x-1/2 -translate-y-1/2 w-[400px] h-[300px] bg-blue-400 opacity-8 rounded-full blur-3xl" />
      </div>

      {/* Card */}
      <div
        className="relative z-10 bg-white rounded-2xl px-8 pt-7 pb-10 w-full max-w-md mx-4"
        style={{
          boxShadow: "0 8px 48px rgba(0,0,0,0.45), 0 2px 8px rgba(0,0,0,0.3)",
          animation: "fadeUp 0.55s cubic-bezier(0.22,1,0.36,1) both",
        }}
      >
        {/* Back Button */}
        <div className="mb-4">
          <button
            onClick={() => navigate(-1)}
            className="w-8 h-8 flex items-center justify-center rounded-full border border-slate-300 text-slate-500 hover:bg-slate-100 transition"
          >
            ←
          </button>
        </div>

        {/* Green Check Icon */}
        <div className="flex justify-center mb-5">
          <div className="w-16 h-16 rounded-full bg-green-500 flex items-center justify-center shadow-lg">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-9 h-9 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
        </div>

        {/* Title */}
        <h2 className="text-center text-xl font-bold mb-1" style={{ color: "#000000" }}>
          Account Activated!
        </h2>

        {/* Subtitle */}
        <p className="text-center text-sm text-slate-400 mb-6">
          Your company account is now active. You can start posting 
          jobs and evaluating candidates.
        </p>

        {/* Next Button */}
        <div className="flex justify-center mt-8">
          <button
            onClick={() => navigate("/subscription-plan")}
            className="bg-[#1a3a6b] hover:bg-[#15306a] text-white text-sm font-semibold px-10 py-2.5 rounded-full transition"
          >
          NEXT
        </button>
        </div>

      </div>

      {/* Keyframe */}
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
}