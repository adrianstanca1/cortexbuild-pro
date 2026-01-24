"use strict";(()=>{var e={};e.id=3523,e.ids=[3523],e.modules={53524:e=>{e.exports=require("@prisma/client")},20399:e=>{e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},30517:e=>{e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},84770:e=>{e.exports=require("crypto")},33636:(e,t,a)=>{a.r(t),a.d(t,{originalPathname:()=>h,patchFetch:()=>f,requestAsyncStorage:()=>g,routeModule:()=>m,serverHooks:()=>y,staticGenerationAsyncStorage:()=>x});var i={};a.r(i),a.d(i,{POST:()=>u,dynamic:()=>c});var n=a(49303),r=a(88716),o=a(60670),s=a(87070),d=a(9487),p=a(42023),l=a.n(p);let c="force-dynamic";async function u(e){try{let{token:t,password:a}=await e.json();if(!t||!a)return s.NextResponse.json({error:"Token and password are required"},{status:400});if(a.length<8)return s.NextResponse.json({error:"Password must be at least 8 characters"},{status:400});let i=await d._B.teamInvitation.findUnique({where:{token:t},include:{organization:!0,invitedBy:{select:{name:!0,email:!0}}}});if(!i)return s.NextResponse.json({error:"Invalid invitation"},{status:404});if("PENDING"!==i.status)return s.NextResponse.json({error:"This invitation is no longer valid"},{status:410});if(i.expiresAt<new Date)return await d._B.teamInvitation.update({where:{id:i.id},data:{status:"EXPIRED"}}),s.NextResponse.json({error:"Invitation has expired"},{status:410});let n=await d._B.user.findUnique({where:{email:i.email}});if(n){if(n.organizationId!==i.organizationId)return s.NextResponse.json({error:"An account with this email already exists. Please contact support."},{status:409});return s.NextResponse.json({error:"An account with this email already exists. Please login instead."},{status:409})}let r=await l().hash(a,12),o=await d._B.$transaction(async e=>{let t=await e.user.create({data:{email:i.email.toLowerCase(),name:i.name,password:r,role:i.role,organizationId:i.organizationId}});return await e.teamMember.create({data:{userId:t.id,organizationId:i.organizationId,jobTitle:i.jobTitle,department:i.department}}),await e.teamInvitation.update({where:{id:i.id},data:{status:"ACCEPTED",acceptedAt:new Date}}),await e.activityLog.create({data:{action:"Joined the team",entityType:"User",entityId:t.id,entityName:t.name,details:`${i.email} accepted invitation as ${i.role}`,userId:t.id}}),t});try{let e=process.env.NEXTAUTH_URL||"http://localhost:3000";await fetch("https://apps.abacus.ai/api/sendEmail",{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${process.env.ABACUSAI_API_KEY}`},body:JSON.stringify({toEmails:[i.email],subject:`Welcome to ${i.organization.name}!`,body:`
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: linear-gradient(135deg, #059669, #047857); padding: 30px; text-align: center;">
                <h1 style="color: white; margin: 0;">Welcome Aboard!</h1>
              </div>
              <div style="padding: 30px; background: #f9fafb;">
                <p style="font-size: 16px;">Hello <strong>${i.name}</strong>,</p>
                <p style="font-size: 16px;">
                  Your account has been created successfully! You are now a member of 
                  <strong>${i.organization.name}</strong>.
                </p>
                <div style="background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 8px; padding: 20px; margin: 20px 0;">
                  <p style="margin: 0; font-size: 14px;"><strong>Your Details:</strong></p>
                  <p style="margin: 5px 0 0; font-size: 14px;">Email: ${i.email}</p>
                  <p style="margin: 5px 0 0; font-size: 14px;">Role: ${i.role.replace("_"," ")}</p>
                  ${i.jobTitle?`<p style="margin: 5px 0 0; font-size: 14px;">Title: ${i.jobTitle}</p>`:""}
                </div>
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${e}/login" 
                     style="background: #059669; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
                    Login to Your Account
                  </a>
                </div>
              </div>
            </div>
          `})}),await fetch("https://apps.abacus.ai/api/sendEmail",{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${process.env.ABACUSAI_API_KEY}`},body:JSON.stringify({toEmails:[i.invitedBy.email],subject:`${i.name} has joined ${i.organization.name}`,body:`
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: linear-gradient(135deg, #059669, #047857); padding: 30px; text-align: center;">
                <h1 style="color: white; margin: 0;">New Team Member</h1>
              </div>
              <div style="padding: 30px; background: #f9fafb;">
                <p style="font-size: 16px;">Hello <strong>${i.invitedBy.name}</strong>,</p>
                <p style="font-size: 16px;">
                  <strong>${i.name}</strong> (${i.email}) has accepted your invitation 
                  and joined <strong>${i.organization.name}</strong> as a <strong>${i.role.replace("_"," ")}</strong>.
                </p>
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${e}/company/team" 
                     style="background: #059669; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
                    View Team
                  </a>
                </div>
              </div>
            </div>
          `})})}catch(e){console.error("Email sending error:",e)}return s.NextResponse.json({success:!0,message:"Account created successfully",user:{id:o.id,email:o.email,name:o.name,role:o.role}},{status:201})}catch(e){return console.error("Error accepting invitation:",e),s.NextResponse.json({error:"Failed to accept invitation"},{status:500})}}let m=new n.AppRouteRouteModule({definition:{kind:r.x.APP_ROUTE,page:"/api/company/invitations/accept/route",pathname:"/api/company/invitations/accept",filename:"route",bundlePath:"app/api/company/invitations/accept/route"},resolvedPagePath:"/Users/adrian/.gemini/antigravity/playground/resonant-armstrong/cortexbuild_final_extracted/nextjs_space/app/api/company/invitations/accept/route.ts",nextConfigOutput:"",userland:i}),{requestAsyncStorage:g,staticGenerationAsyncStorage:x,serverHooks:y}=m,h="/api/company/invitations/accept/route";function f(){return(0,o.patchFetch)({serverHooks:y,staticGenerationAsyncStorage:x})}},9487:(e,t,a)=>{let i;a.d(t,{ZP:()=>s,_B:()=>o});var n=a(53524);let r=globalThis,o=new Proxy({},{get:(e,t,a)=>{if(!i){if("true"===process.env.PRISMA_SKIP_INIT)return()=>{throw Error("Prisma accessed during build-time skip phase")};i=r.prisma??new n.PrismaClient({log:["error"],datasources:{db:{url:function(){let e=process.env.DATABASE_URL||"";if(e&&!e.includes("connection_limit")){let t=e.includes("?")?"&":"?";return`${e}${t}connection_limit=5&pool_timeout=10&connect_timeout=10`}return e}()}}})}return Reflect.get(i,t,a)}}),s=o}};var t=require("../../../../../webpack-runtime.js");t.C(e);var a=e=>t(t.s=e),i=t.X(0,[9276,2776,5972],()=>a(33636));module.exports=i})();