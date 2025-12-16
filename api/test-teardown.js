import { chromium as playwrightChromium } from "playwright-core";
import { getLaunchOptions } from "./_lib/chromiumLaunch.js";
import { testTeardownSchema, normalizeUrl } from "./_lib/validate.js";
import { newJobId, setJob, storeBlob } from "./_lib/storage.js";
import { captureScreenshots } from "./_lib/screenshot.js";
import { generateTeardown } from "./_lib/teardown.js";
import { renderReportHtml, extractBrandName, formatDate } from "./_lib/reportHtml.js";
import { htmlToPdfBuffer } from "./_lib/pdf.js";
import { sendTeardownReport } from "./_lib/email.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const jobId = newJobId();
  const startedAt = new Date().toISOString();
  setJob(jobId, { status: "running", startedAt });

  try {
    const parsed = testTeardownSchema.safeParse(req.body || {});
    if (!parsed.success) {
      setJob(jobId, { status: "error", error: "Invalid input" });
      res.status(400).json({ error: "Invalid input", details: parsed.error.flatten() });
      return;
    }

    const url = normalizeUrl(parsed.data.url);
    if (!url) {
      setJob(jobId, { status: "error", error: "Missing url" });
      res.status(400).json({ error: "Missing url" });
      return;
    }

    const notes = parsed.data.notes;
    const email = parsed.data.email;

    // Launch Chromium once and reuse it for screenshots + PDF to reduce serverless runtime.
    const browser = await playwrightChromium.launch(await getLaunchOptions());
    let desktop, mobile, pdfBuf;
    try {
      // 1) Screenshots + signals
      ({ desktop, mobile } = await captureScreenshots(url, { browser }));

      // 2) AI teardown
      const teardown = await generateTeardown({ url, notes, desktop, mobile });

      // 3) PDF
      const desktopB64 = Buffer.from(desktop.png).toString("base64");
      const mobileB64 = Buffer.from(mobile.png).toString("base64");
      const reportHtml = renderReportHtml({
        url,
        notes,
        createdAt: startedAt,
        teardown,
        desktopPngBase64: desktopB64,
        mobilePngBase64: mobileB64
      });
      pdfBuf = await htmlToPdfBuffer(reportHtml, { browser });

      // Generate filename from title format
      const brandName = extractBrandName(url);
      const dateStr = formatDate(startedAt);
      const pdfFilename = `${brandName.replace(/\./g, '-')}-Website-Improvement-Report-Ecommerce-Teardown-${dateStr}.pdf`;

      // 4) Store artifacts (Blob if configured; otherwise in-memory fallback)
      const basePath = `ai-teardown/${jobId}`;
      const pdfStored = await storeBlob({
        path: `${basePath}/${pdfFilename}`,
        contentType: "application/pdf",
        data: pdfBuf
      });
      const desktopStored = await storeBlob({
        path: `${basePath}/desktop.png`,
        contentType: "image/png",
        data: desktop.png
      });
      const mobileStored = await storeBlob({
        path: `${basePath}/mobile.png`,
        contentType: "image/png",
        data: mobile.png
      });

      const pdfUrl = pdfStored.kind === "blob" ? pdfStored.url : `/api/teardown-result?job_id=${encodeURIComponent(jobId)}`;

      setJob(jobId, {
        status: "done",
        startedAt,
        url,
        email,
        notes,
        teardown,
        artifacts: {
          pdf: pdfStored,
          desktop: desktopStored,
          mobile: mobileStored
        }
      });

      // Send response immediately, then fire email in background (non-blocking)
      res.status(200).json({
        job_id: jobId,
        status: "done",
        url,
        pdf_url: pdfUrl,
        desktop_png_url:
          desktopStored.kind === "blob" ? desktopStored.url : `/api/teardown-asset?job_id=${encodeURIComponent(jobId)}&kind=desktop`,
        mobile_png_url:
          mobileStored.kind === "blob" ? mobileStored.url : `/api/teardown-asset?job_id=${encodeURIComponent(jobId)}&kind=mobile`
      });

      // 5) Send email with report in background (if email provided and Resend configured)
      // Don't await - let it run asynchronously after response is sent
      if (email && email.trim()) {
        sendTeardownReport({
          to: email,
          brandName,
          dateStr,
          pdfUrl,
          pdfBuffer: pdfBuf
        }).catch((emailError) => {
          // Log email error but don't fail the request - user can still download from response
          console.error("Failed to send email:", emailError);
        });
      }
      return;
    } finally {
      await browser.close().catch(() => {});
    }

  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    setJob(jobId, { status: "error", error: msg });
    res.status(500).json({ error: msg, job_id: jobId });
  }
}


