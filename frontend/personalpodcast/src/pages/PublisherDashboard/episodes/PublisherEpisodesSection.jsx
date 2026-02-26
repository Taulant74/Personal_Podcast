import React, { useEffect, useMemo, useState } from "react";
import Modal from "../../AdminDashboard/components/Modal";
import PaginationBar from "../../AdminDashboard/components/PaginationBar";
import EpisodeForm from "./EpisodeForm";

import { emptyCreateEpisode, formatDate, secondsToMinSec, getEpisodeCategoryLabels } from "../utils";
import {
  apiLoadPublisherEpisodes,
  apiCreatePublisherEpisode,
  apiUpdatePublisherEpisode,
  apiDeletePublisherEpisode,
  apiLoadCategories,
  apiSetPublishState,
} from "../api";

export default function PublisherEpisodesSection({ setErrorMsg, setSuccessMsg, resetMessages }) {
  const [episodes, setEpisodes] = useState([]);
  const [loading, setLoading] = useState(false);

  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); 

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [categories, setCategories] = useState([]);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState([]);
  const [editSelectedCategoryIds, setEditSelectedCategoryIds] = useState([]);

  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({ ...emptyCreateEpisode });

  const [showEdit, setShowEdit] = useState(false);
  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState({ ...emptyCreateEpisode, file: null });

  async function loadAll() {
    setLoading(true);
    resetMessages();
    try {
      const [eps, cats] = await Promise.all([apiLoadPublisherEpisodes(), apiLoadCategories()]);
      setEpisodes(Array.isArray(eps) ? eps : []);
      setCategories(Array.isArray(cats) ? cats : []);
    } catch (e) {
      setErrorMsg(e?.message || "Failed to load episodes.");
    } finally {
      setLoading(false);
    }
  }

  async function loadEpisodesOnly() {
    setLoading(true);
    resetMessages();
    try {
      const eps = await apiLoadPublisherEpisodes();
      setEpisodes(Array.isArray(eps) ? eps : []);
    } catch (e) {
      setErrorMsg(e?.message || "Failed to load episodes.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  function openCreate() {
    resetMessages();
    setCreateForm({ ...emptyCreateEpisode });
    setSelectedCategoryIds([]);
    setShowCreate(true);
  }

  function openEdit(ep) {
    resetMessages();
    setEditId(ep.id);

    let ids =
      Array.isArray(ep.categoryIds) ? ep.categoryIds :
      Array.isArray(ep.categoryIDs) ? ep.categoryIDs :
      Array.isArray(ep.categoriesIds) ? ep.categoriesIds :
      Array.isArray(ep.categories) && typeof ep.categories?.[0] === "number" ? ep.categories :
      [];

    if ((!ids || ids.length === 0) && Array.isArray(ep.episodeCategories) && ep.episodeCategories.length) {
      const ecs = ep.episodeCategories;
      if (typeof ecs[0] === "number") ids = ecs;
      if (typeof ecs[0] === "object") {
        ids = ecs
          .map((x) => x?.categoryId ?? x?.CategoryId ?? x?.category?.id ?? x?.Category?.id ?? x?.id ?? x?.Id)
          .filter((v) => typeof v === "number");
      }
    }

    setEditSelectedCategoryIds(ids);

    setEditForm({
      title: ep.title || "",
      description: ep.description || "",
      season: ep.season == null ? "" : String(ep.season),
      isPublished: !!ep.isPublished,
      file: null,
    });

    setShowEdit(true);
  }

  async function handleCreateSubmit(e) {
    e.preventDefault();
    resetMessages();

    try {
      if (!createForm.title.trim()) throw new Error("Title is required.");
      if (!createForm.file) throw new Error("Audio file is required.");

      await apiCreatePublisherEpisode(createForm, selectedCategoryIds);

      setSuccessMsg("Episode created.");
      setShowCreate(false);
      await loadEpisodesOnly();
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

      await apiUpdatePublisherEpisode(editId, editForm, editSelectedCategoryIds);

      setSuccessMsg("Episode updated.");
      setShowEdit(false);
      setEditId(null);
      await loadEpisodesOnly();
    } catch (e2) {
      setErrorMsg(e2?.message || "Update failed.");
    }
  }

  async function handleDelete(ep) {
    resetMessages();
    if (!window.confirm(`Delete "${ep.title}"? This cannot be undone.`)) return;

    try {
      await apiDeletePublisherEpisode(ep.id);
      setSuccessMsg("Episode deleted.");
      await loadEpisodesOnly();
    } catch (e) {
      setErrorMsg(e?.message || "Delete failed.");
    }
  }

  async function handleSetPublish(ep, publish) {
    resetMessages();
    try {
      await apiSetPublishState(ep, publish);
      setSuccessMsg(publish ? "Episode published." : "Episode unpublished (saved as draft).");
      await loadEpisodesOnly();
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

  useEffect(() => setPage(1), [query, statusFilter, episodes]);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(filtered.length / pageSize)), [filtered.length, pageSize]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const paged = useMemo(() => {
    const safe = Math.min(Math.max(1, page), totalPages);
    const start = (safe - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize, totalPages]);

  function closeModals() {
    setShowCreate(false);
    setShowEdit(false);
    setEditId(null);
    setSelectedCategoryIds([]);
    setEditSelectedCategoryIds([]);
  }

  return (
    <>
      <div className="publisher-stats mb-3">
        <div className="stat-card">
          <div className="stat-label">Total</div>
          <div className="stat-value">{stats.total}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Published</div>
          <div className="stat-value">{stats.published}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Drafts</div>
          <div className="stat-value">{stats.drafts}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total Plays</div>
          <div className="stat-value">{stats.plays}</div>
        </div>
      </div>

      <div className="glass-card p-3">
     
        <div className="d-flex flex-wrap gap-2 align-items-center mb-3">
          <input
            className="searchbox flex-grow-1"
            placeholder="Search by title..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />

          <select
            className="form-select admin-select"
            style={{ minWidth: 190 }}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
          </select>

          <span className="stat-pill">
            Showing <b>{paged.length}</b> of <b>{filtered.length}</b> (total {episodes.length})
          </span>
        </div>

        <div className="d-flex flex-wrap gap-2 mb-3">
          <button className="btn btn-soft" onClick={loadEpisodesOnly} disabled={loading}>
            {loading ? "Refreshing..." : "Refresh"}
          </button>
          <button className="btn btn-brand" onClick={openCreate}>
            + New Episode
          </button>
        </div>

        {loading ? (
          <div className="text-center text-muted py-4">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center text-muted py-4">No episodes found.</div>
        ) : (
          <div className="d-grid gap-3">
            {paged.map((e) => {
              const labels = getEpisodeCategoryLabels(e, categories);

              return (
                <div key={e.id} className="row-card">
                  <div className="d-flex justify-content-between align-items-start gap-3">
                    <div className="flex-grow-1" style={{ minWidth: 0 }}>
                      <div className="d-flex align-items-center gap-2 flex-wrap">
                        <span className="badge-soft">{e.id}</span>

                        <span className={`badge-soft ${e.isPublished ? "badge-ok" : "badge-draft"}`}>
                          {e.isPublished ? "Published" : "Draft"}
                        </span>

                        {labels?.length ? (
                          <span className="badge-soft badge-info">{labels.join(", ")}</span>
                        ) : (
                          <span className="badge-soft">—</span>
                        )}

                        <span className="badge-soft">Season: {e.season ?? "—"}</span>
                        <span className="badge-soft">Duration: {secondsToMinSec(e.durationSeconds)}</span>
                        <span className="badge-soft">Plays: {e.playCount ?? 0}</span>
                      </div>

                      <div className="mt-2 row-title text-truncate">{e.title}</div>
                      <div className="row-desc text-truncate">{e.description || "—"}</div>

                      {e.audioUrl ? <audio className="audio-slim mt-2" controls preload="none" src={e.audioUrl} /> : null}

                      <div className="mt-2 small" style={{ color: "var(--muted)" }}>
                        Published: {formatDate(e.publishedDate)}
                      </div>
                    </div>

                    <div className="d-flex gap-2 flex-wrap justify-content-end flex-shrink-0">
                      <button className="btn btn-action btn-action-edit" type="button" onClick={() => openEdit(e)}>
                        Edit
                      </button>

                      {e.isPublished ? (
                        <button
                          className="btn btn-action btn-action-warn"
                          type="button"
                          onClick={() => handleSetPublish(e, false)}
                        >
                          Unpublish
                        </button>
                      ) : (
                        <button
                          className="btn btn-action btn-action-success"
                          type="button"
                          onClick={() => handleSetPublish(e, true)}
                        >
                          Publish
                        </button>
                      )}

                      <button className="btn btn-action btn-action-delete" type="button" onClick={() => handleDelete(e)}>
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-3">
          <PaginationBar
            page={page}
            setPage={setPage}
            pageSize={pageSize}
            setPageSize={setPageSize}
            totalPages={totalPages}
          />
        </div>
      </div>

      {showCreate ? (
        <Modal title="Create Episode" onClose={closeModals}>
          <EpisodeForm
            form={createForm}
            setForm={setCreateForm}
            onSubmit={handleCreateSubmit}
            submitLabel="Create"
            requireFile={true}
            categories={categories}
            selectedIds={selectedCategoryIds}
            setSelectedIds={setSelectedCategoryIds}
          />
        </Modal>
      ) : null}

      {showEdit ? (
        <Modal title={`Edit Episode #${editId}`} onClose={closeModals}>
          <EpisodeForm
            form={editForm}
            setForm={setEditForm}
            onSubmit={handleEditSubmit}
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
    </>
  );
}