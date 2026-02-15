-- Add encryption_auth_tag column to user_api_keys table
ALTER TABLE public.user_api_keys
ADD COLUMN encryption_auth_tag TEXT;

-- Update any existing rows (set a placeholder value if needed)
-- For local development, this shouldn't affect anything yet
