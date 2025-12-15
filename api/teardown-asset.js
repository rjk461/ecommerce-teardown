import { getJob } from "./_lib/storage.js";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.status(405).send("Method not allowed");
    return;
  }

  const jobId = String(req.query?.job_id || "").trim();
  const kind = String(req.query?.kind || "").trim(); // desktop|mobile
  if (!jobId || !kind) {
    res.status(400).send("Missing job_id or kind");
    return;
  }

  const job = getJob(jobId);
  if (!job) {
    res.status(404).send("Job not found");
    return;
  }

  const asset = kind === "desktop" ? job.artifacts?.desktop : kind === "mobile" ? job.artifacts?.mobile : null;
  if (!asset) {
    res.status(404).send("Asset not found");
    return;
  }

  if (asset.kind === "blob") {
    res.statusCode = 302;
    res.setHeader("Location", asset.url);
    res.end();
    return;
  }

  res.setHeader("Content-Type", "image/png");
  res.status(200).send(asset.data);
}


