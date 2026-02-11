import "dotenv/config";
import * as z from "zod";
import { tool } from "@langchain/core/tools";
import { createAgent } from "langchain";
import { Command, MemorySaver } from "@langchain/langgraph";
import { HumanMessage } from "@langchain/core/messages";

// Import specialized sub-agents
import { calendarAgent } from "./calendar-agent/agent.js";
import { emailAgent } from "./email-agent/agent.js";

/**
 * Personal Assistant with Subagents Demo
 *
 * This demonstrates the supervisor pattern with specialized calendar and email agents,
 * including human-in-the-loop review for sensitive actions.
 *
 * Architecture:
 *
 * User Request
 *      │
 *      ▼
 * ┌──────────────────┐
 * │    Supervisor    │  (Main Agent with checkpointer)
 * │      Agent       │
 * └──────────────────┘
 *      │
 *      ├─── schedule_event ───► Calendar Agent
 *      │                           │
 *      │                           ├─► get_available_time_slots
 *      │                           └─► create_calendar_event ──► [INTERRUPT]
 *      │
 *      └─── manage_email ─────► Email Agent
 *                                  │
 *                                  └─► send_email ──► [INTERRUPT]
 */

// =============================================================================
// WRAP SUB-AGENTS AS TOOLS (High-level tools for supervisor)
// =============================================================================

/**
 * High-level scheduling tool that delegates to the calendar agent.
 * The supervisor uses this to handle all calendar-related requests.
 */
const scheduleEvent = tool(
  async ({ request }) => {
    console.log(`\n[Supervisor → Calendar Agent] Delegating: "${request}"`);

    const result = await calendarAgent.invoke({
      messages: [new HumanMessage(request)],
    });

    const lastMessage = result.messages.at(-1);
    const content = lastMessage?.content;

    // Handle interrupt responses (pass through to caller)
    if (result.__interrupt__) {
      return JSON.stringify({
        status: "pending_approval",
        interrupt: result.__interrupt__,
      });
    }

    return typeof content === "string" ? content : JSON.stringify(content);
  },
  {
    name: "schedule_event",
    description:
      "Delegate scheduling and calendar management to the calendar specialist. Use for creating events, checking availability, and managing schedules.",
    schema: z.object({
      request: z
        .string()
        .describe("Natural language description of the scheduling request"),
    }),
  }
);

/**
 * High-level email tool that delegates to the email agent.
 * The supervisor uses this to handle all email-related requests.
 */
const manageEmail = tool(
  async ({ request }) => {
    console.log(`\n[Supervisor → Email Agent] Delegating: "${request}"`);

    const result = await emailAgent.invoke({
      messages: [new HumanMessage(request)],
    });

    const lastMessage = result.messages.at(-1);
    const content = lastMessage?.content;

    // Handle interrupt responses (pass through to caller)
    if (result.__interrupt__) {
      return JSON.stringify({
        status: "pending_approval",
        interrupt: result.__interrupt__,
      });
    }

    return typeof content === "string" ? content : JSON.stringify(content);
  },
  {
    name: "manage_email",
    description:
      "Delegate email composition and sending to the email specialist. Use for drafting and sending emails.",
    schema: z.object({
      request: z
        .string()
        .describe("Natural language description of the email request"),
    }),
  }
);

// =============================================================================
// SUPERVISOR AGENT
// =============================================================================

const checkpointer = new MemorySaver();

/**
 * Supervisor Agent: Coordinates calendar and email specialists.
 * Routes user requests to the appropriate domain specialist.
 */
export const agent = createAgent({
  model: "gpt-4o",
  tools: [scheduleEvent, manageEmail],
  checkpointer,
  systemPrompt: `You are a helpful personal assistant that coordinates specialized agents.

Available specialists:
- schedule_event: For all calendar and scheduling tasks (creating events, checking availability)
- manage_email: For all email tasks (composing and sending emails)

Guidelines:
1. Analyze each request and delegate to the appropriate specialist(s)
2. For complex requests that involve both calendar and email, invoke both specialists
3. Summarize the results for the user in a clear, concise manner
4. If a request spans multiple domains, handle them in a logical order (usually schedule first, then email)

Examples:
- "Schedule a meeting tomorrow at 2pm" → use schedule_event
- "Send an email to the team about the project" → use manage_email
- "Schedule a meeting and send a reminder email" → use both schedule_event AND manage_email`,
});

// =============================================================================
// DEMO EXECUTION
// =============================================================================

async function runDemo() {
  console.log("=".repeat(70));
  console.log("Personal Assistant with Subagents Demo");
  console.log("=".repeat(70));

  const threadId = "personal-assistant-demo-1";
  const config = { configurable: { thread_id: threadId } };

  // Demo 1: Single-domain request (Calendar only)
  console.log("\n--- Demo 1: Single-domain Calendar Request ---\n");

  const calendarQuery =
    "Check my availability for next Monday (2024-03-18) and schedule a team standup at 9am for 1 hour";
  console.log(`User: ${calendarQuery}`);

  const calendarResult = await agent.invoke(
    { messages: [new HumanMessage(calendarQuery)] },
    config
  );

  // Check for interrupt
  if (calendarResult.__interrupt__) {
    console.log("\n[INTERRUPT] Waiting for approval...");
    console.log("Interrupt payload:", JSON.stringify(calendarResult.__interrupt__, null, 2));

    // Simulate approval
    console.log("\n[Simulating approval...]");
    const resumed = await agent.invoke(
      new Command({ resume: { action: "approve" } }),
      config
    );
    console.log(
      "\nAssistant:",
      resumed.messages[resumed.messages.length - 1].content
    );
  } else {
    console.log(
      "\nAssistant:",
      calendarResult.messages[calendarResult.messages.length - 1].content
    );
  }

  // Demo 2: Single-domain request (Email only)
  console.log("\n--- Demo 2: Single-domain Email Request ---\n");

  const emailQuery =
    "Send an email to design-team@company.com reminding them to review the new mockups before Friday";
  console.log(`User: ${emailQuery}`);

  const emailResult = await agent.invoke(
    { messages: [new HumanMessage(emailQuery)] },
    { configurable: { thread_id: "personal-assistant-demo-2" } }
  );

  if (emailResult.__interrupt__) {
    console.log("\n[INTERRUPT] Waiting for approval...");
    console.log("Interrupt payload:", JSON.stringify(emailResult.__interrupt__, null, 2));

    // Simulate approval with an edit
    console.log("\n[Simulating approval with subject edit...]");
    const resumed = await agent.invoke(
      new Command({
        resume: { action: "approve", subject: "Reminder: Mockup Review Due Friday" },
      }),
      { configurable: { thread_id: "personal-assistant-demo-2" } }
    );
    console.log(
      "\nAssistant:",
      resumed.messages[resumed.messages.length - 1].content
    );
  } else {
    console.log(
      "\nAssistant:",
      emailResult.messages[emailResult.messages.length - 1].content
    );
  }

  // Demo 3: Multi-domain coordination (Calendar + Email)
  console.log("\n--- Demo 3: Multi-domain Coordination ---\n");

  const multiDomainQuery =
    "Schedule a meeting with the design team next Tuesday (2024-03-19) at 2pm for 1 hour, and send them an email reminder about reviewing the new mockups beforehand.";
  console.log(`User: ${multiDomainQuery}`);

  const multiResult = await agent.invoke(
    { messages: [new HumanMessage(multiDomainQuery)] },
    { configurable: { thread_id: "personal-assistant-demo-3" } }
  );

  // Handle potential interrupts for multi-domain request
  let currentResult = multiResult;
  let interruptCount = 0;

  while (currentResult.__interrupt__ && interruptCount < 5) {
    interruptCount++;
    console.log(`\n[INTERRUPT ${interruptCount}] Waiting for approval...`);
    console.log("Interrupt payload:", JSON.stringify(currentResult.__interrupt__, null, 2));

    console.log("\n[Simulating approval...]");
    currentResult = await agent.invoke(
      new Command({ resume: { action: "approve" } }),
      { configurable: { thread_id: "personal-assistant-demo-3" } }
    );
  }

  console.log(
    "\nAssistant:",
    currentResult.messages[currentResult.messages.length - 1].content
  );

  console.log("\n" + "=".repeat(70));
  console.log("Demo Complete");
  console.log("=".repeat(70));
}

// Run demo when executed directly
if (process.argv[1]?.includes("personal-assistant")) {
  runDemo().catch(console.error);
}
