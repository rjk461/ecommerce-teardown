import chromium from "@sparticuz/chromium";
import { chromium as playwrightChromium } from "playwright-core";

function isLocal() {
  return process.env.VERCEL !== "1";
}

export async function htmlToPdfBuffer(html) {
  const launchOptions = isLocal()
    ? { headless: true }
    : {
        args: chromium.args,
        executablePath: await chromium.executablePath(),
        headless: chromium.headless
      };

  const browser = await playwrightChromium.launch(launchOptions);
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "load" });
    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "12mm", right: "12mm", bottom: "14mm", left: "12mm" }
    });
    await page.close().catch(() => {});
    return pdf;
  } finally {
    await browser.close();
  }
}


