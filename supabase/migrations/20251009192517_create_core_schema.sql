-- =============================================
-- Core Database Schema for Live Streaming Platform
-- =============================================
-- This migration creates the foundational database structure for a production-ready
-- live-streaming platform with role-based access, subscriptions, and content management.

-- Create custom types for better data integrity
CREATE TYPE user_role AS ENUM ('visitor', 'user', 'streamer', 'admin');
CREATE TYPE stream_status AS ENUM ('scheduled', 'live', 'ended', 'recorded');
CREATE TYPE stream_visibility AS ENUM ('public', 'private');
CREATE TYPE subscription_status AS ENUM ('active', 'canceled', 'past_due', 'trialing');
CREATE TYPE payment_status AS ENUM ('succeeded', 'failed', 'pending', 'refunded');

-- =============================================
-- TABLE: profiles
-- Extended user profiles with role-based access control
-- =============================================
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  full_name text,
  role user_role DEFAULT 'user' NOT NULL,
  avatar_url text,
  stripe_customer_id text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- =============================================
-- TABLE: subscription_plans
-- Available subscription tiers for streamers
-- =============================================
CREATE TABLE IF NOT EXISTS subscription_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  price numeric(10,2) NOT NULL,
  currency text DEFAULT 'USD' NOT NULL,
  stripe_price_id text,
  features jsonb DEFAULT '[]'::jsonb,
  max_concurrent_streams integer DEFAULT 1,
  max_storage_gb integer DEFAULT 10,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- =============================================
-- TABLE: streamers
-- Extended streamer profiles with subscription info
-- =============================================
CREATE TABLE IF NOT EXISTS streamers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid UNIQUE REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  bio text,
  verified boolean DEFAULT false,
  subscription_plan_id uuid REFERENCES subscription_plans(id),
  stripe_subscription_id text,
  subscription_status subscription_status,
  subscription_started_at timestamptz,
  subscription_ends_at timestamptz,
  total_followers integer DEFAULT 0,
  total_views bigint DEFAULT 0,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- =============================================
-- TABLE: streams
-- Live and recorded stream content
-- =============================================
CREATE TABLE IF NOT EXISTS streams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  streamer_id uuid REFERENCES streamers(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text,
  category text NOT NULL,
  start_time timestamptz,
  end_time timestamptz,
  status stream_status DEFAULT 'scheduled' NOT NULL,
  visibility stream_visibility DEFAULT 'public' NOT NULL,
  subscription_required boolean DEFAULT false,
  recording_url text,
  thumbnail_url text,
  livepeer_stream_id text,
  livepeer_playback_id text,
  view_count bigint DEFAULT 0,
  tags text[] DEFAULT ARRAY[]::text[],
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- =============================================
-- TABLE: stream_analytics
-- Per-stream analytics and metrics
-- =============================================
CREATE TABLE IF NOT EXISTS stream_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stream_id uuid REFERENCES streams(id) ON DELETE CASCADE NOT NULL,
  date date NOT NULL,
  total_views integer DEFAULT 0,
  unique_viewers integer DEFAULT 0,
  avg_watch_time_seconds integer DEFAULT 0,
  peak_concurrent_viewers integer DEFAULT 0,
  total_chat_messages integer DEFAULT 0,
  countries jsonb DEFAULT '{}'::jsonb,
  devices jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(stream_id, date)
);

-- =============================================
-- TABLE: followers
-- Streamer following relationships
-- =============================================
CREATE TABLE IF NOT EXISTS followers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  streamer_id uuid REFERENCES streamers(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(user_id, streamer_id)
);

-- =============================================
-- TABLE: chats
-- Real-time chat messages
-- =============================================
CREATE TABLE IF NOT EXISTS chats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stream_id uuid REFERENCES streams(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  message text NOT NULL,
  moderated boolean DEFAULT false,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- =============================================
-- TABLE: blogs
-- Blog posts and articles
-- =============================================
CREATE TABLE IF NOT EXISTS blogs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  title text NOT NULL,
  content text NOT NULL,
  excerpt text,
  author_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  featured_image text,
  meta_description text,
  canonical_url text,
  tags text[] DEFAULT ARRAY[]::text[],
  categories text[] DEFAULT ARRAY[]::text[],
  published boolean DEFAULT false,
  published_at timestamptz,
  view_count bigint DEFAULT 0,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- =============================================
-- TABLE: events
-- Upcoming sports events calendar
-- =============================================
CREATE TABLE IF NOT EXISTS events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  start_time timestamptz NOT NULL,
  end_time timestamptz,
  venue text,
  sport_type text NOT NULL,
  event_url text,
  thumbnail_url text,
  created_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- =============================================
-- TABLE: payments
-- Payment transaction records
-- =============================================
CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  stripe_payment_intent_id text,
  amount numeric(10,2) NOT NULL,
  currency text DEFAULT 'USD' NOT NULL,
  status payment_status DEFAULT 'pending' NOT NULL,
  description text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- =============================================
-- TABLE: subscriptions
-- Subscription history and status
-- =============================================
CREATE TABLE IF NOT EXISTS subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  plan_id uuid REFERENCES subscription_plans(id) NOT NULL,
  status subscription_status DEFAULT 'active' NOT NULL,
  stripe_subscription_id text,
  current_period_start timestamptz,
  current_period_end timestamptz,
  canceled_at timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- =============================================
-- TABLE: watch_history
-- User viewing history
-- =============================================
CREATE TABLE IF NOT EXISTS watch_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  stream_id uuid REFERENCES streams(id) ON DELETE CASCADE NOT NULL,
  watch_time_seconds integer DEFAULT 0,
  last_position_seconds integer DEFAULT 0,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(user_id, stream_id)
);

-- =============================================
-- TABLE: site_settings
-- CMS and site configuration
-- =============================================
CREATE TABLE IF NOT EXISTS site_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value jsonb NOT NULL,
  description text,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- =============================================
-- TABLE: stream_types
-- Catalog of allowed stream types that streamers will select when creating streams
-- Fields: id, name, slug, description, active, timestamps
-- =============================================
CREATE TABLE IF NOT EXISTS stream_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text,
  active boolean DEFAULT true,
  -- Admin-defined default scheduled time for this stream type
  start_time timestamptz,
  end_time timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- =============================================
-- INDEXES for performance optimization
-- =============================================
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_streamers_profile_id ON streamers(profile_id);
CREATE INDEX IF NOT EXISTS idx_streams_streamer_id ON streams(streamer_id);
CREATE INDEX IF NOT EXISTS idx_streams_category ON streams(category);
CREATE INDEX IF NOT EXISTS idx_streams_status ON streams(status);
CREATE INDEX IF NOT EXISTS idx_streams_slug ON streams(slug);
CREATE INDEX IF NOT EXISTS idx_chats_stream_id ON chats(stream_id);
CREATE INDEX IF NOT EXISTS idx_chats_created_at ON chats(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_blogs_slug ON blogs(slug);
CREATE INDEX IF NOT EXISTS idx_blogs_published ON blogs(published);
CREATE INDEX IF NOT EXISTS idx_blogs_published_at ON blogs(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_events_start_time ON events(start_time);
CREATE INDEX IF NOT EXISTS idx_followers_user_id ON followers(user_id);
CREATE INDEX IF NOT EXISTS idx_followers_streamer_id ON followers(streamer_id);
CREATE INDEX IF NOT EXISTS idx_watch_history_user_id ON watch_history(user_id);

-- New indexes for stream_types
CREATE INDEX IF NOT EXISTS idx_stream_types_slug ON stream_types(slug);
CREATE INDEX IF NOT EXISTS idx_stream_types_active ON stream_types(active);
CREATE INDEX IF NOT EXISTS idx_stream_types_start_time ON stream_types(start_time);

-- =============================================
-- FUNCTIONS for automated updates
-- =============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to relevant tables
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_streamers_updated_at BEFORE UPDATE ON streamers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_streams_updated_at BEFORE UPDATE ON streams
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_blogs_updated_at BEFORE UPDATE ON blogs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_watch_history_updated_at BEFORE UPDATE ON watch_history
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger for stream_types
CREATE TRIGGER update_stream_types_updated_at BEFORE UPDATE ON stream_types
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE streamers ENABLE ROW LEVEL SECURITY;
ALTER TABLE streams ENABLE ROW LEVEL SECURITY;
ALTER TABLE stream_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE followers ENABLE ROW LEVEL SECURITY;
ALTER TABLE chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE blogs ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE watch_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE stream_types ENABLE ROW LEVEL SECURITY; -- added

-- Profiles policies
CREATE POLICY "Users can view all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Subscription plans policies (public read)
CREATE POLICY "Anyone can view active subscription plans"
  ON subscription_plans FOR SELECT
  TO authenticated, anon
  USING (active = true);

CREATE POLICY "Only admins can manage subscription plans"
  ON subscription_plans FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- =============================================
-- Stream types policies
-- Admins manage; public (anon/auth) can select active types
-- =============================================
CREATE POLICY "Anyone can view active stream types"
  ON stream_types FOR SELECT
  TO authenticated, anon
  USING (active = true);

CREATE POLICY "Only admins can manage stream types"
  ON stream_types FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Streamers policies
CREATE POLICY "Anyone can view streamers"
  ON streamers FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "Streamers can update own profile"
  ON streamers FOR UPDATE
  TO authenticated
  USING (profile_id = auth.uid())
  WITH CHECK (profile_id = auth.uid());

CREATE POLICY "Authenticated users can create streamer profile"
  ON streamers FOR INSERT
  TO authenticated
  WITH CHECK (profile_id = auth.uid());

-- Streams policies
CREATE POLICY "Anyone can view public streams"
  ON streams FOR SELECT
  TO authenticated, anon
  USING (visibility = 'public');

CREATE POLICY "Streamers can view own private streams"
  ON streams FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM streamers
      WHERE streamers.id = streams.streamer_id
      AND streamers.profile_id = auth.uid()
    )
  );

CREATE POLICY "Streamers can create own streams"
  ON streams FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM streamers
      WHERE streamers.id = streamer_id
      AND streamers.profile_id = auth.uid()
    )
  );

CREATE POLICY "Streamers can update own streams"
  ON streams FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM streamers
      WHERE streamers.id = streams.streamer_id
      AND streamers.profile_id = auth.uid()
    )
  );

CREATE POLICY "Streamers can delete own streams"
  ON streams FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM streamers
      WHERE streamers.id = streams.streamer_id
      AND streamers.profile_id = auth.uid()
    )
  );

-- Stream analytics policies
CREATE POLICY "Streamers can view own stream analytics"
  ON stream_analytics FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM streams
      JOIN streamers ON streamers.id = streams.streamer_id
      WHERE streams.id = stream_analytics.stream_id
      AND streamers.profile_id = auth.uid()
    )
  );

-- Followers policies
CREATE POLICY "Users can view all followers"
  ON followers FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can follow streamers"
  ON followers FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can unfollow streamers"
  ON followers FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Chat policies
CREATE POLICY "Users can view stream chats"
  ON chats FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "Authenticated users can send chat messages"
  ON chats FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own messages"
  ON chats FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Blog policies
CREATE POLICY "Anyone can view published blogs"
  ON blogs FOR SELECT
  TO authenticated, anon
  USING (published = true OR author_id = auth.uid());

CREATE POLICY "Authors can create blogs"
  ON blogs FOR INSERT
  TO authenticated
  WITH CHECK (
    author_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'streamer')
    )
  );

CREATE POLICY "Authors can update own blogs"
  ON blogs FOR UPDATE
  TO authenticated
  USING (author_id = auth.uid())
  WITH CHECK (author_id = auth.uid());

CREATE POLICY "Authors can delete own blogs"
  ON blogs FOR DELETE
  TO authenticated
  USING (author_id = auth.uid());

-- Events policies
CREATE POLICY "Anyone can view events"
  ON events FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "Admins can manage events"
  ON events FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Payments policies
CREATE POLICY "Users can view own payments"
  ON payments FOR SELECT
  TO authenticated
  USING (profile_id = auth.uid());

-- Subscriptions policies
CREATE POLICY "Users can view own subscriptions"
  ON subscriptions FOR SELECT
  TO authenticated
  USING (profile_id = auth.uid());

-- Watch history policies
CREATE POLICY "Users can view own watch history"
  ON watch_history FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can update own watch history"
  ON watch_history FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update watch progress"
  ON watch_history FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Site settings policies
CREATE POLICY "Anyone can view site settings"
  ON site_settings FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "Only admins can manage site settings"
  ON site_settings FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );
  CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);
