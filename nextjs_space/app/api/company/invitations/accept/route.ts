import { NextRequest, NextResponse } from "next/server";

// Force dynamic rendering
export const dynamic = 'force-dynamic';

import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";

// POST - Accept team invitation and create user account
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { token, password } = body;

    if (!token || !password) {
      return NextResponse.json({ error: "Token and password are required" }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
    }

    // Find invitation
    const invitation = await prisma.teamInvitation.findUnique({
      where: { token },
      include: {
        organization: true,
        invitedBy: { select: { name: true, email: true } }
      }
    });

    if (!invitation) {
      return NextResponse.json({ error: "Invalid invitation" }, { status: 404 });
    }

    if (invitation.status !== "PENDING") {
      return NextResponse.json({ error: "This invitation is no longer valid" }, { status: 410 });
    }

    if (invitation.expiresAt < new Date()) {
      await prisma.teamInvitation.update({
        where: { id: invitation.id },
        data: { status: "EXPIRED" }
      });
      return NextResponse.json({ error: "Invitation has expired" }, { status: 410 });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: invitation.email }
    });

    if (existingUser) {
      // If user exists but in different org, we can't add them
      if (existingUser.organizationId !== invitation.organizationId) {
        return NextResponse.json({ 
          error: "An account with this email already exists. Please contact support." 
        }, { status: 409 });
      }
      return NextResponse.json({ 
        error: "An account with this email already exists. Please login instead." 
      }, { status: 409 });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user and team member in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create the user
      const newUser = await tx.user.create({
        data: {
          email: invitation.email.toLowerCase(),
          name: invitation.name,
          password: hashedPassword,
          role: invitation.role,
          organizationId: invitation.organizationId,
        }
      });

      // Create team member record
      await tx.teamMember.create({
        data: {
          userId: newUser.id,
          organizationId: invitation.organizationId,
          jobTitle: invitation.jobTitle,
          department: invitation.department,
        }
      });

      // Update invitation status
      await tx.teamInvitation.update({
        where: { id: invitation.id },
        data: {
          status: "ACCEPTED",
          acceptedAt: new Date(),
        }
      });

      // Log activity
      await tx.activityLog.create({
        data: {
          action: "Joined the team",
          entityType: "User",
          entityId: newUser.id,
          entityName: newUser.name,
          details: `${invitation.email} accepted invitation as ${invitation.role}`,
          userId: newUser.id,
        }
      });

      return newUser;
    });

    // Send welcome email
    try {
      const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
      
      await fetch("https://apps.abacus.ai/api/sendEmail", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.ABACUSAI_API_KEY}`
        },
        body: JSON.stringify({
          toEmails: [invitation.email],
          subject: `Welcome to ${invitation.organization.name}!`,
          body: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: linear-gradient(135deg, #059669, #047857); padding: 30px; text-align: center;">
                <h1 style="color: white; margin: 0;">Welcome Aboard!</h1>
              </div>
              <div style="padding: 30px; background: #f9fafb;">
                <p style="font-size: 16px;">Hello <strong>${invitation.name}</strong>,</p>
                <p style="font-size: 16px;">
                  Your account has been created successfully! You are now a member of 
                  <strong>${invitation.organization.name}</strong>.
                </p>
                <div style="background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 8px; padding: 20px; margin: 20px 0;">
                  <p style="margin: 0; font-size: 14px;"><strong>Your Details:</strong></p>
                  <p style="margin: 5px 0 0; font-size: 14px;">Email: ${invitation.email}</p>
                  <p style="margin: 5px 0 0; font-size: 14px;">Role: ${invitation.role.replace("_", " ")}</p>
                  ${invitation.jobTitle ? `<p style="margin: 5px 0 0; font-size: 14px;">Title: ${invitation.jobTitle}</p>` : ""}
                </div>
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${baseUrl}/login" 
                     style="background: #059669; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
                    Login to Your Account
                  </a>
                </div>
              </div>
            </div>
          `
        })
      });

      // Notify the inviter
      await fetch("https://apps.abacus.ai/api/sendEmail", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.ABACUSAI_API_KEY}`
        },
        body: JSON.stringify({
          toEmails: [invitation.invitedBy.email],
          subject: `${invitation.name} has joined ${invitation.organization.name}`,
          body: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: linear-gradient(135deg, #059669, #047857); padding: 30px; text-align: center;">
                <h1 style="color: white; margin: 0;">New Team Member</h1>
              </div>
              <div style="padding: 30px; background: #f9fafb;">
                <p style="font-size: 16px;">Hello <strong>${invitation.invitedBy.name}</strong>,</p>
                <p style="font-size: 16px;">
                  <strong>${invitation.name}</strong> (${invitation.email}) has accepted your invitation 
                  and joined <strong>${invitation.organization.name}</strong> as a <strong>${invitation.role.replace("_", " ")}</strong>.
                </p>
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${baseUrl}/company/team" 
                     style="background: #059669; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
                    View Team
                  </a>
                </div>
              </div>
            </div>
          `
        })
      });
    } catch (emailError) {
      console.error("Email sending error:", emailError);
    }

    return NextResponse.json({
      success: true,
      message: "Account created successfully",
      user: {
        id: result.id,
        email: result.email,
        name: result.name,
        role: result.role,
      }
    }, { status: 201 });
  } catch (error) {
    console.error("Error accepting invitation:", error);
    return NextResponse.json({ error: "Failed to accept invitation" }, { status: 500 });
  }
}
