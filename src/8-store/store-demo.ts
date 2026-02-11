import "dotenv/config";
import * as z from "zod";
import { tool } from "@langchain/core/tools";
import { createAgent } from "langchain";
import { InMemoryStore, MemorySaver } from "@langchain/langgraph";
import { HumanMessage } from "@langchain/core/messages";

/*
  1. DEFINE CONTEXT SCHEMA
  Context provides static configuration passed at invocation time.
  Here we use it to identify the user across conversations.
*/
const contextSchema = z.object({
  userId: z.string(),
});

/*
  2. CREATE THE STORE
  InMemoryStore persists data across conversations (different thread_ids).
  Unlike state (short-term memory), store data survives across sessions.
  For production, use PostgresStore or another persistent backend.
*/
const store = new InMemoryStore();


/*
 3. TOOL THAT WRITES TO STORE
 Save user notes using namespace/key pattern: store.put([namespace], key, value)
*/
const saveNote = tool(
  async ({ topic, content }, config) => {
    const userId = config.context?.userId as string | undefined;
    if (!userId) {
      return "Error: No user ID provided.";
    }

    // Write to store: namespace is ["notes", userId], key is the topic
    await store.put(["notes", userId], topic, {
      content,
      savedAt: new Date().toISOString(),
    });

    return `Saved note about "${topic}" for user ${userId}.`;
  },
  {
    name: "save_note",
    description: "Save a personal note about a specific topic.",
    schema: z.object({
      topic: z.string().describe("The topic or title of the note"),
      content: z.string().describe("The content of the note"),
    }),
  }
);


/*
 4. TOOL THAT READS FROM STORE
 Retrieve notes using store.get([namespace], key)
*/
const getNote = tool(
  async ({ topic }, config) => {
    const userId = config.context?.userId as string | undefined;
    if (!userId) {
      return "Error: No user ID provided.";
    }

    // Read from store
    const note = await store.get(["notes", userId], topic);

    if (note?.value) {
      const { content, savedAt } = note.value as { content: string; savedAt: string };
      return `Note about "${topic}" (saved ${savedAt}):\n${content}`;
    }

    return `No note found about "${topic}".`;
  },
  {
    name: "get_note",
    description: "Retrieve a previously saved note by topic.",
    schema: z.object({
      topic: z.string().describe("The topic to look up"),
    }),
  }
);


/*
  5. TOOL TO LIST ALL NOTES
  Use store.search to find all notes for a user
 */
const listNotes = tool(
  async (_, config) => {
    const userId = config.context?.userId as string | undefined;
    if (!userId) {
      return "Error: No user ID provided.";
    }

    // Search all notes in user's namespace
    const notes = await store.search(["notes", userId], { limit: 10 });

    if (notes.length === 0) {
      return "No notes saved yet.";
    }

    const noteList = notes
      .map((item: { key: string }) => `  - ${item.key}`)
      .join("\n");

    return `Your saved notes:\n${noteList}`;
  },
  {
    name: "list_notes",
    description: "List all saved note topics.",
    schema: z.object({}),
  }
);


// 6. CREATE AGENT WITH STORE
const checkpointer = new MemorySaver();

export const agent = createAgent({
  model: "gpt-4o",
  tools: [saveNote, getNote, listNotes],
  checkpointer,
  contextSchema,
  store, // Pass store for long-term memory
});


/*
  7. DEMO: LONG-TERM MEMORY ACROSS CONVERSATIONS
  Run with: npx tsx src/8-store/store-demo.ts
 */
if (process.argv[1]?.includes("store-demo")) {
  const userId = "alice-123";

  // --- CONVERSATION 1: Save some notes ---
  console.log("=== CONVERSATION 1 (thread: conv-1) ===");

  const conversation1 = [
    "Remember that my favorite color is blue",
    "Also save that I prefer morning meetings",
  ];

  for (const query of conversation1) {
    console.log(`\nUser: ${query}`);
    const response = await agent.invoke(
      { messages: [new HumanMessage(query)] },
      {
        configurable: { thread_id: "conv-1" },
        context: { userId },
      }
    );
    const lastMessage = response.messages[response.messages.length - 1];
    console.log("Agent:", lastMessage.content);
  }

  // --- CONVERSATION 2: Different thread, same user - notes persist! ---
  console.log("\n\n=== CONVERSATION 2 (thread: conv-2) ===");
  console.log("(Different conversation, but same user - notes should persist)");

  const conversation2 = [
    "What notes do I have saved?",
    "What's my favorite color?",
    "Save a note that I'm learning TypeScript",
  ];

  for (const query of conversation2) {
    console.log(`\nUser: ${query}`);
    const response = await agent.invoke(
      { messages: [new HumanMessage(query)] },
      {
        configurable: { thread_id: "conv-2" }, // Different thread!
        context: { userId },
      }
    );
    const lastMessage = response.messages[response.messages.length - 1];
    console.log("Agent:", lastMessage.content);
  }

  // --- CONVERSATION 3: Verify all notes ---
  console.log("\n\n=== CONVERSATION 3 (thread: conv-3) ===");

  const response = await agent.invoke(
    { messages: [new HumanMessage("List all my notes")] },
    {
      configurable: { thread_id: "conv-3" },
      context: { userId },
    }
  );
  console.log("\nUser: List all my notes");
  console.log("Agent:", response.messages[response.messages.length - 1].content);

  console.log("\n--- Demo Complete ---");
  console.log("Key insight: Notes persisted across 3 different conversations (threads)!");
}
