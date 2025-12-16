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
    
    // Aggressively ensure all images are loaded and rendered
    // Step 1: Scroll through entire document height in steps to trigger lazy loading
    await page.evaluate(async () => {
      const scrollHeight = Math.max(
        document.body.scrollHeight,
        document.documentElement.scrollHeight
      );
      const viewportHeight = window.innerHeight;
      const steps = Math.ceil(scrollHeight / viewportHeight);
      
      for (let i = 0; i <= steps; i++) {
        window.scrollTo(0, i * viewportHeight);
        await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      }
      window.scrollTo(0, 0);
    });
    
    // Step 2: For each image individually, scroll to it, wait, and verify dimensions
    await page.evaluate(async () => {
      const images = Array.from(document.querySelectorAll('img'));
      
      for (const img of images) {
        // Scroll image into view
        img.scrollIntoView({ behavior: 'instant', block: 'center', inline: 'center' });
        
        // Force layout recalculation
        void img.offsetHeight;
        void img.offsetWidth;
        
        // Wait for next animation frame to ensure rendering
        await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
        
        // Force image to load by accessing properties
        if (!img.complete) {
          // Trigger load by setting src again (if it's a blob URL, this is safe)
          const currentSrc = img.src;
          img.src = '';
          img.src = currentSrc;
        }
        
        // Wait a bit for the image to potentially load
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    });
    
    // Step 3: Wait for all images to be loaded with retries
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
            // Timeout after 3 seconds per image
            setTimeout(() => {
              console.warn('Image load timeout:', img.src.substring(0, 50));
              resolve();
            }, 3000);
          });
        })
      );
    });
    
    // Step 4: Verify images have loaded with multiple retry passes
    let imagesReady = false;
    for (let attempt = 0; attempt < 5; attempt++) {
      imagesReady = await page.evaluate(() => {
        const imgs = Array.from(document.querySelectorAll('img'));
        if (imgs.length === 0) return true;
        
        // Check each image individually
        const results = imgs.map(img => ({
          complete: img.complete,
          naturalWidth: img.naturalWidth,
          naturalHeight: img.naturalHeight,
          src: img.src.substring(0, 50)
        }));
        
        const allReady = imgs.every(img => 
          img.complete && img.naturalWidth > 0 && img.naturalHeight > 0
        );
        
        if (!allReady) {
          console.log('Image status:', results);
        }
        
        return allReady;
      });
      
      if (imagesReady) break;
      
      // Scroll to each image again individually and wait
      await page.evaluate(async () => {
        const images = Array.from(document.querySelectorAll('img'));
        for (const img of images) {
          img.scrollIntoView({ behavior: 'instant', block: 'center', inline: 'center' });
          void img.offsetHeight;
          await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
        }
      });
      
      await page.waitForTimeout(800); // Longer wait between retries
    }
    
    // Step 5: Final pass - scroll through all images one more time
    await page.evaluate(async () => {
      const images = Array.from(document.querySelectorAll('img'));
      for (const img of images) {
        img.scrollIntoView({ behavior: 'instant', block: 'center', inline: 'center' });
        await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      }
    });
    
    // Final delay to ensure rendering is complete
    await page.waitForTimeout(1000);
    
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


