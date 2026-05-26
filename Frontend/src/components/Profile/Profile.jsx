import { useState, useEffect } from "react";

const UserIcon = () => (
  <svg className="w-10 h-10 text-slate-400" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
  </svg>
);

const CompanyIcon = () => (
  <svg className="w-12 h-12" xmlns="http://www.w3.org/2000/svg" fill="#94a3b8" viewBox="0 0 24 24">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z" />
  </svg>
);

export default function Profile() {
  const [company, setCompany] = useState(null);
  const [interviewApplicants, setInterviewApplicants] = useState([]);

  useEffect(() => {
    fetch("/api/company/")
      .then((res) => res.json())
      .then((data) => setCompany(data))
      .catch(() => setCompany(null));

    fetch("/api/applicants/interview/")
      .then((res) => res.json())
      .then((data) => setInterviewApplicants(data))
      .catch(() => setInterviewApplicants([]));
  }, []);

  return (
    <section className="px-4 pt-1 bg-[#0B2447] min-h-screen">
      <div
        className="max-w-[1200px] mx-auto bg-white rounded-3xl pt-4 px-10 pb-6 min-h-[600px] border-2 border-[#0B2447]"
        style={{ boxShadow: "6px 6px 0px #0B2447" }}
      >
        {/* Layout: left + right */}
        <div className="grid grid-cols-[1fr_380px] gap-6 items-start max-[900px]:grid-cols-1">

          {/* LEFT: Company Info */}
          <div className="bg-[#f8fafc] rounded-[40px] p-8 min-h-[500px] shadow-[0_35px_80px_rgba(15,23,42,0.18)] border border-slate-200/20 flex flex-col gap-6">

            {/* Company Header */}
            <div className="flex items-start gap-5 relative">

              {/* Logo */}
              <div className="w-[120px] min-w-[120px] h-[120px] border-2 border-slate-200 rounded-2xl flex items-center justify-center overflow-hidden bg-[#f8fafc]">
                {company?.logo ? (
                  <img src={company.logo} alt={company.name} className="w-full h-full object-contain" />
                ) : (
                  <CompanyIcon />
                )}
              </div>

              {/* Name + Tags */}
              <div className="flex flex-col gap-3 flex-1 min-w-0">
                <div
                  className="font-extrabold text-[#0B2447] px-6 py-2.5 rounded-full border-2 border-[#0B2447] text-lg tracking-wide self-start"
                  style={{ boxShadow: "3px 3px 0px #0B2447" }}
                >
                  {company?.name || "Company Name"}
                </div>
                <div className="flex flex-wrap gap-2">
                  {company?.tags?.map((tag, i) => (
                    <span
                      key={i}
                      className="border border-slate-300 rounded-full px-3 py-1 text-[0.8rem] font-medium text-slate-500 bg-white"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Menu Button */}
              <button className="absolute top-0 right-0 bg-transparent rounded-lg text-black-600 text-base font-bold px-2 py-0.5 cursor-pointer leading-none">
                ⋯
              </button>
            </div>

            {/* Description */}
            <div className="border-2 border-slate-200 rounded-[20px] p-6">
              <p className="text-[0.9rem] text-slate-700 leading-[1.8] text-justify m-0">
                {company?.description || "No description available."}
              </p>
            </div>
          </div>

          {/* RIGHT: For Interview Applicants */}
          <div className="bg-[#f8fafc] rounded-[40px] p-8 min-h-[500px] shadow-[0_35px_80px_rgba(15,23,42,0.18)] border border-slate-200/20 flex flex-col">
            <div className="flex items-center justify-between gap-4 mb-8 flex-wrap">
              <div
                className="font-extrabold text-[#0B2447] px-6 py-2.5 rounded-full border-2 border-[#0B2447] text-lg tracking-wide"
                style={{ boxShadow: "3px 3px 0px #0B2447" }}
              >
                For Interview Applicants
              </div>
            </div>

            <div className="flex flex-col gap-5">
              {interviewApplicants.length > 0 ? (
                interviewApplicants.map((applicant) => (
                  <div key={applicant.id} className="flex flex-col gap-2">
                    {/* Date */}
                    <div className="flex items-center gap-1.5 text-[0.82rem] font-semibold text-slate-500">
                      <span className="text-base">📅</span>
                      {applicant.date}
                    </div>

                    {/* Card */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center gap-4 shadow-[0_4px_12px_rgba(15,23,42,0.06)]">
                      {/* Avatar */}
                      <div className="w-[80px] min-w-[80px] h-[90px] bg-slate-200 rounded-[10px] flex items-center justify-center overflow-hidden">
                        {applicant.photo ? (
                          <img src={applicant.photo} alt={applicant.name} className="w-full h-full object-cover" />
                        ) : (
                          <UserIcon />
                        )}
                      </div>

                      {/* Info chips */}
                      <div className="flex flex-col gap-2">
                        <span className="bg-slate-100 rounded-full px-4 py-1 text-[0.82rem] font-semibold text-[#0f172a] whitespace-nowrap">
                          {applicant.name}
                        </span>
                        <span className="bg-slate-100 rounded-full px-4 py-1 text-[0.82rem] font-semibold text-[#0f172a] whitespace-nowrap">
                          H!RE Score:{" "}
                          <span className="font-bold text-[#22a861]">{applicant.score}%</span>
                        </span>
                        <span className="bg-slate-100 rounded-full px-4 py-1 text-[0.82rem] font-semibold text-[#0f172a] whitespace-nowrap">
                          {applicant.role}
                        </span>
                        <span className="bg-slate-100 rounded-full px-4 py-1 text-[0.82rem] font-semibold text-[#0f172a] whitespace-nowrap">
                          <strong>Interviewer: {applicant.interviewer}</strong>
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-slate-400 text-sm">No applicants scheduled for interview yet.</p>
              )}
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}