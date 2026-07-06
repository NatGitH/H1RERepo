import { useState, useEffect } from "react";

// Imperative, app-wide replacement for window.alert / window.confirm.
// Mount <AlertHost/> once (in main.jsx). Call window.showAlert(...) /
// window.showConfirm(...) anywhere — no per-component wiring needed.

let _push = null;

export function showAlert(message, { title = "", type = "info" } = {}) {
  if (_push) _push({ kind: "alert", message: String(message ?? ""), title, type });
  else window.alert(message);
}

export function showConfirm(
  message,
  { title = "Please confirm", confirmText = "Confirm", cancelText = "Cancel", danger = false } = {}
) {
  return new Promise((resolve) => {
    if (_push) _push({ kind: "confirm", message: String(message ?? ""), title, confirmText, cancelText, danger, resolve });
    else resolve(window.confirm(message));
  });
}

export default function AlertHost() {
  const [queue, setQueue] = useState([]);

  useEffect(() => {
    _push = (item) => setQueue((q) => [...q, { ...item, id: Date.now() + Math.random() }]);
    // Expose globally so plain `window.showAlert(...)` works everywhere.
    window.showAlert = showAlert;
    window.showConfirm = showConfirm;
    return () => {
      _push = null;
    };
  }, []);

  const current = queue[0];
  if (!current) return null;

  const close = (result) => {
    if (current.kind === "confirm" && current.resolve) current.resolve(result);
    setQueue((q) => q.slice(1));
  };

  const accent =
    current.type === "error" ? "#ef4444" : current.type === "success" ? "#22c55e" : "#f97316";

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center px-4"
      style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
      onClick={() => current.kind === "alert" && close()}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-sm p-6 flex flex-col gap-4"
        style={{ border: "2px solid #1a1a2e", boxShadow: "6px 6px 0px #000000" }}
        onClick={(e) => e.stopPropagation()}
      >
        {current.title && (
          <h3 className="font-extrabold text-lg m-0" style={{ color: current.kind === "confirm" ? "#0B2447" : accent }}>
            {current.title}
          </h3>
        )}
        <p className="text-sm text-[#0B2447] m-0 whitespace-pre-line break-words leading-relaxed">
          {current.message}
        </p>
        <div className="flex justify-end gap-2 mt-1">
          {current.kind === "confirm" && (
            <button
              onClick={() => close(false)}
              className="bg-slate-200 hover:bg-slate-300 text-[#0B2447] font-bold rounded-full px-5 py-2 text-sm border-none cursor-pointer"
            >
              {current.cancelText}
            </button>
          )}
          <button
            onClick={() => close(true)}
            className="text-white font-bold rounded-full px-5 py-2 text-sm border-none cursor-pointer"
            style={{ backgroundColor: current.kind === "confirm" ? (current.danger ? "#ef4444" : "#2563eb") : "#2563eb" }}
          >
            {current.kind === "confirm" ? current.confirmText : "OK"}
          </button>
        </div>
      </div>
    </div>
  );
}
