import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SUBSCRIPTION_PLANS } from '../lib/constants';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

const SubscriptionPlans = () => {
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user, profile } = useAuth();

  // Redirect non-streamers
  useEffect(() => {
    if (profile && profile.role !== 'streamer') {
      navigate('/home');
    }
  }, [profile, navigate]);

  const handleSelectPlan = async () => {
    if (!selectedPlan) {
      alert('Please select a plan first');
      return;
    }
    
    setLoading(true);
    try {
      if (!user) {
        navigate('/login');
        return;
      }

      // Verify user is a streamer
      if (profile?.role !== 'streamer') {
        throw new Error('Only streamers can select subscription plans');
      }
      
      console.log('Updating plan for streamer:', user.id, 'to:', selectedPlan.id);
      
      // Update streamer's plan (removed updated_at)
      const { data, error } = await supabase
        .from('users')
        .update({ 
          plan: selectedPlan.id
        })
        .eq('id', user.id)
        .eq('role', 'streamer')
        .select();

      if (error) {
        console.error('Plan update error:', error);
        throw error;
      }

      console.log('Plan updated successfully:', data);

      // Navigate to verification upload
      navigate('/verification-upload');
    } catch (error) {
      console.error('Error selecting plan:', error);
      alert(`Failed to select plan: ${error.message || 'Please try again.'}`);
    } finally {
      setLoading(false);
    }
  };

  // Show loading while checking role
  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">
            Choose Your Streaming Plan
          </h1>
          <p className="text-xl text-gray-300">
            Select a plan to start streaming on Inswinger+
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-8">
          {SUBSCRIPTION_PLANS.map((plan) => (
            <div
              key={plan.id}
              onClick={() => setSelectedPlan(plan)}
              className={`card cursor-pointer transform transition-all duration-300 ${
                selectedPlan?.id === plan.id
                  ? 'border-blue-500 scale-105 shadow-2xl'
                  : 'hover:scale-105'
              }`}
            >
              <div className="text-center">
                <h3 className="text-2xl font-bold text-white mb-4">
                  {plan.name}
                </h3>
                <div className="mb-6">
                  <span className="text-5xl font-bold neon-text">
                    {plan.currency} {plan.price.toLocaleString()}
                  </span>
                  <span className="text-gray-400">/month</span>
                </div>
                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center text-gray-300">
                      <svg
                        className="w-5 h-5 text-green-500 mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      {feature}
                    </li>
                  ))}
                </ul>
                {selectedPlan?.id === plan.id && (
                  <div className="text-blue-500 font-semibold">
                    ✓ Selected
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="text-center">
          <button
            onClick={handleSelectPlan}
            disabled={!selectedPlan || loading}
            className="btn-primary text-lg px-12 py-4 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Processing...' : 'Continue to Payment'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionPlans;
