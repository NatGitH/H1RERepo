export const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

// Must match STORAGE_KEY in .Context/AuthContext.jsx
const AUTH_STORAGE_KEY = "hire_auth";

/**
 * Normalized error for every API failure. Always carries a user-friendly
 * `.message`, plus the HTTP `.status` (0 = network/unreachable) and any parsed
 * response `.data` for callers that want the raw detail.
 */
export class ApiError extends Error {
  constructor(message, { status = 0, data = null } = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

// Prefer a server-provided message; otherwise a friendly default per status.
function messageForStatus(status, data) {
  const serverMsg =
    data && typeof data === "object" ? data.error || data.detail || data.message : null;
  if (serverMsg) return serverMsg;
  if (status === 400) return "Invalid request. Please check your input and try again.";
  if (status === 401) return "Your session has expired. Please log in again.";
  if (status === 403) return "You don't have permission to do that.";
  if (status === 404) return "We couldn't find what you were looking for.";
  if (status === 409) return "That action conflicts with the current state. Please refresh and retry.";
  if (status >= 500) return "The server ran into a problem. Please try again in a moment.";
  return "Something went wrong. Please try again.";
}

// On an expired/invalid session: drop auth and bounce to Home/Login.
// NOTE: app uses HashRouter, so the route lives after the '#'.
function redirectToLogin() {
  try {
    localStorage.removeItem(AUTH_STORAGE_KEY);
  } catch {
    /* ignore storage errors */
  }
  if (window.location.hash !== "#/" && window.location.hash !== "") {
    window.location.assign("/#/");
  }
}

/**
 * Standard fetch wrapper for the H!RE API.
 *
 *   const data = await apiFetch("/api/evaluations/", { token: auth.token });
 *   await apiFetch(`/api/evaluations/${id}/status/`, { method: "PATCH", token, body: { status } });
 *   await apiFetch("/api/evaluate/", { method: "POST", token, body: formData });
 *
 * - Prefixes API_BASE_URL (pass a path, or a full URL to bypass).
 * - JSON-encodes plain-object bodies; leaves FormData untouched (file uploads).
 * - Attaches the bearer token when provided.
 * - Turns EVERY failure (network, 4xx, 5xx) into an ApiError with a friendly message.
 * - On 401, clears auth and redirects to the login screen.
 * - Returns parsed JSON, or null for empty bodies.
 */
export async function apiFetch(path, { method = "GET", body, headers = {}, token, signal } = {}) {
  const url = path.startsWith("http") ? path : `${API_BASE_URL}${path}`;
  const opts = { method, headers: { ...headers }, signal };

  if (body !== undefined && body !== null) {
    if (body instanceof FormData) {
      opts.body = body; // let the browser set the multipart boundary
    } else {
      opts.body = JSON.stringify(body);
      opts.headers["Content-Type"] = opts.headers["Content-Type"] || "application/json";
    }
  }
  if (token) opts.headers.Authorization = `Bearer ${token}`;

  let res;
  try {
    res = await fetch(url, opts);
  } catch {
    throw new ApiError(
      "Unable to reach the server. Check your internet connection and try again.",
      { status: 0 }
    );
  }

  if (res.status === 401) {
    redirectToLogin();
    throw new ApiError("Your session has expired. Please log in again.", { status: 401 });
  }

  // Parse the body once (JSON when possible, else raw text).
  let data = null;
  const raw = await res.text();
  if (raw) {
    try {
      data = JSON.parse(raw);
    } catch {
      data = raw;
    }
  }

  if (!res.ok) {
    throw new ApiError(messageForStatus(res.status, data), { status: res.status, data });
  }
  return data;
}

/** Consistent user-facing string for any thrown error (ApiError or otherwise). */
export function getErrorMessage(err, fallback = "Something went wrong. Please try again.") {
  if (err instanceof ApiError) return err.message;
  if (err && err.message && err.message !== "Failed to fetch") return err.message;
  return fallback;
}

/**
 * Legacy helper kept for backward compatibility. Prefer apiFetch.
 * Returns the raw Response; handles 401 the same way as apiFetch.
 */
export async function authFetch(url, options = {}, token) {
  const res = await fetch(url, {
    ...options,
    headers: { ...(options.headers || {}), Authorization: `Bearer ${token}` },
  });
  if (res.status === 401) {
    redirectToLogin();
    throw new ApiError("Your session has expired. Please log in again.", { status: 401 });
  }
  return res;
}
