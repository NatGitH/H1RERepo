import { createContext, useContext, useState, useEffect, useRef } from "react";
import { API_BASE_URL } from "../api";

const AuthContext = createContext(null);

const STORAGE_KEY = "hire_auth";

// Only HR members have a presence status; owners/admins don't.
const HR_ROLES = ["HRStaff", "HRManager"];

// Fire-and-forget presence update. keepalive lets it complete even as the tab
// is closing (used for the "offline" write on unload).
function postStatus(token, role, status) {
  if (!token || !HR_ROLES.includes(role)) return;
  try {
    fetch(`${API_BASE_URL}/api/profile/update-status/`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ status }),
      keepalive: true,
    }).catch(() => {});
  } catch { /* ignore */ }
}

const defaultAuth = {
  token: null,
  role: null,
  companyId: null,
  companyName: null,
  email: null,
  user_id: null,
  adminId: null,
  profile_picture: null,
  firstname: null,
  lastname: null,
  subscription_plan: null,
};

const loadAuth = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : defaultAuth;
  } catch {
    return defaultAuth;
  }
};

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(loadAuth);
  const authRef = useRef(auth);
  authRef.current = auth;

  const login = (data) => {
    const wasLoggedOut = !authRef.current.token;
    const newAuth = { ...defaultAuth, ...data };
    setAuth(newAuth);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newAuth));
    // Mark active only on a real sign-in (not on profile-refresh re-calls that
    // already had a token), so a manual On Break / On Leave isn't wiped out.
    if (wasLoggedOut) postStatus(newAuth.token, newAuth.role, "active");
  };

  const logout = () => {
    postStatus(authRef.current.token, authRef.current.role, "offline");
    setAuth(defaultAuth);
    localStorage.removeItem(STORAGE_KEY);
  };

  // Presence: mark active when an HR session is (re)opened, send a heartbeat on
  // an interval so the server knows they're online, and mark offline when the
  // tab closes. If the unload beacon is missed, the server auto-marks them
  // offline once heartbeats go stale.
  useEffect(() => {
    if (HR_ROLES.includes(authRef.current.role)) {
      postStatus(authRef.current.token, authRef.current.role, "active");
    }
    const beat = () => {
      const a = authRef.current;
      if (HR_ROLES.includes(a.role) && a.token) {
        fetch(`${API_BASE_URL}/api/heartbeat/`, {
          method: "POST",
          headers: { Authorization: `Bearer ${a.token}` },
        }).catch(() => {});
      }
    };
    beat();
    const hb = setInterval(beat, 30000);
    const onLeave = () => postStatus(authRef.current.token, authRef.current.role, "offline");
    window.addEventListener("beforeunload", onLeave);
    return () => {
      clearInterval(hb);
      window.removeEventListener("beforeunload", onLeave);
    };
  }, []);

  return (
    <AuthContext.Provider value={{ auth, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}