import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generateSlug } from "@/lib/entitlements";
import bcrypt from "bcryptjs";

// Force dynamic rendering
export const dynamic = "force-dynamic";

// POST /api/invitations/accept - Accept invitation and create company/owner
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, password, confirmPassword } = body;

    // Validate input
    if (!token || !password) {
      return NextResponse.json(
        { error: "Token and password are required" },
        { status: 400 },
      );
    }

    if (password !== confirmPassword) {
      return NextResponse.json(
        { error: "Passwords do not match" },
        { status: 400 },
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 },
      );
    }

    // Find and validate invitation
    const invitation = await prisma.companyInvitation.findUnique({
      where: { token },
    });

    if (!invitation) {
      return NextResponse.json(
        { error: "Invalid invitation token" },
        { status: 404 },
      );
    }

    if (invitation.status === "ACCEPTED") {
      return NextResponse.json(
        { error: "This invitation has already been accepted" },
        { status: 400 },
      );
    }

    if (invitation.status === "REVOKED") {
      return NextResponse.json(
        { error: "This invitation has been revoked" },
        { status: 400 },
      );
    }

    if (new Date() > invitation.expiresAt) {
      await prisma.companyInvitation.update({
        where: { id: invitation.id },
        data: { status: "EXPIRED" },
      });
      return NextResponse.json(
        { error: "This invitation has expired" },
        { status: 400 },
      );
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: invitation.ownerEmail },
    });
    if (existingUser) {
      return NextResponse.json(
        { error: "A user with this email already exists" },
        { status: 400 },
      );
    }

    // Generate unique slug for organization
    let slug = generateSlug(invitation.companyName);
    let slugSuffix = 0;
    while (await prisma.organization.findUnique({ where: { slug } })) {
      slugSuffix++;
      slug = `${generateSlug(invitation.companyName)}-${slugSuffix}`;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create organization and user in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create organization
      const organization = await tx.organization.create({
        data: {
          name: invitation.companyName,
          slug,
          entitlements: invitation.entitlements ?? {},
          isActive: true,
        },
      });

      // Create owner user
      const user = await tx.user.create({
        data: {
          email: invitation.ownerEmail,
          password: hashedPassword,
          name: invitation.ownerName,
          phone: invitation.ownerPhone,
          role: "COMPANY_OWNER",
          organizationId: organization.id,
        },
      });

      // Create team member record
      await tx.teamMember.create({
        data: {
          userId: user.id,
          organizationId: organization.id,
          jobTitle: "Company Owner",
          department: "Management",
        },
      });

      // Update invitation
      const updatedInvitation = await tx.companyInvitation.update({
        where: { id: invitation.id },
        data: {
          status: "ACCEPTED",
          acceptedAt: new Date(),
          organizationId: organization.id,
        },
      });

      // Log activity
      await tx.activityLog.create({
        data: {
          action: "Company Onboarded",
          entityType: "Organization",
          entityId: organization.id,
          entityName: organization.name,
          details: `${user.name} accepted invitation and created ${organization.name}`,
          userId: user.id,
        },
      });

      return { organization, user, invitation: updatedInvitation };
    });

    // Send welcome email
    try {
      const appUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
      const loginUrl = `${appUrl}/login`;

      const htmlBody = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #7c3aed; margin: 0;">CortexBuild Pro</h1>
            <p style="color: #6b7280; margin: 5px 0;">Construction Management Platform</p>
          </div>
          
          <h2 style="color: #1f2937; border-bottom: 2px solid #22c55e; padding-bottom: 10px;">
            🎉 Welcome to CortexBuild Pro!
          </h2>
          
          <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
            Congratulations, ${result.user.name}! Your company <strong>${result.organization.name}</strong> has been successfully created.
          </p>
          
          <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #22c55e;">
            <h3 style="color: #166534; margin-top: 0;">Your Account Details</h3>
            <p style="margin: 8px 0;"><strong>Email:</strong> ${result.user.email}</p>
            <p style="margin: 8px 0;"><strong>Company:</strong> ${result.organization.name}</p>
            <p style="margin: 8px 0;"><strong>Role:</strong> Company Owner</p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${loginUrl}" style="background: #7c3aed; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
              Login to Your Dashboard
            </a>
          </div>
          
          <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 25px 0;">
            <h3 style="color: #374151; margin-top: 0;">Getting Started</h3>
            <ol style="color: #4b5563; padding-left: 20px;">
              <li style="margin: 8px 0;">Login with your email and password</li>
              <li style="margin: 8px 0;">Create your first project</li>
              <li style="margin: 8px 0;">Invite team members</li>
              <li style="margin: 8px 0;">Start managing your construction workflow</li>
            </ol>
          </div>
          
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;" />
          
          <p style="color: #9ca3af; font-size: 12px; text-align: center;">
            Thank you for choosing CortexBuild Pro!
          </p>
        </div>
      `;

      await fetch("https://apps.abacus.ai/api/sendNotificationEmail", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deployment_token: process.env.ABACUSAI_API_KEY,
          subject: `Welcome to CortexBuild Pro - ${result.organization.name}`,
          body: htmlBody,
          is_html: true,
          recipient_email: result.user.email,
          sender_alias: "CortexBuild Pro",
        }),
      });
    } catch (emailError) {
      console.error("Failed to send welcome email:", emailError);
    }

    // Notify super admin
    try {
      const htmlBody = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #7c3aed;">New Company Onboarded</h2>
          <p><strong>Company:</strong> ${result.organization.name}</p>
          <p><strong>Owner:</strong> ${result.user.name} (${result.user.email})</p>
          <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
        </div>
      `;

      await fetch("https://apps.abacus.ai/api/sendNotificationEmail", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deployment_token: process.env.ABACUSAI_API_KEY,
          subject: `[Admin] New Company: ${result.organization.name}`,
          body: htmlBody,
          is_html: true,
          recipient_email: "adrian.stanca1@gmail.com",
          sender_alias: "CortexBuild Pro Admin",
        }),
      });
    } catch (e) {
      console.error("Failed to notify admin:", e);
    }

    return NextResponse.json({
      success: true,
      message: "Account created successfully",
      organization: {
        id: result.organization.id,
        name: result.organization.name,
        slug: result.organization.slug,
      },
    });
  } catch (error) {
    console.error("Error accepting invitation:", error);
    return NextResponse.json(
      { error: "Failed to accept invitation" },
      { status: 500 },
    );
  }
}
