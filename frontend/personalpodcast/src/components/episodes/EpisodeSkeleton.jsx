export default function EpisodeSkeleton() {
  return (
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
  );
}