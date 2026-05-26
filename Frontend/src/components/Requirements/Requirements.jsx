import { useState, useEffect } from "react";
import SearchIcon from "@mui/icons-material/Search";

export default function Requirements() {
  const [requirements, setRequirements] = useState([]);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [newReq, setNewReq] = useState({ type: "", text: "" });

  useEffect(() => {
    fetch("/api/requirements/")
      .then((res) => res.json())
      .then((data) => setRequirements(data))
      .catch(() => setRequirements([]));
  }, []);

  const handleCreate = () => {
    if (!newReq.type || !newReq.text) return;
    fetch("/api/requirements/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newReq),
    })
      .then((res) => res.json())
      .then((created) => {
        setRequirements((prev) => [...prev, created]);
        setNewReq({ type: "", text: "" });
        setShowForm(false);
      })
      .catch(console.error);
  };

  const handleStatus = (id, status) => {
    fetch(`/api/requirements/${id}/`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    })
      .then((res) => res.json())
      .then((updated) =>
        setRequirements((prev) =>
          prev.map((r) => (r.id === updated.id ? updated : r))
        )
      )
      .catch(console.error);
  };

  const filtered = requirements.filter((r) =>
    r.type.toLowerCase().includes(search.toLowerCase())
  );

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
            Requirements
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
        <div className="grid grid-cols-2 gap-7 max-[850px]:grid-cols-1">
          {/* Pending Requirements */}
          <div className="bg-[#fde8c0] rounded-[24px] p-6 min-h-[420px]">
            <div className="flex items-start justify-between gap-4 mb-5">
              <h2 className="text-[1.3rem] font-extrabold text-[#0f172a] leading-snug m-0">
                Pending Requirements
              </h2>
            </div>
            <div className="flex flex-col gap-4">
              {filtered.map((req) => (
                <div
                  key={req.id}
                  className="bg-white border border-slate-200 rounded-[24px] px-6 py-5 flex flex-col gap-4 shadow-[0_20px_40px_rgba(15,23,42,0.08)]"
                >
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-[#0f172a] text-base">{req.type}</span>
                  </div>
                  <p className="text-slate-600 leading-relaxed m-0">{req.text}</p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleStatus(req.id, "approved")}
                      className="px-4 py-1.5 rounded-full font-bold text-xs text-white bg-green-600 cursor-pointer border-none"
                    >
                      Approved
                    </button>
                    <button
                      onClick={() => handleStatus(req.id, "rejected")}
                      className="px-4 py-1.5 rounded-full font-bold text-xs text-white bg-red-600 cursor-pointer border-none"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Create New */}
          <div className="border-[3px] border-dashed border-teal-400 rounded-2xl w-[170px] min-w-[170px] flex flex-col items-center justify-center gap-1 cursor-pointer hover:bg-teal-50 transition-colors px-4 py-8 min-h-[400px]">
            {showForm ? (
              <div className="rounded-[24px] px-6 py-5 flex flex-col gap-4 shadow-[0_20px_40px_rgba(15,23,42,0.08)] w-full">
                <input
                  placeholder="Role (e.g. Software Tester)"
                  value={newReq.type}
                  onChange={(e) => setNewReq({ ...newReq, type: e.target.value })}
                  className="font-bold text-[#0f172a] text-base outline-none border-b border-slate-200 pb-1 w-full bg-transparent"
                />
                <textarea
                  placeholder="Describe the requirement..."
                  value={newReq.text}
                  onChange={(e) => setNewReq({ ...newReq, text: e.target.value })}
                  className="text-slate-600 leading-relaxed outline-none w-full min-h-[80px] bg-transparent resize-none"
                />
                <div className="flex gap-3">
                  <button
                    onClick={handleCreate}
                    className="px-4 py-1.5 rounded-full font-bold text-xs text-white bg-green-600 cursor-pointer border-none"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setShowForm(false)}
                    className="px-4 py-1.5 rounded-full font-bold text-xs text-white bg-red-600 cursor-pointer border-none"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div
                onClick={() => setShowForm(true)}
                className="flex flex-col items-center gap-3 cursor-pointer"
              >
                <span className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-teal-300 text-white text-[1.5rem] shadow-[0_20px_40px_rgba(0,0,0,0.25)]">
                  +
                </span>
                <h2 className="m-0 text-[1.3rem] font-extrabold text-[#0f172a]">Create new</h2>
                <p className="m-0 text-slate-500 text-[0.95rem] lowercase">requirement</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}