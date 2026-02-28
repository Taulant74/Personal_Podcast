import React from "react";
import "./HelpPage.css";

const HelpPage = () => (
  <div className="help-page">
    {/* Hero Section */}
    <section className="help-hero">
      <div className="container py-5">
        <h1 className="help-title">Getting Started with Personal Podcast</h1>
        <p className="help-subtitle">
          A simple guide for new users to start listening to amazing podcasts
        </p>
      </div>
    </section>

    <div className="container py-5">
      {/* Step-by-step Guide */}
      <section className="help-section mb-5">
        <h2 className="help-section-title">How to Get Started</h2>
        
        {/* Step 1: Register */}
        <div className="step-card mb-4">
          <div className="step-number">1</div>
          <div className="step-content">
            <h3>Create Your Account</h3>
            <p>
              Getting started is easy! Click the <strong>"Sign Up"</strong> button in the top right corner 
              of the page.
            </p>
            <div className="step-details">
              <h5>What you'll need:</h5>
              <ul className="help-list">
                <li>A valid email address</li>
                <li>A strong password (at least 8 characters)</li>
                <li>Your first and last name</li>
                <li>Your age</li>
              </ul>
            </div>
            <div className="step-details">
              <h5>After registration:</h5>
              <ul className="help-list">
                <li>You'll receive a confirmation email</li>
                <li>Click the link to activate your account</li>
                <li>Log in with your email and password</li>
                <li>Start exploring immediately!</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Step 2: Browse Episodes */}
        <div className="step-card mb-4">
          <div className="step-number">2</div>
          <div className="step-content">
            <h3>Browse & Discover Episodes</h3>
            <p>
              Explore thousands of episodes across different categories and publishers.
            </p>
            <div className="step-details">
              <h5>You can browse in several ways:</h5>
              <ul className="help-list">
                <li><strong>Home Page</strong> – See featured episodes and trending content</li>
                <li><strong>Episodes</strong> – Browse all available episodes with search and filters</li>
                <li><strong>Categories</strong> – Filter by topic (News, Comedy, Education, etc.)</li>
                <li><strong>Search</strong> – Find specific episodes, publishers, or topics</li>
              </ul>
            </div>
            <div className="step-details">
              <h5>Helpful tips:</h5>
              <ul className="help-list">
                <li>Look for episode descriptions to understand the content</li>
                <li>Check the publisher name and episode duration</li>
                <li>See if an episode is free or requires purchase (Premium badge)</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Step 3: Play Episodes */}
        <div className="step-card mb-4">
          <div className="step-number">3</div>
          <div className="step-content">
            <h3>Listen to Free Episodes</h3>
            <p>
              Click on any episode to open the built-in audio player and start listening.
            </p>
            <div className="step-details">
              <h5>Using the player:</h5>
              <ul className="help-list">
                <li>Click <strong>Play</strong> to start listening</li>
                <li><strong>Pause</strong> anytime to stop</li>
                <li>Use the <strong>progress bar</strong> to jump to any part of the episode</li>
                <li>Adjust <strong>playback speed</strong> (0.5x to 2x) to listen faster or slower</li>
                <li>Your progress is <strong>saved automatically</strong> – resume where you left off</li>
              </ul>
            </div>
            <div className="step-details">
              <h5>Pro tips:</h5>
              <ul className="help-list">
                <li>Free episodes are available for all users</li>
                <li>Adjust playback speed to fit your listening habits</li>
                <li>Access the player from any device – your progress syncs across them</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Step 4: Order Premium Episodes */}
        <div className="step-card mb-4">
          <div className="step-number">4</div>
          <div className="step-content">
            <h3>Purchase Premium Episodes</h3>
            <p>
              Some episodes are premium content. Purchase them to own and access unlimited times.
            </p>
            <div className="step-details">
              <h5>How to purchase an episode:</h5>
              <ul className="help-list">
                <li>Find a premium episode (marked with <strong>"Premium"</strong> or <strong>"Order"</strong> button)</li>
                <li>Click the <strong>"Order"</strong> button on the episode</li>
                <li>You'll be taken to the <strong>checkout page</strong></li>
                <li>Enter your payment information (credit/debit card)</li>
                <li>Review the price and confirm the purchase</li>
                <li>Your episode access is <strong>activated immediately</strong></li>
              </ul>
            </div>
            <div className="step-details">
              <h5>After purchase:</h5>
              <ul className="help-list">
                <li>Access your purchased episodes anytime</li>
                <li>No expiration – you own the episodes forever</li>
                <li>View all your purchases in <strong>My Episodes</strong></li>
                <li>Download access details from your account</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Step 5: Manage Your Account */}
        <div className="step-card">
          <div className="step-number">5</div>
          <div className="step-content">
            <h3>Manage Your Account</h3>
            <p>
              Access your profile, viewing history, and purchased episodes from your user panel.
            </p>
            <div className="step-details">
              <h5>Click your username dropdown menu to:</h5>
              <ul className="help-list">
                <li>Access <strong>User Panel</strong> – Update profile and security settings</li>
                <li>View <strong>My Episodes</strong> – See all your purchased episodes</li>
                <li>Check your <strong>listening history</strong> and continue where you left off</li>
                <li>Manage your <strong>payment methods</strong></li>
                <li><strong>Logout</strong> from your account</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="help-section mb-5">
        <h2 className="help-section-title">Frequently Asked Questions</h2>
        <div className="faq-container">
          <div className="faq-item">
            <h4>Is it free to create an account?</h4>
            <p>
              Yes! Creating an account is completely free. You can listen to all free episodes without 
              any cost. Premium episodes are optional purchases.
            </p>
          </div>

          <div className="faq-item">
            <h4>Do I need an account to listen to free episodes?</h4>
            <p>
              You can browse episodes without an account, but you need to create an account to listen to 
              any episode. Registration takes less than 2 minutes!
            </p>
          </div>

          <div className="faq-item">
            <h4>How do I reset my password?</h4>
            <p>
              Click <strong>"Forgot Password"</strong> on the login page. Enter your email, and we'll send 
              you a secure link to reset your password within minutes.
            </p>
          </div>

          <div className="faq-item">
            <h4>Is my payment information safe?</h4>
            <p>
              Absolutely! We use industry-standard encryption and PCI-DSS compliant payment processing to 
              protect all transactions. Your payment data is secure.
            </p>
          </div>

          <div className="faq-item">
            <h4>Can I access my purchased episodes on multiple devices?</h4>
            <p>
              Yes! Log in to your account on any device, and you'll have instant access to all your 
              purchased episodes across phones, tablets, and computers.
            </p>
          </div>

          <div className="faq-item">
            <h4>What if I have trouble logging in?</h4>
            <p>
              Check that your email and password are correct. You can reset your password anytime using 
              the "Forgot Password" link on the login page.
            </p>
          </div>

          <div className="faq-item">
            <h4>Can I listen offline?</h4>
            <p>
              Currently, episodes stream from our platform. However, you can resume listening from where 
              you left off on any device by logging into your account.
            </p>
          </div>

          <div className="faq-item">
            <h4>How do I get a refund for a purchased episode?</h4>
            <p>
              Contact our support team for refund requests within 7 days of purchase. We're happy to help 
              if there are any issues with your purchase.
            </p>
          </div>
        </div>
      </section>

      {/* Quick Tips */}
      <section className="help-section mb-5">
        <h2 className="help-section-title">Quick Tips for New Users</h2>
        <div className="tips-grid">
          <div className="tip-box">
            <div className="tip-icon">⭐</div>
            <h4>Explore Categories</h4>
            <p>Browse different categories to discover podcasts aligned with your interests.</p>
          </div>
          <div className="tip-box">
            <div className="tip-icon">🔔</div>
            <h4>Check New Episodes</h4>
            <p>Visit the Episodes page regularly to discover new content from your favorite publishers.</p>
          </div>
          <div className="tip-box">
            <div className="tip-icon">⏱️</div>
            <h4>Adjust Playback Speed</h4>
            <p>Speed up episodes to 1.5x or 2x to save time, or slow down to 0.75x for better comprehension.</p>
          </div>
          <div className="tip-box">
            <div className="tip-icon">📱</div>
            <h4>Cross-Device Sync</h4>
            <p>Your listening progress syncs across all devices – start on phone, continue on computer.</p>
          </div>
        </div>
      </section>

      {/* Support CTA */}
      <section className="help-section py-5">
        <div className="support-box">
          <h2 className="help-section-title text-center mb-4">Need Help?</h2>
          <p className="help-text text-center mb-4">
            Can't find the answer to your question? Our support team is here to help you get started. 
            Reach out anytime – we respond within 24 hours.
          </p>
          <div className="text-center">
            <a href="mailto:rinornuredini2@gmail.com" className="btn btn-primary-custom btn-lg px-5">
              Contact Support
            </a>
          </div>
        </div>
      </section>
    </div>
  </div>
);

export default HelpPage;
