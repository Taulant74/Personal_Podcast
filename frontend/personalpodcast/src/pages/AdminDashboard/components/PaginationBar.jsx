import React from "react";

export default function PaginationBar({ page, setPage, pageSize, setPageSize, totalPages }) {
  const go = (n) => setPage(Math.min(totalPages, Math.max(1, n)));

  return (
    <div
      className="d-flex flex-wrap gap-2 justify-content-between align-items-center"
      style={{ color: "var(--text)" }}
    >
      <div className="d-flex align-items-center gap-2">
        <span className="small" style={{ color: "var(--muted)" }}>
          Rows per page:
        </span>

        <select
          className="form-select form-select-sm admin-select"
          style={{ width: 110 }}
          value={pageSize}
          onChange={(e) => {
            setPageSize(Number(e.target.value));
            setPage(1);
          }}
        >
          {[5, 10, 20, 50].map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      </div>

      <div className="d-flex align-items-center gap-2">
        <button className="btn btn-soft action-btn" disabled={page <= 1} onClick={() => go(1)}>
          « First
        </button>
        <button className="btn btn-soft action-btn" disabled={page <= 1} onClick={() => go(page - 1)}>
          ‹ Prev
        </button>

        <span className="stat-pill" style={{ marginBottom: 0 }}>
          Page <b style={{ color: "var(--text)" }}>{page}</b> / {totalPages}
        </span>

        <button className="btn btn-soft action-btn" disabled={page >= totalPages} onClick={() => go(page + 1)}>
          Next ›
        </button>
        <button className="btn btn-soft action-btn" disabled={page >= totalPages} onClick={() => go(totalPages)}>
          Last »
        </button>
      </div>
    </div>
  );
}