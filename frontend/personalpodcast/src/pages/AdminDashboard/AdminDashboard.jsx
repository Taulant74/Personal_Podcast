import React, { useState } from "react";
import EpisodesSection from "./episodes/EpisodesSection";
import UsersSection from "./users/UsersSection";
import "./adminDashboard.css"; 

export default function AdminDashboard() {
  const [tab, setTab] = useState("episodes");
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  function resetMessages() {
    setErrorMsg("");
    setSuccessMsg("");
  }

  const activeCountLabel = tab === "episodes" ? "Episodes" : "Users";

  return (
    
    <div style={{ minHeight: "100vh", backgroundColor: "#37353E", color: "#D3DAD9" }}>
      {/* EpisodePage theme styles (same classes) */}
      <style>{`
        .pp-container { max-width: 1120px; }

        .pp-hero { padding: 40px 0 20px; }

        .pp-title {
          font-weight: 700;
          letter-spacing: -0.5px;
          line-height: 1.05;
          font-size: clamp(2rem, 4vw, 3rem);
          margin: 0;
          color: #ffffff;
        }

        .pp-subtitle {
          margin-top: 10px;
          color: #B8C1BF;
          max-width: 58ch;
          font-size: 1.05rem;
        }

        .pp-glass {
          background: linear-gradient(135deg, rgba(107,91,123,0.15), rgba(68,68,78,0.15));
          border: 1px solid rgba(107,91,123,0.3);
          border-radius: 12px;
        }

        .pp-muted { color: #B8C1BF; }

        .pp-footer {
          color: #B8C1BF;
          border-top: 1px solid rgba(107,91,123,0.3);
          background: rgba(68,68,78,0.3);
        }

        .pp-pill {
          background: rgba(107,91,123,0.2);
          border: 1px solid rgba(107,91,123,0.4);
          color: #D3DAD9;
          border-radius: 999px;
          padding: 6px 10px;
          font-weight: 800;
          font-size: 12px;
        }

        /* Segment buttons (EpisodePage-ish glass + active) */
        .pp-segment {
          display: inline-flex;
          gap: 6px;
          padding: 6px;
          border-radius: 16px;
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.12);
        }

        .pp-segment-btn {
          border: 0;
          background: transparent;
          color: #B8C1BF;
          padding: .55rem 1.2rem;
          border-radius: 12px;
          font-weight: 800;
          letter-spacing: .2px;
          transition: all .15s ease;
          cursor: pointer;
        }

        .pp-segment-btn:hover {
          color: rgba(233,238,252,0.92);
          background: rgba(255,255,255,0.08);
        }

        .pp-segment-btn.active {
          background: linear-gradient(135deg, rgba(107,91,123,0.55), rgba(68,68,78,0.55));
          color: rgba(233,238,252,0.92);
          border: 1px solid rgba(255,255,255,0.12);
          box-shadow: 0 10px 30px rgba(0,0,0,0.25);
        }

        .pp-alert {
          background: rgba(68,68,78,0.4);
          border: 1px solid rgba(107,91,123,0.3);
          color: #B8C1BF;
          border-radius: 14px;
        }

        .pp-alert-danger {
          background: rgba(239,68,68,.12);
          border: 1px solid rgba(239,68,68,.25);
          color: #fecaca;
        }

        .pp-alert-success {
          background: rgba(34,197,94,.12);
          border: 1px solid rgba(34,197,94,.25);
          color: #bbf7d0;
        }
      `}</style>

      <div className="container pp-container px-8">
        {/* Hero header like EpisodePage */}
        <div className="pp-hero">
          <h1 className="pp-title">Admin Dashboard</h1>
          <p className="pp-subtitle">
            Manage episodes and users in one place
          </p>
        </div>

        {/* Top bar */}
        <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
          <div className="d-flex align-items-center gap-2 flex-wrap">
            <span className="pp-pill">Admin</span>
            <span className="pp-pill">Active: {activeCountLabel}</span>
          </div>

          {/* Segmented tabs */}
          <div className="pp-segment">
            <button
              className={`pp-segment-btn ${tab === "episodes" ? "active" : ""}`}
              onClick={() => {
                resetMessages();
                setTab("episodes");
              }}
              type="button"
            >
              Episodes
            </button>

            <button
              className={`pp-segment-btn ${tab === "users" ? "active" : ""}`}
              onClick={() => {
                resetMessages();
                setTab("users");
              }}
              type="button"
            >
              Users
            </button>
          </div>
        </div>

        {/* Messages */}
        {errorMsg ? (
          <div className="alert pp-alert pp-alert-danger p-3 mb-3">{errorMsg}</div>
        ) : null}

        {successMsg ? (
          <div className="alert pp-alert pp-alert-success p-3 mb-3">{successMsg}</div>
        ) : null}

        {/* Content area as glass card */}
        <div className="pp-glass p-3 p-md-4 mb-4">
          {tab === "episodes" ? (
            <EpisodesSection
              setErrorMsg={setErrorMsg}
              setSuccessMsg={setSuccessMsg}
              resetMessages={resetMessages}
            />
          ) : null}

          {tab === "users" ? (
            <UsersSection
              setErrorMsg={setErrorMsg}
              setSuccessMsg={setSuccessMsg}
              resetMessages={resetMessages}
            />
          ) : null}
        </div>
      </div>

      {/* Footer like EpisodePage */}
      <div className="pp-footer py-3">
        <div className="container pp-container d-flex flex-wrap gap-2 justify-content-between align-items-center">
          <small>Admin tools: upload, edit, publish, and manage roles.</small>
          <small className="pp-muted">Press ESC to close modals (where supported).</small>
        </div>
      </div>
    </div>
  );
}