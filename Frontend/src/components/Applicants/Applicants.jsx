import { useState, useEffect } from "react";
import GroupsIcon from "@mui/icons-material/Groups";
import AddIcon from "@mui/icons-material/Add";
import SearchIcon from "@mui/icons-material/Search";
import PersonIcon from "@mui/icons-material/Person";

export default function Applicants() {
  const [applicants, setApplicants] = useState([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/applicants/")
      .then((res) => res.json())
      .then((data) => setApplicants(data))
      .catch(() => setApplicants([]));
  }, []);

  const filtered = applicants.filter((a) =>
    a.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("resume", file);
    fetch("/api/applicants/upload/", { method: "POST", body: formData })
      .then((res) => res.json())
      .then((newApplicant) => setApplicants((prev) => [...prev, newApplicant]))
      .catch(console.error);
  };

  return (
    <section className="px-4 pt-8 pb-12 bg-[#0B2447] min-h-[calc(100vh-80px)]">
      <div className="max-w-[1200px] mx-auto bg-white rounded-3xl p-8 border-2 border-[#0B2447]"
        style={{ boxShadow: "6px 6px 0px #0B2447" }}
      >

        {/* Header */}
        <div className="flex items-center justify-between gap-4 mb-8 flex-wrap">
          <div className="font-extrabold text-[#0B2447] px-6 py-2.5 rounded-full border-2 border-[#0B2447] text-lg tracking-wide"
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
        <div className="flex gap-6 items-stretch min-h-[380px]">

          {/* Upload Zone */}
          <label className="border-[3px] border-dashed border-teal-400 rounded-2xl w-[170px] min-w-[170px] flex flex-col items-center justify-center gap-3 cursor-pointer hover:bg-teal-50 transition-colors px-4 py-8">
            <input
              type="file"
              accept=".pdf,.doc,.docx"
              className="hidden"
              onChange={handleFileUpload}
            />
            <div className="w-16 h-16 rounded-full bg-teal-400 flex items-center justify-center">
              <AddIcon style={{ fontSize: 32, color: "white" }} />
            </div>
            <p className="font-bold text-sm text-[#0f172a] m-0 text-center">Click or drag</p>
            <p className="text-xs text-slate-500 m-0 text-center">to upload a file</p>
          </label>

          {/* Content area */}
          <div className="flex-1 flex items-center justify-center">
            {filtered.length > 0 ? (
              <div className="flex flex-wrap gap-4 w-full">
                {filtered.map((applicant) => (
                  <div
                    key={applicant.id}
                    className="bg-white rounded-2xl border-2 border-[#0f172a] p-4 flex items-center gap-4 flex-[1_1_240px] max-w-[280px]"
                    style={{ boxShadow: "3px 3px 0px #0f172a" }}
                  >
                    {/* Avatar */}
                    <div className="w-20 min-w-[80px] h-24 bg-slate-100 rounded-xl border-2 border-[#0f172a] flex items-center justify-center overflow-hidden">
                      {applicant.photo ? (
                        <img src={applicant.photo} alt={applicant.name} className="w-full h-full object-cover" />
                      ) : (
                        <PersonIcon style={{ fontSize: 40, color: "#94a3b8" }} />
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex flex-col gap-2">
                      <span className="bg-slate-100 rounded-full px-3 py-1 text-xs font-semibold text-[#0f172a]">
                        {applicant.name}
                      </span>
                      <span className="bg-slate-100 rounded-full px-3 py-1 text-xs font-semibold text-[#0f172a]">
                        Score:{" "}
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
                <div className="w-16 h-16 rounded-full bg-teal-400 flex items-center justify-center">
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
    </section>
  );
}