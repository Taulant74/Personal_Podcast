import { getEpisodeCategories, getEpisodeId } from "./episodeHelpers";

export default function EpisodePlayerModal({
  open,
  episode,
  access,
  onClose,
  onLogin,
  onOrder,
  onRetry,
  onFreePlay,
  audioRef,
  isPlaying,
  currentTime,
  duration,
  playbackRate,
  onSeek,
  onSkip,
  onTogglePlayPause,
  onSetSpeed,
  onAudioPlay,
  onAudioPause,
  onAudioTimeUpdate,
  onAudioLoadedMetadata,
  onAudioEnded,
}) {
  if (!open || !episode) return null;

  const id = getEpisodeId(episode);
  const title = episode?.title ?? episode?.Title;
  const description = episode?.description ?? episode?.Description;
  const season = episode?.season ?? episode?.Season;
  const durationValue = episode?.durationSeconds ?? episode?.DurationSeconds;
  const playCount = episode?.playCount ?? episode?.PlayCount;
  const categories = getEpisodeCategories(episode);
  const isPremium = episode?.isPremium ?? episode?.IsPremium ?? false;

  const chipStyle = {
    borderRadius: 999,
    padding: "7px 10px",
    fontWeight: 800,
    fontSize: 12,
    background: "rgba(255,255,255,0.08)",
    border: "1px solid rgba(255,255,255,0.12)",
    color: "rgba(233,238,252,0.88)",
  };

  const actionBtnStyle = {
    width: "100%",
    color: "rgba(233,238,252,0.92)",
    border: "1px solid rgba(255,255,255,0.12)",
    fontWeight: 800,
    borderRadius: 999,
    padding: "10px 14px",
    cursor: "pointer",
  };

  return (
    <div
      className="pp-modal-overlay"
      onClick={onClose}
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
          type="button"
          onClick={onClose}
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
            (e.currentTarget.style.background = "rgba(255,255,255,0.14)")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.background = "rgba(255,255,255,0.08)")
          }
          aria-label="Close"
        >
          <i className="bi bi-x-lg" aria-hidden="true"></i>
        </button>

        <div style={{ marginBottom: 28 }}>
          <h2
            style={{
              margin: 0,
              fontSize: "1.4rem",
              fontWeight: 900,
              marginBottom: 12,
              color: "#ffffff",
            }}
          >
            {title}
          </h2>

          {description && (
            <p
              style={{
                margin: 0,
                color: "rgba(233,238,252,0.78)",
                fontSize: "0.95rem",
                lineHeight: 1.5,
              }}
            >
              {description}
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
            {categories.length > 0 && (
              <span className="pp-badge" style={chipStyle}>
                <i className="bi bi-tag me-1" aria-hidden="true"></i>
                {categories.join(", ")}
              </span>
            )}

            {season != null && (
              <span style={chipStyle}>
                <i className="bi bi-tv me-1" aria-hidden="true"></i>
                Season {season}
              </span>
            )}

            {durationValue ? (
              <span style={chipStyle}>
                <i className="bi bi-clock me-1" aria-hidden="true"></i>
                {Math.floor(durationValue / 60)}m{" "}
                {String(durationValue % 60).padStart(2, "0")}s
              </span>
            ) : null}

            {playCount != null && (
              <span style={chipStyle}>
                <i className="bi bi-play-fill me-1" aria-hidden="true"></i>
                {playCount} plays
              </span>
            )}
          </div>
        </div>

        {!id ? (
          <div className="text-danger">Invalid episode.</div>
        ) : !access || access.state === "loading" ? (
          <div className="pp-muted">Checking access…</div>
        ) : access.state === "not_logged_in" ? (
          <button
            type="button"
            className="btn pp-glass"
            onClick={onLogin}
            style={actionBtnStyle}
          >
            <i
              className="bi bi-box-arrow-in-right me-1"
              aria-hidden="true"
            ></i>
            Log in
          </button>
        ) : access.state === "not_owned" ? (
          !isPremium ? (
            <button
              type="button"
              className="btn pp-glass"
              onClick={() => onFreePlay(episode)}
              style={actionBtnStyle}
            >
              <i className="bi bi-play-fill me-1" aria-hidden="true"></i>
              Play (Free)
            </button>
          ) : (
            <button
              type="button"
              className="btn pp-glass"
              onClick={() => onOrder(id)}
              style={actionBtnStyle}
            >
              <i className="bi bi-lock-fill me-1" aria-hidden="true"></i>
              Order to Unlock
            </button>
          )
        ) : access.state === "owned" ? (
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
              onPlay={onAudioPlay}
              onPause={onAudioPause}
              onTimeUpdate={(e) => onAudioTimeUpdate(e.target.currentTime)}
              onLoadedMetadata={(e) => onAudioLoadedMetadata(e.target.duration)}
              onEnded={onAudioEnded}
              style={{ display: "none" }}
            >
              <source src={access.episode?.audioUrl ?? access.episode?.AudioUrl} />
            </audio>

            <div style={{ marginBottom: 12 }}>
              <input
                type="range"
                min="0"
                max={duration || 0}
                value={currentTime}
                onChange={(e) => onSeek(parseFloat(e.target.value))}
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
                type="button"
                onClick={() => onSkip(-15)}
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
                  e.currentTarget.style.background = "rgba(255,255,255,0.14)";
                  e.currentTarget.style.transform = "translateY(-1px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "rgba(255,255,255,0.08)";
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                <i
                  className="bi bi-skip-backward-fill me-1"
                  aria-hidden="true"
                ></i>
                -15s
              </button>

              <button
                type="button"
                onClick={onTogglePlayPause}
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
                  e.currentTarget.style.background = "rgba(255,255,255,0.14)";
                  e.currentTarget.style.transform = "scale(1.05)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "rgba(255,255,255,0.10)";
                  e.currentTarget.style.transform = "scale(1)";
                }}
              >
                <i
                  className={`bi ${isPlaying ? "bi-pause-fill" : "bi-play-fill"}`}
                  aria-hidden="true"
                ></i>
              </button>

              <button
                type="button"
                onClick={() => onSkip(15)}
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
                  e.currentTarget.style.background = "rgba(255,255,255,0.14)";
                  e.currentTarget.style.transform = "translateY(-1px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "rgba(255,255,255,0.08)";
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                +15s
                <i
                  className="bi bi-skip-forward-fill ms-1"
                  aria-hidden="true"
                ></i>
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
                  type="button"
                  key={rate}
                  onClick={() => onSetSpeed(rate)}
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
                      e.currentTarget.style.background = "rgba(255,255,255,0.12)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (playbackRate !== rate) {
                      e.currentTarget.style.background = "rgba(255,255,255,0.08)";
                    }
                  }}
                >
                  {rate}x
                </button>
              ))}
            </div>
          </div>
        ) : (
          <button
            type="button"
            className="btn pp-glass"
            onClick={() => onRetry(id)}
            style={actionBtnStyle}
          >
            <i className="bi bi-arrow-clockwise me-1" aria-hidden="true"></i>
            Retry
          </button>
        )}
      </div>
    </div>
  );
}