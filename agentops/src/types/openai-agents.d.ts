declare module '@openai/agents' {
  interface AgentOptions {
    name: string;
    instructions: string;
    model: string;
    tools?: any[];
  }

  export class Agent {
    constructor(options: AgentOptions);
    run(options: { input: string; toolbox?: Record<string, boolean> }): Promise<any>;
  }

  export function tool(name: string, definition: any): any;
}
