import {createAgent} from "langchain";
import { ChatOpenAI } from "@langchain/openai";
import { MemorySaver } from "@langchain/langgraph";

const checkpointer = new MemorySaver();

const model = new ChatOpenAI({
  model: "gpt-5-nano",
});

export const agent = createAgent({
  model,
  checkpointer,
})
