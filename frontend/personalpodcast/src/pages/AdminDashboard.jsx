import React, { useEffect, useMemo, useState } from "react";

const API_BASE = "";
const ADMIN_URL = `${API_BASE}/api/Admin`;
const ADMIN_EPISODES_URL = `${ADMIN_URL}/episodes`;
const ADMIN_USERS_URL = `${ADMIN_URL}/users`;

const emptyCreateEpisode = {
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

export default function AdminDashboard() {
  const [tab, setTab] = useState("episodes");

  // Episodes state
  const [episodes, setEpisodes] = useState([]);
  const [episodesLoading, setEpisodesLoading] = useState(false);
  const [episodeQuery, setEpisodeQuery] = useState("");

  const [showCreateEpisode, setShowCreateEpisode] = useState(false);
  const [showEditEpisode, setShowEditEpisode] = useState(false);
  const [createEpisodeForm, setCreateEpisodeForm] = useState({ ...emptyCreateEpisode });
  const [editEpisodeId, setEditEpisodeId] = useState(null);
  const [editEpisodeForm, setEditEpisodeForm] = useState({
    title: "",
    description: "",
    category: "",
    season: "",
    isPublished: true,
    file: null,
  });

  // Users state
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [userQuery, setUserQuery] = useState("");

  const [showCreateUser, setShowCreateUser] = useState(false);
  const [showEditUser, setShowEditUser] = useState(false);
  const [createUserForm, setCreateUserForm] = useState({ ...emptyCreateUser });
  const [editUserId, setEditUserId] = useState(null);
  const [editUserForm, setEditUserForm] = useState({
    username: "",
    firstName: "",
    lastName: "",
    age: "",
    email: "",
    role: "User",
    password: "", // optional on edit
  });

  // Shared messages
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  function resetMessages() {
    setErrorMsg("");
    setSuccessMsg("");
  }

  async function fetchJsonOrTextError(res) {
    if (res.ok) return { ok: true, data: await res.json().catch(() => null) };
    const txt = await res.text().catch(() => "");
    return { ok: false, error: txt || `Request failed (${res.status})` };
  }

  // -----------------------
  // EPISODES API
  // -----------------------
  async function loadEpisodes() {
    setEpisodesLoading(true);
    resetMessages();
    try {
      const res = await fetch(ADMIN_EPISODES_URL, { method: "GET" });
      const out = await fetchJsonOrTextError(res);
      if (!out.ok) throw new Error(out.error);
      setEpisodes(Array.isArray(out.data) ? out.data : []);
    } catch (e) {
      setErrorMsg(e?.message || "Failed to load episodes.");
    } finally {
      setEpisodesLoading(false);
    }
  }

  function openCreateEpisode() {
    resetMessages();
    setCreateEpisodeForm({ ...emptyCreateEpisode });
    setShowCreateEpisode(true);
  }

  function openEditEpisode(episode) {
    resetMessages();
    setEditEpisodeId(episode.id);
    setEditEpisodeForm({
      title: episode.title || "",
      description: episode.description || "",
      category: episode.category || "",
      season: episode.season === null || episode.season === undefined ? "" : String(episode.season),
      isPublished: !!episode.isPublished,
      file: null,
    });
    setShowEditEpisode(true);
  }

  function buildEpisodeFormData(form, requireFile) {
    const fd = new FormData();
    fd.append("title", form.title ?? "");
    fd.append("description", form.description ?? "");
    fd.append("category", form.category ?? "");

    if (form.season !== "" && form.season !== null && form.season !== undefined) {
      fd.append("season", String(form.season));
    }

    fd.append("isPublished", String(!!form.isPublished));

    if (form.file) fd.append("file", form.file);
    else if (requireFile) throw new Error("Audio file is required.");

    return fd;
  }

  async function handleCreateEpisodeSubmit(e) {
    e.preventDefault();
    resetMessages();

    try {
      if (!createEpisodeForm.title.trim()) throw new Error("Title is required.");
      if (!createEpisodeForm.file) throw new Error("Audio file is required.");

      const fd = buildEpisodeFormData(createEpisodeForm, true);

      const res = await fetch(ADMIN_EPISODES_URL, {
        method: "POST",
        body: fd,
      });

      const out = await fetchJsonOrTextError(res);
      if (!out.ok) throw new Error(out.error);

      setSuccessMsg("Episode created.");
      setShowCreateEpisode(false);
      await loadEpisodes();
    } catch (e2) {
      setErrorMsg(e2?.message || "Create failed.");
    }
  }

  async function handleEditEpisodeSubmit(e) {
    e.preventDefault();
    resetMessages();

    try {
      if (!editEpisodeId) throw new Error("Missing episode id.");
      if (!editEpisodeForm.title.trim()) throw new Error("Title is required.");

      const fd = buildEpisodeFormData(editEpisodeForm, false);

      const res = await fetch(`${ADMIN_EPISODES_URL}/${editEpisodeId}`, {
        method: "PUT",
        body: fd,
      });

      const out = await fetchJsonOrTextError(res);
      if (!out.ok) throw new Error(out.error);

      setSuccessMsg("Episode updated.");
      setShowEditEpisode(false);
      setEditEpisodeId(null);
      await loadEpisodes();
    } catch (e2) {
      setErrorMsg(e2?.message || "Update failed.");
    }
  }

  async function handleDeleteEpisode(id) {
    resetMessages();
    const ok = window.confirm("Delete this episode? This cannot be undone.");
    if (!ok) return;

    try {
      const res = await fetch(`${ADMIN_EPISODES_URL}/${id}`, { method: "DELETE" });
      if (!res.ok && res.status !== 204) {
        const txt = await res.text().catch(() => "");
        throw new Error(txt || `Delete failed (${res.status})`);
      }

      setSuccessMsg("Episode deleted.");
      await loadEpisodes();
    } catch (e) {
      setErrorMsg(e?.message || "Delete failed.");
    }
  }

  const filteredEpisodes = useMemo(() => {
    const q = episodeQuery.trim().toLowerCase();
    if (!q) return episodes;
    return episodes.filter((e) => (e?.title || "").toLowerCase().includes(q));
  }, [episodes, episodeQuery]);

  // -----------------------
  // USERS API
  // -----------------------
  async function loadUsers() {
    setUsersLoading(true);
    resetMessages();
    try {
      const res = await fetch(ADMIN_USERS_URL, { method: "GET" });
      const out = await fetchJsonOrTextError(res);
      if (!out.ok) throw new Error(out.error);
      setUsers(Array.isArray(out.data) ? out.data : []);
    } catch (e) {
      setErrorMsg(e?.message || "Failed to load users.");
    } finally {
      setUsersLoading(false);
    }
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
      password: "", // only if changing
    });
    setShowEditUser(true);
  }

  function normalizeUserPayload(form, includePassword) {
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

    if (includePassword) {
      payload.password = form.password || "";
    } else if (form.password?.trim()) {
      // optional password change on edit
      payload.password = form.password;
    }

    return payload;
  }

  async function handleCreateUserSubmit(e) {
    e.preventDefault();
    resetMessages();

    try {
      if (!createUserForm.username.trim()) throw new Error("Username is required.");
      if (!createUserForm.password) throw new Error("Password is required.");

      const body = normalizeUserPayload(createUserForm, true);

      const res = await fetch(ADMIN_USERS_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const out = await fetchJsonOrTextError(res);
      if (!out.ok) throw new Error(out.error);

      setSuccessMsg("User created.");
      setShowCreateUser(false);
      await loadUsers();
    } catch (e2) {
      setErrorMsg(e2?.message || "Create user failed.");
    }
  }

  async function handleEditUserSubmit(e) {
    e.preventDefault();
    resetMessages();

    try {
      if (!editUserId) throw new Error("Missing user id.");
      if (!editUserForm.username.trim()) throw new Error("Username is required.");

      const body = normalizeUserPayload(editUserForm, false);

      const res = await fetch(`${ADMIN_USERS_URL}/${editUserId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const out = await fetchJsonOrTextError(res);
      if (!out.ok) throw new Error(out.error);

      setSuccessMsg("User updated.");
      setShowEditUser(false);
      setEditUserId(null);
      await loadUsers();
    } catch (e2) {
      setErrorMsg(e2?.message || "Update user failed.");
    }
  }

  async function handleDeleteUser(id) {
    resetMessages();
    const ok = window.confirm("Delete this user? This cannot be undone.");
    if (!ok) return;

    try {
      const res = await fetch(`${ADMIN_USERS_URL}/${id}`, { method: "DELETE" });
      if (!res.ok && res.status !== 204) {
        const txt = await res.text().catch(() => "");
        throw new Error(txt || `Delete failed (${res.status})`);
      }

      setSuccessMsg("User deleted.");
      await loadUsers();
    } catch (e) {
      setErrorMsg(e?.message || "Delete user failed.");
    }
  }

  const filteredUsers = useMemo(() => {
    const q = userQuery.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) => {
      const username = (u?.username || "").toLowerCase();
      const email = (u?.email || "").toLowerCase();
      const name = `${u?.firstName || ""} ${u?.lastName || ""}`.toLowerCase();
      return username.includes(q) || email.includes(q) || name.includes(q);
    });
  }, [users, userQuery]);

  // -----------------------
  // Initial loads
  // -----------------------
  useEffect(() => {
    loadEpisodes();
  }, []);

  // load users only when you open that tab (fast + clean)
  useEffect(() => {
    if (tab === "users" && users.length === 0) {
      loadUsers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  function closeModals() {
    setShowCreateEpisode(false);
    setShowEditEpisode(false);
    setEditEpisodeId(null);

    setShowCreateUser(false);
    setShowEditUser(false);
    setEditUserId(null);
  }

  return (
    <div className="container py-4">
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
        <div>
          <h2 className="mb-0">Admin Dashboard</h2>
          <div className="text-muted">Manage episodes + users</div>
        </div>

        <div className="d-flex gap-2">
          {tab === "episodes" ? (
            <>
              <button className="btn btn-outline-secondary" onClick={loadEpisodes} disabled={episodesLoading}>
                {episodesLoading ? "Refreshing..." : "Refresh"}
              </button>
              <button className="btn btn-primary" onClick={openCreateEpisode}>
                + Create Episode
              </button>
            </>
          ) : (
            <>
              <button className="btn btn-outline-secondary" onClick={loadUsers} disabled={usersLoading}>
                {usersLoading ? "Refreshing..." : "Refresh"}
              </button>
              <button className="btn btn-primary" onClick={openCreateUser}>
                + Create User
              </button>
            </>
          )}
        </div>
      </div>

      {/* Tabs */}
      <ul className="nav nav-tabs mb-3">
        <li className="nav-item">
          <button className={`nav-link ${tab === "episodes" ? "active" : ""}`} onClick={() => setTab("episodes")}>
            Episodes
          </button>
        </li>
        <li className="nav-item">
          <button className={`nav-link ${tab === "users" ? "active" : ""}`} onClick={() => setTab("users")}>
            Users
          </button>
        </li>
      </ul>

      {errorMsg ? <div className="alert alert-danger">{errorMsg}</div> : null}
      {successMsg ? <div className="alert alert-success">{successMsg}</div> : null}

      {/* ===================== */}
      {/* EPISODES VIEW */}
      {/* ===================== */}
      {tab === "episodes" ? (
        <>
          <div className="card shadow-sm mb-3">
            <div className="card-body d-flex flex-wrap gap-2 align-items-center">
              <div className="flex-grow-1">
                <input
                  className="form-control"
                  placeholder="Search by title..."
                  value={episodeQuery}
                  onChange={(e) => setEpisodeQuery(e.target.value)}
                />
              </div>
              <div className="text-muted">
                Showing <strong>{filteredEpisodes.length}</strong> / {episodes.length}
              </div>
            </div>
          </div>

          <div className="card shadow-sm">
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th style={{ width: 70 }}>ID</th>
                    <th>Episode</th>
                    <th style={{ width: 120 }}>Status</th>
                    <th style={{ width: 120 }}>Category</th>
                    <th style={{ width: 90 }}>Season</th>
                    <th style={{ width: 130 }}>Duration</th>
                    <th style={{ width: 170 }}>Published</th>
                    <th style={{ width: 110 }}>Plays</th>
                    <th style={{ width: 220 }} className="text-end">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {episodesLoading ? (
                    <tr>
                      <td colSpan={9} className="text-center text-muted py-4">
                        Loading...
                      </td>
                    </tr>
                  ) : filteredEpisodes.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="text-center text-muted py-4">
                        No episodes found.
                      </td>
                    </tr>
                  ) : (
                    filteredEpisodes.map((e) => (
                      <tr key={e.id}>
                        <td className="text-muted">{e.id}</td>

                        <td>
                          <div className="fw-semibold">{e.title}</div>
                          <div className="small text-muted text-truncate" style={{ maxWidth: 640 }}>
                            {e.description || "—"}
                          </div>

                          {e.audioUrl ? <audio className="mt-2 w-100" controls preload="none" src={e.audioUrl} /> : null}
                        </td>

                        <td>
                          {e.isPublished ? (
                            <span className="badge text-bg-success">Published</span>
                          ) : (
                            <span className="badge text-bg-secondary">Draft</span>
                          )}
                        </td>

                        <td>{e.category || "—"}</td>
                        <td>{e.season ?? "—"}</td>
                        <td>{secondsToMinSec(e.durationSeconds)}</td>
                        <td>{formatDate(e.publishedDate)}</td>
                        <td>{e.playCount ?? 0}</td>

                        <td className="text-end">
                          <button className="btn btn-sm btn-outline-primary me-2" onClick={() => openEditEpisode(e)}>
                            Edit
                          </button>
                          <button className="btn btn-sm btn-outline-danger" onClick={() => handleDeleteEpisode(e.id)}>
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
        </>
      ) : null}

      {/* ===================== */}
      {/* USERS VIEW */}
      {/* ===================== */}
      {tab === "users" ? (
        <>
          <div className="card shadow-sm mb-3">
            <div className="card-body d-flex flex-wrap gap-2 align-items-center">
              <div className="flex-grow-1">
                <input
                  className="form-control"
                  placeholder="Search by username / name / email..."
                  value={userQuery}
                  onChange={(e) => setUserQuery(e.target.value)}
                />
              </div>
              <div className="text-muted">
                Showing <strong>{filteredUsers.length}</strong> / {users.length}
              </div>
            </div>
          </div>

          <div className="card shadow-sm">
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th style={{ width: 70 }}>ID</th>
                    <th>User</th>
                    <th style={{ width: 90 }}>Age</th>
                    <th style={{ width: 220 }}>Email</th>
                    <th style={{ width: 120 }}>Role</th>
                    <th style={{ width: 220 }} className="text-end">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {usersLoading ? (
                    <tr>
                      <td colSpan={6} className="text-center text-muted py-4">
                        Loading...
                      </td>
                    </tr>
                  ) : filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center text-muted py-4">
                        No users found.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((u) => (
                      <tr key={u.id}>
                        <td className="text-muted">{u.id}</td>
                        <td>
                          <div className="fw-semibold">{u.username}</div>
                          <div className="small text-muted">{u.firstName} {u.lastName}</div>
                        </td>
                        <td>{u.age ?? "—"}</td>
                        <td>{u.email || "—"}</td>
                        <td>
                          <span className={`badge ${u.role === "Admin" ? "text-bg-danger" : "text-bg-secondary"}`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="text-end">
                          <button className="btn btn-sm btn-outline-primary me-2" onClick={() => openEditUser(u)}>
                            Edit
                          </button>
                          <button className="btn btn-sm btn-outline-danger" onClick={() => handleDeleteUser(u.id)}>
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
        </>
      ) : null}

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
            submitLabel="Create User"
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
          <button type="submit" className="btn btn-primary">
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
          <button type="submit" className="btn btn-primary">
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
          <div className="modal-content shadow">
            <div className="modal-header">
              <h5 className="modal-title">{title}</h5>
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