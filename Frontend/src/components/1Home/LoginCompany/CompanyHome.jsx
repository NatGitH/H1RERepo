import { useNavigate } from "react-router";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";

export default function CompanyHome() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0d1b3e] relative overflow-hidden">
      
  
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[350px] bg-blue-600 opacity-10 rounded-full blur-3xl" />

        <div className="absolute top-1/2 right-1/4 translate-x-1/2 -translate-y-1/2 w-[400px] h-[300px] bg-blue-400 opacity-10 rounded-full blur-3xl" />
      </div>

      <div
        className="bg-white rounded-2xl px-8 pt-6 pb-8 w-full max-w-sm mx-4 relative z-10 text-center"
        style={{
         border: "2px solid #1a1a2e",
         boxShadow: "6px 6px 0px #000000",
        }}
      >
        
        <div className="relative flex items-center justify-center mb-0">

          <button
            onClick={() => navigate(-1)}
            className="absolute left-0 w-8 h-8 flex items-center justify-center rounded-full border-2 border-black text-black hover:bg-slate-100 transition"
          >
            <ArrowBackIosNewIcon style={{ fontSize: 14 }} />
          </button>

          <div className="text-center">
            <h1 className="text-[3rem] font-extrabold tracking-tight leading-none">
              <span className="text-black">H</span>
              <span className="text-blue-600">!</span>
              <span className="text-black">RE</span>
            </h1>

            <p className="text-gray-400 font-semibold">
              Tech Stack
            </p>
          </div>
        </div>

        <div className="space-y-5 mt-6">
          <button
            onClick={() => navigate("/Create-HR-Account")}
            className="w-full bg-[#0d1b3e] hover:bg-[#162553] text-white font-semibold py-4 rounded-2xl transition duration-200"
          >
            Sign In
          </button>

          <button
            onClick={() => navigate("/Login-HR-Account")}
            className="w-full bg-[#0d1b3e] hover:bg-[#162553] text-white font-semibold py-4 rounded-2xl transition duration-200"
          >
            Log in
          </button>
        </div>
      </div>
    </div>
  );
}