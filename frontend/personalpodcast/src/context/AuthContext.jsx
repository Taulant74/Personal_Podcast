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

  const authFetch = async (url, options = {}) => {
    const accessToken = localStorage.getItem("accessToken");

    const fetchOptions = {
      ...options,
      headers: {
        ...(options.headers || {}),
        Authorization: `Bearer ${accessToken}`,
      },
      credentials: "include",
    };

    let response = await fetch(url, fetchOptions);

    if (response.status === 401) {
      const newToken = await refreshAccessToken();

      if (!newToken) {
        logout();
        return response;
      }

      const retryOptions = {
        ...options,
        headers: {
          ...(options.headers || {}),
          Authorization: `Bearer ${newToken}`,
        },
        credentials: "include",
      };

      response = await fetch(url, retryOptions);
    }

    return response;
  };

  const value = useMemo(
    () => ({
      user,
      isLoggedIn,
      loading,
      login,
      logout,
      refreshAccessToken,
      authFetch
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