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

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent?key=${process.env.GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: prompt }
            ]
          }
        ]
      }),
    });

    const data = await response.json();
    console.log('🔍 Gemini Response:', JSON.stringify(data, null, 2)); // More readable log
    console.log("📝 Final prompt:", prompt);

    if (!response.ok) {
      console.error("❌ Gemini API error:", data.error?.message || data);
      return NextResponse.json({ result: `Error: ${data.error?.message || 'Unknown error'}` }, { status: 500 });
    }

    const result = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!result) {
      console.error("❌ No content from Gemini");
      return NextResponse.json({ result: null }, { status: 500 });
    }

    console.log(result);

    // Success: return the content
    return NextResponse.json({ result });

  } catch (error) {
    console.error('❌ Gemini API call failed:', error);
    return NextResponse.json({ result: 'Error contacting Gemini API.' }, { status: 500 });
  }
}
