import { getEpisodeCategories, getEpisodeId } from "./episodeHelpers";

export default function EpisodeCard({
  episode,
  access,
  hasToken,
  onOpen,
  onOrder,
  formatDuration,
}) {
    const id = getEpisodeId(episode);
    const title = episode?.title ?? episode?.Title;
    const description = episode?.description ?? episode?.Description;
    const isPremium = episode?.isPremium ?? episode?.IsPremium ?? false;
    const season = episode?.season ?? episode?.Season;
    const durationValue = episode?.durationSeconds ?? episode?.DurationSeconds;
    const playCount = episode?.playCount ?? episode?.PlayCount;
    const categories = getEpisodeCategories(episode);
    const publisherName = episode?.publisherName ?? episode?.PublisherName; 
    const isChecking =
        isPremium && hasToken && (!access || access.state === "loading");

    const isOwned = !isPremium || access?.state === "owned";

  return (
    <div className="col-12 col-md-6 col-lg-4">
      <div className="card pp-glass pp-epCard h-100 border-0 shadow-sm">
        <div className="card-body p-4 d-flex flex-column">
          <div className="d-flex justify-content-between align-items-start gap-3 mb-3">
            <div className="d-flex align-items-start gap-3">
              <div
                className="rounded-4 d-flex align-items-center justify-content-center flex-shrink-0"
                style={{
                  width: 50,
                  height: 50,
                  background: "rgba(255,255,255,0.08)",
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
              >
                <i className="bi bi-headphones fs-5" aria-hidden="true"></i>
              </div>

              <div>
                <h5 className="pp-epTitle mb-1">{title}</h5>
                <div className="small pp-muted">
                  {isPremium ? "Premium episode" : "Free episode"}
                </div>
              </div>
            </div>

            {publisherName && (
            <div className="small pp-muted">
                <i className="bi bi-person me-1" aria-hidden="true"></i>
                {publisherName}
            </div>
            )}

            <span
              className={`badge rounded-pill px-3 py-2 fw-semibold ${
                isPremium ? "text-warning" : "text-success"
              }`}
              style={{
                background: isPremium
                  ? "rgba(221,168,83,0.12)"
                  : "rgba(34,197,94,0.12)",
                border: `1px solid ${
                  isPremium
                    ? "rgba(221,168,83,0.35)"
                    : "rgba(34,197,94,0.25)"
                }`,
              }}
            >
              {isPremium ? "Premium" : "Free"}
            </span>
          </div>

          {description && <p className="pp-epDesc mb-3">{description}</p>}

          <div className="d-flex flex-wrap gap-2 mb-3">
            {categories.length > 0 && (
              <span className="pp-badge">
                <i className="bi bi-tag me-1" aria-hidden="true"></i>
                {categories.join(", ")}
              </span>
            )}

            {season != null && (
              <span className="pp-badge">
                <i
                  className="bi bi-collection-play me-1"
                  aria-hidden="true"
                ></i>
                Season {season}
              </span>
            )}

            {durationValue ? (
              <span className="pp-badge">
                <i className="bi bi-clock me-1" aria-hidden="true"></i>
                {formatDuration(durationValue)}
              </span>
            ) : null}

            {playCount != null && (
              <span className="pp-badge">
                <i className="bi bi-play-fill me-1" aria-hidden="true"></i>
                {playCount} plays
              </span>
            )}
          </div>

          <div
            className="mt-auto pt-3"
            style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}
          >
            <div className="d-flex justify-content-between align-items-center small mb-3">
              <span className="pp-muted">
                {isOwned ? "Ready to listen" : "Unlock to listen"}
              </span>
              <span className="pp-muted">
                {durationValue ? formatDuration(durationValue) : "Audio"}
              </span>
            </div>

            <button
              type="button"
              className={`btn w-100 rounded-pill fw-bold ${
                isOwned ? "btn-light" : "btn-outline-light"
              }`}
              onClick={() => {
                if (!id || isChecking) return;

                if (isOwned) {
                  onOpen(episode);
                } else {
                  onOrder(id);
                }
              }}
              disabled={isChecking}
            >
              {isChecking ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" />
                  Checking...
                </>
              ) : isOwned ? (
                <>
                  <i
                    className="bi bi-play-circle me-2"
                    aria-hidden="true"
                  ></i>
                  Open Episode
                </>
              ) : (
                <>
                  <i className="bi bi-lock me-2" aria-hidden="true"></i>
                  Order Episode
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}