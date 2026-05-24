import { useNavigate } from "react-router";

export default function CompanyHome() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0B2447]">
      <div
        className="bg-white rounded-2xl px-8 pt-7 pb-10 w-full max-w-xs mx-4 text-center"
        style={{ boxShadow: "0 8px 48px rgba(0,0,0,0.45)" }}
      >
        <div className="relative flex items-center justify-center mb-1">
    <button
        onClick={() => navigate(-1)}
        className="absolute left-0 w-8 h-8 flex items-center justify-center rounded-full border border-slate-300 text-slate-500 hover:bg-slate-100 transition"
    >
    </button>
    <h1 className="text-[2.2rem] font-extrabold tracking-tight leading-none">
        <span className="text-black">H</span>
        <span className="text-[#1a4ccc]">!</span>
        <span className="text-black">RE</span>
    </h1>
        </div>

        <p className="text-sm text-gray-400 mb-6">Tech Stack</p>

        <button
          onClick={() => navigate("/login-company")}
          className="w-full py-3 rounded-full bg-[#2255cc] hover:bg-[#1a44bb] text-white font-semibold text-base transition mb-3"
        >
          Sign In
        </button>

        <button
          onClick={() => navigate("/signup-company")}
          className="w-full py-3 rounded-full bg-[#1a3a8f] hover:bg-[#153075] text-white font-semibold text-base transition"
        >
          Log in
        </button>
      </div>
    </div>
  );
}