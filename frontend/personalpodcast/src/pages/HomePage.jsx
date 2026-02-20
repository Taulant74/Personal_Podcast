import { useEffect, useMemo, useState } from "react";
import axios from "axios";

export default function HomePage() {
  const api = useMemo(() => {
    return axios.create({
      baseURL: "https://localhost:7261", // qeta e leni sipas portit t backendit local deri te hostojm backendin
    });
  }, []);

  const [episodes, setEpisodes] = useState([]);
  const [msg, setMsg] = useState("Loading episodes...");
  const [loading, setLoading] = useState(false);

  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(12);
  const [total, setTotal] = useState(0);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  useEffect(() => {
    let cancelled = false;

    const t = setTimeout(async () => {
      try {
        setLoading(true);
        setMsg(query.trim() ? "Searching episodes..." : "Loading episodes...");

        const res = await api.get("/api/Episodes/search", {
          params: {
            Q: query.trim() || undefined,
            Page: page,
            PageSize: pageSize,
          },
        });

        const data = res.data || {};
        const items = Array.isArray(data.items)
          ? data.items
          : Array.isArray(data.Items)
          ? data.Items
          : [];

        const totalCount =
          typeof data.total === "number"
            ? data.total
            : typeof data.Total === "number"
            ? data.Total
            : 0;

        if (!cancelled) {
          setEpisodes(items);
          setTotal(totalCount);

          if (query.trim()) {
            setMsg(items.length ? "" : `No results for "${query.trim()}".`);
          } else {
            setMsg(items.length ? "" : "No episodes yet. Upload one from the admin page.");
          }
        }
      } catch (err) {
        if (!cancelled) {
          setEpisodes([]);
          setTotal(0);
          setMsg("Failed to load episodes. Check if backend is running and CORS is enabled.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 350);

    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [api, query, page, pageSize]);

  function formatDuration(seconds) {
    if (!seconds || Number.isNaN(seconds)) return null;
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${String(s).padStart(2, "0")}s`;
  }

  function renderCategories(ep) {
    const cats = Array.isArray(ep?.categories)
      ? ep.categories
      : Array.isArray(ep?.Categories)
      ? ep.Categories
      : null;

    return cats && cats.length ? <span className="pp-badge">🏷 {cats.join(", ")}</span> : null;
  }

  return (
    <div>
      <style>{`
        .pp-container{ max-width: 1120px; }

        .pp-hero{ padding: 26px 0 12px; }
        .pp-title{
          font-weight: 900;
          letter-spacing: -0.6px;
          line-height: 1.02;
          font-size: clamp(2.1rem, 4vw, 3.2rem);
          margin: 0;
        }
        .pp-subtitle{
          margin-top: 10px;
          color: rgba(233,238,252,0.78);
          max-width: 58ch;
          font-size: 1.05rem;
        }

        .pp-glass{
          background: rgba(255,255,255,0.07);
          border: 1px solid rgba(255,255,255,0.12);
          box-shadow: 0 20px 60px rgba(0,0,0,0.35);
          backdrop-filter: blur(14px);
          border-radius: 18px;
        }

        .pp-muted{ color: rgba(233,238,252,0.72); }

        .pp-badge{
          border-radius: 999px;
          padding: 7px 10px;
          font-weight: 800;
          font-size: 12px;
          background: rgba(255,255,255,0.08);
          border: 1px solid rgba(255,255,255,0.12);
          color: rgba(233,238,252,0.88);
        }

        .pp-epCard{
          transition: transform .18s ease, box-shadow .18s ease, border-color .18s ease;
          overflow: hidden;
        }
        .pp-epCard:hover{
          transform: translateY(-4px);
          border-color: rgba(255,255,255,0.20);
          box-shadow: 0 24px 70px rgba(0,0,0,0.45);
        }

        .pp-cardTop{
          display:flex;
          justify-content:space-between;
          gap: 14px;
          align-items:flex-start;
        }

        .pp-epTitle{
          font-weight: 900;
          letter-spacing: -0.3px;
          margin: 0;
          font-size: 1.1rem;
        }

        .pp-epDesc{
          margin-top: 10px;
          color: rgba(233,238,252,0.78);
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .pp-metaRow{
          display:flex;
          flex-wrap:wrap;
          gap: 8px;
          margin-top: 12px;
        }

        .pp-audioWrap{
          margin-top: 14px;
          padding: 10px;
          border-radius: 14px;
          background: rgba(0,0,0,0.22);
          border: 1px solid rgba(255,255,255,0.10);
        }
        audio{ width: 100%; border-radius: 12px; }

        .pp-link{
          text-decoration: none;
          color: rgba(233,238,252,0.92);
          background: rgba(255,255,255,0.08);
          border: 1px solid rgba(255,255,255,0.12);
          padding: 8px 10px;
          border-radius: 999px;
          font-weight: 800;
          font-size: 12px;
          transition: transform .15s ease, background .15s ease;
          white-space: nowrap;
        }
        .pp-link:hover{
          transform: translateY(-1px);
          background: rgba(255,255,255,0.12);
          color: #fff;
        }

        .pp-alert{
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.12);
          color: rgba(233,238,252,0.85);
          border-radius: 14px;
        }

        .pp-skeleton{
          height: 14px;
          border-radius: 999px;
          background: linear-gradient(90deg, rgba(255,255,255,0.08), rgba(255,255,255,0.16), rgba(255,255,255,0.08));
          background-size: 200% 100%;
          animation: shimmer 1.15s infinite linear;
        }
        @keyframes shimmer{
          0%{ background-position: 200% 0; }
          100%{ background-position: -200% 0; }
        }

        .pp-footer{
          color: rgba(233,238,252,0.55);
          border-top: 1px solid rgba(255,255,255,0.10);
          background: rgba(255,255,255,0.04);
          backdrop-filter: blur(12px);
        }

        .pp-search-input::placeholder{
          color: rgba(233,238,252,0.65) !important;
          opacity: 1;
        }
      `}</style>

      <div className="container pp-container pb-5">
        <div className="pp-hero">
          <h1 className="pp-title">All episodes. One place.</h1>
          <p className="pp-subtitle">Browse your entire library and press play instantly — now with search.</p>
        </div>

        <div className="d-flex flex-wrap gap-2 align-items-end justify-content-between mb-3">
          <div>
            <h4 className="m-0" style={{ fontWeight: 900, letterSpacing: -0.3 }}>
              Episodes
            </h4>
            <div className="pp-muted small">
              {loading ? "Loading…" : `Showing: ${episodes.length} / Total: ${total}`}
            </div>
          </div>

          <div className="d-flex flex-wrap gap-2 align-items-center">
            <div className="pp-glass" style={{ padding: 6, borderRadius: 999 }}>
              <input
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setPage(1);
                }}
                placeholder="Search title, description, category…"
                className="form-control pp-search-input"
                style={{
                  width: 280,
                  border: "none",
                  background: "transparent",
                  color: "rgba(233,238,252,0.92)",
                  outline: "none",
                  boxShadow: "none",
                }}
              />
            </div>

            <button
              className="btn pp-glass"
              onClick={() => {
                setQuery("");
                setPage(1);
              }}
              disabled={!query.trim()}
              style={{
                color: "rgba(233,238,252,0.92)",
                border: "1px solid rgba(255,255,255,0.12)",
                fontWeight: 800,
                borderRadius: 999,
                padding: "8px 12px",
                opacity: query.trim() ? 1 : 0.6,
                cursor: query.trim() ? "pointer" : "not-allowed",
              }}
            >
              Clear
            </button>
          </div>
        </div>

        {msg && !loading && <div className="alert pp-alert p-4 mb-4">{msg}</div>}

        {!loading && totalPages > 1 && (
          <div className="d-flex justify-content-between align-items-center mb-3">
            <button
              className="btn pp-glass"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              style={{
                color: "rgba(233,238,252,0.92)",
                border: "1px solid rgba(255,255,255,0.12)",
                fontWeight: 800,
                borderRadius: 999,
                padding: "8px 12px",
                opacity: page === 1 ? 0.6 : 1,
                cursor: page === 1 ? "not-allowed" : "pointer",
              }}
            >
              ← Prev
            </button>

            <div className="pp-muted small">
              Page {page} / {totalPages}
            </div>

            <button
              className="btn pp-glass"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              style={{
                color: "rgba(233,238,252,0.92)",
                border: "1px solid rgba(255,255,255,0.12)",
                fontWeight: 800,
                borderRadius: 999,
                padding: "8px 12px",
                opacity: page >= totalPages ? 0.6 : 1,
                cursor: page >= totalPages ? "not-allowed" : "pointer",
              }}
            >
              Next →
            </button>
          </div>
        )}

        {loading && (
          <div className="row g-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div className="col-12 col-md-6 col-lg-4" key={i}>
                <div className="card pp-glass p-3">
                  <div className="pp-skeleton" style={{ width: "75%", height: 16 }} />
                  <div className="pp-skeleton mt-3" style={{ width: "90%" }} />
                  <div className="pp-skeleton mt-2" style={{ width: "80%" }} />
                  <div className="d-flex gap-2 mt-3">
                    <div className="pp-skeleton" style={{ width: 70, height: 26 }} />
                    <div className="pp-skeleton" style={{ width: 90, height: 26 }} />
                  </div>
                  <div className="pp-skeleton mt-4" style={{ height: 38 }} />
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && episodes.length > 0 && (
          <div className="row g-3">
            {episodes.map((ep) => (
              <div className="col-12 col-md-6 col-lg-4" key={ep.id ?? ep.Id}>
                <div className="card pp-glass pp-epCard h-100">
                  <div className="card-body p-4 d-flex flex-column">
                    <div className="pp-cardTop">
                      <div className="flex-grow-1">
                        <h5 className="pp-epTitle">{ep.title ?? ep.Title}</h5>
                        {(ep.description ?? ep.Description) && (
                          <div className="pp-epDesc">{ep.description ?? ep.Description}</div>
                        )}
                      </div>

                      {(ep.audioUrl ?? ep.AudioUrl) ? (
                        <a className="pp-link" href={ep.audioUrl ?? ep.AudioUrl} target="_blank" rel="noreferrer">
                          Open ↗
                        </a>
                      ) : (
                        <span className="pp-link" style={{ opacity: 0.6, cursor: "not-allowed" }}>
                          No audio
                        </span>
                      )}
                    </div>

                    <div className="pp-metaRow">
                      {renderCategories(ep)}
                      {(ep.season ?? ep.Season) != null && (
                        <span className="pp-badge">📺 Season {ep.season ?? ep.Season}</span>
                      )}
                      {(ep.durationSeconds ?? ep.DurationSeconds) ? (
                        <span className="pp-badge">
                          ⏱ {formatDuration(ep.durationSeconds ?? ep.DurationSeconds)}
                        </span>
                      ) : null}
                      {(ep.playCount ?? ep.PlayCount) != null && (
                        <span className="pp-badge">▶ {ep.playCount ?? ep.PlayCount} plays</span>
                      )}
                    </div>

                    {(ep.audioUrl ?? ep.AudioUrl) ? (
                      <div className="pp-audioWrap mt-auto">
                        <audio controls>
                          <source src={ep.audioUrl ?? ep.AudioUrl} />
                        </audio>
                      </div>
                    ) : (
                      <div className="mt-auto text-danger small pt-3">No audio URL found for this episode.</div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="pp-footer py-3">
        <div className="container pp-container d-flex flex-wrap gap-2 justify-content-between align-items-center">
          <small>Built for your MVP: browse + listen.</small>
          <small className="pp-muted">Admin upload page is separate.</small>
        </div>
      </div>
    </div>
  );
}
