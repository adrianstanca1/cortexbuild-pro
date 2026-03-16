import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import { format } from "date-fns";

// Force dynamic rendering
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = session.user as { id: string; organizationId?: string };
    if (!user.organizationId) {
      return NextResponse.json({ error: "No organization" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const formatType = searchParams.get("format") || "csv";
    const projectId = searchParams.get("projectId");
    const status = searchParams.get("status");
    const limit = parseInt(searchParams.get("limit") || "1000");

    // Build where clause
    const where: Record<string, unknown> = {
      project: { organizationId: user.organizationId }
    };

    if (projectId) {
      where.projectId = projectId;
    }

    if (status) {
      where.status = status;
    }

    const variations = await prisma.variation.findMany({
      where,
      include: {
        project: { select: { name: true } },
        createdBy: { select: { name: true } },
        approvedBy: { select: { name: true } }
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return generateVariationsCSV(variations);
  } catch (error) {
    console.error("Variations export error:", error);
    return NextResponse.json({ error: "Failed to export variations" }, { status: 500 });
  }
}

function generateVariationsCSV(variations: any[]) {
  const headers = [
    "VAR #",
    "Title",
    "Project",
    "Status",
    "Cost Change",
    "Schedule Change",
    "Original Budget",
    "Revised Budget",
    "Reason",
    "Requested By",
    "Approved By",
    "Created Date"
  ];

  const rows = variations.map(v => {
    const varNumber = `VAR-${String(v.number || v.id.slice(-4)).padStart(3, "0")}`;
    return [
      varNumber,
      v.title || "",
      v.project.name,
      v.status,
      v.costChange || 0,
      v.scheduleChange !== null && v.scheduleChange !== undefined ? v.scheduleChange : "",
      v.originalBudget || "",
      v.revisedBudget || "",
      v.reason || "",
      v.createdBy?.name || "",
      v.approvedBy?.name || "",
      format(v.createdAt, "yyyy-MM-dd")
    ];
  });

  const csvContent = generateCSV(headers, rows);
  const timestamp = format(new Date(), "yyyy-MM-dd");

  return new NextResponse(csvContent, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="variations-report-${timestamp}.csv"`
    }
  });
}

function generateCSV(headers: string[], rows: any[][]): string {
  const escape = (val: any) => {
    if (val === null || val === undefined) return "";
    const str = String(val);
    if (str.includes(",") || str.includes('"') || str.includes("\n")) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const headerRow = headers.map(escape).join(",");
  const dataRows = rows.map(row => row.map(escape).join(","));
  return [headerRow, ...dataRows].join("\n");
}
