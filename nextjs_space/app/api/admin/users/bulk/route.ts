import { NextRequest, NextResponse } from "next/server";

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";

// Bulk operations for users
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { action, userIds, data } = body;

    if (!action) {
      return NextResponse.json({ error: "Missing action parameter" }, { status: 400 });
    }

    let result: any;

    switch (action) {
      case "delete":
        if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
          return NextResponse.json({ error: "Missing or invalid userIds" }, { status: 400 });
        }

        // Prevent deleting super admins
        const superAdmins = await prisma.user.count({
          where: { id: { in: userIds }, role: "SUPER_ADMIN" }
        });
        
        if (superAdmins > 0) {
          return NextResponse.json({ 
            error: "Cannot bulk delete super admin users" 
          }, { status: 403 });
        }

        // Prevent deleting the currently authenticated user
        if (userIds.includes(session.user.id)) {
          return NextResponse.json({
            error: "Cannot delete your own account"
          }, { status: 403 });
        }

        const deleteResult = await prisma.user.deleteMany({
          where: { id: { in: userIds } }
        });

        result = {
          success: true,
          deleted: deleteResult.count,
          message: `Successfully deleted ${deleteResult.count} user(s)`
        };
        
        // Log the action
        await prisma.activityLog.create({
          data: {
            action: "bulk_delete_users",
            entityType: "USER",
            details: JSON.stringify({ 
              deletedCount: deleteResult.count, 
              userIds 
            }),
            userId: session.user.id
          }
        });
        break;

      case "update_role":
        if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
          return NextResponse.json({ error: "Missing or invalid userIds" }, { status: 400 });
        }
        if (!data?.role) {
          return NextResponse.json({ error: "Missing role in data" }, { status: 400 });
        }

        // Prevent changing super admin roles
        const existingSuperAdmins = await prisma.user.count({
          where: { id: { in: userIds }, role: "SUPER_ADMIN" }
        });
        
        if (existingSuperAdmins > 0) {
          return NextResponse.json({ 
            error: "Cannot bulk change role of super admin users" 
          }, { status: 403 });
        }

        // Prevent modifying the currently authenticated user's role
        if (userIds.includes(session.user.id)) {
          return NextResponse.json({ 
            error: "Cannot modify your own role" 
          }, { status: 403 });
        }

        const updateResult = await prisma.user.updateMany({
          where: { id: { in: userIds } },
          data: { role: data.role }
        });

        result = {
          success: true,
          updated: updateResult.count,
          message: `Successfully updated ${updateResult.count} user(s) to ${data.role}`
        };

        // Log the action
        await prisma.activityLog.create({
          data: {
            action: "bulk_update_user_roles",
            entityType: "USER",
            details: JSON.stringify({ 
              updatedCount: updateResult.count, 
              userIds,
              newRole: data.role 
            }),
            userId: session.user.id
          }
        });
        break;

      case "update_organization":
        if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
          return NextResponse.json({ error: "Missing or invalid userIds" }, { status: 400 });
        }

        const orgUpdateResult = await prisma.user.updateMany({
          where: { id: { in: userIds } },
          data: { organizationId: data?.organizationId || null }
        });

        result = {
          success: true,
          updated: orgUpdateResult.count,
          message: `Successfully updated organization for ${orgUpdateResult.count} user(s)`
        };

        // Log the action
        await prisma.activityLog.create({
          data: {
            action: "bulk_update_user_organization",
            entityType: "USER",
            details: JSON.stringify({ 
              updatedCount: orgUpdateResult.count, 
              userIds,
              organizationId: data?.organizationId 
            }),
            userId: session.user.id
          }
        });
        break;

      case "import":
        if (!data?.users || !Array.isArray(data.users) || data.users.length === 0) {
          return NextResponse.json({ error: "Missing or invalid users array" }, { status: 400 });
        }

        // Limit batch size to prevent performance issues
        if (data.users.length > 1000) {
          return NextResponse.json({ 
            error: "Cannot import more than 1000 users at once" 
          }, { status: 400 });
        }

        const importResults = {
          success: 0,
          failed: 0,
          errors: [] as any[]
        };

        for (const userData of data.users) {
          try {
            if (!userData.email || !userData.password || !userData.name) {
              importResults.failed++;
              importResults.errors.push({
                email: userData.email,
                error: "Missing required fields"
              });
              continue;
            }

            // Check if user exists
            const exists = await prisma.user.findUnique({
              where: { email: userData.email }
            });

            if (exists) {
              importResults.failed++;
              importResults.errors.push({
                email: userData.email,
                error: "User already exists"
              });
              continue;
            }

            const hashedPassword = await bcrypt.hash(userData.password, 12);

            await prisma.user.create({
              data: {
                email: userData.email,
                password: hashedPassword,
                name: userData.name,
                role: userData.role || "FIELD_WORKER",
                organizationId: userData.organizationId || null,
                phone: userData.phone || null
              }
            });

            importResults.success++;
          } catch (error: any) {
            importResults.failed++;
            importResults.errors.push({
              email: userData.email,
              error: error?.message || "Failed to create user",
              code: error?.code,
              field: error?.meta?.target
            });
          }
        }

        result = {
          success: true,
          imported: importResults.success,
          failed: importResults.failed,
          errors: importResults.errors,
          message: `Imported ${importResults.success} user(s), ${importResults.failed} failed`
        };

        // Log the action
        await prisma.activityLog.create({
          data: {
            action: "bulk_import_users",
            entityType: "USER",
            details: JSON.stringify({ 
              successCount: importResults.success,
              failedCount: importResults.failed 
            }),
            userId: session.user.id
          }
        });
        break;

      case "export":
        if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
          return NextResponse.json({ error: "Missing or invalid userIds" }, { status: 400 });
        }

        const exportUsers = await prisma.user.findMany({
          where: { id: { in: userIds } },
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            phone: true,
            organizationId: true,
            createdAt: true,
            lastLogin: true,
            organization: {
              select: { name: true, slug: true }
            }
          }
        });

        result = {
          success: true,
          users: exportUsers,
          count: exportUsers.length
        };
        break;

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error in bulk user operation:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
