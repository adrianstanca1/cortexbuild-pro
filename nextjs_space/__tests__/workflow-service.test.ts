import { describe, it, expect, beforeEach, vi } from "vitest";
import { saveWorkflow, getWorkflows, getWorkflow, deleteWorkflow, executeWorkflow } from "@/lib/workflows/workflow-service";
import { prisma } from "@/lib/db";

// Mock prisma
vi.mock("@/lib/db", () => ({
  prisma: {
    automationRule: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
    },
    ruleExecutionLog: {
      create: vi.fn(),
    },
  },
}));

// Mock auth
vi.mock("next-auth", () => ({
  getServerSession: vi.fn(() =>
    Promise.resolve({
      user: {
        id: "user-1",
        organizationId: "org-1",
      },
    })
  ),
}));

describe("Workflow Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("saveWorkflow", () => {
    it("should create a new workflow", async () => {
      const workflowData = {
        name: "Test Workflow",
        description: "Test Description",
        triggerType: "WEBHOOK",
        triggerCondition: { type: "WEBHOOK", config: { path: "/api/test" } },
        actions: [{ type: "EMAIL", config: { recipients: "test@example.com" } }],
        flow: { nodes: [], edges: [] },
      };

      (prisma.automationRule.findFirst as any).mockResolvedValue(null);
      (prisma.automationRule.create as any).mockResolvedValue({
        id: "workflow-1",
        name: "Test Workflow",
        description: "Test Description",
        organizationId: "org-1",
        triggerType: "WEBHOOK",
        triggerCondition: workflowData.triggerCondition,
        actions: workflowData.actions,
        isActive: true,
        createdById: "user-1",
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await saveWorkflow(workflowData);

      expect(result.name).toBe("Test Workflow");
      expect(result.triggerType).toBe("WEBHOOK");
      expect(prisma.automationRule.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            name: "Test Workflow",
            triggerType: "WEBHOOK",
          }),
        })
      );
    });

    it("should update an existing workflow", async () => {
      const workflowData = {
        name: "Updated Workflow",
        description: "Updated Description",
        triggerType: "SCHEDULE",
        triggerCondition: { type: "SCHEDULE", config: { time: "09:00" } },
        actions: [],
        flow: { nodes: [], edges: [] },
      };

      (prisma.automationRule.findFirst as any).mockResolvedValue({
        id: "workflow-1",
        name: "Old Name",
      });

      (prisma.automationRule.update as any).mockResolvedValue({
        id: "workflow-1",
        name: "Updated Workflow",
        description: "Updated Description",
        organizationId: "org-1",
        triggerType: "SCHEDULE",
        triggerCondition: workflowData.triggerCondition,
        actions: workflowData.actions,
        isActive: true,
        createdById: "user-1",
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await saveWorkflow(workflowData);

      expect(result.name).toBe("Updated Workflow");
      expect(prisma.automationRule.update).toBeDefined();
    });
  });

  describe("getWorkflows", () => {
    it("should return all workflows for organization", async () => {
      const mockWorkflows = [
        {
          id: "workflow-1",
          name: "Workflow 1",
          description: "Description 1",
          organizationId: "org-1",
          triggerType: "WEBHOOK",
          triggerCondition: {},
          actions: [],
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "workflow-2",
          name: "Workflow 2",
          description: null,
          organizationId: "org-1",
          triggerType: "SCHEDULE",
          triggerCondition: {},
          actions: [],
          isActive: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      (prisma.automationRule.findMany as any).mockResolvedValue(mockWorkflows);

      const result = await getWorkflows();

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe("Workflow 1");
      expect(result[1].triggerType).toBe("SCHEDULE");
    });
  });

  describe("getWorkflow", () => {
    it("should return a single workflow by id", async () => {
      const mockWorkflow = {
        id: "workflow-1",
        name: "Test Workflow",
        description: "Test Description",
        organizationId: "org-1",
        triggerType: "WEBHOOK",
        triggerCondition: {},
        actions: [],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.automationRule.findFirst as any).mockResolvedValue(mockWorkflow);

      const result = await getWorkflow("workflow-1");

      expect(result?.id).toBe("workflow-1");
      expect(result?.name).toBe("Test Workflow");
    });

    it("should return null if workflow not found", async () => {
      (prisma.automationRule.findFirst as any).mockResolvedValue(null);

      const result = await getWorkflow("nonexistent");

      expect(result).toBeNull();
    });
  });

  describe("deleteWorkflow", () => {
    it("should delete a workflow", async () => {
      (prisma.automationRule.deleteMany as any).mockResolvedValue({ count: 1 });

      await deleteWorkflow("workflow-1");

      expect(prisma.automationRule.deleteMany).toHaveBeenCalledWith({
        where: { id: "workflow-1", organizationId: "org-1" },
      });
    });
  });

  describe("executeWorkflow", () => {
    it("should execute an active workflow", async () => {
      const mockWorkflow = {
        id: "workflow-1",
        name: "Test Workflow",
        organizationId: "org-1",
        triggerType: "WEBHOOK",
        triggerCondition: { type: "WEBHOOK", config: { path: "/api/test" } },
        actions: [],
        isActive: true,
        triggerCount: 0,
      };

      (prisma.automationRule.findFirst as any).mockResolvedValue(mockWorkflow);
      (prisma.ruleExecutionLog.create as any).mockResolvedValue({ id: "exec-1" });
      (prisma.automationRule.update as any).mockResolvedValue(mockWorkflow);

      const result = await executeWorkflow("workflow-1", { test: true });

      expect(result.success).toBe(true);
      expect(result.message).toBe("Workflow executed successfully");
      expect(result.executionId).toBe("exec-1");
    });

    it("should fail for inactive workflow", async () => {
      const mockWorkflow = {
        id: "workflow-1",
        name: "Test Workflow",
        organizationId: "org-1",
        isActive: false,
      };

      (prisma.automationRule.findFirst as any).mockResolvedValue(mockWorkflow);

      const result = await executeWorkflow("workflow-1", {});

      expect(result.success).toBe(false);
      expect(result.message).toBe("Workflow is inactive");
    });

    it("should fail for nonexistent workflow", async () => {
      (prisma.automationRule.findFirst as any).mockResolvedValue(null);

      const result = await executeWorkflow("nonexistent", {});

      expect(result.success).toBe(false);
      expect(result.message).toBe("Workflow not found");
    });
  });
});
