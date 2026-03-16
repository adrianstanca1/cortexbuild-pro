import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const orgId = (session.user as { organizationId?: string })?.organizationId;

    const templates = await prisma.documentTemplate.findMany({
      where: {
        isActive: true,
        OR: [
          { isSystemTemplate: true },
          ...(orgId ? [{ organizationId: orgId }] : []),
        ],
      },
      include: {
        createdBy: { select: { id: true, name: true } },
      },
      orderBy: [
        { isSystemTemplate: "desc" },
        { usageCount: "desc" },
        { createdAt: "desc" },
      ],
    });

    return NextResponse.json(templates);
  } catch (error) {
    console.error("[document-templates GET]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const orgId = (session.user as { organizationId?: string })?.organizationId;
    const userId = (session.user as { id?: string })?.id;

    const body = await request.json();
    const { name, description, category, version, tags, content } = body;

    if (!name?.trim()) {
      return NextResponse.json(
        { error: "Template name is required" },
        { status: 400 },
      );
    }

    const template = await prisma.documentTemplate.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        category: category || "OTHER",
        version: version?.trim() || "1.0",
        tags: Array.isArray(tags) ? tags : [],
        content: content ?? { sections: [], fields: [] },
        isSystemTemplate: false,
        isActive: true,
        ...(orgId ? { organizationId: orgId } : {}),
        ...(userId ? { createdById: userId } : {}),
      },
      include: {
        createdBy: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(template, { status: 201 });
  } catch (error) {
    console.error("[document-templates POST]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
