// Shared presentational pieces for the revision #4 metrics views (owner/manager
// page + admin dashboard). Pure display — parents fetch and pass the data in.

export const fmtHours = (h) => {
  if (h === null || h === undefined) return "—";
  if (h < 1) return `${Math.round(h * 60)} min`;
  if (h < 48) return `${h} h`;
  return `${(h / 24).toFixed(1)} d`;
};

const Tile = ({ label, value, sub, accent = "#0B2447" }) => (
  <div className="bg-white border-2 border-slate-200 rounded-2xl px-4 py-3 flex flex-col gap-0.5 min-w-[120px] flex-1">
    <span className="text-[0.7rem] font-bold uppercase tracking-wide text-slate-400">{label}</span>
    <span className="text-2xl font-extrabold tabular-nums" style={{ color: accent }}>{value}</span>
    {sub && <span className="text-[0.72rem] text-slate-400">{sub}</span>}
  </div>
);

const FUNNEL = [
  { key: "pending",        label: "Pending",     color: "#94a3b8" },
  { key: "shortlisted",    label: "Shortlisted", color: "#22c55e" },
  { key: "interview_sent", label: "Interview",   color: "#3b82f6" },
  { key: "hired",          label: "Hired",       color: "#0d9488" },
  { key: "rejected",       label: "Rejected",    color: "#ef4444" },
];

const BANDS = [
  { key: "strong", label: "Strong (80+)",  color: "#22c55e" },
  { key: "good",   label: "Good (60–79)",  color: "#84cc16" },
  { key: "fair",   label: "Fair (45–59)",  color: "#eab308" },
  { key: "weak",   label: "Weak (<45)",    color: "#ef4444" },
];

export function MetricsView({ metrics, title }) {
  if (!metrics) return null;
  const m = metrics;
  const byStatus = m.by_status || {};
  const maxFunnel = Math.max(1, ...FUNNEL.map((f) => byStatus[f.key] || 0));
  const bands = m.score_bands || {};
  const totalBand = BANDS.reduce((a, b) => a + (bands[b.key] || 0), 0) || 1;

  return (
    <div className="flex flex-col gap-4">
      {title && <h3 className="text-base font-extrabold text-[#0B2447] m-0">{title}</h3>}

      {/* headline tiles */}
      <div className="flex gap-3 flex-wrap">
        <Tile label="Evaluated" value={m.total_evaluated ?? 0} />
        <Tile label="Shortlist rate" value={m.shortlist_rate != null ? `${m.shortlist_rate}%` : "—"} sub={`${m.shortlisted_or_beyond ?? 0} of ${m.total_evaluated ?? 0}`} accent="#16a34a" />
        <Tile label="Hired" value={m.hired ?? 0} sub={m.hire_rate != null ? `${m.hire_rate}% hire rate` : null} accent="#0d9488" />
        <Tile label="Avg H!RE Score" value={m.avg_hire_score != null ? m.avg_hire_score : "—"} accent="#f97316" />
      </div>

      {/* efficiency */}
      <div className="flex gap-3 flex-wrap">
        <Tile label="Avg time to shortlist" value={fmtHours(m.avg_time_to_shortlist_hours)} sub={`n = ${m.time_to_shortlist_n ?? 0}`} accent="#2563eb" />
        <Tile label="Avg time to fill" value={fmtHours(m.avg_time_to_fill_hours)} sub={`n = ${m.time_to_fill_n ?? 0}`} accent="#2563eb" />
      </div>

      {/* funnel */}
      <div className="bg-white border-2 border-slate-200 rounded-2xl p-4">
        <p className="text-[0.7rem] font-bold uppercase tracking-wide text-slate-400 m-0 mb-2">Pipeline</p>
        <div className="flex flex-col gap-2">
          {FUNNEL.map((f) => {
            const v = byStatus[f.key] || 0;
            return (
              <div key={f.key} className="flex items-center gap-3">
                <span className="w-24 text-xs font-semibold text-slate-600 shrink-0">{f.label}</span>
                <div className="flex-1 bg-slate-100 rounded-full h-4 overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{ width: `${(v / maxFunnel) * 100}%`, backgroundColor: f.color, minWidth: v > 0 ? "6px" : 0 }} />
                </div>
                <span className="w-8 text-right text-xs font-bold tabular-nums text-[#0B2447] shrink-0">{v}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* score bands */}
      <div className="bg-white border-2 border-slate-200 rounded-2xl p-4">
        <p className="text-[0.7rem] font-bold uppercase tracking-wide text-slate-400 m-0 mb-2">H!RE Score distribution</p>
        <div className="flex h-4 rounded-full overflow-hidden mb-2">
          {BANDS.map((b) => {
            const v = bands[b.key] || 0;
            return v > 0 ? <div key={b.key} style={{ width: `${(v / totalBand) * 100}%`, backgroundColor: b.color }} title={`${b.label}: ${v}`} /> : null;
          })}
        </div>
        <div className="flex gap-4 flex-wrap">
          {BANDS.map((b) => (
            <span key={b.key} className="flex items-center gap-1.5 text-xs text-slate-600">
              <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: b.color }} />
              {b.label}: <b className="tabular-nums">{bands[b.key] || 0}</b>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

export function AiLogTable({ logs, model }) {
  return (
    <div className="bg-white border-2 border-slate-200 rounded-2xl p-4 flex flex-col gap-2 min-h-0">
      <div className="flex items-baseline justify-between gap-2 flex-wrap">
        <p className="text-[0.7rem] font-bold uppercase tracking-wide text-slate-400 m-0">AI procedure log</p>
        {model && <span className="text-[0.68rem] text-slate-400 font-mono">{model.name} · {model.weights_version}</span>}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="text-left text-slate-400">
              {["Date", "Semantic", "Skills", "Role", "Impact", "Soft", "LLM", "H!RE"].map((h) => (
                <th key={h} className="py-1.5 px-2 font-bold whitespace-nowrap border-b border-slate-200">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(!logs || logs.length === 0) ? (
              <tr><td colSpan={8} className="py-4 text-center text-slate-400">No AI evaluations logged yet.</td></tr>
            ) : logs.map((l) => (
              <tr key={l.ai_log_id} className="border-b border-slate-100">
                <td className="py-1.5 px-2 whitespace-nowrap text-slate-500">{l.created_at ? new Date(l.created_at).toLocaleDateString("en-PH", { timeZone: "Asia/Manila", month: "short", day: "numeric" }) : "—"}</td>
                <td className="py-1.5 px-2 tabular-nums">{l.semantic_score ?? "—"}</td>
                <td className="py-1.5 px-2 tabular-nums">{l.skills_match ?? "—"}</td>
                <td className="py-1.5 px-2 tabular-nums">{l.role_relevance ?? "—"}</td>
                <td className="py-1.5 px-2 tabular-nums">{l.impact ?? "—"}</td>
                <td className="py-1.5 px-2 tabular-nums">{l.soft_signals ?? "—"}</td>
                <td className="py-1.5 px-2 tabular-nums font-semibold">{l.llm_score ?? "—"}</td>
                <td className="py-1.5 px-2 tabular-nums font-extrabold text-[#0B2447]">{l.hire_score ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
