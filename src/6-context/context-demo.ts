import "dotenv/config";
import * as z from "zod";
import { tool } from "@langchain/core/tools";
import { createAgent } from "langchain";
import { MemorySaver } from "@langchain/langgraph";
import { HumanMessage } from "@langchain/core/messages";

// 1. Define context schema using zod
const contextSchema = z.object({
  userId: z.string(),
  userName: z.string(),
  preferredLanguage: z.string(),
});

// 2. Create a tool that accesses context via config parameter
const getUserProfile = tool(
  async (_, config) => {
    const { userId, userName, preferredLanguage } = config.context ?? {};
    return `User Profile:
- ID: ${userId}
- Name: ${userName}
- Language: ${preferredLanguage}`;
  },
  {
    name: "get_user_profile",
    description: "Get the current user's profile information.",
    schema: z.object({}),
  }
);

const greetUser = tool(
  async (_, config) => {
    const { userName, preferredLanguage } = config.context ?? {};
    const greetings: Record<string, string> = {
      en: `Hello, ${userName}!`,
      es: `¡Hola, ${userName}!`,
      fr: `Bonjour, ${userName}!`,
    };
    return greetings[preferredLanguage] || greetings.en;
  },
  {
    name: "greet_user",
    description: "Greet the user in their preferred language.",
    schema: z.object({}),
  }
);

// 3. Create agent with context schema
const checkpointer = new MemorySaver();

export const agent = createAgent({
  model: "gpt-4o",
  tools: [getUserProfile, greetUser],
  checkpointer,
  contextSchema,
});

// 4. Demo invocation with context passed at runtime
// Run with: npx tsx src/6-context/context-demo.ts
if (process.argv[1]?.includes("context-demo")) {
  const queries = ["What's my profile?", "Please greet me"];

  for (const query of queries) {
    console.log(`\nQuery: ${query}`);
    const response = await agent.invoke(
      { messages: [new HumanMessage(query)] },
      {
        configurable: { thread_id: "context-demo-1" },
        context: {
          userId: "user-123",
          userName: "Alice",
          preferredLanguage: "es",
        },
      }
    );
    const result = response.messages[response.messages.length - 1];
    console.log("Agent:", result.content);
  }
}
