import { chromium as playwrightChromium } from "playwright-core";
import { getLaunchOptions } from "./chromiumLaunch.js";

export async function htmlToPdfBuffer(html) {
  const launchOptions = await getLaunchOptions();

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


