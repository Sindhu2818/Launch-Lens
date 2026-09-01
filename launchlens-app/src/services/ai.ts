const OPTIMIST_PROMPT = `You are an enthusiastic startup mentor and former founder. Your job is to make the strongest possible case for why a student's startup idea could work.

You are not naive — your optimism is grounded in specific details from their submission, not generic encouragement.

Given the idea, identify:
- The strongest signal of real demand in what they described
- The clearest path to a working first version
- The most promising path to revenue

Write 3-4 sentences. Be specific and cite details from their submission. Do not mention weaknesses or risks — that is someone else's job.

Return plain text only. No JSON, no markdown, no headers.`;

const SKEPTIC_PROMPT = `You are a sharp, experienced startup skeptic — the voice of a tough investor or a customer who has been burned by similar products before. Your job is to make the strongest possible case AGAINST a student's startup idea. This is the real Devil's Advocate — be direct, be specific, and don't soften it.

Given the idea, identify the 3-4 most serious risks:
- Market risk — does anyone actually want this, or does the founder just assume they do?
- Execution risk — can a student team realistically build this?
- Business model risk — will anyone actually pay for it?

Ground every objection in specific details from their submission — never generic startup advice ("validate your idea!"). Be honest and a little uncomfortable to read, but never insulting or dismissive of the founder.

Return plain text only. No JSON, no markdown, no headers.`;

const SYNTHESIZER_PROMPT = `You are a startup validation expert and experienced founder, moderating a debate between an Optimist and a Skeptic about a student's startup idea. You are skeptical, honest, and constructive — like a good mentor who wants them to succeed but won't let them build something nobody wants.

You will be given: the original idea submission, the Optimist's case for it, and the Skeptic's case against it. Weigh both sides fairly. Where the Skeptic raises a real risk the Optimist didn't address, the critique should reflect that. Where the Optimist identifies a genuine strength, let it lift the relevant score.

Return ONLY a valid JSON object with this exact structure:
{
  "scores": [
    {"dimension": "Problem Clarity", "score": 7, "reason": "one sentence"},
    {"dimension": "Market Need", "score": 6, "reason": "one sentence"},
    {"dimension": "Competition", "score": 5, "reason": "one sentence"},
    {"dimension": "Technical Feasibility", "score": 8, "reason": "one sentence"},
    {"dimension": "Monetization Potential", "score": 6, "reason": "one sentence"}
  ],
  "overall": 6.4,
  "insight": "one sentence naming the strongest and weakest area",
  "critiques": [
    {"title": "Short bold objection", "body": "2-3 sentence explanation, grounded in the Skeptic's case"}
  ],
  "roadmap": [
    {"week": 1, "title": "Week title", "tasks": ["task1", "task2", "task3"], "tip": "why this week"}
  ]
}

Return ONLY the JSON. No preamble, no markdown, no explanation outside the JSON.`;

import type { IdeaReport } from './storage';
import { normalizeReport } from './report';

/** Strip characters that could be used for prompt injection. */
function sanitizeInput(input: string): string {
  return input
    .replace(/[`]/g, "'") // strip backticks used for code fences
    .replace(/\n{3,}/g, '\n\n') // collapse excessive newlines
    .trim();
}

const MOCK_RESULT = {
  scores: [
    { dimension: 'Problem Clarity', score: 8, reason: 'The problem is well-defined with a clear target audience and specific pain point.' },
    { dimension: 'Market Need', score: 6, reason: 'There is some demand, but the market size and urgency are not fully validated.' },
    { dimension: 'Competition', score: 5, reason: 'Several competitors exist in adjacent spaces; differentiation needs to be sharper.' },
    { dimension: 'Technical Feasibility', score: 8, reason: 'The core product can be built with standard web technologies by a small team.' },
    { dimension: 'Monetization Potential', score: 7, reason: 'The freemium model is reasonable, but willingness to pay needs validation.' }
  ],
  overall: 6.8,
  insight: 'Your strongest area is Technical Feasibility. Focus on validating Market Need first.',
  critiques: [
    { title: 'Your target market may be too broad', body: 'You say your product is for "everyone who has a startup idea," but successful products start narrow. Who is the specific person who would pay for this on day one? Without that clarity, your marketing will be unfocused and your feature set will bloat.' },
    { title: 'The competitive moat is unclear', body: 'What stops someone from building this in a weekend with ChatGPT? Your core technology is accessible to any developer, so your real moat needs to be in the user experience, community, or data — none of which are addressed in your submission.' },
    { title: 'Revenue assumptions are optimistic', body: 'You assume users will convert from free to paid at 5%, but industry benchmarks for student-facing tools are closer to 1-2%. At that conversion rate, your unit economics may not work.' },
    { title: 'No evidence of customer demand', body: 'You have not mentioned talking to a single potential customer. The problem you describe is real, but whether people would pay to solve it this way is an untested assumption.' }
  ],
  roadmap: [
    { week: 1, title: 'Customer Discovery', tasks: ['Interview 10 potential users in your target segment', 'Ask them how they currently validate ideas', 'Document their exact words about their pain points'], tip: 'Market Need scored lowest — start here before writing any code.' },
    { week: 2, title: 'Competitive Analysis', tasks: ['Map 5 direct and indirect competitors', 'Try each competitor product for 30 minutes', 'Identify 3 things you would do differently'], tip: 'Competition scored 5/10 — you need a clear differentiation story.' },
    { week: 3, title: 'MVP Prototype', tasks: ['Build a landing page describing your value proposition', 'Create a waitlist signup form', 'Run 1 small paid ad ($20) to test click-through rate'], tip: 'Technical Feasibility is strong — leverage it to test demand cheaply.' },
    { week: 4, title: 'Monetization Test', tasks: ['Offer 5 users a paid pilot at your target price', 'Track who says yes, who hesitates, and why', 'Adjust pricing based on feedback'], tip: 'Monetization scored 7/10 — validate willingness to pay early.' }
  ]
};

async function callGemini(systemPrompt: string, userMessage: string, maxTokens: number, isJson: boolean = false): Promise<string> {
  const apiKey = (import.meta.env.VITE_GEMINI_KEY || '').trim();
  if (!apiKey) throw new Error('No Gemini API key found. Please check your env setup.');

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

  const generationConfig: Record<string, unknown> = {
    maxOutputTokens: maxTokens,
    temperature: 0.7,
  };
  if (isJson) {
    generationConfig.responseMimeType = 'application/json';
  }

  const requestBody = {
    contents: [{ parts: [{ text: userMessage }] }],
    systemInstruction: { parts: [{ text: systemPrompt }] },
    generationConfig,
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(requestBody)
  });

  if (!response.ok) {
    throw new Error('The AI service is temporarily unavailable. Please try again later.');
  }

  const data = await response.json();
  const candidate = data.candidates?.[0];
  const text = candidate?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error('The AI could not generate a response for this idea. Try rephrasing it.');
  }
  return text;
}

export async function analyseIdea(
  idea: { name: string; problem: string; customer: string; monetization: string },
  onStageChange?: (stage: 'optimist' | 'skeptic' | 'synthesizer') => void
): Promise<IdeaReport> {
  const apiKey = (import.meta.env.VITE_GEMINI_KEY || '').trim();

  if (!apiKey) {
    // Mock mode: simulate delays and return mock data
    onStageChange?.('optimist');
    await new Promise(r => setTimeout(r, 1500));
    onStageChange?.('skeptic');
    await new Promise(r => setTimeout(r, 1500));
    onStageChange?.('synthesizer');
    await new Promise(r => setTimeout(r, 2000));
    return normalizeReport(MOCK_RESULT);
  }

  const baseMsg =
    `Evaluate this startup idea:\n\nIdea name: ${sanitizeInput(idea.name)}\n` +
    `Problem: ${sanitizeInput(idea.problem)}\nTarget customer: ${sanitizeInput(idea.customer)}\n` +
    `Monetization: ${sanitizeInput(idea.monetization)}`;

  let optimistCase = '';
  let skepticCase = '';

  // Call 1 — Optimist
  onStageChange?.('optimist');
  try {
    optimistCase = await callGemini(OPTIMIST_PROMPT, baseMsg, 1024);
  } catch (e) {
    // Optimist call failed — continue with fallback
    optimistCase = '(Optimist analysis unavailable due to error)';
  }

  // Call 2 — Skeptic
  onStageChange?.('skeptic');
  try {
    skepticCase = await callGemini(SKEPTIC_PROMPT, baseMsg, 1024);
  } catch (e) {
    // Skeptic call failed — continue with fallback
    skepticCase = '(Skeptic analysis unavailable due to error)';
  }

  // Call 3 — Synthesizer (sees both arguments)
  onStageChange?.('synthesizer');
  const synthMsg =
    `Evaluate this startup idea using the two arguments below:\n\n` +
    `Idea name: ${sanitizeInput(idea.name)}\nProblem: ${sanitizeInput(idea.problem)}\n` +
    `Target customer: ${sanitizeInput(idea.customer)}\nMonetization: ${sanitizeInput(idea.monetization)}\n\n` +
    `OPTIMIST'S CASE:\n${optimistCase}\n\nSKEPTIC'S CASE:\n${skepticCase}`;

  const verdictRaw = await callGemini(SYNTHESIZER_PROMPT, synthMsg, 4096, true);

  // Parse JSON, stripping markdown fences if present
  let cleaned = verdictRaw.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
  }

  try {
    const result = JSON.parse(cleaned);
    return normalizeReport(result);
  } catch (e) {
    // Failed to parse AI response
    throw new Error('Failed to parse validation report from AI. Please try again.');
  }
}
