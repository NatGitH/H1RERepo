import { useState, useEffect } from "react";
import { useAuth } from "../../.Context/AuthContext";

const UserIcon = () => (
  <svg className="w-10 h-10 text-slate-400" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
  </svg>
);

const CompanyIcon = () => (
  <svg className="w-12 h-12" xmlns="http://www.w3.org/2000/svg" fill="#94a3b8" viewBox="0 0 24 24">
    <path d="M12 7V3H2v18h20V7H12zM6 19H4v-2h2v2zm0-4H4v-2h2v2zm0-4H4V9h2v2zm0-4H4V5h2v2zm4 12H8v-2h2v2zm0-4H8v-2h2v2zm0-4H8V9h2v2zm0-4H8V5h2v2zm10 12h-8v-2h2v-2h-2v-2h2v-2h-2V9h8v10zm-2-8h-2v2h2v-2zm0 4h-2v2h2v-2z" />
  </svg>
);

export default function Profile() {
  const { auth } = useAuth();
  const role = auth.role;

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Placeholder interview applicants
  const interviewApplicants = [];

  useEffect(() => {
    const endpoint =
      role === "owner"
        ? "/api/profile/owner/"
        : "/api/profile/hr/";

    fetch(`http://localhost:8000${endpoint}`, {
      headers: { Authorization: `Bearer ${auth.token}` },
    })
      .then((res) => res.json())
      .then((data) => { setProfile(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <section className="px-4 pt-1 bg-[#0B2447] min-h-screen flex items-center justify-center">
        <p className="text-white text-sm">Loading profile...</p>
      </section>
    );
  }

  return (
    <section className="px-4 pt-1 bg-[#0B2447] min-h-screen">
      <div
        className="max-w-[1200px] mx-auto bg-white rounded-3xl pt-4 px-10 pb-6 min-h-[600px] border-2 border-[#0B2447]"
        style={{ boxShadow: "6px 6px 0px #0B2447" }}
      >
        <div className="grid grid-cols-[1fr_380px] gap-6 items-start max-[900px]:grid-cols-1">

          {/* ── LEFT PANEL ── */}
          <div className="bg-[#f8fafc] rounded-[40px] p-8 min-h-[500px] border border-slate-200/20 flex flex-col gap-6">

            {/* HRStaff / HRManager */}
            {(role === "HRStaff" || role === "HRManager") && (
              <>
                <div className="flex items-start gap-5 relative">
                  {/* Avatar */}
                  <div className="w-[120px] min-w-[120px] h-[120px] border-2 border-slate-200 rounded-2xl overflow-hidden bg-slate-100 flex items-center justify-center">
                    {profile?.profile_picture ? (
                      <img src={profile.profile_picture} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <UserIcon />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex flex-col gap-3 flex-1">
                    {/* Name */}
                    <div
                      className="font-extrabold text-[#0B2447] px-5 py-2 rounded-full border-2 border-[#0B2447] text-base self-start"
                      style={{ boxShadow: "3px 3px 0px #0B2447" }}
                    >
                      {profile?.firstname && profile?.lastname
                        ? `${profile.firstname} ${profile.lastname}`
                        : profile?.username || "No Name"}
                    </div>

                    {/* Status */}
                    <div className="flex items-center gap-2 border border-slate-200 rounded-full px-4 py-1.5 self-start bg-white">
                      <span className={`w-2.5 h-2.5 rounded-full ${profile?.account_status === "active" ? "bg-green-400" : "bg-slate-300"}`} />
                      <span className="text-sm font-semibold text-slate-700 capitalize">
                        {profile?.account_status || "Unknown"}
                      </span>
                      <span className="text-slate-400 text-xs">∧</span>
                    </div>

                    {/* Birthdate */}
                    {profile?.birthdate && (
                      <div className="flex items-center gap-2 border border-slate-200 rounded-full px-4 py-1.5 self-start bg-white">
                        <span className="text-slate-400 text-sm">📅</span>
                        <span className="text-sm font-medium text-slate-600">
                          {profile.birthdate}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Menu dots */}
                  <button className="absolute top-0 right-0 text-slate-400 text-xl font-bold px-2 cursor-pointer bg-transparent border-none">
                    ⋯
                  </button>
                </div>

                {/* Bio */}
                <div className="border-2 border-slate-200 rounded-[20px] p-6">
                  <p className="text-[0.9rem] text-slate-700 leading-[1.8] text-justify m-0">
                    {profile?.bio || "No bio available."}
                  </p>
                </div>
              </>
            )}

            {/* Owner */}
            {role === "owner" && (
              <>
                <div className="flex items-start gap-5 relative">
                  {/* Company Logo placeholder */}
                  <div className="w-[120px] min-w-[120px] h-[120px] border-2 border-slate-200 rounded-2xl overflow-hidden bg-slate-100 flex items-center justify-center">
                    <CompanyIcon />
                  </div>

                  {/* Company Name + Actions */}
                  <div className="flex flex-col gap-3 flex-1">
                    <div
                      className="font-extrabold text-[#0B2447] px-5 py-2 rounded-full border-2 border-[#0B2447] text-base self-start"
                      style={{ boxShadow: "3px 3px 0px #0B2447" }}
                    >
                      {profile?.company_name || "Company Name"}
                    </div>

                    <div className="flex flex-col gap-2">
                      {[
                        "Change Company Password",
                        "Change Company Name",
                        "Change Password",
                        "Change Company Profile",
                      ].map((action) => (
                        <button
                          key={action}
                          className="border border-slate-300 rounded-full px-4 py-1.5 text-sm font-medium text-slate-600 bg-white hover:bg-slate-50 transition self-start cursor-pointer"
                        >
                          {action}
                        </button>
                      ))}
                      <button className="border border-red-300 rounded-full px-4 py-1.5 text-sm font-medium text-red-500 bg-white hover:bg-red-50 transition self-start cursor-pointer">
                        Delete Company
                      </button>
                    </div>
                  </div>
                </div>

                {/* Company Description */}
                <div className="border-2 border-slate-200 rounded-[20px] p-6">
                  <p className="text-[0.9rem] text-slate-700 leading-[1.8] text-justify m-0">
                    {profile?.description || "No company description available."}
                  </p>
                </div>
              </>
            )}
          </div>

          {/* ── RIGHT PANEL: For Interview Applicants ── */}
          <div className="bg-[#f8fafc] rounded-[40px] p-8 min-h-[500px] border border-slate-200/20 flex flex-col">
            <div
              className="font-extrabold text-[#0B2447] px-6 py-2.5 rounded-full border-2 border-[#0B2447] text-base tracking-wide self-start mb-6"
              style={{ boxShadow: "3px 3px 0px #0B2447" }}
            >
              For Interview Applicants
            </div>

            {interviewApplicants.length > 0 ? (
              <div className="flex flex-col gap-5">
                {interviewApplicants.map((applicant) => (
                  <div key={applicant.id} className="flex flex-col gap-2">
                    <div className="flex items-center gap-1.5 text-[0.82rem] font-semibold text-slate-500">
                      <span>📅</span> {applicant.date}
                    </div>
                    <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center gap-4">
                      <div className="w-[80px] min-w-[80px] h-[90px] bg-slate-200 rounded-[10px] overflow-hidden flex items-center justify-center">
                        {applicant.photo ? (
                          <img src={applicant.photo} alt={applicant.name} className="w-full h-full object-cover" />
                        ) : (
                          <UserIcon />
                        )}
                      </div>
                      <div className="flex flex-col gap-2">
                        <span className="bg-slate-100 rounded-full px-4 py-1 text-[0.82rem] font-semibold text-[#0f172a]">{applicant.name}</span>
                        <span className="bg-slate-100 rounded-full px-4 py-1 text-[0.82rem] font-semibold text-[#0f172a]">
                          H!RE Score: <span className="text-green-500 font-bold">{applicant.score}%</span>
                        </span>
                        <span className="bg-slate-100 rounded-full px-4 py-1 text-[0.82rem] font-semibold text-[#0f172a]">{applicant.role}</span>
                        {role === "owner" && (
                          <span className="bg-slate-100 rounded-full px-4 py-1 text-[0.82rem] font-semibold text-[#0f172a]">
                            <strong>Interviewer: {applicant.interviewer}</strong>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-400 text-sm">No applicants scheduled for interview yet.</p>
            )}
          </div>

        </div>
      </div>
    </section>
  );
}