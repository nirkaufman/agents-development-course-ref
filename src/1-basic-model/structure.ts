import 'dotenv/config';

import {createAgent} from "langchain";
import {ChatOpenAI} from "@langchain/openai";
import {MemorySaver} from "@langchain/langgraph";
import {z} from "zod";

const checkpointer = new MemorySaver();

// Start with the system prompt
const systemPrompt = `
    <chef_identity>
    You are Chef Mira, a warm and creative culinary expert with 25 years of experience spanning Mediterranean, Asian, and comfort food cuisines. You trained at Le Cordon Bleu but your true passion is making gourmet cooking accessible to everyone.
    
    Your personality:
    - Enthusiastic but not overwhelming
    - Patient and encouraging with beginners  
    - Creative problem-solver who sees possibilities, not limitations
    - Uses sensory language (aromas, textures, flavors) to make recipes come alive
    </chef_identity>
    
    <response_framework>
    When a user provides ingredients:
    1. ASSESS: What cuisine styles could work? What's the "hero" ingredient?
    2. CONSIDER: User's likely skill level and kitchen basics they probably have
    3. SUGGEST: 1-3 recipe options, ranked by fit
    4. DETAIL: Full recipe for the top pick
    
    Assume the user has pantry staples: salt, pepper, olive oil, butter, garlic, onions, common spices.
    </response_framework>
    
    <quality_guidelines>
    - Write initialReaction as Chef Mira would speak - warm, encouraging
    - Instructions should include timing cues ("7-8 minutes") and sensory indicators ("until golden", "until fragrant")
    - Tips should be practical and specific, not generic
    - Never make users feel bad about limited ingredients
    </quality_guidelines>
    
    <edge_cases>
    - Limited ingredients: Be encouraging, suggest what's possible
    - Odd combinations: Rise to the creative challenge
    - Dietary restrictions: Always respect them
    - Only 1-2 ingredients: Ask clarifying questions
    </edge_cases>
`;

// Define the output schema
const RecipeSchema = z.object({
  // Initial reaction
  initialReaction: z
      .string()
      .describe("Chef's enthusiastic 1-2 sentence reaction to the ingredients provided"),

  // Recipe ideas
  recipeIdeas: z
      .array(z.object({
        name: z.string().describe("Recipe name"),
        whyItWorks: z.string().describe("Brief explanation of why this recipe works with the provided ingredients"),
        isTopPick: z.boolean().describe("Whether this is the recommended top pick"),
      }))
      .min(1)
      .max(3)
      .describe("1-3 recipe options ranked by how well they use the provided ingredients"),

  // The detailed top pick recipe
  topPick: z.object({
    name: z.string().describe("Name of the recommended recipe"),
    whyThisWorks: z
        .string()
        .describe("1-2 sentences explaining why this is the best choice for these ingredients"),
    additionalIngredients: z
        .array(z.string())
        .describe("Non-pantry-staple ingredients needed. Empty array if none needed"),
    prepTime: z.string().describe("Preparation time, e.g., '10 min'"),
    cookTime: z.string().describe("Cooking time, e.g., '25 min'"),
    difficulty: z
        .enum(["Easy", "Medium", "Challenging"])
        .describe("Skill level required"),
    instructions: z
        .array(z.string())
        .describe("Step-by-step instructions. Each step should be 1-2 sentences with timing cues and sensory indicators"),
    chefTips: z
        .array(z.string())
        .min(1)
        .max(2)
        .describe("1-2 practical tips specific to this recipe"),
    variations: z
        .array(z.string())
        .min(1)
        .max(2)
        .describe("1-2 simple swaps or additions to experiment with"),
  }),
});

// Instantiate the model
const model = new ChatOpenAI({
  model: "gpt-5.1",
  temperature: 0.5,
  maxTokens: 1000,
  maxRetries: 3,
  timeout: 10000,
});

// when creating the agent, pass the responseFormat option
export const chat = createAgent({
  model,
  checkpointer,
  systemPrompt,
  responseFormat: RecipeSchema,
})


// test with `npx tsx src/1-basic-model/structure.ts`
const result = await chat.invoke({
  messages: [
    {
      role: "user",
      content: "I only have eggs and cheese",
    },
  ],
}, { configurable: { thread_id: "1" } });

console.log(result.structuredResponse);
