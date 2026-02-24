import React, { useState, useRef, useEffect } from "react";
import { NavLink, Link } from "react-router-dom";
import "./Header.css";
import { useAuth } from "../context/AuthContext";

function Header() {
  const { user, isLoggedIn, logout } = useAuth();

  const username = user?.username;
  const role = user?.role;

  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef();

  const toggleDropdown = () => {
    setShowDropdown((curr) => !curr);
  };

  useEffect(() => {
    const onClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener("mousedown", onClick);
    }

    return () => document.removeEventListener("mousedown", onClick);
  }, [showDropdown]);

  return (
    <nav
      className="d-flex align-items-center justify-content-between p-3 shadow-sm"
      style={{ backgroundColor: "#44444E" }}
    >
      {/* Logo */}
      <div className="d-flex gap-2">
        <Link
          to="/"
          className="text-decoration-none d-flex align-items-center gap-2"
        >
          <img
            src="/PPlogo.png"
            style={{ height: "50px" }}
            alt="Logo"
            className="w-20 p-1"
          />
          <h3 style={{ color: "#D3DAD9", margin: 0 }}>Personal Podcast</h3>
        </Link>
      </div>

      {/* Navigation */}
      <div className="d-flex align-items-center gap-5">
        <NavLink to="/" className="text-decoration-none nav-link-custom">
          Home
        </NavLink>
        <NavLink
          to="/episodes"
          className="text-decoration-none nav-link-custom"
        >
          Episodes
        </NavLink>
        <NavLink
          to="/publishers"
          className="text-decoration-none nav-link-custom"
        >
          Publishers
        </NavLink>
        <NavLink
          to="/categories"
          className="text-decoration-none nav-link-custom"
        >
          Categories
        </NavLink>
      </div>

      <div className="d-flex align-items-center gap-3">
        {isLoggedIn ? (
          <div className="user-dropdown-container" ref={dropdownRef}>
            <span
              className="text-white d-flex align-items-center gap-1"
              onClick={toggleDropdown}
              style={{ cursor: "pointer" }}
            >
              {username}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                fill="currentColor"
                className="bi bi-caret-down-fill"
                viewBox="0 0 16 16"
              >
                <path d="M7.247 11.14 2.451 5.658C1.885 5.013 2.345 4 3.204 4h9.592a1 1 0 0 1 .753 1.659l-4.796 5.48a1 1 0 0 1-1.506 0z" />
              </svg>
            </span>

            {showDropdown && (
              <div className="user-dropdown-menu">
                <Link
                  to="/user-panel"
                  className="user-dropdown-item"
                  onClick={() => setShowDropdown(false)}
                >
                  User Panel
                </Link>

                <Link
                  to="/my-episodes"
                  className="user-dropdown-item"
                  onClick={() => setShowDropdown(false)}
                >
                  My Episodes
                </Link>

                {role === "Publisher" && (
                  <Link
                    to="/publisher"
                    className="user-dropdown-item"
                    onClick={() => setShowDropdown(false)}
                  >
                    Publisher Dashboard
                  </Link>
                )}

                {role === "Admin" && (
                  <Link
                    to="/admin"
                    className="user-dropdown-item"
                    onClick={() => setShowDropdown(false)}
                  >
                    Admin Dashboard
                  </Link>
                )}

                <div
                  className="user-dropdown-item"
                  onClick={() => {
                    logout();
                    setShowDropdown(false);
                  }}
                >
                  Logout
                </div>
              </div>
            )}
          </div>
        ) : (
          <>
            <Link to="/login" className="btn btn-login-custom btn-sm px-4 py-2">
              Login
            </Link>
            <Link
              to="/register"
              className="btn btn-signup-custom btn-sm px-4 py-2"
            >
              Sign Up
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}

export default Header;
