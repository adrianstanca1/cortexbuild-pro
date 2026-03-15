export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { ollamaClient } from "@/lib/ollamaClient";

export async function GET() {
  const ollamaAvailable = await ollamaClient.isAvailable().catch(() => false);
  let ollamaModels: string[] = [];
  if (ollamaAvailable) {
    ollamaModels = await ollamaClient.getAvailableModels().catch(() => []);
  }

  return NextResponse.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || "1.0.0",
    services: {
      api: "healthy",
      ai: {
        provider: "ollama",
        url: process.env.OLLAMA_URL || "http://host.docker.internal:11434",
        model: process.env.OLLAMA_MODEL || "qwen2.5:7b",
        available: ollamaAvailable,
        models: ollamaModels,
      },
    },
    env: process.env.NODE_ENV,
  });
}
