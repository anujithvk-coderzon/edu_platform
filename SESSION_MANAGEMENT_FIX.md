# Session Management Fix - Single Device Login

## Changes Made

### 1. Backend: `src/middleware/auth.ts` (Lines 113-129)

**BEFORE:**
```typescript
// Optional check - only validates if sessionToken exists
if (userType === 'student' && decoded.sessionToken) {
  if (!user.activeSessionToken || user.activeSessionToken !== decoded.sessionToken) {
    return res.status(401).json({
      success: false,
      error: { message: 'Session expired. You have been logged in from another device.' }
    });
  }
}
```

**AFTER:**
```typescript
// Mandatory check - always validates sessionToken for students
if (userType === 'student') {
  // Session token is required for students
  if (!decoded.sessionToken) {
    return res.status(401).json({
      success: false,
      error: { message: 'Invalid session. Please login again.' }
    });
  }

  // Check if session token matches the active one in database
  if (!user.activeSessionToken || user.activeSessionToken !== decoded.sessionToken) {
    return res.status(401).json({
      success: false,
      error: { message: 'Session expired. You have been logged in from another device.' }
    });
  }
}
```

### 2. Frontend: `Student/src/contexts/AuthContext.tsx` (Lines 152-174)

Added **proactive session checking** every 30 seconds:

```typescript
// Periodically check session validity (every 30 seconds)
const sessionCheckInterval = setInterval(async () => {
  if (user) {
    try {
      const currentUser = await authApi.getCurrentUser();
      if (!currentUser) {
        // Session is invalid, log out
        setUser(null);
        window.location.href = '/login?session_expired=true';
      }
    } catch (error) {
      // Session check failed, likely logged out from another device
      const errorMessage = error instanceof Error ? error.message : '';
      if (errorMessage.includes('logged in from another device') || errorMessage.includes('Session expired')) {
        setUser(null);
        studentStorage.clearStudentData();
        window.location.href = '/login?session_expired=true';
      }
    }
  }
}, 30000); // Check every 30 seconds
```

## How It Works

### Login Flow:
1. **Device 1 Login** → Backend generates `sessionToken = "ABC123"` → Stored in DB
2. **Device 2 Login** → Backend generates `sessionToken = "XYZ789"` → **Replaces "ABC123"** in DB
3. **Device 1 Makes Any Request** → Middleware checks: `"ABC123" != "XYZ789"` → **Rejected with 401**
4. **Device 1 Frontend** → Receives 401 → Redirects to `/login?session_expired=true`

### Automatic Detection:
- Frontend checks session validity **every 30 seconds**
- If session is invalid, automatically redirects to login
- **Maximum delay: 30 seconds** before Device 1 is logged out

## Testing Steps

### Test 1: Immediate Logout on API Call
1. Login on PC (Device 1)
2. Login on Mobile (Device 2) with same account
3. On PC, try to:
   - Update profile
   - View courses
   - Make any API request
4. **Expected:** PC gets error "Session expired. You have been logged in from another device." and redirects to login

### Test 2: Automatic Logout (30 seconds)
1. Login on PC (Device 1)
2. Login on Mobile (Device 2) with same account
3. On PC, **don't do anything**, just wait
4. **Expected:** Within 30 seconds, PC automatically redirects to login with message

### Test 3: Profile Update (Your Scenario)
1. Login on PC (Device 1)
2. Login on Mobile (Device 2) with same account
3. On PC, try to update profile data
4. **Expected:** PC gets rejected with session expired error

## Deployment Steps

### 1. Rebuild Backend:
```bash
cd /mnt/d/CoderZone/Edu_Platform/Backend
npm run build
```

### 2. Restart Backend Server:
```bash
# Stop existing server (Ctrl+C if running in terminal)
# Or kill process:
pkill -f "node.*index.js"

# Start server
npm start
# OR for development:
npm run dev
```

### 3. Rebuild Frontend:
```bash
cd /mnt/d/CoderZone/Edu_Platform/Student
npm run build
```

### 4. Restart Frontend:
```bash
npm run dev
# OR for production:
npm start
```

## Important Notes

1. **Existing Sessions:** Old JWT tokens (issued before this fix) might not have sessionToken. These will be rejected, requiring users to login again.

2. **Session Check Interval:** Currently set to 30 seconds. You can adjust this in `AuthContext.tsx` line 172:
   - Faster check (10s): `}, 10000);` - More responsive but more API calls
   - Slower check (60s): `}, 60000);` - Less API calls but slower detection

3. **Admin Accounts:** Admins/Tutors can still login from multiple devices (no sessionToken restriction).

4. **Database Field:** Uses existing `activeSessionToken` field in Student model (already in schema).

## Troubleshooting

### Issue: Can still use both devices
**Cause:** Backend server not restarted with new code
**Fix:** Rebuild and restart backend

### Issue: Getting "Invalid session" on every request
**Cause:** Old JWT tokens without sessionToken
**Fix:** Clear cookies and login again

### Issue: Too many session checks
**Cause:** 30-second interval might be too frequent
**Fix:** Increase interval in AuthContext.tsx (e.g., 60000ms for 1 minute)

## Security Benefits

- ✅ Prevents account sharing
- ✅ Protects against stolen tokens
- ✅ Ensures single active session per student
- ✅ Immediate invalidation on new login
- ✅ Proactive session validation
