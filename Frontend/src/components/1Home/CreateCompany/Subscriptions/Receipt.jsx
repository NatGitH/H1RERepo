import { useNavigate } from "react-router";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";

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
    <div className="min-h-screen flex items-center justify-center bg-[#0B2447] relative overflow-hidden px-4">

      {/* Glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[350px] bg-blue-600 opacity-10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 right-1/4 translate-x-1/2 -translate-y-1/2 w-[400px] h-[300px] bg-blue-400 opacity-8 rounded-full blur-3xl" />
      </div>

      {/* Card */}
      <div
        className="relative z-10 bg-white rounded-2xl px-8 pt-6 pb-6 w-full max-w-2xl mx-4"
        style={{ border: "2px solid #1a1a2e", boxShadow: "6px 6px 0px #000000" }}
      >
        {/* Header */}
        <div className="flex items-center gap-3 mb-1">
          <button
            onClick={() => navigate(-1)}
            className="w-8 h-8 flex items-center justify-center rounded-full border-2 border-black hover:bg-slate-100 transition cursor-pointer shrink-0"
          >
            <ArrowBackIosNewIcon style={{ fontSize: 14 }} />
          </button>
          <h2 className="text-xl font-bold text-black">Payment Review</h2>
        </div>

        <p className="text-xs text-slate-400 mb-5 text-left">
          Please confirm all details before submitting
        </p>

        {/* Rows */}
        <div className="divide-y divide-slate-100">
          {rows.map((row) => (
            <div key={row.label} className="flex justify-between items-center py-2.5 text-sm">
              <span className="text-slate-600">{row.label}</span>
              <span className="font-medium text-right text-slate-800">{row.value}</span>
            </div>
          ))}

          {/* Total */}
          <div className="flex justify-between items-center py-2.5">
            <span className="text-sm font-bold text-slate-900">Total</span>
            <span className="text-sm font-bold text-slate-900">₱899.00</span>
          </div>
        </div>

        {/* Disclaimer */}
        <p className="text-xs text-slate-400 mt-4 mb-6 leading-relaxed text-center">
          By submitting, you agree to our Terms of Service. Your account will be reviewed by
          the System Admin before access is granted. You will receive an email once approved.
        </p>

        {/* Button */}
        <button
          onClick={() => navigate("/payment")}
          className="w-full bg-[#0d1b3e] hover:bg-[#162553] text-white text-sm font-semibold py-3 rounded-lg transition duration-200"
        >
          Continue to Payment
        </button>
      </div>
    </div>
  );
}