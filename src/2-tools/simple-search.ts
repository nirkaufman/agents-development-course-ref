import 'dotenv/config';
import {ChatOpenAI} from "@langchain/openai";
import {createAgent} from "langchain";
import {MemorySaver} from "@langchain/langgraph";
import { TavilySearch } from "@langchain/tavily";


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

const webSearch = new TavilySearch({
  maxResults: 3,
});

// Create the agent with tools
export const chat = createAgent({
  model,
  checkpointer,
  systemPrompt,
  tools: [webSearch],
});

// Demo invocation - only runs when executed directly via CLI
// Run with: npx tsx src/2-tools/simple-search.ts
if (process.argv[1]?.includes('simple-search.ts')) {
  const message = "I have chicken, garlic, and lemon. What can I make?";

  console.log("User:", message);
  console.log("---");

  const response = await chat.invoke(
    { messages: [{ role: "user", content: message }] },
    { configurable: { thread_id: "demo-1" } }
  );

  const lastMessage = response.messages[response.messages.length - 1];
  console.log("Chef:", lastMessage.content);
}
