import React, { useEffect, useMemo, useState } from "react";

const API_BASE = "";
const ADMIN_URL = `${API_BASE}/api/Admin`;

const emptyCreate = {
  title: "",
  description: "",
  category: "",
  season: "",
  isPublished: true,
  file: null,
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
  const [episodes, setEpisodes] = useState([]);
  const [loading, setLoading] = useState(false);

  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [query, setQuery] = useState("");

  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);

  const [createForm, setCreateForm] = useState({ ...emptyCreate });
  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState({
    title: "",
    description: "",
    category: "",
    season: "",
    isPublished: true,
    file: null,
  });

  async function fetchJsonOrTextError(res) {
    if (res.ok) return { ok: true, data: await res.json().catch(() => null) };

    const txt = await res.text().catch(() => "");
    return { ok: false, error: txt || `Request failed (${res.status})` };
  }

  async function loadEpisodes() {
    setLoading(true);
    setErrorMsg("");
    try {
      const res = await fetch(ADMIN_URL, { method: "GET" });
      const out = await fetchJsonOrTextError(res);
      if (!out.ok) throw new Error(out.error);
      setEpisodes(Array.isArray(out.data) ? out.data : []);
    } catch (e) {
      setErrorMsg(e?.message || "Failed to load episodes.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadEpisodes();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return episodes;
    return episodes.filter((e) => (e?.title || "").toLowerCase().includes(q));
  }, [episodes, query]);

  function resetMessages() {
    setErrorMsg("");
    setSuccessMsg("");
  }

  function openCreate() {
    resetMessages();
    setCreateForm({ ...emptyCreate });
    setShowCreate(true);
  }

  function openEdit(episode) {
    resetMessages();
    setEditId(episode.id);
    setEditForm({
      title: episode.title || "",
      description: episode.description || "",
      category: episode.category || "",
      season: episode.season === null || episode.season === undefined ? "" : String(episode.season),
      isPublished: !!episode.isPublished,
      file: null,
    });
    setShowEdit(true);
  }

  function closeModals() {
    setShowCreate(false);
    setShowEdit(false);
    setEditId(null);
  }

  function buildFormData(form, requireFile) {
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

  async function handleCreateSubmit(e) {
    e.preventDefault();
    resetMessages();

    try {
      if (!createForm.title.trim()) throw new Error("Title is required.");
      if (!createForm.file) throw new Error("Audio file is required.");

      const fd = buildFormData(createForm, true);

      const res = await fetch(ADMIN_URL, {
        method: "POST",
        body: fd,
      });

      const out = await fetchJsonOrTextError(res);
      if (!out.ok) throw new Error(out.error);

      setSuccessMsg("Episode created.");
      setShowCreate(false);
      await loadEpisodes();
    } catch (e2) {
      setErrorMsg(e2?.message || "Create failed.");
    }
  }

  async function handleEditSubmit(e) {
    e.preventDefault();
    resetMessages();

    try {
      if (!editId) throw new Error("Missing episode id.");
      if (!editForm.title.trim()) throw new Error("Title is required.");

      const fd = buildFormData(editForm, false);

      const res = await fetch(`${ADMIN_URL}/${editId}`, {
        method: "PUT",
        body: fd,
      });

      const out = await fetchJsonOrTextError(res);
      if (!out.ok) throw new Error(out.error);

      setSuccessMsg("Episode updated.");
      setShowEdit(false);
      setEditId(null);
      await loadEpisodes();
    } catch (e2) {
      setErrorMsg(e2?.message || "Update failed.");
    }
  }

  async function handleDelete(id) {
    resetMessages();
    const ok = window.confirm("Delete this episode? This cannot be undone.");
    if (!ok) return;

    try {
      const res = await fetch(`${ADMIN_URL}/${id}`, { method: "DELETE" });

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

  return (
    <div className="container py-4">
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
        <div>
          <h2 className="mb-0">Admin Dashboard</h2>
          <div className="text-muted">Episodes CRUD (upload / edit / delete)</div>
        </div>

        <div className="d-flex gap-2">
          <button className="btn btn-outline-secondary" onClick={loadEpisodes} disabled={loading}>
            {loading ? "Refreshing..." : "Refresh"}
          </button>
          <button className="btn btn-primary" onClick={openCreate}>
            + Create Episode
          </button>
        </div>
      </div>

      {errorMsg ? (
        <div className="alert alert-danger" role="alert">
          {errorMsg}
        </div>
      ) : null}

      {successMsg ? (
        <div className="alert alert-success" role="alert">
          {successMsg}
        </div>
      ) : null}

      <div className="card shadow-sm mb-3">
        <div className="card-body d-flex flex-wrap gap-2 align-items-center">
          <div className="flex-grow-1">
            <input
              className="form-control"
              placeholder="Search by title..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <div className="text-muted">
            Showing <strong>{filtered.length}</strong> / {episodes.length}
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
              {loading ? (
                <tr>
                  <td colSpan={9} className="text-center text-muted py-4">
                    Loading...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center text-muted py-4">
                    No episodes found.
                  </td>
                </tr>
              ) : (
                filtered.map((e) => (
                  <tr key={e.id}>
                    <td className="text-muted">{e.id}</td>

                    <td>
                      <div className="fw-semibold">{e.title}</div>
                      <div className="small text-muted text-truncate" style={{ maxWidth: 640 }}>
                        {e.description || "—"}
                      </div>

                      {e.audioUrl ? (
                        <audio className="mt-2 w-100" controls preload="none" src={e.audioUrl} />
                      ) : null}
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
                      <button className="btn btn-sm btn-outline-primary me-2" onClick={() => openEdit(e)}>
                        Edit
                      </button>
                      <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(e.id)}>
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

      {showCreate ? (
        <Modal title="Create Episode" onClose={closeModals}>
          <EpisodeForm
            mode="create"
            form={createForm}
            setForm={setCreateForm}
            onSubmit={handleCreateSubmit}
            submitLabel="Create"
            requireFile={true}
          />
        </Modal>
      ) : null}

      {/* Edit */}
      {showEdit ? (
        <Modal title={`Edit Episode #${editId}`} onClose={closeModals}>
          <EpisodeForm
            mode="edit"
            form={editForm}
            setForm={setEditForm}
            onSubmit={handleEditSubmit}
            submitLabel="Save changes"
            requireFile={false}
          />
          <div className="alert alert-info mt-3 mb-0">
            Uploading a new file will replace the current <code>AudioUrl</code>.
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