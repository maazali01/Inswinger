import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import SEO from '../components/SEO';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) throw signInError;

      // Get user profile to determine role
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', data.user.id)
        .single();

      if (profileError) throw profileError;

      // Redirect based on role
      switch (profile.role) {
        case 'admin':
          navigate('/admin/dashboard');
          break;
        case 'streamer':
          // If streamer hasn't selected a subscription plan yet, send them to plans
          if (!profile.plan) {
            navigate('/subscription-plans');
          } else if (profile.is_verified) {
            navigate('/streamer/dashboard');
          } else {
            navigate('/verification-pending');
          }
          break;
        case 'user':
        default:
          navigate('/home');
          break;
      }
    } catch (err) {
      setError(err.message || 'Failed to sign in');
    } finally {
      setLoading(false);
    }
  };

  const schema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": "Login - Inswinger+",
    "description": "Sign in to your Inswinger+ account to access live sports streams",
    "url": window.location.href,
  };

  return (
    <>
      <SEO
        title="Login | Inswinger+ - Live Sports Streaming"
        description="Sign in to Inswinger+ to watch live sports streams, manage your profile, and follow your favorite teams."
        keywords="login, sign in, sports streaming, inswinger login"
        canonical="/login"
        noindex={true}
        schema={schema}
      />
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 p-6">
        <div className="max-w-4xl w-full rounded-2xl overflow-hidden shadow-xl grid grid-cols-1 md:grid-cols-2 bg-gray-900">
          {/* Brand panel */}
          <div className="hidden md:flex flex-col justify-center p-10 gap-6 bg-gradient-to-br from-blue-600 to-purple-700">
            <div>
              <h1 className="text-4xl font-extrabold text-white">
                Inswinger
                <span className="text-yellow-300">+</span>
              </h1>
              <p className="mt-2 text-white/90">
                Live sports, curated streams and community highlights.
              </p>
            </div>
            <div className="text-sm text-white/80">
              <p>
                Sign in to manage or watch streams. Streamers: upload links to
                admin-created templates.
              </p>
            </div>
          </div>

          {/* Form panel */}
          <div className="p-8 md:p-10 bg-gray-800">
            <h2 className="text-2xl font-bold text-white mb-1">
              Welcome back
            </h2>
            <p className="text-sm text-gray-400 mb-6">
              Sign in to continue to Inswinger+
            </p>

            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="you@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="••••••••"
                />
              </div>

              {error && (
                <div className="bg-red-600/10 border border-red-600 text-red-400 px-4 py-3 rounded-lg">
                  {error}
                </div>
              )}

              <div className="flex items-center justify-between">
                <Link
                  to="/signup"
                  className="text-sm text-blue-400 hover:text-blue-300"
                >
                  Create an account
                </Link>
                <Link
                  to="/"
                  className="text-sm text-gray-400 hover:text-gray-300"
                >
                  ← Back to Home
                </Link>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg shadow"
                >
                  {loading ? 'Signing in...' : 'Sign in'}
                </button>
              </div>
            </form>

            <div className="mt-6 text-xs text-gray-400 text-center">
              By signing in you agree to our{' '}
              <Link to="#" className="text-blue-400">
                Terms
              </Link>
              .
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Login;
