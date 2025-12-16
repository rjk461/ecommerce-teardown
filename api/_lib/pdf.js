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
    
    // Wait for all images to be loaded before generating PDF
    await page.evaluate(() => {
      return Promise.all(
        Array.from(document.images).map(img => {
          if (img.complete && img.naturalWidth > 0) {
            return Promise.resolve();
          }
          return new Promise((resolve, reject) => {
            img.onload = () => resolve();
            img.onerror = () => {
              // Don't reject on error, just resolve to continue
              console.warn('Image failed to load:', img.src.substring(0, 50));
              resolve();
            };
            // Timeout after 5 seconds
            setTimeout(() => {
              console.warn('Image load timeout:', img.src.substring(0, 50));
              resolve();
            }, 5000);
          });
        })
      );
    });
    
    // Verify images have loaded and have dimensions
    const imagesReady = await page.evaluate(() => {
      const imgs = document.querySelectorAll('img');
      if (imgs.length === 0) return true; // No images is fine
      return Array.from(imgs).every(img => 
        img.complete && img.naturalWidth > 0 && img.naturalHeight > 0
      );
    });
    
    if (!imagesReady) {
      // Give images a bit more time if they're not ready
      await page.waitForTimeout(1000);
    }
    
    // Small delay to ensure rendering is complete
    await page.waitForTimeout(500);
    
    // Extract title from HTML for PDF metadata
    const titleMatch = html.match(/<title>(.*?)<\/title>/i);
    const pdfTitle = titleMatch ? titleMatch[1] : "Website Improvement Report";
    
    return await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "12mm", right: "12mm", bottom: "14mm", left: "12mm" },
      displayHeaderFooter: false
    });
  } finally {
    await page.close().catch(() => {});
  }
}


