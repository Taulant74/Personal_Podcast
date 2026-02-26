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

  return (
    <div className="admin-shell">
    <div className="container py-4">
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
       <div>
  <h2 className="mb-0 admin-title">Admin Dashboard</h2>
  <div className="admin-sub">Manage episodes + users</div>
</div>
      </div>
<div className="admin-segment mb-4">
  <button
    className={`admin-segment-btn ${tab === "episodes" ? "active" : ""}`}
    onClick={() => setTab("episodes")}
  >
    Episodes
  </button>

  <button
    className={`admin-segment-btn ${tab === "users" ? "active" : ""}`}
    onClick={() => setTab("users")}
  >
    Users
  </button>
</div>

      {errorMsg ? <div className="alert alert-danger">{errorMsg}</div> : null}
      {successMsg ? <div className="alert alert-success">{successMsg}</div> : null}

      {tab === "episodes" ? (
        <EpisodesSection setErrorMsg={setErrorMsg} setSuccessMsg={setSuccessMsg} resetMessages={resetMessages} />
      ) : null}

      {tab === "users" ? (
        <UsersSection setErrorMsg={setErrorMsg} setSuccessMsg={setSuccessMsg} resetMessages={resetMessages} />
      ) : null}
    </div>
    </div>
  );
}