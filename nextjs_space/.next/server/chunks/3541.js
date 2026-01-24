"use strict";exports.id=3541,exports.ids=[3541],exports.modules={10191:(e,t,o)=>{o.d(t,{L:()=>s});var i=o(53797),r=o(13539),a=o(9487),d=o(42023),n=o.n(d);let s={adapter:(0,r.N)(a._B),providers:[(0,i.Z)({name:"credentials",credentials:{email:{label:"Email",type:"email"},password:{label:"Password",type:"password"}},async authorize(e){if(!e?.email||!e?.password)return null;let t=await a._B.user.findUnique({where:{email:e.email},include:{organization:!0}});return t&&await n().compare(e.password,t.password)?(await a._B.user.update({where:{id:t.id},data:{lastLogin:new Date}}),{id:t.id,email:t.email,name:t.name,role:t.role,organizationId:t.organizationId,avatarUrl:t.avatarUrl}):null}})],session:{strategy:"jwt",maxAge:2592e3},callbacks:{jwt:async({token:e,user:t})=>(t&&(e.id=t.id,e.role=t.role,e.organizationId=t.organizationId,e.avatarUrl=t.avatarUrl),e),session:async({session:e,token:t})=>(e.user&&(e.user.id=t.id,e.user.role=t.role,e.user.organizationId=t.organizationId,e.user.avatarUrl=t.avatarUrl),e)},pages:{signIn:"/login"},secret:process.env.NEXTAUTH_SECRET}},9487:(e,t,o)=>{let i;o.d(t,{ZP:()=>n,_B:()=>d});var r=o(53524);let a=globalThis,d=new Proxy({},{get:(e,t,o)=>{if(!i){if("true"===process.env.PRISMA_SKIP_INIT)return()=>{throw Error("Prisma accessed during build-time skip phase")};i=a.prisma??new r.PrismaClient({log:["error"],datasources:{db:{url:function(){let e=process.env.DATABASE_URL||"";if(e&&!e.includes("connection_limit")){let t=e.includes("?")?"&":"?";return`${e}${t}connection_limit=5&pool_timeout=10&connect_timeout=10`}return e}()}}})}return Reflect.get(i,t,o)}}),n=d},66397:(e,t,o)=>{async function i(e,t){try{let o=process.env.NEXTAUTH_URL||"",i=o?new URL(o).hostname.split(".")[0]:"CortexBuild",r=`
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%); padding: 30px; border-radius: 12px 12px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 24px;">✅ Toolbox Talk Completed</h1>
        </div>
        <div style="background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
          <h2 style="color: #1f2937; margin-top: 0;">${e.title}</h2>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #4F46E5;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #6b7280; width: 140px;">Project:</td>
                <td style="padding: 8px 0; font-weight: 600;">${e.projectName}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280;">Topic:</td>
                <td style="padding: 8px 0;">${e.topic||"General Safety"}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280;">Location:</td>
                <td style="padding: 8px 0;">${e.location||"On-site"}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280;">Presenter:</td>
                <td style="padding: 8px 0;">${e.presenterName||"Not specified"}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280;">Attendees:</td>
                <td style="padding: 8px 0; font-weight: 600; color: #4F46E5;">${e.attendeeCount} signed</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280;">Completed:</td>
                <td style="padding: 8px 0;">${e.completedAt.toLocaleString()}</td>
              </tr>
            </table>
          </div>

          <div style="text-align: center; margin-top: 25px;">
            <a href="${o}/projects" style="display: inline-block; background: #4F46E5; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">View in Dashboard</a>
          </div>
          
          <p style="color: #9ca3af; font-size: 12px; margin-top: 30px; text-align: center;">
            This is an automated notification from CortexBuild Pro
          </p>
        </div>
      </div>
    `,a=await fetch("https://apps.abacus.ai/api/sendNotificationEmail",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({deployment_token:process.env.ABACUSAI_API_KEY,app_id:process.env.WEB_APP_ID,notification_id:process.env.NOTIF_ID_TOOLBOX_TALK_COMPLETED,subject:`✅ Toolbox Talk Completed: ${e.title}`,body:r,is_html:!0,recipient_email:t,sender_email:`noreply@${o?new URL(o).hostname:"cortexbuild.app"}`,sender_alias:i})});return await a.json()}catch(e){return console.error("Error sending toolbox talk notification:",e),{success:!1,message:"Failed to send notification"}}}async function r(e,t){try{let o=process.env.NEXTAUTH_URL||"",i=o?new URL(o).hostname.split(".")[0]:"CortexBuild",r="PASS"===e.overallStatus?"#22c55e":"FAIL"===e.overallStatus?"#ef4444":"#f59e0b",a="PASS"===e.overallStatus?"#dcfce7":"FAIL"===e.overallStatus?"#fef2f2":"#fef3c7",d=`
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); padding: 30px; border-radius: 12px 12px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 24px;">🚧 MEWP Inspection Completed</h1>
        </div>
        <div style="background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
            <h2 style="color: #1f2937; margin: 0;">${e.equipmentName}</h2>
            <span style="background: ${a}; color: ${r}; padding: 8px 16px; border-radius: 20px; font-weight: 700;">
              ${e.overallStatus}
            </span>
          </div>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f97316;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #6b7280; width: 140px;">Project:</td>
                <td style="padding: 8px 0; font-weight: 600;">${e.projectName}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280;">Serial Number:</td>
                <td style="padding: 8px 0;">${e.serialNumber||"N/A"}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280;">Operator:</td>
                <td style="padding: 8px 0;">${e.operatorName||"Not specified"}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280;">Check Date:</td>
                <td style="padding: 8px 0;">${e.checkDate.toLocaleString()}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280;">Safe to Use:</td>
                <td style="padding: 8px 0; font-weight: 700; color: ${e.safeToUse?"#22c55e":"#ef4444"};">
                  ${e.safeToUse?"✓ YES":"✗ NO"}
                </td>
              </tr>
            </table>
          </div>

          ${e.defectsFound?`
          <div style="background: #fef2f2; padding: 15px; border-radius: 8px; border-left: 4px solid #ef4444; margin: 20px 0;">
            <strong style="color: #dc2626;">⚠️ Defects Found:</strong>
            <p style="margin: 10px 0 0 0; color: #7f1d1d;">${e.defectsFound}</p>
          </div>
          `:""}

          <div style="text-align: center; margin-top: 25px;">
            <a href="${o}/projects" style="display: inline-block; background: #f97316; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">View Report</a>
          </div>
          
          <p style="color: #9ca3af; font-size: 12px; margin-top: 30px; text-align: center;">
            This is an automated notification from CortexBuild Pro
          </p>
        </div>
      </div>
    `,n=await fetch("https://apps.abacus.ai/api/sendNotificationEmail",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({deployment_token:process.env.ABACUSAI_API_KEY,app_id:process.env.WEB_APP_ID,notification_id:process.env.NOTIF_ID_MEWP_CHECK_COMPLETED,subject:`🚧 MEWP Check ${e.overallStatus}: ${e.equipmentName}`,body:d,is_html:!0,recipient_email:t,sender_email:`noreply@${o?new URL(o).hostname:"cortexbuild.app"}`,sender_alias:i})});return await n.json()}catch(e){return console.error("Error sending MEWP check notification:",e),{success:!1,message:"Failed to send notification"}}}async function a(e,t){try{let o=process.env.NEXTAUTH_URL||"",i=o?new URL(o).hostname.split(".")[0]:"CortexBuild",r="PASS"===e.overallStatus?"#22c55e":"FAIL"===e.overallStatus?"#ef4444":"#f59e0b",a="PASS"===e.overallStatus?"#dcfce7":"FAIL"===e.overallStatus?"#fef2f2":"#fef3c7",d=`
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); padding: 30px; border-radius: 12px 12px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 24px;">🛠️ Tool Inspection Completed</h1>
        </div>
        <div style="background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
            <div>
              <h2 style="color: #1f2937; margin: 0;">${e.toolName}</h2>
              <span style="background: #f3e8ff; color: #7c3aed; padding: 4px 10px; border-radius: 12px; font-size: 12px; font-weight: 600;">
                ${{POWER_TOOL:"Power Tool",HAND_TOOL:"Hand Tool",LADDER:"Ladder",SCAFFOLD:"Scaffold",OTHER:"Other"}[e.toolType]||e.toolType}
              </span>
            </div>
            <span style="background: ${a}; color: ${r}; padding: 8px 16px; border-radius: 20px; font-weight: 700;">
              ${e.overallStatus}
            </span>
          </div>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #8b5cf6;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #6b7280; width: 140px;">Project:</td>
                <td style="padding: 8px 0; font-weight: 600;">${e.projectName}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280;">Serial Number:</td>
                <td style="padding: 8px 0;">${e.serialNumber||"N/A"}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280;">Inspector:</td>
                <td style="padding: 8px 0;">${e.inspectorName||"Not specified"}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280;">Check Date:</td>
                <td style="padding: 8px 0;">${e.checkDate.toLocaleString()}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280;">Safe to Use:</td>
                <td style="padding: 8px 0; font-weight: 700; color: ${e.safeToUse?"#22c55e":"#ef4444"};">
                  ${e.safeToUse?"✓ YES":"✗ NO"}
                </td>
              </tr>
            </table>
          </div>

          ${e.defectsFound?`
          <div style="background: #fef2f2; padding: 15px; border-radius: 8px; border-left: 4px solid #ef4444; margin: 20px 0;">
            <strong style="color: #dc2626;">⚠️ Defects Found:</strong>
            <p style="margin: 10px 0 0 0; color: #7f1d1d;">${e.defectsFound}</p>
          </div>
          `:""}

          <div style="text-align: center; margin-top: 25px;">
            <a href="${o}/projects" style="display: inline-block; background: #8b5cf6; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">View Report</a>
          </div>
          
          <p style="color: #9ca3af; font-size: 12px; margin-top: 30px; text-align: center;">
            This is an automated notification from CortexBuild Pro
          </p>
        </div>
      </div>
    `,n=await fetch("https://apps.abacus.ai/api/sendNotificationEmail",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({deployment_token:process.env.ABACUSAI_API_KEY,app_id:process.env.WEB_APP_ID,notification_id:process.env.NOTIF_ID_TOOL_CHECK_COMPLETED,subject:`🛠️ Tool Check ${e.overallStatus}: ${e.toolName}`,body:d,is_html:!0,recipient_email:t,sender_email:`noreply@${o?new URL(o).hostname:"cortexbuild.app"}`,sender_alias:i})});return await n.json()}catch(e){return console.error("Error sending tool check notification:",e),{success:!1,message:"Failed to send notification"}}}o.d(t,{Jo:()=>i,xX:()=>r,y_:()=>a})},46014:(e,t,o)=>{o.d(t,{B_:()=>n,CG:()=>a,OG:()=>d,ZF:()=>r,dK:()=>l,hi:()=>s});let i=new Map;function r(e,t,o){i.set(e,{controller:t,organizationId:o})}function a(e){i.delete(e)}function d(e,t){let o=JSON.stringify(t);i.forEach((t,r)=>{if(t.organizationId===e)try{t.controller.enqueue(`data: ${o}

`)}catch{i.delete(r)}})}function n(e){let t=JSON.stringify(e);i.forEach((e,o)=>{try{e.controller.enqueue(`data: ${t}

`)}catch{i.delete(o)}})}function s(){return i.size}function l(e){let t=0;return i.forEach(o=>{o.organizationId===e&&t++}),t}}};