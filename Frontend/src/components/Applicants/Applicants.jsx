import { useState } from "react";
import AddIcon from "@mui/icons-material/Add";
import SearchIcon from "@mui/icons-material/Search";
import GroupsIcon from "@mui/icons-material/Groups";
import PersonIcon from "@mui/icons-material/Person";
import CloseIcon from "@mui/icons-material/Close";

const DUMMY_APPLICANTS = [
  {
    id: 1,
    name: "Almhea Celeste",
    score: 92,
    role: "Software Tester",
    photo: "https://randomuser.me/api/portraits/women/44.jpg",
    pros: "An excellent tester with knowledge about automation and strong attention to detail.",
    cons: "Has only 6 months of experience due to recent graduation.",
    summary: "This applicant is a big factor to add to your company as he/she would be a big asset to your company.",
  },
  {
    id: 2,
    name: "Nathaniel Cachuela",
    score: 93,
    role: "Human Resource",
    photo: "https://randomuser.me/api/portraits/men/32.jpg",
    pros: "Excellent background in HR processes with outstanding performance in previous roles.",
    cons: "Limited experience with HR software tools.",
    summary: "A great candidate and asset to the company as he has great communication skills.",
  },
  {
    id: 3,
    name: "James Baltazar",
    score: 67,
    role: "Web Developer",
    photo: "https://randomuser.me/api/portraits/men/65.jpg",
    pros: "Strong frontend skills with React and modern CSS frameworks.",
    cons: "No experience in the backend field.",
    summary: "A great addition to your team with solid frontend experience.",
  },
];

export default function Applicants() {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const filtered = DUMMY_APPLICANTS.filter((a) =>
    a.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleCardClick = (applicant) => {
    const idx = filtered.findIndex((a) => a.id === applicant.id);
    setCurrentIndex(idx);
    setSelected(applicant);
  };

  const handlePrev = () => {
    const newIdx = (currentIndex - 1 + filtered.length) % filtered.length;
    setCurrentIndex(newIdx);
    setSelected(filtered[newIdx]);
  };

  const handleNext = () => {
    const newIdx = (currentIndex + 1) % filtered.length;
    setCurrentIndex(newIdx);
    setSelected(filtered[newIdx]);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    // placeholder for real upload
  };

  return (
    <section className="px-4 pt-1 bg-[#0B2447] min-h-screen">
      <div
        className="max-w-[1200px] mx-auto bg-white rounded-3xl pt-4 px-10 pb-6 border-2 border-[#0B2447]"
        style={{ boxShadow: "6px 6px 0px #0B2447" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-4 mb-4 flex-wrap">
          <div
            className="font-extrabold text-[#0B2447] rounded-full border-2 border-[#0B2447] text-lg tracking-wide w-[260px] h-[50px] flex items-center justify-center whitespace-nowrap"
            style={{ boxShadow: "3px 3px 0px #0B2447" }}
          >
            Evaluated Applicants
          </div>
          <div className="flex items-center gap-2 border-2 border-[#0B2447] rounded-full px-4 py-2 w-[260px]">
            <input
              type="search"
              placeholder="Search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="border-none outline-none w-full text-sm text-[#0B2447] bg-transparent placeholder-slate-400"
            />
            <SearchIcon style={{ fontSize: 20, color: "#0B2447" }} />
          </div>
        </div>

        {/* Body */}
        <div className="flex gap-6 items-stretch">

          {/* Upload Zone */}
          <label className="border-[3px] border-dashed border-teal-400 rounded-2xl w-[170px] min-w-[170px] flex flex-col items-center justify-center gap-1 cursor-pointer hover:bg-teal-50 transition-colors px-4 py-8 min-h-[400px]">
            <input type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={handleFileUpload} />
            <div className="w-16 h-16 rounded-full bg-teal-400 flex items-center justify-center shadow-[4px_4px_0px_#0f172a]">
              <AddIcon style={{ fontSize: 32, color: "white" }} />
            </div>
            <p className="font-bold text-sm text-[#0f172a] m-0 text-center">Click or drag</p>
            <p className="text-xs text-slate-500 m-0 text-center">to upload a file</p>
          </label>

          {/* Applicant Cards */}
          <div className="flex-1 flex items-center justify-center min-h-[400px]">
            {filtered.length > 0 ? (
              <div className="flex flex-wrap gap-4 w-full">
                {filtered.map((applicant) => (
                  <div
                    key={applicant.id}
                    onClick={() => handleCardClick(applicant)}
                    className="bg-white rounded-2xl border-2 border-[#0f172a] p-4 flex items-center gap-4 flex-[1_1_240px] max-w-[280px] cursor-pointer hover:shadow-lg transition-shadow"
                    style={{ boxShadow: "3px 3px 0px #0f172a" }}
                  >
                    <div className="w-20 min-w-[80px] h-24 bg-slate-100 rounded-xl border-2 border-[#0f172a] overflow-hidden flex items-center justify-center">
                      {applicant.photo ? (
                        <img src={applicant.photo} alt={applicant.name} className="w-full h-full object-cover" />
                      ) : (
                        <PersonIcon style={{ fontSize: 40, color: "#94a3b8" }} />
                      )}
                    </div>
                    <div className="flex flex-col gap-2">
                      <span className="bg-slate-100 rounded-full px-3 py-1 text-xs font-semibold text-[#0f172a]">
                        {applicant.name}
                      </span>
                      <span className="bg-slate-100 rounded-full px-3 py-1 text-xs font-semibold text-[#0f172a]">
                        H!RE Score:{" "}
                        <span className={`font-bold ${applicant.score >= 80 ? "text-emerald-600" : "text-orange-500"}`}>
                          {applicant.score}%
                        </span>
                      </span>
                      <span className="bg-slate-100 rounded-full px-3 py-1 text-xs font-semibold text-[#0f172a]">
                        {applicant.role}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center gap-4 text-center">
                <div className="w-16 h-16 rounded-full bg-teal-400 flex items-center justify-center shadow-[4px_4px_0px_#0f172a]">
                  <GroupsIcon style={{ fontSize: 32, color: "white" }} />
                </div>
                <h2 className="text-xl font-extrabold text-[#0f172a] m-0">
                  No Job Applicants added yet...
                </h2>
                <p className="text-slate-500 text-sm leading-relaxed m-0">
                  Upload a resume to start evaluating<br />
                  candidates with AI-powered insights.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Modal ── */}
      {selected && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() => setSelected(null)}
        >
          <div
            className="relative bg-white rounded-3xl p-6 w-full max-w-[480px] mx-4"
            style={{ boxShadow: "6px 6px 0px #0B2447", border: "2px solid #0B2447" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Applicant Header */}
            <div className="flex items-center gap-4 mb-5">
              <div className="w-[100px] min-w-[100px] h-[110px] bg-slate-100 rounded-xl border-2 border-[#0f172a] overflow-hidden">
                {selected.photo ? (
                  <img src={selected.photo} alt={selected.name} className="w-full h-full object-cover" />
                ) : (
                  <PersonIcon style={{ fontSize: 40, color: "#94a3b8" }} />
                )}
              </div>
              <div className="flex flex-col gap-2 flex-1">
                <span className="bg-slate-100 rounded-full px-4 py-1.5 text-sm font-semibold text-[#0f172a]">
                  {selected.name}
                </span>
                <span className="bg-slate-100 rounded-full px-4 py-1.5 text-sm font-semibold text-[#0f172a]">
                  H!RE Score:{" "}
                  <span className={`font-bold ${selected.score >= 80 ? "text-emerald-600" : "text-orange-500"}`}>
                    {selected.score}%
                  </span>
                </span>
                <span className="bg-slate-100 rounded-full px-4 py-1.5 text-sm font-semibold text-[#0f172a]">
                  {selected.role}
                </span>
              </div>

              {/* Resume icon */}
              <div className="self-start">
                <div className="w-10 h-10 border-2 border-slate-200 rounded-xl flex items-center justify-center">
                  <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z" stroke="#0B2447" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <polyline points="14,2 14,8 20,8" stroke="#0B2447" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <button className="mt-2 bg-teal-400 text-white text-xs font-bold rounded-full px-3 py-1 border-none cursor-pointer">
                  View
                </button>
              </div>
            </div>

            {/* Pros & Cons */}
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div className="bg-teal-50 border border-teal-200 rounded-2xl p-4">
                <p className="text-teal-600 font-bold text-sm mb-2">✓ Pros</p>
                <p className="text-slate-600 text-xs leading-relaxed m-0">{selected.pros}</p>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
                <p className="text-red-500 font-bold text-sm mb-2">✗ Cons</p>
                <p className="text-slate-600 text-xs leading-relaxed m-0">{selected.cons}</p>
              </div>
            </div>

            {/* AI Summary */}
            <div className="bg-teal-50 border border-teal-200 rounded-2xl p-4 mb-5">
              <p className="text-teal-600 font-bold text-sm mb-2">✦ AI Summary</p>
              <p className="text-slate-600 text-sm leading-relaxed m-0">{selected.summary}</p>
            </div>

            {/* Actions */}
            <div className="grid grid-cols-2 gap-3">
              <button className="bg-green-500 hover:bg-green-600 text-white font-bold rounded-full py-2.5 text-sm border-none cursor-pointer transition-colors">
                ✓ Shortlist
              </button>
              <button
                onClick={() => setSelected(null)}
                className="bg-red-500 hover:bg-red-600 text-white font-bold rounded-full py-2.5 text-sm border-none cursor-pointer transition-colors"
              >
                ✗ Reject
              </button>
            </div>
          </div>

          {/* Prev / Next arrows */}
          {filtered.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); handlePrev(); }}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-[#0B2447] text-white flex items-center justify-center border-none cursor-pointer hover:bg-[#162553] transition-colors text-xl"
              >
                ←
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); handleNext(); }}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-[#0B2447] text-white flex items-center justify-center border-none cursor-pointer hover:bg-[#162553] transition-colors text-xl"
              >
                →
              </button>
            </>
          )}
        </div>
      )}
    </section>
  );
}