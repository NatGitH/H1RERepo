import { useState } from "react";

export default function RemoveInterviewModal({ applicantName, onCancel, onConfirm }) {
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    try {
      await onConfirm(reason.trim());
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[70] px-4" onClick={onCancel}>
      <div
        className="bg-white rounded-2xl w-full max-w-md p-6 flex flex-col gap-4"
        style={{ border: "2px solid #1a1a2e", boxShadow: "6px 6px 0px #000000" }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="font-extrabold text-lg text-red-500 m-0">Remove Interview?</h3>
        <p className="text-sm text-[#0B2447] m-0">
          This will <strong>remove the interview and delete {applicantName || "the applicant"}</strong> from
          the system, and email them that their interview was cancelled. Proceed with caution.
        </p>
        <div>
          <label className="block text-xs font-bold text-[#0B2447] mb-1">Reason for removal of interview</label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            placeholder="Let the applicant know why the interview was cancelled..."
            className="w-full border-2 border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-red-400 resize-none"
          />
        </div>
        <div className="flex gap-3">
          <button
            onClick={submit}
            disabled={busy}
            className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold rounded-full py-2.5 text-sm border-none cursor-pointer disabled:opacity-60"
          >
            {busy ? "Removing..." : "Remove Anyways"}
          </button>
          <button
            onClick={onCancel}
            disabled={busy}
            className="flex-1 border-2 border-slate-300 text-slate-600 font-bold rounded-full py-2.5 text-sm hover:bg-slate-50 cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
