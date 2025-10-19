# 🔍 DEBUGGING QUICK START - Console Logs Active

## ✅ What's Been Added

**Comprehensive logging throughout the entire authentication flow!** Every step now logs to the browser console to help identify issues.

---

## 🚀 How to See the Logs

### 1. Open Browser Console
- **Windows/Linux:** Press `F12` or `Ctrl + Shift + J`
- **Mac:** Press `Cmd + Option + J`

### 2. Go to Console Tab
- Click the **Console** tab in DevTools
- Clear previous logs: Right-click → **Clear console**

### 3. Test Login Flow
1. Go to: **https://advotac02.vercel.app/auth**
2. Click **"Continue with Google"**
3. Complete Google login
4. Watch the console logs!

---

## 📋 What You'll See (Success Flow)

### On `/auth` page:
```
🔄 [AUTH] Auth page component mounted
🔍 [AUTH] Checking for existing authentication...
ℹ️ [AUTH] No existing authentication found, showing login page
```

### When clicking Google button:
```
🔐 [AUTH] OAuth button clicked, provider: google
🚀 [AUTH] Redirecting to FastAPI OAuth endpoint...
🚀 [AUTH] Full redirect URL: https://fastapi-eight-zeta.vercel.app/auth/google?callback_url=...
```

### On callback page:
```
🔄 [CALLBACK] Starting authentication callback handler...
✅ [CALLBACK] Token received successfully
💾 [CALLBACK] Storing authToken in localStorage...
💾 [CALLBACK] Storing userData in localStorage...
✅ [CALLBACK] Verification - Token stored: true
🚀 [CALLBACK] Authentication successful, redirecting to test_dashboard...
```

### On dashboard page:
```
🔄 [DASHBOARD] Dashboard component mounted, checking authentication...
✅ [DASHBOARD] Token found in localStorage: eyJhbGci...
📡 [DASHBOARD] Fetching user profile from FastAPI backend...
📡 [DASHBOARD] API Response status: 200
✅ [DASHBOARD] User data received from API
✅ [DASHBOARD] User data fetch complete
```

---

## 🐛 If Something Goes Wrong

### Look for Red ❌ Symbols:
```
❌ [CALLBACK] No token received from OAuth provider
❌ [DASHBOARD] No authentication token found
❌ [DASHBOARD] Token invalid or expired (status: 401)
```

### Check localStorage:
1. DevTools → **Application** tab
2. **Local Storage** → `https://advotac02.vercel.app`
3. Should see:
   - `authToken` - JWT token
   - `userData` - User info JSON

---

## 🎯 Common Issues & What to Look For

### Issue: Stuck on Auth Page
**Look for:**
```
✅ [AUTH] User already authenticated, token found: ...
🚀 [AUTH] Redirecting to test_dashboard...
```
If you see this but don't redirect → Browser console may show navigation error

### Issue: Token Not Found on Dashboard
**Look for:**
```
💾 [CALLBACK] Verification - Token stored: true
```
Then:
```
❌ [DASHBOARD] No authentication token found
```
This means localStorage was cleared between pages.

### Issue: API Returning 401/403
**Look for:**
```
📡 [DASHBOARD] API Response status: 401
❌ [DASHBOARD] Token invalid or expired
```
Token is invalid. Check FastAPI backend.

---

## 📸 Share Logs for Support

### To Export Console Logs:
1. Right-click in Console
2. Click **"Save as..."**
3. Save as `console-logs.txt`
4. Share the file for debugging

### Or Screenshot:
- Take a screenshot of the console
- Include ALL messages (scroll up if needed)

---

## 🧪 Test Commands

### Clear Everything & Start Fresh:
```javascript
// Paste in console:
localStorage.clear();
console.clear();
location.reload();
```

### Check Current Auth Status:
```javascript
// Paste in console:
console.log('Token:', localStorage.getItem('authToken'));
console.log('User Data:', localStorage.getItem('userData'));
```

### Force Redirect to Dashboard:
```javascript
// Paste in console (if you have valid token):
window.location.href = '/test_dashboard';
```

---

## 📝 Log Categories

| Symbol | Meaning | Example |
|--------|---------|---------|
| 🔄 | Action in progress | Component loading |
| 🔍 | Checking/Inspecting | Verifying token |
| ✅ | Success | Operation completed |
| ❌ | Error | Something failed |
| 🚀 | Navigation | Redirecting |
| 💾 | Storage | localStorage write |
| 📡 | API Call | HTTP request |
| 🔐 | Authentication | OAuth action |

---

## 🎨 Browser Console Tips

### Filter Logs:
- Type `[AUTH]` to see only auth page logs
- Type `[CALLBACK]` to see only callback logs
- Type `[DASHBOARD]` to see only dashboard logs
- Type `❌` to see only errors

### Preserve Logs Across Navigation:
1. Console settings (gear icon)
2. Check ☑️ **"Preserve log"**
3. Logs won't clear when page changes

---

## 🚦 Expected Flow Summary

```
1. /auth → Logs show no token → Show login
2. Click Google → Logs show OAuth redirect
3. Google login → Returns to /auth/callback
4. /auth/callback → Logs show token storage
5. Redirect to /test_dashboard → Logs show token found
6. Dashboard loads → Logs show API success
7. ✅ User sees dashboard!
```

**If flow breaks at any step, logs will show exactly where!**

---

## 📞 Need Help?

If you're still having issues:
1. ✅ Open console (F12)
2. ✅ Clear console
3. ✅ Enable "Preserve log"
4. ✅ Go through login flow
5. ✅ Copy ALL console output
6. ✅ Check localStorage in Application tab
7. ✅ Share logs + localStorage contents

---

**Deployed:** ✅ October 12, 2025
**Production URL:** https://advotac02.vercel.app
**Status:** Logging Active

**Test now with F12 open to see detailed logs!** 🎉
