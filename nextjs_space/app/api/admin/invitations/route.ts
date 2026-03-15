export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import { DEFAULT_ENTITLEMENTS } from "@/lib/entitlements";
import { sendEmail, generateCompanyInvitationEmail } from "@/lib/email-service";
import crypto from "crypto";

// GET /api/admin/invitations - List all invitations (SUPER_ADMIN only)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const search = searchParams.get("search");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");

    const where: Record<string, unknown> = {};
    if (status && status !== "all") {
      where.status = status;
    }
    if (search) {
      where.OR = [
        { companyName: { contains: search, mode: "insensitive" } },
        { ownerEmail: { contains: search, mode: "insensitive" } },
        { ownerName: { contains: search, mode: "insensitive" } },
      ];
    }

    const [invitations, total] = await Promise.all([
      prisma.companyInvitation.findMany({
        where,
        include: {
          invitedBy: { select: { id: true, name: true, email: true } },
          organization: { select: { id: true, name: true, slug: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.companyInvitation.count({ where }),
    ]);

    return NextResponse.json({
      invitations,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching invitations:", error);
    return NextResponse.json(
      { error: "Failed to fetch invitations" },
      { status: 500 },
    );
  }
}

// POST /api/admin/invitations - Create new invitation (SUPER_ADMIN only)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      companyName,
      ownerName,
      ownerEmail,
      ownerPhone,
      entitlements,
      expiryDays = 7,
    } = body;

    // Validate required fields
    if (!companyName || !ownerName || !ownerEmail) {
      return NextResponse.json(
        { error: "Company name, owner name, and owner email are required" },
        { status: 400 },
      );
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: ownerEmail },
    });
    if (existingUser) {
      return NextResponse.json(
        { error: "A user with this email already exists" },
        { status: 400 },
      );
    }

    // Check for pending invitation to same email
    const existingInvitation = await prisma.companyInvitation.findFirst({
      where: {
        ownerEmail,
        status: "PENDING",
        expiresAt: { gt: new Date() },
      },
    });
    if (existingInvitation) {
      return NextResponse.json(
        { error: "An active invitation already exists for this email" },
        { status: 400 },
      );
    }

    // Generate secure token
    const token = crypto.randomBytes(32).toString("hex");

    // Calculate expiry date
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiryDays);

    // Create invitation
    const invitation = await prisma.companyInvitation.create({
      data: {
        token,
        companyName,
        ownerName,
        ownerEmail,
        ownerPhone,
        entitlements: entitlements || DEFAULT_ENTITLEMENTS,
        expiresAt,
        invitedById: session.user.id,
      },
      include: {
        invitedBy: { select: { id: true, name: true, email: true } },
      },
    });

    // Send invitation email using dynamic email service
    try {
      const appUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
      const acceptUrl = `${appUrl}/invitation/accept/${token}`;
      const parsedEntitlements = entitlements || DEFAULT_ENTITLEMENTS;

      const enabledModules = Object.entries(parsedEntitlements.modules || {})
        .filter(([_, enabled]) => enabled)
        .map(([key]) => {
          const labels: Record<string, string> = {
            projects: "Projects",
            tasks: "Tasks",
            documents: "Documents",
            rfis: "RFIs",
            submittals: "Submittals",
            changeOrders: "Change Orders",
            dailyReports: "Daily Reports",
            safety: "Safety Management",
            reports: "Reports & Analytics",
            team: "Team Management",
          };
          return labels[key] || key;
        });

      // Use the unified email service (tries SendGrid first, then falls back to Abacus)
      const emailHtml = generateCompanyInvitationEmail({
        ownerName,
        companyName,
        ownerEmail,
        acceptUrl,
        expiresAt,
        enabledModules,
        storageGB: parsedEntitlements.limits?.storageGB || 10,
        maxUsers: parsedEntitlements.limits?.maxUsers || 50,
      });

      const emailResult = await sendEmail({
        to: ownerEmail,
        subject: `You're invited to join ${companyName} on CortexBuild Pro`,
        html: emailHtml,
        from: { name: "CortexBuild Pro" },
      });

      if (!emailResult.success) {
        console.warn(
          "Email sending warning:",
          emailResult.error,
          "(provider:",
          emailResult.provider,
          ")",
        );
      } else {
        console.log("Invitation email sent via:", emailResult.provider);
      }
    } catch (emailError) {
      console.error("Failed to send invitation email:", emailError);
      // Don't fail the whole request if email fails
    }

    // Log activity
    await prisma.activityLog.create({
      data: {
        action: "Invitation Created",
        entityType: "CompanyInvitation",
        entityId: invitation.id,
        entityName: companyName,
        details: `Invited ${ownerEmail} as owner of ${companyName}`,
        userId: session.user.id,
      },
    });

    return NextResponse.json({
      invitation,
      message: "Invitation created and email sent",
    });
  } catch (error) {
    console.error("Error creating invitation:", error);
    return NextResponse.json(
      { error: "Failed to create invitation" },
      { status: 500 },
    );
  }
}
