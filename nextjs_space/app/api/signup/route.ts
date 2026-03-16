export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";

function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .substring(0, 60);
}

export async function POST(request: Request) {
  try {
    const { name, companyName, email, password } = await request.json();

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Email already in use" },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    // Create a unique organisation for this signup
    const orgName = companyName?.trim() || `${name}'s Company`;
    const baseSlug = slugify(orgName);
    let slug = baseSlug;
    let attempt = 1;

    // Ensure slug is unique
    while (await prisma.organization.findFirst({ where: { slug } })) {
      slug = `${baseSlug}-${attempt++}`;
    }

    const org = await prisma.organization.create({
      data: {
        name: orgName,
        slug,
        entitlements: {
          modules: {
            projects: true, tasks: true, team: true, documents: true,
            safety: true, reports: true, rfis: true, submittals: true,
            changeOrders: true, dailyReports: true
          },
          limits: { maxUsers: 50, maxProjects: 100, storageGB: 10 }
        }
      }
    });

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: "COMPANY_OWNER",
        organizationId: org.id
      }
    });

    // Create team member record
    await prisma.teamMember.create({
      data: {
        userId: user.id,
        organizationId: org.id,
        jobTitle: "Owner"
      }
    });

    return NextResponse.json({
      message: "Account created successfully",
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    });
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { error: "Failed to create account" },
      { status: 500 }
    );
  }
}
