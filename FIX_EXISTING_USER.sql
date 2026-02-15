-- This fixes the login issue for existing user who signed up before the trigger was added
-- Run this in Supabase SQL Editor

-- Step 1: Create the trigger function and trigger (from Step 5)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name, avatar_url)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'name',
    new.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Step 2: Create profile for existing user
-- First, get the user ID from auth.users
-- Then insert into public.users
INSERT INTO public.users (id, email)
SELECT id, email FROM auth.users
WHERE email = 'nickdevmtl@gmail.com'
ON CONFLICT (id) DO NOTHING;

-- Verify it worked
SELECT * FROM public.users WHERE email = 'nickdevmtl@gmail.com';
