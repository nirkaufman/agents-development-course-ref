import 'dotenv/config';
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
const chat = createAgent({
  model,
  checkpointer,
  systemPrompt,
  tools: [],
});

// Invoke the agent and display the response
const message = "I have chicken, garlic, and lemon. What can I make?";

console.log("User:", message);
console.log("---");

const response = await chat.invoke(
  { messages: [{ role: "user", content: message }] },
  { configurable: { thread_id: "demo-1" } }
);

const lastMessage = response.messages[response.messages.length - 1];
console.log("Chef:", lastMessage.content);
