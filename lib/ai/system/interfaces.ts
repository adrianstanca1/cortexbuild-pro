/**
 * Defines the structure of a skill that can be used by agents
 */
export interface ISkill<T = any> {
  id: string;
  name: string;
  description: string;
  version: string;
  execute: (context: T) => Promise<any>;
  metadata?: Record<string, any>;
  isEnabled?: boolean;
  tags?: string[];
}

/**
 * Defines the structure of a tool that agents can use
 */
export interface ITool<T = any> {
  id: string;
  name: string;
  description: string;
  version: string;
  execute: (context: T) => Promise<any>;
  parameters?: Record<string, any>;
  returns?: any;
  metadata?: Record<string, any>;
  isEnabled?: boolean;
  tags?: string[];
}

/**
 * Defines the structure of a plugin that extends agent capabilities
 */
export interface IPlugin<T = any> {
  id: string;
  name: string;
  description: string;
  version: string;
  initialize: (context: T) => Promise<void>;
  execute: (context: T) => Promise<any>;
  cleanup?: () => Promise<void>;
  metadata?: Record<string, any>;
  isEnabled?: boolean;
  hooks?: string[];
  dependencies?: string[]; // Array of plugin IDs this plugin depends on
}

/**
 * Defines the structure of an agent
 */
export interface IAgent<T = any> {
  id: string;
  name: string;
  description: string;
  version: string;
  type: AgentType;
  status: AgentStatus;
  skills: ISkill[];  // Skills this agent possesses
  tools: ITool[];    // Tools this agent can use
  plugins: IPlugin[]; // Plugins that extend this agent
  metadata?: Record<string, any>;
  isEnabled?: boolean;
  maxTokens?: number;
  temperature?: number;
  
  // Core methods
  initialize: (context: T) => Promise<void>;
  execute: (context: T) => Promise<any>;
  cleanup: () => Promise<void>;
  
  // Lifecycle methods
  onStart?: () => Promise<void>;
  onComplete?: (result: any) => Promise<void>;
  onError?: (error: Error) => Promise<void>;
}

/**
 * Defines the structure of a superagent (orchestrator of multiple agents)
 */
export interface ISuperAgent<T = any> extends IAgent<T> {
  subagents: IAgent<T>[];  // Agents controlled by this superagent
  coordinationStrategy: CoordinationStrategy;
  
  // Superagent-specific methods
  delegateTask: (task: any, agentId: string) => Promise<any>;
  aggregateResults: (results: any[]) => Promise<any>;
  resolveConflicts: (conflicts: any[]) => Promise<any>;
}

/**
 * Enumerations
 */
export enum AgentType {
  SPECIALIZED = 'specialized',
  GENERALIST = 'generalist',
  COORDINATOR = 'coordinator',
  SUPERAGENT = 'superagent'
}

export enum AgentStatus {
  INACTIVE = 'inactive',
  INITIALIZING = 'initializing',
  ACTIVE = 'active',
  BUSY = 'busy',
  COMPLETED = 'completed',
  ERROR = 'error',
  MAINTENANCE = 'maintenance'
}

export enum CoordinationStrategy {
  SEQUENTIAL = 'sequential',
  PARALLEL = 'parallel',
  PIPELINE = 'pipeline',
  CONSENSUS = 'consensus',
  COMPETITIVE = 'competitive'
}

/**
 * Message type enum
 */
export enum MessageType {
  TASK = 'task',
  RESULT = 'result',
  QUERY = 'query',
  RESPONSE = 'response',
  EVENT = 'event',
  COMMAND = 'command',
  HEARTBEAT = 'heartbeat',
  ERROR = 'error'
}
