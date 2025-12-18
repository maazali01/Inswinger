import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ProtectedRoute = ({ children, allowedRoles = [], requireVerification = true }) => {
  const { user, profile, loading } = useAuth();

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

  // Check role access
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

  // For streamers, handle verification flow
  if (profile.role === 'streamer' && requireVerification) {
    // If streamer is verified, allow access
    if (profile.is_verified) {
      return children;
    }
    
    // If not verified, redirect based on current state
    if (!profile.plan) {
      // No plan selected yet, send to subscription plans
      return <Navigate to="/subscription-plans" replace />;
    } else if (!profile.screenshot_url) {
      // Plan selected but no screenshot uploaded
      return <Navigate to="/verification-upload" replace />;
    } else {
      // Screenshot uploaded, waiting for approval
      return <Navigate to="/verification-pending" replace />;
    }
  }

  return children;
};

export default ProtectedRoute;
