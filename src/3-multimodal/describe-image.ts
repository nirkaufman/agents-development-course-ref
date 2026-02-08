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

// Read and encode image to Base64
const imagePath = path.join(import.meta.dirname, 'assets', 'sample.jpg');
const imageData = fs.readFileSync(imagePath);
const base64Image = imageData.toString('base64');

// Create multimodal message with text and image content blocks
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

// Invoke the model and display the response
const response = await model.invoke([message]);
console.log(response.content);
