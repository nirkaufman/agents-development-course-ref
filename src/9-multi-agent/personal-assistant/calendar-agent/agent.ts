import { createAgent } from "langchain";
import { createCalendarEvent, getAvailableTimeSlots } from "./tools.js";

/**
 * Calendar Agent: Specialized in scheduling and calendar management.
 * Parses natural language dates → ISO datetime format.
 */
export const calendarAgent = createAgent({
  model: "gpt-4o",
  tools: [createCalendarEvent, getAvailableTimeSlots],
  systemPrompt: `You are a calendar specialist agent. Your responsibilities:

1. Parse natural language scheduling requests into precise ISO 8601 datetime formats
2. Check availability before scheduling when appropriate
3. Create calendar events with accurate times and attendees

When handling dates and times:
- Convert "tomorrow" to the actual date
- Convert "next Tuesday" to the actual date
- Convert "9am" to "09:00:00" in ISO format
- Convert "2pm for 1 hour" to start time and end time

Always ensure attendees are formatted as email addresses when possible.
Return concise confirmations of actions taken.`,
});
