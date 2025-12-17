import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";

export async function generateTeardown({ url, notes, desktop, mobile }) {
  // Prefer Claude API if available, fallback to OpenAI
  const useClaude = !!process.env.CLAUDE_API_KEY;
  
  if (useClaude) {
    if (!process.env.CLAUDE_API_KEY) {
      throw new Error("Missing CLAUDE_API_KEY");
    }

    const client = new Anthropic({ apiKey: process.env.CLAUDE_API_KEY });

    const prompt = buildPrompt({ url, notes, desktopSignals: desktop.signals, mobileSignals: mobile.signals });

    // Resize screenshots if either dimension exceeds Claude image limits (8k px)
    const desktopPng = await resizeIfNeeded(desktop.png);
    const mobilePng = await resizeIfNeeded(mobile.png);

    // Convert screenshots to base64 strings
    const desktopBase64 = Buffer.from(desktopPng).toString("base64");
    const mobileBase64 = Buffer.from(mobilePng).toString("base64");

    const resp = await client.messages.create({
      // Default to a current Sonnet 4.5 snapshot; allow override via env.
      model: process.env.CLAUDE_MODEL || "claude-sonnet-4-5-20250929",
      max_tokens: 4096,
      temperature: 0.4,
      system: "You are a senior CRO consultant with deep expertise in conversion optimization. Your analysis must be evidence-based, specific, and actionable. Avoid assumptions - only critique what you can clearly see in the screenshots. Focus on conversion impact and business value. Be thorough and compelling in your insights. Output must be valid JSON.",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            { type: "image", source: { type: "base64", media_type: "image/png", data: desktopBase64 } },
            { type: "image", source: { type: "base64", media_type: "image/png", data: mobileBase64 } }
          ]
        }
      ]
    });

    const text = resp.content?.[0]?.text || "{}";
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = { raw: text };
    }

    return normalizeTeardown(data);
  } else {
    // Fallback to OpenAI if Claude is not configured
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("Missing OPENAI_API_KEY or CLAUDE_API_KEY");
    }

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const prompt = buildPrompt({ url, notes, desktopSignals: desktop.signals, mobileSignals: mobile.signals });

    const desktopBase64 = Buffer.from(desktop.png).toString("base64");
    const mobileBase64 = Buffer.from(mobile.png).toString("base64");
    const desktopDataUrl = `data:image/png;base64,${desktopBase64}`;
    const mobileDataUrl = `data:image/png;base64,${mobileBase64}`;

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

    return normalizeTeardown(data);
  }
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
Create a comprehensive, conversion-focused teardown as an actionable plan. Provide deep, compelling insights based on what you can actually see in the screenshots. Be thorough and identify both obvious issues and subtle UX problems.

Return STRICT JSON with this shape (do NOT leave arrays empty; if you cannot see legitimate issues, state why and what was checked):
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

Critical Rules - STRICT EVIDENCE REQUIREMENT:
- EVIDENCE-BASED ONLY: Only critique what you can clearly see in the screenshots. Do NOT make assumptions. If you cannot see clear evidence of an issue in the screenshots, do NOT include it.
- QUALITY OVER QUANTITY: Better to have 5 accurate findings based on visible evidence than 12 made-up ones. Only include friction points where you can point to specific visual evidence in the screenshots.
- MOBILE TOUCH TARGETS: Do NOT criticize mobile touch target sizes unless you can clearly see they are too small in the screenshot. Most modern sites follow mobile design best practices - only flag if there's obvious evidence of a problem.
- DEPTH & SPECIFICITY: Provide detailed, compelling insights. Reference specific elements visible in screenshots (e.g., "The CTA button in the hero section at the top center uses low-contrast text against a white background").
- CONVERSION IMPACT: Explain the business impact of each issue. How does it hurt conversions? Estimate potential impact where possible (e.g., "This could reduce conversions by 5-10%").
- ACTIONABLE: Every recommendation must be specific and implementable. Avoid vague suggestions.
- PRIORITIZATION: Focus on issues with the highest conversion impact. Quick wins should be genuinely quick and impactful.
- SCREENSHOT ANALYSIS: Carefully examine both desktop and mobile screenshots. Note differences, mobile-specific issues, and responsive design concerns.
- NO FABRICATION: If you cannot find additional legitimate issues after thorough analysis, return fewer items. Do NOT generate findings that don't relate to what's actually visible on the page.

Detailed Analysis Areas - Examine these specific areas ONLY if you can see clear evidence:
1. HERO SECTION: CTA visibility and contrast, value proposition clarity, trust signals, urgency/scarcity indicators, headline effectiveness
2. PRODUCT PRESENTATION: Image quality and size, pricing clarity and prominence, availability indicators (stock status), product descriptions, add-to-cart button visibility
3. NAVIGATION: Menu structure and clarity, search functionality visibility, category organization, breadcrumbs, mobile menu behavior
4. FORMS & INPUTS: Field labels and placeholders, validation messages, error handling, form length and complexity, completion indicators
5. CHECKOUT FLOW: Progress indicators, security badges, shipping options visibility, payment method clarity, trust elements
6. MOBILE-SPECIFIC: Touch target sizes (only if obviously too small), thumb-friendly zones, responsive behavior, mobile menu functionality, mobile-specific CTAs
7. TRUST ELEMENTS: Customer reviews and ratings placement, security badges, guarantees, testimonials, social proof, return policies
8. VISUAL HIERARCHY: Information architecture, content prioritization, visual flow, whitespace usage, color contrast for readability
9. PERFORMANCE INDICATORS: Loading states, skeleton screens, error handling, empty states, success messages
10. MISSED OPPORTUNITIES: Upsells, cross-sells, email capture, social sharing, loyalty programs, exit-intent triggers

- TRUST & CREDIBILITY: Look for trust signals (reviews, badges, guarantees) and note where they're missing or could be improved - ONLY if visible in screenshots.
- HIERARCHY & CLARITY: Analyze visual hierarchy, information architecture, and clarity of messaging - ONLY based on what's visible.
- FRICTION POINTS: Identify specific friction points that could cause abandonment (forms, checkout, navigation, etc.) - ONLY if clearly visible.
- LOOK FOR BOTH PROBLEMS AND OPPORTUNITIES: Don't just find what's wrong - also identify what's missing that could improve conversions - BUT only if you can see evidence of the absence.

Output 5-12 high-impact friction points with detailed evidence and fixes. If you truly cannot find 5 legitimate issues, include 3-4 with explicit notes about what you inspected and why additional issues were not visible. Do NOT return empty arrays.
`.trim();
}

async function resizeIfNeeded(pngBuffer) {
  const maxDim = 8000;
  // Lazy-load sharp to keep cold starts minimal when not needed
  const sharp = (await import("sharp")).default;
  const meta = await sharp(pngBuffer).metadata();
  if (!meta.width || !meta.height) return pngBuffer;
  if (meta.width <= maxDim && meta.height <= maxDim) return pngBuffer;

  const scale = maxDim / Math.max(meta.width, meta.height);
  const width = Math.floor(meta.width * scale);
  const height = Math.floor(meta.height * scale);
  return sharp(pngBuffer).resize(width, height, { fit: "inside" }).png().toBuffer();
}

function safe(v) {
  return String(v || "").replace(/\s+/g, " ").slice(0, 300);
}

function normalizeTeardown(raw) {
  const fallbackSummary = "Analysis incomplete: the AI response was empty. Please re-run or review the screenshots manually.";
  const fallbackFriction = [
    {
      title: "Insights unavailable",
      why_it_hurts: "The model did not return any friction points.",
      evidence: "No evidence provided; model response was empty.",
      fix: "Re-run the teardown or perform a manual review of the screenshots."
    }
  ];
  const fallbackQuickWins = [
    {
      title: "Manual review required",
      why: "The automated analysis returned no quick wins.",
      how: "Re-run the teardown or audit the page manually to capture high-impact fixes."
    }
  ];
  const fallbackCopy = [
    {
      location: "Key value prop",
      before: "Analysis unavailable from the automated run.",
      after: "Re-run the teardown or draft a concise value proposition that states who it's for, what it does, and why it's better."
    }
  ];
  const fallbackMobileNotes = ["Automated mobile/accessibility notes were not returned; re-run or conduct a quick manual check for tap targets, readability, and menu behavior."];

  const cleanArray = (v) => (Array.isArray(v) ? v : []);
  const friction = cleanArray(raw?.friction_points).filter(validFinding);
  const quickWins = cleanArray(raw?.prioritized_fixes?.quick_wins).filter(validFix);
  const medium = cleanArray(raw?.prioritized_fixes?.medium_lifts).filter(validFix);
  const experiments = cleanArray(raw?.prioritized_fixes?.experiments).filter(validExperiment);
  const copy = cleanArray(raw?.copy_suggestions).filter(validCopy);
  const mobileNotes = cleanArray(raw?.accessibility_mobile_notes).filter((x) => typeof x === "string" && x.trim());

  return {
    summary: typeof raw?.summary === "string" && raw.summary.trim() ? raw.summary : fallbackSummary,
    friction_points: friction.length ? friction : fallbackFriction,
    prioritized_fixes: {
      quick_wins: quickWins.length ? quickWins : fallbackQuickWins,
      medium_lifts: medium.length ? medium : [],
      experiments: experiments.length ? experiments : []
    },
    copy_suggestions: copy.length ? copy : fallbackCopy,
    accessibility_mobile_notes: mobileNotes.length ? mobileNotes : fallbackMobileNotes
  };
}

function validFinding(x) {
  return !!(x && (x.title || x.why_it_hurts || x.evidence || x.fix));
}

function validFix(x) {
  return !!(x && (x.title || x.why || x.how));
}

function validExperiment(x) {
  return !!(x && (x.title || x.hypothesis || x.test || x.success_metric));
}

function validCopy(x) {
  return !!(x && (x.location || x.before || x.after));
}


