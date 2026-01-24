"use strict";exports.id=1947,exports.ids=[1947],exports.modules={25502:(e,t,r)=>{r.d(t,{Cz:()=>o,EG:()=>i,SA:()=>a});var n=r(91471),s=r(45603);async function o(e){if(await (0,s.xi)("sendgrid"))try{let t=new n.mu,r=await t.sendEmail({to:e.to,subject:e.subject,html:e.html,text:e.text,from:e.from,replyTo:e.replyTo});if(r.success)return{success:!0,provider:"sendgrid"};console.warn("SendGrid email failed, trying fallback:",r.error)}catch(e){console.warn("SendGrid adapter error, trying fallback:",e)}if(process.env.ABACUSAI_API_KEY)try{let t=Array.isArray(e.to)?e.to:[e.to],r=await fetch("https://apps.abacus.ai/api/sendNotificationEmail",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({deployment_token:process.env.ABACUSAI_API_KEY,subject:e.subject,body:e.html,is_html:!0,recipient_email:t[0],sender_alias:e.from?.name||"CortexBuild Pro"})});if(r.ok)return{success:!0,provider:"abacus"};let n=await r.text();return console.error("Abacus email API failed:",n),{success:!1,provider:"abacus",error:`Abacus API error: ${r.status}`}}catch(e){return console.error("Abacus email API error:",e),{success:!1,provider:"abacus",error:e instanceof Error?e.message:"Unknown error"}}return{success:!1,provider:"none",error:"No email provider configured. Please configure SendGrid in API Management or ensure ABACUSAI_API_KEY is set."}}function a(e){return`
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #7c3aed; margin: 0;">CortexBuild Pro</h1>
        <p style="color: #6b7280; margin: 5px 0;">Construction Management Platform</p>
      </div>
      
      <h2 style="color: #1f2937; border-bottom: 2px solid #7c3aed; padding-bottom: 10px;">
        Welcome, ${e.ownerName}!
      </h2>
      
      <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
        You have been invited to join <strong>CortexBuild Pro</strong> as the owner of <strong>${e.companyName}</strong>.
      </p>
      
      <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 25px 0;">
        <h3 style="color: #374151; margin-top: 0;">Your Company Details</h3>
        <p style="margin: 8px 0;"><strong>Company:</strong> ${e.companyName}</p>
        <p style="margin: 8px 0;"><strong>Your Name:</strong> ${e.ownerName}</p>
        <p style="margin: 8px 0;"><strong>Email:</strong> ${e.ownerEmail}</p>
        <p style="margin: 8px 0;"><strong>Storage Limit:</strong> ${e.storageGB} GB</p>
        <p style="margin: 8px 0;"><strong>Max Users:</strong> ${e.maxUsers}</p>
      </div>
      
      <div style="background: #ede9fe; padding: 20px; border-radius: 8px; margin: 25px 0;">
        <h3 style="color: #5b21b6; margin-top: 0;">Enabled Features</h3>
        <ul style="color: #4b5563; padding-left: 20px;">
          ${e.enabledModules.map(e=>`<li style="margin: 5px 0;">${e}</li>`).join("")}
        </ul>
      </div>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${e.acceptUrl}" style="background: #7c3aed; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
          Accept Invitation & Set Password
        </a>
      </div>
      
      <p style="color: #9ca3af; font-size: 14px; text-align: center;">
        This invitation expires on ${e.expiresAt.toLocaleDateString("en-US",{weekday:"long",year:"numeric",month:"long",day:"numeric"})}.
      </p>
      
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;" />
      
      <p style="color: #9ca3af; font-size: 12px; text-align: center;">
        If you did not expect this invitation, please ignore this email.
      </p>
    </div>
  `}function i(e){return`
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #059669, #047857); padding: 30px; text-align: center;">
        <h1 style="color: white; margin: 0;">Team Invitation</h1>
      </div>
      <div style="padding: 30px; background: #f9fafb;">
        <p style="font-size: 16px;">Hello <strong>${e.memberName}</strong>,</p>
        <p style="font-size: 16px;">
          <strong>${e.inviterName}</strong> has invited you to join 
          <strong>${e.organizationName}</strong> as a <strong>${e.role.replace("_"," ")}</strong>.
        </p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${e.acceptUrl}" 
             style="background: #059669; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
            Accept Invitation
          </a>
        </div>
        <p style="color: #6b7280; font-size: 14px;">
          This invitation will expire in 7 days.
        </p>
        <p style="color: #6b7280; font-size: 12px; margin-top: 30px;">
          If you didn't expect this invitation, you can safely ignore this email.
        </p>
      </div>
    </div>
  `}},42345:(e,t,r)=>{r.d(t,{GD:()=>o,Rb:()=>s,af:()=>n});let n={modules:{projects:!0,tasks:!0,documents:!0,rfis:!0,submittals:!0,changeOrders:!0,dailyReports:!0,safety:!0,reports:!0,team:!0,punchLists:!0,inspections:!0,equipment:!0,meetings:!0},limits:{storageGB:10,maxUsers:50,maxProjects:100}};function s(e){if(!e)return n;try{let t="string"==typeof e?JSON.parse(e):e;return{modules:{...n.modules,...t.modules||{}},limits:{...n.limits,...t.limits||{}}}}catch(e){return console.error("Error parsing entitlements:",e),n}}function o(e){return e.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"").substring(0,50)}},91471:(e,t,r)=>{r.d(t,{L:()=>a,Ny:()=>l,lT:()=>o,mu:()=>s,nH:()=>i});var n=r(45603);class s{constructor(e="PRODUCTION"){this.environment=e}async sendEmail(e){let t=Date.now(),r=await (0,n.jt)("sendgrid",this.environment);if(!r)return{success:!1,error:"SendGrid is not configured. Please configure it in the API Management dashboard."};let{apiKey:s,fromEmail:o,fromName:a}=r.credentials;try{let i=Array.isArray(e.to)?e.to:[e.to],c={personalizations:[{to:i.map(e=>({email:e}))}],from:{email:e.from?.email||o||"noreply@cortexbuild.com",name:e.from?.name||a||"CortexBuild Pro"},subject:e.subject};e.templateId?(c.template_id=e.templateId,e.dynamicTemplateData&&(c.personalizations[0].dynamic_template_data=e.dynamicTemplateData)):(c.content=[],e.text&&c.content.push({type:"text/plain",value:e.text}),e.html&&c.content.push({type:"text/html",value:e.html})),e.replyTo&&(c.reply_to=e.replyTo),e.attachments&&(c.attachments=e.attachments);let l=await fetch("https://api.sendgrid.com/v3/mail/send",{method:"POST",headers:{Authorization:`Bearer ${s}`,"Content-Type":"application/json"},body:JSON.stringify(c)}),d=Date.now()-t,u=l.status>=200&&l.status<300;if(await (0,n.dX)(r.connectionId,"send_email",{to:i,subject:e.subject},u,d,u?void 0:`HTTP ${l.status}`),!u){let e=await l.text();return{success:!1,error:`SendGrid API error: ${l.status} - ${e}`,statusCode:l.status,responseTime:d}}return{success:!0,statusCode:l.status,responseTime:d}}catch(a){let s=Date.now()-t,o=a instanceof Error?a.message:"Unknown error";return r.connectionId&&await (0,n.dX)(r.connectionId,"send_email",{to:e.to,subject:e.subject},!1,s,o),{success:!1,error:o,responseTime:s}}}async testConnection(){let e=Date.now(),t=await (0,n.jt)("sendgrid",this.environment);if(!t)return{success:!1,error:"SendGrid is not configured"};try{let r=await fetch("https://api.sendgrid.com/v3/verified_senders",{method:"GET",headers:{Authorization:`Bearer ${t.credentials.apiKey}`,"Content-Type":"application/json"}}),n=Date.now()-e,s=200===r.status;return{success:s,statusCode:r.status,responseTime:n,error:s?void 0:`HTTP ${r.status}`}}catch(t){return{success:!1,error:t instanceof Error?t.message:"Connection failed",responseTime:Date.now()-e}}}}class o{constructor(e="PRODUCTION"){this.environment=e}async complete(e){let t=Date.now(),r=await (0,n.jt)("openai",this.environment);if(!r)return{success:!1,error:"AI service is not configured. Please configure it in the API Management dashboard."};let{apiKey:s,model:o,organizationId:a}=r.credentials;try{let i={Authorization:`Bearer ${s}`,"Content-Type":"application/json"};a&&(i["OpenAI-Organization"]=a);let c=e.messages||[{role:"user",content:e.prompt||""}],l=await fetch("https://api.openai.com/v1/chat/completions",{method:"POST",headers:i,body:JSON.stringify({model:e.model||o||"gpt-4",messages:c,max_tokens:e.maxTokens||2048,temperature:e.temperature??.7})}),d=Date.now()-t;if(200!==l.status){let t=await l.text();return await (0,n.dX)(r.connectionId,"completion",{model:e.model||o},!1,d,`HTTP ${l.status}`),{success:!1,error:t,statusCode:l.status,responseTime:d}}let u=await l.json(),p=u.choices?.[0]?.message?.content||"";return await (0,n.dX)(r.connectionId,"completion",{model:e.model||o,tokens:u.usage?.total_tokens},!0,d),{success:!0,data:p,responseTime:d}}catch(r){let e=Date.now()-t;return{success:!1,error:r instanceof Error?r.message:"Unknown error",responseTime:e}}}async testConnection(){let e=Date.now(),t=await (0,n.jt)("openai",this.environment);if(!t)return{success:!1,error:"AI service is not configured"};try{let r=await fetch("https://api.openai.com/v1/models",{headers:{Authorization:`Bearer ${t.credentials.apiKey}`}});return{success:200===r.status,statusCode:r.status,responseTime:Date.now()-e}}catch(t){return{success:!1,error:t instanceof Error?t.message:"Connection failed",responseTime:Date.now()-e}}}}class a{constructor(e="PRODUCTION"){this.environment=e}async sendSms(e){let t=Date.now(),r=await (0,n.jt)("twilio",this.environment);if(!r)return{success:!1,error:"Twilio is not configured. Please configure it in the API Management dashboard."};let{accountSid:s,authToken:o,phoneNumber:a}=r.credentials;try{let i=await fetch(`https://api.twilio.com/2010-04-01/Accounts/${s}/Messages.json`,{method:"POST",headers:{Authorization:`Basic ${Buffer.from(`${s}:${o}`).toString("base64")}`,"Content-Type":"application/x-www-form-urlencoded"},body:new URLSearchParams({To:e.to,From:e.from||a||"",Body:e.body})}),c=Date.now()-t,l=i.status>=200&&i.status<300;return await (0,n.dX)(r.connectionId,"send_sms",{to:e.to},l,c,l?void 0:`HTTP ${i.status}`),{success:l,statusCode:i.status,responseTime:c}}catch(e){return{success:!1,error:e instanceof Error?e.message:"Unknown error",responseTime:Date.now()-t}}}async testConnection(){let e=Date.now(),t=await (0,n.jt)("twilio",this.environment);if(!t)return{success:!1,error:"Twilio is not configured"};let{accountSid:r,authToken:s}=t.credentials;try{let t=await fetch(`https://api.twilio.com/2010-04-01/Accounts/${r}.json`,{headers:{Authorization:`Basic ${Buffer.from(`${r}:${s}`).toString("base64")}`}});return{success:200===t.status,statusCode:t.status,responseTime:Date.now()-e}}catch(t){return{success:!1,error:t instanceof Error?t.message:"Connection failed",responseTime:Date.now()-e}}}}class i{constructor(e="PRODUCTION"){this.environment=e}async testConnection(){let e=Date.now(),t=await (0,n.jt)("stripe",this.environment);if(!t)return{success:!1,error:"Stripe is not configured"};try{let r=await fetch("https://api.stripe.com/v1/balance",{headers:{Authorization:`Bearer ${t.credentials.secretKey}`}});return{success:200===r.status,statusCode:r.status,responseTime:Date.now()-e}}catch(t){return{success:!1,error:t instanceof Error?t.message:"Connection failed",responseTime:Date.now()-e}}}}class c{constructor(e,t="PRODUCTION"){this.serviceId=e,this.environment=t}async request(e,t="GET",r,s){let o=Date.now(),a=await (0,n.jt)(this.serviceId,this.environment);if(!a)return{success:!1,error:`Service '${this.serviceId}' is not configured`};try{let i;let c={"Content-Type":"application/json",...s};a.credentials.apiKey?c.Authorization=`Bearer ${a.credentials.apiKey}`:a.credentials.secretKey&&(c.Authorization=`Bearer ${a.credentials.secretKey}`);let l=a.baseUrl?`${a.baseUrl}${e}`:e,d=await fetch(l,{method:t,headers:c,body:r?JSON.stringify(r):void 0}),u=Date.now()-o,p=d.status>=200&&d.status<300;try{i=await d.json()}catch{i=await d.text()}return await (0,n.dX)(a.connectionId,`${t} ${e}`,{statusCode:d.status},p,u,p?void 0:`HTTP ${d.status}`),{success:p,data:i,statusCode:d.status,responseTime:u}}catch(e){return{success:!1,error:e instanceof Error?e.message:"Unknown error",responseTime:Date.now()-o}}}async testConnection(){return await (0,n.jt)(this.serviceId,this.environment)?this.request("/","GET"):{success:!1,error:"Not configured"}}}function l(e,t="PRODUCTION"){switch(e.toLowerCase()){case"sendgrid":return new s(t);case"openai":return new o(t);case"twilio":return new a(t);case"stripe":return new i(t);default:return new c(e,t)}}}};