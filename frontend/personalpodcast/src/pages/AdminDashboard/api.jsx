

const API_BASE = "https://localhost:7261";
const ADMIN_URL = `${API_BASE}/api/Admin`;

export const ADMIN_EPISODES_URL = `${ADMIN_URL}/episodes`;
export const ADMIN_USERS_URL = `${ADMIN_URL}/users`;
export const CATEGORIES_URL = `${API_BASE}/api/categories`;

export function getToken() {
  return localStorage.getItem("accessToken");
}

export function authHeaders(extra = {}) {
  const t = getToken();
  return t ? { ...extra, Authorization: `Bearer ${t}` } : extra;
}

export async function fetchJsonOrTextError(res) {
  if (res.ok) return { ok: true, data: await res.json().catch(() => null) };
  const txt = await res.text().catch(() => "");
  return { ok: false, error: txt || `Request failed (${res.status})` };
}

export async function apiLoadCategories() {
  const res = await fetch(CATEGORIES_URL, { method: "GET", headers: authHeaders() });
  const out = await fetchJsonOrTextError(res);
  if (!out.ok) throw new Error(out.error);
  return Array.isArray(out.data) ? out.data : [];
}

export async function apiCreateCategory(name) {
  const res = await fetch(CATEGORIES_URL, {
    method: "POST",
    headers: authHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({ name }),
  });
  const out = await fetchJsonOrTextError(res);
  if (!out.ok) throw new Error(out.error);
  return out.data;
}

export function buildEpisodeFormData(form, requireFile, categoryIds) {
  const fd = new FormData();

  fd.append("title", form.title ?? "");
  fd.append("description", form.description ?? "");
  fd.append("categoryIds", (categoryIds ?? []).join(","));

  if (form.season !== "" && form.season !== null && form.season !== undefined) {
    fd.append("season", String(form.season));
  }

  fd.append("isPublished", String(!!form.isPublished));

  fd.append("IsPremium", String(!!form.isPremium));

  if (form.file) fd.append("file", form.file);
  else if (requireFile) throw new Error("Audio file is required.");

  return fd;
}

export async function apiLoadEpisodes() {
  const res = await fetch(ADMIN_EPISODES_URL, { method: "GET", headers: authHeaders() });
  const out = await fetchJsonOrTextError(res);
  if (!out.ok) throw new Error(out.error);
  return Array.isArray(out.data) ? out.data : [];
}

export async function apiCreateEpisode(form, categoryIds) {
  const fd = buildEpisodeFormData(form, true, categoryIds);
  const res = await fetch(ADMIN_EPISODES_URL, { method: "POST", headers: authHeaders(), body: fd });
  const out = await fetchJsonOrTextError(res);
  if (!out.ok) throw new Error(out.error);
  return out.data;
}

export async function apiUpdateEpisode(id, form, categoryIds) {
  const fd = buildEpisodeFormData(form, false, categoryIds);
  const res = await fetch(`${ADMIN_EPISODES_URL}/${id}`, { method: "PUT", headers: authHeaders(), body: fd });
  const out = await fetchJsonOrTextError(res);
  if (!out.ok) throw new Error(out.error);
  return out.data;
}

export async function apiDeleteEpisode(id) {
  const res = await fetch(`${ADMIN_EPISODES_URL}/${id}`, { method: "DELETE", headers: authHeaders() });
  if (!res.ok && res.status !== 204) {
    const txt = await res.text().catch(() => "");
    throw new Error(txt || `Delete failed (${res.status})`);
  }
}

export function normalizeUserPayload(form, includePassword) {
  const payload = {
    username: (form.username || "").trim(),
    firstName: (form.firstName || "").trim(),
    lastName: (form.lastName || "").trim(),
    role: (form.role || "User").trim(),
    email: (form.email || "").trim() || null,
    age: form.age === "" || form.age === null || form.age === undefined ? null : Number(form.age),
  };

  if (payload.age !== null && !Number.isFinite(payload.age)) {
    throw new Error("Age must be a number.");
  }

  if (includePassword) payload.password = form.password || "";
  else if (form.password?.trim()) payload.password = form.password;

  return payload;
}

export async function apiLoadUsers() {
  const res = await fetch(ADMIN_USERS_URL, { method: "GET", headers: authHeaders() });
  const out = await fetchJsonOrTextError(res);
  if (!out.ok) throw new Error(out.error);
  return Array.isArray(out.data) ? out.data : [];
}

export async function apiCreateUser(form) {
  const body = normalizeUserPayload(form, true);
  const res = await fetch(ADMIN_USERS_URL, {
    method: "POST",
    headers: authHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify(body),
  });
  const out = await fetchJsonOrTextError(res);
  if (!out.ok) throw new Error(out.error);
  return out.data;
}

export async function apiUpdateUser(id, form) {
  const body = normalizeUserPayload(form, false);
  const res = await fetch(`${ADMIN_USERS_URL}/${id}`, {
    method: "PUT",
    headers: authHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify(body),
  });
  const out = await fetchJsonOrTextError(res);
  if (!out.ok) throw new Error(out.error);
  return out.data;
}

export async function apiDeleteUser(id) {
  const res = await fetch(`${ADMIN_USERS_URL}/${id}`, { method: "DELETE", headers: authHeaders() });
  if (!res.ok && res.status !== 204) {
    const txt = await res.text().catch(() => "");
    throw new Error(txt || `Delete failed (${res.status})`);
  }
}