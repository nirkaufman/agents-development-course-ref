import "dotenv/config";
import * as z from "zod";
import { tool } from "@langchain/core/tools";
import { ToolMessage } from "@langchain/core/messages";
import { createAgent } from "langchain";
import {
  Command,
  MemorySaver,
  MessagesValue,
  ReducedValue,
  StateSchema,
} from "@langchain/langgraph";
import { HumanMessage } from "@langchain/core/messages";


// Define custom state schema
const CartState = new StateSchema({
  // Built-in messages value with message-aware reducer
  messages: MessagesValue,

  // Custom state: shopping cart items (shared between tools)
  cartItems: new ReducedValue(z.array(z.string()).default(() => []), {
    reducer: (current, update) => [...current, ...update],
  }),
});




// Use Command to update the state. Must include a ToolMessage in the messages update.
const addToCart = tool(
  async ({ item }, config) => {
    // Return a Command to update state
    return new Command({
      update: {
        // Add item to the cartItems state (reducer will append)
        cartItems: [item],
        // Must include ToolMessage for valid message history
        messages: [
          new ToolMessage({
            content: `Added "${item}" to your cart.`,
            tool_call_id: config.toolCall?.id ?? "",
          }),
        ],
      },
    });
  },
  {
    name: "add_to_cart",
    description: "Add an item to the shopping cart.",
    schema: z.object({
      item: z.string().describe("The item to add to the cart"),
    }),
  }
);


// Access state via config.state to read values set by other tools.
const getCartSummary = tool(
  async (_, config) => {
    // Read cartItems from state (written by addToCart)
    const state = (config as { state?: { cartItems?: string[] } }).state;
    const cartItems = state?.cartItems ?? [];

    if (cartItems.length === 0) {
      return "Your cart is empty.";
    }

    return `Your cart contains ${cartItems.length} item(s):\n${cartItems.map((item: string) => `  - ${item}`).join("\n")}`;
  },
  {
    name: "get_cart_summary",
    description: "Show all items currently in the shopping cart.",
    schema: z.object({}),
  }
);


// Create an agent with state schema
const checkpointer = new MemorySaver();

export const agent = createAgent({
  model: "gpt-4o",
  tools: [addToCart, getCartSummary],
  checkpointer,
  stateSchema: CartState, // Pass custom state schema
});


// Conversation with persistent state
// Run with: npx tsx src/7-state/state-demo.ts

if (process.argv[1]?.includes("state-demo")) {
  const threadId = "cart-demo-1";

  // Simulate a multi-turn conversation
  const queries = [
    "Add a laptop to my cart",
    "Also add a wireless mouse",
    "What's in my cart?",
    "Add a USB-C cable too",
    "Show me my cart summary",
  ];

  let lastResponse: { messages: unknown[]; cartItems?: string[] } | undefined;

  for (const query of queries) {
    console.log(`\nUser: ${query}`);

    const response = await agent.invoke(
      { messages: [new HumanMessage(query)] },
      { configurable: { thread_id: threadId } }
    );

    lastResponse = response as typeof lastResponse;
    const lastMessage = response.messages[response.messages.length - 1];
    console.log("Agent:", lastMessage.content);
  }

  // Show final state
  if (lastResponse) {
    console.log("\n--- Final State ---");
    console.log("Cart items:", lastResponse.cartItems);
  }
}
