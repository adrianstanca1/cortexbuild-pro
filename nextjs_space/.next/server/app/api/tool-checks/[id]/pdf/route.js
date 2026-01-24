"use strict";(()=>{var e={};e.id=1279,e.ids=[1279],e.modules={53524:e=>{e.exports=require("@prisma/client")},72934:e=>{e.exports=require("next/dist/client/components/action-async-storage.external.js")},54580:e=>{e.exports=require("next/dist/client/components/request-async-storage.external.js")},45869:e=>{e.exports=require("next/dist/client/components/static-generation-async-storage.external.js")},20399:e=>{e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},30517:e=>{e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},27790:e=>{e.exports=require("assert")},78893:e=>{e.exports=require("buffer")},84770:e=>{e.exports=require("crypto")},17702:e=>{e.exports=require("events")},32615:e=>{e.exports=require("http")},35240:e=>{e.exports=require("https")},86624:e=>{e.exports=require("querystring")},17360:e=>{e.exports=require("url")},21764:e=>{e.exports=require("util")},71568:e=>{e.exports=require("zlib")},7404:(e,t,i)=>{i.r(t),i.d(t,{originalPathname:()=>b,patchFetch:()=>h,requestAsyncStorage:()=>m,routeModule:()=>f,serverHooks:()=>x,staticGenerationAsyncStorage:()=>g});var o={};i.r(o),i.d(o,{GET:()=>v,dynamic:()=>u});var a=i(49303),r=i(88716),n=i(60670),s=i(87070),d=i(75571),l=i(10191),c=i(9487),p=i(72771);let u="force-dynamic";async function v(e,{params:t}){try{let e=await (0,d.getServerSession)(l.L);if(!e?.user)return s.NextResponse.json({error:"Unauthorized"},{status:401});let i=await c._B.toolCheck.findUnique({where:{id:t.id},include:{project:{select:{name:!0,organizationId:!0}},inspector:{select:{name:!0,email:!0}}}});if(!i)return s.NextResponse.json({error:"Tool check not found"},{status:404});let o=e.user.organizationId;if(i.project.organizationId!==o)return s.NextResponse.json({error:"Forbidden"},{status:403});let a=function(e){let t=(()=>{let t=[];return void 0!==e.visualCondition&&t.push({name:"Visual Condition",value:e.visualCondition}),void 0!==e.cleanAndFree&&t.push({name:"Clean & Free of Debris",value:e.cleanAndFree}),void 0!==e.properStorage&&t.push({name:"Proper Storage",value:e.properStorage}),void 0!==e.guardsIntact&&t.push({name:"Guards Intact",value:e.guardsIntact}),void 0!==e.cordCondition&&t.push({name:"Cord Condition",value:e.cordCondition}),void 0!==e.switchFunction&&t.push({name:"Switch Function",value:e.switchFunction}),void 0!==e.properGrounding&&t.push({name:"Proper Grounding",value:e.properGrounding}),void 0!==e.ventilationClear&&t.push({name:"Ventilation Clear",value:e.ventilationClear}),void 0!==e.batteryCondition&&t.push({name:"Battery Condition",value:e.batteryCondition}),void 0!==e.handlesSecure&&t.push({name:"Handles Secure",value:e.handlesSecure}),void 0!==e.cuttingEdgesSharp&&t.push({name:"Cutting Edges Sharp",value:e.cuttingEdgesSharp}),void 0!==e.noRustCorrosion&&t.push({name:"No Rust/Corrosion",value:e.noRustCorrosion}),void 0!==e.properSize&&t.push({name:"Proper Size for Job",value:e.properSize}),void 0!==e.rungsIntact&&t.push({name:"Rungs Intact",value:e.rungsIntact}),void 0!==e.feetCondition&&t.push({name:"Feet Condition",value:e.feetCondition}),void 0!==e.lockingMechanismOk&&t.push({name:"Locking Mechanism OK",value:e.lockingMechanismOk}),void 0!==e.weightCapacityVisible&&t.push({name:"Weight Capacity Visible",value:e.weightCapacityVisible}),void 0!==e.noLooseHardware&&t.push({name:"No Loose Hardware",value:e.noLooseHardware}),void 0!==e.platformsSecure&&t.push({name:"Platforms Secure",value:e.platformsSecure}),void 0!==e.guardrailsInPlace&&t.push({name:"Guardrails in Place",value:e.guardrailsInPlace}),void 0!==e.bracingIntact&&t.push({name:"Cross-Bracing Intact",value:e.bracingIntact}),void 0!==e.basePlatesLevel&&t.push({name:"Base Plates Level",value:e.basePlatesLevel}),void 0!==e.accessLaddersSecure&&t.push({name:"Access Ladders Secure",value:e.accessLaddersSecure}),t})(),i=e=>{switch(e){case"OK":return"background: #dcfce7; color: #166534;";case"DEFECTIVE":return"background: #fef2f2; color: #dc2626;";case"NEEDS_REPAIR":return"background: #fef3c7; color: #92400e;";default:return"background: #f3f4f6; color: #6b7280;"}},o=t.map(e=>`
    <tr>
      <td style="padding: 10px; border: 1px solid #e5e7eb;">${e.name}</td>
      <td style="padding: 10px; border: 1px solid #e5e7eb; text-align: center;">
        <span style="padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600; ${i(e.value)}">
          ${e.value?.replace("_"," ")||"N/A"}
        </span>
      </td>
    </tr>
  `).join(""),a="PASS"===e.overallStatus?"background: #dcfce7; color: #166534;":"FAIL"===e.overallStatus?"background: #fef2f2; color: #dc2626;":"background: #fef3c7; color: #92400e;";return`
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: Arial, sans-serif; padding: 40px; color: #333; }
        .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #8b5cf6; padding-bottom: 20px; margin-bottom: 30px; }
        .logo { font-size: 24px; font-weight: bold; color: #8b5cf6; }
        .title { font-size: 28px; font-weight: bold; margin-bottom: 10px; }
        .subtitle { color: #666; font-size: 14px; }
        .section { margin-bottom: 25px; }
        .section-title { font-size: 16px; font-weight: bold; color: #8b5cf6; border-bottom: 1px solid #e5e7eb; padding-bottom: 8px; margin-bottom: 15px; }
        .info-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; }
        .info-item { background: #f9fafb; padding: 12px; border-radius: 6px; }
        .info-label { font-size: 12px; color: #666; margin-bottom: 4px; }
        .info-value { font-size: 14px; font-weight: 500; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        th { background: #8b5cf6; color: white; padding: 10px; text-align: left; }
        .overall-status { display: inline-block; padding: 8px 20px; border-radius: 8px; font-size: 18px; font-weight: bold; }
        .tool-type-badge { display: inline-block; padding: 6px 14px; border-radius: 6px; font-size: 14px; font-weight: 600; background: #f3e8ff; color: #7c3aed; }
        .signature-box { border: 1px solid #e5e7eb; padding: 15px; border-radius: 8px; margin-top: 10px; }
        .signature-label { font-size: 12px; color: #666; margin-bottom: 8px; }
        .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 11px; color: #666; text-align: center; }
      </style>
    </head>
    <body>
      <div class="header">
        <div>
          <div class="logo">CortexBuild Pro</div>
          <div class="subtitle">Tool Safety Inspection Report</div>
        </div>
        <div style="text-align: right;">
          <div class="subtitle">Generated: ${(0,p.WU)(new Date,"dd/MM/yyyy HH:mm")}</div>
        </div>
      </div>

      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px;">
        <div>
          <div class="title">${e.toolName||"Tool Inspection"}</div>
          <span class="tool-type-badge">${({POWER_TOOL:"Power Tool",HAND_TOOL:"Hand Tool",LADDER:"Ladder",SCAFFOLD:"Scaffold",OTHER:"Other Equipment"})[e.toolType]||e.toolType}</span>
        </div>
        <div class="overall-status" style="${a}">
          ${e.overallStatus?.replace("_"," ")||"PENDING"}
        </div>
      </div>

      <div class="section">
        <div class="section-title">Tool & Inspection Details</div>
        <div class="info-grid">
          <div class="info-item">
            <div class="info-label">Project</div>
            <div class="info-value">${e.project.name}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Check Date</div>
            <div class="info-value">${(0,p.WU)(new Date(e.checkDate),"dd/MM/yyyy HH:mm")}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Serial Number</div>
            <div class="info-value">${e.serialNumber||"-"}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Manufacturer</div>
            <div class="info-value">${e.manufacturer||"-"}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Model</div>
            <div class="info-value">${e.model||"-"}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Location</div>
            <div class="info-value">${e.location||"-"}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Inspector</div>
            <div class="info-value">${e.inspector?.name||"Not specified"}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Safe to Use</div>
            <div class="info-value" style="${e.safeToUse?"color: #166534;":"color: #dc2626;"}">
              ${e.safeToUse?"YES ✓":"NO ✗"}
            </div>
          </div>
        </div>
      </div>

      <div class="section">
        <div class="section-title">Inspection Checklist</div>
        <table>
          <thead>
            <tr>
              <th>Inspection Item</th>
              <th style="width: 150px; text-align: center;">Status</th>
            </tr>
          </thead>
          <tbody>
            ${o||'<tr><td colspan="2" style="padding: 20px; text-align: center; color: #666;">No checklist items</td></tr>'}
          </tbody>
        </table>
      </div>

      ${e.defectsFound?`
      <div class="section">
        <div class="section-title" style="color: #dc2626;">Defects Found</div>
        <div style="background: #fef2f2; padding: 15px; border-radius: 8px; border-left: 4px solid #dc2626;">
          ${e.defectsFound}
        </div>
      </div>
      `:""}

      ${e.actionsTaken?`
      <div class="section">
        <div class="section-title">Actions Taken</div>
        <div style="background: #f0fdf4; padding: 15px; border-radius: 8px; border-left: 4px solid #22c55e;">
          ${e.actionsTaken}
        </div>
      </div>
      `:""}

      <div class="section">
        <div class="section-title">Inspector Signature</div>
        <div class="signature-box">
          ${e.inspectorSignature?`<img src="${e.inspectorSignature}" style="max-height: 60px; max-width: 200px;" alt="Inspector Signature"/>`:'<div style="color: #999; font-style: italic;">Not signed</div>'}
          <div style="margin-top: 8px; font-size: 12px; color: #666;">
            ${e.inspector?.name||""} ${e.signedAt?`- ${(0,p.WU)(new Date(e.signedAt),"dd/MM/yyyy HH:mm")}`:""}
          </div>
        </div>
      </div>

      <div class="footer">
        <p>This document was automatically generated by CortexBuild Pro Construction Management System</p>
        <p>Document ID: ${e.id}</p>
      </div>
    </body>
    </html>
  `}(i),r=await fetch("https://apps.abacus.ai/api/createConvertHtmlToPdfRequest",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({deployment_token:process.env.ABACUSAI_API_KEY,html_content:a,pdf_options:{format:"A4",print_background:!0},base_url:process.env.NEXTAUTH_URL||""})});if(!r.ok)return s.NextResponse.json({error:"Failed to create PDF request"},{status:500});let{request_id:n}=await r.json();if(!n)return s.NextResponse.json({error:"No request ID returned"},{status:500});let u=0;for(;u<60;){await new Promise(e=>setTimeout(e,1e3));let e=await fetch("https://apps.abacus.ai/api/getConvertHtmlToPdfStatus",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({request_id:n,deployment_token:process.env.ABACUSAI_API_KEY})}),t=await e.json(),o=t?.status||"FAILED",a=t?.result||null;if("SUCCESS"===o&&a?.result){let e=Buffer.from(a.result,"base64"),t=`tool-check-${i.toolName?.replace(/[^a-zA-Z0-9]/g,"-")||"tool"}-${(0,p.WU)(new Date(i.checkDate),"yyyy-MM-dd")}.pdf`;return new s.NextResponse(e,{headers:{"Content-Type":"application/pdf","Content-Disposition":`attachment; filename="${t}"`}})}if("FAILED"===o)return s.NextResponse.json({error:"PDF generation failed"},{status:500});u++}return s.NextResponse.json({error:"PDF generation timed out"},{status:500})}catch(e){return console.error("Error generating PDF:",e),s.NextResponse.json({error:"Internal server error"},{status:500})}}let f=new a.AppRouteRouteModule({definition:{kind:r.x.APP_ROUTE,page:"/api/tool-checks/[id]/pdf/route",pathname:"/api/tool-checks/[id]/pdf",filename:"route",bundlePath:"app/api/tool-checks/[id]/pdf/route"},resolvedPagePath:"/Users/adrian/.gemini/antigravity/playground/resonant-armstrong/cortexbuild_final_extracted/nextjs_space/app/api/tool-checks/[id]/pdf/route.ts",nextConfigOutput:"",userland:o}),{requestAsyncStorage:m,staticGenerationAsyncStorage:g,serverHooks:x}=f,b="/api/tool-checks/[id]/pdf/route";function h(){return(0,n.patchFetch)({serverHooks:x,staticGenerationAsyncStorage:g})}},10191:(e,t,i)=>{i.d(t,{L:()=>d});var o=i(53797),a=i(13539),r=i(9487),n=i(42023),s=i.n(n);let d={adapter:(0,a.N)(r._B),providers:[(0,o.Z)({name:"credentials",credentials:{email:{label:"Email",type:"email"},password:{label:"Password",type:"password"}},async authorize(e){if(!e?.email||!e?.password)return null;let t=await r._B.user.findUnique({where:{email:e.email},include:{organization:!0}});return t&&await s().compare(e.password,t.password)?(await r._B.user.update({where:{id:t.id},data:{lastLogin:new Date}}),{id:t.id,email:t.email,name:t.name,role:t.role,organizationId:t.organizationId,avatarUrl:t.avatarUrl}):null}})],session:{strategy:"jwt",maxAge:2592e3},callbacks:{jwt:async({token:e,user:t})=>(t&&(e.id=t.id,e.role=t.role,e.organizationId=t.organizationId,e.avatarUrl=t.avatarUrl),e),session:async({session:e,token:t})=>(e.user&&(e.user.id=t.id,e.user.role=t.role,e.user.organizationId=t.organizationId,e.user.avatarUrl=t.avatarUrl),e)},pages:{signIn:"/login"},secret:process.env.NEXTAUTH_SECRET}},9487:(e,t,i)=>{let o;i.d(t,{ZP:()=>s,_B:()=>n});var a=i(53524);let r=globalThis,n=new Proxy({},{get:(e,t,i)=>{if(!o){if("true"===process.env.PRISMA_SKIP_INIT)return()=>{throw Error("Prisma accessed during build-time skip phase")};o=r.prisma??new a.PrismaClient({log:["error"],datasources:{db:{url:function(){let e=process.env.DATABASE_URL||"";if(e&&!e.includes("connection_limit")){let t=e.includes("?")?"&":"?";return`${e}${t}connection_limit=5&pool_timeout=10&connect_timeout=10`}return e}()}}})}return Reflect.get(o,t,i)}}),s=n}};var t=require("../../../../../webpack-runtime.js");t.C(e);var i=e=>t(t.s=e),o=t.X(0,[9276,2776,9637,5972,2771],()=>i(7404));module.exports=o})();