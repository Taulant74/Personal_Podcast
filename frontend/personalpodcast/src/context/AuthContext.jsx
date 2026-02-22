import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { jwtDecode } from "jwt-decode";

const AuthContext = createContext(null);

function parseUserFromToken(token) {
  if (!token) return null;

  const decoded = jwtDecode(token);

  const username =
    decoded.unique_name ||
    decoded["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name"] ||
    decoded.name ||
    decoded.sub ||
    "User";

  const role =
    decoded.role ||
    decoded["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"] ||
    "User";

  const id =
    decoded.sid ||
    decoded["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/sid"] ||
    null;

  return { id, username, role };
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const isLoggedIn = !!user;

  useEffect(() => {
    const token = localStorage.getItem("accessToken");

    if (token) {
      try {
        setUser(parseUserFromToken(token));
      } catch (err) {
        console.error("Invalid token:", err);
        localStorage.removeItem("accessToken");
        setUser(null);
      } finally {
        setLoading(false);
      }
      return;
    }

    setLoading(false);
  }, []);

  const login = (token) => {
    const parsed = parseUserFromToken(token);
    localStorage.setItem("accessToken", token);
    setUser(parsed);
    return parsed;  
  };

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
        credentials: "include",
      });
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      localStorage.removeItem("accessToken");
      setUser(null);
    }
  };

  const value = useMemo(
    () => ({
      user,
      isLoggedIn,
      loading,
      login,
      logout,
    }),
    [user, isLoggedIn, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}