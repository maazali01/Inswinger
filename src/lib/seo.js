export const SEO_METADATA = {
  // Landing Page
  landing: {
    title: 'Inswinger+ | Live Sports Streaming Platform',
    description: 'Watch live sports streams including Football, Cricket, Basketball, Tennis, NFL, F1, Boxing, MMA, and Hockey. Join thousands of sports fans on the ultimate sports streaming platform.',
    keywords: 'sports streaming, live sports, football live, cricket streaming, basketball online, tennis matches, NFL streams, F1 racing, boxing fights, MMA events, hockey games, watch sports online',
  },
  
  // User Dashboard
  userDashboard: {
    title: 'Live Sports Streams | Watch Now on Inswinger+',
    description: 'Browse and watch live sports streaming events. Access football, cricket, basketball, tennis, and more. HD quality streams with real-time chat and community features.',
    keywords: 'live sports dashboard, sports streaming hub, watch sports, live matches, sports events, football streams, cricket matches, basketball games',
  },
  
  // Stream View - Dynamic per stream
  streamView: (streamTitle) => ({
    title: `Watch ${streamTitle || 'Live Sports'} | Inswinger+`,
    description: `Watch ${streamTitle || 'live sports'} streaming in HD quality. Join the live chat, connect with fans, and enjoy the best sports streaming experience on Inswinger+.`,
    keywords: 'live stream, sports streaming, watch online, HD quality, live chat, sports fans, streaming platform',
  }),
  
  // Blogs Page
  blogs: {
    title: 'Sports Blogs & News | Latest Updates - Inswinger+',
    description: 'Read the latest sports blogs, news, and analysis. Stay updated with expert opinions, match reviews, player insights, and sports industry trends on Inswinger+.',
    keywords: 'sports blogs, sports news, match analysis, player insights, sports articles, sports journalism, sports updates, sports commentary',
  },
  
  // Events Page
  events: {
    title: 'Upcoming Sports Events | Schedule & Fixtures - Inswinger+',
    description: 'View upcoming sports events, match schedules, and fixtures. Never miss a game with our comprehensive sports calendar covering all major leagues and tournaments.',
    keywords: 'sports events, upcoming matches, sports schedule, sports fixtures, match calendar, tournament dates, sports timetable',
  },
  
  // Login Page
  login: {
    title: 'Login to Inswinger+ | Access Your Sports Dashboard',
    description: 'Login to your Inswinger+ account to access live sports streams, personalized content, and exclusive features. Join the sports streaming community today.',
    keywords: 'login, sign in, sports streaming login, user account, access dashboard',
  },
  
  // Signup Page
  signup: {
    title: 'Sign Up for Inswinger+ | Create Free Account',
    description: 'Create your free Inswinger+ account to watch live sports, access exclusive content, and join our vibrant sports community. Sign up in seconds and start streaming.',
    keywords: 'sign up, create account, register, join inswinger, free account, sports streaming signup',
  },
  
  // Subscription Plans
  subscriptionPlans: {
    title: 'Streamer Subscription Plans | Become a Broadcaster - Inswinger+',
    description: 'Join as a streamer on Inswinger+. Choose from flexible subscription plans and start broadcasting live sports to thousands of fans. Affordable pricing and premium features.',
    keywords: 'streamer plans, subscription packages, broadcaster account, streaming plans, become streamer, sports broadcasting',
  },

  // Admin: User Management
  adminUserManagement: {
    title: 'User Management | Admin - Inswinger+',
    description: 'Admin dashboard for managing users on Inswinger+. View, search, and remove users, manage roles and verification status.',
    keywords: 'admin user management, manage users, delete users, user roles, streamer verification, admin dashboard',
  },
};
