export default function EpisodeFilters({
  loading,
  episodesCount,
  total,
  searchText,
  setSearchText,
  selectedCategoryId,
  setSelectedCategoryId,
  categories,
  onSearch,
  onClear,
  clearDisabled,
}) {
  const actionBtnStyle = {
    color: "rgba(233,238,252,0.92)",
    border: "1px solid rgba(255,255,255,0.12)",
    fontWeight: 800,
    borderRadius: 999,
  };

  return (
    <div className="d-flex flex-wrap gap-2 align-items-end justify-content-between mb-3">
      <div>
        <h4 className="m-0" style={{ fontWeight: 900, letterSpacing: -0.3 }}>
          Episodes
        </h4>

        <div className="pp-muted small">
          {loading ? "Loading…" : `Showing: ${episodesCount} / Total: ${total}`}
        </div>
      </div>

      <div className="d-flex flex-wrap gap-2 align-items-center">
        <input
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          placeholder="Search publisher or title…"
          className="pp-filter-control pp-search-input"
        />

        <select
        value={selectedCategoryId}
        onChange={(e) => setSelectedCategoryId(e.target.value)}
        className="pp-filter-control pp-select-input"
        >
        <option value="" style={{ color: "#111" }}>
            All categories
        </option>

        {categories.map((c) => (
            <option key={c.id} value={c.id} style={{ color: "#111" }}>
            {c.name}
            </option>
        ))}
        </select>

        <button
          type="button"
          className="btn pp-glass"
          onClick={onSearch}
          style={{ ...actionBtnStyle, padding: "8px 14px" }}
        >
          Search
        </button>

        <button
          type="button"
          className="btn pp-glass"
          onClick={onClear}
          disabled={clearDisabled}
          style={{
            ...actionBtnStyle,
            padding: "8px 12px",
            opacity: clearDisabled ? 0.6 : 1,
          }}
        >
          Clear
        </button>
      </div>
    </div>
  );
}