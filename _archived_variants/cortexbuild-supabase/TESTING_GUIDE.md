# 🧪 CortexBuild Testing Guide

**Last Updated**: October 29, 2025  
**Version**: 1.0.0

---

## 📋 Table of Contents

1. [Quick Start](#quick-start)
2. [Testing the Application](#testing-the-application)
3. [Feature Testing Checklist](#feature-testing-checklist)
4. [Real-time Features Testing](#real-time-features-testing)
5. [Performance Testing](#performance-testing)
6. [Browser Compatibility](#browser-compatibility)
7. [Mobile Testing](#mobile-testing)
8. [Common Issues](#common-issues)

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ installed
- Supabase account with active project
- Modern web browser (Chrome, Firefox, Safari, Edge)

### Local Testing Setup

```bash
# 1. Navigate to project directory
cd /Users/admin/Desktop/proiecte\ web/CortexBuild-1.0.0-supabase

# 2. Install dependencies (if not already done)
npm install

# 3. Start development server
npm run dev

# 4. Open in browser
# Navigate to http://localhost:5173
```

---

## 🧪 Testing the Application

### 1. Authentication Testing

#### Login Flow
- [ ] Navigate to the landing page
- [ ] Click on "Login" button
- [ ] Test with valid credentials
- [ ] Test with invalid credentials
- [ ] Check error messages display correctly
- [ ] Verify redirect to appropriate dashboard after login

#### OAuth Testing
- [ ] Test Google OAuth login
- [ ] Test GitHub OAuth login
- [ ] Verify profile information is fetched correctly
- [ ] Check avatar display

#### Role-Based Access
- [ ] Login as **Super Admin** (adrian.stanca1@gmail.com)
  - Verify access to Super Admin Dashboard
  - Check all admin features are visible
- [ ] Login as **Company Admin**
  - Verify access to Company Admin Dashboard
  - Check company management features
- [ ] Login as **Developer**
  - Verify access to Developer Console
  - Check developer tools and SDK features

---

### 2. Dashboard Testing

#### Super Admin Dashboard
```
Login: adrian.stanca1@gmail.com
Password: (your super admin password)
```

Features to test:
- [ ] Platform statistics display correctly
- [ ] Company management panel works
- [ ] User management features functional
- [ ] System health metrics updating
- [ ] Activity logs showing recent actions
- [ ] Analytics charts rendering properly

#### Company Admin Dashboard
Features to test:
- [ ] Project overview displays
- [ ] Team member stats visible
- [ ] Recent activity feed updating
- [ ] Quick action buttons work
- [ ] Navigation to different modules
- [ ] Performance metrics accurate

#### Developer Dashboard
Features to test:
- [ ] API documentation accessible
- [ ] SDK tools available
- [ ] Workflow builder functional
- [ ] Code sandbox working
- [ ] Analytics dashboard displays
- [ ] Integration hub accessible

---

### 3. Core Features Testing

#### Projects Module
- [ ] Create new project
  - Fill in all required fields
  - Upload project image
  - Set project dates
  - Assign team members
- [ ] Edit existing project
- [ ] Delete project (check confirmation)
- [ ] View project details
- [ ] Filter projects by status
- [ ] Search projects by name

#### Tasks Management
- [ ] Create new task
  - Set task title and description
  - Assign to team member
  - Set due date
  - Mark as billable
  - Add tags/labels
- [ ] Edit task details
- [ ] Mark task as complete
- [ ] Delete task
- [ ] Filter tasks by:
  - Status (pending, in progress, completed)
  - Assignee
  - Due date
  - Priority
- [ ] Search tasks

#### RFIs (Requests for Information)
- [ ] Create new RFI
  - Add subject and description
  - Select assignee
  - Set due date
  - Attach files (if applicable)
- [ ] View RFI details
- [ ] Respond to RFI
- [ ] Close RFI
- [ ] Filter RFIs by status
- [ ] Check overdue RFI highlighting

#### Documents
- [ ] Upload document
  - Test different file types (PDF, DOC, XLS, IMG)
  - Test file size limits
  - Check progress indicator
- [ ] View document
- [ ] Download document
- [ ] Delete document
- [ ] Search documents
- [ ] Filter by document type

---

### 4. Advanced Features Testing

#### Time Tracking
- [ ] Start timer
  - Select task and project
  - Add notes
  - Mark as billable
- [ ] Pause/Resume timer
- [ ] Stop timer and save entry
- [ ] View time entries
- [ ] Filter time entries by date
- [ ] Generate time reports
- [ ] Export time tracking data

#### Notifications
- [ ] Receive real-time notifications
- [ ] Mark notification as read
- [ ] Delete notification
- [ ] Filter notifications by:
  - Read/Unread
  - Type
  - Priority
  - Category
- [ ] Search notifications
- [ ] Bulk actions (mark all as read, delete)

#### File Upload
- [ ] Drag and drop files
- [ ] Click to select files
- [ ] Upload multiple files
- [ ] View upload progress
- [ ] Handle upload errors
- [ ] Preview uploaded files
- [ ] Remove files from queue

#### Calendar View
- [ ] Navigate between months
- [ ] Click on date to view events
- [ ] View different event types
- [ ] Filter by event type
- [ ] Create new event
- [ ] Edit existing event
- [ ] Delete event

---

## 🔄 Real-time Features Testing

### WebSocket Connection
```bash
# Check browser console for WebSocket status
# Should see: "✅ WebSocket connected"
```

### Real-time Updates Testing

1. **Notifications**
   - Open two browser windows with different users
   - Create action in one window
   - Verify notification appears in other window

2. **Live Activity Feed**
   - Perform actions (create task, upload file)
   - Check activity feed updates in real-time
   - Verify "Live" indicator is active

3. **Presence Tracking**
   - Open project in multiple windows
   - Check online users indicator
   - Verify user presence updates

---

## ⚡ Performance Testing

### Load Time Testing
- [ ] Initial page load < 3 seconds
- [ ] Dashboard renders < 2 seconds
- [ ] API requests complete < 1 second
- [ ] File uploads show progress smoothly
- [ ] Real-time updates < 500ms latency

### Stress Testing
- [ ] Upload 10+ files simultaneously
- [ ] Create 50+ tasks rapidly
- [ ] Load project with 100+ documents
- [ ] Handle 1000+ notifications
- [ ] Navigate rapidly between screens

### Memory Testing
```bash
# Open Chrome DevTools
# Performance > Memory > Take heap snapshot
# Check for memory leaks after navigation
```

---

## 🌐 Browser Compatibility

### Desktop Browsers
- [ ] Chrome (latest 2 versions)
- [ ] Firefox (latest 2 versions)
- [ ] Safari (latest 2 versions)
- [ ] Edge (latest 2 versions)

### Mobile Browsers
- [ ] Chrome Mobile (Android)
- [ ] Safari Mobile (iOS)
- [ ] Firefox Mobile
- [ ] Samsung Internet

### Testing Checklist Per Browser
- [ ] Login/Logout
- [ ] Navigation
- [ ] Forms submission
- [ ] File upload
- [ ] Notifications display
- [ ] Charts rendering
- [ ] Responsive layout

---

## 📱 Mobile Testing

### Responsive Design
```bash
# Test at different viewport sizes:
# - Mobile: 375x667 (iPhone SE)
# - Tablet: 768x1024 (iPad)
# - Desktop: 1920x1080
```

### Mobile Features
- [ ] Touch gestures work properly
- [ ] Buttons are easily tappable
- [ ] Forms are mobile-friendly
- [ ] Navigation menu accessible
- [ ] File upload from camera
- [ ] GPS location tracking
- [ ] Push notifications
- [ ] Offline mode

### PWA Features
- [ ] Install as app
- [ ] Offline functionality
- [ ] App icon displays
- [ ] Splash screen shows
- [ ] Service worker active

---

## 🐛 Common Issues

### Issue: Blank screen after login
**Solution:**
- Check browser console for errors
- Verify Supabase credentials
- Clear browser cache
- Check network tab for failed requests

### Issue: Real-time updates not working
**Solution:**
- Verify WebSocket connection in console
- Check Supabase Realtime is enabled
- Confirm Row Level Security policies
- Test network connectivity

### Issue: File upload fails
**Solution:**
- Check file size limits
- Verify file type is allowed
- Check Supabase storage bucket exists
- Review storage policies

### Issue: Slow performance
**Solution:**
- Check Network tab for slow requests
- Verify API endpoint responses
- Clear browser cache
- Check database query performance

---

## 🔍 Debug Mode

### Enable Debug Logging
```javascript
// Add to browser console
localStorage.setItem('DEBUG', 'true');
```

### View Network Requests
```bash
# Chrome DevTools
# Network tab > Filter by:
# - API calls
# - WebSocket
# - Media uploads
```

### Check Real-time Subscriptions
```javascript
// Browser console
window.supabaseClient.getChannels();
```

---

## ✅ Testing Checklist Summary

### Before Deployment
- [ ] All authentication flows tested
- [ ] All CRUD operations verified
- [ ] Real-time features working
- [ ] File uploads functional
- [ ] Notifications delivering
- [ ] Analytics displaying correctly
- [ ] Mobile responsive
- [ ] PWA features working
- [ ] No console errors
- [ ] No broken links
- [ ] All forms validated
- [ ] Error messages clear

### Performance Targets
- [ ] Lighthouse score > 90
- [ ] First Contentful Paint < 1.5s
- [ ] Time to Interactive < 3.5s
- [ ] Core Web Vitals passing
- [ ] No memory leaks

---

## 📊 Test Results Template

```markdown
### Test Session: [Date]
**Tester**: [Name]
**Browser**: [Browser/Version]
**Device**: [Desktop/Mobile]

#### Results:
- ✅ Authentication: PASS
- ✅ Dashboard: PASS
- ✅ Projects: PASS
- ✅ Tasks: PASS
- ❌ Notifications: FAIL - Issue with real-time updates
- ✅ File Upload: PASS

#### Issues Found:
1. [Description]
   - Severity: High/Medium/Low
   - Steps to reproduce
   - Expected vs Actual behavior

#### Notes:
[Additional observations]
```

---

## 📞 Support

For testing issues or questions:
- Check documentation: `/docs`
- Review implementation plans
- Contact development team

---

**Happy Testing! 🎉**
