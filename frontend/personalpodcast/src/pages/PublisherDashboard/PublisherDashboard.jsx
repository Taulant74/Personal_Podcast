import React, { useState } from "react";
import "../AdminDashboard/adminDashboard.css"; 
import "./publisherDashboard.css";
import PublisherEpisodesSection from "./episodes/PublisherEpisodesSection";

export default function PublisherDashboard() {
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
            <h2 className="mb-0 admin-title">Publisher Dashboard</h2>
            <div className="admin-sub">Manage your episodes, publish/unpublish, and upload audio.</div>
          </div>
        </div>

        {errorMsg ? <div className="alert alert-danger">{errorMsg}</div> : null}
        {successMsg ? <div className="alert alert-success">{successMsg}</div> : null}

        <PublisherEpisodesSection
          setErrorMsg={setErrorMsg}
          setSuccessMsg={setSuccessMsg}
          resetMessages={resetMessages}
        />
      </div>
    </div>
  );
}