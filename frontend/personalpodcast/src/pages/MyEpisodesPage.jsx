import { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { API_BASE, apiUrl } from "../config/api";
export default function MyEpisodesPage() {
  const api = useMemo(() => {
    return axios.create({
      baseURL: API_BASE || undefined
    });
  }, []);

  const { authFetch, isLoggedIn } = useAuth();

  const [episodes, setEpisodes] = useState([]);
  const [msg, setMsg] = useState("Loading your episodes...");
  const [loading, setLoading] = useState(false);

  // player state (per-episode)
  const audioRefs = useRef({});
  const [playbackRateById, setPlaybackRateById] = useState({});
  const [isPlayingById, setIsPlayingById] = useState({});
  const [currentTimeById, setCurrentTimeById] = useState({});
  const [durationById, setDurationById] = useState({});

  const countedPlaysRef = useRef(new Set());

  const incrementPlayOnce = async (episodeId) => {
  if (!episodeId) return;
  if (countedPlaysRef.current.has(episodeId)) return;

  countedPlaysRef.current.add(episodeId);

  try {
    await api.post(`/api/Episodes/${episodeId}/play`);
  } catch (err) {
    countedPlaysRef.current.delete(episodeId);
    console.error("Failed to increment play count:", err);
  }
};
  const getEpisodeId = (ep) => ep?.id ?? ep?.Id;

  useEffect(() => {
    let cancelled = false;

    const loadMyEpisodes = async () => {
      if (!isLoggedIn) {
        setEpisodes([]);
        setMsg("Please log in to see your ordered episodes.");
        return;
      }

      try {
        setLoading(true);
        setMsg("Loading your episodes...");

          const res = await authFetch(apiUrl("/api/orders/my-episodes"), {
          method: "GET",
        });

        if (res.status === 401) {
          setEpisodes([]);
          setMsg("Please log in to see your ordered episodes.");
          return;
        }

        if (!res.ok) {
          setEpisodes([]);
          setMsg("Failed to load your episodes.");
          return;
        }

        const data = await res.json();
        const items = Array.isArray(data) ? data : Array.isArray(data.items) ? data.items : [];

        if (!cancelled) {
          setEpisodes(items);
          setMsg(items.length ? "" : "You haven't ordered any episodes yet.");
        }
      } catch (e) {
        if (!cancelled) {
          setEpisodes([]);
          setMsg("Failed to load your episodes. Check backend + auth.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadMyEpisodes();

    return () => {
      cancelled = true;
    };
  }, [isLoggedIn, authFetch]);

  function formatDuration(seconds) {
    if (!seconds || Number.isNaN(seconds)) return null;
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
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

  const getAudioRef = (id) => {
    if (!audioRefs.current[id]) audioRefs.current[id] = { current: null };
    return audioRefs.current[id];
  };

  const setSpeed = (id, rate) => {
    setPlaybackRateById((p) => ({ ...p, [id]: rate }));
    const a = audioRefs.current[id]?.current;
    if (a) a.playbackRate = rate;
  };

  const skip = (id, seconds) => {
    const a = audioRefs.current[id]?.current;
    if (!a) return;
    a.currentTime = Math.max(0, a.currentTime + seconds);
  };

  const togglePlayPause = (id) => {
    const a = audioRefs.current[id]?.current;
    if (!a) return;

    const isPlaying = !!isPlayingById[id];
    if (isPlaying) {
      a.pause();
      setIsPlayingById((p) => ({ ...p, [id]: false }));
    } else {
      a.play().catch(() => {});
      setIsPlayingById((p) => ({ ...p, [id]: true }));
    }
  };

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

  /* Make native controls dark */
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

      <div className="container pp-container px-5" style={{ backgroundColor: "#37353E" }}>
        <div className="pp-hero">
          <h1 className="pp-title">My episodes</h1>
          <p className="pp-subtitle">Everything you’ve ordered — ready to play.</p>
        </div>

        {msg && !loading && <div className="alert pp-alert p-4 mb-4">{msg}</div>}

        {loading && (
          <div className="row g-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div className="col-12 col-md-6 col-lg-4" key={i}>
                <div className="card pp-glass p-3">
                  <div className="pp-skeleton" style={{ width: "75%", height: 16 }} />
                  <div className="pp-skeleton mt-3" style={{ width: "90%" }} />
                  <div className="pp-skeleton mt-2" style={{ width: "80%" }} />
                  <div className="pp-skeleton mt-4" style={{ height: 90 }} />
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && episodes.length > 0 && (
          <div className="row g-3">
            {episodes.map((ep) => {
              const id = getEpisodeId(ep);
              const src = ep.audioUrl ?? ep.AudioUrl;

              const playbackRate = playbackRateById[id] ?? 1;
              const isPlaying = !!isPlayingById[id];
              const currentTime = currentTimeById[id] ?? 0;
              const duration = durationById[id] ?? 0;

              return (
                <div className="col-12 col-md-6 col-lg-4" key={id}>
                  <div className="card pp-glass pp-epCard h-100">
                    <div className="card-body p-4 d-flex flex-column">
                      <div className="pp-cardTop">
                        <div className="flex-grow-1">
                          <h5 className="pp-epTitle">{ep.title ?? ep.Title}</h5>
                          {(ep.description ?? ep.Description) && (
                            <div className="pp-epDesc">{ep.description ?? ep.Description}</div>
                          )}
                        </div>
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
                          <span className="pp-badge pp-badge--plays">▶ {ep.playCount ?? ep.PlayCount} plays</span>
                        )}
                      </div>

                      {!src ? (
                        <div className="mt-auto text-danger small pt-3">No audio URL found for this episode.</div>
                      ) : (
                        <div
                          style={{
                            background: "rgba(0,0,0,0.22)",
                            border: "1px solid rgba(255,255,255,0.10)",
                            borderRadius: 14,
                            padding: 16,
                            marginTop: 14,
                          }}
                        >
                         <audio
  ref={(el) => {
    const r = getAudioRef(id);
    r.current = el;
  }}
  onPlay={() => {
    setIsPlayingById((p) => ({ ...p, [id]: true }));
    incrementPlayOnce(id);
  }}
  onPause={() => setIsPlayingById((p) => ({ ...p, [id]: false }))}
  onTimeUpdate={(e) =>
    setCurrentTimeById((p) => ({ ...p, [id]: e.target.currentTime }))
  }
  onLoadedMetadata={(e) =>
    setDurationById((p) => ({ ...p, [id]: e.target.duration }))
  }
  onEnded={() => setIsPlayingById((p) => ({ ...p, [id]: false }))}
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
                                const a = audioRefs.current[id]?.current;
                                if (a) a.currentTime = parseFloat(e.target.value);
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
                                {String(Math.floor(currentTime % 60)).padStart(2, "0")}
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
                              onClick={() => skip(id, -15)}
                              style={{
                                flex: 1,
                                borderRadius: 999,
                                border: "1px solid rgba(255,255,255,0.12)",
                                background: "rgba(255,255,255,0.08)",
                                color: "rgba(233,238,252,0.9)",
                                fontWeight: 800,
                                fontSize: 12,
                                padding: "6px 10px",
                                transition: "background .15s ease, transform .15s ease",
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
                              onClick={() => togglePlayPause(id)}
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
                                transition: "background .15s ease, transform .15s ease",
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
                              {isPlaying ? "⏸" : <i className="bi bi-play-fill"></i>}
                            </button>

                            <button
                              onClick={() => skip(id, 15)}
                              style={{
                                flex: 1,
                                borderRadius: 999,
                                border: "1px solid rgba(255,255,255,0.12)",
                                background: "rgba(255,255,255,0.08)",
                                color: "rgba(233,238,252,0.9)",
                                fontWeight: 800,
                                fontSize: 12,
                                padding: "6px 10px",
                                transition: "background .15s ease, transform .15s ease",
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

                          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "center" }}>
                            {[0.5, 0.75, 1, 1.25, 1.5, 2].map((rate) => (
                              <button
                                key={rate}
                                onClick={() => setSpeed(id, rate)}
                                style={{
                                  borderRadius: 999,
                                  border: "1px solid rgba(255,255,255,0.12)",
                                  background:
                                    playbackRate === rate ? "rgba(255,255,255,0.16)" : "rgba(255,255,255,0.08)",
                                  color: "rgba(233,238,252,0.9)",
                                  fontWeight: 800,
                                  fontSize: 11,
                                  padding: "5px 10px",
                                  transition: "background .15s ease",
                                  cursor: "pointer",
                                }}
                                onMouseEnter={(e) => {
                                  if (playbackRate !== rate) e.target.style.background = "rgba(255,255,255,0.12)";
                                }}
                                onMouseLeave={(e) => {
                                  if (playbackRate !== rate) e.target.style.background = "rgba(255,255,255,0.08)";
                                }}
                              >
                                {rate}x
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
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