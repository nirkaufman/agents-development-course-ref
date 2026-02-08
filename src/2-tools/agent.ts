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
export const chat = createAgent({
  model,
  checkpointer,
  systemPrompt,
  tools: [searchRecipeDatabase, saveRecipeToDatabase],
  responseFormat: RecipeSchema,
});
