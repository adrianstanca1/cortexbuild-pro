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

        // Batch validation - check all emails at once
        const emailsToCheck = data.users
          .filter((u: any) => u.email)
          .map((u: any) => u.email);

        const existingUsers = await prisma.user.findMany({
          where: { email: { in: emailsToCheck } },
          select: { email: true }
        });

        const existingEmails = new Set(existingUsers.map(u => u.email));

        // Prepare validated users for batch creation
        const validatedUsers: any[] = [];

        for (const userData of data.users) {
          if (!userData.email || !userData.password || !userData.name) {
            importResults.failed++;
            importResults.errors.push({
              email: userData.email,
              error: "Missing required fields"
            });
            continue;
          }

          // Validate password strength (minimum 8 characters)
          if (userData.password.length < 8) {
            importResults.failed++;
            importResults.errors.push({
              email: userData.email,
              error: "Password must be at least 8 characters long"
            });
            continue;
          }

          // Check if user exists (from batch query)
          if (existingEmails.has(userData.email)) {
            importResults.failed++;
            importResults.errors.push({
              email: userData.email,
              error: "User already exists"
            });
            continue;
          }

          validatedUsers.push(userData);
        }

        // Hash passwords in parallel
        const usersWithHashedPasswords = await Promise.all(
          validatedUsers.map(async (userData) => {
            try {
              const hashedPassword = await bcrypt.hash(userData.password, 12);
              return {
                email: userData.email,
                password: hashedPassword,
                name: userData.name,
                role: userData.role || "FIELD_WORKER",
                organizationId: userData.organizationId || null,
                phone: userData.phone || null
              };
            } catch (error) {
              importResults.failed++;
              importResults.errors.push({
                email: userData.email,
                error: "Failed to hash password"
              });
              return null;
            }
          })
        );

        // Filter out failed password hashes with type predicate
        const usersToCreate = usersWithHashedPasswords.filter((u): u is NonNullable<typeof u> => u !== null);

        // Batch create all users at once
        if (usersToCreate.length > 0) {
          try {
            const expectedCreates = usersToCreate.length;
            const createResult = await prisma.user.createMany({
              data: usersToCreate,
              skipDuplicates: true
            });
            const actualCreates = createResult.count;
            importResults.success = actualCreates;
            
            // When skipDuplicates: true, Prisma silently skips duplicates
            // Track skipped duplicates in the failed count
            const skippedDueToDuplicates = expectedCreates - actualCreates;
            if (skippedDueToDuplicates > 0) {
              importResults.failed += skippedDueToDuplicates;
              importResults.errors.push({
                email: null,
                error: `${skippedDueToDuplicates} user(s) were skipped because they already exist (duplicate unique fields)`,
                code: "DUPLICATE_SKIPPED",
                field: undefined
              });
            }
          } catch (error: any) {
            // If the entire batch fails, use chunked batch creates to retain performance
            const CHUNK_SIZE = 100;
            
            for (let i = 0; i < usersToCreate.length; i += CHUNK_SIZE) {
              const chunk = usersToCreate.slice(i, i + CHUNK_SIZE);
              
              try {
                const chunkResult = await prisma.user.createMany({
                  data: chunk,
                  skipDuplicates: true
                });
                importResults.success += chunkResult.count;
                
                // Track skipped duplicates in chunk
                const skippedInChunk = chunk.length - chunkResult.count;
                if (skippedInChunk > 0) {
                  importResults.failed += skippedInChunk;
                }
              } catch (chunkError: any) {
                // If a chunk fails, fall back to individual creates only for that chunk
                for (const userData of chunk) {
                  try {
                    await prisma.user.create({ data: userData });
                    importResults.success++;
                  } catch (err: any) {
                    importResults.failed++;
                    importResults.errors.push({
                      email: userData.email,
                      error: err?.message || "Failed to create user",
                      code: err?.code,
                      field: err?.meta?.target
                    });
                  }
                }
              }
            }
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
