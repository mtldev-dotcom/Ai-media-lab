# Fix: Update Supabase for Port 3002

## Step 1: Update Supabase Auth Settings

Go to your Supabase Dashboard:

1. Click your project
2. Go to **Settings** → **Authentication** → **URL Configuration**
3. Update **Redirect URLs** to include:
   ```
   http://localhost:3002/**
   ```

4. If there's a field for **Site URL**, set it to:
   ```
   http://localhost:3002
   ```

5. Click **Save**

## Step 2: Restart Your App

```bash
# Stop the dev server (Ctrl+C)
# Then restart:
npm run dev
```

## Step 3: Clear Browser Cache

1. Press **F12** to open DevTools
2. Press **Ctrl+Shift+Delete** to open Clear Browsing Data
3. Select:
   - ✅ Cookies and other site data
   - ✅ Cached images and files
4. Click **Clear data**

## Step 4: Try Login Again

1. Go to http://localhost:3002
2. Try logging in with:
   - Email: `nickdevmtl@gmail.com`
   - Password: `Lise3517`

You should now be able to login! ✅

---

**If it still doesn't work:**
1. Try the debug page: http://localhost:3002/debug
2. Check browser console (F12) for errors
3. Let me know what error you see
