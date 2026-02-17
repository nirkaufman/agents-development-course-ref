import "dotenv/config";
import { createAgent, createMiddleware } from "langchain";
import { MemorySaver } from "@langchain/langgraph";
import { HumanMessage } from "@langchain/core/messages";

import { SupportState, SupportStateType } from "./state.js";
import { allTools } from "./tools.js";
import { STEP_CONFIG, StepName } from "./prompts.js";

/**
 * Customer Support with Handoffs Demo
 *
 * This demonstrates the STATE MACHINE pattern where a single agent's
 * configuration (prompts + tools) changes dynamically based on workflow state.
 *
 * Key Difference from Personal Assistant:
 * - Personal Assistant: Supervisor pattern with multiple sub-agents as tools
 * - Customer Support: State machine pattern with ONE agent, dynamic configuration
 *
 * Architecture:
 *
 * User Reports Issue
 *        │
 *        ▼
 * ┌─────────────────────────────────────────────────────────┐
 * │           SINGLE AGENT (with step-based middleware)     │
 * │                                                         │
 * │  ┌──────────────────┐   ┌──────────────────┐           │
 * │  │ warranty_collector│──▶│ issue_classifier │           │
 * │  │   (Step 1)       │   │    (Step 2)      │           │
 * │  │                  │   │                  │           │
 * │  │ Tools:           │   │ Tools:           │           │
 * │  │ • record_warranty│   │ • record_issue   │           │
 * │  └──────────────────┘   └──────────────────┘           │
 * │                                  │                      │
 * │                                  ▼                      │
 * │                       ┌──────────────────┐              │
 * │                       │resolution_specialist│           │
 * │                       │    (Step 3)      │              │
 * │                       │                  │              │
 * │                       │ Tools:           │              │
 * │                       │ • provide_solution│             │
 * │                       │ • escalate_human │              │
 * │                       └──────────────────┘              │
 * └─────────────────────────────────────────────────────────┘
 *        │
 *        ▼
 *    Issue Resolved
 */

// =============================================================================
// MIDDLEWARE: Apply step configuration dynamically
// =============================================================================

/**
 * Step-based middleware that dynamically configures the agent.
 *
 * For each model call, this middleware:
 * 1. Reads currentStep from state (defaults to "warranty_collector")
 * 2. Looks up the step configuration
 * 3. Validates required state exists
 * 4. Formats the prompt with state values
 * 5. Applies the step-specific tools
 */
const applyStepMiddleware = createMiddleware({
  name: "applyStep",
  stateSchema: SupportState,
  wrapModelCall: async (request, handler) => {
    // Get current step (defaults to warranty_collector for first interaction)
    const state = request.state as SupportStateType;
    const currentStep: StepName = state.currentStep ?? "warranty_collector";

    console.log(`\n[Middleware] Current step: ${currentStep}`);

    // Look up step configuration
    const stepConfig = STEP_CONFIG[currentStep];

    // Validate required state exists
    for (const key of stepConfig.requires) {
      const stateValue = state[key as keyof SupportStateType];
      if (stateValue === undefined) {
        throw new Error(`${key} must be set before reaching ${currentStep}`);
      }
    }

    // Format prompt with state values (supports {warrantyStatus}, {issueType}, etc.)
    let systemPrompt: string = stepConfig.prompt;
    for (const [key, value] of Object.entries(state)) {
      if (key !== "messages") {
        systemPrompt = systemPrompt.replace(`{${key}}`, String(value ?? ""));
      }
    }

    console.log(`[Middleware] Tools available: ${stepConfig.tools.map((t) => t.name).join(", ")}`);

    // Inject system prompt and step-specific tools
    return handler({
      ...request,
      systemPrompt,
      tools: [...stepConfig.tools],
    });
  },
});

// =============================================================================
// AGENT: Single agent with dynamic configuration via middleware
// =============================================================================

const checkpointer = new MemorySaver();

/**
 * Customer Support Agent
 *
 * A single agent that changes behavior based on workflow state.
 * The middleware dynamically applies different prompts and tools
 * depending on the current step in the support workflow.
 */
export const agent = createAgent({
  model: "gpt-4o",
  tools: allTools, // All tools registered, but middleware filters per step
  stateSchema: SupportState,
  middleware: [applyStepMiddleware],
  checkpointer,
});

// =============================================================================
// DEMO: Multi-turn conversation showing state transitions
// =============================================================================

async function runDemo() {
  console.log("=".repeat(70));
  console.log("Customer Support with Handoffs Demo");
  console.log("=".repeat(70));
  console.log("\nThis demo shows a state machine pattern where ONE agent's");
  console.log("prompts and tools change dynamically based on workflow state.\n");

  const threadId = "customer-support-demo-1";
  const config = { configurable: { thread_id: threadId } };

  // Simulate a multi-turn customer support conversation
  const conversation = [
    // Turn 1: Initial contact (warranty_collector step)
    "Hi, my phone screen is cracked and I need help getting it fixed.",

    // Turn 2: Warranty response → triggers transition to issue_classifier
    "I bought the phone about 6 months ago, so it should still be under warranty.",

    // Turn 3: Issue details → triggers transition to resolution_specialist
    "The screen is physically cracked from when I dropped it. It still turns on but the display is damaged.",

    // Turn 4: Resolution (hardware + in_warranty → warranty repair instructions)
    "What should I do next to get this repaired?",
  ];

  for (let i = 0; i < conversation.length; i++) {
    const userMessage = conversation[i];
    console.log(`\n${"─".repeat(70)}`);
    console.log(`Turn ${i + 1}:`);
    console.log(`${"─".repeat(70)}`);
    console.log(`\nUser: ${userMessage}`);

    const response = await agent.invoke(
      { messages: [new HumanMessage(userMessage)] },
      config
    );

    const lastMessage = response.messages[response.messages.length - 1];
    console.log(`\nAssistant: ${lastMessage.content}`);

    // Show current state
    console.log(`\n[State] currentStep: ${response.currentStep ?? "warranty_collector"}`);
    if (response.warrantyStatus) {
      console.log(`[State] warrantyStatus: ${response.warrantyStatus}`);
    }
    if (response.issueType) {
      console.log(`[State] issueType: ${response.issueType}`);
    }
  }

  console.log(`\n${"=".repeat(70)}`);
  console.log("Demo Complete");
  console.log("=".repeat(70));

  // Summary of workflow
  console.log("\nWorkflow Summary:");
  console.log("1. warranty_collector: Collected warranty status (in_warranty)");
  console.log("2. issue_classifier: Classified issue (hardware)");
  console.log("3. resolution_specialist: Provided warranty repair instructions");
  console.log("\nKey Learning: Single agent, dynamic configuration via middleware!");
}

// Run demo when executed directly
if (process.argv[1]?.includes("customer-support")) {
  runDemo().catch(console.error);
}
