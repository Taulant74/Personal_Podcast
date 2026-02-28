import React from "react";

const HeroSection = () => {
  return (
    <section className="py-5">
      <div className="container">
        <div className="row align-items-center">

          <div className="col-lg-6 text-center text-lg-start mb-4 mb-lg-0">
            <h1 className="display-4 fw-bold text-main">
              Gjirafa Podcast
            </h1>
            <p className="lead mt-3 text-main">
              Listen, create, and share your favorite podcasts with the world. Join our community of podcast enthusiasts and discover new voices every day.
            </p>
            <button className="btn button-main btn-lg mt-3 text-black" onClick={() => window.location.href = '/episodes'}>
              Listen Now!
            </button>
          </div>

          <div className="col-lg-6 text-center">
            <img
              src="https://img.freepik.com/premium-photo/african-american-people-chatting-podcast-talk-show-recording-live-content-with-sound-equipment-studio-man-woman-broadcasting-online-discussion-channel-audience_482257-48352.jpg"
              alt="Hero"
              className="img-fluid rounded-4 shadow-lg"
            />
          </div>

        </div>
      </div>
    </section>
  );
};

export default HeroSection;