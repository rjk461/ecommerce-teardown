import { chromium as playwrightChromium } from "playwright-core";
import { getLaunchOptions } from "./chromiumLaunch.js";

export async function captureScreenshots(targetUrl, { browser } = {}) {
  if (browser) {
    return await captureWithBrowser(browser, targetUrl);
  }

  const launchOptions = await getLaunchOptions();
  const ownedBrowser = await playwrightChromium.launch(launchOptions);
  try {
    return await captureWithBrowser(ownedBrowser, targetUrl);
  } finally {
    await ownedBrowser.close();
  }
}

async function captureWithBrowser(browser, targetUrl) {
  const desktop = await captureOne(browser, {
    url: targetUrl,
    viewport: { width: 1365, height: 768 },
    userAgent: undefined,
    isMobile: false
  });

  const mobile = await captureOne(browser, {
    url: targetUrl,
    viewport: { width: 390, height: 844 },
    userAgent:
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
    isMobile: true
  });

  return { desktop, mobile };
}

async function captureOne(browser, { url, viewport, userAgent, isMobile }) {
  const context = await browser.newContext({
    viewport,
    userAgent,
    isMobile,
    deviceScaleFactor: isMobile ? 2 : 1
  });
  const page = await context.newPage();

  try {
    await gotoWithFallback(page, url);

    const title = await page.title().catch(() => "");
    const description = await page
      .$eval('meta[name="description"]', (el) => el.getAttribute("content") || "")
      .catch(() => "");
    const visibleText = await page
      .$eval("body", (el) => (el.innerText || "").slice(0, 4000))
      .catch(() => "");

    // Use viewport screenshots to keep runtime predictable in serverless.
    const png = await page.screenshot({ fullPage: false, type: "png" });

    return {
      png,
      signals: {
        title,
        description,
        visibleText,
        viewport
      }
    };
  } finally {
    await page.close().catch(() => {});
    await context.close().catch(() => {});
  }
}

async function gotoWithFallback(page, url) {
  // Many modern sites keep network activity alive indefinitely (analytics, chat, etc.).
  // So "networkidle" is not a reliable primary gate. Use DOMContentLoaded as the main signal,
  // then do a best-effort networkidle wait.
  try {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30_000 });
  } catch (e) {
    // Retry once with a different wait condition.
    await page.goto(url, { waitUntil: "load", timeout: 30_000 });
  }

  // Best effort: allow late resources to settle, but don't fail the whole job.
  try {
    await page.waitForLoadState("networkidle", { timeout: 2_500 });
  } catch {
    // ignore
  }

  // Give the browser a moment to render after heavy JS.
  await page.waitForTimeout(750);
}


