# AI Media Creation Workspace - User Guide

Complete step-by-step guide for testing all features and flows in the application.

## 📋 Table of Contents

1. [Initial Setup](#initial-setup)
2. [Authentication Testing](#authentication-testing)
3. [API Key Management](#api-key-management)
4. [Project Management](#project-management)
5. [Generation Workflows](#generation-workflows)
6. [Cost Tracking](#cost-tracking)
7. [Error Handling & Recovery](#error-handling--recovery)
8. [Advanced Features](#advanced-features)

---

## Initial Setup

### Prerequisites

Before testing, ensure:
- ✅ Docker Compose running (`docker compose up -d`)
- ✅ Application running (`npm run dev`)
- ✅ Access to http://localhost:3000
- ✅ API keys from at least one provider (OpenAI or Anthropic recommended)

### Check Application Status

1. Open http://localhost:3000 in browser
2. Should redirect to `/login` if not authenticated
3. Database should be initialized with all tables
4. Verify in Docker: `docker compose logs postgres` should show successful startup

---

## Authentication Testing

### Test 1: User Signup

**Objective:** Create new user account

**Steps:**
1. Go to http://localhost:3000/signup
2. Fill in:
   - **Email**: Use test email (e.g., `test@example.com`)
   - **Password**: Strong password (8+ chars, mixed case, numbers)
   - **Confirm Password**: Same password
3. Click **Sign Up**
4. Should redirect to `/projects` if signup successful
5. Check database: `SELECT * FROM users WHERE email = 'test@example.com'`

**Expected Result:**
- ✅ User account created
- ✅ Redirected to projects page
- ✅ User can see welcome message
- ✅ User ID stored in session

**Common Issues:**
- ❌ Email already exists → Try different email
- ❌ Password validation error → Use stronger password
- ❌ Database error → Check Supabase connection

---

### Test 2: User Login

**Objective:** Authenticate existing user

**Steps:**
1. Go to http://localhost:3000/login
2. Enter credentials from Test 1
3. Click **Login**
4. Should redirect to `/projects`

**Expected Result:**
- ✅ Successfully authenticated
- ✅ Session stored in browser
- ✅ User menu shows email

---

### Test 3: Logout

**Objective:** Clear user session

**Steps:**
1. From any protected page, click user menu (top-right)
2. Select **Logout**
3. Should redirect to `/login`
4. Browser back button should not return to protected pages

**Expected Result:**
- ✅ Session cleared
- ✅ Redirected to login
- ✅ Protected routes inaccessible

---

### Test 4: Session Persistence

**Objective:** Verify session survives page refresh

**Steps:**
1. Login to application
2. Navigate to `/projects`
3. Refresh page (F5 or Cmd+R)
4. Should remain logged in

**Expected Result:**
- ✅ Session persists after refresh
- ✅ User data still available
- ✅ No redirect to login

---

## API Key Management

### Test 5: Add API Key - OpenAI

**Objective:** Store encrypted OpenAI API key

**Prerequisites:**
- OpenAI API key (get from https://platform.openai.com/api-keys)

**Steps:**
1. Login to application
2. Go to **Settings** → **API Keys** (or `/settings/api-keys`)
3. Click **Add API Key** button
4. Fill in:
   - **Provider**: Select "OpenAI"
   - **API Key**: Paste your OpenAI key
   - **Key Name**: "OpenAI GPT-4o" (optional but helpful)
5. Click **Add**
6. Should show success message

**Expected Result:**
- ✅ Key added to list (masked: `sk-...YZ`)
- ✅ Status shows "Active"
- ✅ Key stored encrypted in database
- ✅ Last used timestamp shows "Never"

**Verify in Database:**
```sql
SELECT id, provider, key_name, is_active
FROM user_api_keys
WHERE user_id = 'your_user_id';
```

**Security Check:**
- ✅ API key not visible in database (encrypted)
- ✅ API key not in browser console logs
- ✅ API key not in network requests

---

### Test 6: Add API Key - Anthropic

**Objective:** Support multiple providers

**Prerequisites:**
- Anthropic API key (get from https://console.anthropic.com/)

**Steps:**
1. Same as Test 5 but select **Anthropic** as provider
2. Paste Anthropic key
3. Name it "Claude 3.5"

**Expected Result:**
- ✅ Both OpenAI and Anthropic keys in list
- ✅ Each shows correct provider name
- ✅ Both marked as active

---

### Test 7: API Key Validation

**Objective:** Test invalid API key handling

**Steps:**
1. Go to API Keys settings
2. Click **Test** button next to OpenAI key
3. Should show test result within 5 seconds

**Expected Result:**
- ✅ Success message if key is valid
- ✅ Error message if key is invalid
- ✅ No sensitive error details exposed

---

### Test 8: Disable API Key

**Objective:** Deactivate key without deleting

**Steps:**
1. Go to API Keys settings
2. Find an active key
3. Click toggle switch to **Off**
4. Key should show as inactive

**Expected Result:**
- ✅ `is_active` set to false in database
- ✅ Provider selector won't show this key
- ✅ Key still appears in list

---

### Test 9: Delete API Key

**Objective:** Permanently remove API key

**Steps:**
1. Go to API Keys settings
2. Find a key to delete
3. Click **Delete** button
4. Confirm deletion

**Expected Result:**
- ✅ Key removed from list
- ✅ No longer in database
- ✅ Cannot be used for generation

---

## Project Management

### Test 10: Create Project

**Objective:** Create a new project with budget

**Steps:**
1. Go to `/projects` or click **Projects** in navigation
2. Click **New Project** button
3. Fill in:
   - **Project Name**: "AI Art Studio"
   - **Description**: "Test project for image generation"
   - **Budget**: 50 (USD, shown as 5000 cents internally)
4. Click **Create Project**

**Expected Result:**
- ✅ Project created and listed
- ✅ Budget shows as "$50.00"
- ✅ Progress bar shows 0% spent
- ✅ Can see project in database

---

### Test 11: View Project Details

**Objective:** See project information and statistics

**Steps:**
1. Click on project card from list
2. Should navigate to `/projects/[id]`
3. See project details:
   - Name and description
   - Budget and spent amount
   - Progress bar
   - Generation count
   - Asset count
   - Total cost statistics

**Expected Result:**
- ✅ All details displayed correctly
- ✅ Tabs visible: Assets, Generate, Analytics
- ✅ Budget progress bar shows accurately

---

### Test 12: Edit Project

**Objective:** Modify project details

**Steps:**
1. From project detail page, click **Edit** button
2. Modify:
   - **Name**: Change to "Advanced Image Gen"
   - **Description**: Add more details
   - **Budget**: Change to $100
3. Click **Save**

**Expected Result:**
- ✅ Changes reflected immediately
- ✅ Updated in database
- ✅ Budget progress recalculates

---

### Test 13: Delete Project

**Objective:** Archive a project

**Steps:**
1. From project detail page, click **Delete** button
2. Confirm deletion warning
3. Should return to projects list

**Expected Result:**
- ✅ Project removed from list
- ✅ Data soft-deleted (archived_at set)
- ✅ Can recover from deleted projects section (future feature)

---

### Test 14: Multiple Projects

**Objective:** Manage multiple simultaneous projects

**Steps:**
1. Create 3-5 projects with different names
2. Verify all appear in project list
3. Click each to verify separate details
4. Check each has independent budget tracking

**Expected Result:**
- ✅ All projects listed
- ✅ Correct names and descriptions
- ✅ Independent budgets
- ✅ Separate generation tracking

---

## Generation Workflows

### Test 15: Text Generation - OpenAI

**Objective:** Generate text using GPT-4o

**Prerequisites:**
- Project created
- OpenAI API key added

**Steps:**
1. Go to project → **Generate** tab (or `/projects/[id]/generate`)
2. Click **Text** button at top
3. Provider selector should show OpenAI
4. Select model: "gpt-4o"
5. Enter prompt: "Write a short poem about AI creativity"
6. Leave parameters at defaults
7. Cost estimate should show (e.g., "$0.02")
8. Click **Generate Text** button

**During Generation:**
- ✅ Button shows "Generating..."
- ✅ Progress indicator visible
- ✅ Cannot click generate again

**After Generation (5-30 seconds):**
- ✅ Result appears with full text
- ✅ Shows generation metadata
- ✅ Cost shown in green box
- ✅ Generation status: "completed"

**Verify in Database:**
```sql
SELECT id, status, prompt, cost_cents, completed_at
FROM generations
WHERE generation_type = 'text'
ORDER BY created_at DESC LIMIT 1;
```

---

### Test 16: Text Generation - Anthropic

**Objective:** Generate text using Claude

**Prerequisites:**
- Project created
- Anthropic API key added

**Steps:**
1. Same as Test 15
2. Provider selector should show both OpenAI and Anthropic
3. Select **Anthropic** provider
4. Model should auto-select "claude-3-5-sonnet"
5. Same prompt
6. Generate

**Expected Result:**
- ✅ Different output than OpenAI (Claude's style)
- ✅ Cost might differ
- ✅ Both in database with correct provider

---

### Test 17: Image Generation - DALL-E 3

**Objective:** Generate images with OpenAI

**Steps:**
1. Go to project → Generate tab
2. Click **Image** button
3. Provider: OpenAI
4. Model: "dall-e-3"
5. Prompt: "A serene landscape with mountains and lake at sunset"
6. Advanced Settings:
   - Size: 1024x1024
   - Quality: hd
   - Style: natural
7. Cost estimate should show (~$0.08 for HD)
8. Click **Generate Image**

**Expected Result:**
- ✅ Image generation starts
- ✅ Takes 30-60 seconds
- ✅ Image URL appears
- ✅ Can view full size image
- ✅ Cost correctly calculated

---

### Test 18: Image Generation - FAL.ai

**Objective:** Test alternative image provider

**Prerequisites:**
- FAL.ai API key added
- Cost might be different than DALL-E

**Steps:**
1. Same as Test 17
2. Select **FAL** provider
3. Model: "flux-pro"
4. Same prompt
5. Generate

**Expected Result:**
- ✅ Different image (Flux style)
- ✅ Faster generation typically
- ✅ Different cost

---

### Test 19: Advanced Parameters

**Objective:** Test parameter controls impact

**Steps:**
1. Text generation form
2. Click **Advanced Settings** to expand
3. Adjust:
   - **Temperature**: Drag to 0.2 (more focused)
   - **Max Tokens**: Change to 500
   - **Top P**: Keep at default
4. Generate two samples with different temperatures
5. Compare outputs

**Expected Result:**
- ✅ Lower temperature = more consistent, less creative
- ✅ Higher temperature = more creative, more varied
- ✅ Max tokens respected in output
- ✅ Parameters stored in generation record

---

### Test 20: Provider Fallback

**Objective:** Test automatic provider fallback on failure

**Steps:**
1. Add multiple API keys (OpenAI and Anthropic both)
2. Make first provider fail:
   - Set OpenAI priority to 1, Anthropic to 2
   - Use invalid OpenAI key (replace with "invalid")
3. Try text generation
4. System should auto-fallback to Anthropic

**Expected Result:**
- ✅ Generation succeeds with Anthropic
- ✅ Error message indicates fallback
- ✅ Generation record shows Anthropic as provider
- ✅ Cost reflects Anthropic pricing

---

### Test 21: Cost Estimation

**Objective:** Verify pre-generation cost accuracy

**Steps:**
1. Text generation form
2. Change prompt length multiple times
3. Observe cost estimate updating
4. Generate and compare estimated vs actual cost

**Expected Result:**
- ✅ Estimate updates as prompt changes
- ✅ Estimate within 10% of actual cost
- ✅ Actual cost shows after generation

---

### Test 22: Error Recovery

**Objective:** Handle generation errors gracefully

**Steps:**
1. Try generating with no prompt
2. Try generating with extremely long prompt (>5000 chars)
3. Try generating with invalid parameters
4. Disconnect internet and try generation

**Expected Result:**
- ✅ Validation errors shown before generation
- ✅ Helpful error messages
- ✅ Can retry with corrections
- ✅ Session not lost

---

## Cost Tracking

### Test 23: Generation Cost Display

**Objective:** Verify costs shown accurately

**Steps:**
1. Generate multiple items (text and images)
2. Check each generation record shows cost
3. Note total cost in project
4. Verify against provider pricing

**Expected Result:**
- ✅ Each generation shows cost
- ✅ Project total matches sum
- ✅ Budget progress bar updates
- ✅ Color changes if approaching limit (future)

---

### Test 24: Project Budget Tracking

**Objective:** Monitor project spending against budget

**Steps:**
1. Create project with $2 budget
2. Generate 2 text samples (cost ~$0.05 each)
3. View project details
4. Check budget progress:
   - Spent: $0.10
   - Remaining: $1.90
   - Progress: 5%

**Expected Result:**
- ✅ Accurate spent calculation
- ✅ Progress bar reflects percentage
- ✅ Visual warning as approaching limit (future)

---

### Test 25: Cost Breakdown

**Objective:** View detailed cost information

**Steps:**
1. Generate an image
2. Click on cost estimate box
3. Should show breakdown:
   - Model used
   - Parameters
   - Base cost
   - Actual cost

**Expected Result:**
- ✅ Detailed breakdown visible
- ✅ Clear explanation of charges
- ✅ Can understand pricing model

---

## Error Handling & Recovery

### Test 26: Invalid API Key

**Objective:** Handle invalid credentials

**Steps:**
1. Add API key with invalid/fake value
2. Try to generate
3. Should show clear error

**Expected Result:**
- ✅ Error message explains issue
- ✅ Suggests adding valid key
- ✅ Doesn't expose sensitive details
- ✅ Can retry with correct key

---

### Test 27: Rate Limiting

**Objective:** Handle provider rate limits

**Steps:**
1. Make rapid generation requests
2. System should respect rate limits
3. Queue requests appropriately

**Expected Result:**
- ✅ Requests queued
- ✅ No errors from rate limiting
- ✅ Requests complete in order
- ✅ Cost accurate for all

---

### Test 28: Network Error

**Objective:** Handle connection issues

**Steps:**
1. Start generation
2. Disconnect internet
3. Or close browser tab
4. Reconnect

**Expected Result:**
- ✅ Graceful error handling
- ✅ Can retry generation
- ✅ No data loss
- ✅ Session preserved

---

### Test 29: Browser Compatibility

**Objective:** Verify works across browsers

**Steps:**
Test on:
- ✅ Chrome/Edge (Chromium)
- ✅ Firefox
- ✅ Safari
- ✅ Mobile browsers (iOS Safari, Chrome Android)

**Expected Result:**
- ✅ UI renders correctly
- ✅ All features functional
- ✅ Touch targets appropriately sized on mobile
- ✅ Responsive layout works

---

## Advanced Features

### Test 30: Provider Health Monitoring

**Objective:** Monitor provider status

**Steps:**
1. Go to API Keys settings
2. Each provider should show health indicator:
   - 🟢 Green = Healthy
   - 🟡 Yellow = Degraded
   - 🔴 Red = Down
3. Click on health indicator for more info

**Expected Result:**
- ✅ Real-time health status
- ✅ Response times shown
- ✅ Last success/failure timestamps
- ✅ Error messages if unhealthy

---

### Test 31: Multi-Provider Setup

**Objective:** Manage multiple providers

**Steps:**
1. Add 3+ providers (OpenAI, Anthropic, Gemini, FAL)
2. Set priorities:
   - OpenAI: Priority 1
   - Anthropic: Priority 2
   - Gemini: Priority 3
3. Generate multiple items
4. Verify each uses configured provider

**Expected Result:**
- ✅ All providers available
- ✅ Correct priority respected
- ✅ All working independently
- ✅ Fallback to backup if needed

---

### Test 32: Model Selection by Provider

**Objective:** Verify correct models per provider

**Steps:**
1. Select OpenAI → should show: gpt-4o, gpt-4-turbo, gpt-3.5-turbo, dall-e-3
2. Select Anthropic → should show: claude-3-5-sonnet, claude-3-opus, claude-3-haiku
3. Select Gemini → should show: gemini-2-0-flash, gemini-1-5-pro, gemini-1-5-flash
4. Select FAL → should show: flux-pro, flux-realism, runway-gen3, etc.

**Expected Result:**
- ✅ Models match provider capabilities
- ✅ Model list updates when provider changes
- ✅ Default model selected automatically

---

### Test 33: Generation History

**Objective:** Review past generations

**Steps:**
1. Go to project → Generate tab
2. Should show list of past generations:
   - Prompt/description
   - Provider used
   - Cost
   - Date/time
   - Status (completed/failed)
3. Click on past generation to view details

**Expected Result:**
- ✅ All past generations listed
- ✅ Ordered by date (newest first)
- ✅ Can view generation details
- ✅ Can regenerate with same settings

---

### Test 34: Performance Under Load

**Objective:** Verify performance with multiple concurrent requests

**Steps:**
1. Generate 5 items rapidly
2. Monitor:
   - UI responsiveness
   - Network activity
   - Response times
3. Verify all complete successfully

**Expected Result:**
- ✅ UI remains responsive
- ✅ All requests queue properly
- ✅ No errors or timeouts
- ✅ Costs calculated correctly

---

### Test 35: Data Persistence

**Objective:** Verify data survives application restart

**Steps:**
1. Create project and generate content
2. Note project ID and generation ID
3. Restart application (`npm run dev`)
4. Login again
5. Navigate to same project
6. All data should still exist

**Expected Result:**
- ✅ Projects still there
- ✅ Generations still there
- ✅ Costs unchanged
- ✅ API keys still there (encrypted)

---

## 📱 Mobile Testing

### Test 36: Mobile UI Responsiveness

**Objective:** Verify mobile-first design

**Steps:**
1. Open on iPhone (iOS Safari)
2. Open on Android (Chrome)
3. Test common flows:
   - Login
   - View projects
   - Add API key
   - Generate content

**Expected Result:**
- ✅ Text readable without zoom
- ✅ Touch targets 44px+ (thumb-friendly)
- ✅ Forms properly sized
- ✅ No horizontal scroll needed
- ✅ Bottom navigation accessible

---

### Test 37: Mobile Performance

**Objective:** Verify fast loading on mobile

**Steps:**
1. Test on mobile with 4G/LTE (throttled)
2. Measure time to:
   - Page load
   - Generation form display
   - Cost estimation
   - Generation completion

**Expected Result:**
- ✅ Page load < 2s on 4G
- ✅ Form interactive within 1s
- ✅ Generation flows smoothly
- ✅ No janky animations

---

## ✅ Testing Checklist

Use this checklist to track progress:

- [ ] Test 1: User Signup
- [ ] Test 2: User Login
- [ ] Test 3: Logout
- [ ] Test 4: Session Persistence
- [ ] Test 5: Add OpenAI Key
- [ ] Test 6: Add Anthropic Key
- [ ] Test 7: Key Validation
- [ ] Test 8: Disable Key
- [ ] Test 9: Delete Key
- [ ] Test 10: Create Project
- [ ] Test 11: View Project Details
- [ ] Test 12: Edit Project
- [ ] Test 13: Delete Project
- [ ] Test 14: Multiple Projects
- [ ] Test 15: Text Generation (OpenAI)
- [ ] Test 16: Text Generation (Anthropic)
- [ ] Test 17: Image Generation (DALL-E)
- [ ] Test 18: Image Generation (FAL)
- [ ] Test 19: Advanced Parameters
- [ ] Test 20: Provider Fallback
- [ ] Test 21: Cost Estimation
- [ ] Test 22: Error Recovery
- [ ] Test 23: Generation Cost Display
- [ ] Test 24: Project Budget Tracking
- [ ] Test 25: Cost Breakdown
- [ ] Test 26: Invalid API Key
- [ ] Test 27: Rate Limiting
- [ ] Test 28: Network Error
- [ ] Test 29: Browser Compatibility
- [ ] Test 30: Provider Health Monitoring
- [ ] Test 31: Multi-Provider Setup
- [ ] Test 32: Model Selection
- [ ] Test 33: Generation History
- [ ] Test 34: Performance Under Load
- [ ] Test 35: Data Persistence
- [ ] Test 36: Mobile UI
- [ ] Test 37: Mobile Performance

---

## 🐛 Reporting Issues

When reporting bugs, include:

1. **Steps to reproduce**
2. **Expected result**
3. **Actual result**
4. **Screenshots/videos**
5. **Browser/device info**
6. **Console errors** (F12 → Console tab)
7. **Network tab** (F12 → Network tab)
8. **Database query results** if relevant

---

## 📞 Support

- Check [README.md](./README.md) for setup help
- See [FUTURE_IMPLEMENTATIONS.md](./FUTURE_IMPLEMENTATIONS.md) for roadmap
- Review error messages (usually indicate exact issue)
- Check browser console for JavaScript errors

---

**Last Updated**: 2026-02-15
**Guide Version**: 1.0
**Current Phase**: Phase 5 Complete
