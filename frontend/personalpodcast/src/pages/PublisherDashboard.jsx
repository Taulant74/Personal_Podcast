import React, { useEffect, useMemo, useState } from "react";

const API_BASE = "https://localhost:7261";
const PUB_URL = `${API_BASE}/api/publisher`;
const PUB_EPISODES_URL = `${PUB_URL}/episodes`;

const emptyCreateEpisode = {
  title: "",
  description: "",
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

export default function PublisherDashboard() {
  const [episodes, setEpisodes] = useState([]);
  const [loading, setLoading] = useState(false);

  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({ ...emptyCreateEpisode });

  const [showEdit, setShowEdit] = useState(false);
  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState({ ...emptyCreateEpisode, file: null });

  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

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

  function resetMessages() {
    setErrorMsg("");
    setSuccessMsg("");
  }

  async function loadEpisodes() {
    setLoading(true);
    resetMessages();
    try {
      const res = await fetch(PUB_EPISODES_URL, {
        method: "GET",
        headers: { ...authHeaders() },
      });
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

  function openCreate() {
    resetMessages();
    setCreateForm({ ...emptyCreateEpisode });
    setShowCreate(true);
  }

  function openEdit(ep) {
    resetMessages();
    setEditId(ep.id);
    setEditForm({
      title: ep.title || "",
      description: ep.description || "",
      season: ep.season == null ? "" : String(ep.season),
      isPublished: !!ep.isPublished,
      file: null,
    });
    setShowEdit(true);
  }

  function buildFormData(form, requireFile) {
    const fd = new FormData();
    fd.append("title", form.title ?? "");
    fd.append("description", form.description ?? "");
    if (form.season !== "" && form.season != null) fd.append("season", String(form.season));
    fd.append("isPublished", String(!!form.isPublished));
    if (form.file) fd.append("file", form.file);
    else if (requireFile) throw new Error("Audio file is required.");
    return fd;
  }

  async function handleCreateSubmit(e) {
    e.preventDefault();
    resetMessages();
    try {
      if (!createForm.title.trim()) throw new Error("Title is required.");
      if (!createForm.file) throw new Error("Audio file is required.");

      const fd = buildFormData(createForm, true);

      const res = await fetch(PUB_EPISODES_URL, {
        method: "POST",
        headers: { ...authHeaders() },
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
  async function handleDelete(ep) {
  resetMessages();
  if (!window.confirm(`Delete "${ep.title}"? This cannot be undone.`)) return;

  try {
    const res = await fetch(`${PUB_EPISODES_URL}/${ep.id}`, {
      method: "DELETE",
      headers: { ...authHeaders() },
    });

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

  async function handleEditSubmit(e) {
    e.preventDefault();
    resetMessages();
    try {
      if (!editId) throw new Error("Missing episode id.");
      if (!editForm.title.trim()) throw new Error("Title is required.");

      const fd = buildFormData(editForm, false);

      const res = await fetch(`${PUB_EPISODES_URL}/${editId}`, {
        method: "PUT",
        headers: { ...authHeaders() },
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
  async function setPublishState(ep, publish) {
    resetMessages();
    try {
      const fd = new FormData();
      fd.append("title", ep.title ?? "");
      fd.append("description", ep.description ?? "");
      if (ep.season != null && ep.season !== "") fd.append("season", String(ep.season));
      fd.append("isPublished", String(!!publish));

      const res = await fetch(`${PUB_EPISODES_URL}/${ep.id}`, {
        method: "PUT",
        headers: { ...authHeaders() },
        body: fd,
      });

      const out = await fetchJsonOrTextError(res);
      if (!out.ok) throw new Error(out.error);

      setSuccessMsg(publish ? "Episode published." : "Episode unpublished (saved as draft).");
      await loadEpisodes();
    } catch (e) {
      setErrorMsg(e?.message || "Action failed.");
    }
  }

  const stats = useMemo(() => {
    const total = episodes.length;
    const published = episodes.filter((e) => !!e.isPublished).length;
    const drafts = total - published;
    const plays = episodes.reduce((acc, e) => acc + (Number(e.playCount) || 0), 0);
    return { total, published, drafts, plays };
  }, [episodes]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return episodes.filter((e) => {
      if (statusFilter === "published" && !e.isPublished) return false;
      if (statusFilter === "draft" && e.isPublished) return false;
      if (!q) return true;
      return (e?.title || "").toLowerCase().includes(q);
    });
  }, [episodes, query, statusFilter]);

  return (
    <div className="container py-4">
      {/* Header */}
      <div className="d-flex flex-wrap align-items-start justify-content-between gap-3 mb-3">
        <div>
          <h2 className="mb-1">Publisher Dashboard</h2>
          <div className="text-muted">Manage episodes, publish/unpublish, and upload new audio.</div>
        </div>

        <div className="d-flex gap-2">
          <button className="btn btn-outline-secondary" onClick={loadEpisodes} disabled={loading}>
            {loading ? "Refreshing..." : "Refresh"}
          </button>
          <button className="btn btn-primary" onClick={openCreate}>
            + New Episode
          </button>
        </div>
      </div>

      {errorMsg ? <div className="alert alert-danger">{errorMsg}</div> : null}
      {successMsg ? <div className="alert alert-success">{successMsg}</div> : null}

      {/* Stats */}
      <div className="row g-3 mb-3">
        <div className="col-12 col-md-3">
          <div className="card shadow-sm h-100">
            <div className="card-body">
              <div className="text-muted small">Total</div>
              <div className="fs-3 fw-semibold">{stats.total}</div>
            </div>
          </div>
        </div>
        <div className="col-12 col-md-3">
          <div className="card shadow-sm h-100">
            <div className="card-body">
              <div className="text-muted small">Published</div>
              <div className="fs-3 fw-semibold">{stats.published}</div>
            </div>
          </div>
        </div>
        <div className="col-12 col-md-3">
          <div className="card shadow-sm h-100">
            <div className="card-body">
              <div className="text-muted small">Drafts</div>
              <div className="fs-3 fw-semibold">{stats.drafts}</div>
            </div>
          </div>
        </div>
        <div className="col-12 col-md-3">
          <div className="card shadow-sm h-100">
            <div className="card-body">
              <div className="text-muted small">Total Plays</div>
              <div className="fs-3 fw-semibold">{stats.plays}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Toolbar */}
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

          <div style={{ minWidth: 190 }}>
            <select className="form-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="all">All</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
            </select>
          </div>

          <div className="text-muted">
            Showing <strong>{filtered.length}</strong> / {episodes.length}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card shadow-sm">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-light">
              <tr>
                <th style={{ width: 70 }}>ID</th>
                <th>Episode</th>
                <th style={{ width: 120 }}>Status</th>
                <th style={{ width: 90 }}>Season</th>
                <th style={{ width: 120 }}>Duration</th>
                <th style={{ width: 170 }}>Published</th>
                <th style={{ width: 90 }}>Plays</th>
                <th style={{ width: 320 }} className="text-end">Actions</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="text-center text-muted py-4">Loading...</td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center text-muted py-4">No episodes found.</td>
                </tr>
              ) : (
                filtered.map((e) => (
                  <tr key={e.id}>
                    <td className="text-muted">{e.id}</td>

                    <td>
                      <div className="d-flex flex-column gap-2">
                        <div>
                          <div className="fw-semibold">{e.title}</div>
                          <div className="small text-muted text-truncate" style={{ maxWidth: 720 }}>
                            {e.description || "—"}
                          </div>
                        </div>

                        {e.audioUrl ? (
                          <audio className="w-100" controls preload="none" src={e.audioUrl} />
                        ) : null}
                      </div>
                    </td>

                    <td>
                      {e.isPublished ? (
                        <span className="badge text-bg-success">Published</span>
                      ) : (
                        <span className="badge text-bg-secondary">Draft</span>
                      )}
                    </td>

                    <td>{e.season ?? "—"}</td>
                    <td>{secondsToMinSec(e.durationSeconds)}</td>
                    <td>{formatDate(e.publishedDate)}</td>
                    <td>{e.playCount ?? 0}</td>

                    <td className="text-end">
                      <button
                        className="btn btn-sm btn-outline-primary me-2"
                        onClick={() => openEdit(e)}
                      >
                        Edit
                      </button>

                      {e.isPublished ? (
                        <button
                          className="btn btn-sm btn-outline-warning me-2"
                          onClick={() => setPublishState(e, false)}
                        >
                          Unpublish
                        </button>
                      ) : (
                        <button
                          className="btn btn-sm btn-outline-success me-2"
                          onClick={() => setPublishState(e, true)}
                        >
                          Publish
                        </button>
                      )}
                      <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(e)}>
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

      {/* Create modal */}
      {showCreate ? (
        <Modal title="Create Episode" onClose={() => setShowCreate(false)}>
          <EpisodeForm
            form={createForm}
            setForm={setCreateForm}
            onSubmit={handleCreateSubmit}
            submitLabel="Create"
            requireFile
          />
        </Modal>
      ) : null}

      {/* Edit modal */}
      {showEdit ? (
        <Modal
          title={`Edit Episode #${editId}`}
          onClose={() => { setShowEdit(false); setEditId(null); }}
        >
          <EpisodeForm
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
          />
        </div>

        <div className="col-12">
          <label className="form-label">Description</label>
          <textarea
            className="form-control"
            rows={3}
            value={form.description}
            onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
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
            />
            <label className="form-check-label">{form.isPublished ? "Published" : "Draft"}</label>
          </div>
        </div>

        <div className="col-12">
          <label className="form-label">
            Audio file {requireFile ? <span className="text-danger">*</span> : <span className="text-muted">(optional)</span>}
          </label>
          <input
            className="form-control"
            type="file"
            accept="audio/*"
            onChange={(e) => setForm((p) => ({ ...p, file: e.target.files?.[0] || null }))}
          />
        </div>

        <div className="col-12 d-flex justify-content-end gap-2 mt-2">
          <button type="submit" className="btn btn-primary">{submitLabel}</button>
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