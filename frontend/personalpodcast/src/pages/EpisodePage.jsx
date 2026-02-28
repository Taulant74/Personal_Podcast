import { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { API_BASE, apiUrl } from "../config/api";

import "../components/episodes/episodeStyles.css";

import EpisodeFilters from "../components/episodes/EpisodeFilters";
import EpisodePagination from "../components/episodes/EpisodePagination";
import EpisodeSkeleton from "../components/episodes/EpisodeSkeleton";
import EpisodeCard from "../components/episodes/EpisodeCard";
import EpisodePlayerModal from "../components/episodes/EpisodePlayerModal";

import {
  formatDuration,
  getEpisodeId,
} from "../components/episodes/episodeHelpers";

export default function EpisodePage() {
  const api = useMemo(() => {
    return axios.create({
      baseURL: API_BASE || undefined,
    });
  }, []);

  const { authFetch } = useAuth();

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
    setDuration(0);
    setIsPlaying(false);

    const id = getEpisodeId(episode);
    if (!id) return;

    const isPremium = episode?.isPremium ?? episode?.IsPremium ?? false;

    if (isPremium) {
      setAccessByEpisodeId((prev) => ({
        ...prev,
        [id]: { state: "loading" },
      }));
      fetchAccess(id);
      return;
    }

    const audioUrl = episode?.audioUrl ?? episode?.AudioUrl ?? null;
    setAccessByEpisodeId((prev) => ({
      ...prev,
      [id]: { state: "owned", episode: { ...episode, audioUrl } },
    }));
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
    setDuration(0);
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
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().catch(() => {});
      setIsPlaying(true);
    }
  };

  const handleFreePlay = (episode) => {
    const id = getEpisodeId(episode);
    const audioUrl = episode?.audioUrl ?? episode?.AudioUrl ?? null;

    if (!id) return;

    if (!audioUrl) {
      console.error("No audio URL available.");
      return;
    }

    setAccessByEpisodeId((prev) => ({
      ...prev,
      [id]: { state: "owned", episode: { ...episode, audioUrl } },
    }));

    requestAnimationFrame(() => {
      if (audioRef.current) {
        audioRef.current.src = audioUrl;
        audioRef.current.play().catch(() => {});
      }
    });

    incrementPlayOnce(id);
  };

  const handleAudioPlay = () => {
    setIsPlaying(true);
    const id = getEpisodeId(activeEpisode);
    incrementPlayOnce(id);
  };

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await api.get("/api/categories");
        if (!cancelled) {
          setCategories(Array.isArray(res.data) ? res.data : []);
        }
      } catch {
        if (!cancelled) {
          setCategories([]);
        }
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
      } catch {
        if (!cancelled) {
          setEpisodes([]);
          setTotal(0);
          setMsg(
            "Failed to load episodes. Check if backend is running and CORS is enabled.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
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
  }, [episodes, accessByEpisodeId]);

  const clearDisabled =
    !searchText.trim() &&
    !selectedCategoryId &&
    !query.trim() &&
    categoryId == null;

  const activeEpisodeId = getEpisodeId(activeEpisode);
  const activeAccess = activeEpisodeId
    ? accessByEpisodeId[activeEpisodeId]
    : null;

  const hasToken = !!localStorage.getItem("accessToken");

  return (
    <div>
      <div
        className="container pp-container px-5 mb-5"
        style={{ backgroundColor: "#37353E", color: "#D3DAD9" }}
      >
        <div className="pp-hero text-main">
          <h1 className="pp-title">All episodes. One place.</h1>
          <p className="pp-subtitle">
            Browse your entire library and press play instantly - now with
            search.
          </p>
        </div>

        <EpisodeFilters
          loading={loading}
          episodesCount={episodes.length}
          total={total}
          searchText={searchText}
          setSearchText={setSearchText}
          selectedCategoryId={selectedCategoryId}
          setSelectedCategoryId={setSelectedCategoryId}
          categories={categories}
          onSearch={() => {
            setQuery(searchText.trim());
            setCategoryId(
              selectedCategoryId ? Number(selectedCategoryId) : null,
            );
            setPage(1);
          }}
          onClear={() => {
            setSearchText("");
            setSelectedCategoryId("");
            setQuery("");
            setCategoryId(null);
            setPage(1);
          }}
          clearDisabled={clearDisabled}
        />

        {msg && !loading && <div className="alert pp-alert p-4 mb-4">{msg}</div>}

        <EpisodePagination
          page={page}
          totalPages={totalPages}
          onPrev={() => setPage((p) => Math.max(1, p - 1))}
          onNext={() => setPage((p) => Math.min(totalPages, p + 1))}
        />

        {loading && <EpisodeSkeleton />}

        {!loading && episodes.length > 0 && (
          <div className="row g-3">
            {episodes.map((ep) => {
              const id = getEpisodeId(ep);

              return (
                <EpisodeCard
                  key={id}
                  episode={ep}
                  access={id ? accessByEpisodeId[id] : null}
                  hasToken={hasToken}
                  onOpen={openPlayer}
                  onOrder={(episodeId) => {
                    window.location.href = `/order/${episodeId}`;
                  }}
                  formatDuration={formatDuration}
                />
              );
            })}
          </div>
        )}
      </div>

      <EpisodePlayerModal
        open={playerOpen}
        episode={activeEpisode}
        access={activeAccess}
        onClose={closePlayer}
        onLogin={() => {
          window.location.href = "/login";
        }}
        onOrder={(episodeId) => {
          window.location.href = `/order/${episodeId}`;
        }}
        onRetry={fetchAccess}
        onFreePlay={handleFreePlay}
        audioRef={audioRef}
        isPlaying={isPlaying}
        currentTime={currentTime}
        duration={duration}
        playbackRate={playbackRate}
        onSeek={(time) => {
          if (audioRef.current) {
            audioRef.current.currentTime = time;
          }
        }}
        onSkip={skip}
        onTogglePlayPause={togglePlayPause}
        onSetSpeed={setSpeed}
        onAudioPlay={handleAudioPlay}
        onAudioPause={() => setIsPlaying(false)}
        onAudioTimeUpdate={(time) => setCurrentTime(time)}
        onAudioLoadedMetadata={(nextDuration) => setDuration(nextDuration)}
        onAudioEnded={() => setIsPlaying(false)}
      />
    </div>
  );
}