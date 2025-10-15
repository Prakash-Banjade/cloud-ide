export enum StreamEventType {
  // Agent lifecycle events
  AGENT_START = 'agent_start',
  AGENT_END = 'agent_end',

  // Router events
  ROUTER_DECISION = 'router_decision',

  // Direct agent events
  DIRECT_RESPONSE_CHUNK = 'direct_response_chunk',
  DIRECT_RESPONSE_COMPLETE = 'direct_response_complete',

  // Planner events
  PLANNER_THINKING = 'planner_thinking',
  PLANNER_PLAN_CREATED = 'planner_plan_created',

  // Architect events
  ARCHITECT_THINKING = 'architect_thinking',
  ARCHITECT_TASK_CREATED = 'architect_task_created',

  // Coder events
  CODER_TASK_START = 'coder_task_start',
  CODER_TOOL_CALL = 'coder_tool_call',
  CODER_TOOL_RESULT = 'coder_tool_result',
  CODER_TASK_COMPLETE = 'coder_task_complete',
  CODER_ALL_COMPLETE = 'coder_all_complete',

  // General events
  ERROR = 'error',
  COMPLETE = 'complete',
  STATE_UPDATE = 'state_update',
}

export interface StreamEvent {
  type: StreamEventType;
  agent?: string;
  data?: any;
  message?: string;
  timestamp: string;
}

export interface RouterDecisionEvent extends StreamEvent {
  type: StreamEventType.ROUTER_DECISION;
  data: {
    route: 'agent' | 'direct';
    reason?: string;
  };
}

export interface DirectResponseChunkEvent extends StreamEvent {
  type: StreamEventType.DIRECT_RESPONSE_CHUNK;
  data: {
    chunk: string;
  };
}

export interface PlannerPlanCreatedEvent extends StreamEvent {
  type: StreamEventType.PLANNER_PLAN_CREATED;
  data: {
    name: string;
    description: string;
    techstack: string;
    fileCount: number;
  };
}

export interface ArchitectTaskCreatedEvent extends StreamEvent {
  type: StreamEventType.ARCHITECT_TASK_CREATED;
  data: {
    taskCount: number;
    tasks: Array<{ filepath: string; description: string }>;
  };
}

export interface CoderTaskStartEvent extends StreamEvent {
  type: StreamEventType.CODER_TASK_START;
  data: {
    currentStep: number;
    totalSteps: number;
    filepath: string;
    task: string;
  };
}

export interface CoderToolCallEvent extends StreamEvent {
  type: StreamEventType.CODER_TOOL_CALL;
  data: {
    toolName: string;
    input: any;
  };
}

export interface CoderToolResultEvent extends StreamEvent {
  type: StreamEventType.CODER_TOOL_RESULT;
  data: {
    toolName: string;
    result: string;
  };
}