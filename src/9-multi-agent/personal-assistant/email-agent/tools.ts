import * as z from "zod";
import { tool } from "@langchain/core/tools";
import { interrupt } from "@langchain/langgraph";

/**
 * Stubbed tool simulating an email API (e.g., SendGrid, Gmail).
 * Uses interrupt() to pause execution for human approval.
 */
export const sendEmail = tool(
  async ({ to, subject, body }) => {
    // Interrupt for human approval before sending the email
    const response = interrupt({
      action: "send_email",
      to,
      subject,
      body,
      message: `Approve sending email to ${to.join(", ")}?`,
    });

    // Handle the response after resume
    if (response?.action === "approve") {
      // Allow edits from the approval response
      const finalTo = response.to ?? to;
      const finalSubject = response.subject ?? subject;
      const finalBody = response.body ?? body;

      console.log(`[Email API] Sending email to: ${finalTo.join(", ")}`);
      console.log(`[Email API] Subject: ${finalSubject}`);
      console.log(`[Email API] Body: ${finalBody}`);

      return `Successfully sent email to ${finalTo.join(", ")} with subject "${finalSubject}"`;
    }

    return "Email sending was cancelled by the user.";
  },
  {
    name: "send_email",
    description: "Send an email to one or more recipients.",
    schema: z.object({
      to: z.array(z.string()).describe("List of recipient email addresses"),
      subject: z.string().describe("Email subject line"),
      body: z.string().describe("Email body content"),
    }),
  }
);
