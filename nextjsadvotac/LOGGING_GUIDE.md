# 🔍 Authentication Flow - Detailed Logging Guide

## Overview
Comprehensive logging has been added to track the entire authentication flow from login to dashboard access. All logs are prefixed with emojis and component tags for easy identification.

---

## 📋 Log Prefixes & Meanings

### Emojis Used:
- 🔄 **Action in progress** (redirecting, loading, processing)
- 🔍 **Checking/Inspecting** (verifying data, checking localStorage)
- ✅ **Success** (operation completed successfully)
- ❌ **Error** (something went wrong)
- 🚀 **Navigation** (redirecting to another page)
- 💾 **Storage** (writing/reading localStorage)
- 📡 **API Call** (fetch requests)
- 🔐 **Authentication** (OAuth, login actions)
- 🚪 **Logout** (sign out actions)
- 🧹 **Cleanup** (clearing data)
- ℹ️ **Information** (general info)
- 📋 **Data Summary** (showing data structure)
- 📦 **Data Parsing** (JSON parsing)

### Component Tags:
- `[AUTH]` - Auth page (`/auth`)
- `[CALLBACK]` - OAuth callback page (`/auth/callback`)
- `[DASHBOARD]` - Test dashboard page (`/test_dashboard`)

---

## 🔄 Complete Authentication Flow with Expected Logs

### Step 1: User Visits Auth Page (`/auth`)

**Expected Console Logs:**
```
🔄 [AUTH] Auth page component mounted
🔄 [AUTH] Current URL: https://advotac02.vercel.app/auth
🔍 [AUTH] Checking for existing authentication...
🔍 [AUTH] localStorage check: {hasToken: false, hasUserData: false}
ℹ️ [AUTH] No existing authentication found, showing login page
```

**If User Already Authenticated:**
```
🔄 [AUTH] Auth page component mounted
🔄 [AUTH] Current URL: https://advotac02.vercel.app/auth
🔍 [AUTH] Checking for existing authentication...
🔍 [AUTH] localStorage check: {hasToken: true, hasUserData: true}
✅ [AUTH] User already authenticated, token found: eyJhbGciOiJIUzI1NiIs...
🚀 [AUTH] Redirecting to test_dashboard...
```

---

### Step 2: User Clicks "Continue with Google"

**Expected Console Logs:**
```
🔐 [AUTH] OAuth button clicked, provider: google
🚀 [AUTH] Redirecting to FastAPI OAuth endpoint...
🚀 [AUTH] FastAPI URL: https://fastapi-eight-zeta.vercel.app
🚀 [AUTH] Callback URL (encoded): https%3A%2F%2Fadvotac02.vercel.app%2Fauth%2Fcallback
🚀 [AUTH] Full redirect URL: https://fastapi-eight-zeta.vercel.app/auth/google?callback_url=https%3A%2F%2Fadvotac02.vercel.app%2Fauth%2Fcallback
```

---

### Step 3: FastAPI Processes OAuth (User Completes Google Login)

**Browser redirects to Google → User logs in → Google redirects back to FastAPI → FastAPI redirects to callback**

---

### Step 4: Callback Page Receives Token (`/auth/callback`)

**Expected Console Logs (Success Path):**
```
🔄 [CALLBACK] Starting authentication callback handler...
🔄 [CALLBACK] Current URL: https://advotac02.vercel.app/auth/callback?token=xyz...&email=user@example.com&name=John+Doe
📋 [CALLBACK] URL Parameters received: {hasToken: true, hasError: false, email: "user@example.com", name: "John Doe", hasImage: true}
✅ [CALLBACK] Token received successfully
💾 [CALLBACK] Preparing to store user data in localStorage...
💾 [CALLBACK] Storing authToken in localStorage...
💾 [CALLBACK] Storing userData in localStorage: {email: "user@example.com", name: "John Doe", hasImage: true, timestamp: 1728700000000}
✅ [CALLBACK] Verification - Token stored: true
✅ [CALLBACK] Verification - UserData stored: true
🚀 [CALLBACK] Authentication successful, redirecting to test_dashboard...
🚀 [CALLBACK] Using window.location.href for full page reload
```

**Error Path (No Token):**
```
🔄 [CALLBACK] Starting authentication callback handler...
🔄 [CALLBACK] Current URL: https://advotac02.vercel.app/auth/callback?error=access_denied
📋 [CALLBACK] URL Parameters received: {hasToken: false, hasError: true, email: null, name: null, hasImage: false}
❌ [CALLBACK] Error from OAuth provider: access_denied
🔄 [CALLBACK] Redirecting to /auth due to error...
```

---

### Step 5: Dashboard Page Loads (`/test_dashboard`)

**Expected Console Logs (Success Path):**
```
🔄 [DASHBOARD] Dashboard component mounted, checking authentication...
🔄 [DASHBOARD] Current URL: https://advotac02.vercel.app/test_dashboard
🔍 [DASHBOARD] Checking localStorage for authentication...
🔍 [DASHBOARD] authToken found: true
🔍 [DASHBOARD] userData found: true
✅ [DASHBOARD] Token found in localStorage: eyJhbGciOiJIUzI1NiIs...
📡 [DASHBOARD] Fetching user profile from FastAPI backend...
📡 [DASHBOARD] API Response status: 200
✅ [DASHBOARD] User data received from API: {hasName: true, hasEmail: true, hasImage: true}
💾 [DASHBOARD] Setting user data in state: {name: "John Doe", email: "user@example.com", hasImage: true}
✅ [DASHBOARD] User data fetch complete
```

**Fallback Path (API Fails, Uses localStorage):**
```
🔄 [DASHBOARD] Dashboard component mounted, checking authentication...
🔍 [DASHBOARD] Checking localStorage for authentication...
✅ [DASHBOARD] Token found in localStorage: eyJhbGciOiJIUzI1NiIs...
📡 [DASHBOARD] Fetching user profile from FastAPI backend...
📡 [DASHBOARD] API Response status: 500
❌ [DASHBOARD] Error fetching user data from API: Error: Failed to fetch user data: 500
🔄 [DASHBOARD] Attempting fallback to localStorage data...
📦 [DASHBOARD] Parsing stored user data from localStorage...
✅ [DASHBOARD] Successfully parsed localStorage data: {hasName: true, hasEmail: true, hasImage: true}
💾 [DASHBOARD] Using fallback user data from localStorage
✅ [DASHBOARD] User data fetch complete
```

**No Token Path:**
```
🔄 [DASHBOARD] Dashboard component mounted, checking authentication...
🔍 [DASHBOARD] Checking localStorage for authentication...
🔍 [DASHBOARD] authToken found: false
🔍 [DASHBOARD] userData found: false
❌ [DASHBOARD] No authentication token found
🔄 [DASHBOARD] Redirecting to /auth...
```

---

### Step 6: User Signs Out

**Expected Console Logs:**
```
🚪 [DASHBOARD] Sign out initiated...
🧹 [DASHBOARD] Clearing authentication data from localStorage...
✅ [DASHBOARD] localStorage cleared
🔄 [DASHBOARD] Redirecting to /auth...
```

Then auto-redirect check on auth page:
```
🔄 [AUTH] Auth page component mounted
🔍 [AUTH] Checking for existing authentication...
🔍 [AUTH] localStorage check: {hasToken: false, hasUserData: false}
ℹ️ [AUTH] No existing authentication found, showing login page
```

---

## 🐛 Common Issues & What to Look For

### Issue 1: Redirect Loop (Auth → Auth → Auth)
**What to Check:**
```
🔍 [AUTH] localStorage check: {hasToken: true, hasUserData: true}
```
If this shows `true` but still seeing login page, the redirect might be failing.

**Look for:**
```
✅ [AUTH] User already authenticated, token found: ...
🚀 [AUTH] Redirecting to test_dashboard...
```
If this log appears but you don't reach dashboard, check browser console for navigation errors.

### Issue 2: Token Not Persisting
**What to Check:**
```
💾 [CALLBACK] Storing authToken in localStorage...
✅ [CALLBACK] Verification - Token stored: true
```
Then on dashboard:
```
🔍 [DASHBOARD] authToken found: false
```
This indicates localStorage is being cleared between pages.

### Issue 3: API Call Failing
**What to Check:**
```
📡 [DASHBOARD] API Response status: 401
❌ [DASHBOARD] Token invalid or expired (status: 401)
```
This means the token is invalid or the FastAPI backend is rejecting it.

### Issue 4: Callback URL Not Receiving Token
**What to Check:**
```
📋 [CALLBACK] URL Parameters received: {hasToken: false, hasError: false, ...}
```
This means FastAPI isn't returning a token. Check FastAPI backend logs.

---

## 🧪 How to Test & Debug

### Open Browser DevTools:
1. **Press F12** to open DevTools
2. Go to **Console** tab
3. Clear console (right-click → Clear console)
4. Start the login flow

### Enable All Logs:
Make sure console filters are set to show all log levels:
- ✅ Verbose
- ✅ Info
- ✅ Warnings
- ✅ Errors

### Check localStorage:
1. DevTools → **Application** tab
2. **Local Storage** → `https://advotac02.vercel.app`
3. Look for:
   - `authToken` - Should be a long JWT string
   - `userData` - Should be a JSON object with email, name, image

### Copy Logs for Support:
Right-click in console → **Save as...** to export all logs for debugging.

---

## 📊 Log Categories Summary

| Category | Prefix | When It Appears |
|----------|--------|-----------------|
| Page Load | `🔄 [COMPONENT]` | Component mounts |
| Auth Check | `🔍 [COMPONENT]` | Checking localStorage/session |
| Success | `✅ [COMPONENT]` | Operation succeeds |
| Error | `❌ [COMPONENT]` | Operation fails |
| Redirect | `🚀 [COMPONENT]` | Navigating to another page |
| Storage | `💾 [COMPONENT]` | Reading/writing localStorage |
| API | `📡 [COMPONENT]` | Making HTTP requests |
| OAuth | `🔐 [AUTH]` | OAuth button clicks |
| Logout | `🚪 [DASHBOARD]` | User signs out |

---

## 🎯 Quick Diagnostic Checklist

After logging in, you should see this sequence:

1. ✅ `[AUTH]` OAuth click logs
2. ✅ `[CALLBACK]` Token received logs
3. ✅ `[CALLBACK]` localStorage stored logs
4. ✅ `[CALLBACK]` Redirect to dashboard log
5. ✅ `[DASHBOARD]` Token found logs
6. ✅ `[DASHBOARD]` API success or fallback logs
7. ✅ `[DASHBOARD]` User data set logs

**If any step is missing, that's where the issue is!**

---

## 📝 Files with Logging

1. **`src/app/auth/page.tsx`**
   - Component mount check
   - Existing auth detection
   - OAuth click handler

2. **`src/app/auth/callback/page.tsx`**
   - URL parameter parsing
   - localStorage storage
   - Token verification
   - Redirect logic

3. **`src/app/test_dashboard/page.tsx`**
   - Authentication check
   - API calls
   - Fallback logic
   - Sign out handler

---

**Last Updated:** October 12, 2025
**Status:** ✅ Deployed to Production
