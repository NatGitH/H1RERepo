import { useState, useEffect } from "react";
import SearchIcon from "@mui/icons-material/Search";

const UserIcon = () => (
  <svg className="w-10 h-10 text-slate-400" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
  </svg>
);

const MemberCard = ({ member, badgeType }) => (
  <div className="bg-white rounded-2xl p-4 flex items-center gap-4 shadow-[0_4px_16px_rgba(15,23,42,0.07)]">
    
    <div className="w-[80px] min-w-[80px] h-[90px] bg-slate-200 rounded-[10px] flex items-center justify-center overflow-hidden">
      {member.photo ? (
        <img src={member.photo} alt={member.name} className="w-full h-full object-cover" />
      ) : (
        <UserIcon />
      )}
    </div>

    
    <div className="flex flex-col gap-1.5 flex-1">
      <span className="bg-slate-100 rounded-full px-3 py-1 text-[0.85rem] font-bold text-[#0f172a] inline-block self-start">
        {member.name}
      </span>
      <p className="text-[0.78rem] text-slate-500 leading-relaxed m-0">{member.bio}</p>
    </div>

    {/* Badge */}
    {badgeType === "pending" ? (
      <span className="px-3 py-1.5 rounded-full text-[0.8rem] font-bold whitespace-nowrap border-2 border-[#e07b2a] text-[#e07b2a] bg-transparent">
        Pending
      </span>
    ) : (
      <span className="px-3 py-1.5 rounded-full text-[0.8rem] font-bold whitespace-nowrap border-2 border-[#22a861] bg-[#22a861] text-white">
        Active
      </span>
    )}
  </div>
);

export default function Employer() {
  const [pendingMembers, setPendingMembers] = useState([]);
  const [activeMembers, setActiveMembers] = useState([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/employers/")
      .then((res) => res.json())
      .then((data) => {
        setPendingMembers(data.filter((m) => m.status === "pending"));
        setActiveMembers(data.filter((m) => m.status === "active"));
      })
      .catch(() => {
        setPendingMembers([]);
        setActiveMembers([]);
      });
  }, []);

  const filterMembers = (members) =>
    members.filter((m) =>
      m.name.toLowerCase().includes(search.toLowerCase())
    );

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
            Employer
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

        {/* Grid */}
        <div className="grid grid-cols-2 gap-6 max-[768px]:grid-cols-1">

          {/* Pending Panel */}
          <div className="bg-[#fde8c0] rounded-[24px] p-6 min-h-[420px]">
            <div className="flex items-start justify-between gap-4 mb-5">
              <h2 className="text-[1.3rem] font-extrabold text-[#0f172a] leading-snug m-0">
                Pending Account Creation
              </h2>
              <span className="px-3 py-1.5 rounded-full text-[0.8rem] font-bold whitespace-nowrap border-2 border-[#e07b2a] text-[#e07b2a] bg-transparent">
                {filterMembers(pendingMembers).length} pending
              </span>
            </div>
            <div className="flex flex-col gap-4">
              {filterMembers(pendingMembers).map((member) => (
                <MemberCard key={member.id} member={member} badgeType="pending" />
              ))}
            </div>
          </div>

          {/* Active Panel */}
          <div className="bg-[#d4edb8] rounded-[24px] p-6 min-h-[420px]">
            <div className="flex items-start justify-between gap-4 mb-5">
              <h2 className="text-[1.3rem] font-extrabold text-[#0f172a] leading-snug m-0">
                Active HR Members
              </h2>
              <span className="px-3 py-1.5 rounded-full text-[0.8rem] font-bold whitespace-nowrap border-2 border-[#22a861] bg-[#22a861] text-white">
                {filterMembers(activeMembers).length} Active
              </span>
            </div>
            <div className="flex flex-col gap-4">
              {filterMembers(activeMembers).map((member) => (
                <MemberCard key={member.id} member={member} badgeType="active" />
              ))}
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}