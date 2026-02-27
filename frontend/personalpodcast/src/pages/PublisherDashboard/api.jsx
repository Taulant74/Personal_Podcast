import { API_BASE as BASE } from "../../config/api";

const API_BASE = BASE;
const PUB_URL = `${API_BASE}/api/publisher`;
const PUB_EPISODES_URL = `${PUB_URL}/episodes`;
const CATEGORIES_URL = `${API_BASE}/api/categories`;

const getToken = () => localStorage.getItem("accessToken");
const authHeaders = (extra = {}) => {
  const t = getToken();
  return t ? { ...extra, Authorization: `Bearer ${t}` } : extra;
};

async function fetchJsonOrTextError(res) {
  if (res.ok) return { ok: true, data: await res.json().catch(() => null) };
  const txt = await res.text().catch(() => "");
  return { ok: false, error: txt || `Request failed (${res.status})` };
}

export async function apiLoadPublisherEpisodes() {
  const res = await fetch(PUB_EPISODES_URL, {
    method: "GET",
    headers: authHeaders(),
    credentials: "include",
  });
  const out = await fetchJsonOrTextError(res);
  if (!out.ok) throw new Error(out.error);
  return Array.isArray(out.data) ? out.data : [];
}

export async function apiLoadCategories() {
  const res = await fetch(CATEGORIES_URL, {
    method: "GET",
    headers: authHeaders(),
    credentials: "include",
  });
  const out = await fetchJsonOrTextError(res);
  if (!out.ok) throw new Error(out.error);
  return Array.isArray(out.data) ? out.data : [];
}

function buildFormData(form, requireFile, categoryIds) {
  const fd = new FormData();
  fd.append("title", form.title ?? "");
  fd.append("description", form.description ?? "");
  fd.append("categoryIds", (categoryIds ?? []).join(","));

  if (form.season !== "" && form.season != null) fd.append("season", String(form.season));
  fd.append("isPublished", String(!!form.isPublished));

  fd.append("isPremium", String(!!form.isPremium)); 
  if (form.file) fd.append("file", form.file);
  else if (requireFile) throw new Error("Audio file is required.");

  return fd;
}

export async function apiCreatePublisherEpisode(form, categoryIds) {
  const fd = buildFormData(form, true, categoryIds);

  const res = await fetch(PUB_EPISODES_URL, {
    method: "POST",
    headers: authHeaders(),
    body: fd,
    credentials: "include",
  });

  const out = await fetchJsonOrTextError(res);
  if (!out.ok) throw new Error(out.error);
  return out.data;
}

export async function apiUpdatePublisherEpisode(id, form, categoryIds) {
  const fd = buildFormData(form, false, categoryIds);

  const res = await fetch(`${PUB_EPISODES_URL}/${id}`, {
    method: "PUT",
    headers: authHeaders(),
    body: fd,
    credentials: "include",
  });

  const out = await fetchJsonOrTextError(res);
  if (!out.ok) throw new Error(out.error);
  return out.data;
}

export async function apiDeletePublisherEpisode(id) {
  const res = await fetch(`${PUB_EPISODES_URL}/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
    credentials: "include",
  });

  if (!res.ok && res.status !== 204) {
    const txt = await res.text().catch(() => "");
    throw new Error(txt || `Delete failed (${res.status})`);
  }
}

/**
 * Publish / Unpublish without requiring a file:
 * Uses existing episode fields to update IsPublished.
 */
export async function apiSetPublishState(ep, publish) {
  const fd = new FormData();
  fd.append("title", ep.title ?? "");
  fd.append("description", ep.description ?? "");
  if (ep.season != null && ep.season !== "") fd.append("season", String(ep.season));
  fd.append("isPublished", String(!!publish));

  // optional categories if your backend expects them:
  // if you have ep.categoryIds etc, add them here if needed
  // fd.append("categoryIds", "1,2");

  const res = await fetch(`${PUB_EPISODES_URL}/${ep.id}`, {
    method: "PUT",
    headers: authHeaders(),
    body: fd,
    credentials: "include",
  });

  const out = await fetchJsonOrTextError(res);
  if (!out.ok) throw new Error(out.error);
  return out.data;
}