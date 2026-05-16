import { NextRequest, NextResponse } from 'next/server';

type AuditCheck = {
  label: string;
  passed: boolean;
  detail: string;
};

type ContentAudit = {
  score: number;
  verdict: string;
  checks: AuditCheck[];
  notes: string[];
};

const stripTags = (html: string) => html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

const countMatches = (html: string, pattern: RegExp) => (html.match(pattern) || []).length;

function auditAiOverviewReadiness(html: string, keyword: string): ContentAudit {
  const text = stripTags(html);
  const normalizedText = text.toLowerCase();
  const words = text ? text.split(/\s+/).length : 0;
  const h2Count = countMatches(html, /<h2\b[^>]*>/gi);
  const paragraphCount = countMatches(html, /<p\b[^>]*>/gi);
  const firstBlock = html.trim().slice(0, 20).toLowerCase();
  const hasQuestionHeading = /<h2\b[^>]*>[^<]*(what|how|why|when|where|which|should|can|does|is|are)\b[^<]*\?/i.test(html);
  const hasWrapperTags = /<!doctype|<html\b|<head\b|<body\b/i.test(html);
  const hasMarkdown = /(^|\n)\s{0,3}#{1,6}\s|```|\*\*/.test(html);
  const keywordTerms = keyword
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((term) => term.length > 2);
  const keywordCoverage = keywordTerms.length
    ? keywordTerms.filter((term) => normalizedText.includes(term)).length / keywordTerms.length
    : 0;
  const conciseParagraphs = (html.match(/<p\b[^>]*>[\s\S]*?<\/p>/gi) || []).filter((paragraph) => {
    const paragraphWords = stripTags(paragraph).split(/\s+/).filter(Boolean).length;
    return paragraphWords > 0 && paragraphWords <= 80;
  }).length;
  const paragraphConciseness = paragraphCount ? conciseParagraphs / paragraphCount : 0;
  const hasTakeaway = /takeaway|summary|bottom line|in short|overall/i.test(text);
  const hasEvidenceLanguage = /because|for example|according to|research|data|study|typically|depends|varies|compare|consider/i.test(text);

  const checks: AuditCheck[] = [
    {
      label: 'Starts with a direct answer',
      passed: firstBlock.startsWith('<p>'),
      detail: 'AI Overviews often need a clear, extractable answer near the top.',
    },
    {
      label: 'Uses crawlable text HTML',
      passed: paragraphCount >= 4 && h2Count >= 3 && !hasWrapperTags && !hasMarkdown,
      detail: 'Important content should be visible as normal text, with clean WordPress-ready HTML.',
    },
    {
      label: 'Covers the target topic',
      passed: keywordCoverage >= 0.6,
      detail: 'The generated post should naturally include the main terms from the topic.',
    },
    {
      label: 'Has question-led sections',
      passed: hasQuestionHeading,
      detail: 'Question-style headings help match the way users search and how AI systems decompose topics.',
    },
    {
      label: 'Keeps paragraphs concise',
      passed: paragraphConciseness >= 0.75,
      detail: 'Short paragraphs are easier for readers and search systems to parse.',
    },
    {
      label: 'Includes context and nuance',
      passed: hasEvidenceLanguage,
      detail: 'Helpful content should explain when, why, or how an answer applies instead of making thin claims.',
    },
    {
      label: 'Ends with a takeaway',
      passed: hasTakeaway,
      detail: 'A final summary reinforces the main answer and makes the content easier to reuse.',
    },
    {
      label: 'Long enough to be useful',
      passed: words >= 450,
      detail: 'Very short posts are less likely to cover subtopics, comparisons, and follow-up questions.',
    },
  ];

  const score = Math.round((checks.filter((check) => check.passed).length / checks.length) * 100);
  const verdict =
    score >= 85
      ? 'Strong AI Overview readiness'
      : score >= 65
        ? 'Needs minor improvements'
        : 'Needs significant improvements';

  return {
    score,
    verdict,
    checks,
    notes: [
      'Google says there are no special AI Overview requirements; this audit checks foundational SEO, helpfulness, and extractable answer structure.',
      'Final eligibility still depends on indexing, page quality, competition, query intent, and Google Search systems.',
    ],
  };
}

export async function POST(req: NextRequest) {
  const { keyword, tone, industry } = await req.json();

  if (!keyword?.trim()) {
    return NextResponse.json({ result: 'Please enter a topic or keyword.' }, { status: 400 });
  }

  const prompt = `
    You are an expert SEO copywriter${industry ? ` specializing in the ${industry} industry` : ''}.
    Write a ${tone?.toLowerCase() || 'friendly'}, helpful blog post for the topic: "${keyword}".

    Goal:
    - Make the page a strong supporting source for Google Search and AI features by following foundational SEO and helpful-content principles.
    - There is no special Google AI Overview markup or guaranteed optimization. Focus on clear, reliable, people-first content.

    Output only raw HTML that is ready to be pasted into a WordPress post editor.

    Instructions:
    - Do NOT include <!DOCTYPE>, <html>, <head>, or <body> tags.
    - Begin with a <p> direct answer summary (1-2 sentences) that answers the main topic immediately.
    - Use <h2> tags for section headings, including at least one question-style heading.
    - Use <p> tags for supporting content.
    - Cover the main answer, why it matters, key subtopics, practical steps, common mistakes, and when the answer may vary.
    - Keep paragraphs under 80 words where possible.
    - Include concrete, factual language and avoid unsupported hype.
    - Do not include bullet points, markdown, or any instructional text.
    - Write clearly and factually using terms appropriate for ${industry || 'a general audience'}.
    - End with a brief <p> takeaway that includes the phrase "Key takeaway".
    - Aim for 600-900 words.

    Output only clean HTML without any wrapper or metadata.
  `;

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent?key=${process.env.GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }],
          },
        ],
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Gemini API error:', data.error?.message || data);
      return NextResponse.json({ result: `Error: ${data.error?.message || 'Unknown error'}` }, { status: 500 });
    }

    const result = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!result) {
      console.error('No content from Gemini');
      return NextResponse.json({ result: null }, { status: 500 });
    }

    return NextResponse.json({ result, audit: auditAiOverviewReadiness(result, keyword) });
  } catch (error) {
    console.error('Gemini API call failed:', error);
    return NextResponse.json({ result: 'Error contacting Gemini API.' }, { status: 500 });
  }
}
