import { useState } from "react";
import { Link, useLocation } from "react-router";
import NotificationsNoneIcon from "@mui/icons-material/NotificationsNone";

const NAV_LINKS = [
  { label: "Applicants",      path: "/applicants" },
  { label: "Employer",        path: "/employer" },
  { label: "Requirements",    path: "/requirements" },
  { label: "Company Profile", path: "/profile" },
];

const notifications = [
];

export default function Navbar() {
  const { pathname } = useLocation();
  const [showNotifs, setShowNotifs] = useState(false);
  const [notifList, setNotifList] = useState(notifications);

  const unreadCount = notifList.filter((n) => n.unread).length;

  const markAllRead = () =>
    setNotifList((prev) => prev.map((n) => ({ ...n, unread: false })));

  return (
    <nav className="bg-[#0B2447] text-white px-6">
      <div className="max-w-[1200px] mx-auto flex items-center gap-10 h-14">

        {/* Logo + bell */}
        <div className="flex items-center gap-2 shrink-0">
          <Link to="/" className="text-white no-underline font-bold text-xl tracking-tight">
            H<span className="text-teal-400">!</span>RE
          </Link>

          <button
            onClick={() => setShowNotifs((v) => !v)}
            className="relative w-8 h-8 rounded-full bg-teal-400 flex items-center justify-center text-white border-none cursor-pointer hover:bg-teal-300 transition-colors"
          >
            <NotificationsNoneIcon style={{ fontSize: 16 }} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-orange-400 text-white text-[0.6rem] font-black flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>
        </div>

        {/* Nav links */}
        <ul className="flex items-center gap-8 list-none m-0 p-0 ml-auto">
          {NAV_LINKS.map(({ label, path }) => {
            const active = pathname === path;
            return (
              <li key={path}>
                <Link
                  to={path}
                  className="text-sm no-underline transition-colors"
                  style={{
                    color: active ? "white" : "rgb(148,163,184)",
                    fontWeight: active ? 700 : 400,
                    paddingBottom: "4px",
                    borderBottom: active
                      ? "2px solid #38bdf8"
                      : "2px solid transparent",
                  }}
                >
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
      
            {/* Notification Dropdown */}
      {showNotifs && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-40" onClick={() => setShowNotifs(false)} />

          {/* Panel */}
          <div className="absolute left-4 top-14 z-50 w-[320px] bg-white rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.18)] overflow-hidden">

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <h3 className="text-[1.1rem] font-extrabold text-[#0f172a] m-0">Notifications</h3>
              <button
                onClick={markAllRead}
                className="text-teal-500 text-sm font-semibold bg-transparent border-none cursor-pointer hover:text-teal-600"
              >
                Mark all as read
              </button>
            </div>

            {/* List */}
            <div className="flex flex-col divide-y divide-slate-100 max-h-[420px] overflow-y-auto">
              {notifList.map((notif) => (
                <div
                  key={notif.id}
                  className={`flex items-start gap-3 px-5 py-4 transition-colors ${
                    notif.unread ? "bg-slate-50" : "bg-white"
                  }`}
                >
                  {/* Icon */}
                  <div className={`w-10 h-10 min-w-[2.5rem] rounded-xl flex items-center justify-center text-lg ${notif.unread ? "bg-teal-100" : "bg-slate-100"}`}>
                    {notif.icon}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-[0.88rem] font-bold text-[#0f172a] leading-snug">
                        {notif.title}
                      </span>
                      {notif.time && (
                        <span className="text-[0.75rem] text-slate-400 whitespace-nowrap">{notif.time}</span>
                      )}
                    </div>
                    <p className="text-[0.78rem] text-slate-500 m-0 mt-0.5 leading-snug truncate">
                      {notif.message}
                    </p>
                    {notif.status && (
                      <span className={`inline-block mt-1.5 px-3 py-0.5 rounded-full text-[0.72rem] font-bold text-white ${notif.statusColor}`}>
                        {notif.status}
                      </span>
                    )}
                  </div>

                  {/* Unread dot */}
                  {notif.unread && (
                    <div className="w-2 h-2 rounded-full bg-orange-400 mt-1.5 min-w-[0.5rem]" />
                  )}
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="px-5 py-4 border-t border-slate-100 text-center">
              <button className="text-[0.9rem] font-bold text-[#0f172a] bg-transparent border-none cursor-pointer hover:text-teal-500 transition-colors">
                See all notifications →
              </button>
            </div>
          </div>
        </>
      )}
    </nav>
  );
}