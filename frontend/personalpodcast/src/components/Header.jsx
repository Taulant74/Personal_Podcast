import React, { useState, useRef, useEffect } from "react";
import { NavLink, Link } from "react-router-dom";
import "./Header.css";
import { useAuth } from "../context/AuthContext";

function Header() {
  const { user, isLoggedIn, logout } = useAuth();
  const username = user?.username;
  const role = user?.role;

  const [showDropdown, setShowDropdown] = useState(false);
  const [showNavMenu, setShowNavMenu] = useState(false);

  const dropdownRef = useRef();
  const navDropdownRef = useRef();

  const toggleDropdown = () => setShowDropdown((curr) => !curr);
  const toggleNavMenu = () => setShowNavMenu((curr) => !curr);

  useEffect(() => {
    const onClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }

      if (navDropdownRef.current && !navDropdownRef.current.contains(e.target)) {
        setShowNavMenu(false);
      }
    };

    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <nav className="header">
      
      <div className="left-section">

        <div className="mobile-only mobile-nav-wrapper" ref={navDropdownRef}>
          <i
            className="bi bi-list burger-icon"
            onClick={toggleNavMenu}
          ></i>

          {showNavMenu && (
            <div className="mobile-navigation-menu">
              <NavLink to="/" onClick={() => setShowNavMenu(false)}>Home</NavLink>
              <NavLink to="/episodes" onClick={() => setShowNavMenu(false)}>Episodes</NavLink>
              <NavLink to="/about" onClick={() => setShowNavMenu(false)}>About Us</NavLink>
              <NavLink to="/help" onClick={() => setShowNavMenu(false)}>Help</NavLink>
            </div>
          )}
        </div>

        <Link
          to="/"
          className="desktop-only logo-container"
        >
          <h1><i class="bi bi-mic-fill"></i></h1>
          <h3>Personal Podcast</h3>
        </Link>
      </div>

      <div className="desktop-only desktop-nav">
        <NavLink to="/" className="nav-link-custom">Home</NavLink>
        <NavLink to="/episodes" className="nav-link-custom">Episodes</NavLink>
        <NavLink to="/about" className="nav-link-custom">About Us</NavLink>
        <NavLink to="/help" className="nav-link-custom">Help</NavLink>
      </div>

      <div className="right-section">
        {isLoggedIn ? (
          <div className="user-dropdown-container" ref={dropdownRef}>
            <span onClick={toggleDropdown} className="username">
              {username} ▼
            </span>

            {showDropdown && (
              <div className="user-dropdown-menu">
                <Link to="/user-panel" onClick={() => setShowDropdown(false)}>User Info</Link>
                <Link to="/my-episodes" onClick={() => setShowDropdown(false)}>My Episodes</Link>
                {role === "Publisher" && (
                  <Link to="/publisher" onClick={() => setShowDropdown(false)}>Publisher Dashboard</Link>
                )}
                {role === "Admin" && (
                  <Link to="/admin" onClick={() => setShowDropdown(false)}>Admin Dashboard</Link>
                )}
                <div onClick={() => { logout(); setShowDropdown(false); }}>
                  Logout
                </div>
              </div>
            )}
          </div>
        ) : (
          <>
            <Link to="/login" className="btn-login">Login</Link>
            <Link to="/register" className="btn-signup desktop-only">Sign Up</Link>
          </>
        )}
      </div>
    </nav>
  );
}

export default Header;