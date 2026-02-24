import React, { useState, useEffect } from 'react';
import 'bootstrap-icons/font/bootstrap-icons.css';
import { useAuth } from "../context/AuthContext";
import LoadingSpinner from '../components/LoadingSpinner';

function UserPanelPage() {
  const { user: authUser, authFetch, loading: authLoading } = useAuth();

  const [user, setUser] = useState(null);  
  const [editingField, setEditingField] = useState(null);
  const [tempValue, setTempValue] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const userId = authUser?.id;

  useEffect(() => {
    if (!authUser?.id) return;

    const fetchUser = async () => {
      setLoading(true);

      try {
        const response = await authFetch(
          `https://localhost:7261/api/user/${authUser.id}`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch user");
        }

        const data = await response.json();
        setUser(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
  };

  fetchUser();
}, [authUser]);

  const startEditing = (field) => {
    setEditingField(field);
    setTempValue(user?.[field] ?? "");
    setConfirmPassword("");
    setError("");
  };

  const cancelEditing = () => {
    setEditingField(null);
    setTempValue("");
    setConfirmPassword("");
    setError("");
  };

  const handleSave = async () => {
    if (!editingField) return;

    if (editingField === "password") {
      if (tempValue.length < 8) {
        setError("Password must be at least 8 characters long.");
        return;
      }
      if (tempValue !== confirmPassword) {
        setError("Passwords do not match.");
        return;
      }
    }

    try {
      const updateBody = {
        Username: editingField === "username" ? tempValue : null,
        FirstName: editingField === "firstName" ? tempValue : null,
        LastName: editingField === "lastName" ? tempValue : null,
        Age: editingField === "age" ? Number(tempValue) : null,
        Email: editingField === "email" ? tempValue : null,
        Password: editingField === "password" ? tempValue : null,
      };

      const response = await authFetch(
        `https://localhost:7261/api/user/${userId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updateBody),
        }
      );

      if (!response.ok) {
        const text = await response.text();
        setError(text || "Update failed.");
        return;
      }

      const updatedUser = await response.json();
      setUser(updatedUser);   
      cancelEditing();
    } catch (err) {
      setError("Server error.");
    }
  };

  if (authLoading) {
    return <div className="text-white p-5"><LoadingSpinner /></div>;
  }

  const renderField = (label, field, type = "text") => (
    <div className="d-flex flex-column gap-2">
      <label style={{ color: "#D3DAD9" }}>{label}</label>

      <div className="d-flex gap-2 w-100">
        <input
          type={type}
          value={editingField === field ? tempValue : user?.[field] ?? ""}
          readOnly={editingField !== field}
          onChange={(e) => setTempValue(e.target.value)}
          className="form-control p-3 rounded-3 fw-bold"
          style={{
            color: "#22222A",
            backgroundColor:
              editingField === field ? "#D3DAD9" : "#a6aaa9",
          }}
        />

        {editingField === field ? (
          <>
            <button className="btn btn-success" onClick={handleSave}>
              Save
            </button>
            <button className="btn btn-secondary" onClick={cancelEditing}>
              Cancel
            </button>
          </>
        ) : (
          <button
            className="btn btn-signup-custom"
            onClick={() => startEditing(field)}
          >
            <i className="bi bi-pencil-square"></i>
          </button>
        )}
      </div>

      {editingField === "password" && field === "password" && (
        <input
          type="password"
          placeholder="Confirm Password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="form-control p-3 rounded-3 fw-bold"
          style={{ backgroundColor: "#D3DAD9" }}
        />
      )}

      {error && editingField === field && (
        <div className="text-danger">{error}</div>
      )}
    </div>
  );

  if (!authUser) {
    return <div className="text-danger p-5">Not authenticated</div>;
  }

  if (loading) {
    return <div className="d-flex justify-content-center mt-5 text-white p-5"><LoadingSpinner /></div>;
  }

  return (
    <div className="d-flex pt-5 align-items-center justify-content-center">
      <div
        className="d-flex flex-column w-50 p-5 rounded-4 shadow-lg gap-4"
        style={{ backgroundColor: "#44444E" }}
      >
        <h1 style={{ color: "#D3DAD9" }}>User Panel</h1>

        {renderField("Username", "username")}
        {renderField("First Name", "firstName")}
        {renderField("Last Name", "lastName")}
        {renderField("Age", "age", "number")}
        {renderField("Email", "email", "email")}
        {renderField("Password", "password", "password")}
      </div>
    </div>
  );
}

export default UserPanelPage;