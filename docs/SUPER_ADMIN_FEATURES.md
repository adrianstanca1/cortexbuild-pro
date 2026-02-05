# Super Admin Features Documentation

## Overview

The Super Admin functionality provides platform-wide management capabilities for CortexBuild Pro. Super admins have complete control over the system, including user management, organization management, system configuration, and monitoring.

## Features

### 1. User Management (`/admin/users`)

Comprehensive user management with advanced capabilities:

#### Core Features
- **View All Users**: Browse all users across all organizations
- **Search & Filter**: Search by name/email, filter by role and organization
- **Create Users**: Add new users with custom roles and organization assignment
- **Edit Users**: Update user details, roles, and organization membership
- **Delete Users**: Remove users from the system (with safety checks)

#### Advanced Features
- **Bulk Operations**:
  - Select multiple users with checkboxes
  - Bulk delete users (cannot delete super admins)
  - Bulk update roles
  - Bulk update organization assignments
  - Export selected users to CSV

- **User Impersonation**:
  - Impersonate any non-super-admin user for support and debugging
  - Visible warning banner when in impersonation mode
  - Easy exit from impersonation mode
  - All impersonation actions are logged in audit logs

#### API Endpoints
- `GET /api/admin/users` - List users with filtering
- `POST /api/admin/users` - Create new user
- `PATCH /api/admin/users/[id]` - Update user
- `DELETE /api/admin/users/[id]` - Delete user
- `POST /api/admin/users/bulk` - Bulk operations (delete, update_role, update_organization, import, export)
- `POST /api/admin/users/impersonate` - Start impersonation
- `DELETE /api/admin/users/impersonate` - End impersonation

### 2. Organization Management (`/admin/organizations`)

Manage all tenant organizations on the platform:

#### Features
- **View Organizations**: Grid view of all organizations with stats
- **Organization Details**: View users, projects, and activity for each organization
- **Edit Organizations**: Update name, slug, logo, and entitlements
- **Suspend/Activate**: Toggle organization active status
  - Suspended organizations cannot be accessed by users
  - Clearly visible Active/Suspended badge on each organization
- **Delete Organizations**: Remove organizations (with safety checks for users/projects)

#### API Endpoints
- `GET /api/admin/organizations` - List all organizations
- `POST /api/admin/organizations` - Create organization
- `GET /api/admin/organizations/[id]` - Get organization details
- `PATCH /api/admin/organizations/[id]` - Update organization (including isActive field)
- `DELETE /api/admin/organizations/[id]` - Delete organization

### 3. System Announcements (`/admin/announcements`)

Broadcast platform-wide messages to all users:

#### Features
- **Create Announcements**: Send messages to all users with different severity levels
- **Severity Levels**: Info, Warning, Error, Success
- **Dismissible Option**: Choose whether users can dismiss the announcement
- **Expiration**: Set optional expiration date/time
- **Real-time Broadcast**: Announcements are immediately pushed to all connected clients
- **View History**: See all active announcements and their metadata
- **Delete Announcements**: Remove announcements from the system

#### API Endpoints
- `GET /api/admin/announcements` - List active announcements
- `POST /api/admin/announcements` - Create and broadcast announcement
- `DELETE /api/admin/announcements?id={id}` - Delete announcement

### 4. System Health Monitoring (`/admin/system-health`)

Monitor platform health and performance:

- Database status and response time
- Connected users and SSE connections
- System alerts (overdue tasks, open RFIs, etc.)
- Service health checks
- Real-time metrics

### 5. API Management (`/admin/api-management`)

Manage API connections and integrations:

- View all API connections
- Test connection health
- View usage analytics
- Rate limiting configuration
- Connection credentials management

### 6. Audit Logs (`/admin/audit-logs`)

Complete activity tracking and audit trail:

#### Features
- View all system activities
- Filter by action type, entity type, user, organization
- Search through logs
- Export logs to CSV
- Pagination for large datasets
- Detailed log information including IP address and user agent

#### API Endpoints
- `GET /api/admin/audit-logs` - List audit logs with filtering and pagination

### 7. Activity Monitor (`/admin/activity`)

Real-time activity monitoring:

- Live feed of system activities
- Activity statistics and trends
- Filter by activity type
- View activity details

### 8. Storage & Data Overview (`/admin/storage`)

Platform-wide storage and data statistics:

- Total documents, photos, attachments
- Storage usage per organization
- Data breakdown by type
- Total counts for all entities

### 9. Platform Settings (`/admin/platform-settings`)

Configure platform-wide settings:

- Maintenance mode
- Feature flags
- Security settings
- Notification settings
- Branding configuration
- Resource limits
- Module toggles

### 10. Invitations Management (`/admin/invitations`)

Manage organization invitations:

- View all pending/accepted invitations
- Create new organization invitations
- Configure entitlements for new organizations
- Revoke invitations
- Track invitation status

## Access Control

### Super Admin Role
- Role: `SUPER_ADMIN` in the database
- Full platform access
- Can access `/admin/*` routes
- Cannot be impersonated by other admins
- Cannot be bulk-deleted

### Middleware Protection
- All `/admin/*` routes are protected by middleware
- Only `SUPER_ADMIN` role can access admin panel
- Other users are redirected to `/dashboard`

## Security Features

1. **Audit Logging**: All admin actions are logged with user, timestamp, and details
2. **Impersonation Tracking**: All impersonation sessions are logged
3. **Bulk Operation Validation**: Safety checks prevent dangerous bulk operations
4. **Session Storage**: Impersonation data stored securely in session storage
5. **API Authorization**: All admin API endpoints verify SUPER_ADMIN role

## UI Components

### Admin Sidebar
Located at: `app/(admin)/_components/admin-sidebar.tsx`

Navigation for all admin features with visual indicators.

### Admin Header
Located at: `app/(admin)/_components/admin-header.tsx`

Top navigation with user menu and role badge.

### Impersonation Banner
Located at: `components/admin/impersonation-banner.tsx`

Prominent yellow banner shown when impersonating users.

## Usage Examples

### Bulk User Operations

```typescript
// Export selected users
const response = await fetch('/api/admin/users/bulk', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    action: 'export',
    userIds: ['user1', 'user2', 'user3']
  })
});

// Bulk update roles
await fetch('/api/admin/users/bulk', {
  method: 'POST',
  body: JSON.stringify({
    action: 'update_role',
    userIds: ['user1', 'user2'],
    data: { role: 'PROJECT_MANAGER' }
  })
});
```

### User Impersonation

```typescript
// Start impersonation
const response = await fetch('/api/admin/users/impersonate', {
  method: 'POST',
  body: JSON.stringify({ userId: 'target-user-id' })
});

const data = await response.json();
sessionStorage.setItem('impersonation', JSON.stringify(data.impersonationData));
window.location.href = '/dashboard';

// End impersonation
await fetch('/api/admin/users/impersonate', {
  method: 'DELETE',
  body: JSON.stringify({
    originalAdminId: 'admin-id',
    impersonatedUserId: 'user-id'
  })
});
```

### Create System Announcement

```typescript
await fetch('/api/admin/announcements', {
  method: 'POST',
  body: JSON.stringify({
    title: 'Scheduled Maintenance',
    message: 'The system will be down for maintenance on...',
    severity: 'warning',
    dismissible: true,
    expiresAt: '2026-02-04T00:00:00Z'
  })
});
```

### Suspend Organization

```typescript
await fetch(`/api/admin/organizations/${orgId}`, {
  method: 'PATCH',
  body: JSON.stringify({ isActive: false })
});
```

## Database Schema

### User Model
- `role`: Enum including `SUPER_ADMIN`
- `organizationId`: Optional foreign key

### Organization Model
- `isActive`: Boolean (default: true)
- `entitlements`: JSON object for feature/limit configuration

### ActivityLog Model
- Used for audit logs and announcements
- `action`: String describing the action
- `entityType`: Type of entity affected
- `details`: JSON details about the action

## Best Practices

1. **Always use impersonation for user support** instead of asking for credentials
2. **Review audit logs regularly** to monitor system activity
3. **Use bulk operations carefully** and verify selections before applying
4. **Set appropriate entitlements** when creating organizations
5. **Use announcements sparingly** to avoid notification fatigue
6. **Suspend organizations instead of deleting** when possible for data retention
7. **Export audit logs periodically** for compliance and backup

## Troubleshooting

### Impersonation Not Working
- Check if user has SUPER_ADMIN role
- Verify target user is not a SUPER_ADMIN
- Check browser session storage for impersonation data

### Bulk Operations Failing
- Verify you're not trying to bulk-delete SUPER_ADMIN users
- Check API response for specific error messages
- Ensure you have proper authorization

### Announcements Not Appearing
- Check if real-time connection is active
- Verify announcement hasn't expired
- Check if announcement was properly broadcast

## Future Enhancements

Potential improvements for the super admin panel:

1. Advanced analytics dashboard with charts
2. Backup and restore functionality
3. Email template management
4. Scheduled tasks management
5. Custom report builder
6. Advanced user permissions beyond roles
7. Organization resource quotas
8. API rate limiting per organization
9. Multi-factor authentication management
10. Webhook management
