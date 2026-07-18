import { useState, useEffect } from "react";
import SearchIcon from "@mui/icons-material/Search";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import { useAuth } from "../../.Context/AuthContext";
import { apiFetch, getErrorMessage } from "../../api";

const ITEMS_PER_PAGE = 10;

const StatusBadge = ({ status }) => {
  const styles = {
    approved:         "bg-green-100 text-green-700",
    rejected:         "bg-red-100 text-red-600",
    pending:          "bg-orange-100 text-orange-600",
    changes_pending:  "bg-purple-100 text-purple-700",
    deletion_pending: "bg-rose-100 text-rose-700",
  };
  const labels = {
    approved:         "Approved",
    rejected:         "Rejected",
    pending:          "Pending",
    changes_pending:  "Changes Pending",
    deletion_pending: "Deletion Pending",
  };
  return (
    <span className={`text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap ${styles[status] || "bg-slate-100 text-slate-600"}`}>
      {labels[status] || status}
    </span>
  );
};

const Pagination = ({ total, page, onPage }) => {
  const totalPages = Math.ceil(total / ITEMS_PER_PAGE);
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-center gap-1 mt-4 flex-wrap">
      <button onClick={() => onPage(page - 1)} disabled={page === 1}
        className="px-3 py-1 rounded-full text-xs font-bold border border-slate-200 disabled:opacity-40 cursor-pointer bg-white hover:bg-slate-50">
        ‹
      </button>
      {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
        <button key={p} onClick={() => onPage(p)}
          className={`w-8 h-8 rounded-full text-xs font-bold border cursor-pointer transition-colors ${
            p === page
              ? "bg-[#0B2447] text-white border-[#0B2447]"
              : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
          }`}>
          {p}
        </button>
      ))}
      <button onClick={() => onPage(page + 1)} disabled={page === totalPages}
        className="px-3 py-1 rounded-full text-xs font-bold border border-slate-200 disabled:opacity-40 cursor-pointer bg-white hover:bg-slate-50">
        ›
      </button>
    </div>
  );
};

const Modal = ({ req, onClose, onEdit, onDelete, onProposeDelete, role }) => {
  if (!req) return null;
  const canDelete         = role === "owner" || role === "HRManager";
  const isStaff           = role === "HRStaff";
  const hasPending        = req.pending_changes && Object.keys(req.pending_changes).length > 0;
  const isDeletionPending = req.status === "deletion_pending";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="bg-white rounded-[24px] p-8 w-full max-w-lg shadow-2xl relative" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-5 text-slate-400 hover:text-slate-700 text-xl font-bold">✕</button>

        <div className="flex items-center justify-between mb-2 gap-2">
          <h2 className="font-extrabold text-[#0B2447] text-xl">{req.job_title}</h2>
          <StatusBadge status={req.status} />
        </div>

        <div className="text-xs text-slate-400 mb-1">
          Created: {req.date_created}{req.created_by ? ` · by ${req.created_by}` : ""}
        </div>
        {req.modified_by && (
          <div className="text-xs text-purple-500 mb-3">Modified: {req.date_modified || "—"} · {req.modified_by}</div>
        )}

        {hasPending && canDelete && (
          <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 mb-4">
            <p className="text-xs font-bold text-purple-700 mb-2 uppercase tracking-wide">Proposed Changes</p>
            {req.pending_changes.job_title && req.pending_changes.job_title !== req.job_title && (
              <p className="text-xs text-purple-600 mb-1"><span className="font-bold">Title:</span> {req.pending_changes.job_title}</p>
            )}
            {req.pending_changes.description && req.pending_changes.description !== req.description && (
              <p className="text-xs text-purple-600 mb-1"><span className="font-bold">Description:</span> {req.pending_changes.description}</p>
            )}
            {req.pending_changes.qualifications && req.pending_changes.qualifications !== req.qualifications && (
              <p className="text-xs text-purple-600"><span className="font-bold">Qualifications:</span> {req.pending_changes.qualifications}</p>
            )}
          </div>
        )}

        {isDeletionPending && canDelete && (
          <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 mb-4">
            <p className="text-xs font-bold text-rose-700">
              {req.modified_by || "Someone"} has requested deletion of this requirement.
            </p>
          </div>
        )}

        <div className="mb-3">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Description</p>
          <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-line break-words">{req.description}</p>
        </div>
        <div className="mb-5">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Qualifications</p>
          <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-line break-words">{req.qualifications}</p>
        </div>

        <div className="flex gap-3 flex-wrap">
          {!isDeletionPending && (
            <button onClick={() => { onEdit({ ...req }); onClose(); }}
              className="px-5 py-2 rounded-full font-bold text-xs text-white bg-[#0B2447] cursor-pointer border-none">
              {isStaff ? "Propose Edit" : "Edit"}
            </button>
          )}
          {canDelete && (
            <button onClick={() => { onDelete(req.id); onClose(); }}
              className="px-5 py-2 rounded-full font-bold text-xs text-white bg-red-600 cursor-pointer border-none">
              Delete
            </button>
          )}
          {isStaff && !isDeletionPending && (
            <button onClick={() => { onProposeDelete(req.id); onClose(); }}
              className="px-5 py-2 rounded-full font-bold text-xs text-white bg-rose-500 cursor-pointer border-none">
              Propose Delete
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

const ReqForm = ({ value, onChange, onSave, onCancel, submitLabel = "Save", role }) => (
  <div className="bg-white border border-slate-200 rounded-[24px] px-6 py-5 flex flex-col gap-4 shadow-[0_20px_40px_rgba(15,23,42,0.08)] w-full">
    <input
      placeholder="Job Title (e.g. Software Tester)"
      value={value.job_title}
      onChange={(e) => onChange({ ...value, job_title: e.target.value })}
      className="font-bold text-[#0f172a] text-base outline-none border-b border-slate-200 pb-1 w-full bg-transparent"
    />
    <textarea
      placeholder="Description..."
      value={value.description}
      onChange={(e) => onChange({ ...value, description: e.target.value })}
      className="text-slate-600 leading-relaxed outline-none w-full min-h-[80px] bg-transparent resize-none border-b border-slate-200 pb-1"
    />
    <textarea
      placeholder="Qualifications..."
      value={value.qualifications}
      onChange={(e) => onChange({ ...value, qualifications: e.target.value })}
      className="text-slate-600 leading-relaxed outline-none w-full min-h-[80px] bg-transparent resize-none"
    />
    {role === "HRStaff" && (
      <p className="text-xs text-purple-500 font-medium">⚠ Your changes will be submitted for manager review.</p>
    )}
    <div className="flex gap-3">
      <button onClick={onSave} className="px-4 py-1.5 rounded-full font-bold text-xs text-white bg-green-600 border-none cursor-pointer">{submitLabel}</button>
      <button onClick={onCancel} className="px-4 py-1.5 rounded-full font-bold text-xs text-white bg-red-600 border-none cursor-pointer">Cancel</button>
    </div>
  </div>
);

const CreateButton = ({ onClick, stretch }) => (
  <div onClick={onClick}
    className={`border-[3px] border-dashed border-teal-400 rounded-2xl flex flex-col items-center justify-center gap-1 cursor-pointer hover:bg-teal-50 transition-colors px-4 py-8 w-full ${stretch ? "flex-1" : ""}`}>
    <span className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-teal-400 text-white text-3xl shadow-[4px_4px_0px_#0f172a]">+</span>
    <span className="font-bold text-[#0f172a] text-sm mt-1 text-center">Create New Requirement</span>
  </div>
);

const ReqCard = ({ req, showActions, onApprove, onReject, onClick }) => (
  <div onClick={onClick}
    className="bg-white border border-slate-200 rounded-[20px] px-5 py-4 flex flex-col gap-2 shadow-sm cursor-pointer hover:shadow-md transition-shadow">
    <div className="flex justify-between items-start gap-2">
      <span className="font-bold text-[#0f172a] text-sm">{req.job_title}</span>
      <StatusBadge status={req.status} />
    </div>
    <p className="text-slate-500 text-xs leading-relaxed m-0 line-clamp-2">{req.description}</p>
    <div className="text-xs text-slate-400">
      <span>Created: {req.date_created}{req.created_by ? ` · ${req.created_by}` : ""}</span>
      {req.modified_by && <span className="block text-purple-500 mt-0.5">Modified: {req.date_modified || "—"} · {req.modified_by}</span>}
    </div>
    {showActions && ["pending", "changes_pending", "deletion_pending"].includes(req.status) && (
      <div className="flex gap-2 mt-1" onClick={(e) => e.stopPropagation()}>
        <button onClick={() => onApprove(req.id)}
          className="px-3 py-1 rounded-full font-bold text-xs text-white bg-green-600 cursor-pointer border-none">
          {req.status === "deletion_pending" ? "Confirm Delete" : "Approve"}
        </button>
        <button onClick={() => onReject(req.id)}
          className="px-3 py-1 rounded-full font-bold text-xs text-white bg-red-600 cursor-pointer border-none">
          Reject
        </button>
      </div>
    )}
  </div>
);

export default function Requirements() {
  const { auth } = useAuth();
  const role = auth.role;

  const [requirements, setRequirements] = useState([]);
  const [search, setSearch]             = useState("");
  const [showForm, setShowForm]         = useState(false);
  const [newReq, setNewReq]             = useState({ job_title: "", description: "", qualifications: "" });
  const [editReq, setEditReq]           = useState(null);
  const [modalReq, setModalReq]         = useState(null);
  const [approvedPage, setApprovedPage] = useState(1);
  const [allPage, setAllPage]           = useState(1);
  const [reqSort, setReqSort]           = useState("default");

  const autoApprove = role === "owner" || role === "HRManager";

  const fetchRequirements = async () => {
    try {
      const data = await apiFetch("/api/requirements/", { token: auth.token });
      setRequirements(Array.isArray(data) ? data : []);
    } catch {
      setRequirements([]);
    }
  };

  useEffect(() => { fetchRequirements(); }, []);

  const handleCreate = async () => {
    if (!newReq.job_title || !newReq.description || !newReq.qualifications) { window.showAlert("Please fill in all fields."); return; }
    try {
      const created = await apiFetch("/api/requirements/", {
        method: "POST",
        token: auth.token,
        body: newReq,
      });
      if (autoApprove && created.id) {
        await apiFetch(`/api/requirements/${created.id}/`, {
          method: "PATCH",
          token: auth.token,
          body: { status: "approved" },
        });
        created.status = "approved";
      }
      created.created_by = created.created_by || "Owner";
      setRequirements((prev) => [...prev, created]);
      setNewReq({ job_title: "", description: "", qualifications: "" });
      setShowForm(false);
    } catch (err) { window.showAlert(getErrorMessage(err, "Failed to create")); }
  };

  const handleEditSave = async () => {
    if (!editReq.job_title || !editReq.description || !editReq.qualifications) { window.showAlert("Please fill in all fields."); return; }
    try {
      const updated = await apiFetch(`/api/requirements/${editReq.id}/`, {
        method: "PUT",
        token: auth.token,
        body: { job_title: editReq.job_title, description: editReq.description, qualifications: editReq.qualifications },
      });
      setRequirements((prev) => prev.map((r) => r.id === editReq.id ? { ...r, ...updated } : r));
      setEditReq(null);
      if (role === "HRStaff") window.showAlert("Your changes have been submitted for manager review.");
    } catch (err) { window.showAlert(getErrorMessage(err, "Failed to update")); }
  };

  const handleDelete = async (id) => {
    if (!(await window.showConfirm("Delete this requirement?", { danger: true, confirmText: "Delete" }))) return;
    try {
      await apiFetch(`/api/requirements/${id}/`, { method: "DELETE", token: auth.token });
      setRequirements((prev) => prev.filter((r) => r.id !== id));
    } catch (err) { window.showAlert(getErrorMessage(err, "Failed to delete")); }
  };

  const handleProposeDelete = async (id) => {
    if (!(await window.showConfirm("Propose deletion? A manager will need to approve.", { confirmText: "Propose" }))) return;
    try {
      await apiFetch(`/api/requirements/${id}/`, {
        method: "PATCH",
        token: auth.token,
        body: { status: "deletion_pending" },
      });
      setRequirements((prev) => prev.map((r) => r.id === id ? { ...r, status: "deletion_pending" } : r));
    } catch (err) { window.showAlert(getErrorMessage(err, "Failed")); }
  };

  const handleStatus = async (id, status) => {
    try {
      const updated = await apiFetch(`/api/requirements/${id}/`, {
        method: "PATCH",
        token: auth.token,
        body: { status },
      });
      setRequirements((prev) => prev.map((r) => r.id === updated.id ? { ...r, status: updated.status, pending_changes: null } : r));
    } catch (err) { window.showAlert(getErrorMessage(err, "Failed to update status")); }
  };

  const handleApprove = async (id) => {
    const req = requirements.find((r) => r.id === id);
    if (req?.status === "deletion_pending") await handleDelete(id);
    else await handleStatus(id, "approved");
  };

  const filtered  = (list) => list.filter((r) => r.job_title?.toLowerCase().includes(search.toLowerCase()));
  const pending   = filtered(requirements.filter((r) => ["pending", "changes_pending", "deletion_pending"].includes(r.status)));
  const approved  = filtered(requirements.filter((r) => r.status === "approved"));
  const all       = filtered(requirements);
  const sortReqs  = (list) => {
    if (reqSort === "az") return [...list].sort((a, b) => (a.job_title || "").localeCompare(b.job_title || ""));
    if (reqSort === "za") return [...list].sort((a, b) => (b.job_title || "").localeCompare(a.job_title || ""));
    return list;
  };
  const resetForm = () => { setShowForm(false); setNewReq({ job_title: "", description: "", qualifications: "" }); };

  const paginate = (list, page) => list.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const renderLeftPanel = (submitLabel, cancelFn, forceStretch = false) =>
    editReq ? (
      <ReqForm value={editReq} onChange={setEditReq} onSave={handleEditSave}
        onCancel={() => setEditReq(null)}
        submitLabel={role === "HRStaff" ? "Submit Changes" : "Save Changes"} role={role} />
    ) : showForm ? (
      <ReqForm value={newReq} onChange={setNewReq} onSave={handleCreate}
        onCancel={cancelFn} submitLabel={submitLabel} role={role} />
    ) : (
      <CreateButton onClick={() => setShowForm(true)} stretch={forceStretch || pending.length === 0} />
    );

return (
  <section
    className="px-4 pt-1 bg-[#0B2447]"
    style={{ height: "calc(100vh - 56px)", display: "flex", flexDirection: "column", overflow: "hidden" }}
  >
    <Modal req={modalReq} onClose={() => setModalReq(null)}
      onEdit={(r) => setEditReq({ ...r })} onDelete={handleDelete}
      onProposeDelete={handleProposeDelete} role={role} />

    <div
      className="max-w-[1200px] w-full mx-auto bg-white rounded-3xl pt-4 px-8 pb-6 border-2 border-[#0B2447]"
      style={{ boxShadow: "6px 6px 0px #0B2447", flex: "1 1 0", minHeight: 0, display: "flex", flexDirection: "column", marginBottom: "1rem", overflow: "hidden" }}
    >
      <div className="flex items-center justify-between gap-4 mb-4 flex-wrap">
        <div className="font-extrabold text-[#0B2447] rounded-full border-2 border-[#0B2447] text-lg tracking-wide px-6 h-[50px] flex items-center justify-center whitespace-nowrap"
          style={{ boxShadow: "3px 3px 0px #0B2447" }}>
          Requirements
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <select
              value={reqSort}
              onChange={(e) => setReqSort(e.target.value)}
              className="appearance-none border-2 border-[#0B2447] rounded-full pl-4 pr-10 py-2 text-sm font-semibold text-[#0B2447] bg-white outline-none cursor-pointer"
            >
              <option value="default">Sort: Default</option>
              <option value="az">Name (A–Z)</option>
              <option value="za">Name (Z–A)</option>
            </select>
            <KeyboardArrowDownIcon className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#0B2447]" style={{ fontSize: 20 }} />
          </div>
          <div className="flex items-center gap-2 border-2 border-[#0B2447] rounded-full px-4 py-2 w-[240px]">
            <input type="search" placeholder="Search" value={search}
              onChange={(e) => { setSearch(e.target.value); setApprovedPage(1); setAllPage(1); }}
              className="border-none outline-none w-full text-sm text-[#0B2447] bg-transparent placeholder-slate-400" />
            <SearchIcon style={{ fontSize: 20, color: "#0B2447" }} />
          </div>
        </div>
      </div>

      {role === "HRStaff" && (
        <div style={{ display: "grid", gridTemplateColumns: "minmax(220px,280px) 1fr", gap: "1.5rem", flex: "1 1 0", minHeight: 0, overflow: "hidden" }}>
          <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
            {renderLeftPanel("Submit", resetForm, true)}
          </div>
          <div style={{ overflowY: "auto", height: "100%" }}>
            {all.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-2">
                <p className="font-bold">No requirements yet.</p>
                <p className="text-sm">Create one using the form on the left.</p>
              </div>
            ) : (
              <>
                <h3 className="font-extrabold text-[#0f172a] text-sm text-slate-500 mb-3">
                  {all.length} Requirement(s) · Page {allPage} of {Math.ceil(all.length / ITEMS_PER_PAGE)}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {paginate(sortReqs(all), allPage).map((req) => (
                    <ReqCard key={req.id} req={req} showActions={false} onClick={() => setModalReq(req)} />
                  ))}
                </div>
                <Pagination total={all.length} page={allPage} onPage={setAllPage} />
              </>
            )}
          </div>
        </div>
      )}

      {(role === "HRManager" || role === "owner") && (
        <div style={{ display: "grid", gridTemplateColumns: "minmax(220px,280px) 1fr", gap: "1.5rem", flex: "1 1 0", minHeight: 0, overflow: "hidden" }}>

          <div style={{ overflowY: "auto", height: "100%", display: "flex", flexDirection: "column", gap: "1rem" }}>
            {renderLeftPanel("Save", resetForm)}
            {pending.length > 0 && (
              <div className="bg-[#fde8c0] rounded-[20px] p-5">
                <h2 className="text-sm font-extrabold text-[#0f172a] mb-3">Pending ({pending.length})</h2>
                <div className="flex flex-col gap-3">
                  {pending.map((req) => (
                    <ReqCard key={req.id} req={req} showActions={true}
                      onApprove={handleApprove}
                      onReject={(id) => handleStatus(id, "rejected")}
                      onClick={() => setModalReq(req)} />
                  ))}
                </div>
              </div>
            )}
          </div>

          <div style={{ overflowY: "auto", height: "100%" }}>
            {approved.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-2">
                <p className="font-bold">No approved requirements yet.</p>
              </div>
            ) : (
              <>
                <h3 className="font-extrabold text-[#0f172a] text-sm text-slate-500 mb-3">
                  Approved ({approved.length}) · Page {approvedPage} of {Math.ceil(approved.length / ITEMS_PER_PAGE)}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {paginate(sortReqs(approved), approvedPage).map((req) => (
                    <ReqCard key={req.id} req={req} showActions={false} onClick={() => setModalReq(req)} />
                  ))}
                </div>
                <Pagination total={approved.length} page={approvedPage} onPage={setApprovedPage} />
              </>
            )}
          </div>
        </div>
      )}
    </div>
  </section>
  );
}
