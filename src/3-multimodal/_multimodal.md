# Multimodal Content

## Overview

Multimodal capabilities allow LLMs to process different types of input beyond text, such as images, audio, and video. This enables use cases like image description, visual question answering, and document analysis.

## Image Input: __describe-image.ts__

### Supported Input Types

LangChain supports multiple ways to provide image input:

1. **Base64 encoded data** - Image data encoded as a Base64 string
2. **URL** - Direct link to an image
3. **File path** - Local file path (converted to Base64)

### Message Structure

Multimodal messages use content blocks within a `HumanMessage`:

```typescript
const message = new HumanMessage({
  content: [
    { type: "text", text: "Your prompt here" },
    {
      type: "image",
      source_type: "base64",
      data: "<base64-encoded-data>",
      mime_type: "image/jpeg",
    },
  ],
});
```

### Content Block Types

| Type | Description |
|------|-------------|
| `text` | Text prompt or question |
| `image` | Image data (base64, URL, or file) |

### Image Source Types

| source_type | Description |
|-------------|-------------|
| `base64` | Base64 encoded image data |
| `url` | Direct URL to an image |

### Supported MIME Types

- `image/jpeg`
- `image/png`
- `image/gif`
- `image/webp`

## Vision-Capable Models

Not all models support image input. Common vision-capable models:

| Provider | Models |
|----------|--------|
| OpenAI | `gpt-4o`, `gpt-4o-mini`, `gpt-4-turbo` |
| Anthropic | `claude-3-opus`, `claude-3-sonnet`, `claude-3-haiku` |
| Google | `gemini-pro-vision`, `gemini-1.5-pro` |

## Use Cases

1. **Image Description** - Describe contents of an image
2. **Visual Q&A** - Answer questions about images
3. **Document Analysis** - Extract information from documents/receipts
4. **Object Detection** - Identify objects in images
5. **OCR** - Extract text from images

## Best Practices

1. **Use appropriate models** - Ensure the model supports vision capabilities
2. **Optimize image size** - Resize large images to reduce token usage
3. **Be specific in prompts** - Guide the model on what aspects to focus on
4. **Handle errors** - Account for cases where image processing fails
