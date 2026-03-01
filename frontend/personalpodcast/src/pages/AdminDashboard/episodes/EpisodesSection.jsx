import React, { useEffect, useMemo, useState } from "react";
import Modal from "../components/Modal";
import PaginationBar from "../components/PaginationBar";
import EpisodeForm from "./EpisodeForm";
import {
  emptyCreateEpisode,
  formatDate,
  secondsToMinSec,
  getEpisodeCategoryLabels,
} from "../utils";
import {
  apiLoadEpisodes,
  apiCreateEpisode,
  apiUpdateEpisode,
  apiDeleteEpisode,
  apiLoadCategories,
  apiCreateCategory,
  apiDeleteCategory,
} from "../api";

export default function EpisodesSection({
  setErrorMsg,
  setSuccessMsg,
  resetMessages,
}) {
  const [episodes, setEpisodes] = useState([]);
  const [episodesLoading, setEpisodesLoading] = useState(false);
  const [episodeQuery, setEpisodeQuery] = useState("");

  const [episodePage, setEpisodePage] = useState(1);
  const [episodePageSize, setEpisodePageSize] = useState(10);

  const [categories, setCategories] = useState([]);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState([]);
  const [editSelectedCategoryIds, setEditSelectedCategoryIds] = useState([]);

  const [showCreateEpisode, setShowCreateEpisode] = useState(false);
  const [showEditEpisode, setShowEditEpisode] = useState(false);
  const [createEpisodeForm, setCreateEpisodeForm] = useState({
    ...emptyCreateEpisode,
  });
  const [editEpisodeId, setEditEpisodeId] = useState(null);
  const [editEpisodeForm, setEditEpisodeForm] = useState({
    title: "",
    description: "",
    season: "",
    isPublished: true,
    isPremium: false,
    file: null,
  });

  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [addingCategory, setAddingCategory] = useState(false);

  const [showDeleteCategory, setShowDeleteCategory] = useState(false);
  const [deleteCategoryId, setDeleteCategoryId] = useState("");
  const [deletingCategory, setDeletingCategory] = useState(false);

  async function loadCategories() {
    try {
      const list = await apiLoadCategories();
      setCategories(list);
    } catch {}
  }

  async function loadEpisodes() {
    setEpisodesLoading(true);
    resetMessages();
    try {
      const list = await apiLoadEpisodes();
      setEpisodes(Array.isArray(list) ? list : []);
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
    let ids = Array.isArray(episode.categoryIds)
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

    if (
      (!ids || ids.length === 0) &&
      Array.isArray(episode.episodeCategories) &&
      episode.episodeCategories.length
    ) {
      const ecs = episode.episodeCategories;
      if (typeof ecs[0] === "number") {
        ids = ecs;
      } else if (typeof ecs[0] === "object") {
        ids = ecs
          .map(
            (x) =>
              x?.categoryId ??
              x?.CategoryId ??
              x?.category?.id ??
              x?.Category?.id ??
              x?.id ??
              x?.Id,
          )
          .filter((v) => typeof v === "number");
      }
    }

    setEditSelectedCategoryIds(ids);

    setEditEpisodeForm({
      title: episode.title || "",
      description: episode.description || "",
      season:
        episode.season === null || episode.season === undefined
          ? ""
          : String(episode.season),
      isPublished: !!episode.isPublished,
      isPremium: !!episode.isPremium,
      file: null,
    });

    setShowEditEpisode(true);
  }

  function openAddCategory() {
    resetMessages();
    setNewCategoryName("");
    setShowAddCategory(true);
  }

  function openDeleteCategory() {
    resetMessages();
    setDeleteCategoryId("");
    setShowDeleteCategory(true);
  }

  async function handleDeleteCategorySubmit(e) {
    e.preventDefault();
    resetMessages();

    const idNum = Number(deleteCategoryId);
    if (!idNum || Number.isNaN(idNum)) {
      setErrorMsg("Please select a category to delete.");
      return;
    }

    const cat = categories.find((c) => c.id === idNum);
    const ok = window.confirm(
      `Delete category "${cat?.name ?? idNum}"?\n\nThis cannot be undone.`,
    );
    if (!ok) return;

    setDeletingCategory(true);
    try {
      await apiDeleteCategory(idNum);
      setSuccessMsg("Category deleted.");
      setShowDeleteCategory(false);

      setSelectedCategoryIds((prev) => prev.filter((x) => x !== idNum));
      setEditSelectedCategoryIds((prev) => prev.filter((x) => x !== idNum));

      await loadCategories();
      await loadEpisodes();
    } catch (err) {
      setErrorMsg(err?.message || "Failed to delete category.");
    } finally {
      setDeletingCategory(false);
    }
  }

  async function handleCreateEpisodeSubmit(e) {
    e.preventDefault();
    resetMessages();

    try {
      if (!createEpisodeForm.title.trim())
        throw new Error("Title is required.");
      if (!createEpisodeForm.file) throw new Error("Audio file is required.");

      await apiCreateEpisode(createEpisodeForm, selectedCategoryIds);

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

      await apiUpdateEpisode(
        editEpisodeId,
        editEpisodeForm,
        editSelectedCategoryIds,
      );

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
      await apiDeleteEpisode(id);
      setSuccessMsg("Episode deleted.");
      await loadEpisodes();
    } catch (e) {
      setErrorMsg(e?.message || "Delete failed.");
    }
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
      await apiCreateCategory(name);
      setSuccessMsg("Category created.");
      setShowAddCategory(false);
      await loadCategories();
    } catch (e2) {
      setErrorMsg(e2?.message || "Failed to create category.");
    } finally {
      setAddingCategory(false);
    }
  }

  const filteredEpisodes = useMemo(() => {
    const q = episodeQuery.trim().toLowerCase();
    if (!q) return episodes;
    return episodes.filter((x) => (x?.title || "").toLowerCase().includes(q));
  }, [episodes, episodeQuery]);

  useEffect(() => setEpisodePage(1), [episodeQuery, episodes]);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(filteredEpisodes.length / episodePageSize)),
    [filteredEpisodes.length, episodePageSize],
  );

  useEffect(() => {
    if (episodePage > totalPages) setEpisodePage(totalPages);
  }, [episodePage, totalPages]);

  const pagedEpisodes = useMemo(() => {
    const safe = Math.min(Math.max(1, episodePage), totalPages);
    const start = (safe - 1) * episodePageSize;
    return filteredEpisodes.slice(start, start + episodePageSize);
  }, [filteredEpisodes, episodePage, episodePageSize, totalPages]);

  useEffect(() => {
    loadEpisodes();
    loadCategories();
  }, []);

  function closeModals() {
    setShowCreateEpisode(false);
    setShowEditEpisode(false);
    setEditEpisodeId(null);

    setShowAddCategory(false);

    setSelectedCategoryIds([]);
    setEditSelectedCategoryIds([]);

    setShowDeleteCategory(false);
    setDeleteCategoryId("");
  }

  return (
    <>
      <div className="glass-card p-3">
        <div className="d-flex flex-wrap gap-2 align-items-center mb-3">
          <input
            className="searchbox flex-grow-1"
            placeholder="Search by title..."
            value={episodeQuery}
            onChange={(e) => setEpisodeQuery(e.target.value)}
          />

          <span className="stat-pill">
            Showing <b>{pagedEpisodes.length}</b> of{" "}
            <b>{filteredEpisodes.length}</b> (total {episodes.length})
          </span>
        </div>

        <div className="d-flex flex-wrap gap-2 mb-3">
          <button
            className="btn btn-soft"
            onClick={loadEpisodes}
            disabled={episodesLoading}
          >
            {episodesLoading ? "Refreshing..." : "Refresh"}
          </button>
          <button className="btn btn-brand" onClick={openCreateEpisode}>
            + Create Episode
          </button>
          <button className="btn btn-soft" onClick={openAddCategory}>
            + Add Category
          </button>
          <button className="btn btn-soft" onClick={openDeleteCategory}>
            - Delete Category
          </button>
        </div>

        {episodesLoading ? (
          <div className="text-center text-muted py-4">Loading...</div>
        ) : filteredEpisodes.length === 0 ? (
          <div className="text-center text-muted py-4">No episodes found.</div>
        ) : (
          <div className="d-grid gap-3">
            {pagedEpisodes.map((e) => {
              const labels = getEpisodeCategoryLabels(e, categories);

              return (
                <div key={e.id} className="row-card">
                  <div className="d-flex justify-content-between align-items-start gap-3">
                    <div className="flex-grow-1" style={{ minWidth: 0 }}>
                      <div className="d-flex align-items-center gap-2 flex-wrap">
                        <span className="badge-soft">{e.id}</span>

                        <span
                          className={`badge-soft ${e.isPublished ? "badge-ok" : "badge-draft"}`}
                        >
                          {e.isPublished ? "Published" : "Draft"}
                        </span>

                        {labels?.length ? (
                          <span className="badge-soft badge-info">
                            {labels.join(", ")}
                          </span>
                        ) : (
                          <span className="badge-soft">—</span>
                        )}

                        <span className="badge-soft">
                          Season: {e.season ?? "—"}
                        </span>
                        <span className="badge-soft">
                          Duration: {secondsToMinSec(e.durationSeconds)}
                        </span>
                        <span className="badge-soft">
                          Plays: {e.playCount ?? 0}
                        </span>
                      </div>

                      <div className="mt-2 row-title text-truncate">
                        {e.title}
                      </div>
                      <div className="row-desc text-truncate">
                        {e.description || "—"}
                      </div>

                      {e.audioUrl ? (
                        <audio
                          className="audio-slim mt-2"
                          controls
                          preload="none"
                          src={e.audioUrl}
                        />
                      ) : null}

                      <div
                        className="mt-2 small"
                        style={{ color: "var(--muted)" }}
                      >
                        Published: {formatDate(e.publishedDate)}
                      </div>
                    </div>

                    <div className="d-flex gap-2 flex-shrink-0">
                      <button
                        className="btn btn-action btn-action-edit"
                        onClick={() => openEditEpisode(e)}
                        type="button"
                      >
                        Edit
                      </button>

                      <button
                        className="btn btn-action btn-action-delete"
                        onClick={() => handleDeleteEpisode(e.id)}
                        type="button"
                      >
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
            page={episodePage}
            setPage={setEpisodePage}
            pageSize={episodePageSize}
            setPageSize={setEpisodePageSize}
            totalPages={totalPages}
          />
        </div>
      </div>

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
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={() => setShowAddCategory(false)}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={addingCategory || !newCategoryName.trim()}
              >
                {addingCategory ? "Adding..." : "Add"}
              </button>
            </div>
          </form>
        </Modal>
      ) : null}

      {showDeleteCategory ? (
        <Modal
          title="Delete Category"
          onClose={() => setShowDeleteCategory(false)}
        >
          <form onSubmit={handleDeleteCategorySubmit}>
            <div className="mb-3">
              <label className="form-label">Select category</label>

              <select
                className="form-select"
                value={deleteCategoryId}
                onChange={(e) => setDeleteCategoryId(e.target.value)}
              >
                <option value="">-- Select --</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} (#{c.id})
                  </option>
                ))}
              </select>

              <div className="form-text">
                You can only delete categories that are not used by any episodes.
              </div>
            </div>

            <div className="d-flex justify-content-end gap-2">
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={() => setShowDeleteCategory(false)}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="btn btn-danger"
                disabled={deletingCategory || !deleteCategoryId}
              >
                {deletingCategory ? "Deleting..." : "Delete"}
              </button>
            </div>
          </form>
        </Modal>
      ) : null}
    </>
  );
}
