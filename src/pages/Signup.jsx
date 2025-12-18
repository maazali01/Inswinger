import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { USER_ROLES } from '../lib/constants';
import SEO from '../components/SEO';
import { useToast } from '../components/ToastContainer';

const Signup = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: USER_ROLES.USER,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const toast = useToast();

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      toast.error('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
      });

      if (signUpError) throw signUpError;
      if (!authData.user) throw new Error('User creation failed');

      const { error: profileError } = await supabase
        .from('users')
        .insert([{
          id: authData.user.id,
          name: formData.name,
          email: formData.email,
          role: formData.role,
          is_verified: formData.role === USER_ROLES.USER,
        }]);

      if (profileError) throw profileError;

      try {
        await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });
      } catch (e) {
        console.warn('Auto sign-in failed', e?.message ?? e);
      }

      toast.success('Account created successfully!');

      if (formData.role === USER_ROLES.STREAMER) {
        navigate('/subscription-plans');
      } else {
        navigate('/home');
      }
    } catch (err) {
      const errorMsg = err.message || 'Signup failed. Please try again.';
      toast.error(errorMsg);
      console.error(err);
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const schema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": "Sign Up - Inswinger+",
    "description": "Create your Inswinger+ account to start streaming sports",
    "url": window.location.href,
  };

  return (
    <>
      <SEO
        title="Sign Up | Inswinger+ - Create Your Account"
        description="Join Inswinger+ today. Create a free account to watch live sports streams or become a streamer and share your favorite sports content."
        keywords="signup, register, create account, sports streaming, join inswinger"
        canonical="/signup"
        noindex={true}
        schema={schema}
      />
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 p-6">
        <div className="max-w-4xl w-full rounded-2xl overflow-hidden shadow-xl grid grid-cols-1 md:grid-cols-2 bg-gray-900">
          {/* Promo Panel */}
          <div className="hidden md:flex flex-col justify-center p-10 gap-6 bg-gradient-to-br from-purple-700 to-blue-600">
            <h1 className="text-4xl font-extrabold text-white">
              Join Inswinger<span className="text-yellow-300">+</span>
            </h1>
            <p className="text-white/90">
              Create an account to follow streams or sign up as a streamer to add links.
            </p>
          </div>

          {/* Signup form */}
          <div className="p-8 md:p-10 bg-gray-800">
            <h2 className="text-2xl font-bold text-white mb-1">Create your account</h2>
            <p className="text-sm text-gray-400 mb-6">Fill in details to get started</p>

            <form onSubmit={handleSignup} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Full name</label>
                <input
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="John Doe"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
                <input
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="you@example.com"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Password</label>
                  <input
                    name="password"
                    type="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="••••••••"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Confirm</label>
                  <input
                    name="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Repeat password"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Account Type</label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value={USER_ROLES.USER}>User (Watch Streams)</option>
                  <option value={USER_ROLES.STREAMER}>Streamer (Add Stream Links)</option>
                </select>
              </div>

              {error && (
                <div className="bg-red-600/10 border border-red-600 text-red-400 px-4 py-3 rounded-lg">
                  {error}
                </div>
              )}

              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg shadow"
                >
                  {loading ? 'Creating account...' : 'Sign up'}
                </button>
              </div>
            </form>

            <div className="mt-6 text-xs text-gray-400 text-center space-y-2">
              <div>
                Already registered?{' '}
                <Link to="/login" className="text-blue-400 hover:text-blue-300">
                  Sign in
                </Link>
              </div>
              <div>
                <Link to="/" className="text-gray-500 hover:text-gray-300">
                  ← Back to Home
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Signup;
