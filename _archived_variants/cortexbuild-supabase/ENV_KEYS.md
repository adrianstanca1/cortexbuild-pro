# Environment Variables Reference

## Required (Frontend)
- VITE_SUPABASE_URL
- VITE_SUPABASE_ANON_KEY

## Optional (Frontend AI)
- VITE_GEMINI_API_KEY

## Backend/Server (if using server utilities)
- PORT
- DATABASE_URL
- SUPABASE_URL
- SUPABASE_ANON_KEY
- SUPABASE_SERVICE_ROLE_KEY (server-side only)
- VITE_SUPABASE_URL (alternative read path)
- VITE_SUPABASE_ANON_KEY (alternative read path)

## Third-party (seen in code/tests; enable only if used)
- GEMINI_API_KEY
- OPENAI_API_KEY
- TWILIO_ACCOUNT_SID
- TWILIO_AUTH_TOKEN
- TWILIO_PHONE_NUMBER
- SENDGRID_API_KEY
- FROM_EMAIL
- NEXTAUTH_URL
- GOOGLE_APPLICATION_CREDENTIALS (server file path)
- AWS_REGION
- AWS_ACCESS_KEY_ID
- AWS_SECRET_ACCESS_KEY
- VITE_GOOGLE_CLOUD_VISION_API_KEY
- VITE_GOOGLE_CLOUD_DOCUMENT_AI_API_KEY
- VITE_GOOGLE_CLOUD_PROJECT_ID
- VITE_GOOGLE_CLOUD_LOCATION
- VITE_GOOGLE_CLOUD_PROCESSOR_ID
- VITE_AZURE_FORM_RECOGNIZER_ENDPOINT
- VITE_AZURE_FORM_RECOGNIZER_KEY
- VITE_OPENAI_API_KEY

## Internal API (server-only JWT usage in /api/* routes)
- JWT_SECRET (default fallback in code: cortexbuild-secret-2025)

## Notes
- Define frontend vars with VITE_ prefix to expose in the browser.
- Do not commit real secrets. Use deployment provider’s env settings for production.
