import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function RequireRole({ allowedRoles }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading)
    return <div className="container py-4">Checking access...</div>;

  if (!user)
    return <Navigate to="/login" replace state={{ from: location }} />;

  if (!allowedRoles.includes(user.role))
    return <Navigate to="/" replace />;

  return <Outlet />;
}