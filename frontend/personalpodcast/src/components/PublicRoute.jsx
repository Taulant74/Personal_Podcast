import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from './LoadingSpinner';

const PublicRoute = () => {
  const { isLoggedIn, loading } = useAuth();

  if (loading) {
    return <div className="d-flex justify-content-center mt-5 text-white p-5"><LoadingSpinner /></div>;
  }

  return isLoggedIn ? <Navigate to="/" replace /> : <Outlet />;
};

export default PublicRoute;