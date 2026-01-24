"use strict";(()=>{var e={};e.id=7884,e.ids=[7884],e.modules={53524:e=>{e.exports=require("@prisma/client")},20399:e=>{e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},30517:e=>{e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},84770:e=>{e.exports=require("crypto")},92655:(e,t,a)=>{a.r(t),a.d(t,{originalPathname:()=>f,patchFetch:()=>w,requestAsyncStorage:()=>y,routeModule:()=>g,serverHooks:()=>h,staticGenerationAsyncStorage:()=>x});var i={};a.r(i),a.d(i,{POST:()=>u,dynamic:()=>m});var n=a(49303),r=a(88716),o=a(60670),s=a(87070),l=a(9487),p=a(42345),d=a(42023),c=a.n(d);let m="force-dynamic";async function u(e){try{let{token:t,password:a,confirmPassword:i}=await e.json();if(!t||!a)return s.NextResponse.json({error:"Token and password are required"},{status:400});if(a!==i)return s.NextResponse.json({error:"Passwords do not match"},{status:400});if(a.length<8)return s.NextResponse.json({error:"Password must be at least 8 characters"},{status:400});let n=await l._B.companyInvitation.findUnique({where:{token:t}});if(!n)return s.NextResponse.json({error:"Invalid invitation token"},{status:404});if("ACCEPTED"===n.status)return s.NextResponse.json({error:"This invitation has already been accepted"},{status:400});if("REVOKED"===n.status)return s.NextResponse.json({error:"This invitation has been revoked"},{status:400});if(new Date>n.expiresAt)return await l._B.companyInvitation.update({where:{id:n.id},data:{status:"EXPIRED"}}),s.NextResponse.json({error:"This invitation has expired"},{status:400});if(await l._B.user.findUnique({where:{email:n.ownerEmail}}))return s.NextResponse.json({error:"A user with this email already exists"},{status:400});let r=(0,p.GD)(n.companyName),o=0;for(;await l._B.organization.findUnique({where:{slug:r}});)o++,r=`${(0,p.GD)(n.companyName)}-${o}`;let d=await c().hash(a,12),m=await l._B.$transaction(async e=>{let t=await e.organization.create({data:{name:n.companyName,slug:r,entitlements:n.entitlements,isActive:!0}}),a=await e.user.create({data:{email:n.ownerEmail,password:d,name:n.ownerName,phone:n.ownerPhone,role:"COMPANY_OWNER",organizationId:t.id}});await e.teamMember.create({data:{userId:a.id,organizationId:t.id,jobTitle:"Company Owner",department:"Management"}});let i=await e.companyInvitation.update({where:{id:n.id},data:{status:"ACCEPTED",acceptedAt:new Date,organizationId:t.id}});return await e.activityLog.create({data:{action:"Company Onboarded",entityType:"Organization",entityId:t.id,entityName:t.name,details:`${a.name} accepted invitation and created ${t.name}`,userId:a.id}}),{organization:t,user:a,invitation:i}});try{let e=process.env.NEXTAUTH_URL||"http://localhost:3000",t=`${e}/login`,a=`
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #7c3aed; margin: 0;">CortexBuild Pro</h1>
            <p style="color: #6b7280; margin: 5px 0;">Construction Management Platform</p>
          </div>
          
          <h2 style="color: #1f2937; border-bottom: 2px solid #22c55e; padding-bottom: 10px;">
            🎉 Welcome to CortexBuild Pro!
          </h2>
          
          <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
            Congratulations, ${m.user.name}! Your company <strong>${m.organization.name}</strong> has been successfully created.
          </p>
          
          <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #22c55e;">
            <h3 style="color: #166534; margin-top: 0;">Your Account Details</h3>
            <p style="margin: 8px 0;"><strong>Email:</strong> ${m.user.email}</p>
            <p style="margin: 8px 0;"><strong>Company:</strong> ${m.organization.name}</p>
            <p style="margin: 8px 0;"><strong>Role:</strong> Company Owner</p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${t}" style="background: #7c3aed; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
              Login to Your Dashboard
            </a>
          </div>
          
          <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 25px 0;">
            <h3 style="color: #374151; margin-top: 0;">Getting Started</h3>
            <ol style="color: #4b5563; padding-left: 20px;">
              <li style="margin: 8px 0;">Login with your email and password</li>
              <li style="margin: 8px 0;">Create your first project</li>
              <li style="margin: 8px 0;">Invite team members</li>
              <li style="margin: 8px 0;">Start managing your construction workflow</li>
            </ol>
          </div>
          
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;" />
          
          <p style="color: #9ca3af; font-size: 12px; text-align: center;">
            Thank you for choosing CortexBuild Pro!
          </p>
        </div>
      `;await fetch("https://apps.abacus.ai/api/sendNotificationEmail",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({deployment_token:process.env.ABACUSAI_API_KEY,subject:`Welcome to CortexBuild Pro - ${m.organization.name}`,body:a,is_html:!0,recipient_email:m.user.email,sender_alias:"CortexBuild Pro"})})}catch(e){console.error("Failed to send welcome email:",e)}try{let e=`
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #7c3aed;">New Company Onboarded</h2>
          <p><strong>Company:</strong> ${m.organization.name}</p>
          <p><strong>Owner:</strong> ${m.user.name} (${m.user.email})</p>
          <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
        </div>
      `;await fetch("https://apps.abacus.ai/api/sendNotificationEmail",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({deployment_token:process.env.ABACUSAI_API_KEY,subject:`[Admin] New Company: ${m.organization.name}`,body:e,is_html:!0,recipient_email:"adrian.stanca1@gmail.com",sender_alias:"CortexBuild Pro Admin"})})}catch(e){console.error("Failed to notify admin:",e)}return s.NextResponse.json({success:!0,message:"Account created successfully",organization:{id:m.organization.id,name:m.organization.name,slug:m.organization.slug}})}catch(e){return console.error("Error accepting invitation:",e),s.NextResponse.json({error:"Failed to accept invitation"},{status:500})}}let g=new n.AppRouteRouteModule({definition:{kind:r.x.APP_ROUTE,page:"/api/invitations/accept/route",pathname:"/api/invitations/accept",filename:"route",bundlePath:"app/api/invitations/accept/route"},resolvedPagePath:"/Users/adrian/.gemini/antigravity/playground/resonant-armstrong/cortexbuild_final_extracted/nextjs_space/app/api/invitations/accept/route.ts",nextConfigOutput:"",userland:i}),{requestAsyncStorage:y,staticGenerationAsyncStorage:x,serverHooks:h}=g,f="/api/invitations/accept/route";function w(){return(0,o.patchFetch)({serverHooks:h,staticGenerationAsyncStorage:x})}},9487:(e,t,a)=>{let i;a.d(t,{ZP:()=>s,_B:()=>o});var n=a(53524);let r=globalThis,o=new Proxy({},{get:(e,t,a)=>{if(!i){if("true"===process.env.PRISMA_SKIP_INIT)return()=>{throw Error("Prisma accessed during build-time skip phase")};i=r.prisma??new n.PrismaClient({log:["error"],datasources:{db:{url:function(){let e=process.env.DATABASE_URL||"";if(e&&!e.includes("connection_limit")){let t=e.includes("?")?"&":"?";return`${e}${t}connection_limit=5&pool_timeout=10&connect_timeout=10`}return e}()}}})}return Reflect.get(i,t,a)}}),s=o},42345:(e,t,a)=>{a.d(t,{GD:()=>r,Rb:()=>n,af:()=>i});let i={modules:{projects:!0,tasks:!0,documents:!0,rfis:!0,submittals:!0,changeOrders:!0,dailyReports:!0,safety:!0,reports:!0,team:!0,punchLists:!0,inspections:!0,equipment:!0,meetings:!0},limits:{storageGB:10,maxUsers:50,maxProjects:100}};function n(e){if(!e)return i;try{let t="string"==typeof e?JSON.parse(e):e;return{modules:{...i.modules,...t.modules||{}},limits:{...i.limits,...t.limits||{}}}}catch(e){return console.error("Error parsing entitlements:",e),i}}function r(e){return e.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"").substring(0,50)}}};var t=require("../../../../webpack-runtime.js");t.C(e);var a=e=>t(t.s=e),i=t.X(0,[9276,2776,5972],()=>a(92655));module.exports=i})();