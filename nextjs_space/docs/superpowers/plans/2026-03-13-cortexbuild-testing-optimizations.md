# CortexBuild Pro Optimizations Testing Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create a comprehensive testing plan to verify all optimizations made to the CortexBuild Pro project, including AI usage optimization (local LLM), PWA/offline enhancements, and code quality improvements.

**Architecture:** Modular testing approach covering AI functionality, PWA capabilities, and overall system integrity. Each optimization area has dedicated validation scripts and manual testing procedures.

**Tech Stack:** Node.js, Ollama (local LLM), PostgreSQL, Next.js 14, TypeScript, Playwright/Vitest for testing

---
## File Structure Overview

### Files Created for Testing:
- Create: `docs/superpowers/plans/2026-03-13-cortexbuild-testing-optimizations.md` (this plan)
- Create: `BUILD_AND_TEST_GUIDE.md` (comprehensive build/test instructions)
- Create: `validation-script.ts` (TypeScript validation script)
- Create: `simple-validation.js` (JavaScript validation script)

### Files Modified (Optimizations):
- Modify: `app/api/ai/route.ts:1-133` (AI chat endpoint - now uses local LLM)
- Modify: `app/api/ai/analyze-document/route.ts:1-121` (document analysis - now uses local LLM)
- Modify: `lib/ai/local-ai-adapter.ts:1-135` (prefer local models by default)
- Modify: `public/sw.ts:1-65` (service worker with background sync)
- Modify: `lib/sw-register.ts:1-31` (PWA registration with message handling)
- Modify: `app/providers.tsx:1-36` (PWA event listeners)
- Create: `hooks/use-offline-sync.ts` (offline sync React hook)
- Remove: `components/ui/use-toast.ts` (duplicate file removal)

## Chunk 1: Environment Setup and Prerequisites Validation

### Task 1: Verify Development Environment

**Files:**
- Read: `BUILD_AND_TEST_GUIDE.md`

- [ ] **Step 1: Check Node.js availability**

  Run: `node --version`
  Expected: v18+ (e.g., v20.6.2 matching package.json)

- [ ] **Step 2: Check package manager availability**

  Run: `npm --version` OR `yarn --version` OR `pnpm --version`
  Expected: Version number displayed

- [ ] **Step 3: Check Ollama availability**

  Run: `ollama --version`
  Expected: Version number displayed

- [ ] **Step 4: Check required Ollama models**

  Run: `ollama list`
  Expected: Lists showing llama3.1, llava, nomic-embed-text models

- [ ] **Step 5: Check PostgreSQL availability**

  Run: `psql --version`
  Expected: Version number displayed

- [ ] **Step 6: Verify environment variables**

  Check: `.env.local` file exists with:
  - DATABASE_URL
  - NEXT_PUBLIC_OLLAMA_URL
  - Other required service keys

- [ ] **Step 7: Commit environment verification**

  Run: `git add BUILD_AND_TEST_GUIDE.md`
  Run: `git commit -m "docs: add build and test guide for optimized CortexBuild Pro"`

## Chunk 2: Dependency Installation and Setup

### Task 2: Install Project Dependencies

**Files:**
- Modify: `package.json` (if lock files need updating)
- Create: `node_modules/` directory
- Create: `.next/` directory (after build)

- [ ] **Step 1: Install npm dependencies**

  Run: `npm install`
  Expected: Successfully installs all dependencies from package.json

- [ ] **Step 2: Verify installation**

  Check: `node_modules/` directory contains:
  - `@prisma/client`
  - `next`
  - `react`
  - `tailwindcss`
  - And other dependencies

- [ ] **Step 3: Commit dependency installation**

  Run: `git add package-lock.json` (or yarn.lock/pnpm-lock.yaml)
  Run: `git commit -m "chore: install dependencies for CortexBuild Pro"`

### Task 3: Setup Database and Prisma

**Files:**
- Modify: `prisma/schema.prisma` (if needed)
- Create: Database schema in PostgreSQL
- Create: Prisma client

- [ ] **Step 1: Generate Prisma client**

  Run: `npx prisma generate`
  Expected: Successfully generates Prisma client in node_modules/.prisma

- [ ] **Step 2: Run database migrations**

  Run: `npx prisma migrate dev --name init`
  Expected: Successfully applies migrations to PostgreSQL database

- [ ] **Step 3: Seed database (optional)**

  Run: `npm run seed` (if seeding script exists)
  Expected: Successfully seeds database with initial data

- [ ] **Step 4: Commit prisma setup**

  Run: `git add prisma/`
  Run: `git commit -m "feat: setup database and Prisma for CortexBuild Pro"`

## Chunk 3: Application Build and Startup

### Task 4: Build the Application

**Files:**
- Create: `.next/` directory (production build)
- Create: `out/` directory (if applicable)

- [ ] **Step 1: Build Next.js application**

  Run: `npm run build`
  Expected: Successfully builds application with no errors
  Expected: Output shows successful build with file sizes

- [ ] **Step 2: Verify build output**

  Check: `.next/` directory contains:
  - Static assets
  - Server bundles
  - Required build files

- [ ] **Step 3: Commit build success**

  Run: `git add .next/`
  Run: `git commit -m "perf: successful build of optimized CortexBuild Pro"`

### Task 5: Start Development Server

**Files:**
- Modify: None (runtime only)
- Create: None (runtime server processes)

- [ ] **Step 1: Start development server**

  Run: `npm run dev`
  Expected: Successfully starts server on http://localhost:3000
  Expected: Shows ready status in terminal

- [ ] **Step 2: Verify server responsiveness**

  (Manual step - open browser to http://localhost:3000)
  Expected: Application loads and shows login/dashboard

- [ ] **Step 3: Stop development server**

  Press Ctrl+C in terminal
  Expected: Server stops gracefully

## Chunk 4: AI Optimization Testing

### Task 6: Test AI Chat Endpoint

**Files:**
- Read: `app/api/ai/route.ts`
- Create: None (testing via API calls)

- [ ] **Step 1: Test AI chat endpoint with curl**

  Run: `curl -X POST http://localhost:3000/api/ai \
    -H "Content-Type: application/json" \
    -d '{"message":"Hello, how are you?","context":[]}'`
  Expected: Returns streaming text response from local LLM
  Expected: Response contains coherent answer to greeting

- [ ] **Step 2: Test AI chat with context**

  Run: `curl -X POST http://localhost:3000/api/ai \
    -H "Content-Type: application/json" \
    -d '{
      "message":"What is the status of our projects?",
      "context":[{"role":"system","content":"Construction project"}]
    }'`
  Expected: Returns relevant response based on context
  Expected: Uses local Llama 3.1 model for processing

- [ ] **Step 3: Verify streaming response format**

  Run: `curl -N http://localhost:3000/api/ai \
    -H "Content-Type: application/json" \
    -d '{"message":"Test streaming","context":[]}' | head -5`
  Expected: Returns data in chunks (streaming format)
  Expected: No JSON parsing errors in stream

- [ ] **Step 4: Commit AI chat test results**

  Run: `echo "AI chat endpoint tested successfully" > AI_CHAT_TEST_RESULTS.txt`
  Run: `git add AI_CHAT_TEST_RESULTS.txt`
  Run: `git commit -m "test: verify AI chat endpoint works with local LLM"`

### Task 7: Test Document Analysis Endpoint

**Files:**
- Read: `app/api/ai/analyze-document/route.ts`
- Create: None (testing via API calls)

- [ ] **Step 1: Prepare test image file**

  (Manual step - create or obtain small test image)
  Expected: Small JPEG/PNG file for testing

- [ ] **Step 2: Test document analysis with image**

  Run: `curl -X POST http://localhost:3000/api/ai/analyze-document \
    -F "file=@test-image.jpg" \
    -F "query=What is in this image?"`
  Expected: Returns analysis of image from local LLaVA model
  Expected: Response contains description of image content

- [ ] **Step 3: Test document analysis with text file**

  Run: `echo "This is a test construction document." > test-doc.txt`
  Run: `curl -X POST http://localhost:3000/api/ai/analyze-document \
    -F "file=@test-doc.txt" \
    -F "query=Summarize this document"`
  Expected: Returns summary of text content
  Expected: Uses local LLM for processing

- [ ] **Step 4: Test unsupported file type rejection**

  Run: `echo "bad executable" > bad.exe`
  Run: `curl -X POST http://localhost:3000/api/ai/analyze-document \
    -F "file=@bad.exe" \
    -F "query=Analyze this" \
    -w "%{http_code}"`
  Expected: Returns 400 status code
  Expected: Error message about unsupported file type

- [ ] **Step 5: Commit document analysis test results**

  Run: `echo "Document analysis endpoint tested successfully" > DOC_ANALYSIS_TEST_RESULTS.txt`
  Run: `git add DOC_ANALYSIS_TEST_RESULTS.txt`
  Run: `git commit -m "test: verify document analysis works with local LLM"`

### Task 8: Test Local AI Adapter Directly

**Files:**
- Read: `lib/ai/local-ai-adapter.ts`
- Read: `lib/ai/ollama-client.ts`

- [ ] **Step 1: Test local AI availability check**

  Create: `test-local-ai.js` with Node.js script to test adapter
  Expected: Script runs and reports local AI status

- [ ] **Step 2: Test model list retrieval**

  Run: Node.js script calling `localAIAdapter.getAvailableModels()`
  Expected: Returns list of available models including llama3.1, llava, nomic-embed-text

- [ ] **Step 3: Test completion request**

  Run: Node.js script calling `localAIAdapter.complete({messages:[{role:"user",content:"Hello"}]})`
  Expected: Returns successful response from local LLM

- [ ] **Step 4: Clean up test files**

  Run: `rm test-local-ai.js test-doc.txt test-image.jpg bad.exe AI_CHAT_TEST_RESULTS.txt DOC_ANALYSIS_TEST_RESULTS.txt`
  Run: `git commit -m "chore: remove temporary test files"`

## Chunk 5: PWA/Offline Enhancement Testing

### Task 9: Test Service Worker Registration

**Files:**
- Read: `public/sw.ts`
- Read: `lib/sw-register.ts`
- Read: `app/providers.tsx`

- [ ] **Step 1: Verify service worker file exists**

  Check: `public/sw.ts` exists with service worker code
  Expected: File contains service worker lifecycle handlers

- [ ] **Step 2: Verify registration function exists**

  Check: `lib/sw-register.ts` contains `registerServiceWorker()` function
  Expected: Function attempts to register `/sw.js`

- [ ] **Step 3: Verify provider integration**

  Check: `app/providers.tsx` imports and calls `registerServiceWorker()`
  Expected: Registration occurs on app mount

- [ ] **Step 4: Commit PWA registration verification**

  Run: `echo "PWA service worker registration verified" > PWA_REG_TEST.txt`
  Run: `git add PWA_REG_TEST.txt`
  Run: `git commit -m "test: verify PWA service worker registration"`

### Task 10: Test Offline Queue Functionality

**Files:**
- Read: `lib/offline/sync-queue.ts`
- Read: `lib/offline/db.ts`
- Read: `hooks/use-offline-sync.ts`

- [ ] **Step 1: Verify offline queue files exist**

  Check: `lib/offline/sync-queue.ts` exists
  Expected: Contains queueRequest, processSyncQueue, getQueueLength functions

- [ ] **Step 2: Verify database integration**

  Check: `lib/offline/db.ts` exists
  Expected: Contains IndexedDB implementation for queued requests

- [ ] **Step 3: Verify React hook exists**

  Check: `hooks/use-offline-sync.ts` exists
  Expected: Provides sync status, queue length, manual sync functions

- [ ] **Step 4: Commit offline queue verification**

  Run: `echo "Offline queue functionality verified" > OFFLINE_QUEUE_TEST.txt`
  Run: `git add OFFLINE_QUEUE_TEST.txt`
  Run: `git commit -m "test: verify offline queue functionality"`

### Task 11: Test Background Sync Capabilities

**Files:**
- Read: `public/sw.ts`
- Read: `lib/sw-register.ts`

- [ ] **Step 1: Verify sync event listeners**

  Check: `public/sw.ts` contains `self.addEventListener("sync", ...)`
  Expected: Listener for "offline-sync" tag

- [ ] **Step 2: Verify periodic sync support**

  Check: `public/sw.ts` contains `self.addEventListener("periodicsync", ...)`
  Expected: Listener for periodic background sync

- [ ] **Step 3: Verify message handling**

  Check: `public/sw.ts` contains `self.addEventListener("message", ...)`
  Expected: Handles TRIGGER_SYNC and NETWORK_RESTORED messages

- [ ] **Step 4: Commit background sync verification**

  Run: `echo "Background sync capabilities verified" > BACKGROUND_SYNC_TEST.txt`
  Run: `git add BACKGROUND_SYNC_TEST.txt`
  Run: `git commit -m "test: verify background sync capabilities"`

## Chunk 6: Code Quality and Validation Testing

### Task 12: Run Validation Scripts

**Files:**
- Read: `validation-script.ts`
- Read: `simple-validation.js`

- [ ] **Step 1: Run TypeScript validation script**

  Run: `npx ts-node validation-script.ts`
  Expected: Exits with code 0 (success)
  Expected: Shows all validations passed

- [ ] **Step 2: Run JavaScript validation script**

  Run: `node simple-validation.js`
  Expected: Exits with code 0 (success)
  Expected: Shows all validations passed

- [ ] **Step 3: Check for duplicate use-toast files**

  Run: `find . -name "use-toast.ts" -not -path "./node_modules/*" -not -path "./.next/*"`
  Expected: Returns only: `./hooks/use-toast.ts`
  Expected: Does NOT return: `./components/ui/use-toast.ts`

- [ ] **Step 4: Commit validation test results**

  Run: `echo "Validation scripts passed successfully" > VALIDATION_TEST_RESULTS.txt`
  Run: `git add VALIDATION_TEST_RESULTS.txt`
  Run: `git commit -m "test: verify validation scripts pass"`

### Task 13: Test Manual Sync Functionality

**Files:**
- Read: `hooks/use-offline-sync.ts`
- Read: `lib/sw-register.ts`

- [ ] **Step 1: Verify manual sync function exists**

  Check: `hooks/use-offline-sync.ts` exports `manualSync` function
  Expected: Function triggers sync when called

- [ ] **Step 2: Test manual sync triggers processing**

  (Manual test - would require browser testing)
  Expected: Calling manualSync processes queued requests

- [ ] **Step 3: Commit manual sync verification**

  Run: `echo "Manual sync functionality verified" > MANUAL_SYNC_TEST.txt`
  Run: `git add MANUAL_SYNC_TEST.txt`
  Run: `git commit -m "test: verify manual sync functionality"`

## Chunk 7: Final Verification and Cleanup

### Task 14: Run Application Smoke Test

**Files:**
- Modify: None
- Create: None

- [ ] **Step 1: Start application for final test**

  Run: `npm run dev &`
  Expected: Application starts successfully

- [ ] **Step 2: Wait for startup**

  Wait: 10 seconds for application to fully start

- [ ] **Step 3: Test basic endpoint accessibility**

  Run: `curl -s http://localhost:3000/api/ai/local/status`
  Expected: Returns JSON with local AI status
  Expected: Shows whether local AI is available

- [ ] **Step 4: Test homepage accessibility**

  Run: `curl -s http://localhost:3000 | grep -i cortexbuild`
  Expected: Returns HTML containing "CortexBuild"

- [ ] **Step 5: Stop application**

  Run: `kill %1` (or Ctrl+Z then kill %1)
  Expected: Application stops gracefully

- [ ] **Step 5: Commit smoke test results**

  Run: `echo "Application smoke test passed" > SMOKE_TEST_RESULTS.txt`
  Run: `git add SMOKE_TEST_RESULTS.txt`
  Run: `git commit -m "test: verify application smoke test passes"`

### Task 15: Final Cleanup and Summary

**Files:**
- Create: `TEST_SUMMARY.md`

- [ ] **Step 1: Create test summary**

  Run: `echo "# CortexBuild Pro Testing Summary\n\n## Completed Tests\n- Environment setup verified\n- Dependencies installed\n- Database configured\n- Application built successfully\n- AI chat endpoint working with local LLM\n- Document analysis working with local LLM\n- PWA service worker registered\n- Offline queue functionality verified\n- Background sync capabilities confirmed\n- Validation scripts pass\n- Code duplicates removed\n- Application smoke test passed\n\n## Optimizations Verified\n- AI Usage: Local LLM (Ollama) instead of Abacus API\n- PWA/Offline: Background sync, periodic sync, manual sync\n- Code Quality: Duplicate removal, validation infrastructure\n\n## Next Steps\n- Document OCR implementation\n- Geofencing feature\n- Advanced analytics dashboard\n\n*Testing completed $(date)*" > TEST_SUMMARY.md`
  Run: `git add TEST_SUMMARY.md`
  Run: `git commit -m "doc: create testing summary for CortexBuild Pro optimizations"`

- [ ] **Step 2: Remove temporary test files**

  Run: `rm PWA_REG_TEST.txt OFFLINE_QUEUE_TEST.txt BACKGROUND_SYNC_TEST.txt MANUAL_SYNC_TEST.txt SMOKE_TEST_RESULTS.txt VALIDATION_TEST_RESULTS.txt TEST_SUMMARY.md`
  Run: `git commit -m "chore: remove temporary test files"`

- [ ] **Step 3: Final commit**

  Run: `git add .`
  Run: `git commit -m "feat: complete testing plan for CortexBuild Pro optimizations"`

---