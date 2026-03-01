import "./css/Footer.css";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="pp-site-footer">
      <div className="container px-5">
        <div className="pp-site-footer__panel">
          <div className="row g-4">
            <div className="col-12 col-lg-4">
              <div className="pp-footer-brand">Gjirafa Podcast</div>
              <p className="pp-footer-text pp-footer-text--lead">
                All episodes. One place.
              </p>
              <p className="pp-footer-text">
                Browse your library, search faster, discover new episodes, and
                enjoy a simple listening experience built around ease and focus.
              </p>

              <div className="d-flex flex-wrap gap-2 mt-3">
                <span className="pp-footer-chip">Browse</span>
                <span className="pp-footer-chip">Search</span>
                <span className="pp-footer-chip">Listen</span>
                <span className="pp-footer-chip">Discover</span>
              </div>
            </div>

            <div className="col-6 col-md-4 col-lg-2">
              <h6 className="pp-footer-heading">Explore</h6>
              <div className="pp-footer-links">
                <a href="/" className="pp-footer-link">Home</a>
                <a href="/episodes" className="pp-footer-link">Episodes</a>
                <a href="/about" className="pp-footer-link">About Us</a>
                <a href="/help" className="pp-footer-link">Help</a>
              </div>
            </div>

            <div className="col-6 col-md-4 col-lg-3">
              <h6 className="pp-footer-heading">Your Account</h6>
              <div className="pp-footer-links">
                <a href="/login" className="pp-footer-link">Log In</a>
                <a href="/register" className="pp-footer-link">Create Account</a>
                <a href="/my-episodes" className="pp-footer-link">My Episodes</a>
              </div>
            </div>

            <div className="col-12 col-md-4 col-lg-3">
              <h6 className="pp-footer-heading">Listening</h6>
              <div className="pp-footer-links">
                <a href="/episodes" className="pp-footer-link">Browse Library</a>
                <a href="/episodes" className="pp-footer-link">Search Episodes</a>
                <a href="/help" className="pp-footer-link">Listening Help</a>
                <a href="/about" className="pp-footer-link">How It Works</a>
              </div>
            </div>
          </div>

          <div className="pp-site-footer__bottom">
            <div className="pp-footer-meta">
              © {year} Gjirafa Podcast. Built for smooth browsing, search, and listening.
            </div>
            <div className="pp-footer-meta">
              Designed for a simple, focused user experience.
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}