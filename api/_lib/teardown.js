import OpenAI from "openai";

export async function generateTeardown({ url, notes, desktop, mobile }) {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("Missing OPENAI_API_KEY");
  }

  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const prompt = buildPrompt({ url, notes, desktopSignals: desktop.signals, mobileSignals: mobile.signals });

  const desktopDataUrl = `data:image/png;base64,${desktop.png.toString("base64")}`;
  const mobileDataUrl = `data:image/png;base64,${mobile.png.toString("base64")}`;

  const resp = await client.chat.completions.create({
    model: process.env.OPENAI_MODEL || "gpt-4o-mini",
    temperature: 0.4,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content:
          "You are a senior CRO consultant with deep expertise in conversion optimization. Your analysis must be evidence-based, specific, and actionable. Avoid assumptions - only critique what you can clearly see in the screenshots. Focus on conversion impact and business value. Be thorough and compelling in your insights. Output must be valid JSON."
      },
      {
        role: "user",
        content: [
          { type: "text", text: prompt },
          { type: "image_url", image_url: { url: desktopDataUrl } },
          { type: "image_url", image_url: { url: mobileDataUrl } }
        ]
      }
    ]
  });

  const text = resp.choices?.[0]?.message?.content || "{}";
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = { raw: text };
  }

  return data;
}

function buildPrompt({ url, notes, desktopSignals, mobileSignals }) {
  const notesText = notes ? `\nUser notes / goal:\n${notes}\n` : "";

  return `
URL: ${url}
${notesText}

You have 2 screenshots (desktop + mobile) of the same page.
You also have these extracted page signals:

Desktop signals:
- title: ${safe(desktopSignals.title)}
- meta_description: ${safe(desktopSignals.description)}
- viewport: ${desktopSignals.viewport.width}x${desktopSignals.viewport.height}

Mobile signals:
- title: ${safe(mobileSignals.title)}
- meta_description: ${safe(mobileSignals.description)}
- viewport: ${mobileSignals.viewport.width}x${mobileSignals.viewport.height}

Task:
Create a comprehensive, conversion-focused teardown as an actionable plan. Provide deep, compelling insights based on what you can actually see in the screenshots.

Return STRICT JSON with this shape:
{
  "summary": string,
  "friction_points": [{ "title": string, "why_it_hurts": string, "evidence": string, "fix": string }],
  "prioritized_fixes": {
    "quick_wins": [{ "title": string, "why": string, "how": string }],
    "medium_lifts": [{ "title": string, "why": string, "how": string }],
    "experiments": [{ "title": string, "hypothesis": string, "test": string, "success_metric": string }]
  },
  "copy_suggestions": [{ "location": string, "before": string, "after": string }],
  "accessibility_mobile_notes": [string]
}

Critical Rules:
- EVIDENCE-BASED ONLY: Only critique what you can clearly see in the screenshots. Do NOT make assumptions.
- MOBILE TOUCH TARGETS: Do NOT criticize mobile touch target sizes unless you can clearly see they are too small in the screenshot. Most modern sites follow mobile design best practices - only flag if there's obvious evidence of a problem.
- DEPTH & SPECIFICITY: Provide detailed, compelling insights. Reference specific elements visible in screenshots (e.g., "The CTA button in the hero section uses low-contrast text").
- CONVERSION IMPACT: Explain the business impact of each issue. How does it hurt conversions? What's the potential value of fixing it?
- ACTIONABLE: Every recommendation must be specific and implementable. Avoid vague suggestions.
- PRIORITIZATION: Focus on issues with the highest conversion impact. Quick wins should be genuinely quick and impactful.
- SCREENSHOT ANALYSIS: Carefully examine both desktop and mobile screenshots. Note differences, mobile-specific issues, and responsive design concerns.
- TRUST & CREDIBILITY: Look for trust signals (reviews, badges, guarantees) and note where they're missing or could be improved.
- HIERARCHY & CLARITY: Analyze visual hierarchy, information architecture, and clarity of messaging.
- FRICTION POINTS: Identify specific friction points that could cause abandonment (forms, checkout, navigation, etc.).

Output 5-8 high-impact friction points with detailed evidence and fixes.
`.trim();
}

function safe(v) {
  return String(v || "").replace(/\s+/g, " ").slice(0, 300);
}


