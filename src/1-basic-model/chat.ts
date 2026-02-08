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

const chat = createAgent({
  model,
  checkpointer,
});

// Invoke the agent and display the response
const message = "Hello! What can you help me with?";

console.log("User:", message);
console.log("---");

const response = await chat.invoke(
  { messages: [{ role: "user", content: message }] },
  { configurable: { thread_id: "demo-1" } }
);

const lastMessage = response.messages[response.messages.length - 1];
console.log("Assistant:", lastMessage.content);
