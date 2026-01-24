"use strict";(()=>{var e={};e.id=7715,e.ids=[7715],e.modules={53524:e=>{e.exports=require("@prisma/client")},72934:e=>{e.exports=require("next/dist/client/components/action-async-storage.external.js")},54580:e=>{e.exports=require("next/dist/client/components/request-async-storage.external.js")},45869:e=>{e.exports=require("next/dist/client/components/static-generation-async-storage.external.js")},20399:e=>{e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},30517:e=>{e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},27790:e=>{e.exports=require("assert")},78893:e=>{e.exports=require("buffer")},84770:e=>{e.exports=require("crypto")},17702:e=>{e.exports=require("events")},32615:e=>{e.exports=require("http")},35240:e=>{e.exports=require("https")},86624:e=>{e.exports=require("querystring")},17360:e=>{e.exports=require("url")},21764:e=>{e.exports=require("util")},71568:e=>{e.exports=require("zlib")},38353:(e,i,t)=>{t.r(i),t.d(i,{originalPathname:()=>b,patchFetch:()=>y,requestAsyncStorage:()=>f,routeModule:()=>m,serverHooks:()=>x,staticGenerationAsyncStorage:()=>g});var a={};t.r(a),t.d(a,{GET:()=>v,dynamic:()=>u});var r=t(49303),s=t(88716),o=t(60670),n=t(87070),d=t(75571),l=t(10191),c=t(9487),p=t(72771);let u="force-dynamic";async function v(e,{params:i}){try{let e=await (0,d.getServerSession)(l.L);if(!e?.user)return n.NextResponse.json({error:"Unauthorized"},{status:401});let t=await c._B.mEWPCheck.findUnique({where:{id:i.id},include:{project:{select:{name:!0,organizationId:!0}},operator:{select:{name:!0,email:!0}},supervisor:{select:{name:!0,email:!0}},equipment:{select:{name:!0,serialNumber:!0,model:!0}}}});if(!t)return n.NextResponse.json({error:"MEWP check not found"},{status:404});let a=e.user.organizationId;if(t.project.organizationId!==a)return n.NextResponse.json({error:"Forbidden"},{status:403});let r=function(e){let i=[{name:"Visual Inspection",value:e.visualInspection},{name:"Guardrails Secure",value:e.guardrailsSecure},{name:"Floor Condition",value:e.floorCondition},{name:"Controls Function",value:e.controlsFunction},{name:"Emergency Controls",value:e.emergencyControls},{name:"Wheels & Tyres",value:e.wheelsAndTyres},{name:"Outriggers/Stabilizers",value:e.outriggersStabilizers},{name:"Hydraulic System",value:e.hydraulicSystem},{name:"Electrical System",value:e.electricalSystem},{name:"Safety Devices",value:e.safetyDevices},{name:"Warning Alarms",value:e.warningAlarms},{name:"Manual Override",value:e.manualOverride},{name:"Load Plate Visible",value:e.loadPlateVisible},{name:"User Manual Present",value:e.userManualPresent}],t=e=>{switch(e){case"OK":return"background: #dcfce7; color: #166534;";case"DEFECTIVE":return"background: #fef2f2; color: #dc2626;";case"NEEDS_REPAIR":return"background: #fef3c7; color: #92400e;";default:return"background: #f3f4f6; color: #6b7280;"}},a=i.map(e=>`
    <tr>
      <td style="padding: 10px; border: 1px solid #e5e7eb;">${e.name}</td>
      <td style="padding: 10px; border: 1px solid #e5e7eb; text-align: center;">
        <span style="padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600; ${t(e.value)}">
          ${e.value?.replace("_"," ")||"N/A"}
        </span>
      </td>
    </tr>
  `).join(""),r="PASS"===e.overallStatus?"background: #dcfce7; color: #166534;":"FAIL"===e.overallStatus?"background: #fef2f2; color: #dc2626;":"background: #fef3c7; color: #92400e;";return`
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: Arial, sans-serif; padding: 40px; color: #333; }
        .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #f97316; padding-bottom: 20px; margin-bottom: 30px; }
        .logo { font-size: 24px; font-weight: bold; color: #f97316; }
        .title { font-size: 28px; font-weight: bold; margin-bottom: 10px; }
        .subtitle { color: #666; font-size: 14px; }
        .section { margin-bottom: 25px; }
        .section-title { font-size: 16px; font-weight: bold; color: #f97316; border-bottom: 1px solid #e5e7eb; padding-bottom: 8px; margin-bottom: 15px; }
        .info-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; }
        .info-item { background: #f9fafb; padding: 12px; border-radius: 6px; }
        .info-label { font-size: 12px; color: #666; margin-bottom: 4px; }
        .info-value { font-size: 14px; font-weight: 500; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        th { background: #f97316; color: white; padding: 10px; text-align: left; }
        .overall-status { display: inline-block; padding: 8px 20px; border-radius: 8px; font-size: 18px; font-weight: bold; }
        .signature-box { border: 1px solid #e5e7eb; padding: 15px; border-radius: 8px; margin-top: 10px; }
        .signature-label { font-size: 12px; color: #666; margin-bottom: 8px; }
        .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 11px; color: #666; text-align: center; }
      </style>
    </head>
    <body>
      <div class="header">
        <div>
          <div class="logo">CortexBuild Pro</div>
          <div class="subtitle">MEWP Pre-Use Inspection Report</div>
        </div>
        <div style="text-align: right;">
          <div class="subtitle">Generated: ${(0,p.WU)(new Date,"dd/MM/yyyy HH:mm")}</div>
        </div>
      </div>

      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px;">
        <div class="title">${e.equipmentName||e.equipment?.name||"MEWP Equipment"}</div>
        <div class="overall-status" style="${r}">
          ${e.overallStatus?.replace("_"," ")||"PENDING"}
        </div>
      </div>

      <div class="section">
        <div class="section-title">Equipment & Inspection Details</div>
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
            <div class="info-value">${e.serialNumber||e.equipment?.serialNumber||"-"}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Model</div>
            <div class="info-value">${e.model||e.equipment?.model||"-"}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Manufacturer</div>
            <div class="info-value">${e.manufacturer||"-"}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Location</div>
            <div class="info-value">${e.location||"-"}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Weather Conditions</div>
            <div class="info-value">${e.weatherConditions||"-"}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Wind Speed</div>
            <div class="info-value">${e.windSpeed?`${e.windSpeed} mph`:"-"}</div>
          </div>
        </div>
      </div>

      <div class="section">
        <div class="section-title">Operator Certification</div>
        <div class="info-grid">
          <div class="info-item">
            <div class="info-label">Operator</div>
            <div class="info-value">${e.operator?.name||"Not specified"}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Certification Number</div>
            <div class="info-value">${e.operatorCertNumber||"-"}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Certification Expiry</div>
            <div class="info-value">${e.operatorCertExpiry?(0,p.WU)(new Date(e.operatorCertExpiry),"dd/MM/yyyy"):"-"}</div>
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
            ${a}
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
        <div class="section-title">Signatures</div>
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px;">
          <div class="signature-box">
            <div class="signature-label">Operator Signature</div>
            ${e.operatorSignature?`<img src="${e.operatorSignature}" style="max-height: 60px; max-width: 200px;" alt="Operator Signature"/>`:'<div style="color: #999; font-style: italic;">Not signed</div>'}
            <div style="margin-top: 8px; font-size: 12px; color: #666;">
              ${e.operator?.name||""} ${e.operatorSignedAt?`- ${(0,p.WU)(new Date(e.operatorSignedAt),"dd/MM/yyyy HH:mm")}`:""}
            </div>
          </div>
          <div class="signature-box">
            <div class="signature-label">Supervisor Sign-off</div>
            ${e.supervisorSignature?`<img src="${e.supervisorSignature}" style="max-height: 60px; max-width: 200px;" alt="Supervisor Signature"/>`:'<div style="color: #999; font-style: italic;">Not signed</div>'}
            <div style="margin-top: 8px; font-size: 12px; color: #666;">
              ${e.supervisor?.name||""} ${e.supervisorSignedAt?`- ${(0,p.WU)(new Date(e.supervisorSignedAt),"dd/MM/yyyy HH:mm")}`:""}
            </div>
          </div>
        </div>
      </div>

      <div class="footer">
        <p>This document was automatically generated by CortexBuild Pro Construction Management System</p>
        <p>Document ID: ${e.id}</p>
      </div>
    </body>
    </html>
  `}(t),s=await fetch("https://apps.abacus.ai/api/createConvertHtmlToPdfRequest",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({deployment_token:process.env.ABACUSAI_API_KEY,html_content:r,pdf_options:{format:"A4",print_background:!0},base_url:process.env.NEXTAUTH_URL||""})});if(!s.ok)return n.NextResponse.json({error:"Failed to create PDF request"},{status:500});let{request_id:o}=await s.json();if(!o)return n.NextResponse.json({error:"No request ID returned"},{status:500});let u=0;for(;u<60;){await new Promise(e=>setTimeout(e,1e3));let e=await fetch("https://apps.abacus.ai/api/getConvertHtmlToPdfStatus",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({request_id:o,deployment_token:process.env.ABACUSAI_API_KEY})}),i=await e.json(),a=i?.status||"FAILED",r=i?.result||null;if("SUCCESS"===a&&r?.result){let e=Buffer.from(r.result,"base64"),i=`mewp-check-${t.equipmentName?.replace(/[^a-zA-Z0-9]/g,"-")||"equipment"}-${(0,p.WU)(new Date(t.checkDate),"yyyy-MM-dd")}.pdf`;return new n.NextResponse(e,{headers:{"Content-Type":"application/pdf","Content-Disposition":`attachment; filename="${i}"`}})}if("FAILED"===a)return n.NextResponse.json({error:"PDF generation failed"},{status:500});u++}return n.NextResponse.json({error:"PDF generation timed out"},{status:500})}catch(e){return console.error("Error generating PDF:",e),n.NextResponse.json({error:"Internal server error"},{status:500})}}let m=new r.AppRouteRouteModule({definition:{kind:s.x.APP_ROUTE,page:"/api/mewp-checks/[id]/pdf/route",pathname:"/api/mewp-checks/[id]/pdf",filename:"route",bundlePath:"app/api/mewp-checks/[id]/pdf/route"},resolvedPagePath:"/Users/adrian/.gemini/antigravity/playground/resonant-armstrong/cortexbuild_final_extracted/nextjs_space/app/api/mewp-checks/[id]/pdf/route.ts",nextConfigOutput:"",userland:a}),{requestAsyncStorage:f,staticGenerationAsyncStorage:g,serverHooks:x}=m,b="/api/mewp-checks/[id]/pdf/route";function y(){return(0,o.patchFetch)({serverHooks:x,staticGenerationAsyncStorage:g})}},10191:(e,i,t)=>{t.d(i,{L:()=>d});var a=t(53797),r=t(13539),s=t(9487),o=t(42023),n=t.n(o);let d={adapter:(0,r.N)(s._B),providers:[(0,a.Z)({name:"credentials",credentials:{email:{label:"Email",type:"email"},password:{label:"Password",type:"password"}},async authorize(e){if(!e?.email||!e?.password)return null;let i=await s._B.user.findUnique({where:{email:e.email},include:{organization:!0}});return i&&await n().compare(e.password,i.password)?(await s._B.user.update({where:{id:i.id},data:{lastLogin:new Date}}),{id:i.id,email:i.email,name:i.name,role:i.role,organizationId:i.organizationId,avatarUrl:i.avatarUrl}):null}})],session:{strategy:"jwt",maxAge:2592e3},callbacks:{jwt:async({token:e,user:i})=>(i&&(e.id=i.id,e.role=i.role,e.organizationId=i.organizationId,e.avatarUrl=i.avatarUrl),e),session:async({session:e,token:i})=>(e.user&&(e.user.id=i.id,e.user.role=i.role,e.user.organizationId=i.organizationId,e.user.avatarUrl=i.avatarUrl),e)},pages:{signIn:"/login"},secret:process.env.NEXTAUTH_SECRET}},9487:(e,i,t)=>{let a;t.d(i,{ZP:()=>n,_B:()=>o});var r=t(53524);let s=globalThis,o=new Proxy({},{get:(e,i,t)=>{if(!a){if("true"===process.env.PRISMA_SKIP_INIT)return()=>{throw Error("Prisma accessed during build-time skip phase")};a=s.prisma??new r.PrismaClient({log:["error"],datasources:{db:{url:function(){let e=process.env.DATABASE_URL||"";if(e&&!e.includes("connection_limit")){let i=e.includes("?")?"&":"?";return`${e}${i}connection_limit=5&pool_timeout=10&connect_timeout=10`}return e}()}}})}return Reflect.get(a,i,t)}}),n=o}};var i=require("../../../../../webpack-runtime.js");i.C(e);var t=e=>i(i.s=e),a=i.X(0,[9276,2776,9637,5972,2771],()=>t(38353));module.exports=a})();