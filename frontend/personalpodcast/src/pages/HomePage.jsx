import { useEffect, useMemo, useState, useRef } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { API_BASE, apiUrl } from "../config/api";
export default function HomePage() {
  const api = useMemo(() => {
    return axios.create({
      baseURL: API_BASE || undefined,
    });
  }, []);

  const { authFetch, isLoggedIn } = useAuth();

  const [episodes, setEpisodes] = useState([]);
  const [msg, setMsg] = useState("Loading episodes...");
  const [loading, setLoading] = useState(false);

  const [searchText, setSearchText] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [query, setQuery] = useState("");

  const [categoryId, setCategoryId] = useState(null);

  const [categories, setCategories] = useState([]);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(12);
  const [total, setTotal] = useState(0);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const countedPlaysRef = useRef(new Set());

  const [playerOpen, setPlayerOpen] = useState(false);
  const [activeEpisode, setActiveEpisode] = useState(null);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef(null);

  const [accessByEpisodeId, setAccessByEpisodeId] = useState({});

  const getEpisodeId = (ep) => ep?.id ?? ep?.Id;

  const fetchAccess = async (episodeId) => {
    const res = await authFetch(apiUrl(`/api/orders/episodes/${episodeId}`), {
      method: "GET",
    });

    if (res.status === 200) {
      const data = await res.json();
      setAccessByEpisodeId((prev) => ({
        ...prev,
        [episodeId]: { state: "owned", episode: data },
      }));
      return;
    }

    if (res.status === 404) {
      setAccessByEpisodeId((prev) => ({
        ...prev,
        [episodeId]: { state: "not_owned" },
      }));
      return;
    }

    if (res.status === 401) {
      setAccessByEpisodeId((prev) => ({
        ...prev,
        [episodeId]: { state: "not_logged_in" },
      }));
      return;
    }

    setAccessByEpisodeId((prev) => ({
      ...prev,
      [episodeId]: { state: "error" },
    }));
  };

  const orderEpisode = async (episodeId) => {
    const res = await authFetch(apiUrl("/api/orders"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ episodeId }),
    });

    if (res.status === 200) {
      await fetchAccess(episodeId);
      const owned = accessByEpisodeId[episodeId]?.state === "owned";
      if (!owned) {
        const check = await authFetch(
          apiUrl(`/api/orders/episodes/${episodeId}`),
          {
            method: "GET",
          },
        );
        if (check.status === 200) {
          const data = await check.json();
          setAccessByEpisodeId((prev) => ({
            ...prev,
            [episodeId]: { state: "owned", episode: data },
          }));
          openPlayer(data);
        }
      } else {
        openPlayer(accessByEpisodeId[episodeId].episode);
      }
      return;
    }

    if (res.status === 401) {
      setAccessByEpisodeId((prev) => ({
        ...prev,
        [episodeId]: { state: "not_logged_in" },
      }));
      return;
    }
  };

  const incrementPlayOnce = async (episodeId) => {
    if (!episodeId) return;

    if (countedPlaysRef.current.has(episodeId)) return;

    countedPlaysRef.current.add(episodeId);

    try {
      const res = await api.post(`/api/Episodes/${episodeId}/play`);

      setEpisodes((prev) =>
        prev.map((e) => {
          const id = e.id ?? e.Id;
          if (id !== episodeId) return e;

          const current = e.playCount ?? e.PlayCount ?? 0;
          const newCount =
            res?.data && typeof res.data.playCount === "number"
              ? res.data.playCount
              : current + 1;

          if ("playCount" in e) return { ...e, playCount: newCount };
          return { ...e, PlayCount: newCount };
        }),
      );
    } catch (err) {
      countedPlaysRef.current.delete(episodeId);
      console.error("Failed to increment play count:", err);
    }
  };

  const openPlayer = (episode) => {
    setActiveEpisode(episode);
    setPlayerOpen(true);
    setCurrentTime(0);
    setIsPlaying(false);
    incrementPlayOnce(episode.id ?? episode.Id);
    const id = getEpisodeId(episode);
    if (id) {
      setAccessByEpisodeId((prev) => ({
        ...prev,
        [id]: { state: "loading" },
      }));
      fetchAccess(id);
    }
  };

  const closePlayer = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setPlayerOpen(false);
    setActiveEpisode(null);
    setIsPlaying(false);
    setCurrentTime(0);
    setPlaybackRate(1);
  };

  const skip = (seconds) => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.max(
        0,
        audioRef.current.currentTime + seconds,
      );
    }
  };

  const setSpeed = (rate) => {
    setPlaybackRate(rate);
    if (audioRef.current) {
      audioRef.current.playbackRate = rate;
    }
  };

  const togglePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play().catch(() => {});
        setIsPlaying(true);
      }
    }
  };

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await api.get("/api/categories");
        if (!cancelled) setCategories(Array.isArray(res.data) ? res.data : []);
      } catch {
        if (!cancelled) setCategories([]);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [api]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && playerOpen) {
        closePlayer();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [playerOpen]);

  useEffect(() => {
    let cancelled = false;

    const t = setTimeout(async () => {
      try {
        setLoading(true);
        setMsg(query.trim() ? "Searching episodes..." : "Loading episodes...");

        const res = await api.get("/api/Episodes/search", {
          params: {
            Q: query.trim() || undefined,
            CategoryId: categoryId ?? undefined,
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
            setMsg(
              items.length
                ? ""
                : "No episodes yet. Upload one from the admin page.",
            );
          }
        }
      } catch (err) {
        if (!cancelled) {
          setEpisodes([]);
          setTotal(0);
          setMsg(
            "Failed to load episodes. Check if backend is running and CORS is enabled.",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 350);

    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [api, query, categoryId, page, pageSize]);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) return;

    const ids = episodes.map(getEpisodeId).filter(Boolean);
    ids.forEach((id) => {
      if (!accessByEpisodeId[id]) {
        setAccessByEpisodeId((prev) => ({
          ...prev,
          [id]: { state: "loading" },
        }));
        fetchAccess(id);
      }
    });
  }, [episodes]);

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

    return cats && cats.length ? (
      <span className="pp-badge">🏷 {cats.join(", ")}</span>
    ) : null;
  }

  return (
    <div>
      <style>{`
      .cap-expanded{
  width: 100%;
}

.cap-skip-row{
  display:flex;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 6px;
}

.cap-skip{
  flex:1;
  border-radius: 999px;
  border: 1px solid rgba(255,255,255,0.12);
  background: rgba(255,255,255,0.08);
  color: rgba(233,238,252,0.9);
  font-weight: 800;
  font-size: 12px;
  padding: 6px 10px;
  transition: background .15s ease, transform .15s ease;
  cursor: pointer;
}

.cap-skip:hover{
  background: rgba(255,255,255,0.14);
  transform: translateY(-1px);
}
      .cap{
  width: 56px;
  height: 44px;
  border-radius: 999px;
  display:flex;
  align-items:center;
  justify-content:center;
  background: rgba(0,0,0,0.26);
  border: 1px solid rgba(255,255,255,0.12);
  transition: width 220ms ease, border-radius 220ms ease;
  overflow: hidden;
}
.cap--expanded{
  width: 100%;
  border-radius: 16px;
  padding: 8px;
  justify-content: flex-start;
}
.cap-btn{
  width: 40px;
  height: 40px;
  border-radius: 999px;
  border: 1px solid rgba(255,255,255,0.16);
  background: rgba(255,255,255,0.10);
  color: rgba(233,238,252,0.95);
  font-weight: 900;
  cursor: pointer;
}
.cap-btn:hover{
  background: rgba(255,255,255,0.14);
}
  audio {
  width: 100%;
  border-radius: 12px;

  filter: invert(1) hue-rotate(180deg) brightness(0.9);
}
.cap-audio{
  width: 100%;
  border-radius: 12px;
}
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

      <div
        className="container pp-container px-5"
        style={{ backgroundColor: "#37353E" }}
      >
        <div className="pp-hero">
          <h1 className="pp-title">All episodes. One place.</h1>
          <p className="pp-subtitle">
            Browse your entire library and press play instantly — now with
            search.
          </p>
        </div>

        <div className="d-flex flex-wrap gap-2 align-items-end justify-content-between mb-3">
          <div>
            <h4
              className="m-0"
              style={{ fontWeight: 900, letterSpacing: -0.3 }}
            >
              Episodes
            </h4>
            <div className="pp-muted small">
              {loading
                ? "Loading…"
                : `Showing: ${episodes.length} / Total: ${total}`}
            </div>
          </div>

          <div className="d-flex flex-wrap gap-2 align-items-center">
            <div className="pp-glass" style={{ padding: 6, borderRadius: 999 }}>
              <input
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                placeholder="Search publisher or title…"
                className="form-control pp-search-input"
                style={{
                  width: 320,
                  border: "none",
                  background: "transparent",
                  color: "rgba(233,238,252,0.92)",
                  outline: "none",
                  boxShadow: "none",
                }}
              />
            </div>

            <div className="pp-glass" style={{ padding: 6, borderRadius: 999 }}>
              <select
                value={selectedCategoryId}
                onChange={(e) => setSelectedCategoryId(e.target.value)}
                className="form-select"
                style={{
                  border: "none",
                  background: "transparent",
                  color: "rgba(233,238,252,0.92)",
                  outline: "none",
                  boxShadow: "none",
                  width: 180,
                }}
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
            </div>

            <button
              className="btn pp-glass"
              onClick={() => {
                setQuery(searchText.trim());
                setCategoryId(selectedCategoryId ? Number(selectedCategoryId) : null);
                setPage(1);
              }}
              style={{
                color: "rgba(233,238,252,0.92)",
                border: "1px solid rgba(255,255,255,0.12)",
                fontWeight: 800,
                borderRadius: 999,
                padding: "8px 14px",
              }}
            >
              Search
            </button>

            <button
              className="btn pp-glass"
              onClick={() => {
                setSearchText("");
                setSelectedCategoryId("");
                setQuery("");
                setCategoryId(null);
                setPage(1);
              }}
              disabled={
                !searchText.trim() &&
                !selectedCategoryId &&
                !query.trim() &&
                categoryId == null
              }
              style={{
                color: "rgba(233,238,252,0.92)",
                border: "1px solid rgba(255,255,255,0.12)",
                fontWeight: 800,
                borderRadius: 999,
                padding: "8px 12px",
                opacity:
                  !searchText.trim() &&
                  !selectedCategoryId &&
                  !query.trim() &&
                  categoryId == null
                    ? 0.6
                    : 1,
              }}
            >
              Clear
            </button>
          </div>
        </div>

        {msg && !loading && (
          <div className="alert pp-alert p-4 mb-4">{msg}</div>
        )}

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
                  <div
                    className="pp-skeleton"
                    style={{ width: "75%", height: 16 }}
                  />
                  <div className="pp-skeleton mt-3" style={{ width: "90%" }} />
                  <div className="pp-skeleton mt-2" style={{ width: "80%" }} />
                  <div className="d-flex gap-2 mt-3">
                    <div
                      className="pp-skeleton"
                      style={{ width: 70, height: 26 }}
                    />
                    <div
                      className="pp-skeleton"
                      style={{ width: 90, height: 26 }}
                    />
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
                          <div className="pp-epDesc">
                            {ep.description ?? ep.Description}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="pp-metaRow">
                      {renderCategories(ep)}
                      {(ep.season ?? ep.Season) != null && (
                        <span className="pp-badge">
                          📺 Season {ep.season ?? ep.Season}
                        </span>
                      )}
                      {(ep.durationSeconds ?? ep.DurationSeconds) ? (
                        <span className="pp-badge">
                          ⏱{" "}
                          {formatDuration(
                            ep.durationSeconds ?? ep.DurationSeconds,
                          )}
                        </span>
                      ) : null}
                      {(ep.playCount ?? ep.PlayCount) != null && (
                        <span className="pp-badge pp-badge--plays">
                          ▶ {ep.playCount ?? ep.PlayCount} plays
                        </span>
                      )}
                    </div>

                    <button
                      className="btn pp-glass"
                      onClick={() => openPlayer(ep)}
                      style={{
                        marginTop: 14,
                        color: "rgba(233,238,252,0.92)",
                        border: "1px solid rgba(255,255,255,0.12)",
                        fontWeight: 800,
                        borderRadius: 999,
                        padding: "8px 14px",
                        width: "100%",
                        cursor: "pointer",
                      }}
                    >
                      Open
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {playerOpen && activeEpisode && (
        <div
          className="pp-modal-overlay"
          onClick={closePlayer}
          onKeyDown={(e) => e.key === "Escape" && closePlayer()}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.6)",
            backdropFilter: "blur(8px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1050,
          }}
        >
          <div
            className="pp-modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "rgba(255,255,255,0.07)",
              border: "1px solid rgba(255,255,255,0.12)",
              boxShadow: "0 20px 60px rgba(0,0,0,0.35)",
              backdropFilter: "blur(14px)",
              borderRadius: 20,
              padding: 32,
              maxWidth: "90vw",
              width: 600,
              maxHeight: "90vh",
              overflowY: "auto",
              position: "relative",
            }}
          >
            <button
              onClick={closePlayer}
              style={{
                position: "absolute",
                top: 16,
                right: 16,
                width: 36,
                height: 36,
                borderRadius: 999,
                border: "1px solid rgba(255,255,255,0.12)",
                background: "rgba(255,255,255,0.08)",
                color: "rgba(233,238,252,0.92)",
                fontSize: 18,
                fontWeight: 900,
                cursor: "pointer",
                transition: "background .15s ease",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
              onMouseEnter={(e) =>
                (e.target.style.background = "rgba(255,255,255,0.14)")
              }
              onMouseLeave={(e) =>
                (e.target.style.background = "rgba(255,255,255,0.08)")
              }
              aria-label="Close"
            >
              ✕
            </button>

            <div style={{ marginBottom: 28 }}>
              <h2
                style={{
                  margin: 0,
                  fontSize: "1.4rem",
                  fontWeight: 900,
                  marginBottom: 12,
                }}
              >
                {activeEpisode.title ?? activeEpisode.Title}
              </h2>
              {(activeEpisode.description ?? activeEpisode.Description) && (
                <p
                  style={{
                    margin: 0,
                    color: "rgba(233,238,252,0.78)",
                    fontSize: "0.95rem",
                    lineHeight: 1.5,
                  }}
                >
                  {activeEpisode.description ?? activeEpisode.Description}
                </p>
              )}

              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 8,
                  marginTop: 14,
                }}
              >
                {(() => {
                  const cats = Array.isArray(activeEpisode?.categories)
                    ? activeEpisode.categories
                    : Array.isArray(activeEpisode?.Categories)
                      ? activeEpisode.Categories
                      : null;
                  return cats && cats.length ? (
                    <span
                      className="pp-badge"
                      style={{
                        borderRadius: 999,
                        padding: "7px 10px",
                        fontWeight: 800,
                        fontSize: 12,
                        background: "rgba(255,255,255,0.08)",
                        border: "1px solid rgba(255,255,255,0.12)",
                        color: "rgba(233,238,252,0.88)",
                      }}
                    >
                      🏷 {cats.join(", ")}
                    </span>
                  ) : null;
                })()}

                {(activeEpisode.season ?? activeEpisode.Season) != null && (
                  <span
                    style={{
                      borderRadius: 999,
                      padding: "7px 10px",
                      fontWeight: 800,
                      fontSize: 12,
                      background: "rgba(255,255,255,0.08)",
                      border: "1px solid rgba(255,255,255,0.12)",
                      color: "rgba(233,238,252,0.88)",
                    }}
                  >
                    📺 Season {activeEpisode.season ?? activeEpisode.Season}
                  </span>
                )}

                {(activeEpisode.durationSeconds ??
                activeEpisode.DurationSeconds) ? (
                  <span
                    style={{
                      borderRadius: 999,
                      padding: "7px 10px",
                      fontWeight: 800,
                      fontSize: 12,
                      background: "rgba(255,255,255,0.08)",
                      border: "1px solid rgba(255,255,255,0.12)",
                      color: "rgba(233,238,252,0.88)",
                    }}
                  >
                    ⏱{" "}
                    {(() => {
                      const s =
                        activeEpisode.durationSeconds ??
                        activeEpisode.DurationSeconds;
                      const m = Math.floor(s / 60);
                      const sec = s % 60;
                      return `${m}m ${String(sec).padStart(2, "0")}s`;
                    })()}
                  </span>
                ) : null}

                {(activeEpisode.playCount ?? activeEpisode.PlayCount) !=
                  null && (
                  <span
                    style={{
                      borderRadius: 999,
                      padding: "7px 10px",
                      fontWeight: 800,
                      fontSize: 12,
                      background: "rgba(255,255,255,0.08)",
                      border: "1px solid rgba(255,255,255,0.12)",
                      color: "rgba(233,238,252,0.88)",
                    }}
                  >
                    ▶ {activeEpisode.playCount ?? activeEpisode.PlayCount} plays
                  </span>
                )}
              </div>
            </div>

            {(() => {
              const id = getEpisodeId(activeEpisode);
              const access = id ? accessByEpisodeId[id] : null;

              if (!id) {
                return <div className="text-danger">Invalid episode.</div>;
              }

              if (!access || access.state === "loading") {
                return <div className="pp-muted">Checking access…</div>;
              }

              if (access.state === "not_logged_in") {
                return (
                  <button
                    className="btn pp-glass"
                    onClick={() => (window.location.href = "/login")}
                    style={{
                      width: "100%",
                      color: "rgba(233,238,252,0.92)",
                      border: "1px solid rgba(255,255,255,0.12)",
                      fontWeight: 800,
                      borderRadius: 999,
                      padding: "10px 14px",
                      cursor: "pointer",
                    }}
                  >
                    Log in
                  </button>
                );
              }

              if (access.state === "not_owned") {
                return (
                  <button
                    className="btn pp-glass"
                    onClick={() => (window.location.href = `/order/${id}`)}
                    style={{
                      width: "100%",
                      color: "rgba(233,238,252,0.92)",
                      border: "1px solid rgba(255,255,255,0.12)",
                      fontWeight: 800,
                      borderRadius: 999,
                      padding: "10px 14px",
                      cursor: "pointer",
                    }}
                  >
                    Order
                  </button>
                );
              }

              if (access.state === "owned") {
                const src =
                  access.episode?.audioUrl ?? access.episode?.AudioUrl;

                return (
                  <div
                    style={{
                      background: "rgba(0,0,0,0.22)",
                      border: "1px solid rgba(255,255,255,0.10)",
                      borderRadius: 14,
                      padding: 16,
                      marginBottom: 20,
                    }}
                  >
                    <audio
                      ref={audioRef}
                      onPlay={() => setIsPlaying(true)}
                      onPause={() => setIsPlaying(false)}
                      onTimeUpdate={(e) => setCurrentTime(e.target.currentTime)}
                      onLoadedMetadata={(e) => setDuration(e.target.duration)}
                      onEnded={() => setIsPlaying(false)}
                      style={{ display: "none" }}
                    >
                      <source src={src} />
                    </audio>

                    <div style={{ marginBottom: 12 }}>
                      <input
                        type="range"
                        min="0"
                        max={duration || 0}
                        value={currentTime}
                        onChange={(e) => {
                          if (audioRef.current) {
                            audioRef.current.currentTime = parseFloat(
                              e.target.value,
                            );
                          }
                        }}
                        style={{
                          width: "100%",
                          height: 6,
                          borderRadius: 3,
                          background: "rgba(255,255,255,0.10)",
                          outline: "none",
                          cursor: "pointer",
                          accentColor: "rgba(233,238,252,0.92)",
                        }}
                      />
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          marginTop: 8,
                          color: "rgba(233,238,252,0.72)",
                          fontSize: "0.85rem",
                        }}
                      >
                        <span>
                          {Math.floor(currentTime / 60)}:
                          {String(Math.floor(currentTime % 60)).padStart(
                            2,
                            "0",
                          )}
                        </span>
                        <span>
                          {Math.floor(duration / 60)}:
                          {String(Math.floor(duration % 60)).padStart(2, "0")}
                        </span>
                      </div>
                    </div>

                    <div
                      style={{
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        gap: 12,
                        marginBottom: 14,
                      }}
                    >
                      <button
                        onClick={() => skip(-15)}
                        style={{
                          flex: 1,
                          borderRadius: 999,
                          border: "1px solid rgba(255,255,255,0.12)",
                          background: "rgba(255,255,255,0.08)",
                          color: "rgba(233,238,252,0.9)",
                          fontWeight: 800,
                          fontSize: 12,
                          padding: "6px 10px",
                          transition:
                            "background .15s ease, transform .15s ease",
                          cursor: "pointer",
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.background = "rgba(255,255,255,0.14)";
                          e.target.style.transform = "translateY(-1px)";
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.background = "rgba(255,255,255,0.08)";
                          e.target.style.transform = "translateY(0)";
                        }}
                      >
                        ⏮ -15s
                      </button>

                      <button
                        onClick={togglePlayPause}
                        style={{
                          width: 50,
                          height: 50,
                          borderRadius: 999,
                          border: "1px solid rgba(255,255,255,0.12)",
                          background: "rgba(255,255,255,0.10)",
                          color: "rgba(233,238,252,0.95)",
                          fontWeight: 900,
                          fontSize: 20,
                          cursor: "pointer",
                          transition:
                            "background .15s ease, transform .15s ease",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.background = "rgba(255,255,255,0.14)";
                          e.target.style.transform = "scale(1.05)";
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.background = "rgba(255,255,255,0.10)";
                          e.target.style.transform = "scale(1)";
                        }}
                      >
                        {isPlaying ? "⏸" : "▶"}
                      </button>

                      <button
                        onClick={() => skip(15)}
                        style={{
                          flex: 1,
                          borderRadius: 999,
                          border: "1px solid rgba(255,255,255,0.12)",
                          background: "rgba(255,255,255,0.08)",
                          color: "rgba(233,238,252,0.9)",
                          fontWeight: 800,
                          fontSize: 12,
                          padding: "6px 10px",
                          transition:
                            "background .15s ease, transform .15s ease",
                          cursor: "pointer",
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.background = "rgba(255,255,255,0.14)";
                          e.target.style.transform = "translateY(-1px)";
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.background = "rgba(255,255,255,0.08)";
                          e.target.style.transform = "translateY(0)";
                        }}
                      >
                        +15s ⏭
                      </button>
                    </div>

                    <div
                      style={{
                        display: "flex",
                        gap: 6,
                        flexWrap: "wrap",
                        justifyContent: "center",
                      }}
                    >
                      {[0.5, 0.75, 1, 1.25, 1.5, 2].map((rate) => (
                        <button
                          key={rate}
                          onClick={() => setSpeed(rate)}
                          style={{
                            borderRadius: 999,
                            border: "1px solid rgba(255,255,255,0.12)",
                            background:
                              playbackRate === rate
                                ? "rgba(255,255,255,0.16)"
                                : "rgba(255,255,255,0.08)",
                            color: "rgba(233,238,252,0.9)",
                            fontWeight: 800,
                            fontSize: 11,
                            padding: "5px 10px",
                            transition: "background .15s ease",
                            cursor: "pointer",
                          }}
                          onMouseEnter={(e) => {
                            if (playbackRate !== rate) {
                              e.target.style.background =
                                "rgba(255,255,255,0.12)";
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (playbackRate !== rate) {
                              e.target.style.background =
                                "rgba(255,255,255,0.08)";
                            }
                          }}
                        >
                          {rate}x
                        </button>
                      ))}
                    </div>
                  </div>
                );
              }

              return (
                <button
                  className="btn pp-glass"
                  onClick={() => fetchAccess(id)}
                  style={{
                    width: "100%",
                    color: "rgba(233,238,252,0.92)",
                    border: "1px solid rgba(255,255,255,0.12)",
                    fontWeight: 800,
                    borderRadius: 999,
                    padding: "10px 14px",
                    cursor: "pointer",
                  }}
                >
                  Retry
                </button>
              );
            })()}
          </div>
        </div>
      )}

      <div className="pp-footer py-3">
        <div className="container pp-container d-flex flex-wrap gap-2 justify-content-between align-items-center">
          <small>Built for your MVP: browse + listen.</small>
          <small className="pp-muted">Admin upload page is separate.</small>
        </div>
      </div>
    </div>
  );
}
