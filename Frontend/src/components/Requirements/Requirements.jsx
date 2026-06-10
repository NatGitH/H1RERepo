import { useState, useEffect } from "react";
import SearchIcon from "@mui/icons-material/Search";
import { useAuth } from "../../.Context/AuthContext";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";

// ── Rich Text Toolbar ──
function MenuBar({ editor }) {
  if (!editor) return null;
  return (
    <div className="flex gap-2 mb-2 flex-wrap">
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={`px-3 py-1 rounded-lg text-xs font-bold border cursor-pointer transition-colors ${
          editor.isActive("bold")
            ? "bg-[#0B2447] text-white border-[#0B2447]"
            : "bg-white text-[#0B2447] border-slate-300 hover:bg-slate-50"
        }`}
      >
        B
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={`px-3 py-1 rounded-lg text-xs font-bold border cursor-pointer transition-colors ${
          editor.isActive("italic")
            ? "bg-[#0B2447] text-white border-[#0B2447]"
            : "bg-white text-[#0B2447] border-slate-300 hover:bg-slate-50"
        }`}
      >
        I
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={`px-3 py-1 rounded-lg text-xs font-bold border cursor-pointer transition-colors ${
          editor.isActive("bulletList")
            ? "bg-[#0B2447] text-white border-[#0B2447]"
            : "bg-white text-[#0B2447] border-slate-300 hover:bg-slate-50"
        }`}
      >
        • List
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={`px-3 py-1 rounded-lg text-xs font-bold border cursor-pointer transition-colors ${
          editor.isActive("orderedList")
            ? "bg-[#0B2447] text-white border-[#0B2447]"
            : "bg-white text-[#0B2447] border-slate-300 hover:bg-slate-50"
        }`}
      >
        1. List
      </button>
    </div>
  );
}

// ── Requirement Form (Create/Edit) ──
function ReqForm({ initialTitle = "", initialContent = "", onSubmit, onCancel, isEdit = false }) {
  const [jobTitle, setJobTitle] = useState(initialTitle);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const today = new Date().toLocaleDateString("en-US", {
    month: "2-digit", day: "2-digit", year: "numeric",
  });

  const editor = useEditor({
    extensions: [StarterKit],
    content: initialContent || "",
    editorProps: {
      attributes: {
        class: "outline-none min-h-[200px] text-slate-700 text-sm leading-relaxed prose prose-sm max-w-none",
      },
    },
  });

  const handleSend = () => {
    if (!jobTitle.trim() || !editor?.getText().trim()) return;
    setShowConfirm(true);
  };

  const handleConfirm = () => {
    const html = editor.getHTML();
    onSubmit({ job_title: jobTitle, description: html, qualifications: html });
    setShowConfirm(false);
    if (!isEdit) setShowSuccess(true);
  };

  if (showSuccess) {
    return (
      <div className="w-full max-w-2xl mx-auto">
        <div
          className="bg-white rounded-[24px] px-10 py-10 border-2 border-[#0B2447] flex flex-col items-center gap-4"
          style={{ boxShadow: "4px 4px 0px #0B2447" }}
        >
          <p className="text-lg font-extrabold text-[#0B2447] text-center">
            Request for job requirements has been sent!
          </p>
          <button
            onClick={onCancel}
            className="bg-[#0B2447] hover:bg-[#162553] text-white font-bold rounded-full px-8 py-2 border-none cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto relative">
      <div
        className="bg-white rounded-[24px] px-8 py-6 border-2 border-[#0B2447]"
        style={{ boxShadow: "4px 4px 0px #0B2447" }}
      >
        {/* Back button */}
        <button
          onClick={onCancel}
          className="w-8 h-8 rounded-full border-2 border-slate-300 flex items-center justify-center bg-white cursor-pointer hover:bg-slate-50 mb-4"
        >
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
            <path d="M15 18l-6-6 6-6" stroke="#0B2447" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>

        {/* Header: Job Position + Date */}
        <div className="flex items-start justify-between mb-6 gap-4">
          <div className="flex flex-col gap-1 flex-1">
            <input
              type="text"
              placeholder="Job Position"
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              className="text-base font-semibold text-[#0B2447] outline-none border-b-2 border-[#0B2447] pb-1 bg-transparent w-full max-w-[200px]"
            />
            <span className="text-xs text-slate-400 font-medium">Job Position</span>
          </div>
          <div className="flex flex-col items-end gap-1">
            <span className="text-base font-semibold text-[#0B2447] border-b-2 border-[#0B2447] pb-1 min-w-[100px] text-right">
              {today}
            </span>
            <span className="text-xs text-slate-400 font-medium">
              {isEdit ? "Date Edited" : "Date Made"}
            </span>
          </div>
        </div>

        {/* Rich Text Editor */}
        <MenuBar editor={editor} />
        <div className="border border-slate-200 rounded-xl p-3 min-h-[220px]">
          <EditorContent editor={editor} />
        </div>

        {/* Send Arrow */}
        <div className="flex justify-end mt-4">
          <button
            onClick={handleSend}
            className="w-10 h-10 rounded-full bg-transparent border-none cursor-pointer flex items-center justify-center hover:opacity-70 transition-opacity"
          >
            <svg width="28" height="28" fill="none" viewBox="0 0 24 24">
              <path d="M22 2L11 13" stroke="#0B2447" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M22 2L15 22 11 13 2 9l20-7z" stroke="#0B2447" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Confirm Modal */}
      {showConfirm && (
        <div className="absolute inset-0 flex items-center justify-center z-10 bg-black/20 rounded-[24px]">
          <div
            className="bg-white rounded-2xl px-8 py-5 flex flex-col items-center gap-4"
            style={{ border: "2px solid #0B2447", boxShadow: "4px 4px 0px #0B2447" }}
          >
            <p className="font-extrabold text-[#0B2447] text-base">
              {isEdit ? "Confirm Edit?" : "Create Requirement?"}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="bg-red-500 hover:bg-red-600 text-white font-bold rounded-full px-5 py-1.5 border-none cursor-pointer text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                className="bg-[#0B2447] hover:bg-[#162553] text-white font-bold rounded-full px-5 py-1.5 border-none cursor-pointer text-sm"
              >
                {isEdit ? "Confirm" : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── View Modal ──
function ViewModal({ req, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="w-full max-w-2xl mx-4">
        <div
          className="bg-white rounded-[24px] px-8 py-6 border-2 border-[#0B2447]"
          style={{ boxShadow: "4px 4px 0px #0B2447" }}
        >
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full border-2 border-slate-300 flex items-center justify-center bg-white cursor-pointer hover:bg-slate-50 mb-4"
          >
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
              <path d="M15 18l-6-6 6-6" stroke="#0B2447" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>

          <div className="flex items-start justify-between mb-6 gap-4">
            <div className="flex flex-col gap-1">
              <span className="text-base font-semibold text-[#0B2447] border-b-2 border-[#0B2447] pb-1">
                {req.job_title}
              </span>
              <span className="text-xs text-slate-400 font-medium">Job Position</span>
            </div>
            <div className="flex flex-col items-end gap-1">
              <span className="text-base font-semibold text-[#0B2447] border-b-2 border-[#0B2447] pb-1">
                {req.date_updated || req.date_created}
              </span>
              <span className="text-xs text-slate-400 font-medium">
                {req.date_updated ? "Date Edited" : "Date"}
              </span>
            </div>
          </div>

          <div
            className="prose prose-sm max-w-none text-slate-700 text-sm leading-relaxed"
            dangerouslySetInnerHTML={{ __html: req.description }}
          />
        </div>
      </div>
    </div>
  );
}

// ── Card colors ──
const CARD_COLORS = [
  "border-t-green-500",
  "border-t-red-400",
  "border-t-blue-500",
  "border-t-purple-500",
  "border-t-orange-400",
  "border-t-teal-500",
];

export default function Requirements() {
  const { auth } = useAuth();
  const role = auth.role;

  const [requirements, setRequirements] = useState([]);
  const [search, setSearch]             = useState("");
  const [showForm, setShowForm]         = useState(false);

  // View modal
  const [viewReq, setViewReq] = useState(null);

  // Edit modal
  const [editReq, setEditReq]         = useState(null);

  // Delete confirm
  const [deleteReq, setDeleteReq]     = useState(null);

  useEffect(() => {
  fetch("http://localhost:8000/api/requirements/", {
    headers: { Authorization: `Bearer ${auth.token}` },
  })
    .then((res) => res.json())
    .then((data) => {
      console.log("API response:", data);
      if (Array.isArray(data)) {
        setRequirements(data.filter(r => r && r.id));
      } else {
        setRequirements([]);
      }
    })
    .catch(() => setRequirements([]));
}, []);

  const handleCreate = (newReq) => {
    fetch("http://localhost:8000/api/requirements/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${auth.token}`,
      },
      body: JSON.stringify(newReq),
    })
      .then((res) => res.json())
      .then((created) => {
        setRequirements((prev) => [...prev, created]);
        setShowForm(false);
      })
      .catch(console.error);
  };

  const handleEdit = (updatedReq) => {
  if (!editReq?.id) return;
  fetch(`http://localhost:8000/api/requirements/${editReq.id}/edit/`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${auth.token}`,
    },
    body: JSON.stringify(updatedReq),
  })
    .then((res) => res.json())
    .then((updated) => {
      setRequirements((prev) =>
        prev.map((r) => (r.id === updated.id ? updated : r))
      );
      setEditReq(null);
    })
    .catch(console.error);
};

const handleDelete = () => {
  if (!deleteReq?.id) return;
  fetch(`http://localhost:8000/api/requirements/${deleteReq.id}/delete/`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${auth.token}`,
    },
    body: JSON.stringify({}),
  })
    .then((res) => res.json())
    .then(() => {
      setRequirements((prev) => prev.filter((r) => r.id !== deleteReq.id));
      setDeleteReq(null);
    })
    .catch(console.error);
};

  const handleStatus = (id, status) => {
    fetch(`http://localhost:8000/api/requirements/${id}/`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${auth.token}`,
      },
      body: JSON.stringify({ status }),
    })
      .then((res) => res.json())
      .then((updated) =>
        setRequirements((prev) =>
          prev.map((r) => (r.id === updated.id ? { ...r, status: updated.status } : r))
        )
      )
      .catch(console.error);
  };

const approved = requirements.filter(
  (r) => r && r.id && r.status === "approved" &&
    r.job_title?.toLowerCase().includes(search.toLowerCase())
);

const pending = requirements.filter(
  (r) => r && r.id && r.status === "pending" &&
    r.job_title?.toLowerCase().includes(search.toLowerCase())
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

        {/* ── HRStaff View ── */}
        {role === "HRStaff" && (
          <div className="flex flex-col items-center justify-center py-8 gap-4">
            {!showForm ? (
              <>
                <span className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-teal-300 text-white shadow-lg">
                  <svg width="32" height="32" fill="none" viewBox="0 0 24 24">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z"
                      stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <polyline points="14,2 14,8 20,8" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <line x1="16" y1="13" x2="8" y2="13" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                    <line x1="16" y1="17" x2="8" y2="17" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </span>
                <h2 className="text-xl font-extrabold text-[#0f172a]">
                  No Job Requirements added yet...
                </h2>
                <p className="text-slate-500 text-sm text-center max-w-xs">
                  Define the skills and criteria you're looking for, and let AI match the right candidates.
                </p>
                <button
                  onClick={() => setShowForm(true)}
                  className="flex items-center gap-2 bg-teal-400 hover:bg-teal-500 text-white font-bold rounded-full px-6 py-2.5 text-sm transition-colors"
                >
                  + Create New Requirement
                </button>
              </>
            ) : (
              <ReqForm
                onSubmit={handleCreate}
                onCancel={() => setShowForm(false)}
              />
            )}
          </div>
        )}

        {/* ── HRManager View ── */}
        {role === "HRManager" && (
          <>
            <div className="flex gap-6 items-start flex-wrap">
              {/* Create New Card */}
              <div
                onClick={() => setShowForm(true)}
                className="border-[3px] border-dashed border-teal-400 rounded-2xl w-[170px] min-w-[170px] flex flex-col items-center justify-center gap-1 cursor-pointer hover:bg-teal-50 transition-colors px-4 py-8 min-h-[180px]"
              >
                <span className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-teal-300 text-white text-[1.5rem] shadow-[0_20px_40px_rgba(0,0,0,0.25)]">
                  +
                </span>
                <h2 className="m-0 text-base font-extrabold text-[#0f172a]">Create new</h2>
                <p className="m-0 text-slate-500 text-sm lowercase">requirement</p>
              </div>

              {/* Approved Requirement Cards */}
              <div className="flex-1 grid grid-cols-2 gap-4 max-[700px]:grid-cols-1">
                {approved.map((req, idx) => (
                  <div
                    key={req.id}
                    className={`bg-white rounded-2xl border-2 border-slate-200 border-t-4 ${CARD_COLORS[idx % CARD_COLORS.length]} p-4 flex flex-col gap-3 cursor-pointer hover:shadow-md transition-shadow`}
                    onClick={() => setViewReq(req)}
                  >
                    <span className="bg-slate-100 rounded-full px-3 py-1 text-sm font-bold text-[#0f172a] self-start">
                      {req.job_title}
                    </span>
                    <div
                      className="text-slate-600 text-xs leading-relaxed m-0 line-clamp-2 prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={{ __html: req.description }}
                    />
                    <div
                      className="flex gap-2 mt-auto"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={() => setEditReq(req)}
                        className="bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-full px-4 py-1 text-xs border-none cursor-pointer"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => setDeleteReq(req)}
                        className="bg-red-500 hover:bg-red-600 text-white font-bold rounded-full px-4 py-1 text-xs border-none cursor-pointer"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Pending Panel */}
            {pending.length > 0 && (
              <div className="mt-6 bg-[#fde8c0] rounded-[24px] p-6">
                <h2 className="text-[1.1rem] font-extrabold text-[#0f172a] mb-4">Pending Requirements</h2>
                <div className="flex flex-col gap-4">
                  {pending.map((req) => (
                    <div key={req.id} className="bg-white border border-slate-200 rounded-[20px] px-5 py-4 flex flex-col gap-3">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-[#0f172a]">{req.job_title}</span>
                        <span className="text-xs text-slate-400">{req.date_created}</span>
                      </div>
                      <div
                        className="text-slate-600 text-sm m-0 prose prose-sm max-w-none"
                        dangerouslySetInnerHTML={{ __html: req.description }}
                      />
                      <div className="flex gap-3">
                        <button
                          onClick={() => handleStatus(req.id, "approved")}
                          className="px-4 py-1.5 rounded-full font-bold text-xs text-white bg-green-600 cursor-pointer border-none"
                        >
                          Approve
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
            )}
          </>
        )}
      </div>

      {/* ── View Modal ── */}
      {viewReq && (
        <ViewModal req={viewReq} onClose={() => setViewReq(null)} />
      )}

      {/* ── Edit Modal ── */}
      {editReq && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="w-full max-w-2xl mx-4">
            <ReqForm
              initialTitle={editReq.job_title}
              initialContent={editReq.description}
              onSubmit={handleEdit}
              onCancel={() => setEditReq(null)}
              isEdit={true}
            />
          </div>
        </div>
      )}

      {/* ── Create Modal for HRManager ── */}
      {role === "HRManager" && showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="w-full max-w-2xl mx-4">
            <ReqForm
              onSubmit={(data) => { handleCreate(data); setShowForm(false); }}
              onCancel={() => setShowForm(false)}
            />
          </div>
        </div>
      )}

      {/* ── Delete Confirm ── */}
      {deleteReq && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div
            className="bg-white rounded-2xl px-8 py-6 flex flex-col items-center gap-4 mx-4"
            style={{ border: "2px solid #0B2447", boxShadow: "4px 4px 0px #0B2447" }}
          >
            <p className="font-extrabold text-[#0B2447] text-base">Delete Job Position?</p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteReq(null)}
                className="bg-red-500 hover:bg-red-600 text-white font-bold rounded-full px-5 py-1.5 border-none cursor-pointer text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="bg-[#0B2447] hover:bg-[#162553] text-white font-bold rounded-full px-5 py-1.5 border-none cursor-pointer text-sm"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}