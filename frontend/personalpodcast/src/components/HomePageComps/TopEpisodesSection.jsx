import React, { useEffect, useState } from "react";
import { apiUrl } from "../../config/api.jsx";
import LoadingSpinner from "../LoadingSpinner.jsx";

function formatDuration(seconds) {
  if (!seconds) return "—";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function TopEpisodesSection() {
  const [episodes, setEpisodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchTopEpisodes = async () => {
      try {
        const res = await fetch(apiUrl("/api/episodes/top-by-category?limit=6"));
        if (!res.ok) throw new Error("Failed to fetch");

        const data = await res.json();
        setEpisodes(data);
      } catch (err) {
        console.error(err);
        setError("Failed to load episodes.");
      } finally {
        setLoading(false);
      }
    };

    fetchTopEpisodes();
  }, []);

  return (
    <section className="py-5">
      <div className="container">
        <h2 className="mb-4 text-center text-main" style={{fontSize: "3em"}}>
          What People Are Listening To
        </h2>

        {loading && <LoadingSpinner />}
        {error && <p className="text-danger text-center">{error}</p>}

        {!loading && episodes.map((ep) => (
          <div
            key={ep.episodeId}
            className="row align-items-center mb-4 p-4 rounded-5 shadow-sm"
            style={{ backgroundColor: "#44444E", color: "#D3DAD9" }}
          >
            <div className="col-md-8">

              <div className="mb-2">
                <span className="badge bg-secondary">
                  {ep.categoryName}
                </span>
              </div>

              <h4 className="fw-bold">{ep.title}</h4>

              <p className="text-light opacity-75">
                {ep.description}
              </p>

              <div className="small">
                <span className="me-3"><i class="bi bi-eye-fill"></i> {ep.playCount}</span>
                <span className="me-3">
                  <i class="bi bi-clock-history"></i> {formatDuration(ep.durationSeconds)}
                </span>
                {ep.publishedDate && (
                  <span>
                    <i class="bi bi-calendar"></i> {new Date(ep.publishedDate).toLocaleDateString()}
                  </span>
                )}
              </div>

            </div>

            {/* RIGHT SIDE - AUDIO PLAYER */}
            <div className="col-md-4 mt-3 mt-md-0">
              <audio
                controls
                src={ep.audioUrl}
                style={{ width: "100%" }}
              />
            </div>
          </div>
        ))}

      </div>
    </section>
  );
}

export default TopEpisodesSection;