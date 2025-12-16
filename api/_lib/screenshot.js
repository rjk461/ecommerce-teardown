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

    // For mobile, try to open navigation menu before screenshot so AI can analyze it.
    if (isMobile) {
      await tryOpenMobileMenu(page);
    }

    // Capture full-page screenshot, but limit height to prevent extremely long pages from timing out.
    // Most pages are under 10,000px, so this cap prevents edge cases while still capturing full content.
    const MAX_SCREENSHOT_HEIGHT = 10000;
    const pageHeight = await page.evaluate(() => Math.max(
      document.body.scrollHeight,
      document.body.offsetHeight,
      document.documentElement.clientHeight,
      document.documentElement.scrollHeight,
      document.documentElement.offsetHeight
    )).catch(() => viewport?.height || 768);

    let screenshotOptions = { type: "png" };
    if (pageHeight <= MAX_SCREENSHOT_HEIGHT) {
      screenshotOptions.fullPage = true;
    } else {
      // For extremely tall pages, clip to max height to prevent timeout
      screenshotOptions.clip = {
        x: 0,
        y: 0,
        width: viewport.width,
        height: MAX_SCREENSHOT_HEIGHT
      };
    }

    const png = await page.screenshot(screenshotOptions);

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

async function tryOpenMobileMenu(page) {
  // Prioritize hamburger/menu-specific selectors, exclude chat buttons.
  // Order matters: most specific first, then fallback to generic.
  const menuSelectors = [
    // Hamburger-specific (highest priority)
    'button[class*="hamburger" i]',
    '[class*="hamburger" i]',
    'button[class*="menu-icon" i]',
    '[class*="menu-icon" i]',
    // Menu toggle specific
    'button[aria-label*="menu" i]:not([aria-label*="chat" i])',
    'button[aria-label*="navigation" i]:not([aria-label*="chat" i])',
    '.mobile-menu-toggle:not([class*="chat" i])',
    '.menu-toggle:not([class*="chat" i])',
    '#mobile-menu-button:not([id*="chat" i])',
    '#menu-button:not([id*="chat" i])',
    '[data-menu-toggle]:not([data-menu-toggle*="chat" i])',
    '[data-mobile-menu]:not([data-mobile-menu*="chat" i])',
    // Header/nav area buttons (lower priority, but still valid)
    'header button:not([aria-label*="chat" i]):not([class*="chat" i]):not([id*="chat" i])',
    'nav button:not([aria-label*="chat" i]):not([class*="chat" i]):not([id*="chat" i])'
  ];

  for (const selector of menuSelectors) {
    try {
      const button = await page.$(selector);
      if (button) {
        // Double-check it's not a chat button by checking aria-label, class, id
        const ariaLabel = await button.getAttribute('aria-label').catch(() => '');
        const className = await button.getAttribute('class').catch(() => '');
        const id = await button.getAttribute('id').catch(() => '');
        
        const isChatButton = 
          ariaLabel.toLowerCase().includes('chat') ||
          className.toLowerCase().includes('chat') ||
          id.toLowerCase().includes('chat');
        
        if (isChatButton) {
          continue; // Skip chat buttons
        }
        
        // Check if button is in header/nav area (preferred location)
        const isInHeaderNav = await page.evaluate((el) => {
          const header = document.querySelector('header');
          const nav = document.querySelector('nav');
          return (header && header.contains(el)) || (nav && nav.contains(el));
        }, button).catch(() => false);
        
        const isVisible = await button.isVisible().catch(() => false);
        if (isVisible) {
          await button.click();
          // Wait for menu animation to complete.
          await page.waitForTimeout(500);
          return;
        }
      }
    } catch {
      // Continue to next selector.
    }
  }
  // If no menu button found, continue without opening menu.
}


