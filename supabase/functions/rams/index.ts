/**
 * RAMS Generator Edge Function
 *
 * Generates Risk Assessment Method Statement (RAMS) documents using AI
 * based on project details and tasks provided.
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ProjectData {
  name: string;
  location: string;
  description: string;
  date: string;
  tasks: string[];
}

async function generateRamsHTML(project: ProjectData): Promise<string> {
  // Generate RAMS content using AI or template-based approach
  const tasksList = project.tasks.map((task, index) => `
    <div class="task-section">
      <h3>${index + 1}. ${task}</h3>
      <div class="task-content">
        <h4>Hazards</h4>
        <ul>
          <li>Identify potential hazards for ${task}</li>
          <li>Assess risk level</li>
        </ul>
        <h4>Control Measures</h4>
        <ul>
          <li>Implement safety controls</li>
          <li>Use appropriate PPE</li>
        </ul>
        <h4>Method Statement</h4>
        <p>Step-by-step procedure for ${task}</p>
      </div>
    </div>
  `).join("");

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>RAMS - ${project.name}</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 20px; }
        h1 { color: #2c3e50; border-bottom: 3px solid #3498db; padding-bottom: 10px; }
        h2 { color: #34495e; margin-top: 30px; }
        h3 { color: #2980b9; margin-top: 25px; }
        h4 { color: #16a085; margin-top: 20px; }
        .header-section { background: #ecf0f1; padding: 20px; border-radius: 8px; margin-bottom: 30px; }
        .task-section { background: #fff; border: 1px solid #ddd; border-radius: 8px; padding: 20px; margin: 20px 0; }
        .task-content { margin-top: 15px; }
        ul { margin: 10px 0; padding-left: 20px; }
        li { margin: 5px 0; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
        th { background: #3498db; color: white; }
        .risk-matrix { background: #f9f9f9; }
        .footer { margin-top: 40px; padding-top: 20px; border-top: 2px solid #3498db; font-size: 12px; color: #666; }
        @media print { body { padding: 0; } .task-section { break-inside: avoid; } }
      </style>
    </head>
    <body>
      <div class="header-section">
        <h1>Risk Assessment Method Statement (RAMS)</h1>
        <table>
          <tr><th>Project Name</th><td>${project.name}</td></tr>
          <tr><th>Location</th><td>${project.location || "TBD"}</td></tr>
          <tr><th>Description</th><td>${project.description || "N/A"}</td></tr>
          <tr><th>Date</th><td>${project.date}</td></tr>
        </table>
      </div>

      <h2>1. Introduction</h2>
      <p>This Risk Assessment Method Statement (RAMS) document outlines the hazards, control measures, and safe working procedures for ${project.name}.</p>

      <h2>2. Scope of Works</h2>
      <p>The following tasks are covered in this assessment:</p>
      <ul>
        ${project.tasks.map(t => `<li>${t}</li>`).join("")}
      </ul>

      <h2>3. Risk Matrix</h2>
      <table class="risk-matrix">
        <tr>
          <th>Likelihood</th>
          <th>1 (Rare)</th>
          <th>2 (Unlikely)</th>
          <th>3 (Possible)</th>
          <th>4 (Likely)</th>
          <th>5 (Almost Certain)</th>
        </tr>
        <tr>
          <th>5 (Catastrophic)</th>
          <td style="background:#f1c40f">5</td>
          <td style="background:#e67e22">10</td>
          <td style="background:#e74c3c">15</td>
          <td style="background:#c0392b">20</td>
          <td style="background:#c0392b">25</td>
        </tr>
        <tr>
          <th>4 (Major)</th>
          <td style="background:#f1c40f">4</td>
          <td style="background:#f1c40f">8</td>
          <td style="background:#e67e22">12</td>
          <td style="background:#e74c3c">16</td>
          <td style="background:#c0392b">20</td>
        </tr>
        <tr>
          <th>3 (Moderate)</th>
          <td style="background:#27ae60">3</td>
          <td style="background:#f1c40f">6</td>
          <td style="background:#f1c40f">9</td>
          <td style="background:#e67e22">12</td>
          <td style="background:#e74c3c">15</td>
        </tr>
        <tr>
          <th>2 (Minor)</th>
          <td style="background:#27ae60">2</td>
          <td style="background:#27ae60">4</td>
          <td style="background:#f1c40f">6</td>
          <td style="background:#f1c40f">8</td>
          <td style="background:#e67e22">10</td>
        </tr>
        <tr>
          <th>1 (Insignificant)</th>
          <td style="background:#27ae60">1</td>
          <td style="background:#27ae60">2</td>
          <td style="background:#27ae60">3</td>
          <td style="background:#27ae60">4</td>
          <td style="background:#f1c40f">5</td>
        </tr>
      </table>

      <h2>4. Task-Specific Assessments</h2>
      ${tasksList}

      <h2>5. Personal Protective Equipment (PPE)</h2>
      <ul>
        <li>Hard hat (EN397)</li>
        <li>Safety boots (EN ISO 20345)</li>
        <li>High-visibility vest/clothing (EN ISO 20471)</li>
        <li>Safety glasses (EN166) - where required</li>
        <li>Gloves - task specific</li>
        <li>Hearing protection - where required</li>
      </ul>

      <h2>6. Emergency Procedures</h2>
      <ul>
        <li>Assembly point: [To be specified on site]</li>
        <li>First aid location: [To be specified on site]</li>
        <li>Emergency contact: [Site manager contact]</li>
      </ul>

      <div class="footer">
        <p>Generated by CortexBuild Pro RAMS Generator</p>
        <p>Document Date: ${project.date}</p>
        <p>This document should be reviewed and customized for site-specific conditions.</p>
      </div>
    </body>
    </html>
  `;

  return html;
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    if (req.method !== "POST") {
      throw new Error("Method not allowed");
    }

    const { project }: { project: ProjectData } = await req.json();

    if (!project?.name) {
      throw new Error("Project name is required");
    }

    // Generate the RAMS document
    const html = await generateRamsHTML(project);

    return new Response(
      JSON.stringify({ html }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error generating RAMS:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to generate RAMS" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
