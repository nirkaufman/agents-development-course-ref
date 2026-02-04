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

## Notes
- This starter project was design to support the Agent Development training.
- You can use this repo as a reference for your own projects.
- Any other usage is at your own risk.
