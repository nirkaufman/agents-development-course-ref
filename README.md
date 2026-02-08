# Agent Development Starter

_Reference code for the Agent development training_


This starter project is a simple and clean basic agent boilerplate code
implemented using `LangChain` and `TypeScript`, showing how to 
get started with `LangGraph Server` and using `LangGraph Studio`.

## Pre requisites

- Node.js (tested on v24.5.0)
- npm (tested on v11.5.1)
- langgraphjs cli (tested on v1.1.11+js)


## Getting Started

1. install langgraph-cli CLI using npm

```bash
  npm install -g @langchain/langgraph-cli 
```

2. Create a `.env` file based on the `.env.example` file. and provide your API keys 

```bash
  cp .env.example .env
```

3. The LangSmith API key in your `.env` file is optional.  

```text
  LANGSMITH_API_KEY=lsv2...
```

4. Install dependencies

```bash
    npm install
```

5. Start the LangGraph Server, or use `npm start` alias.

```bash
  # run npm start alias (defined in package.json)
  npm start
  
  #or use the command directly
  langgraphjs dev
```

## Using the CLI

Run the interactive CLI to test demos:

```bash
npx tsx src/cli.ts
```

Commands:
- `/list` - Show available demos
- `/switch` or `/s` - Switch to a different demo
- `/quit` or `/q` - Exit the CLI

## Adding New Demos

To add a new demo to the CLI, update the `DEMOS` registry in `src/cli.ts`:

```typescript
const DEMOS: Record<string, { path: string; exportName: string; name: string; description: string }> = {
  // ... existing demos

  myDemo: {
    path: "./path/to/my-demo.js",  // Path relative to src/
    exportName: "agent",            // The exported agent/chat variable name
    name: "My Demo",                // Display name in CLI
    description: "What it does",    // Short description
  },
};
```

Your demo file should export a LangGraph agent:

```typescript
// src/my-folder/my-demo.ts
import { createAgent } from "langchain";
import { ChatOpenAI } from "@langchain/openai";
import { MemorySaver } from "@langchain/langgraph";

const model = new ChatOpenAI({ model: "gpt-5.1" });
const checkpointer = new MemorySaver();

export const agent = createAgent({
  model,
  checkpointer,
  // Optional: systemPrompt, responseFormat, tools, etc.
});
```

## Notes
- This starter project was design to support the Agent Development training.
- You can use this repo as a reference for your own projects.
- Any other usage is at your own risk.
