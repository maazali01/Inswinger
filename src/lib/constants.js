export const SPORTS_CATEGORIES = [
  'NFL',
  'Football',
  'Cricket',
  'Basketball',
  'F1',
  'Tennis',
  'Boxing',
  'MMA',
  'Hockey'
];

export const USER_ROLES = {
  USER: 'user',
  STREAMER: 'streamer',
  ADMIN: 'admin'
};

export const SUBSCRIPTION_PLANS = [
  {
    id: 'basic',
    name: 'Basic Plan',
    price: 1999,
    currency: 'PKR',
    features: [
      'Stream up to 5 events',
      'Basic analytics',
      'Standard support'
    ]
  },
  {
    id: 'premium',
    name: 'Premium Plan',
    price: 4999,
    currency: 'PKR',
    features: [
      'Unlimited streaming',
      'Advanced analytics',
      'Priority support',
      'Custom branding'
    ]
  },
  {
    id: 'professional',
    name: 'Professional Plan',
    price: 9999,
    currency: 'PKR',
    features: [
      'Unlimited streaming',
      'Full analytics suite',
      '24/7 premium support',
      'Custom branding',
      'API access'
    ]
  }
];

export const MOCK_STREAMS = [
  {
    id: 'mock-1',
    title: 'Manchester United vs Liverpool',
    sport: 'Football',
    summary: 'Epic Premier League clash between two historic rivals',
    start_time: new Date().toISOString(),
    is_live: true
  },
  {
    id: 'mock-2',
    title: 'India vs Pakistan - ODI',
    sport: 'Cricket',
    summary: 'High-stakes cricket match between arch-rivals',
    start_time: new Date().toISOString(),
    is_live: false
  }
];

export const MOCK_BLOGS = [
  {
    id: 'blog-1',
    title: 'Top 10 Goals of the Season',
    slug: 'top-10-goals-season',
    content: 'Amazing goals from around the world...',
    created_at: new Date().toISOString()
  }
];

export const MOCK_EVENTS = [
  {
    id: 'event-1',
    title: 'Champions League Final',
    sport: 'Football',
    start_time: new Date(Date.now() + 86400000).toISOString(),
    end_time: new Date(Date.now() + 93600000).toISOString()
  }
];
