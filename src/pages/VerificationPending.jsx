import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const VerificationPending = () => {
  const { profile, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // If user is verified, redirect to streamer dashboard
    if (!loading && profile && profile.is_verified) {
      navigate('/streamer/dashboard');
    }
  }, [profile, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center px-4">
      <div className="card max-w-2xl text-center">
        <div className="mb-6">
          <div className="mx-auto w-24 h-24 bg-yellow-500/20 rounded-full flex items-center justify-center mb-4">
            <svg
              className="w-12 h-12 text-yellow-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-white mb-4">
            Verification Pending
          </h1>
          <p className="text-xl text-gray-300 mb-6">
            Thank you for submitting your payment verification!
          </p>
        </div>

        <div className="bg-gray-700/50 rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold text-white mb-3">
            What happens next?
          </h2>
          <ul className="text-left text-gray-300 space-y-2">
            <li className="flex items-start">
              <span className="text-blue-500 mr-2">1.</span>
              <span>Our admin team will review your payment screenshot</span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-500 mr-2">2.</span>
              <span>Verification typically takes 24-48 hours</span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-500 mr-2">3.</span>
              <span>You'll receive an email once approved</span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-500 mr-2">4.</span>
              <span>After approval, you can access your streamer dashboard</span>
            </li>
          </ul>
        </div>

        <div className="space-y-3">
          <p className="text-gray-400">
            You'll be notified via email once your account is verified.
          </p>
          <p className="text-sm text-gray-500">
            You can logout using the button in the navigation bar above.
          </p>
        </div>
      </div>
    </div>
  );
};

export default VerificationPending;
