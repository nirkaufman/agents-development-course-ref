import * as z from "zod";
import { tool } from "@langchain/core/tools";
import { ToolMessage } from "@langchain/core/messages";
import { Command } from "@langchain/langgraph";

/**
 * Workflow Tools for Customer Support
 *
 * Each tool uses Command to:
 * 1. Record collected information in state
 * 2. Transition to the next workflow step
 * 3. Return a ToolMessage for valid message history
 */

/**
 * Step 1 → Step 2: Record warranty status and advance to issue classification
 */
export const recordWarrantyStatus = tool(
  async ({ status }, config) => {
    console.log(`\n[Tool] Recording warranty status: ${status}`);

    return new Command({
      update: {
        warrantyStatus: status,
        currentStep: "issue_classifier", // Transition to next step
        messages: [
          new ToolMessage({
            content: `Warranty status recorded: ${status}. Now proceeding to classify the issue.`,
            tool_call_id: config.toolCall?.id ?? "",
          }),
        ],
      },
    });
  },
  {
    name: "record_warranty_status",
    description:
      "Record whether the customer's product is in warranty or out of warranty. Call this after determining the warranty status from the conversation.",
    schema: z.object({
      status: z
        .enum(["in_warranty", "out_of_warranty"])
        .describe("The warranty status of the product"),
    }),
  }
);

/**
 * Step 2 → Step 3: Record issue type and advance to resolution
 */
export const recordIssueType = tool(
  async ({ type }, config) => {
    console.log(`\n[Tool] Recording issue type: ${type}`);

    return new Command({
      update: {
        issueType: type,
        currentStep: "resolution_specialist", // Transition to final step
        messages: [
          new ToolMessage({
            content: `Issue type recorded: ${type}. Now proceeding to provide resolution.`,
            tool_call_id: config.toolCall?.id ?? "",
          }),
        ],
      },
    });
  },
  {
    name: "record_issue_type",
    description:
      "Record whether the issue is hardware-related or software-related. Call this after understanding the nature of the problem.",
    schema: z.object({
      type: z
        .enum(["hardware", "software"])
        .describe("The type of issue: hardware or software"),
    }),
  }
);

/**
 * Step 3: Provide solution to the customer (terminal action)
 */
export const provideSolution = tool(
  async ({ solution, warrantyStatus, issueType }, config) => {
    console.log(`\n[Tool] Providing solution for ${issueType} issue (${warrantyStatus})`);

    return new Command({
      update: {
        messages: [
          new ToolMessage({
            content: `Solution provided to customer:\n\n${solution}`,
            tool_call_id: config.toolCall?.id ?? "",
          }),
        ],
      },
    });
  },
  {
    name: "provide_solution",
    description:
      "Provide the final resolution/solution to the customer based on their warranty status and issue type.",
    schema: z.object({
      solution: z.string().describe("The detailed solution or next steps for the customer"),
      warrantyStatus: z
        .enum(["in_warranty", "out_of_warranty"])
        .describe("The customer's warranty status"),
      issueType: z.enum(["hardware", "software"]).describe("The type of issue"),
    }),
  }
);

/**
 * Step 3: Escalate to human support (terminal action)
 */
export const escalateToHuman = tool(
  async ({ reason, summary }, config) => {
    console.log(`\n[Tool] Escalating to human support: ${reason}`);

    return new Command({
      update: {
        messages: [
          new ToolMessage({
            content: `Case escalated to human support.\n\nReason: ${reason}\n\nSummary: ${summary}`,
            tool_call_id: config.toolCall?.id ?? "",
          }),
        ],
      },
    });
  },
  {
    name: "escalate_to_human",
    description:
      "Escalate the case to a human support agent when the issue cannot be resolved automatically (e.g., out-of-warranty hardware issues requiring paid repair).",
    schema: z.object({
      reason: z.string().describe("The reason for escalation"),
      summary: z.string().describe("Summary of the issue and what has been collected so far"),
    }),
  }
);

// Export all tools for agent registration
export const allTools = [
  recordWarrantyStatus,
  recordIssueType,
  provideSolution,
  escalateToHuman,
];
