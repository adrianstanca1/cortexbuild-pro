"use strict";(()=>{var t={};t.id=2055,t.ids=[2055],t.modules={53524:t=>{t.exports=require("@prisma/client")},72934:t=>{t.exports=require("next/dist/client/components/action-async-storage.external.js")},54580:t=>{t.exports=require("next/dist/client/components/request-async-storage.external.js")},45869:t=>{t.exports=require("next/dist/client/components/static-generation-async-storage.external.js")},20399:t=>{t.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},30517:t=>{t.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},27790:t=>{t.exports=require("assert")},78893:t=>{t.exports=require("buffer")},84770:t=>{t.exports=require("crypto")},17702:t=>{t.exports=require("events")},32615:t=>{t.exports=require("http")},35240:t=>{t.exports=require("https")},86624:t=>{t.exports=require("querystring")},17360:t=>{t.exports=require("url")},21764:t=>{t.exports=require("util")},71568:t=>{t.exports=require("zlib")},8039:(t,e,a)=>{a.r(e),a.d(e,{originalPathname:()=>b,patchFetch:()=>y,requestAsyncStorage:()=>m,routeModule:()=>v,serverHooks:()=>f,staticGenerationAsyncStorage:()=>h});var s={};a.r(s),a.d(s,{POST:()=>g,dynamic:()=>u});var r=a(49303),i=a(88716),o=a(60670),d=a(87070),n=a(75571),l=a(10191),c=a(9487),p=a(72771);let u="force-dynamic";async function g(t){try{let e=await (0,n.getServerSession)(l.L);if(!e?.user)return d.NextResponse.json({error:"Unauthorized"},{status:401});let{reportType:a,projectId:s,dateRange:r}=await t.json(),i={},o=e.user.organizationId??"";if("project_summary"===a&&s)i={project:await c._B.project.findFirst({where:{id:s,organizationId:o},include:{tasks:!0,manager:{select:{name:!0}},costItems:!0,milestones:!0}})};else if("budget_report"===a)i={costItems:await c._B.costItem.findMany({where:{project:{organizationId:o}},include:{project:{select:{name:!0}}}})};else if("time_entries"===a)i={timeEntries:await c._B.timeEntry.findMany({where:{project:{organizationId:o}},include:{project:{select:{name:!0}},user:{select:{name:!0}},task:{select:{title:!0}}},orderBy:{date:"desc"},take:100})};else{let[t,e,a]=await Promise.all([c._B.project.findMany({where:{organizationId:o},include:{_count:{select:{tasks:!0}}}}),c._B.task.findMany({where:{project:{organizationId:o}}}),c._B.milestone.findMany({where:{project:{organizationId:o}}})]);i={projects:t,tasks:e,milestones:a}}let u=function(t,e,a){let s=(0,p.WU)(new Date,"MMMM d, yyyy"),r=`
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { font-family: 'Helvetica', Arial, sans-serif; color: #1a1a2e; line-height: 1.6; }
      .header { background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); color: white; padding: 30px; }
      .header h1 { font-size: 28px; margin-bottom: 5px; }
      .header p { opacity: 0.8; }
      .content { padding: 30px; }
      .section { margin-bottom: 30px; }
      .section-title { font-size: 18px; font-weight: bold; color: #1a1a2e; border-bottom: 2px solid #0f4c75; padding-bottom: 10px; margin-bottom: 15px; }
      table { width: 100%; border-collapse: collapse; margin-top: 15px; }
      th, td { padding: 12px; text-align: left; border-bottom: 1px solid #eee; }
      th { background: #f8f9fa; font-weight: 600; color: #1a1a2e; }
      .stat-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin: 20px 0; }
      .stat-card { background: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center; }
      .stat-value { font-size: 32px; font-weight: bold; color: #0f4c75; }
      .stat-label { font-size: 12px; color: #666; text-transform: uppercase; }
      .badge { display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: 500; }
      .badge-success { background: #d4edda; color: #155724; }
      .badge-warning { background: #fff3cd; color: #856404; }
      .badge-info { background: #cce5ff; color: #004085; }
      .badge-danger { background: #f8d7da; color: #721c24; }
      .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666; }
    </style>
  `,i="";if("project_summary"===t&&e.project){let t=e.project,a=t.tasks?.filter(t=>"COMPLETE"===t.status).length||0,s=t.tasks?.length||0,r=t.costItems?.reduce((t,e)=>t+(e.estimatedAmount||0),0)||0,o=t.costItems?.reduce((t,e)=>t+(e.actualAmount||0),0)||0;i=`
      <div class="section">
        <h2 class="section-title">Project Overview</h2>
        <p><strong>Project:</strong> ${t.name}</p>
        <p><strong>Status:</strong> ${t.status}</p>
        <p><strong>Manager:</strong> ${t.manager?.name||"Unassigned"}</p>
        <p><strong>Location:</strong> ${t.location||"N/A"}</p>
      </div>
      <div class="stat-grid">
        <div class="stat-card"><div class="stat-value">${s}</div><div class="stat-label">Total Tasks</div></div>
        <div class="stat-card"><div class="stat-value">${a}</div><div class="stat-label">Completed</div></div>
        <div class="stat-card"><div class="stat-value">\xa3${r.toLocaleString()}</div><div class="stat-label">Budget</div></div>
        <div class="stat-card"><div class="stat-value">\xa3${o.toLocaleString()}</div><div class="stat-label">Spent</div></div>
      </div>
      <div class="section">
        <h2 class="section-title">Tasks</h2>
        <table>
          <thead><tr><th>Task</th><th>Status</th><th>Priority</th><th>Due Date</th></tr></thead>
          <tbody>
            ${(t.tasks||[]).slice(0,20).map(t=>`
              <tr>
                <td>${t.title}</td>
                <td><span class="badge badge-${"COMPLETE"===t.status?"success":"IN_PROGRESS"===t.status?"info":"warning"}">${t.status}</span></td>
                <td>${t.priority}</td>
                <td>${t.dueDate?(0,p.WU)(new Date(t.dueDate),"MMM d, yyyy"):"N/A"}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    `}else if("budget_report"===t){let t=e.costItems||[],a=t.reduce((t,e)=>t+(e.actualAmount||0),0);i=`
      <div class="section">
        <h2 class="section-title">Budget Summary</h2>
        <div class="stat-grid">
          <div class="stat-card"><div class="stat-value">${t.length}</div><div class="stat-label">Cost Items</div></div>
          <div class="stat-card"><div class="stat-value">\xa3${a.toLocaleString()}</div><div class="stat-label">Total Spend</div></div>
        </div>
        <table>
          <thead><tr><th>Description</th><th>Project</th><th>Category</th><th>Estimated</th><th>Actual</th></tr></thead>
          <tbody>
            ${t.slice(0,30).map(t=>`
              <tr>
                <td>${t.description}</td>
                <td>${t.project?.name||"N/A"}</td>
                <td>${t.category}</td>
                <td>\xa3${(t.estimatedAmount||0).toLocaleString()}</td>
                <td>\xa3${(t.actualAmount||0).toLocaleString()}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    `}else if("time_entries"===t){let t=e.timeEntries||[],a=t.reduce((t,e)=>t+(e.hours||0),0);i=`
      <div class="section">
        <h2 class="section-title">Time Tracking Report</h2>
        <div class="stat-grid">
          <div class="stat-card"><div class="stat-value">${t.length}</div><div class="stat-label">Entries</div></div>
          <div class="stat-card"><div class="stat-value">${a.toFixed(1)}h</div><div class="stat-label">Total Hours</div></div>
        </div>
        <table>
          <thead><tr><th>Date</th><th>User</th><th>Project</th><th>Task</th><th>Hours</th><th>Status</th></tr></thead>
          <tbody>
            ${t.slice(0,50).map(t=>`
              <tr>
                <td>${(0,p.WU)(new Date(t.date),"MMM d, yyyy")}</td>
                <td>${t.user?.name||"N/A"}</td>
                <td>${t.project?.name||"N/A"}</td>
                <td>${t.task?.title||"-"}</td>
                <td>${t.hours}h</td>
                <td><span class="badge badge-${"APPROVED"===t.status?"success":"REJECTED"===t.status?"danger":"warning"}">${t.status}</span></td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    `}else{let{projects:t=[],tasks:a=[],milestones:s=[]}=e,r=t.filter(t=>"IN_PROGRESS"===t.status).length,o=a.filter(t=>"COMPLETE"===t.status).length;i=`
      <div class="stat-grid">
        <div class="stat-card"><div class="stat-value">${t.length}</div><div class="stat-label">Projects</div></div>
        <div class="stat-card"><div class="stat-value">${r}</div><div class="stat-label">Active</div></div>
        <div class="stat-card"><div class="stat-value">${a.length}</div><div class="stat-label">Tasks</div></div>
        <div class="stat-card"><div class="stat-value">${o}</div><div class="stat-label">Completed</div></div>
      </div>
      <div class="section">
        <h2 class="section-title">Projects</h2>
        <table>
          <thead><tr><th>Name</th><th>Status</th><th>Tasks</th></tr></thead>
          <tbody>
            ${t.slice(0,20).map(t=>`
              <tr>
                <td>${t.name}</td>
                <td><span class="badge badge-${"COMPLETED"===t.status?"success":"IN_PROGRESS"===t.status?"info":"warning"}">${t.status}</span></td>
                <td>${t._count?.tasks||0}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    `}return`
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      ${r}
    </head>
    <body>
      <div class="header">
        <h1>CortexBuild Pro Report</h1>
        <p>Generated on ${s} by ${a}</p>
      </div>
      <div class="content">
        ${i}
        <div class="footer">
          <p>This report was automatically generated by CortexBuild Pro. For questions, contact your administrator.</p>
        </div>
      </div>
    </body>
    </html>
  `}(a,i,e.user.name??"User"),g=await fetch("https://apps.abacus.ai/api/createConvertHtmlToPdfRequest",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({deployment_token:process.env.ABACUSAI_API_KEY,html_content:u,pdf_options:{format:"A4",margin:{top:"20mm",right:"15mm",bottom:"20mm",left:"15mm"},print_background:!0}})});if(!g.ok)throw Error("Failed to create PDF request");let{request_id:v}=await g.json(),m=0;for(;m<60;){await new Promise(t=>setTimeout(t,1e3));let t=await fetch("https://apps.abacus.ai/api/getConvertHtmlToPdfStatus",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({request_id:v,deployment_token:process.env.ABACUSAI_API_KEY})}),e=await t.json();if(e?.status==="SUCCESS"&&e?.result?.result){let t=Buffer.from(e.result.result,"base64");return new d.NextResponse(t,{headers:{"Content-Type":"application/pdf","Content-Disposition":`attachment; filename="report-${(0,p.WU)(new Date,"yyyy-MM-dd")}.pdf"`}})}if(e?.status==="FAILED")throw Error("PDF generation failed");m++}throw Error("PDF generation timed out")}catch(t){return console.error("Error generating PDF:",t),d.NextResponse.json({error:"Failed to generate PDF"},{status:500})}}let v=new r.AppRouteRouteModule({definition:{kind:i.x.APP_ROUTE,page:"/api/reports/pdf/route",pathname:"/api/reports/pdf",filename:"route",bundlePath:"app/api/reports/pdf/route"},resolvedPagePath:"/Users/adrian/.gemini/antigravity/playground/resonant-armstrong/cortexbuild_final_extracted/nextjs_space/app/api/reports/pdf/route.ts",nextConfigOutput:"",userland:s}),{requestAsyncStorage:m,staticGenerationAsyncStorage:h,serverHooks:f}=v,b="/api/reports/pdf/route";function y(){return(0,o.patchFetch)({serverHooks:f,staticGenerationAsyncStorage:h})}},10191:(t,e,a)=>{a.d(e,{L:()=>n});var s=a(53797),r=a(13539),i=a(9487),o=a(42023),d=a.n(o);let n={adapter:(0,r.N)(i._B),providers:[(0,s.Z)({name:"credentials",credentials:{email:{label:"Email",type:"email"},password:{label:"Password",type:"password"}},async authorize(t){if(!t?.email||!t?.password)return null;let e=await i._B.user.findUnique({where:{email:t.email},include:{organization:!0}});return e&&await d().compare(t.password,e.password)?(await i._B.user.update({where:{id:e.id},data:{lastLogin:new Date}}),{id:e.id,email:e.email,name:e.name,role:e.role,organizationId:e.organizationId,avatarUrl:e.avatarUrl}):null}})],session:{strategy:"jwt",maxAge:2592e3},callbacks:{jwt:async({token:t,user:e})=>(e&&(t.id=e.id,t.role=e.role,t.organizationId=e.organizationId,t.avatarUrl=e.avatarUrl),t),session:async({session:t,token:e})=>(t.user&&(t.user.id=e.id,t.user.role=e.role,t.user.organizationId=e.organizationId,t.user.avatarUrl=e.avatarUrl),t)},pages:{signIn:"/login"},secret:process.env.NEXTAUTH_SECRET}},9487:(t,e,a)=>{let s;a.d(e,{ZP:()=>d,_B:()=>o});var r=a(53524);let i=globalThis,o=new Proxy({},{get:(t,e,a)=>{if(!s){if("true"===process.env.PRISMA_SKIP_INIT)return()=>{throw Error("Prisma accessed during build-time skip phase")};s=i.prisma??new r.PrismaClient({log:["error"],datasources:{db:{url:function(){let t=process.env.DATABASE_URL||"";if(t&&!t.includes("connection_limit")){let e=t.includes("?")?"&":"?";return`${t}${e}connection_limit=5&pool_timeout=10&connect_timeout=10`}return t}()}}})}return Reflect.get(s,e,a)}}),d=o}};var e=require("../../../../webpack-runtime.js");e.C(t);var a=t=>e(e.s=t),s=e.X(0,[9276,2776,9637,5972,2771],()=>a(8039));module.exports=s})();