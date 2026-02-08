import {ChatOpenAI} from "@langchain/openai";
import {createAgent} from "langchain";
import {MemorySaver} from "@langchain/langgraph";

const model = new ChatOpenAI({
  model: "gpt-5.1",
  temperature: 0.5,
  maxTokens: 1500,
  maxRetries: 3,
  timeout: 15000,
});

const systemPrompt = `
  You are a personal chef. Help the user find 
  recipes based on ingredients they provide.
`

const checkpointer = new MemorySaver();

// Create the agent with tools
export const chat = createAgent({
  model,
  checkpointer,
  systemPrompt,
  tools: [],
});
