import React from "react";

export default function EpisodeForm({
  form,
  setForm,
  onSubmit,
  submitLabel,
  requireFile,
  categories,
  selectedIds,
  setSelectedIds,
}) {
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
              categories.map((c) => {
                const checked = selectedIds?.includes(c.id);
                return (
                  <label
                    key={c.id}
                    className={`badge-soft ${checked ? "badge-info" : ""}`}
                    style={{
                      cursor: "pointer",
                      userSelect: "none",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() =>
                        setSelectedIds((prev) => (prev.includes(c.id) ? prev.filter((x) => x !== c.id) : [...prev, c.id]))
                      }
                      style={{ width: 16, height: 16 }}
                    />
                    {c.name}
                  </label>
                );
              })
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
            <label className="form-check-label" htmlFor="publishedSwitch" style={{ color: "var(--text)" }}>
              {form.isPublished ? "Published" : "Draft"}
            </label>
          </div>
        </div>

        <div className="col-12">
          <label className="form-label">
            Audio file{" "}
            {requireFile ? <span className="text-danger">*</span> : <span style={{ color: "var(--text)", opacity: 0.8 }}>(optional)</span>}
          </label>
          <input
            className="form-control"
            type="file"
            accept="audio/*"
            onChange={(e) => setForm((p) => ({ ...p, file: e.target.files?.[0] || null }))}
          />
          <div className="form-text" style={{ color: "var(--muted)" }}>
            Form key is <code>file</code> (matches backend <code>IFormFile file</code>).
          </div>
        </div>

        <div className="col-12 d-flex justify-content-end gap-2 mt-2">
          <button type="submit" className="btn btn-brand">
            {submitLabel}
          </button>
        </div>
      </div>
    </form>
  );
}