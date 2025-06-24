// app/api/generate/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { keyword, tone, industry } = await req.json();

  console.log("📩 Received POST data:", keyword, tone);



const prompt = `
  You are an expert SEO copywriter${industry ? ` specializing in the ${industry} industry` : ''}.
  Write a ${tone?.toLowerCase() || 'friendly'}, concise blog post optimized for Google's AI Overviews for the topic: "${keyword}".

  Output only raw HTML that is ready to be pasted into a WordPress post editor.

  Instructions:
  - Do NOT include <!DOCTYPE>, <html>, <head>, or <body> tags.
  - Begin with a <p> summary (1–2 sentences).
  - Use <h2> tags for section headings.
  - Use <p> tags for supporting content.
  - Do not include bullet points, markdown, or any instructional text.
  - Write clearly and factually using terms appropriate for ${industry || 'a general audience'}.
  - End with a brief <p> summary or takeaway.

  Output only clean HTML without any wrapper or metadata.
`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4-turbo',
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

  console.log(result);

  if (!result) {
    console.error("❌ No content from OpenAI");
    return NextResponse.json({ result: null }, { status: 500 });
  }

  // Success: return the content
  return NextResponse.json({ result });
}
