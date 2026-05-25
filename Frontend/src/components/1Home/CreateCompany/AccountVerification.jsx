import { useState } from "react";
import { useNavigate } from "react-router";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";

export default function AccountVerification() {
  const navigate = useNavigate();
  const [modal, setModal] = useState(null);

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
          onClick={() => navigate("/company-documents")}
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
          <p className="text-sm text-slate-400 mb-5">
            Wait for the Email Confirmation...
          </p>

          <hr className="w-full border-slate-200 mb-5" />

          <p className="text-sm text-slate-500 leading-relaxed mb-6">
            The System Admin will review your company and subscription. You'll receive an email once approved.
          </p>

          <button
            onClick={() => setModal("activated")}
            className="w-full bg-[#0d1b3e] hover:bg-[#162553] text-white font-semibold py-3 rounded-lg transition duration-200 text-sm"
          >
            Next
          </button>

        </div>
      </div>



      {modal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ backgroundColor: "rgba(0,0,0,0.55)" }}
          onClick={() => setModal(null)}
        >


          <div
            className="bg-white rounded-2xl px-12 pt-10 pb-10 w-full max-w-lg relative"
            style={{ border: "2px solid #1a1a2e", boxShadow: "6px 6px 0px #000000" }}
            onClick={(e) => e.stopPropagation()}
          >


            <button
              onClick={() => setModal(null)}
              className="absolute top-5 right-5 w-9 h-9 flex items-center justify-center rounded-full border-2 border-gray-300 hover:bg-slate-100 transition"
            >
              <CloseIcon style={{ fontSize: 16 }} />
            </button>

            <div className="flex flex-col items-center text-center">



              {modal === "activated" ? (
                <div className="w-20 h-20 rounded-full bg-green-500 flex items-center justify-center mb-6">
                  <CheckIcon style={{ fontSize: 42, color: "white" }} />
                </div>
              ) : (
                <div className="w-20 h-20 rounded-full bg-red-500 flex items-center justify-center mb-6">
                  <CloseIcon style={{ fontSize: 42, color: "white" }} />
                </div>
              )}


              <h2 className="text-2xl font-bold text-black mb-2">
                {modal === "activated" ? "Account Activated!" : "Account Denied"}
              </h2>


              <p className="text-sm text-slate-400 mb-6 leading-relaxed">
                {modal === "activated"
                  ? "Your company account is now active. You can start posting jobs and evaluating candidates."
                  : "Your company account was not approved. Please review your submitted documents and try again."}
              </p>

              <hr className="w-full border-slate-200 mb-6" />


              {modal === "activated" ? (
                <button
                  onClick={() => navigate("/subscription-plan")}
                  className="w-full bg-[#0d1b3e] hover:bg-[#162553] text-white font-semibold py-3 rounded-lg transition duration-200 text-sm"
                >
                  Continue
                </button>
              ) : (
                <div className="flex flex-col gap-3 w-full">
                  <button
                    onClick={() => navigate("/company-documents")}
                    className="w-full bg-[#0d1b3e] hover:bg-[#162553] text-white font-semibold py-3 rounded-lg transition duration-200 text-sm"
                  >
                    Re-submit Documents
                  </button>
                  <button
                    onClick={() => setModal(null)}
                    className="w-full border-2 border-gray-300 text-gray-600 font-semibold py-3 rounded-lg hover:bg-slate-50 transition duration-200 text-sm"
                  >
                    Close
                  </button>
                </div>
              )}

            </div>
          </div>
        </div>
      )}

    </div>
  );
}