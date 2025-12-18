-- Add to existing blogs table
ALTER TABLE public.blogs ADD COLUMN IF NOT EXISTS published BOOLEAN DEFAULT false;

-- Add thumbnail column to blogs table
ALTER TABLE public.blogs ADD COLUMN IF NOT EXISTS thumbnail TEXT;

-- Make slug nullable (if it exists)
ALTER TABLE public.blogs ALTER COLUMN slug DROP NOT NULL;

-- OR if you want to auto-generate slugs, create a function
CREATE OR REPLACE FUNCTION generate_slug_from_title()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    NEW.slug := lower(regexp_replace(NEW.title, '[^a-zA-Z0-9]+', '-', 'g'));
    NEW.slug := trim(both '-' from NEW.slug);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-generate slug
DROP TRIGGER IF EXISTS blogs_generate_slug ON public.blogs;
CREATE TRIGGER blogs_generate_slug
  BEFORE INSERT OR UPDATE ON public.blogs
  FOR EACH ROW
  EXECUTE FUNCTION generate_slug_from_title();

-- Create SEO cache table
CREATE TABLE IF NOT EXISTS public.seo_cache (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    page_type TEXT NOT NULL,
    page_identifier TEXT NOT NULL, -- slug, id, or 'homepage'
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    keywords TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(page_type, page_identifier)
);

-- RLS for SEO cache (allow all authenticated users to read, only system to write)
ALTER TABLE public.seo_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read SEO cache"
ON public.seo_cache FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "System can insert SEO cache"
ON public.seo_cache FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "System can update SEO cache"
ON public.seo_cache FOR UPDATE
TO authenticated
USING (true);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_seo_cache_lookup 
ON public.seo_cache(page_type, page_identifier);

-- Add plan column to users table
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS plan TEXT;

-- Add updated_at column to users table
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());

-- Create trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_users_plan ON public.users(plan);

-- The plan column already exists from previous migration
-- Just ensure it's used correctly only for streamers

-- Update any existing users to have NULL plan if they're not streamers
UPDATE public.users 
SET plan = NULL 
WHERE role != 'streamer';
