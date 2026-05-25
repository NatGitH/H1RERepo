import { useState, useRef, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import NotificationsNoneIcon from "@mui/icons-material/NotificationsNone";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import LogoutIcon from "@mui/icons-material/Logout";

const NAV_LINKS = [
  { label: "Applicants", path: "/applicants" },
  { label: "Requirements", path: "/requirements" },
];

export default function NavbarHrStaff() {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  const [showNotifs, setShowNotifs] = useState(false);
  const [notifList, setNotifList] = useState([]);
  const [showProfile, setShowProfile] = useState(false);

  const dropdownRef = useRef(null);

  const unreadCount = notifList.filter((n) => n.unread).length;

  const markAllRead = () =>
    setNotifList((prev) =>
      prev.map((n) => ({
        ...n,
        unread: false,
      }))
    );

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target)
      ) {
        setShowProfile(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () =>
      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );
  }, []);

  return (
    <nav className="bg-[#0B2447] text-white px-6">
      <div className="max-w-[1200px] mx-auto flex items-center gap-10 h-16">

        {/* Logo + bell */}
        <div className="flex items-center gap-2 shrink-0 h-full">
          <Link
            to="/"
            className="text-white no-underline font-bold text-xl tracking-tight flex items-center h-full"
          >
            H<span className="text-sky-400">!</span>RE
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

          {/* Notification Dropdown */}
          {showNotifs && (
            <>
              {/* Backdrop */}
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowNotifs(false)}
              />

              {/* Panel */}
              <div className="absolute left-4 top-14 z-50 w-[320px] bg-white rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.18)] overflow-hidden">

                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                  <h3 className="text-[1.1rem] font-extrabold text-[#0f172a] m-0">
                    Notifications
                  </h3>

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
                        notif.unread
                          ? "bg-slate-50"
                          : "bg-white"
                      }`}
                    >
                      {/* Icon */}
                      <div
                        className={`w-10 h-10 min-w-[2.5rem] rounded-xl flex items-center justify-center text-lg ${
                          notif.unread
                            ? "bg-teal-100"
                            : "bg-slate-100"
                        }`}
                      >
                        {notif.icon}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-[0.88rem] font-bold text-[#0f172a] leading-snug">
                            {notif.title}
                          </span>

                          {notif.time && (
                            <span className="text-[0.75rem] text-slate-400 whitespace-nowrap">
                              {notif.time}
                            </span>
                          )}
                        </div>

                        <p className="text-[0.78rem] text-slate-500 m-0 mt-0.5 leading-snug truncate">
                          {notif.message}
                        </p>

                        {notif.status && (
                          <span
                            className={`inline-block mt-1.5 px-3 py-0.5 rounded-full text-[0.72rem] font-bold text-white ${notif.statusColor}`}
                          >
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
        </div>

        {/* Nav links */}
        <ul className="flex items-center gap-8 list-none m-0 p-0 ml-auto h-full">
          {NAV_LINKS.map(({ label, path }) => {
            const active = pathname === path;

            return (
              <li
                key={path}
                className="h-full flex items-center"
              >
                <Link
                  to={path}
                  className="flex items-center text-sm no-underline transition-colors pb-1"
                  style={{
                    color: active
                      ? "white"
                      : "rgb(148,163,184)",
                    fontWeight: active ? 700 : 400,
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

          {/* My Profile */}
          <li
            className="relative h-full flex items-center"
            ref={dropdownRef}
          >
            <Link
              to="#"
              onClick={(e) => {
                e.preventDefault();
                setShowProfile(!showProfile);
              }}
              className="flex items-center text-sm no-underline transition-colors pb-1"
              style={{
                color: showProfile
                  ? "white"
                  : "rgb(148,163,184)",
                fontWeight: showProfile ? 700 : 400,
                borderBottom: showProfile
                  ? "2px solid #38bdf8"
                  : "2px solid transparent",
              }}
            >
              My Profile

              {showProfile ? (
                <KeyboardArrowUpIcon
                  style={{ fontSize: 18 }}
                />
              ) : (
                <KeyboardArrowDownIcon
                  style={{ fontSize: 18 }}
                />
              )}
            </Link>

            {showProfile && (
              <div
                className="absolute right-0 top-14 bg-white rounded-xl py-3 px-4 w-52 z-50"
                style={{
                  border: "2px solid #1a1a2e",
                  boxShadow: "1px 1px 0px #000000",
                }}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 rounded-full bg-teal-500 flex items-center justify-center text-white font-bold text-sm">
                    AB
                  </div>

                  <div>
                    <p className="text-black font-semibold text-sm leading-tight">
                      Allen Bornasal
                    </p>

                    <p className="text-gray-400 text-xs">
                      Recruiter
                    </p>
                  </div>
                </div>

                <hr className="border-gray-200 mb-3" />

                <button
                  onClick={() =>
                    navigate("/Company-Home")
                  }
                  className="flex items-center gap-2 text-red-500 hover:text-red-600 text-sm font-medium transition w-full bg-transparent p-0 m-0 cursor-pointer border-none"
                >
                  <LogoutIcon style={{ fontSize: 16 }} />
                  Sign out
                </button>
              </div>
            )}
          </li>
        </ul>
      </div>
    </nav>
  );
}