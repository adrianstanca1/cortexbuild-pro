import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const template = await prisma.documentTemplate.findUnique({
      where: { id: params.id },
      include: { createdBy: { select: { id: true, name: true } } },
    });

    if (!template) {
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(template);
  } catch (error) {
    console.error("[document-templates/[id] GET]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const orgId = (session.user as { organizationId?: string })?.organizationId;

    const existing = await prisma.documentTemplate.findUnique({
      where: { id: params.id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 },
      );
    }

    // Only allow editing own org templates
    if (existing.isSystemTemplate) {
      return NextResponse.json(
        { error: "Cannot edit system templates" },
        { status: 403 },
      );
    }

    if (orgId && existing.organizationId && existing.organizationId !== orgId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const updated = await prisma.documentTemplate.update({
      where: { id: params.id },
      data: {
        ...(body.name !== undefined && { name: body.name.trim() }),
        ...(body.description !== undefined && {
          description: body.description?.trim() || null,
        }),
        ...(body.category !== undefined && { category: body.category }),
        ...(body.version !== undefined && { version: body.version.trim() }),
        ...(body.tags !== undefined && {
          tags: Array.isArray(body.tags) ? body.tags : [],
        }),
        ...(body.content !== undefined && { content: body.content }),
        ...(body.isActive !== undefined && { isActive: body.isActive }),
      },
      include: { createdBy: { select: { id: true, name: true } } },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("[document-templates/[id] PATCH]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const orgId = (session.user as { organizationId?: string })?.organizationId;

    const existing = await prisma.documentTemplate.findUnique({
      where: { id: params.id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 },
      );
    }

    if (existing.isSystemTemplate) {
      return NextResponse.json(
        { error: "Cannot delete system templates" },
        { status: 403 },
      );
    }

    if (orgId && existing.organizationId && existing.organizationId !== orgId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.documentTemplate.delete({ where: { id: params.id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[document-templates/[id] DELETE]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
