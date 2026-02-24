import React, { useEffect, useMemo, useState } from "react";
import { API_BASE as BASE } from "../config/api";

const API_BASE = BASE;
const ADMIN_URL = `${API_BASE}/api/Admin`;
const ADMIN_EPISODES_URL = `${ADMIN_URL}/episodes`;
const ADMIN_USERS_URL = `${ADMIN_URL}/users`;
const CATEGORIES_URL = `${API_BASE}/api/categories`;

const emptyCreateEpisode = {
  title: "",
  description: "",
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
    season: "",
    isPublished: true,
    file: null,
  });

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
    password: "",
  });

  const [categories, setCategories] = useState([]);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState([]);
  const [editSelectedCategoryIds, setEditSelectedCategoryIds] = useState([]);

  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [addingCategory, setAddingCategory] = useState(false);

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

  const getToken = () => localStorage.getItem("accessToken");

  const authHeaders = (extra = {}) => {
    const t = getToken();
    return t ? { ...extra, Authorization: `Bearer ${t}` } : extra;
  };

  function getEpisodeCategoryLabels(e) {
    const idToName = new Map((categories || []).map((c) => [c.id, c.name]));

    const pickName = (obj) =>
      obj?.name ??
      obj?.Name ??
      obj?.categoryName ??
      obj?.CategoryName ??
      obj?.title ??
      obj?.Title ??
      obj?.category?.name ??
      obj?.category?.Name ??
      obj?.category?.title ??
      obj?.Category?.name ??
      obj?.Category?.Name ??
      obj?.Category?.title ??
      null;

    const pickId = (obj) =>
      obj?.categoryId ??
      obj?.CategoryId ??
      obj?.categoryID ??
      obj?.CategoryID ??
      obj?.id ??
      obj?.Id ??
      obj?.category?.id ??
      obj?.category?.Id ??
      obj?.Category?.id ??
      obj?.Category?.Id ??
      null;

    if (Array.isArray(e?.categories) && e.categories.length) {
      if (typeof e.categories[0] === "string") return e.categories;
      if (typeof e.categories[0] === "number") {
        return e.categories.map((id) => idToName.get(id)).filter(Boolean);
      }
      const names = e.categories.map(pickName).filter(Boolean);
      if (names.length) return names;
    }

    const ecs = Array.isArray(e?.episodeCategories) ? e.episodeCategories : [];
    if (!ecs.length) return [];

    if (typeof ecs[0] === "string") return ecs.filter(Boolean);

    if (typeof ecs[0] === "number") {
      return ecs.map((id) => idToName.get(id)).filter(Boolean);
    }

    const names = ecs.map(pickName).filter(Boolean);
    if (names.length) return names;

    const ids = ecs.map(pickId).filter((v) => typeof v === "number");
    if (ids.length) return ids.map((id) => idToName.get(id)).filter(Boolean);

    return [];
  }

  async function loadCategories() {
    try {
      const res = await fetch(CATEGORIES_URL, { method: "GET", headers: authHeaders() });
      const out = await fetchJsonOrTextError(res);
      if (!out.ok) throw new Error(out.error);
      setCategories(Array.isArray(out.data) ? out.data : []);
    } catch {
    }
  }

  function openAddCategory() {
    resetMessages();
    setNewCategoryName("");
    setShowAddCategory(true);
  }

  async function handleAddCategorySubmit(e) {
    e.preventDefault();
    resetMessages();

    const name = newCategoryName.trim();
    if (!name) {
      setErrorMsg("Category name is required.");
      return;
    }

    setAddingCategory(true);
    try {
      const res = await fetch(CATEGORIES_URL, {
        method: "POST",
        headers: authHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({ name }),
      });

      const out = await fetchJsonOrTextError(res);
      if (!out.ok) throw new Error(out.error);

      setSuccessMsg("Category created.");
      setShowAddCategory(false);
      await loadCategories();
    } catch (e2) {
      setErrorMsg(e2?.message || "Failed to create category.");
    } finally {
      setAddingCategory(false);
    }
  }

  async function loadEpisodes() {
    setEpisodesLoading(true);
    resetMessages();
    try {
      const res = await fetch(ADMIN_EPISODES_URL, {
        method: "GET",
        headers: authHeaders(),
      });
      const out = await fetchJsonOrTextError(res);
      if (!out.ok) throw new Error(out.error);

      const list = Array.isArray(out.data) ? out.data : [];
      setEpisodes(list);
    } catch (e) {
      setErrorMsg(e?.message || "Failed to load episodes.");
    } finally {
      setEpisodesLoading(false);
    }
  }

  function openCreateEpisode() {
    resetMessages();
    setCreateEpisodeForm({ ...emptyCreateEpisode });
    setSelectedCategoryIds([]);
    setShowCreateEpisode(true);
  }

  function openEditEpisode(episode) {
    resetMessages();
    setEditEpisodeId(episode.id);

    let ids =
      Array.isArray(episode.categoryIds)
        ? episode.categoryIds
        : Array.isArray(episode.categoryIDIds)
        ? episode.categoryIDIds
        : Array.isArray(episode.categoriesIds)
        ? episode.categoriesIds
        : Array.isArray(episode.categories) &&
          episode.categories.length &&
          typeof episode.categories[0] === "number"
        ? episode.categories
        : [];

    if ((!ids || ids.length === 0) && Array.isArray(episode.episodeCategories) && episode.episodeCategories.length) {
      const ecs = episode.episodeCategories;

      if (typeof ecs[0] === "number") {
        ids = ecs;
      } else if (typeof ecs[0] === "object") {
        ids = ecs
          .map((x) => x?.categoryId ?? x?.CategoryId ?? x?.category?.id ?? x?.Category?.id ?? x?.id ?? x?.Id)
          .filter((v) => typeof v === "number");
      }
    }

    setEditSelectedCategoryIds(ids);

    setEditEpisodeForm({
      title: episode.title || "",
      description: episode.description || "",
      season: episode.season === null || episode.season === undefined ? "" : String(episode.season),
      isPublished: !!episode.isPublished,
      file: null,
    });

    setShowEditEpisode(true);
  }

  function buildEpisodeFormData(form, requireFile, categoryIds) {
    const fd = new FormData();

    fd.append("title", form.title ?? "");
    fd.append("description", form.description ?? "");

    fd.append("categoryIds", (categoryIds ?? []).join(","));

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

      const fd = buildEpisodeFormData(createEpisodeForm, true, selectedCategoryIds);

      const res = await fetch(ADMIN_EPISODES_URL, {
        method: "POST",
        headers: authHeaders(),
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

      const fd = buildEpisodeFormData(editEpisodeForm, false, editSelectedCategoryIds);

      const res = await fetch(`${ADMIN_EPISODES_URL}/${editEpisodeId}`, {
        method: "PUT",
        headers: authHeaders(),
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
      const res = await fetch(`${ADMIN_EPISODES_URL}/${id}`, { method: "DELETE", headers: authHeaders() });
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

  async function loadUsers() {
    setUsersLoading(true);
    resetMessages();
    try {
      const res = await fetch(ADMIN_USERS_URL, { method: "GET", headers: authHeaders() });
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
      password: "",
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
        headers: authHeaders({ "Content-Type": "application/json" }),
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
        headers: authHeaders({ "Content-Type": "application/json" }),
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
      const res = await fetch(`${ADMIN_USERS_URL}/${id}`, { method: "DELETE", headers: authHeaders() });
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

  useEffect(() => {
    loadEpisodes();
    loadCategories();
  }, []);

  useEffect(() => {
    if (tab === "users" && users.length === 0) {
      loadUsers();
    }
  }, [tab]); // eslint-disable-line react-hooks/exhaustive-deps

  function closeModals() {
    setShowCreateEpisode(false);
    setShowEditEpisode(false);
    setEditEpisodeId(null);

    setShowCreateUser(false);
    setShowEditUser(false);
    setEditUserId(null);

    setShowAddCategory(false);
    setSelectedCategoryIds([]);
    setEditSelectedCategoryIds([]);
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
              <button className="btn btn-outline-primary" onClick={openAddCategory}>
                + Add Category
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

                        {/* ✅ This now reads from episodeCategories correctly */}
                        <td>{(() => {
                          const labels = getEpisodeCategoryLabels(e);
                          return labels.length ? labels.join(", ") : "—";
                        })()}</td>

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
                          <div className="small text-muted">
                            {u.firstName} {u.lastName}
                          </div>
                        </td>
                        <td>{u.age ?? "—"}</td>
                        <td>{u.email || "—"}</td>
                        <td>
                        <span
  className={`badge ${
    u.role === "Admin"
      ? "text-bg-danger"
      : u.role === "Publisher"
      ? "text-bg-primary"
      : "text-bg-secondary"
  }`}
>
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

      {showCreateEpisode ? (
        <Modal title="Create Episode" onClose={closeModals}>
          <EpisodeForm
            form={createEpisodeForm}
            setForm={setCreateEpisodeForm}
            onSubmit={handleCreateEpisodeSubmit}
            submitLabel="Create"
            requireFile={true}
            categories={categories}
            selectedIds={selectedCategoryIds}
            setSelectedIds={setSelectedCategoryIds}
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
            categories={categories}
            selectedIds={editSelectedCategoryIds}
            setSelectedIds={setEditSelectedCategoryIds}
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
          <div className="alert alert-info mt-3 mb-0">Leave password empty to keep the current password.</div>
        </Modal>
      ) : null}

      {showAddCategory ? (
        <Modal title="Add Category" onClose={() => setShowAddCategory(false)}>
          <form onSubmit={handleAddCategorySubmit}>
            <div className="mb-3">
              <label className="form-label">Category name</label>
              <input
                className="form-control"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="e.g. Tech"
                autoFocus
              />
            </div>

            <div className="d-flex justify-content-end gap-2">
              <button type="button" className="btn btn-outline-secondary" onClick={() => setShowAddCategory(false)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={addingCategory || !newCategoryName.trim()}>
                {addingCategory ? "Adding..." : "Add"}
              </button>
            </div>
          </form>
        </Modal>
      ) : null}
    </div>
  );
}

function EpisodeForm({ form, setForm, onSubmit, submitLabel, requireFile, categories, selectedIds, setSelectedIds }) {
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

        <div className="col-12">
          <label className="form-label">Categories</label>
          <div className="d-flex flex-wrap gap-2">
            {categories?.length ? (
              categories.map((c) => (
                <label key={c.id} className="badge text-bg-light" style={{ cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={selectedIds?.includes(c.id)}
                    onChange={() =>
                      setSelectedIds((prev) => (prev.includes(c.id) ? prev.filter((x) => x !== c.id) : [...prev, c.id]))
                    }
                    style={{ marginRight: 8 }}
                  />
                  {c.name}
                </label>
              ))
            ) : (
              <div className="text-muted small">No categories available.</div>
            )}
          </div>
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
          <input className="form-control" value={form.username} onChange={(e) => setForm((p) => ({ ...p, username: e.target.value }))} />
        </div>

        <div className="col-md-6">
          <label className="form-label">Role</label>
          <select
  className="form-select"
  value={form.role}
  onChange={(e) => setForm((p) => ({ ...p, role: e.target.value }))}
>
  <option value="User">User</option>
  <option value="Publisher">Publisher</option>
  <option value="Admin">Admin</option>
</select>
        </div>

        <div className="col-md-6">
          <label className="form-label">First name</label>
          <input className="form-control" value={form.firstName} onChange={(e) => setForm((p) => ({ ...p, firstName: e.target.value }))} />
        </div>

        <div className="col-md-6">
          <label className="form-label">Last name</label>
          <input className="form-control" value={form.lastName} onChange={(e) => setForm((p) => ({ ...p, lastName: e.target.value }))} />
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
          <input className="form-control" type="number" min="0" value={form.age} onChange={(e) => setForm((p) => ({ ...p, age: e.target.value }))} />
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