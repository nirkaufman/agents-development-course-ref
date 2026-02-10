import "dotenv/config";
import { MultiServerMCPClient } from "@langchain/mcp-adapters";
import { createAgent } from "langchain";
import { MemorySaver } from "@langchain/langgraph";
import { HumanMessage } from "@langchain/core/messages";

const systemPrompt = `
  You are a travel assistant powered by Kiwi flight search.

  Rules:
  - Today is ${new Date().toISOString().split('T')[0]}
  - Always use future dates in YYYY-MM-DD format
  - Convert relative dates ("next week", "in March") to actual dates
  - Use IATA airport codes when possible (e.g., JFK, LHR, CDG)
  - If a date is ambiguous or in the past, ask for clarification`;

// Create MCP client connecting to remote Kiwi travel server via HTTP
const mcpClient = new MultiServerMCPClient({
  travel_server: {
    transport: "http",
    url: "https://mcp.kiwi.com",
  },
});

// Load tools from the remote MCP server
const tools = await mcpClient.getTools();

console.log(tools);


// Create agent with MCP tools and checkpointer for LangGraph Studio
const checkpointer = new MemorySaver();

export const agent = createAgent({
  model: "gpt-4o",
  tools,
  checkpointer,
  systemPrompt
});

// Demo invocation - only runs when executed directly via CLI
// Run with: npx tsx src/5-mcp/travel-agent.ts
if (process.argv[1]?.includes("travel-agent")) {
  const queries = [
    "Find me flights from New York to London on March 1st 2026",
    "What are the cheapest flights from Paris to Tokyo on March 15th 2026?",
    "Search for round-trip flights from Los Angeles to Miami departing March 20th 2026",
  ];

  for (const query of queries) {
    console.log(`\nQuery: ${query}`);
    const response = await agent.invoke({
      messages: [new HumanMessage(query)],
    });
    const result = response.messages[response.messages.length - 1];
    console.log("Agent:", result.content);
  }

  await mcpClient.close();
}
