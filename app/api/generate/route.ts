// app/api/generate/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { keyword, tone, industry } = await req.json();

  console.log("📩 Received POST data:", keyword, tone);



const prompt = `
    You are an expert SEO copywriter${industry ? ` specializing in the ${industry} industry` : ''}.
    Write a ${tone?.toLowerCase() || 'friendly'}, concise, Google AI Overview–optimized blog post for the topic: "${keyword}".

    Instructions:
    - Start with a direct summary (1–2 sentences)
    - Use subheadings (H2) and bullet points
    - Write clearly and factually using terminology appropriate to ${industry || 'general audiences'}
    - End with a final summary
    `;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: 'You are a helpful AI content assistant.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
    }),
  });

  const data = await response.json();
  console.log('🔍 OpenAI Response:', data); // Log for debugging
  console.log("📝 Final prompt:", prompt);

  if (!response.ok) {
    console.error("❌ OpenAI API error:", data.error?.message || data);
    return NextResponse.json({ result: `Error: ${data.error?.message || 'Unknown error'}` }, { status: 500 });
  }

  // Extract result
  const result = data.choices?.[0]?.message?.content;

  if (!result) {
    console.error("❌ No content from OpenAI");
    return NextResponse.json({ result: null }, { status: 500 });
  }

  // Success: return the content
  return NextResponse.json({ result });
}
