-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('SUPER_ADMIN', 'COMPANY_OWNER', 'ADMIN', 'PROJECT_MANAGER', 'FIELD_WORKER');

-- CreateEnum
CREATE TYPE "InvitationStatus" AS ENUM ('PENDING', 'ACCEPTED', 'EXPIRED', 'REVOKED');

-- CreateEnum
CREATE TYPE "ProjectStatus" AS ENUM ('PLANNING', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('TODO', 'IN_PROGRESS', 'REVIEW', 'COMPLETE');

-- CreateEnum
CREATE TYPE "TaskPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('PLANS', 'DRAWINGS', 'PERMITS', 'PHOTOS', 'REPORTS', 'SPECIFICATIONS', 'CONTRACTS', 'OTHER');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('INFO', 'WARNING', 'ERROR', 'SUCCESS', 'TASK_ASSIGNED', 'TASK_UPDATED', 'TASK_COMPLETED', 'PROJECT_MESSAGE', 'RFI_RESPONSE', 'SUBMITTAL_APPROVED', 'SUBMITTAL_REJECTED', 'DEADLINE_REMINDER', 'SAFETY_INCIDENT', 'SYSTEM_ALERT');

-- CreateEnum
CREATE TYPE "RFIStatus" AS ENUM ('DRAFT', 'OPEN', 'ANSWERED', 'CLOSED');

-- CreateEnum
CREATE TYPE "SubmittalStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'REVISE_RESUBMIT');

-- CreateEnum
CREATE TYPE "ChangeOrderStatus" AS ENUM ('DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'EXECUTED');

-- CreateEnum
CREATE TYPE "IncidentSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "IncidentStatus" AS ENUM ('OPEN', 'INVESTIGATING', 'RESOLVED', 'CLOSED');

-- CreateEnum
CREATE TYPE "WeatherCondition" AS ENUM ('SUNNY', 'CLOUDY', 'RAINY', 'STORMY', 'SNOWY', 'WINDY');

-- CreateEnum
CREATE TYPE "PunchListStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'COMPLETED', 'VERIFIED');

-- CreateEnum
CREATE TYPE "PunchListPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "EquipmentStatus" AS ENUM ('AVAILABLE', 'IN_USE', 'MAINTENANCE', 'OUT_OF_SERVICE');

-- CreateEnum
CREATE TYPE "InspectionStatus" AS ENUM ('SCHEDULED', 'IN_PROGRESS', 'PASSED', 'FAILED', 'REQUIRES_REINSPECTION');

-- CreateEnum
CREATE TYPE "MeetingType" AS ENUM ('KICKOFF', 'PROGRESS', 'SAFETY', 'COORDINATION', 'CLOSEOUT', 'OTHER');

-- CreateEnum
CREATE TYPE "ApiConnectionType" AS ENUM ('EXTERNAL', 'INTERNAL');

-- CreateEnum
CREATE TYPE "ApiConnectionStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'ERROR', 'EXPIRED', 'DISABLED');

-- CreateEnum
CREATE TYPE "ApiEnvironment" AS ENUM ('DEVELOPMENT', 'STAGING', 'PRODUCTION');

-- CreateEnum
CREATE TYPE "IntegrationCategory" AS ENUM ('EMAIL_DELIVERY', 'AI_PROCESSING', 'PAYMENT_PROCESSING', 'CLOUD_STORAGE', 'AUTHENTICATION', 'NOTIFICATIONS', 'ANALYTICS', 'DOCUMENT_PROCESSING', 'COMMUNICATION', 'OTHER');

-- CreateEnum
CREATE TYPE "CostCategory" AS ENUM ('LABOR', 'MATERIALS', 'EQUIPMENT', 'SUBCONTRACTOR', 'PERMITS', 'INSURANCE', 'UTILITIES', 'OVERHEAD', 'CONTINGENCY', 'OTHER');

-- CreateEnum
CREATE TYPE "CostStatus" AS ENUM ('ESTIMATED', 'COMMITTED', 'ACTUAL', 'INVOICED', 'PAID');

-- CreateEnum
CREATE TYPE "MaterialStatus" AS ENUM ('PLANNED', 'ORDERED', 'SHIPPED', 'DELIVERED', 'INSTALLED', 'RETURNED');

-- CreateEnum
CREATE TYPE "SubcontractorStatus" AS ENUM ('ACTIVE', 'ON_HOLD', 'COMPLETED', 'TERMINATED');

-- CreateEnum
CREATE TYPE "TradeType" AS ENUM ('GENERAL', 'ELECTRICAL', 'PLUMBING', 'HVAC', 'ROOFING', 'CONCRETE', 'FRAMING', 'DRYWALL', 'PAINTING', 'FLOORING', 'LANDSCAPING', 'EXCAVATION', 'MASONRY', 'STEEL', 'GLAZING', 'FIRE_PROTECTION', 'OTHER');

-- CreateEnum
CREATE TYPE "ContractStatus" AS ENUM ('DRAFT', 'PENDING', 'ACTIVE', 'COMPLETED', 'TERMINATED', 'DISPUTED');

-- CreateEnum
CREATE TYPE "MilestoneStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'DELAYED', 'AT_RISK');

-- CreateEnum
CREATE TYPE "TimeEntryStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "PermitStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'DENIED', 'EXPIRED', 'CLOSED');

-- CreateEnum
CREATE TYPE "PermitType" AS ENUM ('BUILDING', 'ELECTRICAL', 'PLUMBING', 'MECHANICAL', 'FIRE', 'DEMOLITION', 'GRADING', 'ENVIRONMENTAL', 'SIGN', 'TEMPORARY', 'OCCUPANCY', 'OTHER');

-- CreateEnum
CREATE TYPE "DrawingStatus" AS ENUM ('DRAFT', 'FOR_REVIEW', 'APPROVED', 'SUPERSEDED', 'VOID');

-- CreateEnum
CREATE TYPE "DrawingDiscipline" AS ENUM ('ARCHITECTURAL', 'STRUCTURAL', 'MECHANICAL', 'ELECTRICAL', 'PLUMBING', 'CIVIL', 'LANDSCAPE', 'FIRE_PROTECTION', 'INTERIOR', 'SHOP_DRAWING', 'AS_BUILT', 'OTHER');

-- CreateEnum
CREATE TYPE "DiaryEntryType" AS ENUM ('GENERAL', 'WEATHER', 'VISITOR', 'DELIVERY', 'INCIDENT', 'MILESTONE', 'DELAY', 'PROGRESS', 'INSTRUCTION', 'VARIATION');

-- CreateEnum
CREATE TYPE "DefectStatus" AS ENUM ('IDENTIFIED', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'VERIFIED', 'DISPUTED');

-- CreateEnum
CREATE TYPE "DefectPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "ClaimStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'PARTIALLY_APPROVED', 'REJECTED', 'PAID');

-- CreateEnum
CREATE TYPE "ToolboxTalkStatus" AS ENUM ('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "CheckStatus" AS ENUM ('PASS', 'FAIL', 'NEEDS_ATTENTION', 'NOT_APPLICABLE');

-- CreateEnum
CREATE TYPE "CheckItemResult" AS ENUM ('OK', 'DEFECTIVE', 'NEEDS_REPAIR', 'NA');

-- CreateEnum
CREATE TYPE "RAMSStatus" AS ENUM ('DRAFT', 'PENDING_REVIEW', 'APPROVED', 'REJECTED', 'SUPERSEDED');

-- CreateEnum
CREATE TYPE "PermitToWorkStatus" AS ENUM ('REQUESTED', 'APPROVED', 'ACTIVE', 'COMPLETED', 'CANCELLED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "LiftingStatus" AS ENUM ('PLANNED', 'APPROVED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "CertificationType" AS ENUM ('CSCS_CARD', 'CPCS_CARD', 'IPAF_LICENSE', 'PASMA_CERTIFICATE', 'FIRST_AID', 'FIRE_MARSHAL', 'ASBESTOS_AWARENESS', 'MANUAL_HANDLING', 'WORKING_AT_HEIGHT', 'CONFINED_SPACE', 'HOT_WORK', 'SLINGER_SIGNALLER', 'CRANE_OPERATOR', 'EXCAVATOR_OPERATOR', 'FORKLIFT_OPERATOR', 'ELECTRICIAN_LICENSE', 'GAS_SAFE', 'SSSTS', 'SMSTS', 'OTHER');

-- CreateEnum
CREATE TYPE "AccessType" AS ENUM ('ENTRY', 'EXIT');

-- CreateEnum
CREATE TYPE "ProjectPhase" AS ENUM ('PRECONSTRUCTION', 'MOBILIZATION', 'ACTIVE', 'CLOSEOUT', 'WARRANTY');

-- CreateEnum
CREATE TYPE "WorkPackageStatus" AS ENUM ('DRAFT', 'PLANNED', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "TemplateCategory" AS ENUM ('METHOD_STATEMENT', 'RISK_ASSESSMENT', 'COSHH_ASSESSMENT', 'PERMIT_TO_WORK', 'TOOLBOX_TALK', 'INSPECTION_FORM', 'SAFETY_BRIEFING', 'SITE_INDUCTION', 'PROGRESS_REPORT', 'MEETING_AGENDA', 'CONTRACT_DOCUMENT', 'DELIVERY_RECEIPT', 'QUALITY_CHECKLIST', 'HANDOVER_DOCUMENT', 'SNAG_LIST', 'EMAIL_TEMPLATE', 'OTHER');

-- CreateEnum
CREATE TYPE "AnalyticsChartType" AS ENUM ('LINE', 'BAR', 'PIE', 'AREA', 'SCATTER', 'HEATMAP', 'GAUGE', 'TABLE');

-- CreateEnum
CREATE TYPE "AnalyticsPeriod" AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY', 'CUSTOM');

-- CreateEnum
CREATE TYPE "BackupType" AS ENUM ('FULL', 'INCREMENTAL', 'DIFFERENTIAL');

-- CreateEnum
CREATE TYPE "BackupStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "ScheduledTaskType" AS ENUM ('BACKUP', 'REPORT_GENERATION', 'DATA_EXPORT', 'EMAIL_NOTIFICATION', 'WEBHOOK_TRIGGER', 'DATA_CLEANUP', 'CUSTOM_SCRIPT');

-- CreateEnum
CREATE TYPE "ScheduledTaskStatus" AS ENUM ('ACTIVE', 'PAUSED', 'DISABLED', 'FAILED');

-- CreateEnum
CREATE TYPE "TaskExecutionStatus" AS ENUM ('PENDING', 'RUNNING', 'SUCCESS', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ReportOutputFormat" AS ENUM ('PDF', 'EXCEL', 'CSV', 'HTML', 'JSON');

-- CreateEnum
CREATE TYPE "ReportScheduleFrequency" AS ENUM ('ONCE', 'DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY');

-- CreateEnum
CREATE TYPE "PermissionAction" AS ENUM ('CREATE', 'READ', 'UPDATE', 'DELETE', 'APPROVE', 'EXPORT', 'MANAGE', 'ALL');

-- CreateEnum
CREATE TYPE "PermissionResource" AS ENUM ('PROJECT', 'TASK', 'DOCUMENT', 'USER', 'REPORT', 'COST', 'TIMESHEET', 'RISK', 'SAFETY', 'EQUIPMENT', 'SUBCONTRACTOR', 'WEBHOOK', 'BACKUP', 'ANALYTICS', 'SYSTEM_SETTINGS', 'ALL');

-- CreateEnum
CREATE TYPE "QuotaType" AS ENUM ('STORAGE', 'USERS', 'PROJECTS', 'API_CALLS', 'BACKUPS', 'REPORTS', 'WEBHOOKS', 'CUSTOM');

-- CreateEnum
CREATE TYPE "QuotaPeriod" AS ENUM ('DAILY', 'MONTHLY', 'YEARLY', 'TOTAL');

-- CreateEnum
CREATE TYPE "MFAType" AS ENUM ('TOTP', 'SMS', 'EMAIL', 'BACKUP_CODE');

-- CreateEnum
CREATE TYPE "MFAStatus" AS ENUM ('PENDING_SETUP', 'ACTIVE', 'DISABLED', 'SUSPENDED');

-- CreateTable
CREATE TABLE "Organization" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "logoUrl" TEXT,
    "entitlements" JSONB DEFAULT '{"modules":{"projects":true,"tasks":true,"documents":true,"rfis":true,"submittals":true,"changeOrders":true,"dailyReports":true,"safety":true,"reports":true,"team":true},"limits":{"storageGB":10,"maxUsers":50,"maxProjects":100}}',
    "storageUsedBytes" BIGINT NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompanyInvitation" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "ownerName" TEXT NOT NULL,
    "ownerEmail" TEXT NOT NULL,
    "ownerPhone" TEXT,
    "status" "InvitationStatus" NOT NULL DEFAULT 'PENDING',
    "entitlements" JSONB NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "acceptedAt" TIMESTAMP(3),
    "organizationId" TEXT,
    "invitedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompanyInvitation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "emailVerified" TIMESTAMP(3),
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT,
    "name" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'FIELD_WORKER',
    "avatarUrl" TEXT,
    "phone" TEXT,
    "organizationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastLogin" TIMESTAMP(3),

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" "ProjectStatus" NOT NULL DEFAULT 'PLANNING',
    "location" TEXT,
    "clientName" TEXT,
    "clientEmail" TEXT,
    "budget" DOUBLE PRECISION,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "organizationId" TEXT NOT NULL,
    "managerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "phase" "ProjectPhase" NOT NULL DEFAULT 'PRECONSTRUCTION',

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Task" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "TaskStatus" NOT NULL DEFAULT 'TODO',
    "priority" "TaskPriority" NOT NULL DEFAULT 'MEDIUM',
    "dueDate" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "projectId" TEXT NOT NULL,
    "assigneeId" TEXT,
    "creatorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "workPackageId" TEXT,

    CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaskComment" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TaskComment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeamMember" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "jobTitle" TEXT,
    "department" TEXT,
    "invitedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TeamMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectTeamMember" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "teamMemberId" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProjectTeamMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeamInvitation" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'FIELD_WORKER',
    "jobTitle" TEXT,
    "department" TEXT,
    "status" "InvitationStatus" NOT NULL DEFAULT 'PENDING',
    "organizationId" TEXT NOT NULL,
    "invitedById" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "acceptedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TeamInvitation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Document" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "documentType" "DocumentType" NOT NULL DEFAULT 'OTHER',
    "cloudStoragePath" TEXT NOT NULL,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "fileSize" INTEGER,
    "mimeType" TEXT,
    "projectId" TEXT NOT NULL,
    "uploadedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActivityLog" (
    "id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "entityName" TEXT,
    "details" TEXT,
    "userId" TEXT NOT NULL,
    "projectId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActivityLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "projectId" TEXT,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL DEFAULT 'INFO',
    "data" JSONB,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RFI" (
    "id" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "subject" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT,
    "status" "RFIStatus" NOT NULL DEFAULT 'DRAFT',
    "dueDate" TIMESTAMP(3),
    "ballInCourt" TEXT,
    "specSection" TEXT,
    "drawingRef" TEXT,
    "costImpact" BOOLEAN NOT NULL DEFAULT false,
    "scheduleImpact" BOOLEAN NOT NULL DEFAULT false,
    "projectId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "assignedToId" TEXT,
    "answeredById" TEXT,
    "answeredAt" TIMESTAMP(3),
    "closedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RFI_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RFIAttachment" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "cloudStoragePath" TEXT NOT NULL,
    "fileSize" INTEGER,
    "mimeType" TEXT,
    "rfiId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RFIAttachment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Submittal" (
    "id" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "SubmittalStatus" NOT NULL DEFAULT 'DRAFT',
    "specSection" TEXT,
    "dueDate" TIMESTAMP(3),
    "submittedAt" TIMESTAMP(3),
    "reviewedAt" TIMESTAMP(3),
    "revisionNumber" INTEGER NOT NULL DEFAULT 0,
    "reviewComments" TEXT,
    "projectId" TEXT NOT NULL,
    "submittedById" TEXT,
    "reviewedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Submittal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubmittalAttachment" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "cloudStoragePath" TEXT NOT NULL,
    "fileSize" INTEGER,
    "mimeType" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "submittalId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SubmittalAttachment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChangeOrder" (
    "id" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "ChangeOrderStatus" NOT NULL DEFAULT 'DRAFT',
    "reason" TEXT,
    "costChange" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "scheduleChange" INTEGER,
    "originalBudget" DOUBLE PRECISION,
    "revisedBudget" DOUBLE PRECISION,
    "projectId" TEXT NOT NULL,
    "requestedById" TEXT NOT NULL,
    "approvedById" TEXT,
    "approvedAt" TIMESTAMP(3),
    "executedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "currentVersion" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "ChangeOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyReport" (
    "id" TEXT NOT NULL,
    "reportDate" DATE NOT NULL,
    "weather" "WeatherCondition" NOT NULL DEFAULT 'SUNNY',
    "temperature" INTEGER,
    "workPerformed" TEXT,
    "materialsUsed" TEXT,
    "equipmentUsed" TEXT,
    "visitors" TEXT,
    "delays" TEXT,
    "safetyNotes" TEXT,
    "manpowerCount" INTEGER NOT NULL DEFAULT 0,
    "projectId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DailyReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyReportPhoto" (
    "id" TEXT NOT NULL,
    "caption" TEXT,
    "cloudStoragePath" TEXT NOT NULL,
    "dailyReportId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DailyReportPhoto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SafetyIncident" (
    "id" TEXT NOT NULL,
    "incidentDate" TIMESTAMP(3) NOT NULL,
    "location" TEXT,
    "description" TEXT NOT NULL,
    "severity" "IncidentSeverity" NOT NULL DEFAULT 'MEDIUM',
    "status" "IncidentStatus" NOT NULL DEFAULT 'OPEN',
    "injuryOccurred" BOOLEAN NOT NULL DEFAULT false,
    "injuryDescription" TEXT,
    "rootCause" TEXT,
    "correctiveAction" TEXT,
    "preventiveAction" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "projectId" TEXT NOT NULL,
    "reportedById" TEXT NOT NULL,
    "assignedToId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SafetyIncident_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SafetyIncidentPhoto" (
    "id" TEXT NOT NULL,
    "caption" TEXT,
    "cloudStoragePath" TEXT NOT NULL,
    "fileSize" INTEGER,
    "mimeType" TEXT,
    "incidentId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SafetyIncidentPhoto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PunchList" (
    "id" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "location" TEXT,
    "status" "PunchListStatus" NOT NULL DEFAULT 'OPEN',
    "priority" "PunchListPriority" NOT NULL DEFAULT 'MEDIUM',
    "category" TEXT,
    "dueDate" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "verifiedAt" TIMESTAMP(3),
    "projectId" TEXT NOT NULL,
    "assignedToId" TEXT,
    "createdById" TEXT NOT NULL,
    "verifiedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PunchList_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PunchListPhoto" (
    "id" TEXT NOT NULL,
    "caption" TEXT,
    "cloudStoragePath" TEXT NOT NULL,
    "punchListId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PunchListPhoto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Equipment" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "equipmentNumber" TEXT NOT NULL,
    "category" TEXT,
    "manufacturer" TEXT,
    "model" TEXT,
    "serialNumber" TEXT,
    "purchaseDate" TIMESTAMP(3),
    "purchaseCost" DOUBLE PRECISION,
    "status" "EquipmentStatus" NOT NULL DEFAULT 'AVAILABLE',
    "currentLocation" TEXT,
    "notes" TEXT,
    "lastServiceDate" TIMESTAMP(3),
    "nextServiceDate" TIMESTAMP(3),
    "organizationId" TEXT NOT NULL,
    "currentProjectId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Equipment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EquipmentMaintenanceLog" (
    "id" TEXT NOT NULL,
    "equipmentId" TEXT NOT NULL,
    "serviceDate" TIMESTAMP(3) NOT NULL,
    "serviceType" TEXT NOT NULL,
    "description" TEXT,
    "cost" DOUBLE PRECISION,
    "performedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EquipmentMaintenanceLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EquipmentUsageLog" (
    "id" TEXT NOT NULL,
    "equipmentId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "checkOutDate" TIMESTAMP(3) NOT NULL,
    "checkInDate" TIMESTAMP(3),
    "checkedOutById" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EquipmentUsageLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Inspection" (
    "id" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "inspectionType" TEXT NOT NULL,
    "description" TEXT,
    "status" "InspectionStatus" NOT NULL DEFAULT 'SCHEDULED',
    "scheduledDate" TIMESTAMP(3),
    "completedDate" TIMESTAMP(3),
    "inspectorName" TEXT,
    "inspectorCompany" TEXT,
    "result" TEXT,
    "deficiencies" TEXT,
    "projectId" TEXT NOT NULL,
    "requestedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Inspection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InspectionChecklistItem" (
    "id" TEXT NOT NULL,
    "inspectionId" TEXT NOT NULL,
    "itemText" TEXT NOT NULL,
    "passed" BOOLEAN,
    "notes" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InspectionChecklistItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InspectionPhoto" (
    "id" TEXT NOT NULL,
    "caption" TEXT,
    "cloudStoragePath" TEXT NOT NULL,
    "inspectionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InspectionPhoto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MeetingMinutes" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "meetingType" "MeetingType" NOT NULL DEFAULT 'PROGRESS',
    "meetingDate" TIMESTAMP(3) NOT NULL,
    "location" TEXT,
    "duration" INTEGER,
    "summary" TEXT,
    "projectId" TEXT NOT NULL,
    "organizerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MeetingMinutes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MeetingAttendee" (
    "id" TEXT NOT NULL,
    "meetingId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "company" TEXT,
    "email" TEXT,
    "attended" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MeetingAttendee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MeetingActionItem" (
    "id" TEXT NOT NULL,
    "meetingId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "assignedTo" TEXT,
    "dueDate" TIMESTAMP(3),
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MeetingActionItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Webhook" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "secret" TEXT,
    "events" TEXT[],
    "headers" JSONB DEFAULT '{}',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "consecutiveFailures" INTEGER NOT NULL DEFAULT 0,
    "lastTriggeredAt" TIMESTAMP(3),
    "organizationId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Webhook_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WebhookDelivery" (
    "id" TEXT NOT NULL,
    "webhookId" TEXT NOT NULL,
    "event" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "statusCode" INTEGER NOT NULL,
    "responseBody" TEXT,
    "success" BOOLEAN NOT NULL,
    "errorMessage" TEXT,
    "duration" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WebhookDelivery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApiConnection" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "serviceName" TEXT NOT NULL,
    "description" TEXT,
    "type" "ApiConnectionType" NOT NULL DEFAULT 'EXTERNAL',
    "environment" "ApiEnvironment" NOT NULL DEFAULT 'PRODUCTION',
    "category" "IntegrationCategory" NOT NULL DEFAULT 'OTHER',
    "purpose" TEXT,
    "configSchema" JSONB DEFAULT '{}',
    "dependentModules" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "credentials" JSONB NOT NULL,
    "baseUrl" TEXT,
    "version" TEXT,
    "headers" JSONB DEFAULT '{}',
    "status" "ApiConnectionStatus" NOT NULL DEFAULT 'ACTIVE',
    "lastValidatedAt" TIMESTAMP(3),
    "lastErrorMessage" TEXT,
    "consecutiveErrors" INTEGER NOT NULL DEFAULT 0,
    "lastSuccessAt" TIMESTAMP(3),
    "lastFailureAt" TIMESTAMP(3),
    "successCount" INTEGER NOT NULL DEFAULT 0,
    "failureCount" INTEGER NOT NULL DEFAULT 0,
    "rateLimitInfo" JSONB DEFAULT '{}',
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "isBuiltIn" BOOLEAN NOT NULL DEFAULT false,
    "isRequired" BOOLEAN NOT NULL DEFAULT false,
    "autoReconnect" BOOLEAN NOT NULL DEFAULT true,
    "expiresAt" TIMESTAMP(3),
    "createdById" TEXT,
    "lastModifiedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ApiConnection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApiConnectionLog" (
    "id" TEXT NOT NULL,
    "connectionId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "details" JSONB,
    "previousStatus" TEXT,
    "newStatus" TEXT,
    "testSuccess" BOOLEAN,
    "testResponseTime" INTEGER,
    "testErrorMessage" TEXT,
    "performedById" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ApiConnectionLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApiHealthCheck" (
    "id" TEXT NOT NULL,
    "connectionId" TEXT NOT NULL,
    "isHealthy" BOOLEAN NOT NULL,
    "responseTime" INTEGER NOT NULL,
    "statusCode" INTEGER,
    "errorMessage" TEXT,
    "checkType" TEXT NOT NULL DEFAULT 'scheduled',
    "endpoint" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ApiHealthCheck_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApiUsageRecord" (
    "id" TEXT NOT NULL,
    "connectionId" TEXT NOT NULL,
    "hourBucket" TIMESTAMP(3) NOT NULL,
    "requestCount" INTEGER NOT NULL DEFAULT 0,
    "successCount" INTEGER NOT NULL DEFAULT 0,
    "errorCount" INTEGER NOT NULL DEFAULT 0,
    "totalLatencyMs" INTEGER NOT NULL DEFAULT 0,
    "errorsByCode" JSONB DEFAULT '{}',
    "requestsByMethod" JSONB DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ApiUsageRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApiRateLimitConfig" (
    "id" TEXT NOT NULL,
    "connectionId" TEXT NOT NULL,
    "requestsPerMinute" INTEGER NOT NULL DEFAULT 60,
    "requestsPerHour" INTEGER NOT NULL DEFAULT 1000,
    "requestsPerDay" INTEGER NOT NULL DEFAULT 10000,
    "burstLimit" INTEGER NOT NULL DEFAULT 10,
    "throttleOnLimit" BOOLEAN NOT NULL DEFAULT true,
    "alertOnThreshold" BOOLEAN NOT NULL DEFAULT true,
    "alertThreshold" INTEGER NOT NULL DEFAULT 80,
    "currentMinuteUsage" INTEGER NOT NULL DEFAULT 0,
    "currentHourUsage" INTEGER NOT NULL DEFAULT 0,
    "currentDayUsage" INTEGER NOT NULL DEFAULT 0,
    "usageResetAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ApiRateLimitConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CostItem" (
    "id" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" "CostCategory" NOT NULL DEFAULT 'OTHER',
    "status" "CostStatus" NOT NULL DEFAULT 'ESTIMATED',
    "estimatedAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "actualAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "committedAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "invoiceNumber" TEXT,
    "invoiceDate" TIMESTAMP(3),
    "paidDate" TIMESTAMP(3),
    "vendor" TEXT,
    "notes" TEXT,
    "projectId" TEXT NOT NULL,
    "subcontractorId" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "costCodeId" TEXT,

    CONSTRAINT "CostItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Material" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "sku" TEXT,
    "category" TEXT,
    "unit" TEXT NOT NULL DEFAULT 'each',
    "quantityNeeded" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "quantityOrdered" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "quantityReceived" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "quantityInstalled" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "unitCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" "MaterialStatus" NOT NULL DEFAULT 'PLANNED',
    "supplier" TEXT,
    "leadTime" INTEGER,
    "expectedDate" TIMESTAMP(3),
    "deliveredDate" TIMESTAMP(3),
    "location" TEXT,
    "notes" TEXT,
    "projectId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Material_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MaterialDelivery" (
    "id" TEXT NOT NULL,
    "materialId" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "deliveryDate" TIMESTAMP(3) NOT NULL,
    "receivedById" TEXT NOT NULL,
    "deliveryNote" TEXT,
    "condition" TEXT,
    "photos" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MaterialDelivery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subcontractor" (
    "id" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "contactName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "address" TEXT,
    "trade" "TradeType" NOT NULL DEFAULT 'GENERAL',
    "licenseNumber" TEXT,
    "insuranceExpiry" TIMESTAMP(3),
    "rating" INTEGER,
    "notes" TEXT,
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Subcontractor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubcontractorContract" (
    "id" TEXT NOT NULL,
    "contractNumber" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "subcontractorId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "contractAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "paidAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "retainagePercent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "retainageAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" "ContractStatus" NOT NULL DEFAULT 'DRAFT',
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "scopeOfWork" TEXT,
    "terms" TEXT,
    "signedDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SubcontractorContract_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Milestone" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "targetDate" TIMESTAMP(3) NOT NULL,
    "actualDate" TIMESTAMP(3),
    "status" "MilestoneStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "percentComplete" INTEGER NOT NULL DEFAULT 0,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isCritical" BOOLEAN NOT NULL DEFAULT false,
    "dependencies" TEXT[],
    "notes" TEXT,
    "projectId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Milestone_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WeatherLog" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "tempHigh" DOUBLE PRECISION,
    "tempLow" DOUBLE PRECISION,
    "conditions" TEXT,
    "precipitation" DOUBLE PRECISION,
    "windSpeed" DOUBLE PRECISION,
    "humidity" DOUBLE PRECISION,
    "workImpact" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WeatherLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TimeEntry" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "taskId" TEXT,
    "userId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "hours" DOUBLE PRECISION NOT NULL,
    "description" TEXT,
    "billable" BOOLEAN NOT NULL DEFAULT true,
    "hourlyRate" DOUBLE PRECISION,
    "status" "TimeEntryStatus" NOT NULL DEFAULT 'PENDING',
    "approvedById" TEXT,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TimeEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Permit" (
    "id" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "permitNumber" TEXT,
    "type" "PermitType" NOT NULL DEFAULT 'BUILDING',
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "PermitStatus" NOT NULL DEFAULT 'DRAFT',
    "issuingAuthority" TEXT,
    "applicationDate" TIMESTAMP(3),
    "approvalDate" TIMESTAMP(3),
    "expirationDate" TIMESTAMP(3),
    "inspectionDate" TIMESTAMP(3),
    "fee" DOUBLE PRECISION,
    "feePaidDate" TIMESTAMP(3),
    "conditions" TEXT,
    "notes" TEXT,
    "projectId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Permit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PermitDocument" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "cloudStoragePath" TEXT NOT NULL,
    "fileSize" INTEGER,
    "mimeType" TEXT,
    "permitId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PermitDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Drawing" (
    "id" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "discipline" "DrawingDiscipline" NOT NULL DEFAULT 'ARCHITECTURAL',
    "status" "DrawingStatus" NOT NULL DEFAULT 'DRAFT',
    "currentRevision" TEXT NOT NULL DEFAULT '0',
    "scale" TEXT,
    "sheetSize" TEXT,
    "projectId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Drawing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DrawingRevision" (
    "id" TEXT NOT NULL,
    "revision" TEXT NOT NULL,
    "description" TEXT,
    "cloudStoragePath" TEXT NOT NULL,
    "fileSize" INTEGER,
    "mimeType" TEXT,
    "issuedDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "issuedBy" TEXT,
    "drawingId" TEXT NOT NULL,
    "uploadedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DrawingRevision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DrawingAnnotation" (
    "id" TEXT NOT NULL,
    "drawingId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#FF0000',
    "fillColor" TEXT DEFAULT '#FF0000',
    "strokeWidth" INTEGER NOT NULL DEFAULT 3,
    "opacity" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "text" TEXT,
    "fontFamily" TEXT DEFAULT 'Arial',
    "fontSize" INTEGER DEFAULT 16,
    "fontStyle" TEXT DEFAULT 'normal',
    "visible" BOOLEAN NOT NULL DEFAULT true,
    "locked" BOOLEAN NOT NULL DEFAULT false,
    "layer" INTEGER NOT NULL DEFAULT 0,
    "transform" JSONB,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DrawingAnnotation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SiteDiary" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "projectId" TEXT NOT NULL,
    "weatherMorning" TEXT,
    "weatherAfternoon" TEXT,
    "tempMorning" DOUBLE PRECISION,
    "tempAfternoon" DOUBLE PRECISION,
    "workAreas" TEXT,
    "workProgress" TEXT,
    "labourCount" INTEGER NOT NULL DEFAULT 0,
    "subcontractors" TEXT,
    "equipmentOnSite" TEXT,
    "delays" TEXT,
    "healthSafety" TEXT,
    "qualityIssues" TEXT,
    "clientInstructions" TEXT,
    "generalNotes" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SiteDiary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SiteDiaryEntry" (
    "id" TEXT NOT NULL,
    "siteDiaryId" TEXT NOT NULL,
    "time" TIMESTAMP(3),
    "type" "DiaryEntryType" NOT NULL DEFAULT 'GENERAL',
    "description" TEXT NOT NULL,
    "personName" TEXT,
    "company" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SiteDiaryEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SiteDiaryPhoto" (
    "id" TEXT NOT NULL,
    "caption" TEXT,
    "cloudStoragePath" TEXT NOT NULL,
    "location" TEXT,
    "siteDiaryId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SiteDiaryPhoto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Defect" (
    "id" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "location" TEXT,
    "floor" TEXT,
    "room" TEXT,
    "trade" "TradeType" NOT NULL DEFAULT 'GENERAL',
    "status" "DefectStatus" NOT NULL DEFAULT 'IDENTIFIED',
    "priority" "DefectPriority" NOT NULL DEFAULT 'MEDIUM',
    "dueDate" TIMESTAMP(3),
    "identifiedDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedDate" TIMESTAMP(3),
    "verifiedDate" TIMESTAMP(3),
    "responsibleParty" TEXT,
    "rootCause" TEXT,
    "remedialAction" TEXT,
    "cost" DOUBLE PRECISION,
    "projectId" TEXT NOT NULL,
    "assignedToId" TEXT,
    "createdById" TEXT NOT NULL,
    "verifiedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Defect_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DefectPhoto" (
    "id" TEXT NOT NULL,
    "caption" TEXT,
    "type" TEXT,
    "cloudStoragePath" TEXT NOT NULL,
    "defectId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DefectPhoto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProgressClaim" (
    "id" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "claimPeriodFrom" TIMESTAMP(3) NOT NULL,
    "claimPeriodTo" TIMESTAMP(3) NOT NULL,
    "status" "ClaimStatus" NOT NULL DEFAULT 'DRAFT',
    "previousClaimed" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "thisClaim" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalClaimed" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "approvedAmount" DOUBLE PRECISION,
    "retentionHeld" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "netPayable" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "submittedDate" TIMESTAMP(3),
    "approvedDate" TIMESTAMP(3),
    "paidDate" TIMESTAMP(3),
    "notes" TEXT,
    "projectId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProgressClaim_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClaimLineItem" (
    "id" TEXT NOT NULL,
    "claimId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "contractValue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "previousClaimed" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "percentComplete" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "thisClaim" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalClaimed" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClaimLineItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClaimDocument" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "cloudStoragePath" TEXT NOT NULL,
    "fileSize" INTEGER,
    "mimeType" TEXT,
    "claimId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClaimDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ToolboxTalk" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "description" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "startTime" TIMESTAMP(3),
    "endTime" TIMESTAMP(3),
    "location" TEXT,
    "status" "ToolboxTalkStatus" NOT NULL DEFAULT 'SCHEDULED',
    "keyPoints" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "hazardsDiscussed" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "safetyMeasures" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "presenterId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "notes" TEXT,
    "weatherConditions" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ToolboxTalk_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ToolboxTalkAttendee" (
    "id" TEXT NOT NULL,
    "toolboxTalkId" TEXT NOT NULL,
    "userId" TEXT,
    "name" TEXT NOT NULL,
    "company" TEXT,
    "trade" TEXT,
    "signedAt" TIMESTAMP(3),
    "signatureData" TEXT,
    "signatureIp" TEXT,
    "acknowledged" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ToolboxTalkAttendee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MEWPCheck" (
    "id" TEXT NOT NULL,
    "checkDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "equipmentId" TEXT,
    "equipmentName" TEXT NOT NULL,
    "equipmentSerial" TEXT,
    "equipmentModel" TEXT,
    "manufacturer" TEXT,
    "projectId" TEXT NOT NULL,
    "location" TEXT,
    "operatorId" TEXT NOT NULL,
    "operatorCertNumber" TEXT,
    "certExpiryDate" TIMESTAMP(3),
    "visualInspection" "CheckItemResult" NOT NULL DEFAULT 'OK',
    "guardrailsSecure" "CheckItemResult" NOT NULL DEFAULT 'OK',
    "floorCondition" "CheckItemResult" NOT NULL DEFAULT 'OK',
    "controlsFunction" "CheckItemResult" NOT NULL DEFAULT 'OK',
    "emergencyControls" "CheckItemResult" NOT NULL DEFAULT 'OK',
    "wheelsAndTyres" "CheckItemResult" NOT NULL DEFAULT 'OK',
    "outriggersStabilizers" "CheckItemResult" NOT NULL DEFAULT 'OK',
    "hydraulicSystem" "CheckItemResult" NOT NULL DEFAULT 'OK',
    "electricalSystem" "CheckItemResult" NOT NULL DEFAULT 'OK',
    "safetyDevices" "CheckItemResult" NOT NULL DEFAULT 'OK',
    "warningAlarms" "CheckItemResult" NOT NULL DEFAULT 'OK',
    "manualOverride" "CheckItemResult" NOT NULL DEFAULT 'OK',
    "loadPlateVisible" "CheckItemResult" NOT NULL DEFAULT 'OK',
    "userManualPresent" "CheckItemResult" NOT NULL DEFAULT 'OK',
    "overallStatus" "CheckStatus" NOT NULL DEFAULT 'PASS',
    "isSafeToUse" BOOLEAN NOT NULL DEFAULT true,
    "defectsFound" TEXT,
    "actionsTaken" TEXT,
    "comments" TEXT,
    "operatorSignature" TEXT,
    "operatorSignedAt" TIMESTAMP(3),
    "supervisorId" TEXT,
    "supervisorSignature" TEXT,
    "supervisorSignedAt" TIMESTAMP(3),
    "weatherConditions" TEXT,
    "windSpeed" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MEWPCheck_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ToolCheck" (
    "id" TEXT NOT NULL,
    "checkDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "toolName" TEXT NOT NULL,
    "toolType" TEXT NOT NULL,
    "toolSerial" TEXT,
    "toolAssetTag" TEXT,
    "manufacturer" TEXT,
    "projectId" TEXT NOT NULL,
    "location" TEXT,
    "inspectorId" TEXT NOT NULL,
    "generalCondition" "CheckItemResult" NOT NULL DEFAULT 'OK',
    "cableCondition" "CheckItemResult" NOT NULL DEFAULT 'NA',
    "plugCondition" "CheckItemResult" NOT NULL DEFAULT 'NA',
    "guardsFunctional" "CheckItemResult" NOT NULL DEFAULT 'NA',
    "switchesFunctional" "CheckItemResult" NOT NULL DEFAULT 'OK',
    "handlesSecure" "CheckItemResult" NOT NULL DEFAULT 'OK',
    "bladeSharpness" "CheckItemResult" NOT NULL DEFAULT 'NA',
    "lubricationStatus" "CheckItemResult" NOT NULL DEFAULT 'NA',
    "safetyFeatures" "CheckItemResult" NOT NULL DEFAULT 'OK',
    "storageCondition" "CheckItemResult" NOT NULL DEFAULT 'OK',
    "patTestCurrent" "CheckItemResult" NOT NULL DEFAULT 'NA',
    "stileCondition" "CheckItemResult" NOT NULL DEFAULT 'NA',
    "rungCondition" "CheckItemResult" NOT NULL DEFAULT 'NA',
    "feetCondition" "CheckItemResult" NOT NULL DEFAULT 'NA',
    "lockingMechanismOk" "CheckItemResult" NOT NULL DEFAULT 'NA',
    "overallStatus" "CheckStatus" NOT NULL DEFAULT 'PASS',
    "isSafeToUse" BOOLEAN NOT NULL DEFAULT true,
    "nextInspectionDue" TIMESTAMP(3),
    "defectsFound" TEXT,
    "actionsTaken" TEXT,
    "comments" TEXT,
    "inspectorSignature" TEXT,
    "inspectorSignedAt" TIMESTAMP(3),
    "photoUrls" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ToolCheck_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RiskAssessment" (
    "id" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "revision" TEXT NOT NULL DEFAULT 'A',
    "status" "RAMSStatus" NOT NULL DEFAULT 'DRAFT',
    "activityDescription" TEXT NOT NULL,
    "location" TEXT,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "methodStatement" TEXT,
    "sequence" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "requiredPPE" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "emergencyProcedures" TEXT,
    "nearestFirstAid" TEXT,
    "assemblyPoint" TEXT,
    "projectId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "reviewedById" TEXT,
    "approvedById" TEXT,
    "approvedDate" TIMESTAMP(3),
    "reviewComments" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RiskAssessment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RiskHazard" (
    "id" TEXT NOT NULL,
    "riskAssessmentId" TEXT NOT NULL,
    "hazardDescription" TEXT NOT NULL,
    "personsAtRisk" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "initialSeverity" INTEGER NOT NULL DEFAULT 3,
    "initialLikelihood" INTEGER NOT NULL DEFAULT 3,
    "initialRiskScore" INTEGER NOT NULL DEFAULT 9,
    "controlMeasures" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "residualSeverity" INTEGER NOT NULL DEFAULT 1,
    "residualLikelihood" INTEGER NOT NULL DEFAULT 1,
    "residualRiskScore" INTEGER NOT NULL DEFAULT 1,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RiskHazard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RAMSAcknowledgement" (
    "id" TEXT NOT NULL,
    "riskAssessmentId" TEXT NOT NULL,
    "workerId" TEXT,
    "workerName" TEXT NOT NULL,
    "company" TEXT,
    "acknowledgedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "signatureData" TEXT,
    "signatureIp" TEXT,

    CONSTRAINT "RAMSAcknowledgement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HotWorkPermit" (
    "id" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "status" "PermitToWorkStatus" NOT NULL DEFAULT 'REQUESTED',
    "workDescription" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "floor" TEXT,
    "equipment" TEXT,
    "validFrom" TIMESTAMP(3) NOT NULL,
    "validTo" TIMESTAMP(3) NOT NULL,
    "fireExtinguisherAvailable" BOOLEAN NOT NULL DEFAULT false,
    "areaCleared" BOOLEAN NOT NULL DEFAULT false,
    "combustiblesRemoved" BOOLEAN NOT NULL DEFAULT false,
    "fireWatchAssigned" BOOLEAN NOT NULL DEFAULT false,
    "sprinklersOperational" BOOLEAN NOT NULL DEFAULT true,
    "detectorsIsolated" BOOLEAN NOT NULL DEFAULT false,
    "ventilationAdequate" BOOLEAN NOT NULL DEFAULT false,
    "fireWatchName" TEXT,
    "fireWatchDuration" INTEGER,
    "projectId" TEXT NOT NULL,
    "requestedById" TEXT NOT NULL,
    "approvedById" TEXT,
    "requesterSignature" TEXT,
    "requesterSignedAt" TIMESTAMP(3),
    "approverSignature" TEXT,
    "approverSignedAt" TIMESTAMP(3),
    "completedById" TEXT,
    "completedAt" TIMESTAMP(3),
    "completionNotes" TEXT,
    "completionSignature" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HotWorkPermit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConfinedSpacePermit" (
    "id" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "status" "PermitToWorkStatus" NOT NULL DEFAULT 'REQUESTED',
    "spaceDescription" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "reasonForEntry" TEXT NOT NULL,
    "validFrom" TIMESTAMP(3) NOT NULL,
    "validTo" TIMESTAMP(3) NOT NULL,
    "oxygenLevel" DOUBLE PRECISION,
    "h2sLevel" DOUBLE PRECISION,
    "coLevel" DOUBLE PRECISION,
    "lelLevel" DOUBLE PRECISION,
    "testDateTime" TIMESTAMP(3),
    "testPerformedBy" TEXT,
    "spaceLocked" BOOLEAN NOT NULL DEFAULT false,
    "spaceIsolated" BOOLEAN NOT NULL DEFAULT false,
    "ventilationProvided" BOOLEAN NOT NULL DEFAULT false,
    "lightingProvided" BOOLEAN NOT NULL DEFAULT false,
    "communicationTested" BOOLEAN NOT NULL DEFAULT false,
    "rescueEquipmentReady" BOOLEAN NOT NULL DEFAULT false,
    "entrantsTrained" BOOLEAN NOT NULL DEFAULT false,
    "entrantNames" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "attendantName" TEXT,
    "rescueTeamNotified" BOOLEAN NOT NULL DEFAULT false,
    "emergencyContact" TEXT,
    "emergencyNumber" TEXT,
    "nearestHospital" TEXT,
    "projectId" TEXT NOT NULL,
    "requestedById" TEXT NOT NULL,
    "approvedById" TEXT,
    "requesterSignature" TEXT,
    "requesterSignedAt" TIMESTAMP(3),
    "approverSignature" TEXT,
    "approverSignedAt" TIMESTAMP(3),
    "attendantSignature" TEXT,
    "attendantSignedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "completionNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConfinedSpacePermit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LiftingOperation" (
    "id" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "status" "LiftingStatus" NOT NULL DEFAULT 'PLANNED',
    "description" TEXT NOT NULL,
    "liftDate" TIMESTAMP(3) NOT NULL,
    "location" TEXT NOT NULL,
    "loadDescription" TEXT NOT NULL,
    "loadWeight" DOUBLE PRECISION NOT NULL,
    "loadDimensions" TEXT,
    "loadCog" TEXT,
    "craneType" TEXT,
    "craneCapacity" DOUBLE PRECISION,
    "craneMake" TEXT,
    "craneSerial" TEXT,
    "slingType" TEXT,
    "slingCapacity" DOUBLE PRECISION,
    "shackleSize" TEXT,
    "liftRadius" DOUBLE PRECISION,
    "liftHeight" DOUBLE PRECISION,
    "groundConditions" TEXT,
    "windSpeedLimit" DOUBLE PRECISION,
    "actualWindSpeed" DOUBLE PRECISION,
    "liftPlanAttached" BOOLEAN NOT NULL DEFAULT false,
    "exclusionZoneSet" BOOLEAN NOT NULL DEFAULT false,
    "banksman" TEXT,
    "signallerName" TEXT,
    "projectId" TEXT NOT NULL,
    "plannedById" TEXT NOT NULL,
    "operatorId" TEXT,
    "supervisorId" TEXT,
    "appointedPersonId" TEXT,
    "plannerSignature" TEXT,
    "plannerSignedAt" TIMESTAMP(3),
    "supervisorSignature" TEXT,
    "supervisorSignedAt" TIMESTAMP(3),
    "operatorSignature" TEXT,
    "operatorSignedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "completionNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LiftingOperation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkerCertification" (
    "id" TEXT NOT NULL,
    "workerId" TEXT NOT NULL,
    "certificationType" "CertificationType" NOT NULL,
    "certificationName" TEXT NOT NULL,
    "cardNumber" TEXT,
    "issuingBody" TEXT,
    "issueDate" TIMESTAMP(3) NOT NULL,
    "expiryDate" TIMESTAMP(3),
    "isLifetime" BOOLEAN NOT NULL DEFAULT false,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "verifiedById" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "documentUrl" TEXT,
    "notes" TEXT,
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkerCertification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SiteAccessLog" (
    "id" TEXT NOT NULL,
    "accessType" "AccessType" NOT NULL DEFAULT 'ENTRY',
    "accessTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT,
    "personName" TEXT NOT NULL,
    "company" TEXT,
    "role" TEXT,
    "phone" TEXT,
    "vehicleReg" TEXT,
    "purpose" TEXT,
    "personVisiting" TEXT,
    "inductionCompleted" BOOLEAN NOT NULL DEFAULT false,
    "inductionDate" TIMESTAMP(3),
    "ppeProvided" BOOLEAN NOT NULL DEFAULT false,
    "briefingGiven" BOOLEAN NOT NULL DEFAULT false,
    "badgeNumber" TEXT,
    "signatureData" TEXT,
    "signatureIp" TEXT,
    "entryLogId" TEXT,
    "projectId" TEXT NOT NULL,
    "recordedById" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SiteAccessLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkPackage" (
    "id" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" "WorkPackageStatus" NOT NULL DEFAULT 'DRAFT',
    "scope" TEXT,
    "deliverables" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "budgetAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "committedAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "actualAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "plannedStartDate" TIMESTAMP(3),
    "plannedEndDate" TIMESTAMP(3),
    "actualStartDate" TIMESTAMP(3),
    "actualEndDate" TIMESTAMP(3),
    "percentComplete" INTEGER NOT NULL DEFAULT 0,
    "weightage" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "responsiblePartyId" TEXT,
    "predecessors" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "successors" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "dependencyType" TEXT,
    "leadLagDays" INTEGER NOT NULL DEFAULT 0,
    "isCriticalPath" BOOLEAN NOT NULL DEFAULT false,
    "totalFloat" INTEGER,
    "costCodeId" TEXT,
    "projectId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkPackage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CostCode" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "parentId" TEXT,
    "level" INTEGER NOT NULL DEFAULT 1,
    "category" "CostCategory" NOT NULL DEFAULT 'OTHER',
    "budgetAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "committedAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "actualAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "forecastAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "varianceThreshold" DOUBLE PRECISION NOT NULL DEFAULT 10,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "organizationId" TEXT NOT NULL,
    "projectId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CostCode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BudgetLine" (
    "id" TEXT NOT NULL,
    "costCodeId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "description" TEXT,
    "originalBudget" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "revisedBudget" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "committed" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "actual" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "forecast" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "variance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "variancePercent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "periodStart" TIMESTAMP(3),
    "periodEnd" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BudgetLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductionLog" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "shift" TEXT,
    "workPackageId" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "plannedQuantity" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "actualQuantity" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "cumulativeQuantity" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "plannedProductivity" DOUBLE PRECISION,
    "actualProductivity" DOUBLE PRECISION,
    "crewSize" INTEGER NOT NULL DEFAULT 0,
    "crewHours" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "weatherCondition" TEXT,
    "weatherImpact" TEXT,
    "notes" TEXT,
    "recordedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductionLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChangeOrderVersion" (
    "id" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "changeOrderId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "reason" TEXT,
    "costChange" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "scheduleChange" INTEGER,
    "scopeDiff" JSONB,
    "status" "ChangeOrderStatus" NOT NULL DEFAULT 'DRAFT',
    "createdById" TEXT NOT NULL,
    "approvedById" TEXT,
    "approvedAt" TIMESTAMP(3),
    "approvalComments" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChangeOrderVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyReportLabor" (
    "id" TEXT NOT NULL,
    "dailyReportId" TEXT NOT NULL,
    "trade" TEXT,
    "company" TEXT,
    "classification" TEXT,
    "regularHours" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "overtimeHours" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "doubleTimeHours" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "headcount" INTEGER NOT NULL DEFAULT 1,
    "workArea" TEXT,
    "workDescription" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DailyReportLabor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyReportEquipment" (
    "id" TEXT NOT NULL,
    "dailyReportId" TEXT NOT NULL,
    "equipmentName" TEXT NOT NULL,
    "equipmentNumber" TEXT,
    "equipmentType" TEXT,
    "hoursUsed" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "idleHours" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "operationalStatus" TEXT,
    "downReason" TEXT,
    "operatorName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DailyReportEquipment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyReportMaterial" (
    "id" TEXT NOT NULL,
    "dailyReportId" TEXT NOT NULL,
    "materialName" TEXT NOT NULL,
    "materialCode" TEXT,
    "quantityReceived" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "quantityUsed" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "unit" TEXT NOT NULL DEFAULT 'each',
    "supplierName" TEXT,
    "deliveryNote" TEXT,
    "storageLocation" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DailyReportMaterial_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ForecastEntry" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "forecastType" TEXT NOT NULL,
    "forecastDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "periodStart" TIMESTAMP(3),
    "periodEnd" TIMESTAMP(3),
    "originalBudget" DOUBLE PRECISION,
    "currentBudget" DOUBLE PRECISION,
    "actualToDate" DOUBLE PRECISION,
    "forecastAtCompletion" DOUBLE PRECISION,
    "estimateToComplete" DOUBLE PRECISION,
    "varianceAtCompletion" DOUBLE PRECISION,
    "plannedDuration" INTEGER,
    "actualDuration" INTEGER,
    "forecastDuration" INTEGER,
    "scheduleVariance" INTEGER,
    "plannedValue" DOUBLE PRECISION,
    "earnedValue" DOUBLE PRECISION,
    "actualCost" DOUBLE PRECISION,
    "costPerformanceIndex" DOUBLE PRECISION,
    "schedulePerformanceIndex" DOUBLE PRECISION,
    "confidence" TEXT,
    "assumptions" TEXT,
    "risks" TEXT,
    "scenarioName" TEXT,
    "isBaseline" BOOLEAN NOT NULL DEFAULT false,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ForecastEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RiskRegisterEntry" (
    "id" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "projectId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT,
    "source" TEXT,
    "probability" INTEGER NOT NULL DEFAULT 3,
    "impact" INTEGER NOT NULL DEFAULT 3,
    "riskScore" INTEGER NOT NULL DEFAULT 9,
    "riskLevel" TEXT,
    "identifiedDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewDate" TIMESTAMP(3),
    "closedDate" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "responseStrategy" TEXT,
    "mitigationPlan" TEXT,
    "contingencyPlan" TEXT,
    "costImpactMin" DOUBLE PRECISION,
    "costImpactMax" DOUBLE PRECISION,
    "costImpactMostLikely" DOUBLE PRECISION,
    "scheduleImpactDays" INTEGER,
    "ownerId" TEXT,
    "trendDirection" TEXT,
    "previousScore" INTEGER,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RiskRegisterEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RiskAction" (
    "id" TEXT NOT NULL,
    "riskId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "dueDate" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "completedDate" TIMESTAMP(3),
    "assigneeId" TEXT,
    "effectiveness" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RiskAction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DashboardSnapshot" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "projectId" TEXT,
    "snapshotDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "scheduleVariance" DOUBLE PRECISION,
    "schedulePerformanceIndex" DOUBLE PRECISION,
    "projectsOnSchedule" INTEGER,
    "projectsDelayed" INTEGER,
    "costVariance" DOUBLE PRECISION,
    "costPerformanceIndex" DOUBLE PRECISION,
    "totalBudget" DOUBLE PRECISION,
    "totalSpent" DOUBLE PRECISION,
    "forecastAtCompletion" DOUBLE PRECISION,
    "openRisks" INTEGER,
    "highRisks" INTEGER,
    "criticalRisks" INTEGER,
    "riskExposure" DOUBLE PRECISION,
    "openIncidents" INTEGER,
    "incidentsThisMonth" INTEGER,
    "nearMisses" INTEGER,
    "lostTimeInjuries" INTEGER,
    "pendingChangeOrders" INTEGER,
    "approvedChangeOrders" INTEGER,
    "changeOrderValue" DOUBLE PRECISION,
    "openDefects" INTEGER,
    "closedDefects" INTEGER,
    "defectRate" DOUBLE PRECISION,
    "plannedProgress" DOUBLE PRECISION,
    "actualProgress" DOUBLE PRECISION,
    "productivityIndex" DOUBLE PRECISION,
    "additionalMetrics" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DashboardSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AutomationRule" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "organizationId" TEXT NOT NULL,
    "projectId" TEXT,
    "triggerType" TEXT NOT NULL,
    "triggerCondition" JSONB NOT NULL,
    "actions" JSONB NOT NULL,
    "notifyRoles" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "notifyUsers" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "escalationDelay" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastTriggeredAt" TIMESTAMP(3),
    "triggerCount" INTEGER NOT NULL DEFAULT 0,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AutomationRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RuleExecutionLog" (
    "id" TEXT NOT NULL,
    "ruleId" TEXT NOT NULL,
    "executedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "triggerData" JSONB,
    "actionsExecuted" JSONB,
    "success" BOOLEAN NOT NULL DEFAULT true,
    "errorMessage" TEXT,

    CONSTRAINT "RuleExecutionLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PredictiveSignal" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "projectId" TEXT,
    "signalType" TEXT NOT NULL,
    "signalName" TEXT NOT NULL,
    "description" TEXT,
    "detectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "severity" TEXT NOT NULL DEFAULT 'MEDIUM',
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0.7,
    "dataPoints" JSONB,
    "trendDirection" TEXT,
    "trendDuration" INTEGER,
    "potentialImpact" TEXT,
    "potentialCostImpact" DOUBLE PRECISION,
    "potentialScheduleImpact" INTEGER,
    "recommendations" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "acknowledgedById" TEXT,
    "acknowledgedAt" TIMESTAMP(3),
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PredictiveSignal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VendorPortalAccess" (
    "id" TEXT NOT NULL,
    "subcontractorId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "accessToken" TEXT,
    "tokenExpiresAt" TIMESTAMP(3),
    "permissions" JSONB NOT NULL,
    "projectIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastLoginAt" TIMESTAMP(3),
    "loginCount" INTEGER NOT NULL DEFAULT 0,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VendorPortalAccess_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VendorSubmission" (
    "id" TEXT NOT NULL,
    "vendorAccessId" TEXT NOT NULL,
    "submissionType" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "percentComplete" DOUBLE PRECISION,
    "workDescription" TEXT,
    "invoiceNumber" TEXT,
    "invoiceAmount" DOUBLE PRECISION,
    "invoiceDate" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'SUBMITTED',
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "reviewComments" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VendorSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VendorSubmissionAttachment" (
    "id" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "cloudStoragePath" TEXT NOT NULL,
    "fileSize" INTEGER,
    "mimeType" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VendorSubmissionAttachment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" "TemplateCategory" NOT NULL DEFAULT 'OTHER',
    "version" TEXT NOT NULL DEFAULT '1.0',
    "content" JSONB NOT NULL,
    "thumbnailUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isSystemTemplate" BOOLEAN NOT NULL DEFAULT false,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "organizationId" TEXT,
    "createdById" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DocumentTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnalyticsWidget" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "chartType" "AnalyticsChartType" NOT NULL,
    "dataSource" TEXT NOT NULL,
    "query" JSONB NOT NULL,
    "position" JSONB,
    "settings" JSONB,
    "filters" JSONB,
    "period" "AnalyticsPeriod" NOT NULL DEFAULT 'MONTHLY',
    "organizationId" TEXT,
    "dashboardId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AnalyticsWidget_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnalyticsDashboard" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "layout" JSONB,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "organizationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AnalyticsDashboard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BackupConfiguration" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "backupType" "BackupType" NOT NULL DEFAULT 'FULL',
    "schedule" TEXT,
    "retention" INTEGER NOT NULL DEFAULT 30,
    "includeDocuments" BOOLEAN NOT NULL DEFAULT true,
    "includeDatabase" BOOLEAN NOT NULL DEFAULT true,
    "includeMedia" BOOLEAN NOT NULL DEFAULT true,
    "isCompressed" BOOLEAN NOT NULL DEFAULT true,
    "isEncrypted" BOOLEAN NOT NULL DEFAULT true,
    "organizationId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BackupConfiguration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BackupRecord" (
    "id" TEXT NOT NULL,
    "backupType" "BackupType" NOT NULL,
    "status" "BackupStatus" NOT NULL DEFAULT 'PENDING',
    "fileName" TEXT NOT NULL,
    "fileSize" BIGINT,
    "filePath" TEXT,
    "storageLocation" TEXT,
    "recordCount" JSONB,
    "errorMessage" TEXT,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "configId" TEXT,
    "organizationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BackupRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScheduledTask" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "taskType" "ScheduledTaskType" NOT NULL,
    "schedule" TEXT NOT NULL,
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "payload" JSONB,
    "timeout" INTEGER NOT NULL DEFAULT 300,
    "retryAttempts" INTEGER NOT NULL DEFAULT 3,
    "status" "ScheduledTaskStatus" NOT NULL DEFAULT 'ACTIVE',
    "nextRunAt" TIMESTAMP(3),
    "lastRunAt" TIMESTAMP(3),
    "lastStatus" "TaskExecutionStatus",
    "organizationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ScheduledTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScheduledTaskExecution" (
    "id" TEXT NOT NULL,
    "status" "TaskExecutionStatus" NOT NULL DEFAULT 'PENDING',
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "duration" INTEGER,
    "output" TEXT,
    "errorMessage" TEXT,
    "attemptNumber" INTEGER NOT NULL DEFAULT 1,
    "taskId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ScheduledTaskExecution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomReport" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "dataSource" TEXT NOT NULL,
    "columns" JSONB NOT NULL,
    "filters" JSONB,
    "groupBy" JSONB,
    "sortBy" JSONB,
    "aggregations" JSONB,
    "chartConfig" JSONB,
    "outputFormat" "ReportOutputFormat" NOT NULL DEFAULT 'PDF',
    "includeCharts" BOOLEAN NOT NULL DEFAULT true,
    "includeDataTable" BOOLEAN NOT NULL DEFAULT true,
    "isScheduled" BOOLEAN NOT NULL DEFAULT false,
    "scheduleFrequency" "ReportScheduleFrequency",
    "scheduleCron" TEXT,
    "nextRunAt" TIMESTAMP(3),
    "recipients" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "organizationId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReportExecution" (
    "id" TEXT NOT NULL,
    "status" "TaskExecutionStatus" NOT NULL DEFAULT 'PENDING',
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "duration" INTEGER,
    "outputUrl" TEXT,
    "fileSize" BIGINT,
    "recordCount" INTEGER,
    "errorMessage" TEXT,
    "reportId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReportExecution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Permission" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "resource" "PermissionResource" NOT NULL,
    "action" "PermissionAction" NOT NULL,
    "conditions" JSONB,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Permission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PermissionGrant" (
    "id" TEXT NOT NULL,
    "permissionId" TEXT NOT NULL,
    "userId" TEXT,
    "role" "UserRole",
    "organizationId" TEXT,
    "projectId" TEXT,
    "expiresAt" TIMESTAMP(3),
    "grantedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PermissionGrant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResourceQuota" (
    "id" TEXT NOT NULL,
    "quotaType" "QuotaType" NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "limitValue" BIGINT NOT NULL,
    "warningThreshold" DOUBLE PRECISION NOT NULL DEFAULT 0.8,
    "period" "QuotaPeriod" NOT NULL DEFAULT 'MONTHLY',
    "organizationId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ResourceQuota_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuotaUsageRecord" (
    "id" TEXT NOT NULL,
    "currentValue" BIGINT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "quotaId" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QuotaUsageRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrganizationRateLimit" (
    "id" TEXT NOT NULL,
    "endpoint" TEXT,
    "requestsPerMinute" INTEGER NOT NULL DEFAULT 60,
    "requestsPerHour" INTEGER NOT NULL DEFAULT 1000,
    "requestsPerDay" INTEGER NOT NULL DEFAULT 10000,
    "burstSize" INTEGER NOT NULL DEFAULT 10,
    "organizationId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrganizationRateLimit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RateLimitUsage" (
    "id" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "requestCount" INTEGER NOT NULL DEFAULT 1,
    "windowStart" TIMESTAMP(3) NOT NULL,
    "windowType" TEXT NOT NULL,
    "rateLimitId" TEXT NOT NULL,
    "userId" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RateLimitUsage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserMFA" (
    "id" TEXT NOT NULL,
    "mfaType" "MFAType" NOT NULL,
    "status" "MFAStatus" NOT NULL DEFAULT 'PENDING_SETUP',
    "secret" TEXT,
    "phoneNumber" TEXT,
    "backupCodes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "verifiedAt" TIMESTAMP(3),
    "lastUsedAt" TIMESTAMP(3),
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserMFA_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MFAVerificationLog" (
    "id" TEXT NOT NULL,
    "mfaId" TEXT NOT NULL,
    "success" BOOLEAN NOT NULL,
    "method" "MFAType" NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "errorMessage" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MFAVerificationLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Organization_slug_key" ON "Organization"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "CompanyInvitation_token_key" ON "CompanyInvitation"("token");

-- CreateIndex
CREATE INDEX "CompanyInvitation_token_idx" ON "CompanyInvitation"("token");

-- CreateIndex
CREATE INDEX "CompanyInvitation_ownerEmail_idx" ON "CompanyInvitation"("ownerEmail");

-- CreateIndex
CREATE INDEX "CompanyInvitation_status_idx" ON "CompanyInvitation"("status");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "TeamMember_userId_organizationId_key" ON "TeamMember"("userId", "organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectTeamMember_projectId_teamMemberId_key" ON "ProjectTeamMember"("projectId", "teamMemberId");

-- CreateIndex
CREATE UNIQUE INDEX "TeamInvitation_token_key" ON "TeamInvitation"("token");

-- CreateIndex
CREATE INDEX "TeamInvitation_token_idx" ON "TeamInvitation"("token");

-- CreateIndex
CREATE INDEX "TeamInvitation_email_idx" ON "TeamInvitation"("email");

-- CreateIndex
CREATE INDEX "TeamInvitation_organizationId_idx" ON "TeamInvitation"("organizationId");

-- CreateIndex
CREATE INDEX "Notification_userId_idx" ON "Notification"("userId");

-- CreateIndex
CREATE INDEX "Notification_projectId_idx" ON "Notification"("projectId");

-- CreateIndex
CREATE INDEX "Notification_read_idx" ON "Notification"("read");

-- CreateIndex
CREATE INDEX "Notification_createdAt_idx" ON "Notification"("createdAt");

-- CreateIndex
CREATE INDEX "Notification_userId_read_createdAt_idx" ON "Notification"("userId", "read", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "RFI_projectId_number_key" ON "RFI"("projectId", "number");

-- CreateIndex
CREATE UNIQUE INDEX "Submittal_projectId_number_key" ON "Submittal"("projectId", "number");

-- CreateIndex
CREATE UNIQUE INDEX "ChangeOrder_projectId_number_key" ON "ChangeOrder"("projectId", "number");

-- CreateIndex
CREATE UNIQUE INDEX "DailyReport_projectId_reportDate_key" ON "DailyReport"("projectId", "reportDate");

-- CreateIndex
CREATE UNIQUE INDEX "PunchList_projectId_number_key" ON "PunchList"("projectId", "number");

-- CreateIndex
CREATE UNIQUE INDEX "Equipment_equipmentNumber_key" ON "Equipment"("equipmentNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Inspection_projectId_number_key" ON "Inspection"("projectId", "number");

-- CreateIndex
CREATE INDEX "Webhook_organizationId_idx" ON "Webhook"("organizationId");

-- CreateIndex
CREATE INDEX "Webhook_isActive_idx" ON "Webhook"("isActive");

-- CreateIndex
CREATE INDEX "WebhookDelivery_webhookId_idx" ON "WebhookDelivery"("webhookId");

-- CreateIndex
CREATE INDEX "WebhookDelivery_createdAt_idx" ON "WebhookDelivery"("createdAt");

-- CreateIndex
CREATE INDEX "ApiConnection_status_idx" ON "ApiConnection"("status");

-- CreateIndex
CREATE INDEX "ApiConnection_type_idx" ON "ApiConnection"("type");

-- CreateIndex
CREATE INDEX "ApiConnection_environment_idx" ON "ApiConnection"("environment");

-- CreateIndex
CREATE INDEX "ApiConnection_category_idx" ON "ApiConnection"("category");

-- CreateIndex
CREATE INDEX "ApiConnection_isBuiltIn_idx" ON "ApiConnection"("isBuiltIn");

-- CreateIndex
CREATE UNIQUE INDEX "ApiConnection_serviceName_environment_key" ON "ApiConnection"("serviceName", "environment");

-- CreateIndex
CREATE INDEX "ApiConnectionLog_connectionId_idx" ON "ApiConnectionLog"("connectionId");

-- CreateIndex
CREATE INDEX "ApiConnectionLog_action_idx" ON "ApiConnectionLog"("action");

-- CreateIndex
CREATE INDEX "ApiConnectionLog_createdAt_idx" ON "ApiConnectionLog"("createdAt");

-- CreateIndex
CREATE INDEX "ApiHealthCheck_connectionId_idx" ON "ApiHealthCheck"("connectionId");

-- CreateIndex
CREATE INDEX "ApiHealthCheck_createdAt_idx" ON "ApiHealthCheck"("createdAt");

-- CreateIndex
CREATE INDEX "ApiHealthCheck_isHealthy_idx" ON "ApiHealthCheck"("isHealthy");

-- CreateIndex
CREATE INDEX "ApiUsageRecord_connectionId_idx" ON "ApiUsageRecord"("connectionId");

-- CreateIndex
CREATE INDEX "ApiUsageRecord_hourBucket_idx" ON "ApiUsageRecord"("hourBucket");

-- CreateIndex
CREATE UNIQUE INDEX "ApiUsageRecord_connectionId_hourBucket_key" ON "ApiUsageRecord"("connectionId", "hourBucket");

-- CreateIndex
CREATE UNIQUE INDEX "ApiRateLimitConfig_connectionId_key" ON "ApiRateLimitConfig"("connectionId");

-- CreateIndex
CREATE INDEX "ApiRateLimitConfig_connectionId_idx" ON "ApiRateLimitConfig"("connectionId");

-- CreateIndex
CREATE INDEX "CostItem_projectId_idx" ON "CostItem"("projectId");

-- CreateIndex
CREATE INDEX "CostItem_category_idx" ON "CostItem"("category");

-- CreateIndex
CREATE INDEX "CostItem_status_idx" ON "CostItem"("status");

-- CreateIndex
CREATE INDEX "CostItem_costCodeId_idx" ON "CostItem"("costCodeId");

-- CreateIndex
CREATE INDEX "Material_projectId_idx" ON "Material"("projectId");

-- CreateIndex
CREATE INDEX "Material_status_idx" ON "Material"("status");

-- CreateIndex
CREATE INDEX "MaterialDelivery_materialId_idx" ON "MaterialDelivery"("materialId");

-- CreateIndex
CREATE INDEX "Subcontractor_organizationId_idx" ON "Subcontractor"("organizationId");

-- CreateIndex
CREATE INDEX "Subcontractor_trade_idx" ON "Subcontractor"("trade");

-- CreateIndex
CREATE INDEX "SubcontractorContract_subcontractorId_idx" ON "SubcontractorContract"("subcontractorId");

-- CreateIndex
CREATE INDEX "SubcontractorContract_projectId_idx" ON "SubcontractorContract"("projectId");

-- CreateIndex
CREATE INDEX "SubcontractorContract_status_idx" ON "SubcontractorContract"("status");

-- CreateIndex
CREATE INDEX "Milestone_projectId_idx" ON "Milestone"("projectId");

-- CreateIndex
CREATE INDEX "Milestone_status_idx" ON "Milestone"("status");

-- CreateIndex
CREATE INDEX "Milestone_targetDate_idx" ON "Milestone"("targetDate");

-- CreateIndex
CREATE INDEX "WeatherLog_projectId_idx" ON "WeatherLog"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "WeatherLog_projectId_date_key" ON "WeatherLog"("projectId", "date");

-- CreateIndex
CREATE INDEX "TimeEntry_projectId_idx" ON "TimeEntry"("projectId");

-- CreateIndex
CREATE INDEX "TimeEntry_taskId_idx" ON "TimeEntry"("taskId");

-- CreateIndex
CREATE INDEX "TimeEntry_userId_idx" ON "TimeEntry"("userId");

-- CreateIndex
CREATE INDEX "TimeEntry_date_idx" ON "TimeEntry"("date");

-- CreateIndex
CREATE INDEX "Permit_projectId_idx" ON "Permit"("projectId");

-- CreateIndex
CREATE INDEX "Permit_status_idx" ON "Permit"("status");

-- CreateIndex
CREATE INDEX "Permit_type_idx" ON "Permit"("type");

-- CreateIndex
CREATE UNIQUE INDEX "Permit_projectId_number_key" ON "Permit"("projectId", "number");

-- CreateIndex
CREATE INDEX "Drawing_projectId_idx" ON "Drawing"("projectId");

-- CreateIndex
CREATE INDEX "Drawing_discipline_idx" ON "Drawing"("discipline");

-- CreateIndex
CREATE INDEX "Drawing_status_idx" ON "Drawing"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Drawing_projectId_number_key" ON "Drawing"("projectId", "number");

-- CreateIndex
CREATE INDEX "DrawingRevision_drawingId_idx" ON "DrawingRevision"("drawingId");

-- CreateIndex
CREATE UNIQUE INDEX "DrawingRevision_drawingId_revision_key" ON "DrawingRevision"("drawingId", "revision");

-- CreateIndex
CREATE INDEX "DrawingAnnotation_drawingId_idx" ON "DrawingAnnotation"("drawingId");

-- CreateIndex
CREATE INDEX "DrawingAnnotation_createdById_idx" ON "DrawingAnnotation"("createdById");

-- CreateIndex
CREATE INDEX "SiteDiary_projectId_idx" ON "SiteDiary"("projectId");

-- CreateIndex
CREATE INDEX "SiteDiary_date_idx" ON "SiteDiary"("date");

-- CreateIndex
CREATE UNIQUE INDEX "SiteDiary_projectId_date_key" ON "SiteDiary"("projectId", "date");

-- CreateIndex
CREATE INDEX "SiteDiaryEntry_siteDiaryId_idx" ON "SiteDiaryEntry"("siteDiaryId");

-- CreateIndex
CREATE INDEX "SiteDiaryPhoto_siteDiaryId_idx" ON "SiteDiaryPhoto"("siteDiaryId");

-- CreateIndex
CREATE INDEX "Defect_projectId_idx" ON "Defect"("projectId");

-- CreateIndex
CREATE INDEX "Defect_status_idx" ON "Defect"("status");

-- CreateIndex
CREATE INDEX "Defect_trade_idx" ON "Defect"("trade");

-- CreateIndex
CREATE UNIQUE INDEX "Defect_projectId_number_key" ON "Defect"("projectId", "number");

-- CreateIndex
CREATE INDEX "DefectPhoto_defectId_idx" ON "DefectPhoto"("defectId");

-- CreateIndex
CREATE INDEX "ProgressClaim_projectId_idx" ON "ProgressClaim"("projectId");

-- CreateIndex
CREATE INDEX "ProgressClaim_status_idx" ON "ProgressClaim"("status");

-- CreateIndex
CREATE UNIQUE INDEX "ProgressClaim_projectId_number_key" ON "ProgressClaim"("projectId", "number");

-- CreateIndex
CREATE INDEX "ClaimLineItem_claimId_idx" ON "ClaimLineItem"("claimId");

-- CreateIndex
CREATE INDEX "ClaimDocument_claimId_idx" ON "ClaimDocument"("claimId");

-- CreateIndex
CREATE INDEX "ToolboxTalk_projectId_idx" ON "ToolboxTalk"("projectId");

-- CreateIndex
CREATE INDEX "ToolboxTalk_presenterId_idx" ON "ToolboxTalk"("presenterId");

-- CreateIndex
CREATE INDEX "ToolboxTalk_date_idx" ON "ToolboxTalk"("date");

-- CreateIndex
CREATE INDEX "ToolboxTalk_status_idx" ON "ToolboxTalk"("status");

-- CreateIndex
CREATE INDEX "ToolboxTalkAttendee_toolboxTalkId_idx" ON "ToolboxTalkAttendee"("toolboxTalkId");

-- CreateIndex
CREATE INDEX "ToolboxTalkAttendee_userId_idx" ON "ToolboxTalkAttendee"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ToolboxTalkAttendee_toolboxTalkId_userId_key" ON "ToolboxTalkAttendee"("toolboxTalkId", "userId");

-- CreateIndex
CREATE INDEX "MEWPCheck_projectId_idx" ON "MEWPCheck"("projectId");

-- CreateIndex
CREATE INDEX "MEWPCheck_equipmentId_idx" ON "MEWPCheck"("equipmentId");

-- CreateIndex
CREATE INDEX "MEWPCheck_operatorId_idx" ON "MEWPCheck"("operatorId");

-- CreateIndex
CREATE INDEX "MEWPCheck_checkDate_idx" ON "MEWPCheck"("checkDate");

-- CreateIndex
CREATE INDEX "MEWPCheck_overallStatus_idx" ON "MEWPCheck"("overallStatus");

-- CreateIndex
CREATE INDEX "ToolCheck_projectId_idx" ON "ToolCheck"("projectId");

-- CreateIndex
CREATE INDEX "ToolCheck_inspectorId_idx" ON "ToolCheck"("inspectorId");

-- CreateIndex
CREATE INDEX "ToolCheck_checkDate_idx" ON "ToolCheck"("checkDate");

-- CreateIndex
CREATE INDEX "ToolCheck_toolType_idx" ON "ToolCheck"("toolType");

-- CreateIndex
CREATE INDEX "ToolCheck_overallStatus_idx" ON "ToolCheck"("overallStatus");

-- CreateIndex
CREATE INDEX "RiskAssessment_projectId_idx" ON "RiskAssessment"("projectId");

-- CreateIndex
CREATE INDEX "RiskAssessment_status_idx" ON "RiskAssessment"("status");

-- CreateIndex
CREATE UNIQUE INDEX "RiskAssessment_projectId_number_revision_key" ON "RiskAssessment"("projectId", "number", "revision");

-- CreateIndex
CREATE INDEX "RiskHazard_riskAssessmentId_idx" ON "RiskHazard"("riskAssessmentId");

-- CreateIndex
CREATE INDEX "RAMSAcknowledgement_riskAssessmentId_idx" ON "RAMSAcknowledgement"("riskAssessmentId");

-- CreateIndex
CREATE UNIQUE INDEX "RAMSAcknowledgement_riskAssessmentId_workerId_key" ON "RAMSAcknowledgement"("riskAssessmentId", "workerId");

-- CreateIndex
CREATE INDEX "HotWorkPermit_projectId_idx" ON "HotWorkPermit"("projectId");

-- CreateIndex
CREATE INDEX "HotWorkPermit_status_idx" ON "HotWorkPermit"("status");

-- CreateIndex
CREATE INDEX "HotWorkPermit_validFrom_idx" ON "HotWorkPermit"("validFrom");

-- CreateIndex
CREATE UNIQUE INDEX "HotWorkPermit_projectId_number_key" ON "HotWorkPermit"("projectId", "number");

-- CreateIndex
CREATE INDEX "ConfinedSpacePermit_projectId_idx" ON "ConfinedSpacePermit"("projectId");

-- CreateIndex
CREATE INDEX "ConfinedSpacePermit_status_idx" ON "ConfinedSpacePermit"("status");

-- CreateIndex
CREATE UNIQUE INDEX "ConfinedSpacePermit_projectId_number_key" ON "ConfinedSpacePermit"("projectId", "number");

-- CreateIndex
CREATE INDEX "LiftingOperation_projectId_idx" ON "LiftingOperation"("projectId");

-- CreateIndex
CREATE INDEX "LiftingOperation_liftDate_idx" ON "LiftingOperation"("liftDate");

-- CreateIndex
CREATE INDEX "LiftingOperation_status_idx" ON "LiftingOperation"("status");

-- CreateIndex
CREATE UNIQUE INDEX "LiftingOperation_projectId_number_key" ON "LiftingOperation"("projectId", "number");

-- CreateIndex
CREATE INDEX "WorkerCertification_workerId_idx" ON "WorkerCertification"("workerId");

-- CreateIndex
CREATE INDEX "WorkerCertification_organizationId_idx" ON "WorkerCertification"("organizationId");

-- CreateIndex
CREATE INDEX "WorkerCertification_certificationType_idx" ON "WorkerCertification"("certificationType");

-- CreateIndex
CREATE INDEX "WorkerCertification_expiryDate_idx" ON "WorkerCertification"("expiryDate");

-- CreateIndex
CREATE INDEX "SiteAccessLog_projectId_idx" ON "SiteAccessLog"("projectId");

-- CreateIndex
CREATE INDEX "SiteAccessLog_accessTime_idx" ON "SiteAccessLog"("accessTime");

-- CreateIndex
CREATE INDEX "SiteAccessLog_userId_idx" ON "SiteAccessLog"("userId");

-- CreateIndex
CREATE INDEX "SiteAccessLog_accessType_idx" ON "SiteAccessLog"("accessType");

-- CreateIndex
CREATE INDEX "WorkPackage_projectId_idx" ON "WorkPackage"("projectId");

-- CreateIndex
CREATE INDEX "WorkPackage_status_idx" ON "WorkPackage"("status");

-- CreateIndex
CREATE INDEX "WorkPackage_costCodeId_idx" ON "WorkPackage"("costCodeId");

-- CreateIndex
CREATE UNIQUE INDEX "WorkPackage_projectId_number_key" ON "WorkPackage"("projectId", "number");

-- CreateIndex
CREATE INDEX "CostCode_organizationId_idx" ON "CostCode"("organizationId");

-- CreateIndex
CREATE INDEX "CostCode_projectId_idx" ON "CostCode"("projectId");

-- CreateIndex
CREATE INDEX "CostCode_parentId_idx" ON "CostCode"("parentId");

-- CreateIndex
CREATE INDEX "CostCode_category_idx" ON "CostCode"("category");

-- CreateIndex
CREATE UNIQUE INDEX "CostCode_organizationId_code_projectId_key" ON "CostCode"("organizationId", "code", "projectId");

-- CreateIndex
CREATE INDEX "BudgetLine_projectId_idx" ON "BudgetLine"("projectId");

-- CreateIndex
CREATE INDEX "BudgetLine_costCodeId_idx" ON "BudgetLine"("costCodeId");

-- CreateIndex
CREATE UNIQUE INDEX "BudgetLine_costCodeId_projectId_key" ON "BudgetLine"("costCodeId", "projectId");

-- CreateIndex
CREATE INDEX "ProductionLog_workPackageId_idx" ON "ProductionLog"("workPackageId");

-- CreateIndex
CREATE INDEX "ProductionLog_date_idx" ON "ProductionLog"("date");

-- CreateIndex
CREATE UNIQUE INDEX "ProductionLog_workPackageId_date_shift_key" ON "ProductionLog"("workPackageId", "date", "shift");

-- CreateIndex
CREATE INDEX "ChangeOrderVersion_changeOrderId_idx" ON "ChangeOrderVersion"("changeOrderId");

-- CreateIndex
CREATE UNIQUE INDEX "ChangeOrderVersion_changeOrderId_version_key" ON "ChangeOrderVersion"("changeOrderId", "version");

-- CreateIndex
CREATE INDEX "DailyReportLabor_dailyReportId_idx" ON "DailyReportLabor"("dailyReportId");

-- CreateIndex
CREATE INDEX "DailyReportEquipment_dailyReportId_idx" ON "DailyReportEquipment"("dailyReportId");

-- CreateIndex
CREATE INDEX "DailyReportMaterial_dailyReportId_idx" ON "DailyReportMaterial"("dailyReportId");

-- CreateIndex
CREATE INDEX "ForecastEntry_projectId_idx" ON "ForecastEntry"("projectId");

-- CreateIndex
CREATE INDEX "ForecastEntry_forecastType_idx" ON "ForecastEntry"("forecastType");

-- CreateIndex
CREATE INDEX "ForecastEntry_forecastDate_idx" ON "ForecastEntry"("forecastDate");

-- CreateIndex
CREATE INDEX "RiskRegisterEntry_projectId_idx" ON "RiskRegisterEntry"("projectId");

-- CreateIndex
CREATE INDEX "RiskRegisterEntry_status_idx" ON "RiskRegisterEntry"("status");

-- CreateIndex
CREATE INDEX "RiskRegisterEntry_riskLevel_idx" ON "RiskRegisterEntry"("riskLevel");

-- CreateIndex
CREATE UNIQUE INDEX "RiskRegisterEntry_projectId_number_key" ON "RiskRegisterEntry"("projectId", "number");

-- CreateIndex
CREATE INDEX "RiskAction_riskId_idx" ON "RiskAction"("riskId");

-- CreateIndex
CREATE INDEX "RiskAction_status_idx" ON "RiskAction"("status");

-- CreateIndex
CREATE INDEX "DashboardSnapshot_organizationId_idx" ON "DashboardSnapshot"("organizationId");

-- CreateIndex
CREATE INDEX "DashboardSnapshot_projectId_idx" ON "DashboardSnapshot"("projectId");

-- CreateIndex
CREATE INDEX "DashboardSnapshot_snapshotDate_idx" ON "DashboardSnapshot"("snapshotDate");

-- CreateIndex
CREATE INDEX "AutomationRule_organizationId_idx" ON "AutomationRule"("organizationId");

-- CreateIndex
CREATE INDEX "AutomationRule_projectId_idx" ON "AutomationRule"("projectId");

-- CreateIndex
CREATE INDEX "AutomationRule_isActive_idx" ON "AutomationRule"("isActive");

-- CreateIndex
CREATE INDEX "AutomationRule_triggerType_idx" ON "AutomationRule"("triggerType");

-- CreateIndex
CREATE INDEX "RuleExecutionLog_ruleId_idx" ON "RuleExecutionLog"("ruleId");

-- CreateIndex
CREATE INDEX "RuleExecutionLog_executedAt_idx" ON "RuleExecutionLog"("executedAt");

-- CreateIndex
CREATE INDEX "PredictiveSignal_organizationId_idx" ON "PredictiveSignal"("organizationId");

-- CreateIndex
CREATE INDEX "PredictiveSignal_projectId_idx" ON "PredictiveSignal"("projectId");

-- CreateIndex
CREATE INDEX "PredictiveSignal_signalType_idx" ON "PredictiveSignal"("signalType");

-- CreateIndex
CREATE INDEX "PredictiveSignal_severity_idx" ON "PredictiveSignal"("severity");

-- CreateIndex
CREATE INDEX "PredictiveSignal_status_idx" ON "PredictiveSignal"("status");

-- CreateIndex
CREATE INDEX "VendorPortalAccess_subcontractorId_idx" ON "VendorPortalAccess"("subcontractorId");

-- CreateIndex
CREATE INDEX "VendorPortalAccess_email_idx" ON "VendorPortalAccess"("email");

-- CreateIndex
CREATE INDEX "VendorPortalAccess_isActive_idx" ON "VendorPortalAccess"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "VendorPortalAccess_subcontractorId_email_key" ON "VendorPortalAccess"("subcontractorId", "email");

-- CreateIndex
CREATE INDEX "VendorSubmission_vendorAccessId_idx" ON "VendorSubmission"("vendorAccessId");

-- CreateIndex
CREATE INDEX "VendorSubmission_projectId_idx" ON "VendorSubmission"("projectId");

-- CreateIndex
CREATE INDEX "VendorSubmission_submissionType_idx" ON "VendorSubmission"("submissionType");

-- CreateIndex
CREATE INDEX "VendorSubmission_status_idx" ON "VendorSubmission"("status");

-- CreateIndex
CREATE INDEX "VendorSubmissionAttachment_submissionId_idx" ON "VendorSubmissionAttachment"("submissionId");

-- CreateIndex
CREATE INDEX "DocumentTemplate_organizationId_idx" ON "DocumentTemplate"("organizationId");

-- CreateIndex
CREATE INDEX "DocumentTemplate_category_idx" ON "DocumentTemplate"("category");

-- CreateIndex
CREATE INDEX "DocumentTemplate_isActive_idx" ON "DocumentTemplate"("isActive");

-- CreateIndex
CREATE INDEX "DocumentTemplate_isSystemTemplate_idx" ON "DocumentTemplate"("isSystemTemplate");

-- CreateIndex
CREATE INDEX "AnalyticsWidget_organizationId_idx" ON "AnalyticsWidget"("organizationId");

-- CreateIndex
CREATE INDEX "AnalyticsWidget_dashboardId_idx" ON "AnalyticsWidget"("dashboardId");

-- CreateIndex
CREATE INDEX "AnalyticsDashboard_organizationId_idx" ON "AnalyticsDashboard"("organizationId");

-- CreateIndex
CREATE INDEX "AnalyticsDashboard_isDefault_idx" ON "AnalyticsDashboard"("isDefault");

-- CreateIndex
CREATE INDEX "BackupConfiguration_organizationId_idx" ON "BackupConfiguration"("organizationId");

-- CreateIndex
CREATE INDEX "BackupConfiguration_isActive_idx" ON "BackupConfiguration"("isActive");

-- CreateIndex
CREATE INDEX "BackupRecord_organizationId_idx" ON "BackupRecord"("organizationId");

-- CreateIndex
CREATE INDEX "BackupRecord_status_idx" ON "BackupRecord"("status");

-- CreateIndex
CREATE INDEX "BackupRecord_expiresAt_idx" ON "BackupRecord"("expiresAt");

-- CreateIndex
CREATE INDEX "ScheduledTask_organizationId_idx" ON "ScheduledTask"("organizationId");

-- CreateIndex
CREATE INDEX "ScheduledTask_status_idx" ON "ScheduledTask"("status");

-- CreateIndex
CREATE INDEX "ScheduledTask_nextRunAt_idx" ON "ScheduledTask"("nextRunAt");

-- CreateIndex
CREATE INDEX "ScheduledTaskExecution_taskId_idx" ON "ScheduledTaskExecution"("taskId");

-- CreateIndex
CREATE INDEX "ScheduledTaskExecution_status_idx" ON "ScheduledTaskExecution"("status");

-- CreateIndex
CREATE INDEX "ScheduledTaskExecution_startedAt_idx" ON "ScheduledTaskExecution"("startedAt");

-- CreateIndex
CREATE INDEX "CustomReport_organizationId_idx" ON "CustomReport"("organizationId");

-- CreateIndex
CREATE INDEX "CustomReport_isActive_idx" ON "CustomReport"("isActive");

-- CreateIndex
CREATE INDEX "CustomReport_nextRunAt_idx" ON "CustomReport"("nextRunAt");

-- CreateIndex
CREATE INDEX "ReportExecution_reportId_idx" ON "ReportExecution"("reportId");

-- CreateIndex
CREATE INDEX "ReportExecution_status_idx" ON "ReportExecution"("status");

-- CreateIndex
CREATE INDEX "ReportExecution_startedAt_idx" ON "ReportExecution"("startedAt");

-- CreateIndex
CREATE INDEX "Permission_resource_idx" ON "Permission"("resource");

-- CreateIndex
CREATE INDEX "Permission_action_idx" ON "Permission"("action");

-- CreateIndex
CREATE UNIQUE INDEX "Permission_resource_action_key" ON "Permission"("resource", "action");

-- CreateIndex
CREATE INDEX "PermissionGrant_permissionId_idx" ON "PermissionGrant"("permissionId");

-- CreateIndex
CREATE INDEX "PermissionGrant_userId_idx" ON "PermissionGrant"("userId");

-- CreateIndex
CREATE INDEX "PermissionGrant_organizationId_idx" ON "PermissionGrant"("organizationId");

-- CreateIndex
CREATE INDEX "PermissionGrant_projectId_idx" ON "PermissionGrant"("projectId");

-- CreateIndex
CREATE INDEX "PermissionGrant_role_idx" ON "PermissionGrant"("role");

-- CreateIndex
CREATE INDEX "ResourceQuota_organizationId_idx" ON "ResourceQuota"("organizationId");

-- CreateIndex
CREATE INDEX "ResourceQuota_quotaType_idx" ON "ResourceQuota"("quotaType");

-- CreateIndex
CREATE UNIQUE INDEX "ResourceQuota_organizationId_quotaType_period_key" ON "ResourceQuota"("organizationId", "quotaType", "period");

-- CreateIndex
CREATE INDEX "QuotaUsageRecord_quotaId_idx" ON "QuotaUsageRecord"("quotaId");

-- CreateIndex
CREATE INDEX "QuotaUsageRecord_timestamp_idx" ON "QuotaUsageRecord"("timestamp");

-- CreateIndex
CREATE INDEX "OrganizationRateLimit_organizationId_idx" ON "OrganizationRateLimit"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "OrganizationRateLimit_organizationId_endpoint_key" ON "OrganizationRateLimit"("organizationId", "endpoint");

-- CreateIndex
CREATE INDEX "RateLimitUsage_rateLimitId_idx" ON "RateLimitUsage"("rateLimitId");

-- CreateIndex
CREATE INDEX "RateLimitUsage_windowStart_idx" ON "RateLimitUsage"("windowStart");

-- CreateIndex
CREATE INDEX "RateLimitUsage_endpoint_idx" ON "RateLimitUsage"("endpoint");

-- CreateIndex
CREATE INDEX "RateLimitUsage_userId_idx" ON "RateLimitUsage"("userId");

-- CreateIndex
CREATE INDEX "UserMFA_userId_idx" ON "UserMFA"("userId");

-- CreateIndex
CREATE INDEX "UserMFA_status_idx" ON "UserMFA"("status");

-- CreateIndex
CREATE INDEX "MFAVerificationLog_mfaId_idx" ON "MFAVerificationLog"("mfaId");

-- CreateIndex
CREATE INDEX "MFAVerificationLog_timestamp_idx" ON "MFAVerificationLog"("timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- AddForeignKey
ALTER TABLE "CompanyInvitation" ADD CONSTRAINT "CompanyInvitation_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanyInvitation" ADD CONSTRAINT "CompanyInvitation_invitedById_fkey" FOREIGN KEY ("invitedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_workPackageId_fkey" FOREIGN KEY ("workPackageId") REFERENCES "WorkPackage"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskComment" ADD CONSTRAINT "TaskComment_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskComment" ADD CONSTRAINT "TaskComment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamMember" ADD CONSTRAINT "TeamMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamMember" ADD CONSTRAINT "TeamMember_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectTeamMember" ADD CONSTRAINT "ProjectTeamMember_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectTeamMember" ADD CONSTRAINT "ProjectTeamMember_teamMemberId_fkey" FOREIGN KEY ("teamMemberId") REFERENCES "TeamMember"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamInvitation" ADD CONSTRAINT "TeamInvitation_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamInvitation" ADD CONSTRAINT "TeamInvitation_invitedById_fkey" FOREIGN KEY ("invitedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityLog" ADD CONSTRAINT "ActivityLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityLog" ADD CONSTRAINT "ActivityLog_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RFI" ADD CONSTRAINT "RFI_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RFI" ADD CONSTRAINT "RFI_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RFI" ADD CONSTRAINT "RFI_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RFI" ADD CONSTRAINT "RFI_answeredById_fkey" FOREIGN KEY ("answeredById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RFIAttachment" ADD CONSTRAINT "RFIAttachment_rfiId_fkey" FOREIGN KEY ("rfiId") REFERENCES "RFI"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Submittal" ADD CONSTRAINT "Submittal_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Submittal" ADD CONSTRAINT "Submittal_submittedById_fkey" FOREIGN KEY ("submittedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Submittal" ADD CONSTRAINT "Submittal_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubmittalAttachment" ADD CONSTRAINT "SubmittalAttachment_submittalId_fkey" FOREIGN KEY ("submittalId") REFERENCES "Submittal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChangeOrder" ADD CONSTRAINT "ChangeOrder_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChangeOrder" ADD CONSTRAINT "ChangeOrder_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChangeOrder" ADD CONSTRAINT "ChangeOrder_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyReport" ADD CONSTRAINT "DailyReport_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyReport" ADD CONSTRAINT "DailyReport_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyReportPhoto" ADD CONSTRAINT "DailyReportPhoto_dailyReportId_fkey" FOREIGN KEY ("dailyReportId") REFERENCES "DailyReport"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SafetyIncident" ADD CONSTRAINT "SafetyIncident_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SafetyIncident" ADD CONSTRAINT "SafetyIncident_reportedById_fkey" FOREIGN KEY ("reportedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SafetyIncident" ADD CONSTRAINT "SafetyIncident_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SafetyIncidentPhoto" ADD CONSTRAINT "SafetyIncidentPhoto_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "SafetyIncident"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PunchList" ADD CONSTRAINT "PunchList_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PunchList" ADD CONSTRAINT "PunchList_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PunchList" ADD CONSTRAINT "PunchList_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PunchList" ADD CONSTRAINT "PunchList_verifiedById_fkey" FOREIGN KEY ("verifiedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PunchListPhoto" ADD CONSTRAINT "PunchListPhoto_punchListId_fkey" FOREIGN KEY ("punchListId") REFERENCES "PunchList"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Equipment" ADD CONSTRAINT "Equipment_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Equipment" ADD CONSTRAINT "Equipment_currentProjectId_fkey" FOREIGN KEY ("currentProjectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EquipmentMaintenanceLog" ADD CONSTRAINT "EquipmentMaintenanceLog_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "Equipment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EquipmentMaintenanceLog" ADD CONSTRAINT "EquipmentMaintenanceLog_performedById_fkey" FOREIGN KEY ("performedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EquipmentUsageLog" ADD CONSTRAINT "EquipmentUsageLog_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "Equipment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EquipmentUsageLog" ADD CONSTRAINT "EquipmentUsageLog_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EquipmentUsageLog" ADD CONSTRAINT "EquipmentUsageLog_checkedOutById_fkey" FOREIGN KEY ("checkedOutById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inspection" ADD CONSTRAINT "Inspection_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inspection" ADD CONSTRAINT "Inspection_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InspectionChecklistItem" ADD CONSTRAINT "InspectionChecklistItem_inspectionId_fkey" FOREIGN KEY ("inspectionId") REFERENCES "Inspection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InspectionPhoto" ADD CONSTRAINT "InspectionPhoto_inspectionId_fkey" FOREIGN KEY ("inspectionId") REFERENCES "Inspection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeetingMinutes" ADD CONSTRAINT "MeetingMinutes_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeetingMinutes" ADD CONSTRAINT "MeetingMinutes_organizerId_fkey" FOREIGN KEY ("organizerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeetingAttendee" ADD CONSTRAINT "MeetingAttendee_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "MeetingMinutes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeetingActionItem" ADD CONSTRAINT "MeetingActionItem_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "MeetingMinutes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Webhook" ADD CONSTRAINT "Webhook_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Webhook" ADD CONSTRAINT "Webhook_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WebhookDelivery" ADD CONSTRAINT "WebhookDelivery_webhookId_fkey" FOREIGN KEY ("webhookId") REFERENCES "Webhook"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApiConnection" ADD CONSTRAINT "ApiConnection_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApiConnection" ADD CONSTRAINT "ApiConnection_lastModifiedById_fkey" FOREIGN KEY ("lastModifiedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApiConnectionLog" ADD CONSTRAINT "ApiConnectionLog_connectionId_fkey" FOREIGN KEY ("connectionId") REFERENCES "ApiConnection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApiConnectionLog" ADD CONSTRAINT "ApiConnectionLog_performedById_fkey" FOREIGN KEY ("performedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApiHealthCheck" ADD CONSTRAINT "ApiHealthCheck_connectionId_fkey" FOREIGN KEY ("connectionId") REFERENCES "ApiConnection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApiUsageRecord" ADD CONSTRAINT "ApiUsageRecord_connectionId_fkey" FOREIGN KEY ("connectionId") REFERENCES "ApiConnection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApiRateLimitConfig" ADD CONSTRAINT "ApiRateLimitConfig_connectionId_fkey" FOREIGN KEY ("connectionId") REFERENCES "ApiConnection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CostItem" ADD CONSTRAINT "CostItem_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CostItem" ADD CONSTRAINT "CostItem_subcontractorId_fkey" FOREIGN KEY ("subcontractorId") REFERENCES "Subcontractor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CostItem" ADD CONSTRAINT "CostItem_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CostItem" ADD CONSTRAINT "CostItem_costCodeId_fkey" FOREIGN KEY ("costCodeId") REFERENCES "CostCode"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Material" ADD CONSTRAINT "Material_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Material" ADD CONSTRAINT "Material_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaterialDelivery" ADD CONSTRAINT "MaterialDelivery_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "Material"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaterialDelivery" ADD CONSTRAINT "MaterialDelivery_receivedById_fkey" FOREIGN KEY ("receivedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subcontractor" ADD CONSTRAINT "Subcontractor_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubcontractorContract" ADD CONSTRAINT "SubcontractorContract_subcontractorId_fkey" FOREIGN KEY ("subcontractorId") REFERENCES "Subcontractor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubcontractorContract" ADD CONSTRAINT "SubcontractorContract_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Milestone" ADD CONSTRAINT "Milestone_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Milestone" ADD CONSTRAINT "Milestone_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WeatherLog" ADD CONSTRAINT "WeatherLog_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimeEntry" ADD CONSTRAINT "TimeEntry_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimeEntry" ADD CONSTRAINT "TimeEntry_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimeEntry" ADD CONSTRAINT "TimeEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimeEntry" ADD CONSTRAINT "TimeEntry_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Permit" ADD CONSTRAINT "Permit_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PermitDocument" ADD CONSTRAINT "PermitDocument_permitId_fkey" FOREIGN KEY ("permitId") REFERENCES "Permit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Drawing" ADD CONSTRAINT "Drawing_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DrawingRevision" ADD CONSTRAINT "DrawingRevision_drawingId_fkey" FOREIGN KEY ("drawingId") REFERENCES "Drawing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DrawingRevision" ADD CONSTRAINT "DrawingRevision_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DrawingAnnotation" ADD CONSTRAINT "DrawingAnnotation_drawingId_fkey" FOREIGN KEY ("drawingId") REFERENCES "Drawing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DrawingAnnotation" ADD CONSTRAINT "DrawingAnnotation_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SiteDiary" ADD CONSTRAINT "SiteDiary_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SiteDiaryEntry" ADD CONSTRAINT "SiteDiaryEntry_siteDiaryId_fkey" FOREIGN KEY ("siteDiaryId") REFERENCES "SiteDiary"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SiteDiaryPhoto" ADD CONSTRAINT "SiteDiaryPhoto_siteDiaryId_fkey" FOREIGN KEY ("siteDiaryId") REFERENCES "SiteDiary"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Defect" ADD CONSTRAINT "Defect_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DefectPhoto" ADD CONSTRAINT "DefectPhoto_defectId_fkey" FOREIGN KEY ("defectId") REFERENCES "Defect"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProgressClaim" ADD CONSTRAINT "ProgressClaim_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClaimLineItem" ADD CONSTRAINT "ClaimLineItem_claimId_fkey" FOREIGN KEY ("claimId") REFERENCES "ProgressClaim"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClaimDocument" ADD CONSTRAINT "ClaimDocument_claimId_fkey" FOREIGN KEY ("claimId") REFERENCES "ProgressClaim"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ToolboxTalk" ADD CONSTRAINT "ToolboxTalk_presenterId_fkey" FOREIGN KEY ("presenterId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ToolboxTalk" ADD CONSTRAINT "ToolboxTalk_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ToolboxTalkAttendee" ADD CONSTRAINT "ToolboxTalkAttendee_toolboxTalkId_fkey" FOREIGN KEY ("toolboxTalkId") REFERENCES "ToolboxTalk"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ToolboxTalkAttendee" ADD CONSTRAINT "ToolboxTalkAttendee_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MEWPCheck" ADD CONSTRAINT "MEWPCheck_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "Equipment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MEWPCheck" ADD CONSTRAINT "MEWPCheck_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MEWPCheck" ADD CONSTRAINT "MEWPCheck_operatorId_fkey" FOREIGN KEY ("operatorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MEWPCheck" ADD CONSTRAINT "MEWPCheck_supervisorId_fkey" FOREIGN KEY ("supervisorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ToolCheck" ADD CONSTRAINT "ToolCheck_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ToolCheck" ADD CONSTRAINT "ToolCheck_inspectorId_fkey" FOREIGN KEY ("inspectorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RiskAssessment" ADD CONSTRAINT "RiskAssessment_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RiskAssessment" ADD CONSTRAINT "RiskAssessment_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RiskAssessment" ADD CONSTRAINT "RiskAssessment_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RiskAssessment" ADD CONSTRAINT "RiskAssessment_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RiskHazard" ADD CONSTRAINT "RiskHazard_riskAssessmentId_fkey" FOREIGN KEY ("riskAssessmentId") REFERENCES "RiskAssessment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RAMSAcknowledgement" ADD CONSTRAINT "RAMSAcknowledgement_riskAssessmentId_fkey" FOREIGN KEY ("riskAssessmentId") REFERENCES "RiskAssessment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RAMSAcknowledgement" ADD CONSTRAINT "RAMSAcknowledgement_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HotWorkPermit" ADD CONSTRAINT "HotWorkPermit_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HotWorkPermit" ADD CONSTRAINT "HotWorkPermit_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HotWorkPermit" ADD CONSTRAINT "HotWorkPermit_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HotWorkPermit" ADD CONSTRAINT "HotWorkPermit_completedById_fkey" FOREIGN KEY ("completedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConfinedSpacePermit" ADD CONSTRAINT "ConfinedSpacePermit_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConfinedSpacePermit" ADD CONSTRAINT "ConfinedSpacePermit_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConfinedSpacePermit" ADD CONSTRAINT "ConfinedSpacePermit_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LiftingOperation" ADD CONSTRAINT "LiftingOperation_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LiftingOperation" ADD CONSTRAINT "LiftingOperation_plannedById_fkey" FOREIGN KEY ("plannedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LiftingOperation" ADD CONSTRAINT "LiftingOperation_operatorId_fkey" FOREIGN KEY ("operatorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LiftingOperation" ADD CONSTRAINT "LiftingOperation_supervisorId_fkey" FOREIGN KEY ("supervisorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LiftingOperation" ADD CONSTRAINT "LiftingOperation_appointedPersonId_fkey" FOREIGN KEY ("appointedPersonId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkerCertification" ADD CONSTRAINT "WorkerCertification_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkerCertification" ADD CONSTRAINT "WorkerCertification_verifiedById_fkey" FOREIGN KEY ("verifiedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkerCertification" ADD CONSTRAINT "WorkerCertification_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SiteAccessLog" ADD CONSTRAINT "SiteAccessLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SiteAccessLog" ADD CONSTRAINT "SiteAccessLog_entryLogId_fkey" FOREIGN KEY ("entryLogId") REFERENCES "SiteAccessLog"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SiteAccessLog" ADD CONSTRAINT "SiteAccessLog_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SiteAccessLog" ADD CONSTRAINT "SiteAccessLog_recordedById_fkey" FOREIGN KEY ("recordedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkPackage" ADD CONSTRAINT "WorkPackage_responsiblePartyId_fkey" FOREIGN KEY ("responsiblePartyId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkPackage" ADD CONSTRAINT "WorkPackage_costCodeId_fkey" FOREIGN KEY ("costCodeId") REFERENCES "CostCode"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkPackage" ADD CONSTRAINT "WorkPackage_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkPackage" ADD CONSTRAINT "WorkPackage_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CostCode" ADD CONSTRAINT "CostCode_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "CostCode"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CostCode" ADD CONSTRAINT "CostCode_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CostCode" ADD CONSTRAINT "CostCode_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BudgetLine" ADD CONSTRAINT "BudgetLine_costCodeId_fkey" FOREIGN KEY ("costCodeId") REFERENCES "CostCode"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BudgetLine" ADD CONSTRAINT "BudgetLine_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductionLog" ADD CONSTRAINT "ProductionLog_workPackageId_fkey" FOREIGN KEY ("workPackageId") REFERENCES "WorkPackage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductionLog" ADD CONSTRAINT "ProductionLog_recordedById_fkey" FOREIGN KEY ("recordedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChangeOrderVersion" ADD CONSTRAINT "ChangeOrderVersion_changeOrderId_fkey" FOREIGN KEY ("changeOrderId") REFERENCES "ChangeOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChangeOrderVersion" ADD CONSTRAINT "ChangeOrderVersion_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChangeOrderVersion" ADD CONSTRAINT "ChangeOrderVersion_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyReportLabor" ADD CONSTRAINT "DailyReportLabor_dailyReportId_fkey" FOREIGN KEY ("dailyReportId") REFERENCES "DailyReport"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyReportEquipment" ADD CONSTRAINT "DailyReportEquipment_dailyReportId_fkey" FOREIGN KEY ("dailyReportId") REFERENCES "DailyReport"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyReportMaterial" ADD CONSTRAINT "DailyReportMaterial_dailyReportId_fkey" FOREIGN KEY ("dailyReportId") REFERENCES "DailyReport"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ForecastEntry" ADD CONSTRAINT "ForecastEntry_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ForecastEntry" ADD CONSTRAINT "ForecastEntry_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RiskRegisterEntry" ADD CONSTRAINT "RiskRegisterEntry_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RiskRegisterEntry" ADD CONSTRAINT "RiskRegisterEntry_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RiskRegisterEntry" ADD CONSTRAINT "RiskRegisterEntry_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RiskAction" ADD CONSTRAINT "RiskAction_riskId_fkey" FOREIGN KEY ("riskId") REFERENCES "RiskRegisterEntry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RiskAction" ADD CONSTRAINT "RiskAction_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DashboardSnapshot" ADD CONSTRAINT "DashboardSnapshot_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DashboardSnapshot" ADD CONSTRAINT "DashboardSnapshot_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AutomationRule" ADD CONSTRAINT "AutomationRule_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AutomationRule" ADD CONSTRAINT "AutomationRule_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AutomationRule" ADD CONSTRAINT "AutomationRule_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RuleExecutionLog" ADD CONSTRAINT "RuleExecutionLog_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "AutomationRule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PredictiveSignal" ADD CONSTRAINT "PredictiveSignal_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PredictiveSignal" ADD CONSTRAINT "PredictiveSignal_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PredictiveSignal" ADD CONSTRAINT "PredictiveSignal_acknowledgedById_fkey" FOREIGN KEY ("acknowledgedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorPortalAccess" ADD CONSTRAINT "VendorPortalAccess_subcontractorId_fkey" FOREIGN KEY ("subcontractorId") REFERENCES "Subcontractor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorPortalAccess" ADD CONSTRAINT "VendorPortalAccess_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorSubmission" ADD CONSTRAINT "VendorSubmission_vendorAccessId_fkey" FOREIGN KEY ("vendorAccessId") REFERENCES "VendorPortalAccess"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorSubmission" ADD CONSTRAINT "VendorSubmission_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorSubmission" ADD CONSTRAINT "VendorSubmission_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorSubmissionAttachment" ADD CONSTRAINT "VendorSubmissionAttachment_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "VendorSubmission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentTemplate" ADD CONSTRAINT "DocumentTemplate_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentTemplate" ADD CONSTRAINT "DocumentTemplate_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnalyticsWidget" ADD CONSTRAINT "AnalyticsWidget_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnalyticsWidget" ADD CONSTRAINT "AnalyticsWidget_dashboardId_fkey" FOREIGN KEY ("dashboardId") REFERENCES "AnalyticsDashboard"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnalyticsDashboard" ADD CONSTRAINT "AnalyticsDashboard_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BackupConfiguration" ADD CONSTRAINT "BackupConfiguration_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BackupRecord" ADD CONSTRAINT "BackupRecord_configId_fkey" FOREIGN KEY ("configId") REFERENCES "BackupConfiguration"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BackupRecord" ADD CONSTRAINT "BackupRecord_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduledTask" ADD CONSTRAINT "ScheduledTask_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduledTaskExecution" ADD CONSTRAINT "ScheduledTaskExecution_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "ScheduledTask"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomReport" ADD CONSTRAINT "CustomReport_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReportExecution" ADD CONSTRAINT "ReportExecution_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "CustomReport"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PermissionGrant" ADD CONSTRAINT "PermissionGrant_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "Permission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PermissionGrant" ADD CONSTRAINT "PermissionGrant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PermissionGrant" ADD CONSTRAINT "PermissionGrant_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PermissionGrant" ADD CONSTRAINT "PermissionGrant_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PermissionGrant" ADD CONSTRAINT "PermissionGrant_grantedById_fkey" FOREIGN KEY ("grantedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResourceQuota" ADD CONSTRAINT "ResourceQuota_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuotaUsageRecord" ADD CONSTRAINT "QuotaUsageRecord_quotaId_fkey" FOREIGN KEY ("quotaId") REFERENCES "ResourceQuota"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganizationRateLimit" ADD CONSTRAINT "OrganizationRateLimit_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RateLimitUsage" ADD CONSTRAINT "RateLimitUsage_rateLimitId_fkey" FOREIGN KEY ("rateLimitId") REFERENCES "OrganizationRateLimit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RateLimitUsage" ADD CONSTRAINT "RateLimitUsage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserMFA" ADD CONSTRAINT "UserMFA_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MFAVerificationLog" ADD CONSTRAINT "MFAVerificationLog_mfaId_fkey" FOREIGN KEY ("mfaId") REFERENCES "UserMFA"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

