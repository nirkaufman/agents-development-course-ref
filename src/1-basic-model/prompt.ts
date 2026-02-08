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


const systemPrompt = `
  You are a personal chef. Help the user find 
  recipes based on ingredients they provide.
`

export const chat = createAgent({
  model,
  checkpointer,
  systemPrompt,
})
