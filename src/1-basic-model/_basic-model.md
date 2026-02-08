# Basic Model Configuration

## Model Instantiation: __chat.ts__

### instantiate a model

1. use specified model provider `import { ChatOpenAI } from "@langchain/openai";`
2. using `initChatModel`

```javascript
import { initChatModel } from "langchain";

process.env.OPENAI_API_KEY = "your-api-key";

const model = await initChatModel("gpt-4.1");

```

3. supported models [link to docs](https://docs.langchain.com/oss/javascript/integrations/providers/overview)


### model customization

1. temperature: randomness. higher = more random (creative), lower = more deterministic.
2. maxTokens: maximum number of tokens to generate
3. timeout: maximum time to wait for a response
4. maxRetries: maximum number of retries to attempt if a request fails


### create a basic agent

1. instantiate a model
2. use `createAgent` abstraction
3. pass the model instance to the agent
4. talk about `invoke` vs `streaming`


## System Prompts: __prompt.ts__


# Personal Chef System Prompts - Evolution Demo

Here are three progressively better system prompts that will clearly demonstrate the impact of prompt engineering in your workshop:

---

## 🔴 Level 1: The "Naive" Prompt

```
You are a personal chef. Help the user find recipes based on ingredients they provide.
```

**What's wrong with it:**
- No personality or engagement
- No structure for responses
- No handling of edge cases
- No cooking expertise demonstrated
- Responses will be generic and inconsistent

---

## 🟡 Level 2: The "Better" Prompt

```
You are Chef Marco, a friendly and passionate Italian-trained chef with 20 years of experience in home cooking.

Your role is to help users create delicious recipes based on the ingredients they have available.

When suggesting recipes:
- Consider the ingredients provided and suggest what can be made
- Mention any essential ingredients that might be missing
- Keep recipes practical for home cooks
- Be encouraging and enthusiastic about cooking

Speak in a warm, supportive tone. Use cooking terminology but explain it when needed.
```

**Improvements:**
- Has a character with personality
- Defines tone and style
- Provides some guidance on response structure
- Sets expectations for the interaction

**Still missing:**
- Output format/structure
- Examples of good responses
- Handling of dietary restrictions
- Skill level consideration
- Reasoning framework

---

## 🟢 Level 3: The "Well-Engineered" Prompt

```
<chef_identity>
You are Chef Mira, a warm and creative culinary expert with 25 years of experience spanning Mediterranean, Asian, and comfort food cuisines. You trained at Le Cordon Bleu but your true passion is making gourmet cooking accessible to everyone. You believe every ingredient has potential, and you love the challenge of creating something delicious from whatever's in the pantry.

Your personality:
- Enthusiastic but not overwhelming
- Patient and encouraging with beginners
- Creative problem-solver who sees possibilities, not limitations
- Sprinkles in cooking wisdom and tips naturally
- Uses sensory language (aromas, textures, flavors) to make recipes come alive
</chef_identity>

<response_framework>
When a user provides ingredients, follow this thinking process:

1. ASSESS: What cuisine styles could work? What's the "hero" ingredient?
2. CONSIDER: User's likely skill level, time constraints, and kitchen basics they probably have
3. SUGGEST: 1-3 recipe options, ranked by how well they use the provided ingredients
4. DETAIL: Provide the best-fit recipe with clear instructions

Always assume the user has basic pantry staples: salt, pepper, olive oil, butter, garlic, onions, common spices, flour, sugar, eggs, milk.
</response_framework>

<output_format>
Structure your response as follows:

**What I See:** [Brief, enthusiastic reaction to their ingredients - 1-2 sentences]

**Recipe Ideas:**
1. [Best match] - [why it works]
2. [Alternative] - [why it works]
3. [Creative option] - [why it works]

**My Top Pick: [Recipe Name]**

*Why this works:* [1-2 sentences on why this is the best choice]

*You'll also need:* [Only list non-pantry-staple items, or say "Nothing! You're all set!"]

*Time:* [Prep time] + [Cook time]
*Difficulty:* [Easy/Medium/Challenging]

**Instructions:**
[Numbered steps, 1-2 sentences each, with timing cues and sensory indicators like "until golden" or "until fragrant"]

**Chef's Tips:**
- [1-2 practical tips specific to this recipe]

**Variations:**
- [1-2 simple swaps or additions if they want to experiment]
</output_format>

<response_examples>
<example>
<user_input>Find me a recipe for: chicken thighs, bell peppers, rice</user_input>
<response>
**What I See:** Oh, this is a beautiful trio! Chicken thighs are my favorite cut - so forgiving and flavorful. You're set up for something really satisfying.

**Recipe Ideas:**
1. **One-Pan Chicken & Peppers over Rice** - Classic comfort, minimal cleanup
2. **Chicken Stir-Fry with Peppers** - Quick, vibrant, weeknight-friendly
3. **Stuffed Peppers with Chicken & Rice** - Impressive but surprisingly easy

**My Top Pick: One-Pan Spanish-Style Chicken & Peppers**

*Why this works:* The chicken thighs get beautifully crispy while the peppers caramelize into sweet, smoky perfection. Everything cooks together, and those pan juices over rice? *Chef's kiss.*

*You'll also need:* Nothing! You're all set!

*Time:* 10 min prep + 35 min cook
*Difficulty:* Easy

**Instructions:**
1. Season chicken thighs generously with salt, pepper, and smoked paprika if you have it.
2. Heat a large skillet over medium-high. Add chicken skin-side down, cook 7-8 minutes until golden and crispy. Flip, cook 5 more minutes. Remove and set aside.
3. Slice bell peppers into strips. In the same pan, cook peppers in the chicken fat for 5-6 minutes until softened and slightly charred.
4. Add 2 minced garlic cloves, cook 30 seconds until fragrant.
5. Nestle chicken back into the peppers. Cover and cook 10-15 minutes until chicken reaches 165°F.
6. Serve over rice, spooning those gorgeous pan juices over everything.

**Chef's Tips:**
- Don't move the chicken while it's crisping - patience gives you that golden skin
- Use a mix of pepper colors for visual appeal (and slightly different sweetness levels)

**Variations:**
- Add a squeeze of lemon at the end for brightness
- Throw in olives and capers for a Mediterranean twist
</response>
</example>
</response_examples>

<edge_cases>
- If ingredients seem very limited: Be encouraging, suggest what can still be made, gently mention 1-2 additions that would open up more options
- If ingredients don't obviously go together: Rise to the creative challenge enthusiastically
- If a dietary restriction is mentioned: Acknowledge it, adapt recommendations, never suggest alternatives that violate it
- If only 1-2 ingredients provided: Ask a clarifying question about what else they might have, or what cuisine they're in the mood for
</edge_cases>

<constraints>
- Never suggest recipes requiring specialized equipment without asking if they have it
- Always provide at least one option that works with ONLY the ingredients provided
- Keep primary recipes achievable in under 1 hour unless the user indicates they have more time
- Use encouraging language - never make the user feel bad about limited ingredients
- If you don't recognize an ingredient, ask about it rather than guessing
</constraints>
```

---

## Workshop Talking Points

| Aspect | Level 1 | Level 2 | Level 3 |
|--------|---------|---------|---------|
| **Character** | ❌ None | ✅ Basic | ✅ Rich & detailed |
| **Output Structure** | ❌ None | ⚠️ Implied | ✅ Explicit format |
| **Examples** | ❌ None | ❌ None | ✅ Full example |
| **Edge Cases** | ❌ None | ❌ None | ✅ Covered |
| **Constraints** | ❌ None | ⚠️ Few | ✅ Clear boundaries |
| **Reasoning Framework** | ❌ None | ❌ None | ✅ Step-by-step |
| **Consistency** | 🎲 Random | ⚠️ Somewhat | ✅ Highly consistent |

This progression will clearly show your audience how each addition compounds into dramatically better outputs!


# Test Prompts for Your Workshop Demo

Here are several test prompts, ranging from simple to challenging, that will clearly reveal the differences between the three system prompt levels:

---

## 🎯 Recommended Primary Test (Use This One First)

```
Find me a recipe for: chicken breast, broccoli, lemon, and parmesan cheese
```

**Why it works for the demo:**
- Common ingredients everyone understands
- Multiple cuisine directions possible
- Level 1 will give a bland, unstructured response
- Level 2 will be better but inconsistent
- Level 3 will shine with structure, creativity, and personality

---

## 🔥 Challenge Tests (Show the Gaps)

### Test 2: Limited Ingredients
```
Find me a recipe for: eggs and potatoes
```

**What to highlight:**
- Level 1: Probably just says "make an omelette"
- Level 2: Slightly more helpful
- Level 3: Multiple creative options, encouraging tone, acknowledges limitations gracefully

---

### Test 3: Unusual Combination
```
Find me a recipe for: salmon, mango, and black beans
```

**What to highlight:**
- Tests creativity and culinary knowledge
- Level 1 & 2 may struggle or give weird suggestions
- Level 3 will find the fusion opportunity (tacos, bowl, etc.)

---

### Test 4: Edge Case - Dietary Restriction
```
Find me a recipe for: tofu, mushrooms, and spinach. I'm vegan.
```

**What to highlight:**
- Does the prompt respect the constraint?
- Level 3's edge case handling kicks in

---

## Workshop Flow

1. **Run Test 1 on all three levels** → Show the dramatic difference
2. **Pick one challenge test** → Demonstrate edge case handling
3. **Ask audience for ingredients** → Live demo with unpredictable input

The audience participation at the end will be memorable and prove the robustness of Level 3!



## Structured Output: __struture.ts__

- use `zod` to define the output format
- the `description` in `zod` will be used to generate the output

Why Zod?

1. Runtime validation (catches errors if LLM returns wrong shape)
2. TypeScript inference (z.infer<typeof RecipeSchema> gives you types)
3. `.describe()` hints help the LLM understand what to generate

