import OpenAI from "openai";

// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function generatePostIdeas(topic?: string): Promise<string[]> {
  const prompt = topic 
    ? `Generate 5 creative post ideas about "${topic}" for a micro-blogging platform. Each idea should be engaging and thought-provoking. Return only a JSON array of strings.`
    : `Generate 5 creative post ideas for a micro-blogging platform. Each idea should be engaging, diverse, and thought-provoking. Include topics like technology, productivity, life lessons, hot takes, or interesting questions. Return only a JSON array of strings.`;

  const response = await openai.chat.completions.create({
    model: "gpt-5",
    messages: [
      {
        role: "system",
        content: "You are a creative writing assistant for a micro-blogging platform. Generate engaging post ideas that encourage discussion and interaction. Respond with JSON in this format: { \"ideas\": [\"idea1\", \"idea2\", ...] }"
      },
      {
        role: "user",
        content: prompt
      }
    ],
    response_format: { type: "json_object" },
  });

  const result = JSON.parse(response.choices[0].message.content || '{"ideas":[]}');
  return result.ideas || [];
}

export async function proofreadPost(content: string): Promise<{
  correctedText: string;
  suggestions: Array<{
    original: string;
    suggestion: string;
    reason: string;
  }>;
}> {
  const response = await openai.chat.completions.create({
    model: "gpt-5",
    messages: [
      {
        role: "system",
        content: "You are a professional proofreader and editor. Check for grammar, spelling, clarity, and style improvements. Return JSON with: { \"correctedText\": \"the improved version\", \"suggestions\": [{\"original\": \"text\", \"suggestion\": \"improved text\", \"reason\": \"why\"}] }"
      },
      {
        role: "user",
        content: `Proofread and improve this post:\n\n${content}`
      }
    ],
    response_format: { type: "json_object" },
  });

  const result = JSON.parse(response.choices[0].message.content || '{"correctedText":"","suggestions":[]}');
  return {
    correctedText: result.correctedText || content,
    suggestions: result.suggestions || []
  };
}
