import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(
  _request: Request,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const orgId = (session.user as { organizationId?: string })?.organizationId;
    const userId = (session.user as { id?: string })?.id;

    const source = await prisma.documentTemplate.findUnique({
      where: { id: params.id },
    });

    if (!source) {
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 },
      );
    }

    const duplicated = await prisma.documentTemplate.create({
      data: {
        name: `${source.name} (Copy)`,
        description: source.description,
        category: source.category,
        version: "1.0",
        content: source.content as object,
        tags: source.tags,
        isSystemTemplate: false,
        isActive: true,
        ...(orgId ? { organizationId: orgId } : {}),
        ...(userId ? { createdById: userId } : {}),
      },
      include: {
        createdBy: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(duplicated, { status: 201 });
  } catch (error) {
    console.error("[document-templates/[id]/duplicate POST]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
