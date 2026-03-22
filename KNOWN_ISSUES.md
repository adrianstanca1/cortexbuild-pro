# Known Issues - CortexBuild V2.0

## 🐛 Active Issues

### 1. React Hooks Error ~~(INTERMITTENT)~~ ✅ FIXED

**Error Message:**
```
Rendered more hooks than during the previous render.
```

**Status:** ✅ FIXED

**Root Cause:**
- In `App.tsx`, `useMemo` and `useCallback` hooks were defined AFTER early return blocks
- This violated React's Rules of Hooks (hooks must be called in same order on every render)
- When role-based early returns were taken, those hooks were skipped, causing the error

**Fix Applied:**
- Moved `getSidebarProject` (useMemo) and `sidebarGoHome` (useCallback) to BEFORE the early return blocks
- Hooks are now defined immediately after other hooks at the top of App.tsx
- This ensures hooks are always called in the same order regardless of code path

**Files Modified:**
- `App.tsx` - Moved hooks before conditional returns (lines 242-254)

**Prevention:**
- All hooks must be defined before ANY conditional returns
- Use ESLint rule `react-hooks/rules-of-hooks` to catch this automatically

---

### 2. My Applications API - Schema Issue (MINOR)

**Error Message:**
```
SqliteError: no such column: sa.config
```

**Status:** ✅ LOW PRIORITY - Only affects legacy server/ directory

**Impact:**
- This issue only affects the legacy `server/` directory which uses SQLite
- The new `nextjs_space/` app uses PostgreSQL and does not have this issue
- Does not affect main application functionality

**Note:**
- The `user_app_installations` and `company_app_installations` tables are from the old architecture
- They are not referenced in the new nextjs_space app API routes
- This can be safely ignored for now

---

## ✅ Resolved Issues

### 1. API URL Configuration (FIXED)

**Issue:** Frontend was making requests to wrong API URL

**Solution:** Updated `.env.local`:
```bash
# Before
VITE_API_URL=http://localhost:3001

# After
VITE_API_URL=http://localhost:3001/api
```

**Status:** ✅ RESOLVED

---

### 2. React Hooks Error in UnifiedDashboardScreen (FIXED)

**Issue:** `useState` was called conditionally for different user roles

**Solution:** Created `SuperAdminDashboardWrapper` component to isolate hooks

**Status:** ✅ RESOLVED

---

## 🔧 Debugging Tools

### Check Backend Logs:
```bash
# Backend runs in terminal 145
# Check logs for errors
```

### Check Frontend Console:
```bash
# Open browser DevTools (F12)
# Check Console tab for errors
# Check Network tab for failed API calls
```

### Test API Endpoints:
```bash
# Health check
curl http://localhost:3001/api/health

# Login test
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"adrian.stanca1@gmail.com","password":"Cumparavinde1"}'

# Projects test (with token)
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3001/api/projects
```

### Database Queries:
```bash
# Check users
sqlite3 cortexbuild.db "SELECT email, role FROM users;"

# Check table schema
sqlite3 cortexbuild.db ".schema user_app_installations"

# Check installed apps
sqlite3 cortexbuild.db "SELECT * FROM user_app_installations;"
```

---

## 📝 Notes

### React Hooks Rules:
1. **Always call hooks at the top level** - Never inside loops, conditions, or nested functions
2. **Call hooks in the same order** - React relies on the order of hook calls
3. **Only call hooks from React functions** - Not from regular JavaScript functions

### Common Patterns That Cause Hook Errors:
```typescript
// ❌ BAD - Conditional hook
if (condition) {
  const [state, setState] = useState(false);
}

// ✅ GOOD - Hook always called
const [state, setState] = useState(false);
if (condition) {
  // Use state here
}

// ❌ BAD - Early return before hooks
if (!user) return null;
const [state, setState] = useState(false);

// ✅ GOOD - Hooks before early return
const [state, setState] = useState(false);
if (!user) return null;
```

### Debugging React Hooks Errors:
1. Check the browser console for the component stack trace
2. Look for the component that's causing the issue
3. Verify all hooks are called unconditionally
4. Check if any lazy-loaded components have hooks
5. Use React DevTools to inspect component tree

---

## 🚀 Next Steps

1. **Fix My Applications API schema issue**
   - Add `config` column to tables or update SQL query

2. **Investigate React Hooks error**
   - Add more detailed logging
   - Check all lazy-loaded components
   - Verify component render order

3. **Add error boundaries**
   - Wrap dashboard components in error boundaries
   - Provide better error messages to users

4. **Add integration tests**
   - Test login flow
   - Test dashboard switching
   - Test API calls

---

## 📞 Support

If you encounter any issues:
1. Check this document first
2. Check browser console for errors
3. Check backend logs for API errors
4. Try refreshing the page
5. Try clearing localStorage and logging in again

---

**Last Updated:** 2025-10-11  
**Version:** 2.0.0

