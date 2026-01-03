import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import ErrorBoundary from './components/ErrorBoundary';
import { ToastProvider } from './components/ToastContainer';

// Public Pages
import LandingPage from './pages/LandingPage';

// Auth Pages
import Login from './pages/Login';
import Signup from './pages/Signup';
import SubscriptionPlans from './pages/SubscriptionPlans';
import VerificationUpload from './pages/VerificationUpload';
import VerificationPending from './pages/VerificationPending';

// User Pages
import UserDashboard from './pages/user/UserDashboard';
import StreamView from './pages/user/StreamView';
import BlogsPage from './pages/user/BlogsPage';
import EventsPage from './pages/user/EventsPage';

// Streamer Pages
import StreamerDashboard from './pages/streamer/StreamerDashboard';
import StreamerAnalytics from './pages/streamer/StreamerAnalytics';
import StreamerProfile from './pages/streamer/StreamerProfile';
// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import StreamerManagement from './pages/admin/StreamerManagement';
import StreamTypeManagement from './pages/admin/StreamTypeManagement';
import BlogManagement from './pages/admin/BlogManagement';
import UserManagement from './pages/admin/UserManagement';
import EventManagement from './pages/admin/EventManagement';
import StreamManagement from './pages/admin/StreamManagement';
import StreamSEO from './pages/admin/StreamSEO';
import Sitemap from './pages/Sitemap';
import BrowseStreams from './pages/BrowseStreams';

function AppContent() {
  const location = useLocation();
  
  return (
    <div className="min-h-screen bg-gray-900">
      <Navbar />
      <Routes>
        {/* Public Routes - Landing page MUST be first */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        
        {/* Public browse page for free streams */}
        <Route path="/browse" element={<BrowseStreams />} />
        
        {/* Streamer onboarding routes - require auth but not full verification */}
        <Route
          path="/subscription-plans"
          element={
            <ProtectedRoute allowedRoles={['streamer']} requireVerification={false}>
              <SubscriptionPlans />
            </ProtectedRoute>
          }
        />
        <Route
          path="/verification-upload"
          element={
            <ProtectedRoute allowedRoles={['streamer']} requireVerification={false}>
              <VerificationUpload />
            </ProtectedRoute>
          }
        />
        <Route
          path="/verification-pending"
          element={
            <ProtectedRoute allowedRoles={['streamer']} requireVerification={false}>
              <VerificationPending />
            </ProtectedRoute>
          }
        />

        {/* User Routes - /home is now public */}
        <Route path="/home" element={<UserDashboard />} />
        
        {/* Stream routes are completely public - no authentication required */}
        <Route path="/stream/:streamerSlug/:slug" element={<StreamView />} />
        <Route path="/stream/:slug" element={<StreamView />} />
        
        <Route
          path="/blogs"
          element={
            <ProtectedRoute allowedRoles={['user']}>
              <BlogsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/events"
          element={
            <ProtectedRoute allowedRoles={['user']}>
              <EventsPage />
            </ProtectedRoute>
          }
        />

        {/* Streamer Routes */}
        <Route
          path="/streamer/dashboard"
          element={
            <ProtectedRoute allowedRoles={['streamer']}>
              <StreamerDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/streamer/analytics"
          element={
            <ProtectedRoute allowedRoles={['streamer']}>
              <StreamerAnalytics />
            </ProtectedRoute>
          }
        />
        <Route
          path="/streamer/profile"
          element={
            <ProtectedRoute allowedRoles={['streamer']}>
              <StreamerProfile/>
            </ProtectedRoute>
          }
        />

        {/* Admin Routes */}
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/streamers"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <StreamerManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/stream-types"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <StreamTypeManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/stream-management"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <StreamManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/events"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <EventManagement/>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/blogs"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <BlogManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <UserManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/stream-seo"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <StreamSEO />
            </ProtectedRoute>
          }
        />

        {/* Sitemap */}
        <Route path="/sitemap.xml" element={<Sitemap />} />

        {/* Fallback - redirect unknown routes to landing page */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <HelmetProvider>
        <ToastProvider>
          <Router>
            <AppContent />
          </Router>
        </ToastProvider>
      </HelmetProvider>
    </AuthProvider>
  );
}

export default App;
