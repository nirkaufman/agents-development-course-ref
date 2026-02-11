import "dotenv/config";
import * as z from "zod";
import { tool } from "@langchain/core/tools";
import { createAgent } from "langchain";
import { MemorySaver } from "@langchain/langgraph";
import { HumanMessage } from "@langchain/core/messages";


// 1. DEFINE TOOLS FOR EACH SUBAGENT


// Tool for Math Agent: performs basic arithmetic
const calculate = tool(
  async ({ a, b, operation }) => {
    let result: number;
    switch (operation) {
      case "add":
        result = a + b;
        break;
      case "subtract":
        result = a - b;
        break;
      case "multiply":
        result = a * b;
        break;
      case "divide":
        result = b !== 0 ? a / b : NaN;
        break;
      default:
        return "Unknown operation";
    }
    return `${a} ${operation} ${b} = ${result}`;
  },
  {
    name: "calculate",
    description: "Perform basic arithmetic operations",
    schema: z.object({
      a: z.number().describe("First number"),
      b: z.number().describe("Second number"),
      operation: z.enum(["add", "subtract", "multiply", "divide"]),
    }),
  }
);

// Tool for Translator Agent: detects input language
const detectLanguage = tool(
  async ({ text }) => {
    // Simple heuristic detection for demo purposes
    if (/[\u3040-\u309F\u30A0-\u30FF]/.test(text)) return "Japanese";
    if (/[\u4E00-\u9FFF]/.test(text)) return "Chinese";
    if (/[\u0400-\u04FF]/.test(text)) return "Russian";
    if (/[áéíóúñ¿¡]/i.test(text)) return "Spanish";
    if (/[àâçéèêëïîôùûü]/i.test(text)) return "French";
    if (/[äöüß]/i.test(text)) return "German";
    return "English";
  },
  {
    name: "detect_language",
    description: "Detect the language of input text",
    schema: z.object({
      text: z.string().describe("Text to analyze"),
    }),
  }
);


// 2. CREATE SPECIALIZED SUBAGENTS (each with own tools + system prompt)


// Math specialist: has calculate tool, focused on math
const mathAgent = createAgent({
  model: "gpt-4o",
  tools: [calculate],
  systemPrompt: "You are a math specialist. Use the calculate tool for arithmetic. Return concise answers.",
});

// Translator specialist: has language detection tool, focused on translation
const translatorAgent = createAgent({
  model: "gpt-4o",
  tools: [detectLanguage],
  systemPrompt: "You are a translator. Use detect_language to identify input language when needed. Return only the translation.",
});


// 3. WRAP SUBAGENTS AS TOOLS


const callMathAgent = tool(
  async ({ query }) => {
    const result = await mathAgent.invoke({
      messages: [{ role: "user", content: query }],
    });
    return result.messages.at(-1)?.content;
  },
  {
    name: "math_specialist",
    description:
      "Delegate math problems and calculations to the math specialist",
    schema: z.object({
      query: z.string().describe("The math problem to solve"),
    }),
  }
);

const callTranslatorAgent = tool(
  async ({ query }) => {
    const result = await translatorAgent.invoke({
      messages: [{ role: "user", content: query }],
    });
    return result.messages.at(-1)?.content;
  },
  {
    name: "translator_specialist",
    description: "Delegate translation tasks to the translator specialist",
    schema: z.object({
      query: z.string().describe("The text to translate with target language"),
    }),
  }
);

// 4. CREATE SUPERVISOR AGENT

const checkpointer = new MemorySaver();

export const agent = createAgent({
  model: "gpt-4o",
  tools: [callMathAgent, callTranslatorAgent],
  checkpointer,
  systemPrompt: `
  You are a supervisor agent that coordinates specialists.
  Available specialists:
  - math_specialist: For calculations and math problems
  - translator_specialist: For language translations
  
  Analyze each request and delegate to the appropriate specialist.
  Summarize their response for the user.
  `,
});

// 5. DEMO: SUPERVISOR DELEGATING TO SUBAGENTS

if (process.argv[1]?.includes("subagent-demo")) {
  const queries = [
    "What is 15% of 240?",
    "Translate 'Hello, how are you?' to Spanish",
    "Calculate the area of a circle with radius 7",
    "Translate 'Good morning' to French and Japanese",
  ];

  for (const query of queries) {
    console.log(`\nUser: ${query}`);
    const response = await agent.invoke(
      { messages: [new HumanMessage(query)] },
      { configurable: { thread_id: "supervisor-demo-1" } }
    );
    const lastMessage = response.messages[response.messages.length - 1];
    console.log("Supervisor:", lastMessage.content);
  }
}
