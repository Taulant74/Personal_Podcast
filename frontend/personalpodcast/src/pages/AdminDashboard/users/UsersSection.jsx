import React, { useEffect, useMemo, useState } from "react";
import Modal from "../components/Modal";
import PaginationBar from "../components/PaginationBar";
import UserForm from "./UserForm";
import { emptyCreateUser } from "../utils";
import { apiLoadUsers, apiCreateUser, apiUpdateUser, apiDeleteUser } from "../api";

export default function UsersSection({ setErrorMsg, setSuccessMsg, resetMessages }) {
 
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [userQuery, setUserQuery] = useState("");

  const [userPage, setUserPage] = useState(1);
  const [userPageSize, setUserPageSize] = useState(10);

  const [showCreateUser, setShowCreateUser] = useState(false);
  const [showEditUser, setShowEditUser] = useState(false);

  const [createUserForm, setCreateUserForm] = useState({ ...emptyCreateUser });
  const [editUserId, setEditUserId] = useState(null);
  const [editUserForm, setEditUserForm] = useState({
    username: "",
    firstName: "",
    lastName: "",
    age: "",
    email: "",
    role: "User",
    password: "",
  });

  async function loadUsers() {
    setUsersLoading(true);
    resetMessages();
    try {
      const list = await apiLoadUsers();
      setUsers(Array.isArray(list) ? list : []);
    } catch (e) {
      setErrorMsg(e?.message || "Failed to load users.");
    } finally {
      setUsersLoading(false);
    }
  }

  function openCreateUser() {
    resetMessages();
    setCreateUserForm({ ...emptyCreateUser });
    setShowCreateUser(true);
  }

  function openEditUser(u) {
    resetMessages();
    setEditUserId(u.id);
    setEditUserForm({
      username: u.username || "",
      firstName: u.firstName || "",
      lastName: u.lastName || "",
      age: u.age === null || u.age === undefined ? "" : String(u.age),
      email: u.email || "",
      role: u.role || "User",
      password: "",
    });
    setShowEditUser(true);
  }

  async function handleCreateUserSubmit(e) {
    e.preventDefault();
    resetMessages();

    try {
      if (!createUserForm.username.trim()) throw new Error("Username is required.");
      if (!createUserForm.password) throw new Error("Password is required.");

      await apiCreateUser(createUserForm);

      setSuccessMsg("User created.");
      setShowCreateUser(false);
      await loadUsers();
    } catch (e2) {
      setErrorMsg(e2?.message || "Create user failed.");
    }
  }

  async function handleEditUserSubmit(e) {
    e.preventDefault();
    resetMessages();

    try {
      if (!editUserId) throw new Error("Missing user id.");
      if (!editUserForm.username.trim()) throw new Error("Username is required.");

      await apiUpdateUser(editUserId, editUserForm);

      setSuccessMsg("User updated.");
      setShowEditUser(false);
      setEditUserId(null);
      await loadUsers();
    } catch (e2) {
      setErrorMsg(e2?.message || "Update user failed.");
    }
  }

  async function handleDeleteUser(id) {
    resetMessages();
    const ok = window.confirm("Delete this user? This cannot be undone.");
    if (!ok) return;

    try {
      await apiDeleteUser(id);
      setSuccessMsg("User deleted.");
      await loadUsers();
    } catch (e) {
      setErrorMsg(e?.message || "Delete user failed.");
    }
  }
  const filteredUsers = useMemo(() => {
    const q = userQuery.trim().toLowerCase();
    if (!q) return users;

    return users.filter((u) => {
      const username = (u?.username || "").toLowerCase();
      const email = (u?.email || "").toLowerCase();
      const name = `${u?.firstName || ""} ${u?.lastName || ""}`.toLowerCase();
      return username.includes(q) || email.includes(q) || name.includes(q);
    });
  }, [users, userQuery]);

  useEffect(() => setUserPage(1), [userQuery, users]);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(filteredUsers.length / userPageSize)), [
    filteredUsers.length,
    userPageSize,
  ]);

  useEffect(() => {
    if (userPage > totalPages) setUserPage(totalPages);
  }, [userPage, totalPages]);

  const pagedUsers = useMemo(() => {
    const safe = Math.min(Math.max(1, userPage), totalPages);
    const start = (safe - 1) * userPageSize;
    return filteredUsers.slice(start, start + userPageSize);
  }, [filteredUsers, userPage, userPageSize, totalPages]);

  useEffect(() => {
    loadUsers();
  }, []);

  function closeModals() {
    setShowCreateUser(false);
    setShowEditUser(false);
    setEditUserId(null);
  }

  function roleBadgeClass(role) {
    if (role === "Admin") return "badge-danger";
    if (role === "Publisher") return "badge-info";
    return "badge-draft";
  }

  return (
    <>
      <div className="glass-card p-3">
        {/* Search + stats */}
        <div className="d-flex flex-wrap gap-2 align-items-center mb-3">
          <input
            className="searchbox flex-grow-1"
            placeholder="Search by username / name / email..."
            value={userQuery}
            onChange={(e) => setUserQuery(e.target.value)}
          />

          <span className="stat-pill">
            Showing <b>{pagedUsers.length}</b> of <b>{filteredUsers.length}</b> (total {users.length})
          </span>
        </div>

        {/* Actions */}
        <div className="d-flex flex-wrap gap-2 mb-3">
          <button className="btn btn-soft" onClick={loadUsers} disabled={usersLoading}>
          <i className="bi bi-arrow-repeat me-1"></i> {usersLoading ? "Refreshing..." : "Refresh"}
          </button>

          <button className="btn btn-brand" onClick={openCreateUser}>
            
<i className="bi bi-person-plus-fill me-1"> Create User</i> 
          </button>
        </div>

        {/* List */}
        {usersLoading ? (
          <div className="text-center text-muted py-4">Loading...</div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center text-muted py-4">No users found.</div>
        ) : (
          <div className="d-grid gap-3">
            {pagedUsers.map((u) => {
              const fullName = `${u?.firstName || ""} ${u?.lastName || ""}`.trim() || "—";

              return (
                <div key={u.id} className="row-card">
                  <div className="d-flex justify-content-between align-items-start gap-3">
                    <div className="flex-grow-1" style={{ minWidth: 0 }}>
                      <div className="d-flex align-items-center gap-2 flex-wrap">
                        <span className="badge-soft">{u.id}</span>

                        <span className={`badge-soft ${roleBadgeClass(u.role)}`}>
                          <i className="bi bi-shield-lock me-1"></i> {u.role || "User"}
                        </span>

                        <span className="badge-soft"><i className="bi bi-calendar me-1"></i>Age: {u.age ?? "—"}</span>

                        <span className="badge-soft badge-info">
                         <i className="bi bi-envelope me-1"></i> {u.email || "—"}
                        </span>
                      </div>

                      <div className="mt-2 row-title text-truncate">{u.username}</div>
                      <div className="row-desc text-truncate">{fullName}</div>
                    </div>

                    <div className="d-flex gap-2 flex-shrink-0">
                      <button
                        className="btn btn-action btn-action-edit"
                        type="button"
                        onClick={() => openEditUser(u)}
                      >
                        <i className="bi bi-pencil me-1"></i> Edit
                      </button>

                      <button
                        className="btn btn-action btn-action-delete"
                        type="button"
                        onClick={() => handleDeleteUser(u.id)}
                      >
                        <i className="bi bi-trash me-1"></i> Delete
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        <div className="mt-3">
          <PaginationBar
            page={userPage}
            setPage={setUserPage}
            pageSize={userPageSize}
            setPageSize={setUserPageSize}
            totalPages={totalPages}
          />
        </div>
      </div>

      {/* Create user */}
      {showCreateUser ? (
        <Modal title="Create User" onClose={closeModals}>
          <UserForm
            form={createUserForm}
            setForm={setCreateUserForm}
            onSubmit={handleCreateUserSubmit}
            submitLabel="Create User"
            requirePassword={true}
          />
        </Modal>
      ) : null}

      {/* Edit user */}
      {showEditUser ? (
        <Modal title={`Edit User #${editUserId}`} onClose={closeModals}>
          <UserForm
            form={editUserForm}
            setForm={setEditUserForm}
            onSubmit={handleEditUserSubmit}
            submitLabel="Save changes"
            requirePassword={false}
          />
          <div className="alert alert-info mt-3 mb-0">Leave password empty to keep the current password.</div>
        </Modal>
      ) : null}
    </>
  );
}