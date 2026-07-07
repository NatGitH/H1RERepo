import { useState } from "react";
import { useNavigate } from "react-router";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import qrCode from "../../../../assets/qr code.svg";
import { useCompanyRegistration } from "../../../../.Context/CompanyRegistrationContext";

export default function Payment() {
  const navigate = useNavigate();
  const [modal, setModal] = useState(null);
  const { registrationData } = useCompanyRegistration();
  const plan = registrationData.planType;

  const planDetails =
    plan === "enterprise"
      ? {
          name: "Enterprise ₱1,999/mo",
          amount: "₱1,999.00",
        }
      : {
          name: "Standard ₱899/mo",
          amount: "₱899.00",
        };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0B2447] relative overflow-hidden px-4">

      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[350px] bg-blue-600 opacity-10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 right-1/4 translate-x-1/2 -translate-y-1/2 w-[400px] h-[300px] bg-blue-400 opacity-8 rounded-full blur-3xl" />
      </div>

      <div
        className="relative z-10 bg-white rounded-2xl px-8 pt-6 pb-6 w-full max-w-2xl mx-4"
        style={{
          border: "2px solid #1a1a2e",
          boxShadow: "6px 6px 0px #000000",
        }}
      >

        <div className="flex items-center gap-3 mb-1">
          <button
            onClick={() => navigate("/")}
            className="w-8 h-8 flex items-center justify-center rounded-full border-2 border-black hover:bg-slate-100 transition cursor-pointer shrink-0"
          >
            <ArrowBackIosNewIcon style={{ fontSize: 14 }} />
          </button>

          <h2 className="text-xl font-bold text-black">
            Payment
          </h2>
        </div>

        <p className="text-xs text-slate-400 mb-4 text-left">
          Scan the QR code to complete your payment
        </p>

        <div className="mb-4">
          <span className="bg-[#0d1b3e] text-white text-xs font-semibold px-3 py-1.5 rounded-md">
            {planDetails.name}
          </span>
        </div>

        <div className="flex items-center justify-center gap-1.5 mb-3">
          <div className="flex items-center gap-1 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded">
            QR Ph
          </div>
        </div>

        <div className="flex justify-center mb-4">
          <div className="border-2 border-slate-800 rounded-xl overflow-hidden">
            <img
              src={qrCode}
              alt="QR Code"
              className="w-56 h-56 object-contain"
            />
          </div>
        </div>

        <p className="text-center text-2xl font-bold text-black mb-3">
          {planDetails.amount}
        </p>

        <p className="text-center text-xs text-slate-400 leading-relaxed mb-6">
          Scan the QR code using any BSP-accredited banking or e-wallet app that supports QR Ph.
        </p>

        <div className="flex flex-col gap-3">
          <button
            onClick={() => setModal("success")}
            className="w-full bg-[#0d1b3e] hover:bg-[#162553] text-white font-semibold py-3 rounded-lg transition duration-200"
          >
            Confirm Payment
          </button>

          <button
            onClick={() => setModal("failed")}
            className="w-full border border-slate-300 text-slate-600 font-semibold py-3 rounded-lg hover:bg-slate-50 transition duration-200"
          >
            Simulate Failed Payment
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
            className="bg-white rounded-2xl px-10 pt-8 pb-8 w-full max-w-md relative"
            style={{
              border: "2px solid #1a1a2e",
              boxShadow: "6px 6px 0px #000000",
            }}
            onClick={(e) => e.stopPropagation()}
          >

            <button
              onClick={() => setModal(null)}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full border border-gray-300 hover:bg-slate-100 transition"
            >
              <CloseIcon style={{ fontSize: 15 }} />
            </button>

            <div className="flex flex-col items-center text-center pt-2">

              {modal === "success" ? (
                <div className="w-20 h-20 rounded-full bg-green-500 flex items-center justify-center mb-5">
                  <CheckIcon style={{ fontSize: 42, color: "white" }} />
                </div>
              ) : (
                <div className="w-20 h-20 rounded-full bg-red-500 flex items-center justify-center mb-5">
                  <CloseIcon style={{ fontSize: 42, color: "white" }} />
                </div>
              )}

              <h2 className="text-2xl font-bold text-black mb-2">
                {modal === "success"
                  ? "Payment Successful!"
                  : "Payment Failed"}
              </h2>

              <p className="text-sm text-slate-400 mb-5 leading-relaxed">
                {modal === "success"
                  ? "Your subscription is now active."
                  : "Something went wrong with your payment. Please try again or use a different method."}
              </p>

              <hr className="w-full border-slate-200 mb-5" />

              {modal === "success" ? (
                <button
                  onClick={() => navigate("/Account-Verification")}
                  className="w-full bg-[#0d1b3e] hover:bg-[#162553] text-white font-semibold py-3 rounded-lg transition duration-200 text-sm"
                >
                  Continue
                </button>
              ) : (
                <div className="flex flex-col gap-2 w-full">

                  <button
                    onClick={() => setModal(null)}
                    className="w-full bg-[#0d1b3e] hover:bg-[#162553] text-white font-semibold py-3 rounded-lg transition duration-200 text-sm"
                  >
                    Try Again
                  </button>

                  <button
                    onClick={() => navigate("/")}
                    className="w-full border border-slate-300 text-slate-600 font-semibold py-3 rounded-lg hover:bg-slate-50 transition duration-200 text-sm"
                  >
                    Go Back
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