import * as z from "zod";
import { tool } from "@langchain/core/tools";
import { interrupt } from "@langchain/langgraph";

/**
 * Stubbed tool simulating a calendar API (e.g., Google Calendar, Outlook).
 * Requires ISO 8601 datetime format.
 * Uses interrupt() to pause execution for human approval.
 */
export const createCalendarEvent = tool(
  async ({ title, startTime, endTime, attendees }) => {
    // Interrupt for human approval before creating the event
    const response = interrupt({
      action: "create_calendar_event",
      title,
      startTime,
      endTime,
      attendees,
      message: `Approve creating calendar event: "${title}" from ${startTime} to ${endTime}?`,
    });

    // Handle the response after resume
    if (response?.action === "approve") {
      // Allow edits from the approval response
      const finalTitle = response.title ?? title;
      const finalStartTime = response.startTime ?? startTime;
      const finalEndTime = response.endTime ?? endTime;
      const finalAttendees = response.attendees ?? attendees;

      console.log(
        `[Calendar API] Created event: "${finalTitle}" from ${finalStartTime} to ${finalEndTime}`
      );
      console.log(`[Calendar API] Attendees: ${finalAttendees.join(", ")}`);

      return `Successfully created calendar event "${finalTitle}" for ${finalStartTime} to ${finalEndTime} with attendees: ${finalAttendees.join(", ")}`;
    }

    return "Calendar event creation was cancelled by the user.";
  },
  {
    name: "create_calendar_event",
    description:
      "Create a calendar event. Requires ISO 8601 datetime format (YYYY-MM-DDTHH:mm:ss).",
    schema: z.object({
      title: z.string().describe("Title of the calendar event"),
      startTime: z
        .string()
        .describe("Start time in ISO 8601 format (e.g., 2024-03-15T14:00:00)"),
      endTime: z
        .string()
        .describe("End time in ISO 8601 format (e.g., 2024-03-15T15:00:00)"),
      attendees: z
        .array(z.string())
        .describe("List of attendee email addresses"),
    }),
  }
);

/**
 * Stubbed tool to check calendar availability.
 * Returns available time slots for a given date.
 */
export const getAvailableTimeSlots = tool(
  async ({ date }) => {
    // Simulate checking calendar availability
    console.log(`[Calendar API] Checking availability for ${date}`);

    // Return stubbed available slots
    const slots = [
      { start: `${date}T09:00:00`, end: `${date}T10:00:00` },
      { start: `${date}T11:00:00`, end: `${date}T12:00:00` },
      { start: `${date}T14:00:00`, end: `${date}T15:00:00` },
      { start: `${date}T16:00:00`, end: `${date}T17:00:00` },
    ];

    return `Available time slots for ${date}:\n${slots.map((s) => `  - ${s.start} to ${s.end}`).join("\n")}`;
  },
  {
    name: "get_available_time_slots",
    description:
      "Check available time slots on a specific date. Returns available 1-hour blocks.",
    schema: z.object({
      date: z.string().describe("Date in YYYY-MM-DD format"),
    }),
  }
);
