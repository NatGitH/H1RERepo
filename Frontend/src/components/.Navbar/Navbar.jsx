import { useState, useRef, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import NotificationsNoneIcon from "@mui/icons-material/NotificationsNone";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import LogoutIcon from "@mui/icons-material/Logout";
import { useAuth } from '../../.Context/AuthContext';

export default function Navbar() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [showNotifs, setShowNotifs] = useState(false);
  const [notifList, setNotifList] = useState([]);
  const [showProfile, setShowProfile] = useState(false);
  const dropdownRef = useRef(null);

  const { auth, logout } = useAuth();
  const role = auth.role;

  const unreadCount = notifList.filter((n) => n.unread).length;

  const markAllRead = () =>
    setNotifList((prev) => prev.map((n) => ({ ...n, unread: false })));

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowProfile(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const NAV_LINKS_BY_ROLE = {
    owner: [
      { label: "Applicants", path: "/Applicants" },
      { label: "Employer", path: "/Employer" },
      { label: "Requirements", path: "/Requirements" },
    ],
    HRManager: [
      { label: "Applicants", path: "/Applicants" },
      { label: "Employer", path: "/Employer" },
      { label: "Requirements", path: "/Requirements" },
    ],
    HRStaff: [
      { label: "Applicants", path: "/Applicants" },
      { label: "Requirements", path: "/Requirements" },
    ],
  };

  if (!role) return null;
  const NAV_LINKS = NAV_LINKS_BY_ROLE[role] || [];

  const getInitials = () => {
    if (auth.firstname && auth.lastname) {
      return `${auth.firstname[0]}${auth.lastname[0]}`.toUpperCase();
    }
    if (auth.email) return auth.email.substring(0, 2).toUpperCase();
    return "HR";
  };

  const getRoleLabel = () => {
    if (role === "HRManager") return "Manager";
    if (role === "HRStaff") return "Recruiter";
    if (role === "owner") return "Owner";
    return role;
  };

  return (
    <nav className="bg-[#0B2447] text-white px-6">
      <div className="max-w-[1350px] mx-auto flex items-center gap-12 h-14">

        {/* Logo + Bell */}
        <div className="flex items-center gap-2 shrink-0 h-full">
          <Link
            to="/"
            className="text-white no-underline font-extrabold text-3xl tracking-tight flex items-center h-full"
          >
            H<span className="text-sky-400">!</span>RE
          </Link>
          <button
            onClick={() => setShowNotifs((v) => !v)}
            className="relative w-11 h-11 rounded-full bg-teal-400 flex items-center justify-center text-white border-none cursor-pointer hover:bg-teal-300 transition-colors"
          >
            <NotificationsNoneIcon style={{ fontSize: 22 }} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-orange-400 text-white text-[0.6rem] font-black flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>
        </div>

        {/* Nav Links */}
        <ul className="flex items-center gap-6 list-none m-0 p-0 ml-auto h-full">
          {NAV_LINKS.map(({ label, path }) => {
            const active = pathname === path;
            return (
              <li key={path} className="h-full flex items-center">
                <Link
                  to={path}
                  className="flex items-center text-lg no-underline transition-colors pb-1"
                  style={{
                    color: active ? "white" : "rgb(148,163,184)",
                    fontWeight: active ? 700 : 400,
                    borderBottom: active ? "2px solid #38bdf8" : "2px solid transparent",
                  }}
                >
                  {label}
                </Link>
              </li>
            );
          })}

          {/* My Profile Dropdown — all roles */}
          <li className="relative h-full flex items-center" ref={dropdownRef}>
            <button
              onClick={() => setShowProfile((v) => !v)}
              className="flex items-center gap-1 text-lg no-underline transition-colors pb-1 bg-transparent border-none cursor-pointer"
              style={{
                color: pathname === "/Profile" || showProfile ? "white" : "rgb(148,163,184)",
                fontWeight: pathname === "/Profile" || showProfile ? 700 : 400,
                borderBottom: pathname === "/Profile" || showProfile ? "2px solid #38bdf8" : "2px solid transparent",
              }}
            >
              {role === "owner" ? "Company Profile" : "My Profile"}
              {showProfile ? (
                <KeyboardArrowUpIcon style={{ fontSize: 24 }} />
              ) : (
                <KeyboardArrowDownIcon style={{ fontSize: 24 }} />
              )}
            </button>

            {showProfile && (
              <div
                className="absolute right-0 top-14 bg-white rounded-xl py-3 px-4 w-56 z-50"
                style={{ border: "2px solid #1a1a2e", boxShadow: "3px 3px 0px #000000" }}
              >
                {/* User info */}
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 rounded-full bg-teal-500 flex items-center justify-center text-white text-sm font-bold shrink-0 overflow-hidden">
                    {auth.profile_picture ? (
                      <img
                        src={auth.profile_picture}
                        alt="Profile"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span>{getInitials()}</span>
                    )}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm font-bold text-[#0B2447] truncate">
                      {auth.firstname && auth.lastname
                        ? `${auth.firstname} ${auth.lastname}`
                        : auth.email || "User"}
                    </span>
                    <span className="text-xs text-slate-400">{getRoleLabel()}</span>
                  </div>
                </div>

                <hr className="border-gray-200 mb-3" />

                {/* Profile link */}
                <Link
                  to="/Profile"
                  onClick={() => setShowProfile(false)}
                  className="flex items-center gap-2 text-[#0B2447] hover:text-teal-600 text-sm font-semibold no-underline transition mb-3"
                >
                  {role === "owner" ? "Company Profile" : "My Profile"}
                </Link>

                <hr className="border-gray-200 mb-3" />

                {/* Sign out */}
                <button
                  onClick={() => { logout(); navigate("/"); }}
                  className="flex items-center gap-2 text-red-500 hover:text-red-600 text-sm font-medium transition w-full bg-transparent p-0 m-0 cursor-pointer border-none"
                >
                  <LogoutIcon style={{ fontSize: 16 }} />
                  Sign out
                </button>
              </div>
            )}
          </li>
        </ul>

        {/* Notification Panel */}
        {showNotifs && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setShowNotifs(false)} />
            <div className="absolute left-4 top-14 z-50 w-[320px] bg-white rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.18)] overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                <h3 className="text-[1.1rem] font-extrabold text-[#0f172a] m-0">Notifications</h3>
                <button
                  onClick={markAllRead}
                  className="text-teal-500 text-sm font-semibold bg-transparent border-none cursor-pointer hover:text-teal-600"
                >
                  Mark all as read
                </button>
              </div>
              <div className="flex flex-col divide-y divide-slate-100 max-h-[420px] overflow-y-auto">
                {notifList.map((notif) => (
                  <div
                    key={notif.id}
                    className={`flex items-start gap-3 px-5 py-4 ${notif.unread ? "bg-slate-50" : "bg-white"}`}
                  >
                    <div className={`w-10 h-10 min-w-[2.5rem] rounded-xl flex items-center justify-center text-lg ${notif.unread ? "bg-teal-100" : "bg-slate-100"}`}>
                      {notif.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-[0.88rem] font-bold text-[#0f172a]">{notif.title}</span>
                        {notif.time && <span className="text-[0.75rem] text-slate-400">{notif.time}</span>}
                      </div>
                      <p className="text-[0.78rem] text-slate-500 truncate">{notif.message}</p>
                    </div>
                    {notif.unread && <div className="w-2 h-2 rounded-full bg-orange-400 mt-1.5" />}
                  </div>
                ))}
              </div>
              <div className="px-5 py-4 border-t border-slate-100 text-center">
                <button className="text-[0.9rem] font-bold text-[#0f172a] hover:text-teal-500">
                  See all notifications →
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </nav>
  );
}