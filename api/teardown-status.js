import { getJob } from "./_lib/storage.js";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const jobId = String(req.query?.job_id || "").trim();
  if (!jobId) {
    res.status(400).json({ error: "Missing job_id" });
    return;
  }

  const job = getJob(jobId);
  if (!job) {
    res.status(404).json({ error: "Job not found" });
    return;
  }

  const artifacts = job.artifacts || null;
  res.status(200).json({
    job_id: jobId,
    status: job.status,
    url: job.url,
    error: job.error,
    pdf_url: artifacts?.pdf?.kind === "blob" ? artifacts.pdf.url : artifacts ? `/api/teardown-result?job_id=${encodeURIComponent(jobId)}` : undefined,
    desktop_png_url:
      artifacts?.desktop?.kind === "blob"
        ? artifacts.desktop.url
        : artifacts
          ? `/api/teardown-asset?job_id=${encodeURIComponent(jobId)}&kind=desktop`
          : undefined,
    mobile_png_url:
      artifacts?.mobile?.kind === "blob"
        ? artifacts.mobile.url
        : artifacts
          ? `/api/teardown-asset?job_id=${encodeURIComponent(jobId)}&kind=mobile`
          : undefined
  });
}


