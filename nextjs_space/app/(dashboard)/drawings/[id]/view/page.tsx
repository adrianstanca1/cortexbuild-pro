import { getServerSession } from "next-auth";
import { redirect, notFound } from "next/navigation";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import { DrawingViewerClient } from "./_components/drawing-viewer-client";

export default async function DrawingViewerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect("/login");
  }

  const organizationId = session.user.organizationId;
  if (!organizationId) {
    redirect("/login");
  }

  const drawing = await prisma.drawing.findFirst({
    where: {
      id: id,
      project: { organizationId },
    },
    include: {
      project: {
        select: {
          id: true,
          name: true,
          organizationId: true,
        },
      },
      revisions: {
        orderBy: { createdAt: "desc" },
        include: {
          uploadedBy: {
            select: { id: true, name: true, email: true },
          },
        },
      },
    },
  });

  if (!drawing) {
    notFound();
  }

  // Fetch annotations for this drawing
  const annotations = await prisma.drawingAnnotation.findMany({
    where: { drawingId: id },
    include: {
      createdBy: {
        select: { id: true, name: true, email: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <DrawingViewerClient
      drawing={JSON.parse(JSON.stringify(drawing))}
      annotations={JSON.parse(JSON.stringify(annotations))}
      currentUser={{
        id: session.user.id,
        name: session.user.name || "",
        email: session.user.email || "",
      }}
    />
  );
}
