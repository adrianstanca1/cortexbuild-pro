"use strict";(()=>{var e={};e.id=8946,e.ids=[8946],e.modules={53524:e=>{e.exports=require("@prisma/client")},72934:e=>{e.exports=require("next/dist/client/components/action-async-storage.external.js")},54580:e=>{e.exports=require("next/dist/client/components/request-async-storage.external.js")},45869:e=>{e.exports=require("next/dist/client/components/static-generation-async-storage.external.js")},20399:e=>{e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},30517:e=>{e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},27790:e=>{e.exports=require("assert")},78893:e=>{e.exports=require("buffer")},84770:e=>{e.exports=require("crypto")},17702:e=>{e.exports=require("events")},32615:e=>{e.exports=require("http")},35240:e=>{e.exports=require("https")},86624:e=>{e.exports=require("querystring")},17360:e=>{e.exports=require("url")},21764:e=>{e.exports=require("util")},71568:e=>{e.exports=require("zlib")},15513:(e,t,r)=>{r.r(t),r.d(t,{originalPathname:()=>j,patchFetch:()=>E,requestAsyncStorage:()=>v,routeModule:()=>w,serverHooks:()=>D,staticGenerationAsyncStorage:()=>_});var i={};r.r(i),r.d(i,{GET:()=>b,POST:()=>h,dynamic:()=>y});var a=r(49303),n=r(88716),s=r(60670),o=r(87070),d=r(75571),l=r(10191),p=r(9487),u=r(84142),c=r(79109);function g(e,t){let r=e.getFullYear()-t.getFullYear()||e.getMonth()-t.getMonth()||e.getDate()-t.getDate()||e.getHours()-t.getHours()||e.getMinutes()-t.getMinutes()||e.getSeconds()-t.getSeconds()||e.getMilliseconds()-t.getMilliseconds();return r<0?-1:r>0?1:r}function m(e){return+(0,c.Q)(e)<Date.now()}var x=r(72771),f=r(55606);let y="force-dynamic";async function h(e){try{let t=await (0,d.getServerSession)(l.L);if(!t?.user)return o.NextResponse.json({error:"Unauthorized"},{status:401});let{milestoneId:r,recipientEmail:i}=await e.json();if(!r)return o.NextResponse.json({error:"Milestone ID required"},{status:400});let a=await p._B.milestone.findFirst({where:{id:r,project:{organizationId:t.user.organizationId??""}},include:{project:{select:{id:!0,name:!0,manager:{select:{name:!0,email:!0}}}},createdBy:{select:{name:!0}}}});if(!a)return o.NextResponse.json({error:"Milestone not found"},{status:404});let n=new Date(a.targetDate),s=function(e,t){let r=(0,c.Q)(e),i=(0,c.Q)(t),a=g(r,i),n=Math.abs((0,u.w)(r,i));r.setDate(r.getDate()-a*n);let s=Number(g(r,i)===-a),o=a*(n-s);return 0===o?0:o}(n,new Date),f=m(n)&&"COMPLETED"!==a.status,y=f?"OVERDUE":s<=0?"Due Today":`Due in ${s} days`,h=`
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8fafc; padding: 20px;">
        <div style="background: linear-gradient(135deg, #1e3a5f 0%, #0f172a 100%); padding: 30px; border-radius: 12px 12px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 24px;">Milestone Reminder</h1>
          <p style="color: rgba(255,255,255,0.8); margin: 10px 0 0;">CortexBuild Pro</p>
        </div>
        
        <div style="background: white; padding: 30px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <div style="display: flex; align-items: center; margin-bottom: 20px;">
            <span style="background: ${f?"#dc2626":s<=3?"#f59e0b":"#2563eb"}; color: white; padding: 6px 12px; border-radius: 4px; font-size: 12px; font-weight: bold;">
              ${y}
            </span>
            ${a.isCritical?'<span style="background: #dc2626; color: white; padding: 6px 12px; border-radius: 4px; font-size: 12px; font-weight: bold; margin-left: 8px;">CRITICAL</span>':""}
          </div>

          <h2 style="color: #1e3a5f; margin: 0 0 10px; font-size: 22px;">${a.name}</h2>
          
          ${a.description?`<p style="color: #64748b; margin: 0 0 20px;">${a.description}</p>`:""}

          <div style="background: #f1f5f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #64748b;">Project</td>
                <td style="padding: 8px 0; font-weight: bold; text-align: right;">${a.project.name}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #64748b;">Target Date</td>
                <td style="padding: 8px 0; font-weight: bold; text-align: right;">${(0,x.WU)(n,"MMMM d, yyyy")}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #64748b;">Progress</td>
                <td style="padding: 8px 0; font-weight: bold; text-align: right;">${a.percentComplete}%</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #64748b;">Status</td>
                <td style="padding: 8px 0; font-weight: bold; text-align: right;">${a.status.replace("_"," ")}</td>
              </tr>
            </table>
          </div>

          <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
            <p style="color: #64748b; font-size: 14px; margin: 0;">
              ${f?"This milestone is overdue. Please review and update the status.":"Please ensure this milestone stays on track."}
            </p>
          </div>
        </div>

        <div style="text-align: center; padding: 20px; color: #94a3b8; font-size: 12px;">
          <p>This is an automated reminder from CortexBuild Pro</p>
        </div>
      </div>
    `,b=process.env.NEXTAUTH_URL||"",w=i||a.project.manager?.email||t.user.email,v=await fetch("https://apps.abacus.ai/api/sendNotificationEmail",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({deployment_token:process.env.ABACUSAI_API_KEY,app_id:process.env.WEB_APP_ID,notification_id:process.env.NOTIF_ID_MILESTONE_DEADLINE_REMINDER,subject:`${f?"[OVERDUE]":"[Reminder]"} Milestone: ${a.name}`,body:h,is_html:!0,recipient_email:w,sender_email:b?`noreply@${new URL(b).hostname}`:void 0,sender_alias:"CortexBuild Pro"})}),_=await v.json();if(!_.success){if(_.notification_disabled)return o.NextResponse.json({success:!0,message:"Notification disabled by user"});throw Error(_.message||"Failed to send notification")}return await p._B.activityLog.create({data:{action:"milestone_notification_sent",entityType:"Milestone",entityId:a.id,entityName:a.name,details:`Reminder sent to ${w}`,userId:t.user.id,projectId:a.projectId}}),o.NextResponse.json({success:!0,message:"Notification sent"})}catch(e){return console.error("Error sending milestone notification:",e),o.NextResponse.json({error:"Failed to send notification"},{status:500})}}async function b(e){try{let e=await (0,d.getServerSession)(l.L);if(!e?.user)return o.NextResponse.json({error:"Unauthorized"},{status:401});let t=new Date,r=(0,f.E)(t,7),i=await p._B.milestone.findMany({where:{project:{organizationId:e.user.organizationId??""},status:{notIn:["COMPLETED"]},targetDate:{lte:r}},include:{project:{select:{id:!0,name:!0}}},orderBy:{targetDate:"asc"}}),a={overdue:i.filter(e=>m(new Date(e.targetDate))),dueToday:i.filter(e=>new Date(e.targetDate).toDateString()===t.toDateString()),upcoming:i.filter(e=>{let i=new Date(e.targetDate);return i>t&&i<=r})};return o.NextResponse.json(a)}catch(e){return console.error("Error fetching milestone status:",e),o.NextResponse.json({error:"Failed to fetch milestones"},{status:500})}}let w=new a.AppRouteRouteModule({definition:{kind:n.x.APP_ROUTE,page:"/api/milestones/notify/route",pathname:"/api/milestones/notify",filename:"route",bundlePath:"app/api/milestones/notify/route"},resolvedPagePath:"/Users/adrian/.gemini/antigravity/playground/resonant-armstrong/cortexbuild_final_extracted/nextjs_space/app/api/milestones/notify/route.ts",nextConfigOutput:"",userland:i}),{requestAsyncStorage:v,staticGenerationAsyncStorage:_,serverHooks:D}=w,j="/api/milestones/notify/route";function E(){return(0,s.patchFetch)({serverHooks:D,staticGenerationAsyncStorage:_})}},10191:(e,t,r)=>{r.d(t,{L:()=>d});var i=r(53797),a=r(13539),n=r(9487),s=r(42023),o=r.n(s);let d={adapter:(0,a.N)(n._B),providers:[(0,i.Z)({name:"credentials",credentials:{email:{label:"Email",type:"email"},password:{label:"Password",type:"password"}},async authorize(e){if(!e?.email||!e?.password)return null;let t=await n._B.user.findUnique({where:{email:e.email},include:{organization:!0}});return t&&await o().compare(e.password,t.password)?(await n._B.user.update({where:{id:t.id},data:{lastLogin:new Date}}),{id:t.id,email:t.email,name:t.name,role:t.role,organizationId:t.organizationId,avatarUrl:t.avatarUrl}):null}})],session:{strategy:"jwt",maxAge:2592e3},callbacks:{jwt:async({token:e,user:t})=>(t&&(e.id=t.id,e.role=t.role,e.organizationId=t.organizationId,e.avatarUrl=t.avatarUrl),e),session:async({session:e,token:t})=>(e.user&&(e.user.id=t.id,e.user.role=t.role,e.user.organizationId=t.organizationId,e.user.avatarUrl=t.avatarUrl),e)},pages:{signIn:"/login"},secret:process.env.NEXTAUTH_SECRET}},9487:(e,t,r)=>{let i;r.d(t,{ZP:()=>o,_B:()=>s});var a=r(53524);let n=globalThis,s=new Proxy({},{get:(e,t,r)=>{if(!i){if("true"===process.env.PRISMA_SKIP_INIT)return()=>{throw Error("Prisma accessed during build-time skip phase")};i=n.prisma??new a.PrismaClient({log:["error"],datasources:{db:{url:function(){let e=process.env.DATABASE_URL||"";if(e&&!e.includes("connection_limit")){let t=e.includes("?")?"&":"?";return`${e}${t}connection_limit=5&pool_timeout=10&connect_timeout=10`}return e}()}}})}return Reflect.get(i,t,r)}}),o=s},55606:(e,t,r)=>{r.d(t,{E:()=>n});var i=r(79109),a=r(44549);function n(e,t){let r=(0,i.Q)(e);return isNaN(t)?(0,a.L)(e,NaN):(t&&r.setDate(r.getDate()+t),r)}}};var t=require("../../../../webpack-runtime.js");t.C(e);var r=e=>t(t.s=e),i=t.X(0,[9276,2776,9637,5972,2771],()=>r(15513));module.exports=i})();