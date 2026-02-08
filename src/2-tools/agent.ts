import 'dotenv/config';
import {createAgent} from "langchain";
import {ChatOpenAI} from "@langchain/openai";
import {MemorySaver} from "@langchain/langgraph";
import {systemPrompt} from "./promps/system-prompt.js";
import {searchRecipeDatabase} from "./tools/serach-recipe.js";
import {saveRecipeToDatabase} from "./tools/save-recipe.js";
import {RecipeSchema} from "./schemas/recipe.schema.js";

const checkpointer = new MemorySaver();

// Instantiate the model
const model = new ChatOpenAI({
  model: "gpt-5.1",
  temperature: 0.5,
  maxTokens: 1500,
  maxRetries: 3,
  timeout: 15000,
});

// Create the agent with tools
const chat = createAgent({
  model,
  checkpointer,
  systemPrompt,
  tools: [searchRecipeDatabase, saveRecipeToDatabase],
  responseFormat: RecipeSchema,
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
