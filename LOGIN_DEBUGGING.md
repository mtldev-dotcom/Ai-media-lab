# Login Debugging Guide

If you're unable to login after signing up, follow these steps to diagnose the issue.

## Step 1: Check Supabase Configuration

Your `NEXT_PUBLIC_SUPABASE_URL` should be your **project URL**, not the REST API endpoint.

✅ **Correct format:**
```
https://your-project-ref.supabase.co
```

❌ **Wrong formats:**
```
http://localhost:3001          (old local setup)
https://rest-api-url.co        (REST endpoint only)
```

Go to Supabase Dashboard → Settings → API and copy the **Project URL** exactly.

## Step 2: Use the Debug Page

1. Start your dev server: `npm run dev`
2. Go to: http://localhost:3000/debug
3. Check if you see session and user information

**Expected output if logged in:**
```
Session: { access_token: "...", user: {...}, ... }
User: { id: "...", email: "nickdevmtl@gmail.com", ... }
Status: ✅ Logged in as: nickdevmtl@gmail.com
```

**If you see empty session:**
- The login didn't work
- Continue to Step 3

## Step 3: Check Browser Console

1. Open DevTools: Press **F12**
2. Go to **Console** tab
3. Try logging in
4. Look for errors starting with:
   - "Failed to fetch" → Network error
   - "Invalid credentials" → Wrong password
   - "User not found" → User doesn't exist
   - "CORS error" → Supabase URL misconfigured

**Common errors:**

### Error: "Failed to fetch"
```
fetch failed: connect ECONNREFUSED
```
- **Cause**: NEXT_PUBLIC_SUPABASE_URL is wrong or unreachable
- **Fix**: Go to Supabase Dashboard → Settings → API and copy the correct **Project URL**

### Error: "Invalid credentials"
```
Invalid login credentials
```
- **Cause**: Wrong email or password
- **Fix**: Double-check your email and password

### Error: "CORS error"
```
Access to XMLHttpRequest has been blocked by CORS policy
```
- **Cause**: Supabase URL is misconfigured
- **Fix**: Verify `NEXT_PUBLIC_SUPABASE_URL` in `.env.local`

## Step 4: Verify Environment Variables

Check your `.env.local` file:

```bash
# Should be the full Supabase project URL
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co

# Should be a long JWT token starting with eyJ...
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...

# Should be the service role key
SUPABASE_SERVICE_KEY=eyJhbGciOi...
```

**⚠️ Critical:** Make sure these are:
- ✅ The FULL content (not truncated)
- ✅ No extra spaces or line breaks
- ✅ Using the right URL (not REST endpoint)

## Step 5: Check Network Tab

1. Open DevTools: Press **F12**
2. Go to **Network** tab
3. Try logging in
4. Look for a request to `/auth/v1/token`
5. Check the response:
   - **Status 200**: Login worked, session was created
   - **Status 401/403**: Invalid credentials
   - **Status 5xx**: Supabase server error

## Step 6: Verify User in Database

Run this SQL in Supabase SQL Editor:

```sql
-- Check if user exists in auth.users
SELECT id, email FROM auth.users WHERE email = 'nickdevmtl@gmail.com';

-- Check if user exists in public.users
SELECT id, email FROM public.users WHERE email = 'nickdevmtl@gmail.com';
```

**Expected output:**
- Both queries return a row with your email
- User IDs should match

If public.users is empty:
- Run the fix from Step 5 of SUPABASE_CLOUD_SETUP.md

## Step 7: Test Login Directly with Supabase CLI

```bash
# Install Supabase CLI if you don't have it
npm install -g @supabase/cli

# Login to Supabase
supabase login

# Connect to your project
supabase link --project-ref your-project-ref

# Test login (optional, requires Node.js script)
```

## Step 8: Clear Cache and Restart

Sometimes browsers cache old configuration:

1. **Clear browser cache:**
   - Press **Ctrl+Shift+Delete** (Windows) or **Cmd+Shift+Delete** (Mac)
   - Clear "Cookies and other site data"
   - Clear "Cached images and files"

2. **Restart dev server:**
   ```bash
   # Stop: Ctrl+C
   # Restart:
   npm run dev
   ```

3. **Clear browser local storage:**
   - Open DevTools (F12)
   - Application → Local Storage
   - Delete all entries for localhost:3000

## Step 9: Check if Session Persists

After login, check if the session is being saved:

1. Go to `/debug` page after logging in
2. Refresh the page
3. Check if session is still there

**If session disappears after refresh:**
- Supabase session persistence might not be working
- Check localStorage: DevTools → Application → Local Storage
- Look for keys starting with `sb-`

## Quick Checklist

- [ ] NEXT_PUBLIC_SUPABASE_URL is the full project URL (not REST endpoint)
- [ ] NEXT_PUBLIC_SUPABASE_ANON_KEY is the full anon key
- [ ] SUPABASE_SERVICE_KEY is set
- [ ] User exists in both auth.users and public.users
- [ ] Auto-sync trigger was created (from Step 5 of setup)
- [ ] Browser cache is cleared
- [ ] Dev server was restarted
- [ ] Debug page shows session info

## If Everything Still Doesn't Work

1. Go to Supabase Dashboard → Settings → API
2. Verify the URL and keys are correct
3. Try regenerating the anon key
4. Check Supabase status: https://status.supabase.com

Or check the GitHub issues for similar problems:
- https://github.com/supabase/supabase-js/issues

---

**After following these steps, try logging in again and let me know which step revealed the issue!**
