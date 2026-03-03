# Sprint A Implementation Tickets (Weeks 4-6)

> **Sprint Goal**: Establish offline-first foundation, authentication, time tracking, and photo capture  
> **Team**: 2-3 Mobile Engineers, 1-2 Backend Engineers  
> **Duration**: 3 weeks  
> **Story Points**: 55

---

## Epic 1: Offline-First Infrastructure

### Ticket FA-001: Setup React Native Project with Offline Storage

**Type**: Task  
**Priority**: P0 (Blocker)  
**Story Points**: 8  
**Assignee**: Mobile Lead

**Description**:
Initialize React Native project with TypeScript, configure WatermelonDB for offline storage, and set up background sync infrastructure.

**Acceptance Criteria**:

- ✅ React Native 0.72+ project initialized with TypeScript
- ✅ WatermelonDB installed and configured with SQLite adapter
- ✅ Database schema defined for core entities (Projects, TimeEntries, Photos, Users)
- ✅ Background sync service skeleton created
- ✅ App builds successfully on iOS and Android
- ✅ Hot reload working in dev mode
- ✅ ESLint + Prettier configured

**Technical Notes**:

```bash
npx react-native init ASAgentsField --template react-native-template-typescript
cd ASAgentsField
npm install @nozbe/watermelondb @nozbe/with-observables
npm install --save-dev @nozbe/watermelondb-babel-plugin
```

**Schema Example**:

```typescript
// model/schema.ts
export const appSchema = appSchema({
  version: 1,
  tables: [
    tableSchema({
      name: 'projects',
      columns: [
        { name: 'project_id', type: 'string', isIndexed: true },
        { name: 'name', type: 'string' },
        { name: 'status', type: 'string' },
        { name: 'synced_at', type: 'number', isOptional: true },
      ]
    }),
    // ... more tables
  ]
});
```

**Dependencies**: None  
**Blockers**: None

---

### Ticket FA-002: Implement Conflict Resolution Engine

**Type**: Feature  
**Priority**: P0 (Blocker)  
**Story Points**: 13  
**Assignee**: Backend Engineer

**Description**:
Build sync engine with conflict resolution strategy (last-write-wins per field) and queue management for offline actions.

**Acceptance Criteria**:

- ✅ Sync queue table created in local DB
- ✅ Queue manager enqueues mutations (create/update/delete)
- ✅ Sync worker processes queue when online
- ✅ Conflict resolution: last-write-wins per field (merge strategy)
- ✅ Failed syncs retry with exponential backoff (3 retries max)
- ✅ Sync status visible in UI (pending count, last sync time)
- ✅ Manual sync trigger available
- ✅ Unit tests for conflict scenarios

**Conflict Resolution Logic**:

```typescript
// Server-side conflict resolution
function resolveConflict(local: Record, server: Record): Record {
  const resolved = { ...server }; // Start with server version
  
  // Field-level merge
  for (const [key, value] of Object.entries(local)) {
    if (local.updated_at > server.updated_at) {
      resolved[key] = value; // Local wins for this field
    }
  }
  
  resolved.updated_at = Math.max(local.updated_at, server.updated_at);
  return resolved;
}
```

**Edge Cases**:

- Network drops mid-sync (transaction rollback)
- Concurrent edits from multiple devices
- Record deleted on server but updated locally

**Dependencies**: FA-001  
**Blockers**: None

---

### Ticket FA-003: Network State Management & Retry Logic

**Type**: Feature  
**Priority**: P1  
**Story Points**: 5  
**Assignee**: Mobile Engineer

**Description**:
Implement network state detection, automatic retry logic, and user-facing connectivity indicators.

**Acceptance Criteria**:

- ✅ Network state detection using `@react-native-community/netinfo`
- ✅ Automatic sync triggers when connectivity restored
- ✅ Exponential backoff for failed requests (1s, 2s, 4s)
- ✅ Offline banner shown when disconnected (yellow, persistent)
- ✅ Sync icon with pending count badge
- ✅ Toast notifications for sync success/failure
- ✅ Manual retry button in offline banner

**UI Components**:

```tsx
// components/OfflineBanner.tsx
export const OfflineBanner = () => {
  const { isConnected, pendingCount } = useNetworkState();
  
  if (isConnected) return null;
  
  return (
    <View style={styles.banner}>
      <Icon name="cloud-offline" />
      <Text>Offline — {pendingCount} items pending</Text>
      <Button onPress={retrySync}>Retry</Button>
    </View>
  );
};
```

**Dependencies**: FA-002  
**Blockers**: None

---

## Epic 2: Authentication & User Management

### Ticket FA-004: Backend JWT Authentication Endpoints

**Type**: Feature  
**Priority**: P0 (Blocker)  
**Story Points**: 5  
**Assignee**: Backend Engineer

**Description**:
Enhance existing `/api/auth` endpoints for mobile app, add refresh token flow, and device registration.

**Acceptance Criteria**:

- ✅ POST `/api/auth/login` returns access + refresh tokens
- ✅ POST `/api/auth/refresh` validates refresh token, returns new access token
- ✅ POST `/api/auth/logout` invalidates refresh token
- ✅ POST `/api/auth/device/register` stores device token for push notifications
- ✅ GET `/api/auth/me` returns current user profile
- ✅ Access tokens expire in 15 minutes
- ✅ Refresh tokens expire in 30 days
- ✅ Tokens stored securely (bcrypt for refresh tokens)

**API Contracts**:

```typescript
// POST /api/auth/login
Request: { email: string, password: string, device_id?: string }
Response: {
  success: true,
  data: {
    access_token: string,
    refresh_token: string,
    expires_in: 900, // 15 min
    user: { id, email, name, role, company_id }
  }
}

// POST /api/auth/refresh
Request: { refresh_token: string }
Response: {
  success: true,
  data: {
    access_token: string,
    expires_in: 900
  }
}
```

**Security**:

- Access tokens: JWT with short expiry
- Refresh tokens: Opaque tokens, hashed in DB, rotated on use
- Device binding: Optional device_id for token theft detection

**Dependencies**: Existing `/api/auth` routes in `server/src/routes/auth.ts`  
**Blockers**: None

---

### Ticket FA-005: Mobile Auth State Management

**Type**: Feature  
**Priority**: P0 (Blocker)  
**Story Points**: 8  
**Assignee**: Mobile Engineer

**Description**:
Implement secure token storage, auto-refresh logic, and React Navigation authentication flow.

**Acceptance Criteria**:

- ✅ Tokens stored in `react-native-keychain` (encrypted)
- ✅ Auth context provider with login/logout/refresh methods
- ✅ Axios interceptor adds `Authorization: Bearer <token>` to requests
- ✅ 401 responses trigger automatic token refresh
- ✅ After 3 failed refreshes, user logged out
- ✅ React Navigation auth flow: unauthenticated stack vs authenticated stack
- ✅ Biometric authentication option (Face ID/Touch ID)

**Auth Context**:

```typescript
// contexts/AuthContext.tsx
interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [tokens, setTokens] = useState<Tokens | null>(null);
  
  // Auto-refresh 2 minutes before expiry
  useEffect(() => {
    if (tokens?.expires_at) {
      const timeout = setTimeout(
        refreshToken, 
        (tokens.expires_at - Date.now()) - 120000
      );
      return () => clearTimeout(timeout);
    }
  }, [tokens]);
  
  // ... implementation
};
```

**Dependencies**: FA-004  
**Blockers**: None

---

### Ticket FA-006: Login & Profile Screens

**Type**: Feature  
**Priority**: P1  
**Story Points**: 5  
**Assignee**: Mobile Engineer

**Description**:
Build login screen and user profile screen with offline-first considerations.

**Acceptance Criteria**:

- ✅ Login screen with email/password fields
- ✅ "Remember Me" toggle (keeps user logged in)
- ✅ Biometric login option (if enrolled)
- ✅ Form validation (email format, password min length)
- ✅ Loading states during login
- ✅ Error messages displayed inline
- ✅ Profile screen shows user details (name, role, company)
- ✅ Logout button on profile screen
- ✅ Offline indicator on login screen (cached credentials work)

**Screens**:

```
Login Screen:
┌─────────────────────────────────────┐
│         ASAgents Field              │
├─────────────────────────────────────┤
│ Email: ___________________________  │
│ Password: ________________________  │
│ ☐ Remember Me   [🔒 Use Face ID]   │
├─────────────────────────────────────┤
│ [          Login          ]         │
│ Forgot Password?                    │
└─────────────────────────────────────┘

Profile Screen:
┌─────────────────────────────────────┐
│ ← Profile           [Settings ⚙️]   │
├─────────────────────────────────────┤
│ [Avatar]                            │
│ John Smith                          │
│ Foreman, ABC Construction           │
├─────────────────────────────────────┤
│ Email: john@abc.com                 │
│ Phone: (555) 123-4567               │
│ Role: Foreman                       │
│ Company: ABC Construction           │
├─────────────────────────────────────┤
│ [Change Password]                   │
│ [Notification Settings]             │
│ [          Logout          ]        │
└─────────────────────────────────────┘
```

**Dependencies**: FA-005  
**Blockers**: None

---

## Epic 3: Time Tracking with Geofence

### Ticket FA-007: Backend Time Tracking API

**Type**: Feature  
**Priority**: P1  
**Story Points**: 5  
**Assignee**: Backend Engineer

**Description**:
Enhance `/api/time-tracking` endpoints for clock in/out with GPS validation and cost code assignment.

**Acceptance Criteria**:

- ✅ POST `/api/time-tracking/clock-in` creates time entry with GPS
- ✅ POST `/api/time-tracking/clock-out` closes time entry
- ✅ GET `/api/time-tracking/current` returns active time entry
- ✅ GET `/api/time-tracking/entries?date=YYYY-MM-DD` returns daily entries
- ✅ GET `/api/time-tracking/summary?start=YYYY-MM-DD&end=YYYY-MM-DD` returns totals
- ✅ Cost codes validated against project settings
- ✅ GPS coordinates stored for geofence validation
- ✅ Break tracking (start/end break)

**API Contracts**:

```typescript
// POST /api/time-tracking/clock-in
Request: {
  project_id: string,
  cost_code: string,
  location: { lat: number, lng: number },
  device_id?: string
}
Response: {
  success: true,
  data: {
    id: string,
    clock_in: ISO8601,
    cost_code: string,
    location: { lat, lng },
    inside_geofence: boolean
  }
}

// POST /api/time-tracking/clock-out
Request: {
  entry_id: string,
  location: { lat: number, lng: number }
}
Response: {
  success: true,
  data: {
    id: string,
    clock_in: ISO8601,
    clock_out: ISO8601,
    duration_minutes: number,
    breaks: Break[],
    total_work_minutes: number
  }
}
```

**Database Schema**:

```sql
CREATE TABLE time_entries (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  project_id UUID NOT NULL,
  cost_code VARCHAR(50) NOT NULL,
  clock_in TIMESTAMP NOT NULL,
  clock_out TIMESTAMP,
  clock_in_location POINT, -- PostGIS for GPS
  clock_out_location POINT,
  inside_geofence_in BOOLEAN,
  inside_geofence_out BOOLEAN,
  breaks JSONB DEFAULT '[]',
  total_minutes INTEGER,
  approved_by UUID,
  approved_at TIMESTAMP,
  synced_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Dependencies**: Existing `/api/time-tracking` routes in `server/src/routes/timeTracking.ts`  
**Blockers**: None

---

### Ticket FA-008: Mobile Geofence & Background Location

**Type**: Feature  
**Priority**: P1  
**Story Points**: 8  
**Assignee**: Mobile Engineer

**Description**:
Implement geofencing for project sites with entry/exit notifications and background location tracking.

**Acceptance Criteria**:

- ✅ Geofences registered for all active projects (center + radius)
- ✅ Entry notification: "You're near [Project]. Clock in?"
- ✅ Exit notification: "Leaving [Project]. Clock out?"
- ✅ Background location permission requested
- ✅ Geofence triggers work when app backgrounded
- ✅ Battery-efficient location tracking (significant changes only)
- ✅ Manual clock in/out still available (with reason field)
- ✅ Location accuracy indicator (<50m = good, 50-100m = fair, >100m = poor)

**Implementation**:

```typescript
// services/GeofenceService.ts
import Geolocation from '@react-native-community/geolocation';
import { Platform } from 'react-native';
import PushNotification from 'react-native-push-notification';

class GeofenceService {
  watchId: number | null = null;
  
  startMonitoring(projects: Project[]) {
    this.watchId = Geolocation.watchPosition(
      (position) => this.checkGeofences(position, projects),
      (error) => console.error(error),
      {
        enableHighAccuracy: false, // Battery-efficient
        distanceFilter: 100, // Update every 100m
        interval: 300000, // 5 minutes
      }
    );
  }
  
  checkGeofences(position: Position, projects: Project[]) {
    const { latitude, longitude } = position.coords;
    
    for (const project of projects) {
      const distance = this.calculateDistance(
        latitude, 
        longitude, 
        project.geofence.lat, 
        project.geofence.lng
      );
      
      if (distance <= project.geofence.radius) {
        this.triggerNotification('entry', project);
      }
    }
  }
  
  // Haversine formula for distance
  calculateDistance(lat1, lon1, lat2, lon2): number {
    // ... implementation
  }
}
```

**Platform Specifics**:

- **iOS**: Request `AlwaysAndWhenInUse` location permission
- **Android**: Request `ACCESS_FINE_LOCATION` + `ACCESS_BACKGROUND_LOCATION` (API 29+)

**Dependencies**: FA-007  
**Blockers**: None

---

### Ticket FA-009: Clock In/Out UI & Time Summary

**Type**: Feature  
**Priority**: P1  
**Story Points**: 5  
**Assignee**: Mobile Engineer

**Description**:
Build clock in/out interface on Home screen with visual feedback, cost code picker, and daily/weekly time summaries.

**Acceptance Criteria**:

- ✅ Large clock in/out button on Home screen (changes color when clocked in)
- ✅ Cost code picker (dropdown or modal)
- ✅ "Last clocked in at HH:MM" indicator
- ✅ Current duration display (live counter when clocked in)
- ✅ Geofence status indicator (inside/outside/unknown)
- ✅ Break start/end buttons (when clocked in)
- ✅ Manual override reason field (if outside geofence)
- ✅ Daily time summary card (total hours, by cost code)
- ✅ Weekly summary screen (7-day view)
- ✅ Export to CSV button (for payroll)

**UI Components**:

```
Home Screen (Clocked Out):
┌─────────────────────────────────────┐
│ ⏱ Clock In  [Geofence: Inside ✓]  │
│  Last: 17:05 yesterday              │
│  Cost Code: [Framing ▽]             │
│                                     │
│  [      CLOCK IN      ]             │
│        (tap to start)               │
└─────────────────────────────────────┘

Home Screen (Clocked In):
┌─────────────────────────────────────┐
│ ⏱ Clocked In  [3:42:15 elapsed]    │
│  Since: 08:15   CC: Framing         │
│  Location: Inside geofence ✓        │
│                                     │
│  [   Start Break   ]   [ Clock Out ]│
└─────────────────────────────────────┘

Daily Summary:
┌─────────────────────────────────────┐
│ Today — Oct 2, 2025                 │
│ Total: 7.5 hours                    │
├─────────────────────────────────────┤
│ Framing (CC-201):    6.0h           │
│ Cleanup (CC-299):    1.5h           │
│ Break time:          0.5h           │
└─────────────────────────────────────┘
```

**Dependencies**: FA-008  
**Blockers**: None

---

## Epic 4: Photo Capture & Management

### Ticket FA-010: Backend Photo Upload & Storage

**Type**: Feature  
**Priority**: P1  
**Story Points**: 5  
**Assignee**: Backend Engineer

**Description**:
Implement photo upload endpoint with metadata extraction, thumbnail generation, and CDN storage.

**Acceptance Criteria**:

- ✅ POST `/api/photos/upload` accepts multipart/form-data
- ✅ EXIF data extracted (GPS, timestamp, camera model)
- ✅ Thumbnails generated (150x150, 300x300 pixels)
- ✅ Files stored in S3/CloudFlare R2 with signed URLs
- ✅ Metadata stored in DB (filename, size, GPS, tags, related_entity)
- ✅ GET `/api/photos?project_id=&date=&tags=` returns filtered list
- ✅ DELETE `/api/photos/:id` soft-deletes photo
- ✅ Batch upload support (up to 20 photos)

**API Contracts**:

```typescript
// POST /api/photos/upload
Request: FormData {
  file: Blob,
  project_id: string,
  tags?: string[], // ['daily_log', 'progress', 'issue']
  related_type?: string, // 'daily_log' | 'task' | 'rfi' | 't_m'
  related_id?: string,
  notes?: string
}
Response: {
  success: true,
  data: {
    id: string,
    url: string,
    thumbnail_url: string,
    metadata: {
      size_bytes: number,
      mime_type: string,
      gps: { lat, lng },
      captured_at: ISO8601,
      camera: string
    }
  }
}
```

**Storage Structure**:

```
s3://asagents-photos/
  /{company_id}/
    /{project_id}/
      /{year}/
        /{month}/
          /{photo_id}.jpg
          /{photo_id}_thumb_150.jpg
          /{photo_id}_thumb_300.jpg
```

**Performance**:

- Accept uploads up to 10MB per photo
- Thumbnail generation <2 seconds
- Batch uploads processed asynchronously

**Dependencies**: Existing `/api/uploads` routes (can extend or create new `/api/photos`)  
**Blockers**: S3/CloudFlare R2 bucket setup

---

### Ticket FA-011: Mobile Camera Integration

**Type**: Feature  
**Priority**: P1  
**Story Points**: 5  
**Assignee**: Mobile Engineer

**Description**:
Integrate native camera with auto-tagging, offline queue, and background upload.

**Acceptance Criteria**:

- ✅ Camera launches from "Quick Capture" button (Home screen)
- ✅ Photo captured with GPS + timestamp metadata
- ✅ Auto-tagging: project_id, date, location
- ✅ Optional manual tags (progress, issue, safety, etc.)
- ✅ Optional notes field (voice-to-text available)
- ✅ Photos queued for upload (visible count in sync status)
- ✅ Background upload when wifi available (user setting)
- ✅ Thumbnail shown immediately after capture
- ✅ Photo library integration (select existing photos)

**Implementation**:

```typescript
// components/QuickCapture.tsx
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import Geolocation from '@react-native-community/geolocation';

const capturePhoto = async () => {
  const result = await launchCamera({
    mediaType: 'photo',
    quality: 0.8,
    includeBase64: false,
    saveToPhotos: true,
  });
  
  if (result.assets?.[0]) {
    const location = await getCurrentLocation();
    
    const photo = {
      uri: result.assets[0].uri,
      filename: result.assets[0].fileName,
      type: result.assets[0].type,
      size: result.assets[0].fileSize,
      metadata: {
        gps: location,
        captured_at: new Date().toISOString(),
      },
      project_id: currentProject.id,
      tags: ['progress'], // default tag
      synced: false,
    };
    
    await database.photos.create(photo);
    queueForUpload(photo.id);
  }
};
```

**Platform Permissions**:

- **iOS**: `NSCameraUsageDescription`, `NSPhotoLibraryUsageDescription`
- **Android**: `CAMERA`, `READ_EXTERNAL_STORAGE`, `WRITE_EXTERNAL_STORAGE`

**Dependencies**: FA-010  
**Blockers**: None

---

### Ticket FA-012: Photo Gallery & Management

**Type**: Feature  
**Priority**: P2  
**Story Points**: 5  
**Assignee**: Mobile Engineer

**Description**:
Build photo gallery screen with filtering, search, multi-select, and offline viewing.

**Acceptance Criteria**:

- ✅ Photo grid view (3 columns, thumbnails)
- ✅ Filter by date, project, tags
- ✅ Search by notes/tags
- ✅ Tap photo to view full-screen with pinch-zoom
- ✅ Swipe left/right to navigate between photos
- ✅ Multi-select mode (checkbox overlay)
- ✅ Batch delete (with confirmation)
- ✅ Share photos (via native share sheet)
- ✅ Show upload status (pending, uploading, synced)
- ✅ Offline photos cached for viewing

**UI Flow**:

```
Gallery Screen:
┌─────────────────────────────────────┐
│ Photos           [Filter ▽] [Search]│
├─────────────────────────────────────┤
│ Today — 12 photos                   │
│ [IMG] [IMG] [IMG]                   │
│ [IMG] [IMG] [IMG]                   │
│ [IMG] [IMG] [IMG]                   │
├─────────────────────────────────────┤
│ Yesterday — 8 photos                │
│ [IMG] [IMG] [IMG]                   │
└─────────────────────────────────────┘

Full-Screen View:
┌─────────────────────────────────────┐
│ ← [Share] [Delete]                  │
│                                     │
│         [   PHOTO   ]               │
│       (pinch to zoom)               │
│                                     │
│ Oct 2, 2025 14:32                   │
│ North Tower, Grid C5                │
│ Tags: progress, framing             │
└─────────────────────────────────────┘
```

**Dependencies**: FA-011  
**Blockers**: None

---

## Epic 5: Project Home & Navigation

### Ticket FA-013: Backend Project Endpoints

**Type**: Feature  
**Priority**: P1  
**Story Points**: 3  
**Assignee**: Backend Engineer

**Description**:
Enhance `/api/projects` endpoints for mobile app with lightweight payloads and geofence data.

**Acceptance Criteria**:

- ✅ GET `/api/projects` returns user's assigned projects
- ✅ GET `/api/projects/:id` returns project details + geofence
- ✅ GET `/api/projects/:id/summary` returns open items count (tasks, RFIs, etc.)
- ✅ Payloads include only necessary fields (mobile-optimized)
- ✅ Geofence data included (lat, lng, radius)
- ✅ Project status included (active, on-hold, completed)

**API Contracts**:

```typescript
// GET /api/projects (list)
Response: {
  success: true,
  data: [
    {
      id: string,
      name: string,
      status: 'active' | 'on-hold' | 'completed',
      address: string,
      geofence: { lat, lng, radius_meters },
      role: 'foreman' | 'superintendent' | 'pm',
      last_accessed: ISO8601
    }
  ]
}

// GET /api/projects/:id/summary
Response: {
  success: true,
  data: {
    open_tasks: number,
    open_rfis: number,
    pending_tm_signatures: number,
    todays_talk: { id, topic } | null,
    daily_log_submitted: boolean
  }
}
```

**Dependencies**: Existing `/api/projects` routes in `server/src/routes/projects.ts`  
**Blockers**: None

---

### Ticket FA-014: React Navigation Setup

**Type**: Task  
**Priority**: P0 (Blocker)  
**Story Points**: 5  
**Assignee**: Mobile Lead

**Description**:
Configure React Navigation with tab navigator, stack navigators, and deep linking.

**Acceptance Criteria**:

- ✅ React Navigation v6 installed
- ✅ Bottom tab navigator (Home, Projects, Photos, Profile)
- ✅ Stack navigators for each tab
- ✅ Auth stack vs main stack switching based on auth state
- ✅ Deep linking configured (for push notifications)
- ✅ Navigation theme matching design system
- ✅ Header styles consistent across screens

**Navigation Structure**:

```
App
├── Auth Stack (unauthenticated)
│   ├── Login
│   └── Forgot Password
└── Main Stack (authenticated)
    ├── Tab Navigator
    │   ├── Home Tab
    │   │   ├── Home Screen (My Day)
    │   │   ├── Daily Log
    │   │   └── Toolbox Talk
    │   ├── Projects Tab
    │   │   ├── Project List
    │   │   ├── Project Home
    │   │   ├── Plans Viewer
    │   │   ├── Tasks List
    │   │   ├── RFI List
    │   │   └── T&M List
    │   ├── Photos Tab
    │   │   ├── Gallery
    │   │   └── Photo Detail
    │   └── Profile Tab
    │       ├── Profile Screen
    │       └── Settings
    └── Modal Screens
        ├── Clock In
        ├── Quick Capture
        └── Notifications
```

**Dependencies**: FA-005 (auth context)  
**Blockers**: None

---

### Ticket FA-015: Home Screen (My Day)

**Type**: Feature  
**Priority**: P1  
**Story Points**: 5  
**Assignee**: Mobile Engineer

**Description**:
Build Home screen with clock in/out, quick capture buttons, due items, and activity feed.

**Acceptance Criteria**:

- ✅ Clock in/out widget (from FA-009)
- ✅ Quick capture buttons (Photo, Task, T&M, Delivery, RFI)
- ✅ "Due Today" section with action items
- ✅ Activity feed (today's submissions/uploads)
- ✅ Project selector dropdown
- ✅ Sync status indicator
- ✅ Offline banner (when disconnected)
- ✅ Pull-to-refresh gesture

**Screen Layout** (from wireframes):

```
┌─────────────────────────────────────┐
│  My Day           [☰]     Project ▼ │
├─────────────────────────────────────┤
│ ⏱ Clock In  [Geofence ON]          │
│  Last: 07:12   Cost Code: ▽        │
├─────────────────────────────────────┤
│ Due Today                           │
│  • Daily Log (North Tower)  ▶       │
│  • Toolbox Talk 07:30        ▶      │
│  • 3 Tasks assigned           3     │
├─────────────────────────────────────┤
│ Quick Capture  [+ Photo]  [+ Task]  │
│  [+ T&M]  [+ Delivery]  [+ RFI]     │
├─────────────────────────────────────┤
│ Activity (Today)                    │
│  08:05  12 photos uploaded          │
│  08:22  Delivery: drywall partial   │
└─────────────────────────────────────┘
```

**Dependencies**: FA-009, FA-011, FA-013, FA-014  
**Blockers**: None

---

### Ticket FA-016: Project Home Screen

**Type**: Feature  
**Priority**: P1  
**Story Points**: 3  
**Assignee**: Mobile Engineer

**Description**:
Build Project Home screen with module grid and open items summary.

**Acceptance Criteria**:

- ✅ Project name + search in header
- ✅ Module grid (3x3 cards): Plans, Tasks, Daily Log, RFIs, T&M, Deliveries, Safety, Photos, Schedule
- ✅ Open items summary card
- ✅ Recent activity feed
- ✅ Each card navigates to respective module
- ✅ Cards show badge counts (e.g., "5" on Tasks card)

**Screen Layout** (from wireframes):

```
┌─────────────────────────────────────┐
│  North Tower        [Search 🔎]     │
├─────────────────────────────────────┤
│ [Plans]  [Tasks]  [Daily Log]       │
│ [RFIs]   [T&M]    [Deliveries]      │
│ [Safety] [Photos] [Schedule]        │
├─────────────────────────────────────┤
│ Open Items                          │
│  RFIs: 2 waiting   Punch: 5         │
│  Today's talk: Confined Space       │
└─────────────────────────────────────┘
```

**Dependencies**: FA-013, FA-014  
**Blockers**: None

---

## Testing & Quality Assurance

### Ticket FA-017: Unit Tests for Core Services

**Type**: Task  
**Priority**: P1  
**Story Points**: 8  
**Assignee**: QA + Mobile Engineers

**Description**:
Write unit tests for sync engine, auth context, geofence service, and photo queue.

**Acceptance Criteria**:

- ✅ Sync engine: 15+ test cases (conflict resolution, retry logic, network failures)
- ✅ Auth context: 10+ test cases (login, logout, token refresh, auto-refresh)
- ✅ Geofence service: 8+ test cases (distance calc, entry/exit triggers, edge cases)
- ✅ Photo queue: 6+ test cases (upload, retry, batch processing)
- ✅ Code coverage >80% for core services
- ✅ Tests run in CI pipeline

**Test Framework**: Jest + React Native Testing Library

**Dependencies**: All feature tickets  
**Blockers**: None

---

### Ticket FA-018: Integration Tests (E2E)

**Type**: Task  
**Priority**: P2  
**Story Points**: 5  
**Assignee**: QA Engineer

**Description**:
Write end-to-end tests for critical user flows using Detox or Maestro.

**Acceptance Criteria**:

- ✅ Login flow (email/password, biometric)
- ✅ Clock in/out flow (with geofence)
- ✅ Photo capture and upload flow
- ✅ Offline data persistence (airplane mode test)
- ✅ Sync flow (offline → online)
- ✅ Tests run on iOS simulator + Android emulator

**Test Framework**: Detox (iOS/Android) or Maestro

**Dependencies**: FA-015, FA-016  
**Blockers**: None

---

### Ticket FA-019: Device Testing Matrix

**Type**: Task  
**Priority**: P2  
**Story Points**: 3  
**Assignee**: QA Engineer

**Description**:
Manually test on physical devices across iOS/Android versions.

**Acceptance Criteria**:

- ✅ Tested on iPhone 12+ (iOS 15+)
- ✅ Tested on Pixel 5+ (Android 11+)
- ✅ Tested on Samsung Galaxy S21+ (Android 11+)
- ✅ Tested on iPad (iOS 15+)
- ✅ Camera, GPS, push notifications work on all devices
- ✅ Performance acceptable (60 FPS scrolling, <2s navigation)
- ✅ Battery drain test (8-hour workday simulation)

**Test Checklist**:

- [ ] Camera capture
- [ ] GPS accuracy
- [ ] Push notifications
- [ ] Background geofencing
- [ ] Offline functionality
- [ ] Sync reliability
- [ ] Performance (FPS, load times)
- [ ] Battery usage

**Dependencies**: All feature tickets  
**Blockers**: Physical device availability

---

## Sprint Ceremonies

### Sprint Planning (Day 1)

- Review all tickets with team
- Assign story point estimates
- Commit to sprint goal
- Assign tickets to engineers

### Daily Standup (Every morning)

- What did I do yesterday?
- What am I doing today?
- Any blockers?

### Mid-Sprint Check-in (Day 8)

- Review progress (velocity tracking)
- Adjust scope if needed
- Demo completed work

### Sprint Review (Day 15)

- Demo all completed features to stakeholders
- Get feedback on UX/flows
- Validate acceptance criteria

### Sprint Retrospective (Day 15)

- What went well?
- What could be improved?
- Action items for next sprint

---

## Definition of Done

✅ Code complete and reviewed  
✅ Unit tests written and passing  
✅ Integration tests passing  
✅ Tested on iOS and Android  
✅ No critical bugs  
✅ Documentation updated  
✅ Acceptance criteria met  
✅ Deployed to staging environment  
✅ Product owner sign-off

---

## Sprint A Summary

**Total Story Points**: 55  
**Total Tickets**: 19  
**Duration**: 3 weeks (15 working days)  
**Team Velocity Target**: 18-20 points/week

**Key Deliverables**:

1. ✅ React Native app with offline-first architecture
2. ✅ Authentication with JWT + biometric
3. ✅ Clock in/out with geofencing
4. ✅ Photo capture with auto-tagging
5. ✅ Home screen (My Day) + Project Home
6. ✅ Background sync infrastructure

**Ready for Sprint B**: Daily Log, Plans Viewer, Tasks/Punch List

---

**Document Version**: 1.0  
**Last Updated**: October 2, 2025  
**Owner**: Mobile Team Lead  
**Status**: Ready for Sprint Planning
