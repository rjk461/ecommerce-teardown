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
          "You are a senior CRO consultant. Be practical, specific, and prioritize impact. Use crisp language. Output must be valid JSON."
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
Create a conversion-focused teardown as an action plan.

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

Rules:
- Use evidence from the screenshots (hierarchy, trust signals, CTA clarity, friction, forms).
- Keep items specific and actionable.
- Prefer 5-8 friction points max.
- Make prioritization sensible for a $2.99 report buyer.
`.trim();
}

function safe(v) {
  return String(v || "").replace(/\s+/g, " ").slice(0, 300);
}


