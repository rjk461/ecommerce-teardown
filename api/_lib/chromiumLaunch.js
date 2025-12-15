import chromium from "@sparticuz/chromium";

function isLocal() {
  return process.env.VERCEL !== "1";
}

export async function getLaunchOptions() {
  if (isLocal()) {
    return { headless: true };
  }

  // Some Chromium flags can cause early exits in serverless environments.
  // Filter out the riskiest ones.
  const args = (chromium.args || []).filter((a) => a !== "--single-process");

  return {
    args,
    executablePath: await chromium.executablePath(),
    headless: chromium.headless
  };
}


