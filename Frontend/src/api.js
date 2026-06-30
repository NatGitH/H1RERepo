export const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export async function authFetch(url, options = {}, token) {
  const res = await fetch(url, {
    ...options,
    headers: { ...(options.headers || {}), Authorization: `Bearer ${token}` },
  });
  if (res.status === 401) {
    localStorage.clear();           // drop the dead token
    if (window.location.pathname !== "/") {
      window.location.href = "/";   // back to home/login
    }
    throw new Error("Session expired");
  }
  return res;
}