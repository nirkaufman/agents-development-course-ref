import * as z from "zod";
import { MessagesValue, StateSchema } from "@langchain/langgraph";

/**
 * Custom State Schema for Customer Support Workflow
 *
 * Tracks:
 * - currentStep: Which workflow step the agent is in
 * - warrantyStatus: Whether the product is in/out of warranty
 * - issueType: Hardware or software issue
 *
 * State transitions:
 *   warranty_collector → issue_classifier → resolution_specialist
 */
export const SupportState = new StateSchema({
  // Built-in messages value with message-aware reducer
  messages: MessagesValue,

  // Current workflow step (state machine position)
  currentStep: z
    .enum(["warranty_collector", "issue_classifier", "resolution_specialist"])
    .optional(),

  // Collected warranty information
  warrantyStatus: z.enum(["in_warranty", "out_of_warranty"]).optional(),

  // Collected issue classification
  issueType: z.enum(["hardware", "software"]).optional(),
});

// Type helper for state access
export type SupportStateType = {
  messages: unknown[];
  currentStep?:
    | "warranty_collector"
    | "issue_classifier"
    | "resolution_specialist";
  warrantyStatus?: "in_warranty" | "out_of_warranty";
  issueType?: "hardware" | "software";
};
