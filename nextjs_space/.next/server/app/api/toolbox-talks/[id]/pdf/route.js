"use strict";(()=>{var e={};e.id=8789,e.ids=[8789],e.modules={53524:e=>{e.exports=require("@prisma/client")},72934:e=>{e.exports=require("next/dist/client/components/action-async-storage.external.js")},54580:e=>{e.exports=require("next/dist/client/components/request-async-storage.external.js")},45869:e=>{e.exports=require("next/dist/client/components/static-generation-async-storage.external.js")},20399:e=>{e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},30517:e=>{e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},27790:e=>{e.exports=require("assert")},78893:e=>{e.exports=require("buffer")},84770:e=>{e.exports=require("crypto")},17702:e=>{e.exports=require("events")},32615:e=>{e.exports=require("http")},35240:e=>{e.exports=require("https")},86624:e=>{e.exports=require("querystring")},17360:e=>{e.exports=require("url")},21764:e=>{e.exports=require("util")},71568:e=>{e.exports=require("zlib")},48840:(e,t,i)=>{i.r(t),i.d(t,{originalPathname:()=>b,patchFetch:()=>y,requestAsyncStorage:()=>g,routeModule:()=>v,serverHooks:()=>x,staticGenerationAsyncStorage:()=>f});var s={};i.r(s),i.d(s,{GET:()=>m,dynamic:()=>u});var a=i(49303),o=i(88716),r=i(60670),n=i(87070),d=i(75571),l=i(10191),p=i(9487),c=i(72771);let u="force-dynamic";async function m(e,{params:t}){try{let e=await (0,d.getServerSession)(l.L);if(!e?.user)return n.NextResponse.json({error:"Unauthorized"},{status:401});let i=await p._B.toolboxTalk.findUnique({where:{id:t.id},include:{project:{select:{name:!0,organizationId:!0}},presenter:{select:{name:!0,email:!0}},attendees:{include:{user:{select:{name:!0,email:!0}}}}}});if(!i)return n.NextResponse.json({error:"Toolbox talk not found"},{status:404});let s=e.user.organizationId;if(i.project.organizationId!==s)return n.NextResponse.json({error:"Forbidden"},{status:403});let a=function(e){let t=e.attendees.map((e,t)=>`
    <tr>
      <td style="padding: 8px; border: 1px solid #ddd;">${t+1}</td>
      <td style="padding: 8px; border: 1px solid #ddd;">${e.user?.name||e.guestName||"Unknown"}</td>
      <td style="padding: 8px; border: 1px solid #ddd;">${e.user?.email||e.guestEmail||"-"}</td>
      <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">
        ${e.signatureData?`<img src="${e.signatureData}" style="max-height: 40px; max-width: 120px;" alt="Signature"/>`:'<span style="color: #999;">Not signed</span>'}
      </td>
      <td style="padding: 8px; border: 1px solid #ddd;">${e.signedAt?(0,c.WU)(new Date(e.signedAt),"dd/MM/yyyy HH:mm"):"-"}</td>
    </tr>
  `).join(""),i=e.keyPoints||[],s=e.hazardsDiscussed||[],a=e.safetyMeasures||[];return`
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: Arial, sans-serif; padding: 40px; color: #333; }
        .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #4F46E5; padding-bottom: 20px; margin-bottom: 30px; }
        .logo { font-size: 24px; font-weight: bold; color: #4F46E5; }
        .title { font-size: 28px; font-weight: bold; margin-bottom: 10px; }
        .subtitle { color: #666; font-size: 14px; }
        .section { margin-bottom: 25px; }
        .section-title { font-size: 16px; font-weight: bold; color: #4F46E5; border-bottom: 1px solid #e5e7eb; padding-bottom: 8px; margin-bottom: 15px; }
        .info-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; }
        .info-item { background: #f9fafb; padding: 12px; border-radius: 6px; }
        .info-label { font-size: 12px; color: #666; margin-bottom: 4px; }
        .info-value { font-size: 14px; font-weight: 500; }
        .list-item { padding: 8px 12px; background: #f0f9ff; border-left: 3px solid #4F46E5; margin-bottom: 8px; border-radius: 0 4px 4px 0; }
        .hazard-item { background: #fef2f2; border-left-color: #ef4444; }
        .safety-item { background: #f0fdf4; border-left-color: #22c55e; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        th { background: #4F46E5; color: white; padding: 10px; text-align: left; }
        .status-badge { display: inline-block; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600; }
        .status-completed { background: #dcfce7; color: #166534; }
        .status-in-progress { background: #fef3c7; color: #92400e; }
        .status-scheduled { background: #dbeafe; color: #1e40af; }
        .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 11px; color: #666; text-align: center; }
      </style>
    </head>
    <body>
      <div class="header">
        <div>
          <div class="logo">CortexBuild Pro</div>
          <div class="subtitle">Toolbox Talk Record</div>
        </div>
        <div style="text-align: right;">
          <div class="subtitle">Generated: ${(0,c.WU)(new Date,"dd/MM/yyyy HH:mm")}</div>
        </div>
      </div>

      <div class="title">${e.title}</div>
      <span class="status-badge status-${e.status.toLowerCase().replace("_","-")}">${e.status.replace("_"," ")}</span>

      <div class="section" style="margin-top: 25px;">
        <div class="section-title">Talk Details</div>
        <div class="info-grid">
          <div class="info-item">
            <div class="info-label">Project</div>
            <div class="info-value">${e.project.name}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Date & Time</div>
            <div class="info-value">${(0,c.WU)(new Date(e.date),"dd/MM/yyyy")} at ${e.time||"N/A"}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Topic</div>
            <div class="info-value">${e.topic||"-"}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Location</div>
            <div class="info-value">${e.location||"-"}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Presenter</div>
            <div class="info-value">${e.presenter?.name||"Not assigned"}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Total Attendees</div>
            <div class="info-value">${e.attendees.length}</div>
          </div>
        </div>
      </div>

      ${e.description?`
      <div class="section">
        <div class="section-title">Description</div>
        <p>${e.description}</p>
      </div>
      `:""}

      ${i.length>0?`
      <div class="section">
        <div class="section-title">Key Points Discussed</div>
        ${i.map(e=>`<div class="list-item">${e}</div>`).join("")}
      </div>
      `:""}

      ${s.length>0?`
      <div class="section">
        <div class="section-title">Hazards Discussed</div>
        ${s.map(e=>`<div class="list-item hazard-item">${e}</div>`).join("")}
      </div>
      `:""}

      ${a.length>0?`
      <div class="section">
        <div class="section-title">Safety Measures</div>
        ${a.map(e=>`<div class="list-item safety-item">${e}</div>`).join("")}
      </div>
      `:""}

      <div class="section">
        <div class="section-title">Attendance Register</div>
        <table>
          <thead>
            <tr>
              <th style="width: 40px;">#</th>
              <th>Name</th>
              <th>Email</th>
              <th style="width: 140px;">Signature</th>
              <th style="width: 140px;">Signed At</th>
            </tr>
          </thead>
          <tbody>
            ${t||'<tr><td colspan="5" style="padding: 20px; text-align: center; color: #666;">No attendees recorded</td></tr>'}
          </tbody>
        </table>
      </div>

      <div class="footer">
        <p>This document was automatically generated by CortexBuild Pro Construction Management System</p>
        <p>Document ID: ${e.id}</p>
      </div>
    </body>
    </html>
  `}(i),o=await fetch("https://apps.abacus.ai/api/createConvertHtmlToPdfRequest",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({deployment_token:process.env.ABACUSAI_API_KEY,html_content:a,pdf_options:{format:"A4",print_background:!0},base_url:process.env.NEXTAUTH_URL||""})});if(!o.ok)return n.NextResponse.json({error:"Failed to create PDF request"},{status:500});let{request_id:r}=await o.json();if(!r)return n.NextResponse.json({error:"No request ID returned"},{status:500});let u=0;for(;u<60;){await new Promise(e=>setTimeout(e,1e3));let e=await fetch("https://apps.abacus.ai/api/getConvertHtmlToPdfStatus",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({request_id:r,deployment_token:process.env.ABACUSAI_API_KEY})}),t=await e.json(),s=t?.status||"FAILED",a=t?.result||null;if("SUCCESS"===s&&a?.result){let e=Buffer.from(a.result,"base64"),t=`toolbox-talk-${i.title.replace(/[^a-zA-Z0-9]/g,"-")}-${(0,c.WU)(new Date,"yyyy-MM-dd")}.pdf`;return new n.NextResponse(e,{headers:{"Content-Type":"application/pdf","Content-Disposition":`attachment; filename="${t}"`}})}if("FAILED"===s)return n.NextResponse.json({error:"PDF generation failed"},{status:500});u++}return n.NextResponse.json({error:"PDF generation timed out"},{status:500})}catch(e){return console.error("Error generating PDF:",e),n.NextResponse.json({error:"Internal server error"},{status:500})}}let v=new a.AppRouteRouteModule({definition:{kind:o.x.APP_ROUTE,page:"/api/toolbox-talks/[id]/pdf/route",pathname:"/api/toolbox-talks/[id]/pdf",filename:"route",bundlePath:"app/api/toolbox-talks/[id]/pdf/route"},resolvedPagePath:"/Users/adrian/.gemini/antigravity/playground/resonant-armstrong/cortexbuild_final_extracted/nextjs_space/app/api/toolbox-talks/[id]/pdf/route.ts",nextConfigOutput:"",userland:s}),{requestAsyncStorage:g,staticGenerationAsyncStorage:f,serverHooks:x}=v,b="/api/toolbox-talks/[id]/pdf/route";function y(){return(0,r.patchFetch)({serverHooks:x,staticGenerationAsyncStorage:f})}},10191:(e,t,i)=>{i.d(t,{L:()=>d});var s=i(53797),a=i(13539),o=i(9487),r=i(42023),n=i.n(r);let d={adapter:(0,a.N)(o._B),providers:[(0,s.Z)({name:"credentials",credentials:{email:{label:"Email",type:"email"},password:{label:"Password",type:"password"}},async authorize(e){if(!e?.email||!e?.password)return null;let t=await o._B.user.findUnique({where:{email:e.email},include:{organization:!0}});return t&&await n().compare(e.password,t.password)?(await o._B.user.update({where:{id:t.id},data:{lastLogin:new Date}}),{id:t.id,email:t.email,name:t.name,role:t.role,organizationId:t.organizationId,avatarUrl:t.avatarUrl}):null}})],session:{strategy:"jwt",maxAge:2592e3},callbacks:{jwt:async({token:e,user:t})=>(t&&(e.id=t.id,e.role=t.role,e.organizationId=t.organizationId,e.avatarUrl=t.avatarUrl),e),session:async({session:e,token:t})=>(e.user&&(e.user.id=t.id,e.user.role=t.role,e.user.organizationId=t.organizationId,e.user.avatarUrl=t.avatarUrl),e)},pages:{signIn:"/login"},secret:process.env.NEXTAUTH_SECRET}},9487:(e,t,i)=>{let s;i.d(t,{ZP:()=>n,_B:()=>r});var a=i(53524);let o=globalThis,r=new Proxy({},{get:(e,t,i)=>{if(!s){if("true"===process.env.PRISMA_SKIP_INIT)return()=>{throw Error("Prisma accessed during build-time skip phase")};s=o.prisma??new a.PrismaClient({log:["error"],datasources:{db:{url:function(){let e=process.env.DATABASE_URL||"";if(e&&!e.includes("connection_limit")){let t=e.includes("?")?"&":"?";return`${e}${t}connection_limit=5&pool_timeout=10&connect_timeout=10`}return e}()}}})}return Reflect.get(s,t,i)}}),n=r}};var t=require("../../../../../webpack-runtime.js");t.C(e);var i=e=>t(t.s=e),s=t.X(0,[9276,2776,9637,5972,2771],()=>i(48840));module.exports=s})();