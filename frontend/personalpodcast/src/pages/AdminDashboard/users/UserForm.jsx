
import React from "react";

export default function UserForm({ form, setForm, onSubmit, submitLabel, requirePassword }) {
  return (
    <form onSubmit={onSubmit}>
      <div className="row g-3">
        <div className="col-md-6">
          <label className="form-label">Username</label>
          <input
            className="form-control"
            value={form.username}
            onChange={(e) => setForm((p) => ({ ...p, username: e.target.value }))}
          />
        </div>

        <div className="col-md-6">
          <label className="form-label">Role</label>
          <select className="form-select" value={form.role} onChange={(e) => setForm((p) => ({ ...p, role: e.target.value }))}>
            <option value="User">User</option>
            <option value="Publisher">Publisher</option>
            <option value="Admin">Admin</option>
          </select>
        </div>

        <div className="col-md-6">
          <label className="form-label">First name</label>
          <input
            className="form-control"
            value={form.firstName}
            onChange={(e) => setForm((p) => ({ ...p, firstName: e.target.value }))}
          />
        </div>

        <div className="col-md-6">
          <label className="form-label">Last name</label>
          <input
            className="form-control"
            value={form.lastName}
            onChange={(e) => setForm((p) => ({ ...p, lastName: e.target.value }))}
          />
        </div>

        <div className="col-md-6">
          <label className="form-label">Email (optional)</label>
          <input
            className="form-control"
            value={form.email}
            onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
            placeholder="user@mail.com"
          />
        </div>

        <div className="col-md-6">
          <label className="form-label">Age (optional)</label>
          <input
            className="form-control"
            type="number"
            min="0"
            value={form.age}
            onChange={(e) => setForm((p) => ({ ...p, age: e.target.value }))}
          />
        </div>

        <div className="col-12">
          <label className="form-label">
            Password {requirePassword ? <span className="text-danger">*</span> : <span style={{ color: "var(--text)", opacity: 0.8 }}>(optional)</span>}
          </label>
          <input
            className="form-control"
            type="password"
            value={form.password}
            onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
            placeholder={requirePassword ? "Set a password" : "Leave empty to keep current"}
          />
        </div>

        <div className="col-12 d-flex justify-content-end gap-2 mt-2">
          <button type="submit" className="btn btn-primary">
            {submitLabel}
          </button>
        </div>
      </div>
    </form>
  );
}