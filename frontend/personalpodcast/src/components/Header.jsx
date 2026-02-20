import React from 'react'
import { NavLink, Link } from "react-router-dom"; // Import NavLink
import './Header.css';
import { useAuth } from '../context/AuthContext';

function Header() {
  const { isLoggedIn, username, logout } = useAuth();

  return (
    <nav className="d-flex align-items-center justify-content-between p-3 shadow-sm" style={{ backgroundColor: "#44444E" }}>
      <div className="d-flex align-items-center gap-2">
        <Link to="/" className="text-decoration-none d-flex align-items-center gap-2">
          <img src="/PPlogo.png" style={{ height: "50px" }} alt="Logo" className="w-20 p-1" />
          <h3 style={{ color: "#D3DAD9", margin: 0 }}>Personal Podcast</h3>
        </Link>
      </div>

      <div className="d-flex align-items-center gap-5">
        {/* NavLink automatically monitors the URL */}
        <NavLink to="/" className="text-decoration-none nav-link-custom">Home</NavLink>
        <NavLink to="/episodes" className="text-decoration-none nav-link-custom">Episodes</NavLink>
        <NavLink to="/publishers" className="text-decoration-none nav-link-custom">Publishers</NavLink>
        <NavLink to="/categories" className="text-decoration-none nav-link-custom">Categories</NavLink>
      </div>

      <div className="d-flex align-items-center gap-2">
        {isLoggedIn ? (
          <>
            <span className="text-white">{username}</span>
            <button
              onClick={logout}
              className="btn btn-outline-light btn-sm px-4 py-2"
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="btn btn-login-custom btn-sm px-4 py-2">Login</Link>
            <Link to="/register" className="btn btn-signup-custom btn-sm px-4 py-2">Sign Up</Link>
          </>
        )}
      </div>
    </nav>
  )
}

export default Header