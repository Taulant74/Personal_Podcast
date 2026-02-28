import React from "react";
import "./AboutPage.css";

const AboutPage = () => (
  <div className="about-page">
    {/* Hero Section */}
    <section className="about-hero">
      <div className="container py-5">
        <h1 className="about-title">About Personal Podcast</h1>
        <p className="about-subtitle">
          Empowering creators and connecting listeners through the art of audio storytelling
        </p>
      </div>
    </section>

    {/* Main Content */}
    <div className="container py-5">
      {/* Mission Section */}
      <section className="about-section mb-5">
        <div className="row align-items-center">
          <div className="col-lg-6 mb-4 mb-lg-0">
            <h2 className="about-section-title">Our Mission</h2>
            <p className="about-text">
              Personal Podcast is a dynamic audio platform designed for creators and listeners alike. 
              We're committed to democratizing podcast distribution, allowing independent voices to 
              share their stories, knowledge, and passion with a global audience.
            </p>
            <p className="about-text">
              Whether you're a publisher sharing your voice with the world, an avid listener exploring 
              fresh perspectives, or an admin overseeing quality content—Personal Podcast brings everyone together.
            </p>
          </div>
          <div className="col-lg-6">
            <div className="about-highlight-box">
              <div className="highlight-icon">🎙️</div>
              <h3>Creators First</h3>
              <p>Tools built for publishers to manage, publish, and monetize their content with ease.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="about-section mb-5">
        <h2 className="about-section-title text-center mb-5">Why Choose Personal Podcast?</h2>
        <div className="row g-4">
          <div className="col-md-6 col-lg-3">
            <div className="feature-card">
              <div className="feature-icon">📚</div>
              <h4>Browse by Category</h4>
              <p>Discover episodes organized by topics you care about.</p>
            </div>
          </div>
          <div className="col-md-6 col-lg-3">
            <div className="feature-card">
              <div className="feature-icon">🔐</div>
              <h4>Secure Ownership</h4>
              <p>Own and access premium episodes with secure licensing.</p>
            </div>
          </div>
          <div className="col-md-6 col-lg-3">
            <div className="feature-card">
              <div className="feature-icon">🌐</div>
              <h4>Global Reach</h4>
              <p>Connect with listeners and creators from around the world.</p>
            </div>
          </div>
          <div className="col-md-6 col-lg-3">
            <div className="feature-card">
              <div className="feature-icon">⚙️</div>
              <h4>Creator Tools</h4>
              <p>Manage, publish, and track your podcast performance effortlessly.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Community Section */}
      <section className="about-section py-5">
        <div className="community-box">
          <h2 className="about-section-title text-center mb-4">Join Our Growing Community</h2>
          <p className="about-text text-center mb-4">
            Personal Podcast is more than just a platform—it's a community of creators, listeners, and 
            storytellers. Discover exceptional content, support independent voices, and become part of the 
            future of audio entertainment.
          </p>
          <div className="text-center">
            <a href="/" className="btn btn-primary-custom btn-lg px-5">
              Start Listening Today
            </a>
          </div>
        </div>
      </section>
    </div>
  </div>
);

export default AboutPage;