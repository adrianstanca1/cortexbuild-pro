import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import { broadcastToOrganization } from "@/lib/realtime-clients";

// Force dynamic rendering
export const dynamic = 'force-dynamic';



export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const trade = searchParams.get("trade");

    const where: any = {
      organizationId: session.user.organizationId
    };
    
    if (trade && trade !== "all") where.trade = trade;

    const subcontractors = await prisma.subcontractor.findMany({
      where,
      include: {
        contracts: {
          include: {
            project: { select: { id: true, name: true } }
          }
        },
        _count: {
          select: { contracts: true, costItems: true }
        }
      },
      orderBy: { companyName: "asc" }
    });

    // Calculate summary stats
    const totalContractValue = subcontractors.reduce((acc, sub) => {
      return acc + sub.contracts.reduce((sum, c) => sum + c.contractAmount, 0);
    }, 0);

    const activeContracts = subcontractors.reduce((acc, sub) => {
      return acc + sub.contracts.filter(c => c.status === "ACTIVE").length;
    }, 0);

    return NextResponse.json({
      subcontractors,
      summary: {
        total: subcontractors.length,
        totalContractValue,
        activeContracts
      }
    });
  } catch (error) {
    console.error("Error fetching subcontractors:", error);
    return NextResponse.json({ error: "Failed to fetch subcontractors" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      companyName, contactName, email, phone, address, trade,
      licenseNumber, insuranceExpiry, rating, notes
    } = body;

    if (!companyName || !contactName || !email) {
      return NextResponse.json({ error: "Company name, contact name, and email are required" }, { status: 400 });
    }

    const subcontractor = await prisma.subcontractor.create({
      data: {
        organizationId: session.user.organizationId ?? "",
        companyName,
        contactName,
        email,
        phone,
        address,
        trade: trade || "GENERAL",
        licenseNumber,
        insuranceExpiry: insuranceExpiry ? new Date(insuranceExpiry) : null,
        rating: rating ? parseInt(rating) : null,
        notes
      },
      include: {
        contracts: true,
        _count: {
          select: { contracts: true, costItems: true }
        }
      }
    });

    await prisma.activityLog.create({
      data: {
        action: "subcontractor_created",
        entityType: "Subcontractor",
        entityId: subcontractor.id,
        entityName: subcontractor.companyName,
        details: `Added subcontractor: ${subcontractor.companyName} (${subcontractor.trade})`,
        userId: session.user.id
      }
    });

    broadcastToOrganization(session.user.organizationId ?? "", {
      type: "subcontractor_created",
      data: { subcontractor }
    });

    return NextResponse.json(subcontractor);
  } catch (error) {
    console.error("Error creating subcontractor:", error);
    return NextResponse.json({ error: "Failed to create subcontractor" }, { status: 500 });
  }
}
