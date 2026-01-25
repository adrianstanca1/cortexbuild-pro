import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import { ComplianceClient } from "./_components/compliance-client";

/**
 * Render the server-side Compliance page for the authenticated user's organization.
 *
 * Redirects to `/login` when there is no authenticated user or no organization ID on the session.
 * Fetches site access logs, worker certifications, lifting operations, projects, and team members for the organization
 * and supplies them as initial data to the client component.
 *
 * @returns A React element for the compliance page with the ComplianceClient initialized with server-fetched data.
 */
export default async function CompliancePage() {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
        redirect("/login");
    }

    const organizationId = session.user.organizationId;
    if (!organizationId) {
        redirect("/login");
    }

    // Fetch data for all three compliance pillars
    const [
        siteAccessLogs,
        workerCerts,
        liftingOps,
        projects,
        teamMembers
    ] = await Promise.all([
        prisma.siteAccessLog.findMany({
            where: { project: { organizationId } },
            include: {
                project: { select: { id: true, name: true } },
                recordedBy: { select: { id: true, name: true } }
            },
            orderBy: { accessTime: "desc" },
            take: 100
        }),
        prisma.workerCertification.findMany({
            where: { organizationId },
            include: {
                worker: { select: { id: true, name: true, email: true } },
                verifiedBy: { select: { id: true, name: true } }
            },
            orderBy: { expiryDate: "asc" }
        }),
        prisma.liftingOperation.findMany({
            where: { project: { organizationId } },
            include: {
                project: { select: { id: true, name: true } },
                supervisor: { select: { id: true, name: true } }
            },
            orderBy: { liftDate: "desc" }
        }),
        prisma.project.findMany({
            where: { organizationId },
            select: { id: true, name: true },
            orderBy: { name: "asc" }
        }),
        prisma.teamMember.findMany({
            where: { organizationId },
            include: {
                user: { select: { id: true, name: true, email: true, avatarUrl: true } }
            }
        })
    ]);

    return (
        <div className="p-6">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Site Registry & Compliance</h1>
                <p className="text-muted-foreground">Manage site access, worker qualifications, and high-risk permits</p>
            </div>
            <ComplianceClient
                initialAccessLogs={JSON.parse(JSON.stringify(siteAccessLogs))}
                initialCerts={JSON.parse(JSON.stringify(workerCerts))}
                initialLifts={JSON.parse(JSON.stringify(liftingOps))}
                projects={JSON.parse(JSON.stringify(projects))}
                teamMembers={JSON.parse(JSON.stringify(teamMembers))}
            />
        </div>
    );
}