import { useState, useEffect } from "react";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";

const UserIcon = () => (
  <svg className="w-10 h-10 text-slate-400" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
  </svg>
);

export default function MyProfile() {
  const [profile, setProfile] = useState(null);
  const [status, setStatus] = useState("active");
  const [showStatusMenu, setShowStatusMenu] = useState(false);

  useEffect(() => {
    const localName = localStorage.getItem("name");
    const localRole = localStorage.getItem("role");

    if (localName) {
      setProfile((prev) => ({
        ...prev,
        name: localName,
        position: localRole || "HR Staff",
      }));
    }

    fetch("/api/myprofile/")
      .then((res) => res.json())
      .then((data) => {
        setProfile(data);
        setStatus(data.status ?? "active");
      })
      .catch(() => {});
  }, []);


  const handleToggleStatus = (val) => {
    setStatus(val);
    setShowStatusMenu(false);

    fetch("/api/myprofile/status/", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: val }),
    }).catch(console.error);
  };

  const statusConfig = {
    active:   { border: "#22a861", bg: "#dcfce7", color: "#15803d", dot: "#22a861", label: "Active" },
    on_break: { border: "#f59e0b", bg: "#fef3c7", color: "#92400e", dot: "#f59e0b", label: "On Break" },
    on_leave: { border: "#da2a2a", bg: "#fee2e2", color: "#f10000", dot: "#da2a2a", label: "On Leave" },
  };
  const current = statusConfig[status] || statusConfig.active;

  return (
    <section className="px-4 pt-1 bg-[#0B2447] min-h-screen">
      <div
        className="max-w-[1200px] mx-auto bg-white rounded-3xl pt-4 px-10 pb-6 min-h-[600px] border-2 border-[#0B2447]"
        style={{ boxShadow: "6px 6px 0px #0B2447" }}
      >
        <div className="grid grid-cols-[1fr_380px] gap-6 items-start max-[900px]:grid-cols-1">

  {/* LEFT: HR Staff Info */}
    <div className="bg-[#f8fafc] rounded-[40px] p-8 min-h-[500px] shadow-[0_35px_80px_rgba(15,23,42,0.18)] border border-slate-200/20 flex flex-col gap-6">

      <div className="flex items-start gap-5 relative">

  {/* Photo */}
    <div className="w-[120px] min-w-[120px] h-[120px] border-2 border-slate-200 rounded-2xl flex items-center justify-center overflow-hidden bg-slate-100">
      {profile?.photo ? (
          <img src={profile.photo} alt={profile.name} className="w-full h-full object-cover" />
            ) : (
      <UserIcon />
        )}
    </div>

  {/* Name + Status */}
    <div className="flex flex-col gap-3 flex-1">

  {/* Name */}
    <div
      className="font-extrabold text-[#0B2447] px-6 py-2.5 rounded-full border-2 border-[#0B2447] text-lg tracking-wide self-start"
      style={{ boxShadow: "3px 3px 0px #0B2447" }}
    >
      {profile?.name || "HR Staff"}
    </div>

  {/* Status Toggle — Active / On Break / On Leave */}
    <div className="relative self-start">
      <button
        onClick={() => setShowStatusMenu((v) => !v)}
        className="flex items-center gap-2 px-4 py-2 rounded-full border-2 text-sm font-bold cursor-pointer transition-all"
        style={{
          borderColor: current.border,
          backgroundColor: current.bg,
          color: current.color,
            }}
      >
        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: current.dot }} />
          {current.label}
          <KeyboardArrowDownIcon style={{ fontSize: 18 }} />
          </button>

          {showStatusMenu && (
          <>
          <div className="fixed inset-0 z-40" onClick={() => setShowStatusMenu(false)} />
            <div
              className="absolute left-0 top-12 bg-white rounded-xl py-2 px-2 w-44 z-50"
              style={{ border: "2px solid #1a1a2e", boxShadow: "1px 1px 0px #000000" }}
            >
            <button
              onClick={() => handleToggleStatus("active")}
              className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm font-semibold text-[#15803d] hover:bg-green-50 cursor-pointer border-none bg-transparent"
            >
            <span className="w-2 h-2 rounded-full bg-[#22a861]" />
              Active
            </button>
            <button
              onClick={() => handleToggleStatus("on_break")}
              className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm font-semibold text-[#92400e] hover:bg-amber-50 cursor-pointer border-none bg-transparent"
            >
            <span className="w-2 h-2 rounded-full bg-[#f59e0b]" />
              On Break
            </button>
            <button
              onClick={() => handleToggleStatus("on_leave")}
              className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm font-semibold text-[#f10000] hover:bg-slate-50 cursor-pointer border-none bg-transparent"
            >
            <span className="w-2 h-2 rounded-full bg-[#da2a2a]" />
              On Leave
              </button>
                </div>
              </>
                )}
                </div>

  {/* Birthdate */}
    {profile?.birthdate && (
      <div className="flex items-center gap-2 px-4 py-2 rounded-full border-2 border-slate-200 text-sm font-semibold text-slate-600 self-start bg-white">
          {profile.birthdate}
      </div>
        )}
      </div>

  {/* Menu Button */}
    <button className="absolute top-0 right-0 bg-transparent rounded-lg text-base font-bold px-2 py-0.5 cursor-pointer leading-none text-slate-600">
      ⋯
    </button>
      </div>

  {/* Bio */}
    <div className="border-2 border-slate-200 rounded-[20px] p-6">
      <p className="text-[0.9rem] text-slate-700 leading-[1.8] text-justify m-0">
        {profile?.bio || "No bio available."}
      </p>
    </div>
  </div>

  {/* RIGHT: For Interview Applicants */}
    <div className="bg-[#f8fafc] rounded-[40px] p-8 min-h-[500px] shadow-[0_35px_80px_rgba(15,23,42,0.18)] border border-slate-200/20 flex flex-col">
      <div
        className="font-extrabold text-[#0B2447] px-6 py-2.5 rounded-full border-2 border-[#0B2447] text-lg tracking-wide self-start mb-8"
        style={{ boxShadow: "3px 3px 0px #0B2447" }}
      >
      For Interview Applicants
      </div>
        <p className="text-slate-400 text-sm">No applicants scheduled for interview yet.</p>
        </div>
        
        </div>
      </div>
    </section>
  );
}