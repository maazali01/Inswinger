import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user, profile, loading } = useAuth();
  // Removed arbitrary timeout-based redirect. We'll wait for AuthContext to
  // finish resolving session/profile to avoid false logouts during slow networks.

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  // If not logged in, redirect to login
  if (!user || !profile) {
    return <Navigate to="/login" replace />;
  }

  // If the route expects streamers and the streamer isn't verified, send to pending
  if (allowedRoles.includes('streamer') && profile.role === 'streamer' && !profile.is_verified) {
    return <Navigate to="/verification-pending" replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(profile.role)) {
    // Redirect to appropriate dashboard based on role
    switch (profile.role) {
      case 'admin':
        return <Navigate to="/admin/dashboard" replace />;
      case 'streamer':
        return <Navigate to="/streamer/dashboard" replace />;
      case 'user':
      default:
        return <Navigate to="/home" replace />;
    }
  }

  return children;
};

export default ProtectedRoute;
