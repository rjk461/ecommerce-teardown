export function renderReportHtml({ url, notes, createdAt, teardown, desktopPngBase64, mobilePngBase64, mobileMenuPngBase64 }) {
  const safe = (v) => escapeHtml(String(v ?? ""));
  const brandName = extractBrandName(url);
  const dateStr = formatDate(createdAt);
  const title = `${brandName} Website Improvement Report - Ecommerce Teardown ${dateStr}`;

  const friction = Array.isArray(teardown?.friction_points) ? teardown.friction_points : [];
  const quickWins = teardown?.prioritized_fixes?.quick_wins ?? [];
  const medium = teardown?.prioritized_fixes?.medium_lifts ?? [];
  const experiments = teardown?.prioritized_fixes?.experiments ?? [];
  const copy = Array.isArray(teardown?.copy_suggestions) ? teardown.copy_suggestions : [];
  const mobileNotes = Array.isArray(teardown?.accessibility_mobile_notes) ? teardown.accessibility_mobile_notes : [];

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${safe(title)}</title>
    <style>
      :root {
        --mad-green: #00A651;
        --mad-red: #C8102E;
        --mad-pink: #E91E63;
        --mad-cream: #F5EFE6;
        --dark-grey: #1A1A1A;
        --medium-grey: #666666;
        --accent-yellow: #F8B500;
      }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
        color: var(--dark-grey);
        line-height: 1.5;
        background: white;
      }
      .topbar {
        height: 6px;
        background: linear-gradient(to right, var(--mad-pink), var(--accent-yellow));
      }
      .wrap { padding: 20px 34px 40px; }
      h1 {
        margin: 0;
        font-size: 28px;
        font-weight: 900;
        text-transform: uppercase;
        letter-spacing: 0.2px;
        page-break-after: avoid;
      }
      .meta { 
        margin-top: 10px; 
        color: var(--medium-grey); 
        font-size: 12px;
        page-break-after: avoid;
      }
      .header-link {
        page-break-after: avoid;
      }
      .pill {
        display: inline-block;
        margin-top: 12px;
        padding: 6px 10px;
        border-radius: 999px;
        background: rgba(0,166,81,0.10);
        border: 1px solid rgba(0,166,81,0.25);
        color: #0a5a31;
        font-weight: 800;
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: 0.3px;
      }
      .section { 
        margin-top: 26px;
        page-break-inside: avoid;
      }
      .section h2 {
        margin: 0 0 10px;
        font-size: 16px;
        font-weight: 900;
        text-transform: uppercase;
        letter-spacing: 0.2px;
        page-break-after: avoid;
      }
      .grid2 {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 14px;
      }
      .shot-full {
        width: 100%;
        border: 1px solid rgba(0,0,0,0.10);
        border-radius: 10px;
        overflow: hidden;
        background: #fff;
        page-break-inside: auto; /* Allow breaking across pages */
        margin-bottom: 20px;
      }
      .shot-full .label {
        padding: 10px 12px;
        font-size: 12px;
        font-weight: 900;
        border-bottom: 1px solid rgba(0,0,0,0.08);
      }
      .shot-full img {
        width: 100%;
        max-width: 100%;
        height: auto;
        max-height: none; /* Remove height restriction to allow full image */
        display: block;
        object-fit: contain;
        page-break-inside: auto; /* Allow breaking across pages */
      }
      .shot-full.mobile {
        max-width: 70%;
        margin: 0 auto 20px;
      }
      .shot-full.mobile img {
        max-width: 100%;
        height: auto;
        max-height: 1000px;
      }
      .screenshots-section {
        page-break-before: avoid;
        page-break-inside: auto; /* Allow images to span pages */
      }
      .screenshots-section h2 {
        page-break-after: avoid;
      }
      .card {
        border: 1px solid rgba(0,0,0,0.10);
        border-radius: 12px;
        padding: 12px 14px;
        margin-bottom: 10px;
        background: #fff;
      }
      .card h3 {
        margin: 0 0 6px;
        font-size: 13px;
        font-weight: 900;
      }
      .card p { margin: 6px 0 0; font-size: 12px; color: var(--medium-grey); }
      .kvs { margin-top: 10px; font-size: 12px; }
      .kvs div { margin: 4px 0; }
      .k { font-weight: 900; color: var(--dark-grey); }
      ul { margin: 8px 0 0 18px; padding: 0; color: var(--medium-grey); font-size: 12px; }
      li { margin: 5px 0; }
      .twoCol { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
      .small { font-size: 11px; color: var(--medium-grey); }
      a { color: var(--dark-grey); }
      .header-link {
        text-align: center;
        padding: 16px 0;
        border-bottom: 1px solid rgba(0,0,0,0.08);
        margin-bottom: 20px;
      }
      .header-link a {
        color: var(--mad-green);
        text-decoration: none;
        font-weight: 700;
        font-size: 14px;
      }
      .header-link a:hover {
        text-decoration: underline;
      }
      .footer-link {
        text-align: center;
        padding: 20px 0;
        border-top: 1px solid rgba(0,0,0,0.08);
        margin-top: 30px;
      }
      .footer-link a {
        color: var(--mad-green);
        text-decoration: none;
        font-weight: 700;
        font-size: 14px;
      }
      .footer-link a:hover {
        text-decoration: underline;
      }
    </style>
  </head>
  <body>
    <div class="topbar"></div>
    <div class="wrap">
      <div class="header-link">
        <a href="https://ecommerceteardown.com" target="_blank">EcommerceTeardown.com</a>
      </div>
      <h1>${safe(title)}</h1>
      <div class="meta">
        <div><span class="k">URL:</span> ${safe(url)}</div>
        <div><span class="k">Created:</span> ${safe(formatDateOnly(createdAt))}</div>
      </div>
      ${notes ? `<div class="pill">Goal: ${safe(notes)}</div>` : ''}

      <div class="section">
        <h2>Executive summary</h2>
        <div class="card">
          <div class="small">${safe(teardown?.summary || "No summary returned.")}</div>
        </div>
      </div>

      <div class="section screenshots-section">
        <h2>Screenshots</h2>
        <div class="shot-full">
          <div class="label">Desktop</div>
          <img src="data:image/png;base64,${desktopPngBase64}" alt="Desktop screenshot" />
        </div>
        <div class="shot-full mobile">
          <div class="label">Mobile (Full Page)</div>
          <img src="data:image/png;base64,${mobilePngBase64}" alt="Mobile screenshot" />
        </div>
        ${mobileMenuPngBase64 ? `
        <div class="shot-full mobile">
          <div class="label">Mobile (Navigation Menu)</div>
          <img src="data:image/png;base64,${mobileMenuPngBase64}" alt="Mobile navigation menu screenshot" />
        </div>
        ` : ''}
      </div>

      <div class="section">
        <h2>Friction points</h2>
        ${friction.length ? friction.map(renderFriction).join("") : `<div class="small">No friction points returned.</div>`}
      </div>

      <div class="section" style="page-break-before: avoid;">
        <h2>Prioritized fixes</h2>
        ${quickWins.length ? `
          <div class="card">
            <h3>Quick wins</h3>
            ${renderFixList(quickWins, "why", "how")}
          </div>
        ` : ''}
        ${medium.length ? `
          <div class="card">
            <h3>Medium lifts</h3>
            ${renderFixList(medium, "why", "how")}
          </div>
        ` : ''}
        ${experiments.length ? `
          <div class="card">
            <h3>Experiments</h3>
            ${renderExperimentList(experiments)}
          </div>
        ` : ''}
        ${mobileNotes.length ? `
          <div class="card">
            <h3>Mobile & accessibility notes</h3>
            <ul>${mobileNotes.map((x) => `<li>${safe(x)}</li>`).join("")}</ul>
          </div>
        ` : ''}
      </div>

      <div class="section">
        <h2>Copy suggestions</h2>
        ${copy.length ? copy.map(renderCopy).join("") : `<div class="small">No copy suggestions returned.</div>`}
      </div>

      <div class="section small">
        Generated automatically. If a page blocks automated screenshots or is highly dynamic, results may vary.
      </div>
      <div class="footer-link">
        <a href="https://ecommerceteardown.com" target="_blank">EcommerceTeardown.com</a>
      </div>
    </div>
  </body>
</html>`;
}

function extractBrandName(url) {
  try {
    const urlObj = new URL(url);
    let hostname = urlObj.hostname.toLowerCase();
    
    // Remove www. prefix
    if (hostname.startsWith('www.')) {
      hostname = hostname.slice(4);
    }
    
    // Return full uppercase domain (e.g., "kidstuff.com.au" -> "KIDSTUFF.COM.AU")
    return hostname.toUpperCase();
  } catch {
    return 'WEBSITE';
  }
}

function formatDate(isoString) {
  try {
    const date = new Date(isoString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = String(date.getFullYear()).slice(-2);
    return `${day}-${month}-${year}`;
  } catch {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = String(now.getFullYear()).slice(-2);
    return `${day}-${month}-${year}`;
  }
}

function formatDateOnly(isoString) {
  try {
    const date = new Date(isoString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  } catch {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    return `${day}-${month}-${year}`;
  }
}

// Export helper functions for use in other modules
export { extractBrandName, formatDate };

function renderFriction(item) {
  const safe = (v) => escapeHtml(String(v ?? ""));
  return `
    <div class="card">
      <h3>${safe(item?.title || "Friction point")}</h3>
      <div class="kvs">
        <div><span class="k">Why it hurts:</span> ${safe(item?.why_it_hurts || "")}</div>
        <div><span class="k">Evidence:</span> ${safe(item?.evidence || "")}</div>
        <div><span class="k">Fix:</span> ${safe(item?.fix || "")}</div>
      </div>
    </div>
  `;
}

function renderCopy(item) {
  const safe = (v) => escapeHtml(String(v ?? ""));
  return `
    <div class="card">
      <h3>${safe(item?.location || "Location")}</h3>
      <div class="kvs">
        <div><span class="k">Before:</span> ${safe(item?.before || "")}</div>
        <div><span class="k">After:</span> ${safe(item?.after || "")}</div>
      </div>
    </div>
  `;
}

function renderFixList(items, whyKey, howKey) {
  const safe = (v) => escapeHtml(String(v ?? ""));
  if (!Array.isArray(items) || !items.length) return `<div class="small">No items returned.</div>`;
  return items
    .slice(0, 8)
    .map(
      (x) => `
        <div class="card">
          <h3>${safe(x?.title || "Fix")}</h3>
          <div class="kvs">
            <div><span class="k">Why:</span> ${safe(x?.[whyKey] || "")}</div>
            <div><span class="k">How:</span> ${safe(x?.[howKey] || "")}</div>
          </div>
        </div>
      `
    )
    .join("");
}

function renderExperimentList(items) {
  const safe = (v) => escapeHtml(String(v ?? ""));
  if (!Array.isArray(items) || !items.length) return `<div class="small">No items returned.</div>`;
  return items
    .slice(0, 6)
    .map(
      (x) => `
        <div class="card">
          <h3>${safe(x?.title || "Experiment")}</h3>
          <div class="kvs">
            <div><span class="k">Hypothesis:</span> ${safe(x?.hypothesis || "")}</div>
            <div><span class="k">Test:</span> ${safe(x?.test || "")}</div>
            <div><span class="k">Success metric:</span> ${safe(x?.success_metric || "")}</div>
          </div>
        </div>
      `
    )
    .join("");
}

function escapeHtml(str) {
  return str
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}


