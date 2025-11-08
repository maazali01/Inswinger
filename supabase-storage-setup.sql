-- Create verification-screenshots storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('verification-screenshots', 'verification-screenshots', true)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Policy: Allow authenticated users to upload verification screenshots
CREATE POLICY "Users can upload verification screenshots"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'verification-screenshots'
);

-- Policy: Allow authenticated users to read verification screenshots
CREATE POLICY "Users can view verification screenshots"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'verification-screenshots'
);

-- Policy: Allow admins to view all verification screenshots
CREATE POLICY "Admins can view all verification screenshots"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'verification-screenshots' AND
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid() AND users.role = 'admin'
  )
);

-- Policy: Allow admins to delete verification screenshots
CREATE POLICY "Admins can delete verification screenshots"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'verification-screenshots' AND
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid() AND users.role = 'admin'
  )
);

-- Policy: Allow public read access (since bucket is public)
CREATE POLICY "Public can view verification screenshots"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'verification-screenshots');
