import { Link, useLocation } from "react-router";
import NotificationsNoneIcon from "@mui/icons-material/NotificationsNone";

const NAV_LINKS = [
  { label: "Applicants",      path: "/applicants" },
  { label: "Employer",        path: "/employer" },
  { label: "Requirements",    path: "/requirements" },
  { label: "Company Profile", path: "/profile" },
];

export default function Navbar() {
  const { pathname } = useLocation();

  return (
    <nav className="bg-[#0B2447] text-white px-6">
      <div className="max-w-[1200px] mx-auto flex items-center gap-10 h-14">

        {/* Logo + bell */}
        <div className="flex items-center gap-2 shrink-0">
          <Link to="/" className="text-white no-underline font-bold text-xl tracking-tight">
            H<span className="text-sky-400">!</span>RE
          </Link>
          <div className="w-8 h-8 rounded-full border-2 border-teal-400 flex items-center justify-center text-teal-400">
            <NotificationsNoneIcon style={{ fontSize: 16 }} />
          </div>
        </div>

        {/* Nav links — pushed to the right */}
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
    </nav>
  );
}