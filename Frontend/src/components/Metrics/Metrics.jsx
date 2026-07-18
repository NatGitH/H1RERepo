import { useState, useEffect } from "react";
import { useAuth } from "../../.Context/AuthContext";
import { apiFetch, getErrorMessage } from "../../api";
import { MetricsView, AiLogTable } from "./MetricsView";

// Revision #4 — company-scoped metrics & AI review for owner / HR Manager.
export default function Metrics() {
  const { auth } = useAuth();
  const [metrics, setMetrics] = useState(null);
  const [logs, setLogs]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true); setError("");
      try {
        const [m, l] = await Promise.all([
          apiFetch("/api/metrics/", { token: auth.token }),
          apiFetch("/api/ai-logs/", { token: auth.token }),
        ]);
        if (cancelled) return;
        setMetrics(m);
        setLogs(Array.isArray(l) ? l : []);
      } catch (err) {
        if (!cancelled) setError(getErrorMessage(err, "Failed to load metrics."));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [auth.token]);

  return (
    <section className="px-4 pt-1 bg-[#0B2447] h-[calc(100vh-56px)] overflow-hidden flex flex-col">
      <div
        className="max-w-[1200px] w-full mx-auto bg-white rounded-3xl pt-4 px-10 pb-6 border-2 border-[#0B2447] flex-1 flex flex-col min-h-0 mb-4"
        style={{ boxShadow: "6px 6px 0px #0B2447" }}
      >
        <div
          className="font-extrabold text-[#0B2447] rounded-full border-2 border-[#0B2447] text-lg tracking-wide px-6 h-[50px] flex items-center justify-center whitespace-nowrap self-start mb-4 shrink-0"
          style={{ boxShadow: "3px 3px 0px #0B2447" }}
        >
          Hiring Metrics
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto pr-1 flex flex-col gap-4">
          {loading ? (
            <p className="text-slate-400 text-sm">Loading metrics...</p>
          ) : error ? (
            <p className="text-red-500 text-sm">{error}</p>
          ) : (
            <>
              <MetricsView metrics={metrics} />
              <AiLogTable logs={logs} model={metrics?.model} />
              <p className="text-[0.72rem] text-slate-400 m-0">
                Efficiency figures are measured from evaluation upload to the shortlist / hire action.
                Fairness monitoring and candidate-experience (cNPS) metrics are planned additions.
              </p>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
