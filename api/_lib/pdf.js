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
    
    // Convert data URI images to Blob URLs for reliable PDF rendering
    await page.evaluate(() => {
      const images = document.querySelectorAll('img[src^="data:image"]');
      images.forEach(img => {
        try {
          const dataUri = img.src;
          // Extract base64 data from data URI
          const base64Data = dataUri.split(',')[1];
          const mimeType = dataUri.match(/data:([^;]+)/)?.[1] || 'image/png';
          
          // Convert base64 to binary
          const binaryString = atob(base64Data);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          
          // Create Blob and Blob URL
          const blob = new Blob([bytes], { type: mimeType });
          const blobUrl = URL.createObjectURL(blob);
          
          // Replace src with Blob URL
          img.src = blobUrl;
        } catch (error) {
          console.warn('Failed to convert data URI to Blob URL:', error);
        }
      });
    });
    
    // Scroll to each image to ensure it's rendered in viewport (fixes caching/loading issues)
    await page.evaluate(() => {
      const images = document.querySelectorAll('img');
      images.forEach((img, index) => {
        // Scroll image into view to trigger rendering
        img.scrollIntoView({ behavior: 'instant', block: 'center' });
        // Force a reflow to ensure browser processes the image
        void img.offsetHeight;
      });
      // Scroll back to top
      window.scrollTo(0, 0);
    });
    
    // Wait for all images to be loaded after Blob URL conversion and scrolling
    await page.evaluate(() => {
      return Promise.all(
        Array.from(document.images).map(img => {
          if (img.complete && img.naturalWidth > 0 && img.naturalHeight > 0) {
            return Promise.resolve();
          }
          return new Promise((resolve) => {
            img.onload = () => resolve();
            img.onerror = () => {
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
    
    // Verify images have loaded and have dimensions (with retry)
    let imagesReady = false;
    for (let attempt = 0; attempt < 3; attempt++) {
      imagesReady = await page.evaluate(() => {
        const imgs = document.querySelectorAll('img');
        if (imgs.length === 0) return true; // No images is fine
        return Array.from(imgs).every(img => 
          img.complete && img.naturalWidth > 0 && img.naturalHeight > 0
        );
      });
      
      if (imagesReady) break;
      
      // Scroll to each image again and wait
      await page.evaluate(() => {
        const images = document.querySelectorAll('img');
        images.forEach(img => {
          img.scrollIntoView({ behavior: 'instant', block: 'center' });
          void img.offsetHeight;
        });
      });
      await page.waitForTimeout(500);
    }
    
    // Final delay to ensure rendering is complete
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


