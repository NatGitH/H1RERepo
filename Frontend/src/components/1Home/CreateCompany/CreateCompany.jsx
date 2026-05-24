import { useState } from "react";
import { useNavigate } from "react-router";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import CloseIcon from "@mui/icons-material/Close";

export default function CreateCompany() {
  const navigate = useNavigate();
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [form, setForm] = useState({
    companyName: "",
    email: "",
    password: "",
    confirmPassword: "",
    agreed: false,
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = () => {
    if (!form.companyName || !form.email || !form.password || !form.confirmPassword) {
      alert("Please fill in all fields.");
      return;
    }
    if (form.password !== form.confirmPassword) {
      alert("Passwords do not match.");
      return;
    }
    if (!form.agreed) {
      alert("You must agree to the Data Policies.");
      return;
    }
    navigate("/company-documents");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0B2447]">

      {/* Glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[350px] bg-blue-600 opacity-10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 right-1/4 translate-x-1/2 -translate-y-1/2 w-[400px] h-[300px] bg-blue-400 opacity-8 rounded-full blur-3xl" />
      </div>

      {/* Card */}
      <div
        className="bg-white rounded-2xl px-8 pt-7 pb-8 w-full max-w-md mx-4"
        style={{ border: "2px solid #1a1a2e", boxShadow: "6px 6px 0px #1a1a2e" }}
      >
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => navigate("/")}
            className="w-8 h-8 flex items-center justify-center rounded-full border-2 border-black hover:bg-slate-100 transition cursor-pointer"
          >
            <ArrowBackIosNewIcon style={{ fontSize: 14 }} />
          </button>
          <h2 className="font-bold text-black text-xl m-0">Create a company</h2>
        </div>

        {/* Fields */}
        <div className="flex flex-col gap-4">
          {[
            { label: "Company Name:", name: "companyName", type: "text", placeholder: "Tech Stack" },
            { label: "Company Owner's Email:", name: "email", type: "email", placeholder: "TechStack@gmail.com" },
            { label: "Owner's Password:", name: "password", type: "password", placeholder: "••••••••••" },
            { label: "Re-Enter Owner's Password:", name: "confirmPassword", type: "password", placeholder: "••••••••••" },
          ].map(({ label, name, type, placeholder }) => (
            <div key={name}>
              <label className="text-xs font-medium text-slate-600 mb-1 block">{label}</label>
              <input
                type={type}
                name={name}
                value={form[name]}
                onChange={handleChange}
                placeholder={placeholder}
                className="w-full rounded-full border-2 border-black px-4 py-2 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-blue-400 transition"
              />
            </div>
          ))}
        </div>

        {/* Already have a company */}
        <p className="text-center text-xs text-slate-400 mt-4">
          Already have a company?{" "}
          <button
            type="button"
            onClick={() => navigate("/login-company")}
            className="text-[#1a4ccc] font-semibold hover:underline bg-transparent border-none p-0 text-xs cursor-pointer"
          >
            Click Here
          </button>
        </p>

        {/* Checkbox */}
        <div className="flex items-center gap-2 mt-3">
          <input
            type="checkbox"
            name="agreed"
            id="agreed"
            checked={form.agreed}
            onChange={handleChange}
            className="w-3.5 h-3.5 accent-[#1a4ccc] cursor-pointer flex-shrink-0"
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

        {/* Submit */}
        <button
          onClick={handleSubmit}
          className="mt-5 w-full text-white text-sm font-semibold py-2.5 rounded-full transition-all duration-150 active:scale-95 hover:brightness-110 hover:-translate-y-0.5 cursor-pointer"
          style={{ background: "#1a3caa", border: "2px solid black"}}
        >
          Next
        </button>
      </div>

      {/* Data Privacy Modal */}
      {showPrivacy && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center  px-4"
          onClick={() => setShowPrivacy(false)}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-2xl flex flex-col"
            style={{ height: "85vh", border: "2px solid #1a1a2e", boxShadow: "6px 6px 0px #1a1a2e" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="relative flex items-center justify-center px-6 pt-4 pb-3 border-b border-slate-100 flex-shrink-0">
              <div className="border-2 border-black rounded-full px-4 py-1">
                <span className="font-bold text-black text-lg">Data Privacy Notice</span>
              </div>
              <button
                onClick={() => setShowPrivacy(false)}
                className="absolute right-6 w-8 h-8 flex items-center justify-center rounded-full border-2 border-black hover:bg-slate-100 transition"
              >
                <CloseIcon style={{ fontSize: 16 }} />
              </button>
            </div>

            {/* Scrollable Content */}
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

            {/* Modal Footer */}
            <div className="px-8 py-4 border-t border-slate-100 flex-shrink-0">
              <button
                onClick={() => { form.agreed || setForm(p => ({ ...p, agreed: true })); setShowPrivacy(false); }}
                className="w-full py-2.5 text-white text-sm font-semibold rounded-full transition active:scale-95"
                style={{ background: "#1a3caa", border: "2px solid black", boxShadow: "3px 3px 0px #000" }}
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