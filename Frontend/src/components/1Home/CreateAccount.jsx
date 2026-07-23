import { useNavigate } from "react-router";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";

// Revision #7 — account-type picker. Company Owner keeps the existing multi-step
// Create Company flow; HR User goes to the new self-signup.
export default function CreateAccount() {
  const navigate = useNavigate();

  const options = [
    { title: "Company Owner", desc: "Register your company, manage HR staff, and review applicants.", route: "/Create-Company", emoji: "🏢" },
    { title: "HR User",       desc: "Screen applicants for the companies that invite you to join.",     route: "/HR-Signup",      emoji: "👤" },
  ];

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
        <div className="flex items-center gap-3 mb-5">
          <button
            onClick={() => navigate("/")}
            className="w-8 h-8 flex items-center justify-center rounded-full border-2 border-black text-black hover:bg-slate-100 transition bg-white cursor-pointer"
          >
            <ArrowBackIosNewIcon style={{ fontSize: 14 }} />
          </button>
          <h2 className="text-xl font-bold text-black m-0">Create Account</h2>
        </div>

        <p className="text-sm text-slate-400 mb-5">Choose the type of account you'd like to create.</p>

        <div className="flex flex-col gap-3">
          {options.map((o) => (
            <button
              key={o.route}
              onClick={() => navigate(o.route)}
              className="text-left flex items-start gap-3 p-4 rounded-2xl border-2 border-slate-200 hover:border-[#2255cc] hover:bg-slate-50 transition cursor-pointer bg-white"
            >
              <span className="text-2xl leading-none">{o.emoji}</span>
              <span className="flex flex-col gap-0.5">
                <span className="font-bold text-[#0B2447]">{o.title}</span>
                <span className="text-xs text-slate-500 leading-relaxed">{o.desc}</span>
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
