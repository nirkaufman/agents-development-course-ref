import 'dotenv/config';
import {createAgent} from "langchain";
import {ChatOpenAI} from "@langchain/openai";
import {systemPrompt} from "./promps/system-prompt.js";
import {searchRecipeDatabase} from "./tools/serach-recipe.js";
import {saveRecipeToDatabase} from "./tools/save-recipe.js";
import {RecipeSchema} from "./schemas/recipe.schema.js";

// Instantiate the model
const model = new ChatOpenAI({
  model: "gpt-5.1",
  temperature: 0.5,
  maxTokens: 1500,
  maxRetries: 3,
});

// Create the agent with tools
export const chat = createAgent({
  model,
  systemPrompt,
  tools: [searchRecipeDatabase, saveRecipeToDatabase],
  responseFormat: RecipeSchema,
});

// Demo invocation - only runs when executed directly via CLI
// Run with: npx tsx src/2-tools/agent.ts
if (process.argv[1]?.includes('agent.ts')) {
  const message = "I have mango and cucumber. What can I make?";

  console.log("User:", message);
  console.log("---");

  const response = await chat.invoke(
    { messages: [{ role: "user", content: message }] },
    { configurable: { thread_id: "demo-1" } }
  );

  const lastMessage = response.messages[response.messages.length - 1];
  console.log("Chef:", lastMessage.content);
}
