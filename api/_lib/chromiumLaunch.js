import chromium from "@sparticuz/chromium-min";

function isLocal() {
  return process.env.VERCEL !== "1";
}

export async function getLaunchOptions() {
  if (isLocal()) {
    return { headless: true };
  }

  // Some Chromium flags can cause early exits in serverless environments.
  // Filter out the riskiest ones.
  const args = (chromium.args || [])
    .filter((a) => a !== "--single-process")
    .filter((a) => !String(a).startsWith("--headless"));

  return {
    args,
    executablePath: await chromium.executablePath(),
    // Avoid passing non-boolean headless values; Playwright will add its own headless flags.
    headless: true
  };
}


