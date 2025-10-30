-- =============================================
-- Seed Initial Data
-- =============================================
-- This migration seeds the database with initial subscription plans,
-- site settings, and sample content for development/testing

-- Insert subscription plans for streamers
INSERT INTO subscription_plans (name, description, price, features, max_concurrent_streams, max_storage_gb, active)
VALUES
  (
    'Starter',
    'Perfect for new streamers getting started',
    29.99,
    '["1 concurrent stream", "10GB storage", "Basic analytics", "Chat moderation", "Standard support"]'::jsonb,
    1,
    10,
    true
  ),
  (
    'Pro',
    'For growing streamers who need more features',
    79.99,
    '["3 concurrent streams", "50GB storage", "Advanced analytics", "Priority chat moderation", "Custom branding", "Priority support"]'::jsonb,
    3,
    50,
    true
  ),
  (
    'Enterprise',
    'Maximum features for professional streamers',
    199.99,
    '["Unlimited concurrent streams", "500GB storage", "Full analytics suite", "Advanced moderation tools", "White-label options", "Dedicated support", "API access"]'::jsonb,
    999,
    500,
    true
  )
ON CONFLICT DO NOTHING;

-- Insert default site settings
INSERT INTO site_settings (key, value, description)
VALUES
  (
    'seo_defaults',
    '{
      "site_name": "StreamHub",
      "site_description": "Watch live sports streaming from top athletes and teams. NFL, Football, Basketball, Cricket, F1, and more.",
      "og_image": "/og-default.jpg",
      "twitter_handle": "@streamhub"
    }'::jsonb,
    'Default SEO metadata for the site'
  ),
  (
    'robots_txt',
    '{
      "content": "User-agent: *\\nAllow: /\\nSitemap: https://yourdomain.com/sitemap.xml"
    }'::jsonb,
    'robots.txt file content'
  ),
  (
    'chat_settings',
    '{
      "rate_limit_seconds": 3,
      "max_message_length": 500,
      "profanity_filter_enabled": true,
      "slow_mode_seconds": 0
    }'::jsonb,
    'Chat moderation and rate limiting settings'
  ),
  (
    'stream_categories',
    '{
      "categories": ["NFL", "Football", "Cricket", "F1", "Racing", "Basketball", "Boxing", "MMA", "Tennis", "Hockey", "Other"]
    }'::jsonb,
    'Available stream categories'
  ),
  (
    'homepage_featured',
    '{
      "hero_title": "Watch Live Sports Streaming",
      "hero_subtitle": "Connect with top streamers broadcasting NFL, Football, Basketball, and more",
      "featured_stream_ids": []
    }'::jsonb,
    'Homepage featured content configuration'
  )
ON CONFLICT (key) DO NOTHING;