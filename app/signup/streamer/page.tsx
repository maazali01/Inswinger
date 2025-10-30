'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Check } from 'lucide-react';

interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  features: string[];
  max_concurrent_streams: number;
  max_storage_gb: number;
}

export default function StreamerSignupPage() {
  const router = useRouter();
  const [step, setStep] = useState<'plan' | 'details'>('plan');
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    confirmPassword: '',
    bio: '',
  });

  // SEO: noindex for signup flow
  useEffect(() => {
    document.title = 'Become a Streamer – Plans – StreamHub';
    const desc = 'Choose a StreamHub streamer plan to start broadcasting your sports content.';
    const canonicalHref =
      typeof window !== 'undefined' ? `${location.origin}/signup/streamer` : '/signup/streamer';

    function upsertMeta(name: string, content: string) {
      let el = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement | null;
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute('name', name);
        document.head.appendChild(el);
      }
      el.setAttribute('content', content);
    }
    function upsertLink(rel: string, href: string) {
      let el = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement | null;
      if (!el) {
        el = document.createElement('link');
        el.setAttribute('rel', rel);
        document.head.appendChild(el);
      }
      el.setAttribute('href', href);
    }

    upsertMeta('description', desc);
    upsertMeta('robots', 'noindex, nofollow');
    upsertLink('canonical', canonicalHref);
  }, []);

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    const { data, error } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('active', true)
      .order('price', { ascending: true });

    if (data && !error) {
      setPlans(data.map((plan: any) => ({
        ...plan,
        features: Array.isArray(plan.features) ? plan.features as string[] : []
      }) as SubscriptionPlan));
    }
  };

  const handlePlanSelect = (planId: string) => {
    setSelectedPlan(planId);
    setStep('details');
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (!selectedPlan) {
      setError('Please select a subscription plan');
      return;
    }

    setLoading(true);

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
          },
        },
      });

      if (authError) throw authError;

      if (authData.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: authData.user.id,
            email: formData.email,
            full_name: formData.fullName,
            role: 'streamer',
          });

        if (profileError) throw profileError;

        const { error: streamerError } = await supabase
          .from('streamers')
          .insert({
            profile_id: authData.user.id,
            bio: formData.bio,
            subscription_plan_id: selectedPlan,
            subscription_status: 'trialing',
          });

        if (streamerError) throw streamerError;

        router.push('/dashboard/streamer');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during signup');
    } finally {
      setLoading(false);
    }
  };

  if (step === 'plan') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-2">Choose Your Plan</h1>
            <p className="text-slate-600">Select the perfect plan for your streaming needs</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-8">
            {plans.map((plan) => (
              <Card
                key={plan.id}
                className={`cursor-pointer hover:shadow-lg transition-shadow border-2 ${
                  plan.name === 'Pro' ? 'border-blue-500 relative' : 'hover:border-blue-300'
                }`}
              >
                {plan.name === 'Pro' && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600">
                    Most Popular
                  </Badge>
                )}
                <CardHeader>
                  <CardTitle>{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                  <div className="mt-4">
                    <span className="text-4xl font-bold">${plan.price}</span>
                    <span className="text-slate-600">/month</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <Check className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    onClick={() => handlePlanSelect(plan.id)}
                    className="w-full"
                    variant={plan.name === 'Pro' ? 'default' : 'outline'}
                  >
                    Select {plan.name}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center">
            <Link href="/signup" className="text-sm text-slate-600 hover:underline">
              Back to account type selection
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const selectedPlanData = plans.find((p) => p.id === selectedPlan);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Create Streamer Account</CardTitle>
          <CardDescription>
            Selected: {selectedPlanData?.name} Plan (${selectedPlanData?.price}/month)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignup} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                type="text"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                placeholder="Tell viewers about yourself..."
                rows={3}
              />
            </div>

            <Alert>
              <AlertDescription className="text-xs">
                Note: This is a demo. In production, payment would be processed via Stripe before account creation.
              </AlertDescription>
            </Alert>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Creating account...' : 'Create Streamer Account'}
            </Button>

            <div className="text-center">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setStep('plan')}
                className="text-sm"
              >
                Change plan
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
