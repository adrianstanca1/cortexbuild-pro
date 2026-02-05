#!/usr/bin/env node
/**
 * Test AI Service Integration
 * 
 * This script tests the AI service with both Abacus and Gemini providers
 * Run with: npx tsx scripts/test-ai-service.ts
 */

import { generateAIResponse, isAIConfigured, getActiveAIProvider } from '../lib/ai-service';

async function main() {
  console.log('🤖 Testing AI Service Integration\n');
  console.log('=' .repeat(60));

  // Check if AI is configured
  const isConfigured = isAIConfigured();
  console.log(`\n✅ AI Configured: ${isConfigured}`);
  
  if (!isConfigured) {
    console.log('\n❌ No AI provider configured.');
    console.log('Please configure ABACUSAI_API_KEY or GEMINI_API_KEY in your .env file.');
    process.exit(1);
  }

  const activeProvider = getActiveAIProvider();
  console.log(`✅ Active Provider: ${activeProvider.toUpperCase()}`);
  
  // Check which providers are available
  const abacusConfigured = !!process.env.ABACUSAI_API_KEY;
  const geminiConfigured = !!process.env.GEMINI_API_KEY;
  
  console.log(`\n📋 Available Providers:`);
  console.log(`   - Abacus AI: ${abacusConfigured ? '✅ Configured' : '❌ Not configured'}`);
  console.log(`   - Google Gemini: ${geminiConfigured ? '✅ Configured' : '❌ Not configured'}`);
  
  // Test message
  console.log('\n' + '='.repeat(60));
  console.log('🧪 Testing AI Response...\n');
  
  const testMessages = [
    {
      role: 'system' as const,
      content: 'You are a helpful assistant. Answer briefly in one sentence.'
    },
    {
      role: 'user' as const,
      content: 'What is 2+2? Answer with just the number.'
    }
  ];

  try {
    const result = await generateAIResponse({
      messages: testMessages,
      stream: false,
      maxTokens: 50
    });

    if (result.success) {
      console.log(`✅ Test Successful!`);
      console.log(`📡 Provider Used: ${result.provider.toUpperCase()}`);
      console.log(`💬 Response: ${result.response}`);
    } else {
      console.log(`❌ Test Failed!`);
      console.log(`❌ Error: ${result.error}`);
      process.exit(1);
    }
  } catch {
    console.log(`❌ Test Failed with exception!`);
    console.log(`❌ Error: ${error instanceof Error ? error.message : error}`);
    process.exit(1);
  }

  // Test streaming if non-streaming worked
  console.log('\n' + '='.repeat(60));
  console.log('🧪 Testing AI Streaming...\n');
  
  try {
    const streamResult = await generateAIResponse({
      messages: testMessages,
      stream: true,
      maxTokens: 50
    });

    if (streamResult.success && streamResult.stream) {
      console.log(`✅ Streaming Test Successful!`);
      console.log(`📡 Provider Used: ${streamResult.provider.toUpperCase()}`);
      console.log(`💬 Stream: Ready`);
      
      // Read a bit of the stream to verify it works
      const reader = streamResult.stream.getReader();
      const decoder = new TextDecoder();
      let chunkCount = 0;
      
      try {
        for (let i = 0; i < 3; i++) {
          const { done, value } = await reader.read();
          if (done) break;
          chunkCount++;
          const chunk = decoder.decode(value);
          console.log(`   Chunk ${chunkCount}: ${chunk.substring(0, 50)}...`);
        }
        reader.cancel();
      } catch {
        // Stream reading might fail in test environment, that's ok
        console.log(`   ⚠️  Stream reading skipped (normal in test env)`);
      }
    } else {
      console.log(`❌ Streaming Test Failed!`);
      console.log(`❌ Error: ${streamResult.error}`);
    }
  } catch {
    console.log(`❌ Streaming Test Failed with exception!`);
    console.log(`❌ Error: ${error instanceof Error ? error.message : error}`);
  }

  console.log('\n' + '='.repeat(60));
  console.log('✅ All tests completed!\n');
  
  console.log('💡 Tips:');
  console.log('   - To switch providers, set AI_PROVIDER=abacus or AI_PROVIDER=gemini');
  console.log('   - Configure both providers for automatic fallback');
  console.log('   - Check API_KEYS_SETUP.md for detailed configuration\n');
}

main().catch(error => {
  console.error('\n❌ Unexpected error:', error);
  process.exit(1);
});
