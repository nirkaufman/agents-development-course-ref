import 'dotenv/config';
import * as fs from 'fs';
import * as path from 'path';
import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage } from "@langchain/core/messages";

// Use a vision-capable model
const model = new ChatOpenAI({
  model: "gpt-4o",
  maxTokens: 500,
});

// Export model for potential reuse
export { model };

// Demo invocation - only runs when executed directly via CLI
// Run with: npx tsx src/3-multimodal/describe-image.ts
if (process.argv[1]?.includes('describe-image.ts')) {
  const imagePath = path.join(import.meta.dirname, 'assets', 'sample.jpg');
  const imageData = fs.readFileSync(imagePath);
  const base64Image = imageData.toString('base64');

  const message = new HumanMessage({
    content: [
      { type: "text", text: "Describe what you see in this image in detail." },
      {
        type: "image",
        source_type: "base64",
        data: base64Image,
        mime_type: "image/jpeg",
      },
    ],
  });

  const response = await model.invoke([message]);
  console.log(response.content);
}
