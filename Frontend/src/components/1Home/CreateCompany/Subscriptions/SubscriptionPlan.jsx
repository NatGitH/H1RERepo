import { useNavigate } from "react-router";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import { useCompanyRegistration } from "../../../../.Context/CompanyRegistrationContext";


export default function SubscriptionPlan() {
  const navigate = useNavigate();
  const { registrationData, updateData } = useCompanyRegistration();

  const plans = [
    {
      name: "Basic (30 days)",
      price: "FREE",
      priceLabel: null,
      description: "Ideal for small businesses testing the platform",
      planType: "free",
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
      planType: "standard",
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
      planType: "enterprise",
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

  const handleSelectPlan = async (plan) => {
    updateData({ planType: plan.planType });

    const formData = new FormData();
    formData.append("company_name", registrationData.companyName);
    formData.append("email", registrationData.email);
    formData.append("password", registrationData.password);
    formData.append("staff_password", registrationData.staffPassword);
    formData.append("plan", plan.planType);
    formData.append("business_permit", registrationData.businessPermit);
    formData.append("dti_sec", registrationData.dtiSec);
    formData.append("bir", registrationData.bir);

    try {
      const res = await fetch("http://localhost:8000/api/auth/register-company/", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Registration failed");

      navigate(plan.planType === "free" ? "/login-owner" : "/receipt");
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0B2447] relative overflow-hidden px-6 py-10">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[350px] bg-blue-600 opacity-10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 right-1/4 translate-x-1/2 -translate-y-1/2 w-[400px] h-[300px] bg-blue-400 opacity-8 rounded-full blur-3xl" />
      </div>

      <div
        className="relative z-10 bg-white rounded-2xl px-10 pt-8 pb-10 w-full max-w-5xl"
        style={{ border: "2px solid #1a1a2e", boxShadow: "6px 6px 0px #000000" }}
      >
        <button
          onClick={() => navigate(-1)}
          className="absolute top-7 left-8 w-9 h-9 flex items-center justify-center rounded-full border-2 border-black hover:bg-slate-100 transition cursor-pointer"
        >
          <ArrowBackIosNewIcon style={{ fontSize: 15 }} />
        </button>

        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-black">Choose your subscription plan</h2>
          <p className="text-sm text-slate-400 mt-1">Select a plan to activate your company account</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-2xl p-6 flex flex-col bg-[#1a2e6b] text-white ${
                plan.badge ? "border-2 border-purple-500" : ""
              }`}
            >
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-purple-500 text-white text-xs font-semibold px-3 py-1 rounded-full">
                    {plan.badge}
                  </span>
                </div>
              )}

              <h3 className="text-sm font-semibold text-white mb-1">{plan.name}</h3>
              <p className="text-4xl font-extrabold text-white mb-1">{plan.price}</p>

              {plan.priceLabel && (
                <p className="text-xs text-slate-300 mb-3">{plan.priceLabel}</p>
              )}
              {plan.description && (
                <p className="text-xs text-slate-300 mb-4">{plan.description}</p>
              )}

              <hr className="border-[#2a3e7b] mb-4" />

              <ul className="flex-1 space-y-2 mb-6">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2 text-xs text-slate-200">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-green-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleSelectPlan(plan)}
                className="w-full flex items-center justify-between bg-white text-[#1a2e6b] text-sm font-semibold px-5 py-2.5 rounded-full hover:bg-slate-100 transition"
              >
                {plan.buttonLabel}
                <span className="w-6 h-6 rounded-full bg-[#1a2e6b] text-white flex items-center justify-center text-xs">→</span>
              </button>
            </div>
          ))}
        </div>

        <p className="text-center text-xs text-slate-400">
          Your account will be reviewed by System Admin before access is granted.
        </p>
      </div>
    </div>
  );
}