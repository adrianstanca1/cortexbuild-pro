export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import {
  serviceRegistry,
  getAllServiceInstances,
  PLATFORM_SERVICES,
} from "@/lib/service-registry";

// GET - Get dependency map for all services
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const moduleId = searchParams.get("moduleId");
    const serviceId = searchParams.get("serviceId");

    // Get all service instances with status
    const instances = await getAllServiceInstances();

    // Build dependency map
    const dependencyMap: Record<
      string,
      {
        moduleId: string;
        moduleName: string;
        services: Array<{
          serviceId: string;
          serviceName: string;
          status: string;
          isRequired: boolean;
          usageDescription: string;
        }>;
      }
    > = {};

    // Collect all unique modules
    const modules = new Set<string>();
    PLATFORM_SERVICES.forEach((service) => {
      service.dependencies.forEach((dep) => {
        if (dep.moduleId !== "all") {
          modules.add(dep.moduleId);
        }
      });
    });

    // Build the map
    modules.forEach((modId) => {
      const relatedServices = instances.filter((inst) =>
        inst.definition.dependencies.some(
          (dep) => dep.moduleId === modId || dep.moduleId === "all",
        ),
      );

      if (relatedServices.length > 0) {
        const firstDep = relatedServices[0].definition.dependencies.find(
          (dep) => dep.moduleId === modId || dep.moduleId === "all",
        );

        dependencyMap[modId] = {
          moduleId: modId,
          moduleName: firstDep?.moduleName || modId,
          services: relatedServices.map((inst) => {
            const dep = inst.definition.dependencies.find(
              (d) => d.moduleId === modId || d.moduleId === "all",
            );
            return {
              serviceId: inst.definition.id,
              serviceName: inst.definition.name,
              status: inst.status,
              isRequired: dep?.isRequired || false,
              usageDescription: dep?.usageDescription || "",
            };
          }),
        };
      }
    });

    // Filter by module if specified
    if (moduleId && dependencyMap[moduleId]) {
      return NextResponse.json({
        module: dependencyMap[moduleId],
      });
    }

    // Filter by service if specified
    if (serviceId) {
      const service = serviceRegistry.getService(serviceId);
      if (!service) {
        return NextResponse.json(
          { error: `Service '${serviceId}' not found` },
          { status: 404 },
        );
      }

      const instance = instances.find((i) => i.definition.id === serviceId);

      return NextResponse.json({
        service: {
          ...service,
          status: instance?.status || "NOT_CONFIGURED",
          dependentModules: service.dependencies.map((dep) => ({
            ...dep,
            moduleStatus: dependencyMap[dep.moduleId]?.services.some(
              (s) => s.status === "ACTIVE",
            )
              ? "operational"
              : "degraded",
          })),
        },
      });
    }

    // Return full dependency map
    return NextResponse.json({
      dependencyMap: Object.values(dependencyMap),
      summary: {
        totalModules: Object.keys(dependencyMap).length,
        fullyOperational: Object.values(dependencyMap).filter((m) =>
          m.services
            .filter((s) => s.isRequired)
            .every((s) => s.status === "ACTIVE"),
        ).length,
        degraded: Object.values(dependencyMap).filter((m) =>
          m.services
            .filter((s) => s.isRequired)
            .some((s) => s.status !== "ACTIVE"),
        ).length,
      },
    });
  } catch (error) {
    console.error("Error fetching dependencies:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
