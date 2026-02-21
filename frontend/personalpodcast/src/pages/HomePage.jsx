import React, { useEffect, useMemo, useState } from "react";

/**
 * AdminDashboard.jsx
 * - Episodes CRUD (multipart/form-data)
 * - Users CRUD (JSON)
 * - Tabs + Search + Client-side Pagination
 * - Improved Bootstrap-based UI
 */

const API_BASE = "https://localhost:7261";
const ADMIN_BASE = `${API_BASE}/api/Admin`;
const EPISODES_URL = `${ADMIN_BASE}/episodes`;
const USERS_URL = `${ADMIN_BASE}/users`;

const emptyCreateEpisode = {
  title: "",
  description: "",
  category: "",
  season: "",
  isPublished: true,
  file: null,
};

const emptyEditEpisode = {
  title: "",
  description: "",
  category: "",
  season: "",
  isPublished: true,
  file: null,
};

const emptyCreateUser = {
  username: "",
  firstName: "",
  lastName: "",
  age: "",
  email: "",
  role: "User",
  password: "",
};

const emptyEditUser = {
  username: "",
  firstName: "",
  lastName: "",
  age: "",
  email: "",
  role: "User",
  password: "", // optional on edit
};

function formatDate(d) {
  if (!d) return "—";
  const x = new Date(d);
  if (Number.isNaN(x.getTime())) return "—";
  return x.toLocaleString();
}

function secondsToMinSec(seconds) {
  const s = Number(seconds);
  if (!Number.isFinite(s) || s <= 0) return "—";
  const m = Math.floor(s / 60);
  const r = s % 60;
  return m > 0 ? `${m}m ${r}s` : `${r}s`;
}

async function fetchJsonOrTextError(res) {
  if (res.ok) return { ok: true, data: await res.json().catch(() => null) };
  const txt = await res.text().catch(() => "");
  return { ok: false, error: txt || `Request failed (${res.status})` };
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function paginate(items, page, pageSize) {
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = clamp(page, 1, totalPages);
  const start = (safePage - 1) * pageSize;
  const end = start + pageSize;
  return {
    total,
    totalPages,
    page: safePage,
    pageItems: items.slice(start, end),
  };
}

export default function AdminDashboard() {
  const [tab, setTab] = useState("episodes"); // "episodes" | "users"

  // global messages
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Episodes state
  const [episodes, setEpisodes] = useState([]);
  const [episodesLoading, setEpisodesLoading] = useState(false);
  const [episodeQuery, setEpisodeQuery] = useState("");
  const [episodesPage, setEpisodesPage] = useState(1);
  const [episodesPageSize, setEpisodesPageSize] = useState(8);

  const [showCreateEpisode, setShowCreateEpisode] = useState(false);
  const [showEditEpisode, setShowEditEpisode] = useState(false);
  const [createEpisodeForm, setCreateEpisodeForm] = useState({ ...emptyCreateEpisode });
  const [editEpisodeId, setEditEpisodeId] = useState(null);
  const [editEpisodeForm, setEditEpisodeForm] = useState({ ...emptyEditEpisode });

  // Users state
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [userQuery, setUserQuery] = useState("");
  const [usersPage, setUsersPage] = useState(1);
  const [usersPageSize, setUsersPageSize] = useState(8);

  const [showCreateUser, setShowCreateUser] = useState(false);
  const [showEditUser, setShowEditUser] = useState(false);
  const [createUserForm, setCreateUserForm] = useState({ ...emptyCreateUser });
  const [editUserId, setEditUserId] = useState(null);
  const [editUserForm, setEditUserForm] = useState({ ...emptyEditUser });

  function resetMessages() {
    setErrorMsg("");
    setSuccessMsg("");
  }

  // -----------------------
  // LOAD EPISODES
  // -----------------------
  async function loadEpisodes() {
    setEpisodesLoading(true);
    resetMessages();
    try {
      const res = await fetch(EPISODES_URL, { method: "GET", credentials: "include" });
      const out = await fetchJsonOrTextError(res);
      if (!out.ok) throw new Error(out.error);
      setEpisodes(Array.isArray(out.data) ? out.data : []);
    } catch (e) {
      setErrorMsg(e?.message || "Failed to load episodes.");
    } finally {
      setEpisodesLoading(false);
    }
  }

  // -----------------------
  // LOAD USERS
  // -----------------------
  async function loadUsers() {
    setUsersLoading(true);
    resetMessages();
    try {
      const res = await fetch(USERS_URL, { method: "GET", credentials: "include" });
      const out = await fetchJsonOrTextError(res);
      if (!out.ok) throw new Error(out.error);
      setUsers(Array.isArray(out.data) ? out.data : []);
    } catch (e) {
      setErrorMsg(e?.message || "Failed to load users.");
    } finally {
      setUsersLoading(false);
    }
  }

  useEffect(() => {
    loadEpisodes();
  }, []);

  useEffect(() => {
    // load users only when opening users tab first time
    if (tab === "users" && users.length === 0) loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  // -----------------------
  // FILTERING
  // -----------------------
  const filteredEpisodes = useMemo(() => {
    const q = episodeQuery.trim().toLowerCase();
    const list = Array.isArray(episodes) ? episodes : [];
    if (!q) return list;

    return list.filter((e) => {
      const title = (e?.title || "").toLowerCase();
      const desc = (e?.description || "").toLowerCase();
      const cat = (e?.category || "").toLowerCase();
      return title.includes(q) || desc.includes(q) || cat.includes(q);
    });
  }, [episodes, episodeQuery]);

  const filteredUsers = useMemo(() => {
    const q = userQuery.trim().toLowerCase();
    const list = Array.isArray(users) ? users : [];
    if (!q) return list;

    return list.filter((u) => {
      const username = (u?.username || "").toLowerCase();
      const email = (u?.email || "").toLowerCase();
      const name = `${u?.firstName || ""} ${u?.lastName || ""}`.toLowerCase();
      const role = (u?.role || "").toLowerCase();
      return username.includes(q) || email.includes(q) || name.includes(q) || role.includes(q);
    });
  }, [users, userQuery]);

  // Pagination results
  const episodesPaging = useMemo(() => paginate(filteredEpisodes, episodesPage, episodesPageSize), [
    filteredEpisodes,
    episodesPage,
    episodesPageSize,
  ]);

  const usersPaging = useMemo(() => paginate(filteredUsers, usersPage, usersPageSize), [
    filteredUsers,
    usersPage,
    usersPageSize,
  ]);

  // If filtering reduces pages, clamp page
  useEffect(() => {
    if (episodesPage !== episodesPaging.page) setEpisodesPage(episodesPaging.page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [episodesPaging.page]);

  useEffect(() => {
    if (usersPage !== usersPaging.page) setUsersPage(usersPaging.page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usersPaging.page]);

  // -----------------------
  // MODALS OPEN/CLOSE
  // -----------------------
  function closeModals() {
    setShowCreateEpisode(false);
    setShowEditEpisode(false);
    setEditEpisodeId(null);

    setShowCreateUser(false);
    setShowEditUser(false);
    setEditUserId(null);
  }

  function openCreateEpisode() {
    resetMessages();
    setCreateEpisodeForm({ ...emptyCreateEpisode });
    setShowCreateEpisode(true);
  }

  function openEditEpisode(ep) {
    resetMessages();
    setEditEpisodeId(ep.id);
    setEditEpisodeForm({
      title: ep.title || "",
      description: ep.description || "",
      category: ep.category || "",
      season: ep.season === null || ep.season === undefined ? "" : String(ep.season),
      isPublished: !!ep.isPublished,
      file: null,
    });
    setShowEditEpisode(true);
  }

  function openCreateUser() {
    resetMessages();
    setCreateUserForm({ ...emptyCreateUser });
    setShowCreateUser(true);
  }

  function openEditUser(u) {
    resetMessages();
    setEditUserId(u.id);
    setEditUserForm({
      username: u.username || "",
      firstName: u.firstName || "",
      lastName: u.lastName || "",
      age: u.age === null || u.age === undefined ? "" : String(u.age),
      email: u.email || "",
      role: u.role || "User",
      password: "", // optional
    });
    setShowEditUser(true);
  }

  // -----------------------
  // EPISODES CRUD
  // -----------------------
  function buildEpisodeFormData(form, requireFile) {
    const fd = new FormData();
    fd.append("title", form.title ?? "");
    fd.append("description", form.description ?? "");
    fd.append("category", form.category ?? "");

    if (form.season !== "" && form.season !== null && form.season !== undefined) {
      fd.append("season", String(form.season));
    }

    fd.append("isPublished", String(!!form.isPublished));

    if (form.file) {
      fd.append("file", form.file);
    } else if (requireFile) {
      throw new Error("Audio file is required.");
    }

    return fd;
  }

  async function handleCreateEpisodeSubmit(e) {
    e.preventDefault();
    resetMessages();
    try {
      if (!createEpisodeForm.title.trim()) throw new Error("Title is required.");
      if (!createEpisodeForm.file) throw new Error("Audio file is required.");

      const fd = buildEpisodeFormData(createEpisodeForm, true);

      const res = await fetch(EPISODES_URL, {
        method: "POST",
        body: fd,
        credentials: "include",
      });

      const out = await fetchJsonOrTextError(res);
      if (!out.ok) throw new Error(out.error);

      setSuccessMsg("Episode created.");
      setShowCreateEpisode(false);
      setEpisodesPage(1);
      await loadEpisodes();
    } catch (err) {
      setErrorMsg(err?.message || "Create failed.");
    }
  }

  async function handleEditEpisodeSubmit(e) {
    e.preventDefault();
    resetMessages();
    try {
      if (!editEpisodeId) throw new Error("Missing episode id.");
      if (!editEpisodeForm.title.trim()) throw new Error("Title is required.");

      const fd = buildEpisodeFormData(editEpisodeForm, false);

      const res = await fetch(`${EPISODES_URL}/${editEpisodeId}`, {
        method: "PUT",
        body: fd,
        credentials: "include",
      });

      const out = await fetchJsonOrTextError(res);
      if (!out.ok) throw new Error(out.error);

      setSuccessMsg("Episode updated.");
      setShowEditEpisode(false);
      setEditEpisodeId(null);
      await loadEpisodes();
    } catch (err) {
      setErrorMsg(err?.message || "Update failed.");
    }
  }

  async function handleDeleteEpisode(id) {
    resetMessages();
    const ok = window.confirm("Delete this episode? This cannot be undone.");
    if (!ok) return;

    try {
      const res = await fetch(`${EPISODES_URL}/${id}`, { method: "DELETE", credentials: "include" });

      if (!res.ok && res.status !== 204) {
        const txt = await res.text().catch(() => "");
        throw new Error(txt || `Delete failed (${res.status})`);
      }

      setSuccessMsg("Episode deleted.");
      await loadEpisodes();
    } catch (err) {
      setErrorMsg(err?.message || "Delete failed.");
    }
  }

  // -----------------------
  // USERS CRUD
  // -----------------------
  function normalizeUserPayload(form, requirePassword) {
    const payload = {
      username: (form.username || "").trim(),
      firstName: (form.firstName || "").trim(),
      lastName: (form.lastName || "").trim(),
      role: (form.role || "User").trim(),
      email: (form.email || "").trim() || null,
      age: form.age === "" || form.age === null || form.age === undefined ? null : Number(form.age),
    };

    if (!payload.username) throw new Error("Username is required.");
    if (payload.age !== null && !Number.isFinite(payload.age)) throw new Error("Age must be a number.");

    if (requirePassword) {
      if (!form.password) throw new Error("Password is required.");
      payload.password = form.password;
    } else {
      // optional password change
      if (form.password && form.password.trim()) payload.password = form.password;
    }

    return payload;
  }

  async function handleCreateUserSubmit(e) {
    e.preventDefault();
    resetMessages();
    try {
      const body = normalizeUserPayload(createUserForm, true);

      const res = await fetch(USERS_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        credentials: "include",
      });

      const out = await fetchJsonOrTextError(res);
      if (!out.ok) throw new Error(out.error);

      setSuccessMsg("User created.");
      setShowCreateUser(false);
      setUsersPage(1);
      await loadUsers();
    } catch (err) {
      setErrorMsg(err?.message || "Create user failed.");
    }
  }

  async function handleEditUserSubmit(e) {
    e.preventDefault();
    resetMessages();
    try {
      if (!editUserId) throw new Error("Missing user id.");
      const body = normalizeUserPayload(editUserForm, false);

      const res = await fetch(`${USERS_URL}/${editUserId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        credentials: "include",
      });

      const out = await fetchJsonOrTextError(res);
      if (!out.ok) throw new Error(out.error);

      setSuccessMsg("User updated.");
      setShowEditUser(false);
      setEditUserId(null);
      await loadUsers();
    } catch (err) {
      setErrorMsg(err?.message || "Update user failed.");
    }
  }

  async function handleDeleteUser(id) {
    resetMessages();
    const ok = window.confirm("Delete this user? This cannot be undone.");
    if (!ok) return;

    try {
      const res = await fetch(`${USERS_URL}/${id}`, { method: "DELETE", credentials: "include" });

      if (!res.ok && res.status !== 204) {
        const txt = await res.text().catch(() => "");
        throw new Error(txt || `Delete failed (${res.status})`);
      }

      setSuccessMsg("User deleted.");
      await loadUsers();
    } catch (err) {
      setErrorMsg(err?.message || "Delete user failed.");
    }
  }

  // -----------------------
  // UI helpers
  // -----------------------
  const title = tab === "episodes" ? "Episodes" : "Users";
  const isEpisodes = tab === "episodes";
  const loading = isEpisodes ? episodesLoading : usersLoading;

  return (
    <div className="pp-admin-root">
      <style>{`
        .pp-admin-root{
          min-height: 100vh;
          background: radial-gradient(1000px 700px at 20% -10%, rgba(99,102,241,.35), transparent 60%),
                      radial-gradient(900px 600px at 90% 0%, rgba(16,185,129,.25), transparent 55%),
                      #0b1020;
          color: rgba(255,255,255,.92);
        }
        .pp-shell{ max-width: 1200px; }
        .pp-card{
          background: rgba(255,255,255,.06);
          border: 1px solid rgba(255,255,255,.10);
          box-shadow: 0 18px 55px rgba(0,0,0,.35);
          backdrop-filter: blur(14px);
          border-radius: 16px;
        }
        .pp-muted{ color: rgba(255,255,255,.70); }
        .pp-table thead th{
          color: rgba(255,255,255,.85);
          background: rgba(255,255,255,.06) !important;
          border-bottom: 1px solid rgba(255,255,255,.10) !important;
        }
        .pp-table td{
          border-top: 1px solid rgba(255,255,255,.08);
          color: rgba(255,255,255,.88);
          vertical-align: middle;
        }
        .pp-table tr:hover td{
          background: rgba(255,255,255,.04);
        }
        .pp-pill{
          border-radius: 999px !important;
          border: 1px solid rgba(255,255,255,.14) !important;
          background: rgba(255,255,255,.07) !important;
          color: rgba(255,255,255,.92) !important;
          font-weight: 800;
        }
        .pp-pill.active{
          background: rgba(99,102,241,.25) !important;
          border-color: rgba(99,102,241,.50) !important;
        }
        .pp-btn{
          border-radius: 12px;
          font-weight: 800;
        }
        .pp-input, .pp-select{
          background: rgba(255,255,255,.07) !important;
          border: 1px solid rgba(255,255,255,.12) !important;
          color: rgba(255,255,255,.92) !important;
          border-radius: 12px !important;
        }
        .pp-input::placeholder{ color: rgba(255,255,255,.55) !important; }
        .pp-badge{
          border-radius: 999px;
          padding: 6px 10px;
          font-weight: 900;
          border: 1px solid rgba(255,255,255,.12);
          background: rgba(255,255,255,.07);
        }
        .pp-badge-success{ background: rgba(16,185,129,.20); border-color: rgba(16,185,129,.35); }
        .pp-badge-secondary{ background: rgba(148,163,184,.16); border-color: rgba(148,163,184,.28); }
        .pp-badge-danger{ background: rgba(239,68,68,.18); border-color: rgba(239,68,68,.32); }
        audio{ width: 100%; border-radius: 12px; }
        .pp-actions button{ min-width: 86px; }
      `}</style>

      <div className="container pp-shell py-4">
        {/* Header */}
        <div className="d-flex flex-wrap align-items-end justify-content-between gap-3 mb-3">
          <div>
            <div className="d-flex align-items-center gap-2">
              <div
                className="pp-badge"
                style={{
                  background: "rgba(255,255,255,.08)",
                  borderColor: "rgba(255,255,255,.14)",
                }}
              >
                Admin
              </div>
              <h2 className="mb-0" style={{ fontWeight: 900, letterSpacing: -0.4 }}>
                Dashboard
              </h2>
            </div>
            <div className="pp-muted mt-1">
              Manage <strong>episodes</strong> and <strong>users</strong> from one place.
            </div>
          </div>

          <div className="d-flex flex-wrap gap-2">
            <button
              className="btn btn-outline-light pp-btn"
              onClick={() => (isEpisodes ? loadEpisodes() : loadUsers())}
              disabled={loading}
            >
              {loading ? "Refreshing..." : "Refresh"}
            </button>

            {isEpisodes ? (
              <button className="btn btn-primary pp-btn" onClick={openCreateEpisode}>
                + Create Episode
              </button>
            ) : (
              <button className="btn btn-primary pp-btn" onClick={openCreateUser}>
                + Create User
              </button>
            )}
          </div>
        </div>

        {/* Alerts */}
        {errorMsg ? <div className="alert alert-danger pp-card p-3">{errorMsg}</div> : null}
        {successMsg ? <div className="alert alert-success pp-card p-3">{successMsg}</div> : null}

        {/* Tabs */}
        <div className="pp-card p-3 mb-3">
          <div className="d-flex flex-wrap gap-2 align-items-center justify-content-between">
            <div className="btn-group" role="group" aria-label="Tabs">
              <button
                className={`btn pp-pill ${tab === "episodes" ? "active" : ""}`}
                onClick={() => setTab("episodes")}
                type="button"
              >
                Episodes
              </button>
              <button
                className={`btn pp-pill ${tab === "users" ? "active" : ""}`}
                onClick={() => setTab("users")}
                type="button"
              >
                Users
              </button>
            </div>

            <div className="pp-muted small">
              Viewing: <strong>{title}</strong>
            </div>
          </div>
        </div>

        {/* Search + pagination controls */}
        <div className="pp-card p-3 mb-3">
          <div className="row g-2 align-items-center">
            <div className="col-12 col-lg-7">
              {isEpisodes ? (
                <input
                  className="form-control pp-input"
                  placeholder="Search episodes by title, description, category..."
                  value={episodeQuery}
                  onChange={(e) => {
                    setEpisodeQuery(e.target.value);
                    setEpisodesPage(1);
                  }}
                />
              ) : (
                <input
                  className="form-control pp-input"
                  placeholder="Search users by username, name, email, role..."
                  value={userQuery}
                  onChange={(e) => {
                    setUserQuery(e.target.value);
                    setUsersPage(1);
                  }}
                />
              )}
            </div>

            <div className="col-6 col-lg-2">
              <select
                className="form-select pp-select"
                value={isEpisodes ? episodesPageSize : usersPageSize}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  if (isEpisodes) {
                    setEpisodesPageSize(v);
                    setEpisodesPage(1);
                  } else {
                    setUsersPageSize(v);
                    setUsersPage(1);
                  }
                }}
              >
                <option value={6}>6 / page</option>
                <option value={8}>8 / page</option>
                <option value={12}>12 / page</option>
                <option value={20}>20 / page</option>
              </select>
            </div>

            <div className="col-6 col-lg-3 text-lg-end">
              {isEpisodes ? (
                <div className="pp-muted">
                  Showing <strong>{episodesPaging.pageItems.length}</strong> / {episodesPaging.total} (page{" "}
                  {episodesPaging.page}/{episodesPaging.totalPages})
                </div>
              ) : (
                <div className="pp-muted">
                  Showing <strong>{usersPaging.pageItems.length}</strong> / {usersPaging.total} (page {usersPaging.page}/
                  {usersPaging.totalPages})
                </div>
              )}
            </div>
          </div>

          {/* Pagination buttons */}
          <div className="d-flex flex-wrap gap-2 justify-content-end mt-3">
            <button
              className="btn btn-outline-light pp-btn"
              disabled={(isEpisodes ? episodesPaging.page : usersPaging.page) <= 1}
              onClick={() => {
                if (isEpisodes) setEpisodesPage((p) => Math.max(1, p - 1));
                else setUsersPage((p) => Math.max(1, p - 1));
              }}
            >
              ← Prev
            </button>

            <button
              className="btn btn-outline-light pp-btn"
              disabled={(isEpisodes ? episodesPaging.page : usersPaging.page) >= (isEpisodes ? episodesPaging.totalPages : usersPaging.totalPages)}
              onClick={() => {
                if (isEpisodes) setEpisodesPage((p) => p + 1);
                else setUsersPage((p) => p + 1);
              }}
            >
              Next →
            </button>
          </div>
        </div>

        {/* CONTENT */}
        {tab === "episodes" ? (
          <div className="pp-card">
            <div className="table-responsive">
              <table className="table table-hover mb-0 pp-table">
                <thead>
                  <tr>
                    <th style={{ width: 70 }}>ID</th>
                    <th>Episode</th>
                    <th style={{ width: 120 }}>Status</th>
                    <th style={{ width: 140 }}>Category</th>
                    <th style={{ width: 90 }}>Season</th>
                    <th style={{ width: 120 }}>Duration</th>
                    <th style={{ width: 190 }}>Published</th>
                    <th style={{ width: 90 }}>Plays</th>
                    <th style={{ width: 220 }} className="text-end">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {episodesLoading ? (
                    <tr>
                      <td colSpan={9} className="text-center pp-muted py-4">
                        Loading episodes...
                      </td>
                    </tr>
                  ) : episodesPaging.total === 0 ? (
                    <tr>
                      <td colSpan={9} className="text-center pp-muted py-4">
                        No episodes found.
                      </td>
                    </tr>
                  ) : (
                    episodesPaging.pageItems.map((e) => (
                      <tr key={e.id}>
                        <td className="pp-muted">{e.id}</td>

                        <td>
                          <div style={{ fontWeight: 900 }}>{e.title}</div>
                          <div className="pp-muted small text-truncate" style={{ maxWidth: 680 }}>
                            {e.description || "—"}
                          </div>
                          {e.audioUrl ? <audio className="mt-2" controls preload="none" src={e.audioUrl} /> : null}
                        </td>

                        <td>
                          {e.isPublished ? (
                            <span className="pp-badge pp-badge-success">Published</span>
                          ) : (
                            <span className="pp-badge pp-badge-secondary">Draft</span>
                          )}
                        </td>

                        <td>{e.category || "—"}</td>
                        <td>{e.season ?? "—"}</td>
                        <td>{secondsToMinSec(e.durationSeconds)}</td>
                        <td>{formatDate(e.publishedDate)}</td>
                        <td>{e.playCount ?? 0}</td>

                        <td className="text-end pp-actions">
                          <button className="btn btn-outline-light pp-btn me-2" onClick={() => openEditEpisode(e)}>
                            Edit
                          </button>
                          <button className="btn btn-outline-danger pp-btn" onClick={() => handleDeleteEpisode(e.id)}>
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="pp-card">
            <div className="table-responsive">
              <table className="table table-hover mb-0 pp-table">
                <thead>
                  <tr>
                    <th style={{ width: 70 }}>ID</th>
                    <th>User</th>
                    <th style={{ width: 90 }}>Age</th>
                    <th style={{ width: 260 }}>Email</th>
                    <th style={{ width: 120 }}>Role</th>
                    <th style={{ width: 220 }} className="text-end">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {usersLoading ? (
                    <tr>
                      <td colSpan={6} className="text-center pp-muted py-4">
                        Loading users...
                      </td>
                    </tr>
                  ) : usersPaging.total === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center pp-muted py-4">
                        No users found.
                      </td>
                    </tr>
                  ) : (
                    usersPaging.pageItems.map((u) => (
                      <tr key={u.id}>
                        <td className="pp-muted">{u.id}</td>
                        <td>
                          <div style={{ fontWeight: 900 }}>{u.username}</div>
                          <div className="pp-muted small">
                            {(u.firstName || "—") + " " + (u.lastName || "")}
                          </div>
                        </td>
                        <td>{u.age ?? "—"}</td>
                        <td className="text-truncate" style={{ maxWidth: 260 }}>
                          {u.email || "—"}
                        </td>
                        <td>
                          {String(u.role).toLowerCase() === "admin" ? (
                            <span className="pp-badge pp-badge-danger">Admin</span>
                          ) : (
                            <span className="pp-badge pp-badge-secondary">User</span>
                          )}
                        </td>
                        <td className="text-end pp-actions">
                          <button className="btn btn-outline-light pp-btn me-2" onClick={() => openEditUser(u)}>
                            Edit
                          </button>
                          <button className="btn btn-outline-danger pp-btn" onClick={() => handleDeleteUser(u.id)}>
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Modals */}
        {showCreateEpisode ? (
          <Modal title="Create Episode" onClose={closeModals}>
            <EpisodeForm
              form={createEpisodeForm}
              setForm={setCreateEpisodeForm}
              onSubmit={handleCreateEpisodeSubmit}
              submitLabel="Create"
              requireFile={true}
            />
          </Modal>
        ) : null}

        {showEditEpisode ? (
          <Modal title={`Edit Episode #${editEpisodeId}`} onClose={closeModals}>
            <EpisodeForm
              form={editEpisodeForm}
              setForm={setEditEpisodeForm}
              onSubmit={handleEditEpisodeSubmit}
              submitLabel="Save changes"
              requireFile={false}
            />
            <div className="alert alert-info mt-3 mb-0">
              Uploading a new file will replace the current <code>AudioUrl</code>.
            </div>
          </Modal>
        ) : null}

        {showCreateUser ? (
          <Modal title="Create User" onClose={closeModals}>
            <UserForm
              form={createUserForm}
              setForm={setCreateUserForm}
              onSubmit={handleCreateUserSubmit}
              submitLabel="Create user"
              requirePassword={true}
            />
          </Modal>
        ) : null}

        {showEditUser ? (
          <Modal title={`Edit User #${editUserId}`} onClose={closeModals}>
            <UserForm
              form={editUserForm}
              setForm={setEditUserForm}
              onSubmit={handleEditUserSubmit}
              submitLabel="Save changes"
              requirePassword={false}
            />
            <div className="alert alert-info mt-3 mb-0">
              Leave password empty to keep the current password.
            </div>
          </Modal>
        ) : null}

        <div className="pp-muted small mt-4 text-center">
          API: <code>{ADMIN_BASE}</code>
        </div>
      </div>
    </div>
  );
}

function EpisodeForm({ form, setForm, onSubmit, submitLabel, requireFile }) {
  return (
    <form onSubmit={onSubmit}>
      <div className="row g-3">
        <div className="col-12">
          <label className="form-label">Title</label>
          <input
            className="form-control"
            value={form.title}
            onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
            placeholder="Episode title"
          />
        </div>

        <div className="col-12">
          <label className="form-label">Description</label>
          <textarea
            className="form-control"
            rows={3}
            value={form.description}
            onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
            placeholder="Description (optional)"
          />
        </div>

        <div className="col-md-6">
          <label className="form-label">Category</label>
          <input
            className="form-control"
            value={form.category}
            onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
            placeholder="e.g. Tech, Business"
          />
        </div>

        <div className="col-md-6">
          <label className="form-label">Season (optional)</label>
          <input
            className="form-control"
            type="number"
            min="1"
            value={form.season}
            onChange={(e) => setForm((p) => ({ ...p, season: e.target.value }))}
            placeholder="e.g. 1"
          />
        </div>

        <div className="col-md-6">
          <label className="form-label d-block">Published</label>
          <div className="form-check form-switch">
            <input
              className="form-check-input"
              type="checkbox"
              checked={!!form.isPublished}
              onChange={(e) => setForm((p) => ({ ...p, isPublished: e.target.checked }))}
              id="publishedSwitch"
            />
            <label className="form-check-label" htmlFor="publishedSwitch">
              {form.isPublished ? "Published" : "Draft"}
            </label>
          </div>
        </div>

        <div className="col-12">
          <label className="form-label">
            Audio file{" "}
            {requireFile ? <span className="text-danger">*</span> : <span className="text-muted">(optional)</span>}
          </label>
          <input
            className="form-control"
            type="file"
            accept="audio/*"
            onChange={(e) => setForm((p) => ({ ...p, file: e.target.files?.[0] || null }))}
          />
          <div className="form-text">
            Form key is <code>file</code> (matches backend <code>IFormFile file</code>).
          </div>
        </div>

        <div className="col-12 d-flex justify-content-end gap-2 mt-2">
          <button type="submit" className="btn btn-primary" style={{ borderRadius: 12, fontWeight: 900 }}>
            {submitLabel}
          </button>
        </div>
      </div>
    </form>
  );
}

function UserForm({ form, setForm, onSubmit, submitLabel, requirePassword }) {
  return (
    <form onSubmit={onSubmit}>
      <div className="row g-3">
        <div className="col-md-6">
          <label className="form-label">Username</label>
          <input
            className="form-control"
            value={form.username}
            onChange={(e) => setForm((p) => ({ ...p, username: e.target.value }))}
          />
        </div>

        <div className="col-md-6">
          <label className="form-label">Role</label>
          <select
            className="form-select"
            value={form.role}
            onChange={(e) => setForm((p) => ({ ...p, role: e.target.value }))}
          >
            <option value="User">User</option>
            <option value="Admin">Admin</option>
          </select>
        </div>

        <div className="col-md-6">
          <label className="form-label">First name</label>
          <input
            className="form-control"
            value={form.firstName}
            onChange={(e) => setForm((p) => ({ ...p, firstName: e.target.value }))}
          />
        </div>

        <div className="col-md-6">
          <label className="form-label">Last name</label>
          <input
            className="form-control"
            value={form.lastName}
            onChange={(e) => setForm((p) => ({ ...p, lastName: e.target.value }))}
          />
        </div>

        <div className="col-md-6">
          <label className="form-label">Email (optional)</label>
          <input
            className="form-control"
            value={form.email}
            onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
            placeholder="user@mail.com"
          />
        </div>

        <div className="col-md-6">
          <label className="form-label">Age (optional)</label>
          <input
            className="form-control"
            type="number"
            min="0"
            value={form.age}
            onChange={(e) => setForm((p) => ({ ...p, age: e.target.value }))}
          />
        </div>

        <div className="col-12">
          <label className="form-label">
            Password{" "}
            {requirePassword ? <span className="text-danger">*</span> : <span className="text-muted">(optional)</span>}
          </label>
          <input
            className="form-control"
            type="password"
            value={form.password}
            onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
            placeholder={requirePassword ? "Set a password" : "Leave empty to keep current"}
          />
        </div>

        <div className="col-12 d-flex justify-content-end gap-2 mt-2">
          <button type="submit" className="btn btn-primary" style={{ borderRadius: 12, fontWeight: 900 }}>
            {submitLabel}
          </button>
        </div>
      </div>
    </form>
  );
}

function Modal({ title, onClose, children }) {
  return (
    <>
      <div className="modal fade show" style={{ display: "block" }} role="dialog" aria-modal="true">
        <div className="modal-dialog modal-lg modal-dialog-centered">
          <div className="modal-content" style={{ borderRadius: 16, overflow: "hidden" }}>
            <div className="modal-header">
              <h5 className="modal-title" style={{ fontWeight: 900 }}>
                {title}
              </h5>
              <button type="button" className="btn-close" onClick={onClose} aria-label="Close"></button>
            </div>
            <div className="modal-body">{children}</div>
          </div>
        </div>
      </div>

      <div className="modal-backdrop fade show" onClick={onClose}></div>
    </>
  );
}