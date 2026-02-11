#!/usr/bin/env node

/**
 * PELNI Route Graph Scraper
 *
 * Phase 1: GET /reservasi-tiket → extract CSRF token + parse all ports
 * Phase 2: POST /getdes for each port → build route adjacency graph
 *
 * Output:
 *   data/ports.json   — all ports with ID, code, name, region
 *   data/graph.json   — route adjacency list (port → destinations)
 *   data/summary.json — statistics and top hubs
 *
 * Features:
 *   - Resumable (saves progress every 20 ports)
 *   - Auto-refreshes session on CSRF expiry (419)
 *   - Retry with exponential backoff on rate limiting (429/403)
 *   - Polite 1.5s delay between requests
 *
 * Usage:
 *   node pelni-scraper.mjs
 *   node pelni-scraper.mjs --delay=2000    # custom delay in ms
 */

import { writeFileSync, mkdirSync, existsSync, readFileSync, unlinkSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, "data");

const BASE_URL = "https://www.pelni.co.id";
const DELAY_MS = parseInt(process.argv.find((a) => a.startsWith("--delay="))?.split("=")[1] || "1500");
const SESSION_REFRESH_INTERVAL = 50;
const MAX_RETRIES = 3;

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36";

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Extract cookies from response Set-Cookie headers
 */
function extractCookies(response, existing = {}) {
  const cookies = { ...existing };
  const raw = response.headers.getSetCookie?.() ?? [];
  for (const header of raw) {
    const [pair] = header.split(";");
    const eqIdx = pair.indexOf("=");
    if (eqIdx === -1) continue;
    const name = pair.slice(0, eqIdx).trim();
    const value = pair.slice(eqIdx + 1).trim();
    if (name) cookies[name] = value;
  }
  return cookies;
}

function cookieHeader(cookies) {
  return Object.entries(cookies)
    .map(([k, v]) => `${k}=${v}`)
    .join("; ");
}

/**
 * Get a fresh session: CSRF token + cookies
 */
async function getSession() {
  console.log("[session] Fetching /reservasi-tiket ...");

  const res = await fetch(`${BASE_URL}/reservasi-tiket`, {
    headers: {
      "User-Agent": UA,
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.9,id;q=0.8",
    },
    redirect: "follow",
  });

  if (!res.ok) {
    throw new Error(`GET /reservasi-tiket failed: HTTP ${res.status}`);
  }

  const html = await res.text();
  const cookies = extractCookies(res);

  // Extract CSRF token from hidden input or meta tag
  const tokenMatch =
    html.match(/<input\s+type="hidden"\s+name="_token"\s+value="([^"]+)"/) ||
    html.match(/<meta\s+name="csrf-token"\s+content="([^"]+)"/);

  if (!tokenMatch) {
    throw new Error("Could not find CSRF _token in HTML");
  }

  const token = tokenMatch[1];
  console.log(`[session] Token: ${token.slice(0, 10)}...  Cookies: ${Object.keys(cookies).join(", ")}`);

  return { token, cookies, html };
}

/**
 * Parse port <option> elements from HTML
 */
function parsePorts(html) {
  const ports = [];
  // Handle both quoted (value="946") and unquoted (value=946) attributes
  const re = /<option\s+value=["']?(\d+)["']?[^>]*>\s*([^<]+?)\s*<\/option>/g;
  let m;

  while ((m = re.exec(html)) !== null) {
    const id = m[1];
    const text = m[2].trim();
    const pipe = text.indexOf("|");
    if (pipe === -1) continue;

    const region = text.slice(0, pipe).trim();
    const codeAndName = text.slice(pipe + 1).trim();
    const dash = codeAndName.indexOf("-");

    const code = dash !== -1 ? codeAndName.slice(0, dash).trim() : codeAndName.trim();
    const name = dash !== -1 ? codeAndName.slice(dash + 1).trim() : "";
    const [kabupaten, ...rest] = region.split(",");
    const provinsi = rest.join(",").trim();

    ports.push({ id, code, name, kabupaten: kabupaten.trim(), provinsi, raw: text });
  }

  // Deduplicate (HTML has two selects: ticket_org + ticket_des)
  const seen = new Set();
  return ports.filter((p) => {
    if (seen.has(p.id)) return false;
    seen.add(p.id);
    return true;
  });
}

/**
 * POST /getdes — get valid destinations for an origin port
 */
async function getDestinations(session, portId, retries = 0) {
  try {
    const res = await fetch(`${BASE_URL}/getdes`, {
      method: "POST",
      headers: {
        "User-Agent": UA,
        Accept: "*/*",
        "Accept-Language": "en-US,en;q=0.9,id;q=0.8",
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        "X-Requested-With": "XMLHttpRequest",
        Origin: BASE_URL,
        Referer: `${BASE_URL}/reservasi-tiket`,
        Cookie: cookieHeader(session.cookies),
      },
      body: new URLSearchParams({ ticket_org: portId, _token: session.token }).toString(),
    });

    // Update cookies from response
    session.cookies = extractCookies(res, session.cookies);

    if (res.status === 419) {
      return { expired: true, destinations: [] };
    }

    if (res.status === 429 || res.status === 403) {
      if (retries < MAX_RETRIES) {
        const wait = 2 ** (retries + 1) * 1000;
        console.log(`  [rate-limited] HTTP ${res.status}, retrying in ${wait / 1000}s...`);
        await sleep(wait);
        return getDestinations(session, portId, retries + 1);
      }
      return { expired: false, destinations: [], error: `HTTP ${res.status}` };
    }

    if (!res.ok) {
      return { expired: false, destinations: [], error: `HTTP ${res.status}` };
    }

    const html = await res.text();
    const destinations = [];
    // /getdes returns unquoted values: value=946 (not value="946")
    const re = /<option\s+value=["']?(\d+)["']?[^>]*>\s*([^<]+?)\s*<\/option>/g;
    let m;
    while ((m = re.exec(html)) !== null) {
      if (m[2].toLowerCase().includes("pilih")) continue;
      destinations.push({ id: m[1], text: m[2].trim() });
    }

    return { expired: false, destinations };
  } catch (err) {
    if (retries < MAX_RETRIES) {
      const wait = 2 ** (retries + 1) * 1000;
      console.log(`  [error] ${err.message}, retrying in ${wait / 1000}s...`);
      await sleep(wait);
      return getDestinations(session, portId, retries + 1);
    }
    return { expired: false, destinations: [], error: err.message };
  }
}

async function main() {
  console.log("=== PELNI Route Graph Scraper ===\n");

  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });

  // Resume support
  const graphPath = join(DATA_DIR, "graph.json");
  const progressPath = join(DATA_DIR, "progress.json");
  let graph = {};
  let startIndex = 0;

  if (existsSync(progressPath)) {
    try {
      const p = JSON.parse(readFileSync(progressPath, "utf-8"));
      graph = p.graph || {};
      startIndex = p.lastIndex || 0;
      console.log(`Resuming from index ${startIndex} (${Object.keys(graph).length} ports done)\n`);
    } catch {
      // ignore
    }
  }

  // 1. Get session
  let session = await getSession();

  // 2. Parse ports
  const ports = parsePorts(session.html);
  console.log(`Found ${ports.length} ports\n`);
  writeFileSync(join(DATA_DIR, "ports.json"), JSON.stringify(ports, null, 2));

  // 3. Build route graph
  let reqCount = 0;
  let errStreak = 0;

  for (let i = startIndex; i < ports.length; i++) {
    const port = ports[i];
    if (graph[port.id]) continue;

    // Periodic session refresh
    if (reqCount > 0 && reqCount % SESSION_REFRESH_INTERVAL === 0) {
      console.log("\n  [refreshing session...]\n");
      try { session = await getSession(); } catch (e) { console.log(`  refresh failed: ${e.message}`); }
    }

    const result = await getDestinations(session, port.id);

    if (result.expired) {
      console.log("  [session expired, refreshing...]");
      try { session = await getSession(); i--; continue; }
      catch (e) { console.log(`  refresh failed: ${e.message}`); errStreak++; if (errStreak > 10) break; continue; }
    }

    graph[port.id] = {
      port_code: port.code,
      port_name: port.name,
      destinations: result.destinations.map((d) => d.id),
      destination_count: result.destinations.length,
    };

    const pct = ((i + 1) / ports.length * 100).toFixed(1);
    console.log(
      `[${String(i + 1).padStart(3)}/${ports.length}] ${pct}%  ${port.code.padEnd(4)} ${port.name.padEnd(25)} -> ${result.destinations.length} dest${result.error ? "  !! " + result.error : ""}`
    );

    reqCount++;
    errStreak = result.error ? errStreak + 1 : 0;

    if (reqCount % 20 === 0) {
      writeFileSync(progressPath, JSON.stringify({ lastIndex: i + 1, graph }));
      console.log(`  [saved progress: ${Object.keys(graph).length} ports]`);
    }

    if (errStreak > 10) { console.log("\nToo many errors, stopping."); break; }

    await sleep(DELAY_MS);
  }

  // Save final results
  writeFileSync(graphPath, JSON.stringify(graph, null, 2));

  const totalRoutes = Object.values(graph).reduce((s, p) => s + (p.destination_count || 0), 0);
  const withRoutes = Object.values(graph).filter((p) => p.destination_count > 0).length;

  const summary = {
    scraped_at: new Date().toISOString(),
    total_ports: ports.length,
    ports_in_graph: Object.keys(graph).length,
    ports_with_routes: withRoutes,
    total_directed_routes: totalRoutes,
    top_hubs: Object.entries(graph)
      .sort((a, b) => (b[1].destination_count || 0) - (a[1].destination_count || 0))
      .slice(0, 20)
      .map(([id, d]) => ({ id, code: d.port_code, name: d.port_name, destinations: d.destination_count })),
  };
  writeFileSync(join(DATA_DIR, "summary.json"), JSON.stringify(summary, null, 2));

  console.log(`\n=== Results ===`);
  console.log(`Ports scraped:   ${Object.keys(graph).length}/${ports.length}`);
  console.log(`Ports w/ routes: ${withRoutes}`);
  console.log(`Total routes:    ${totalRoutes}`);
  console.log(`\nTop 10 hubs:`);
  summary.top_hubs.slice(0, 10).forEach((h) =>
    console.log(`  ${h.code.padEnd(4)} ${h.name.padEnd(25)} ${h.destinations} dest`)
  );
  console.log(`\nSaved: data/ports.json, data/graph.json, data/summary.json`);

  if (Object.keys(graph).length >= ports.length * 0.9) {
    try { unlinkSync(progressPath); } catch {}
  }
}

main().catch((err) => {
  console.error("\n[FATAL]", err.message || err);
  process.exit(1);
});
