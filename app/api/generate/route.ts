// app/api/generate/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { keyword } = await req.json();

  const prompt = `
You are an expert SEO copywriter. Write a concise, Google AI Overview–optimized blog post for the topic: "${keyword}".

Instructions:
- Start with a direct summary (1–2 sentences)
- Use subheadings (H2) and bullet points
- Write clearly and factually
- End with a final summary
`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: 'You are a helpful AI content assistant.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
    }),
  });

  const data = await response.json();
  console.log('🔍 OpenAI Response:', data); // Log for debugging

  if (!response.ok) {
    return NextResponse.json({ result: `Error: ${data.error?.message || 'Unknown error'}` });
  }

  const result = data.choices?.[0]?.message?.content || 'No response from AI.';
  return NextResponse.json({ result });
}
