import { chromium as playwrightChromium } from "playwright-core";
import { getLaunchOptions } from "./chromiumLaunch.js";

export async function htmlToPdfBuffer(html, { browser } = {}) {
  if (browser) {
    return await renderWithBrowser(browser, html);
  }

  const launchOptions = await getLaunchOptions();
  const ownedBrowser = await playwrightChromium.launch(launchOptions);
  try {
    return await renderWithBrowser(ownedBrowser, html);
  } finally {
    await ownedBrowser.close();
  }
}

async function renderWithBrowser(browser, html) {
  const page = await browser.newPage();
  try {
    await page.setContent(html, { waitUntil: "load" });
    return await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "12mm", right: "12mm", bottom: "14mm", left: "12mm" }
    });
  } finally {
    await page.close().catch(() => {});
  }
}


