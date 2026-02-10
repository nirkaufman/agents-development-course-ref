import 'dotenv/config';
import {createAgent} from "langchain";
import { ChatOpenAI } from "@langchain/openai";
import { MemorySaver } from "@langchain/langgraph";

const checkpointer = new MemorySaver();

const model = new ChatOpenAI({
  model: "gpt-5.1",
  temperature: 0.5,
  maxTokens: 1000,
  maxRetries: 3,
  timeout: 10000,
});

export const chat = createAgent({
  model,
  checkpointer,
});

// Demo invocation - only runs when executed directly via CLI
// Run with: npx tsx src/1-basic-model/chat.ts
if (process.argv[1]?.includes('chat.ts')) {
  const message = "Hello! What can you help me with?";

  console.log("User:", message);
  console.log("---");

  const response = await chat.invoke(
    { messages: [{ role: "user", content: message }] },
    { configurable: { thread_id: "demo-1" } }
  );

  const lastMessage = response.messages[response.messages.length - 1];
  console.log("Assistant:", lastMessage.content);
}
