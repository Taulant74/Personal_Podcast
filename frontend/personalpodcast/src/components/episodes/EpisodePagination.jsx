export default function EpisodePagination({ page, totalPages, onPrev, onNext }) {
  if (totalPages <= 1) return null;

  const btnStyle = {
    color: "rgba(233,238,252,0.92)",
    border: "1px solid rgba(255,255,255,0.12)",
    fontWeight: 800,
    borderRadius: 999,
    padding: "8px 12px",
  };

  return (
    <div className="d-flex justify-content-between align-items-center mb-3">
      <button
        type="button"
        className="btn pp-glass"
        onClick={onPrev}
        disabled={page === 1}
        style={{
          ...btnStyle,
          opacity: page === 1 ? 0.6 : 1,
          cursor: page === 1 ? "not-allowed" : "pointer",
        }}
      >
        <i className="bi bi-chevron-left me-1" aria-hidden="true"></i>
        Prev
      </button>

      <div className="pp-muted small">
        Page {page} / {totalPages}
      </div>

      <button
        type="button"
        className="btn pp-glass"
        onClick={onNext}
        disabled={page >= totalPages}
        style={{
          ...btnStyle,
          opacity: page >= totalPages ? 0.6 : 1,
          cursor: page >= totalPages ? "not-allowed" : "pointer",
        }}
      >
        Next
        <i className="bi bi-chevron-right ms-1" aria-hidden="true"></i>
      </button>
    </div>
  );
}