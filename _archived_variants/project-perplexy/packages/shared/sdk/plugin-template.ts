/**
 * Plugin Template
 * Example plugin structure for developers
 */

import { ConstructAISDK, PluginConfig } from './ConstructAISDK'

export const examplePlugin: PluginConfig = {
  id: 'example-plugin',
  name: 'Example Plugin',
  version: '1.0.0',
  description: 'An example plugin demonstrating the SDK capabilities',
  author: 'Your Name',
  entryPoint: './index.js',
  permissions: [
    'read:projects',
    'write:field-data',
    'execute:ai-agent',
  ],
  hooks: {
    // Hook called when field data is created
    'field-data:created': async (data: any, sdk: ConstructAISDK) => {
      console.log('Field data created:', data)
      
      // Example: Auto-analyze with AI agent
      if (data.type === 'SAFETY_INCIDENT') {
        const result = await sdk.executeAgent('SAFETY', {
          action: 'analyze_incident',
          incidentId: data.id,
        })
        console.log('AI Analysis:', result)
      }
    },

    // Hook called when task is created
    'task:created': async (data: any, sdk: ConstructAISDK) => {
      console.log('Task created:', data)
      
      // Example: Auto-assign based on rules
      if (data.priority === 'URGENT') {
        // Custom logic here
      }
    },

    // Hook called before project update
    'project:before-update': async (data: any, sdk: ConstructAISDK) => {
      // Can modify data before update
      return data
    },
  },
}

// Register plugin
// sdk.registerPlugin(examplePlugin)

