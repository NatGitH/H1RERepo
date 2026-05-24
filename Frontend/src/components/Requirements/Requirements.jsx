import { useState, useEffect } from "react";

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
    <section className="px-4 pt-8 pb-12 bg-[#0f172a] min-h-[calc(100vh-88px)]">
      <div className="max-w-[1200px] mx-auto bg-[#f8fafc] rounded-[40px] p-8 shadow-[0_35px_80px_rgba(15,23,42,0.18)] border border-slate-200/20">

        {/* Header */}
        <div className="flex items-center justify-between gap-4 mb-8 flex-wrap">
          <div className="text-2xl font-extrabold text-[#0f172a] px-6 py-3 rounded-full bg-white shadow-[0_18px_35px_rgba(15,23,42,0.12)] border border-[#0f172a] tracking-wide uppercase">
            Requirements
          </div>
          <div className="flex items-center gap-3 bg-white border border-slate-300 rounded-full px-4 py-2 max-w-[300px] w-full">
            <input
              type="search"
              placeholder="Search"
              aria-label="Search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="border-none outline-none w-full text-[0.95rem] text-[#0f172a] bg-transparent placeholder-slate-400"
            />
            <button type="button" className="bg-transparent border-none text-[1.15rem] cursor-pointer text-[#0f172a]">
              🔍
            </button>
          </div>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-[minmax(320px,1fr)_minmax(300px,1fr)] gap-7 max-[850px]:grid-cols-1">

          {/* Left: Pending Requirements */}
          <div className="p-7 rounded-[36px] min-h-[420px] bg-[#f9e3bb] border border-[#f3d8a1]">
            <div className="text-[1.6rem] font-extrabold mb-5 text-[#0f172a]">
              Pending Requirements
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

          {/* Right: Create New */}
          <div className="p-7 rounded-[36px] min-h-[420px] border-[3px] border-dashed border-teal-300 max-w-[220px] grid place-items-center">
            {showForm ? (
              <div className="bg-white border border-slate-200 rounded-[24px] px-6 py-5 flex flex-col gap-4 shadow-[0_20px_40px_rgba(15,23,42,0.08)] w-full">
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
                className="bg-white rounded-[32px] min-w-[130px] min-h-[360px] flex flex-col items-center justify-center gap-4 text-center px-6 py-8 shadow-[0_20px_40px_rgba(15,23,42,0.08)] cursor-pointer"
              >
                <span className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-teal-300 text-white text-[2.5rem] shadow-[0_20px_40px_rgba(94,234,212,0.35)]">
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