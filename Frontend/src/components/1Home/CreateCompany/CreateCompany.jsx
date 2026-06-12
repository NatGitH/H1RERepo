import { useState } from "react";
import { useNavigate } from "react-router";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import CloseIcon from "@mui/icons-material/Close";
import { useCompanyRegistration } from "../../../.Context/CompanyRegistrationContext";

export default function CreateCompany() {
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const { updateData } = useCompanyRegistration();
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [form, setForm] = useState({
    companyName: "",
    email: "",
    password: "",
    confirmPassword: "",
    staffPassword: "",
    confirmStaffPassword: "",
    agreed: false,
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

    const handleSubmit = async () => {
      setError("");

    if (!form.companyName || !form.email || !form.password || !form.confirmPassword) {
      setError("Please fill in all fields.");
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (form.staffPassword !== form.confirmStaffPassword) {
      setError("Staff passwords do not match.");
      return;
    }

    if (!form.agreed) {
      setError("You must agree to the Data Policies.");
      return;
    }

    // Check if company name already exists
    try {
      const res = await fetch("http://localhost:8000/api/auth/check-company-name/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ company_name: form.companyName }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error);
        return;
      }
    } catch (err) {
      setError("Something went wrong. Please try again.");
      return;
    }

    updateData({
      companyName: form.companyName,
      email: form.email,
      password: form.password,
      staffPassword: form.staffPassword,
    });
    navigate("/company-documents");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0B2447]">

      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[350px] bg-blue-600 opacity-10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 right-1/4 translate-x-1/2 -translate-y-1/2 w-[400px] h-[300px] bg-blue-400 opacity-8 rounded-full blur-3xl" />
      </div>

      <div
        className="bg-white rounded-2xl px-8 pt-6 pb-6 w-full max-w-sm mx-4 relative z-10"
        style={{ border: "2px solid #1a1a2e", boxShadow: "6px 6px 0px #000000" }}
      >
        <div className="flex items-center gap-3 mb-5">
          <button
            onClick={() => navigate("/")}
            className="w-8 h-8 flex items-center justify-center rounded-full border-2 border-black hover:bg-slate-100 transition cursor-pointer"
          >
            <ArrowBackIosNewIcon style={{ fontSize: 14 }} />
          </button>
          <h2 className="text-xl font-bold text-black">Create Company</h2>
        </div>

        <div className="flex flex-col gap-2">
          {[
            { label: "Company Name", name: "companyName", type: "text", placeholder: "Tech Stack" },
            { label: "Email", name: "email", type: "email", placeholder: "TechStack@gmail.com" },
            { label: "Password", name: "password", type: "password", placeholder: "••••••••••" },
            { label: "Re-Enter Password", name: "confirmPassword", type: "password", placeholder: "••••••••••" },
            { label: "Staff Password", name: "staffPassword", type: "password", placeholder: "••••••••••" },
            { label: "Re-Enter Staff Password", name: "confirmStaffPassword", type: "password", placeholder: "••••••••••" },
          ].map(({ label, name, type, placeholder }) => (
            <div key={name}>
              <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
              <input
                type={type}
                name={name}
                value={form[name]}
                onChange={handleChange}
                placeholder={placeholder}
                className="w-full px-4 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
              />
            </div>
          ))}
        </div>

        <p className="text-center text-xs text-slate-400 mt-3">
          Already have a company?{" "}
          <button
            type="button"
            onClick={() => navigate("/login-company")}
            className="text-[#1a4ccc] font-semibold hover:underline bg-transparent border-none p-0 text-xs cursor-pointer"
          >
            Click Here
          </button>
        </p>

        <div className="flex items-start gap-2 mt-3">
          <input
            type="checkbox"
            name="agreed"
            id="agreed"
            checked={form.agreed}
            onChange={handleChange}
            className="w-3.5 h-3.5 accent-[#1a4ccc] cursor-pointer flex-shrink-0 mt-0.5"
          />
          <p className="text-xs text-slate-500 m-0">
            By signing up you agree to our{" "}
            <button
              type="button"
              onClick={() => setShowPrivacy(true)}
              className="text-[#1a4ccc] font-semibold hover:underline bg-transparent border-none p-0 text-xs cursor-pointer"
            >
              Data Policies
            </button>
          </p>
        </div>

        {error && (
        <div className="mt-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          <p className="text-red-600 text-sm font-medium text-center">{error}</p>
        </div>
      )}

      <button
        onClick={handleSubmit}
        className="mt-5 w-full bg-[#0d1b3e] hover:bg-[#162553] text-white font-semibold py-2.5 rounded-lg transition duration-200"
      >
        Next
      </button>
      </div>

      {showPrivacy && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          onClick={() => setShowPrivacy(false)}
        >
          <div
            className="bg-white rounded-3xl w-full max-w-3xl flex flex-col overflow-hidden"
            style={{ height: "85vh", border: "2px solid #1a1a2e", boxShadow: "8px 8px 0px #000000" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative flex items-center justify-center px-6 py-5 border-b border-slate-200 flex-shrink-0">
              <h3 className="text-2xl font-bold text-black">Data Privacy Notice</h3>
              <button
                onClick={() => setShowPrivacy(false)}
                className="absolute right-6 w-9 h-9 flex items-center justify-center rounded-full border border-gray-300 hover:bg-slate-100 transition"
              >
                <CloseIcon style={{ fontSize: 18 }} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-8 py-4 text-xs text-slate-700 leading-relaxed space-y-4 text-left">
              <p>At H!RE, we are committed to protecting your privacy. This Data Privacy Notice explains how we collect, use, and secure your personal information when you use our AI-powered platform to manage recruitment, evaluate candidates, and apply for jobs.</p>

              {[
                {
                  title: "1. Data We Collect",
                  content: (
                    <>
                      <p className="mt-1">To facilitate AI-driven job matching and evaluation, we collect and process the following personal data:</p>
                      <p className="font-semibold mt-2">For All Users:</p>
                      <ul className="list-disc ml-6 mt-1 space-y-1">
                        <li><span className="font-semibold">Account Credentials:</span> Full Name, Email Address, Password.</li>
                      </ul>
                      <p className="font-semibold mt-2">For Job Applicants:</p>
                      <ul className="list-disc ml-6 mt-1 space-y-1">
                        <li><span className="font-semibold">Professional Information:</span> Uploaded Resume/CV, Job Position applying for.</li>
                        <li><span className="font-semibold">AI Evaluation Data:</span> H!RE Score, AI-generated Pros, Cons, and Summary.</li>
                        <li><span className="font-semibold">Communication Data:</span> Messages, interview schedules, and status updates.</li>
                      </ul>
                      <p className="font-semibold mt-2">For Company / HR Accounts:</p>
                      <ul className="list-disc ml-6 mt-1 space-y-1">
                        <li><span className="font-semibold">Company Details:</span> Company Name, Email, Password.</li>
                        <li><span className="font-semibold">Job Postings:</span> Titles, descriptions, requirements, and preferences.</li>
                        <li><span className="font-semibold">Recruitment Activity:</span> Evaluations, interview schedules, and hiring decisions.</li>
                      </ul>
                    </>
                  ),
                },
                { title: "2. How We Use Your Data", content: <ul className="list-disc ml-6 mt-1 space-y-1"><li>Match applicants with job postings using AI analysis.</li><li>Generate H!RE Scores and AI-powered evaluations.</li><li>Facilitate communication between applicants and recruiters.</li><li>Maintain and improve platform performance and security.</li><li>Comply with legal obligations under applicable data protection laws.</li></ul> },
                { title: "3. Data Sharing", content: <><p className="mt-1">We do not sell your personal data. We may share data with:</p><ul className="list-disc ml-6 mt-1 space-y-1"><li><span className="font-semibold">AI Service Providers:</span> To process resumes and generate evaluations.</li><li><span className="font-semibold">Authorized Company HR Staff:</span> Applicant data is visible to the company you applied to.</li><li><span className="font-semibold">Legal Authorities:</span> If required by law or to protect platform integrity.</li></ul></> },
                { title: "4. Data Retention", content: <p className="mt-1">Your data is retained for as long as your account is active or as needed to provide services. You may request deletion at any time by contacting our support team.</p> },
                { title: "5. Your Rights", content: <ul className="list-disc ml-6 mt-1 space-y-1"><li>Access the personal data we hold about you.</li><li>Request correction of inaccurate data.</li><li>Request deletion of your data.</li><li>Withdraw consent at any time.</li></ul> },
                { title: "6. Security", content: <p className="mt-1">We implement industry-standard security measures including encrypted storage, secure connections (HTTPS), and access controls to protect your data.</p> },
                { title: "7. Contact Us", content: <p className="mt-1">For any privacy concerns, contact us at: <span className="text-[#1a4ccc] font-semibold">support@hire-platform.com</span></p> },
              ].map(({ title, content }) => (
                <div key={title}>
                  <p className="font-bold text-black">{title}</p>
                  {content}
                </div>
              ))}
            </div>

            <div className="px-8 py-5 border-t border-slate-200 flex-shrink-0">
              <button
                onClick={() => {
                  form.agreed || setForm((p) => ({ ...p, agreed: true }));
                  setShowPrivacy(false);
                }}
                className="w-full bg-[#0d1b3e] hover:bg-[#162553] text-white font-semibold py-2.5 rounded-lg transition duration-200"
              >
                I Understand
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}