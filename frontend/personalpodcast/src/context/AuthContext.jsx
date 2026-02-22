import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
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

  const rawRole =
    decoded.role ||
    decoded.roles ||
    decoded["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"] ||
    [];

  let roles = [];

  if (typeof rawRole === "string") {
    roles = rawRole.includes(",")
      ? rawRole.split(",").map((r) => r.trim())
      : [rawRole];
  } else if (Array.isArray(rawRole)) {
    roles = rawRole;
  }

  const id =
    decoded.sid ||
    decoded["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/sid"] ||
    null;

  return { id, username, roles };
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const isLoggedIn = !!user;

  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem("accessToken");

      if (token) {
        try {
          setUser(parseUserFromToken(token));
          setLoading(false);
          return;
        } catch (err) {
          console.error("Invalid token:", err);
          localStorage.removeItem("accessToken");
        }
      }

      await refreshAccessToken();
      setLoading(false);
    };

    initializeAuth();
  }, []);

  const login = (token) => {
    const parsed = parseUserFromToken(token);
    localStorage.setItem("accessToken", token);
    setUser(parsed);
    return parsed;
  };

  const logout = async () => {
    try {
      await fetch("https://localhost:7261/api/auth/logout", {
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

  const refreshAccessToken = async () => {
    try {
      const response = await fetch(
        "https://localhost:7261/api/auth/refresh-token",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        }
      );

      if (!response.ok) {
        setUser(null);
        return null;
      }

      const data = await response.json();

      if (data.accessToken) {
        return login(data.accessToken);
      }

      setUser(null);
      return null;
    } catch (err) {
      console.error("Failed to refresh token", err);
      setUser(null);
      return null;
    }
  };

  const value = useMemo(
    () => ({
      user,
      isLoggedIn,
      loading,
      login,
      logout,
      refreshAccessToken,
    }),
    [user, isLoggedIn, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx)
    throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}