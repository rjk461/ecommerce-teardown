import crypto from "node:crypto";
import { put } from "@vercel/blob";

const memoryStore = globalThis.__teardownStore || new Map();
globalThis.__teardownStore = memoryStore;

export function newJobId() {
  return crypto.randomUUID();
}

export function setJob(jobId, job) {
  memoryStore.set(jobId, { ...job, updatedAt: new Date().toISOString() });
}

export function getJob(jobId) {
  return memoryStore.get(jobId) || null;
}

export async function storeBlob({ path, contentType, data }) {
  // If Blob token is configured, store in Vercel Blob (recommended for production).
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const res = await put(path, data, {
      access: "public",
      contentType
    });
    return { kind: "blob", url: res.url };
  }

  // Fallback for local/dev environments: keep in memory.
  return { kind: "memory", data };
}


