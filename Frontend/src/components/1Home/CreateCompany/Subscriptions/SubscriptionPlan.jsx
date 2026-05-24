import { useNavigate } from "react-router";

export default function SubscriptionPlan() {
  const navigate = useNavigate();

  const plans = [
    {
      name: "Basic (30 days)",
      price: "FREE",
      priceLabel: null,
      description: "Ideal for Small businesses testing the platform",
      features: [
        "1 active job post",
        "30 resume evaluations/month",
        "Basic HIRE Score",
        "AI summary (limited)",
      ],
      buttonLabel: "Start for free",
      badge: null,
    },
    {
      name: "Standard",
      price: "₱899",
      priceLabel: "per branch / month billed monthly.",
      description: null,
      features: [
        "All in Basic +",
        "5 active job posts",
        "500 resume evaluations / month",
        "Full HIRE Score with pros & cons",
        "Interview scheduling",
      ],
      buttonLabel: "Get Standard",
      badge: "#bestdeal",
    },
    {
      name: "Enterprise",
      price: "₱1,999",
      priceLabel: "per branch / month billed monthly.",
      description: null,
      features: [
        "All in Basic + Standard",
        "Unlimited job posts",
        "Unlimited resume evaluations",
        "Audit logs & advanced analytics",
        "Priority support & SLA",
      ],
      buttonLabel: "Get Enterprise",
      badge: null,
    },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0d1b3e] relative overflow-hidden px-6 py-10">

      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[350px] bg-blue-600 opacity-10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 right-1/4 translate-x-1/2 -translate-y-1/2 w-[400px] h-[300px] bg-blue-400 opacity-8 rounded-full blur-3xl" />
      </div>

      {/* Card */}
      <div
        className="relative z-10 bg-white rounded-2xl px-10 pt-8 pb-10 w-full max-w-5xl"
        style={{
          boxShadow: "0 8px 48px rgba(0,0,0,0.45), 0 2px 8px rgba(0,0,0,0.3)",
          animation: "fadeUp 0.55s cubic-bezier(0.22,1,0.36,1) both",
        }}
      >
        {/* Header Row */}
        <div className="flex items-center mb-8">
          <button
            onClick={() => navigate(-1)}
            className="w-8 h-8 flex items-center justify-center rounded-full border border-slate-300 text-slate-500 hover:bg-slate-100 transition shrink-0"
          >
            ←
          </button>
          <div className="flex-1 text-center pr-8">
            <h2 className="text-3xl font-bold" style={{ color: "#000000" }}>
              Choose your subscription plan
            </h2>
            <p className="text-sm text-slate-400 mt-1">Select a plan to activate your company account</p>
          </div>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className="relative rounded-2xl p-6 flex flex-col bg-[#1a2e6b] text-white text-left"
            >
              {/* Badge */}
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-purple-500 text-white text-xs font-semibold px-3 py-1 rounded-full">
                    {plan.badge}
                  </span>
                </div>
              )}

              {/* Plan Name */}
              <h3 className="text-base font-semibold text-white mb-1">{plan.name}</h3>

              {/* Price */}
              <p className="text-4xl font-extrabold text-white mb-1">{plan.price}</p>

              {/* Price Label */}
              {plan.priceLabel && (
                <p className="text-xs text-slate-300 mb-3">{plan.priceLabel}</p>
              )}

              {/* Description */}
              {plan.description && (
                <p className="text-xs text-slate-300 mb-4">{plan.description}</p>
              )}

              {/* Divider */}
              <hr className="border-[#2a3e7b] mb-4" />

              {/* Features */}
              <ul className="flex-1 space-y-2 mb-6">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2 text-xs text-slate-200 text-left">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="w-4 h-4 text-green-400 shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2.5}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>

              {/* Button */}
              <button
                onClick={() => navigate("/receipt")}
                className="w-full flex items-center justify-between bg-white text-[#1a2e6b] text-sm font-semibold px-5 py-2.5 rounded-full hover:bg-slate-100 transition"
              >
                {plan.buttonLabel}
                <span className="w-7 h-7 rounded-full bg-[#1a2e6b] text-white flex items-center justify-center text-xs">
                  →
                </span>
              </button>
            </div>
          ))}
        </div>

        {/* Footer Note */}
        <p className="text-center text-xs text-slate-400">
          Your account will be reviewed by System Admin before access is granted.
        </p>
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