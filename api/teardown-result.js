import { getJob } from "./_lib/storage.js";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.status(405).send("Method not allowed");
    return;
  }

  const jobId = String(req.query?.job_id || "").trim();
  if (!jobId) {
    res.status(400).send("Missing job_id");
    return;
  }

  const job = getJob(jobId);
  if (!job) {
    res.status(404).send("Job not found");
    return;
  }

  if (job.status !== "done" || !job.artifacts?.pdf) {
    res.status(409).send("Report not ready");
    return;
  }

  const pdf = job.artifacts.pdf;
  if (pdf.kind === "blob") {
    res.statusCode = 302;
    res.setHeader("Location", pdf.url);
    res.end();
    return;
  }

  // Memory fallback
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="ai-teardown-${jobId}.pdf"`);
  res.status(200).send(pdf.data);
}


