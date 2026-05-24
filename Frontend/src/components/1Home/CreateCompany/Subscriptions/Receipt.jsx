import { useNavigate } from "react-router";
import SubscriptionPlan from "./subscriptionplan";

export default function Receipt() {
  const navigate = useNavigate();

  const rows = [
    { label: "Plan", value: "Standard — ₱899/month" },
    { label: "Billing", value: "Monthly, billed on activation" },
    { label: "Payment method", value: "QR Ph" },
    { label: "Mayor's Permit", value: "✓ Uploaded" },
    { label: "DTI / SEC Registration", value: "✓ Uploaded" },
    { label: "BIR Certificate", value: "✓ Uploaded" },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0d1b3e] relative overflow-hidden px-4">

      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[350px] bg-blue-600 opacity-10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 right-1/4 translate-x-1/2 -translate-y-1/2 w-[400px] h-[300px] bg-blue-400 opacity-8 rounded-full blur-3xl" />
      </div>

      {/* Card */}
      <div
        className="relative z-10 bg-white rounded-2xl px-8 pt-7 pb-8 w-full max-w-2xl mx-4"
        style={{
          boxShadow: "0 8px 48px rgba(0,0,0,0.45), 0 2px 8px rgba(0,0,0,0.3)",
          animation: "fadeUp 0.55s cubic-bezier(0.22,1,0.36,1) both",
        }}
      >
        {/* Header */}
        <div className="flex items-center gap-3 mb-1">
          <button
            onClick={() => navigate(-1)}
            className="w-8 h-8 flex items-center justify-center rounded-full border border-slate-300 text-slate-500 hover:bg-slate-100 transition shrink-0"
          >
            ←
          </button>
          <h2 className="text-xl font-bold" style={{ color: "#000000" }}>
            Payment Review
          </h2>
        </div>

        <p className="text-xs text-slate-400 mb-5 text-left">
          Please confirm all details before submitting
        </p>

        {/* Rows */}
        <div className="divide-y divide-slate-100">
          {rows.map((row) => (
            <div key={row.label} className="flex justify-between items-center py-2.5 text-sm">
              <span className="text-slate-600">{row.label}</span>
              <span className="font-medium text-right text-slate-800">
                {row.value}
              </span>
            </div>
          ))}

          {/* Total Row */}
          <div className="flex justify-between items-center py-2.5">
            <span className="text-sm font-bold text-slate-900">Total</span>
            <span className="text-sm font-bold text-slate-900">₱899.00</span>
          </div>
        </div>

        {/* Disclaimer */}
        <p className="text-xs text-slate-400 mt-4 mb-8 leading-relaxed text-center">
          By submitting, you agree to our Terms of Service. Your account will be reviewed by
          the System Admin before access is granted. You will receive an email once approved.
        </p>

        {/* Continue Button */}
        <div className="flex justify-center mt-4"></div>
        <button
          onClick={() => navigate("/payment")}
          className="w-full bg-[#1a2e6b] hover:bg-[#15306a] text-white text-sm font-semibold py-3 rounded-full transition"
        >
          Continue to Payment
        </button>
      </div>

      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
}