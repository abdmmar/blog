# laoet.id

> Like flightsfrom.com, but for boats in Indonesia.

A route discovery platform for sea transportation across the Indonesian archipelago. Users can explore where they can go by boat from any harbour — covering PELNI long-haul ships, ASDP ferries, and small local boats (kapal nelayan, speedboat, etc.).

---

## Core Concept

Indonesia has 17,000+ islands but no single platform that answers: **"From harbour X, where can I go by boat?"**

laoet.id solves this by aggregating route data from multiple sources into one searchable map.

---

## MVP Feature: Route Selection

- User picks a departure harbour (from search or map)
- App shows all reachable destinations with lines on a map
- Each route shows: operator, estimated duration, frequency, vessel type, and price range
- User can click a destination to see schedule details

---

## Data Sources

### 1. PELNI (PT Pelayaran Nasional Indonesia)

Long-distance passenger ships connecting major ports across Indonesia.

#### Site Architecture

pelni.co.id is a **Laravel** application. The reservation page at `/reservasi-tiket` uses a form-based flow:

1. User selects **departure port** (Pelabuhan Asal) from a dropdown
2. User selects **destination port** (Pelabuhan Tujuan) — likely filtered by available routes from selected origin
3. User picks **departure month** (Bulan Keberangkatan)
4. User picks **ship** (Kapal) — optional, or picks from available ships on that route
5. Submit → returns matching schedule results

The site also has a **sandbox environment** at `sandbox.pelni.co.id` (currently shows "Layanan Dalam Perbaikan") which suggests they have a staging API.

#### Known PELNI Ships (26 vessels)

These are the active passenger ships that we need to track routes for:

| Ship | Ship | Ship |
|---|---|---|
| KM. Bukit Siguntang | KM. Ciremai | KM. Dobonsolo |
| KM. Egon | KM. Gunung Dempo | KM. Kelud |
| KM. Kelimutu | KM. Lambelu | KM. Labobar |
| KM. Lawit | KM. Leuser | KM. Nggapulu |
| KM. Pangrango | KM. Sangiang | KM. Sinabung |
| KM. Sirimau | KM. Tatamailau | KM. Tilongkabila |
| KM. Tidar | KM. Umsini | KM. Wilis |
| KM. Binaiya | KM. Dorolonda | KM. Awu |
| KM. Sabuk Nusantara 93 | KM. Sabuk Nusantara 96 | |

Each ship follows a fixed cyclical route (e.g., KM. Kelud loops Jakarta → Batam → Tanjung Karimun → Medan and back). Routes repeat on ~2-week cycles.

#### Data Acquisition Strategy

**Approach A: Reverse-engineer the website's XHR/API calls (PRIMARY)**

1. Open `pelni.co.id/reservasi-tiket` in browser DevTools → Network tab
2. Select a departure port, destination, month → observe the XHR requests fired
3. The Laravel backend likely serves JSON responses for:
   - Port list endpoint (populates the departure/destination dropdowns)
   - Schedule search endpoint (returns matching trips for a port pair + month)
   - Ship list endpoint (populates ship dropdown)
4. Key things to capture from the network tab:
   - URL pattern (e.g., `/api/ports`, `/api/schedule`, `/reservation/schedule`)
   - HTTP method (GET/POST)
   - Request headers (especially `X-CSRF-TOKEN`, cookies, `X-Requested-With`)
   - Request payload (port codes, date params)
   - Response shape (JSON with schedule entries)
5. Old URL pattern spotted from archives: `/reservation/schedule/?opsi=opsiDestinations&originPort=...&destinationPort=...&tgl_mulai=...&ship=...`

**Approach B: Reverse-engineer the PELNI Mobile App API**

1. PELNI has an official app: `id.co.pelni.superapp` ([Play Store](https://play.google.com/store/apps/details?id=id.co.pelni.superapp))
2. Use **mitmproxy** or **Charles Proxy** to intercept the app's HTTP traffic
3. The mobile app likely hits a cleaner REST API than the website (possibly at a subdomain like `api.pelni.co.id` or same origin)
4. Steps:
   - Install PELNI app on Android emulator
   - Configure mitmproxy as system proxy + install CA cert
   - Browse schedules in the app → capture all API calls
   - Document endpoints, auth headers, request/response schemas
5. Mobile APIs often return richer data (seat availability, real-time status) that the website doesn't expose

**Approach C: Scrape the HTML pages (FALLBACK)**

If the above APIs are protected or obfuscated:
1. Use **Playwright** to automate the browser flow on `pelni.co.id/reservasi-tiket`
2. For each ship × month combination, submit the form and parse the results table
3. Iterate: 26 ships × 12 months = 312 scrape jobs per full refresh
4. Parse the HTML response for schedule entries (departure time, arrival time, port names, prices)
5. Use polite scraping: 2-3 second delays between requests, respect robots.txt

**Approach D: Third-party reseller APIs**

- **Darmawisata Indonesia** offers a reseller API that includes PELNI tickets — could be a clean data source if partnership is established
- **Fastpay** also resells PELNI tickets and publishes schedule data
- Contact: `it.devel@pelni.co.id` to ask about official API access

#### Scraper Implementation Plan

```
pelni-scraper/
├── src/
│   ├── ports.ts          # Fetch & cache all port codes + names
│   ├── ships.ts          # Hardcoded ship list (26 vessels)
│   ├── schedule.ts       # Fetch schedules per ship or port-pair
│   ├── normalize.ts      # Normalize port names, deduplicate
│   └── store.ts          # Upsert to PostgreSQL
├── cron/
│   ├── daily.ts          # Daily: scrape next 2 months of schedules
│   └── semester.ts       # Semester: full rescrape all ships × all months
└── config.ts             # Rate limits, CSRF handling, headers
```

**Key scraping logic:**

```
// Pseudocode for the core scraping loop
for each ship in PELNI_SHIPS:
  for each month in NEXT_6_MONTHS:
    schedules = fetchSchedule(ship, month)
    for each trip in schedules:
      upsertRoute({
        departure: trip.origin_port,
        destination: trip.destination_port,
        ship: ship.name,
        departure_time: trip.depart_at,
        arrival_time: trip.arrive_at,
        prices: trip.fare_classes,
      })
    sleep(2000) // polite delay
```

**Handling Laravel CSRF:**

```
// Laravel requires CSRF token for form submissions
// 1. GET /reservasi-tiket → extract meta[name="csrf-token"] from HTML
// 2. Include in subsequent requests as X-CSRF-TOKEN header
// 3. Also send the laravel_session cookie from the initial request
// 4. Token expires — refresh every ~30 minutes or on 419 response
```

#### Port Code Discovery

The dropdown on `/reservasi-tiket` contains all PELNI port codes. Strategy:
1. Fetch the page HTML once
2. Parse all `<option>` values from the departure port `<select>` element
3. This gives us the complete (port_code, port_name) mapping
4. Alternatively, if the dropdown is populated via AJAX, intercept that call to get the port list as JSON

Expected: ~90-100 PELNI ports across Indonesia.

#### Update Strategy

| What | Frequency | Method |
|---|---|---|
| Port list | Monthly | Refetch dropdown / API |
| Full schedule (all ships × 6 months) | Every 2 weeks | Iterate all ship-month combos |
| Near-term schedule (next 2 months) | Daily | Targeted scrape |
| Prices | Daily | Captured with schedule |
| Holiday schedule changes | On-demand | Monitor @pelaboranid & PELNI social media |

#### Known Challenges

- **CSRF + session handling**: Laravel will reject requests without valid CSRF token and session cookie. Must maintain a session.
- **Rate limiting**: pelni.co.id returns 403 on aggressive scraping. Use delays + rotate user-agent.
- **Cloudflare/WAF**: The site may use WAF protection. Playwright with stealth plugin can bypass basic checks.
- **Holiday chaos**: Lebaran, Natal/Tahun Baru schedules change late. PELNI announces via social media before updating the website.
- **Sandbox environment**: `sandbox.pelni.co.id` exists but is currently down — worth monitoring as it might expose a more accessible API.
- **No public API exists**: Confirmed via research — there is no documented public PELNI API. All data must be scraped or reverse-engineered.

#### Reference Architecture

The [comuline/api](https://github.com/comuline/api) project (KRL commuter line schedule API) uses a similar approach:
- Daily cron job scrapes PT. KAI's website
- Two-phase sync: stations first, then schedules (same pattern we need: ports first, then routes)
- PostgreSQL + Redis cache + Hono API on Cloudflare Workers
- This is the closest open-source reference for Indonesian transport data scraping

---

### 2. ASDP (PT ASDP Indonesia Ferry)

Short-to-medium distance ferry crossings (ro-ro ferries). Covers major straits like Merak-Bakauheni, Ketapang-Gilimanuk, etc.

**How to get the data:**

- **API/website scraping**: ASDP has a booking platform (ferizy.com / asdp.id). Scrape schedule and fare data from their search results.
  - The Ferizy app likely has a mobile API — reverse-engineer the endpoints from the Android APK or intercept traffic
  - Fields: route, departure times, ferry name, vehicle/passenger fares, trip duration
- **Ferizy partnership**: Approach ASDP for an official data partnership or API access. They may be open to it for visibility.
- **Open data**: Check if ASDP publishes annual reports or route data through government portals (data.go.id, dephub.go.id).

**Update strategy:**

- Schedule scrape: **daily** (ASDP ferries run on fixed daily schedules but may have cancellations)
- Fare updates: **weekly**
- Route availability: **monthly** (new routes are rare but do get added)

**Known challenges:**

- Ferizy may have anti-scraping measures
- Some ASDP routes are operated by third-party concessions — data may not appear on Ferizy
- Weather-related cancellations (especially in monsoon season) need real-time handling

---

### 3. Manual Input (Small Boats, Kapal Nelayan, Speedboat, Local Ferries)

This is the most valuable and hardest data layer — thousands of informal routes that exist nowhere online.

**How to get the data:**

- **Crowdsourcing form**: Build a simple submission form where locals, travelers, and boat operators can report routes.
  - Fields: departure harbour, destination harbour, vessel type, frequency (daily/weekly/on-demand), estimated price range, contact info, photo (optional)
  - Allow anonymous submissions but also verified "operator" accounts
- **Field research**: Partner with travel bloggers, backpackers, and diving communities who regularly use small boats. They're often the only people who document these routes.
- **Government data**: Dinas Perhubungan (local transportation offices) at kabupaten/kota level sometimes maintain lists of registered boat routes. Request data via formal letters or freedom of information requests.
- **WhatsApp/Telegram groups**: Many boat operators coordinate via WhatsApp groups (especially in Flores, Maluku, Raja Ampat, Karimunjawa). Join these groups (with consent) and extract route info.
- **Google Maps / reviews**: Scrape reviews and info from harbours on Google Maps — people often mention routes, prices, and schedules in reviews.

**Update strategy:**

- Community submissions: **continuous** (real-time, with moderation queue)
- Field verification: **quarterly** per region (rotate focus areas)
- Stale data cleanup: flag routes with no update in **6 months** as "unverified"
- Seasonal routes: tag routes that only operate in certain months (e.g., dive season boats)

**Known challenges:**

- Data quality and accuracy — need a verification/moderation system
- Routes may be informal (no fixed schedule, "berangkat kalau penuh")
- Pricing is often negotiable, especially for kapal nelayan
- Safety information is important but sensitive — consider adding safety notes without liability

---

## Data Model

```
Harbour
├── id
├── name (e.g., "Pelabuhan Merak")
├── location (lat, lng)
├── kabupaten / kota
├── provinsi
├── type (pelabuhan utama / pengumpul / pengumpan / informal)
└── facilities (parking, waiting room, toilet, etc.)

Route
├── id
├── departure_harbour_id
├── destination_harbour_id
├── operator_type (pelni / asdp / manual)
├── operator_name
├── vessel_type (kapal penumpang / ferry ro-ro / speedboat / kapal nelayan / kapal cepat)
├── duration_minutes
├── distance_km
├── frequency (daily / weekly / on-demand / seasonal)
├── schedule (JSON array of departure times, or null for on-demand)
├── price_range_min (IDR)
├── price_range_max (IDR)
├── source (scraped / manual / official_api)
├── last_verified_at
├── is_verified (boolean)
├── notes
└── created_at / updated_at

Submission (for crowdsourced data)
├── id
├── route_id (nullable, if updating existing)
├── submitted_by (user_id or anonymous)
├── data (JSON)
├── status (pending / approved / rejected)
├── moderator_notes
└── created_at
```

---

## Data Pipeline Architecture

```
┌─────────────┐     ┌─────────────┐     ┌──────────────┐
│ PELNI        │     │ ASDP/Ferizy │     │ Manual Input │
│ Scraper      │     │ Scraper     │     │ Form / API   │
└──────┬───────┘     └──────┬──────┘     └──────┬───────┘
       │                    │                    │
       ▼                    ▼                    ▼
┌──────────────────────────────────────────────────────┐
│                  Ingestion Layer                      │
│  - Normalize harbour names (fuzzy match to master)   │
│  - Deduplicate routes                                │
│  - Validate data (price sanity check, coordinates)   │
│  - Flag conflicts for manual review                  │
└──────────────────────┬───────────────────────────────┘
                       │
                       ▼
              ┌─────────────────┐
              │    Database      │
              │  (PostgreSQL)    │
              └────────┬────────┘
                       │
                       ▼
              ┌─────────────────┐
              │   Public API     │
              │  + Map Frontend  │
              └─────────────────┘
```

---

## Data Quality & Freshness Strategy

| Aspect | Approach |
|---|---|
| Harbour master list | Seed from Kemenhub data + OpenStreetMap. ~700 ports in Indonesia. |
| Name normalization | Build alias table (e.g., "Pelabuhan Bajoe" = "Bajoe" = "Bone Bay Port"). Fuzzy match on input. |
| Deduplication | Match on (departure, destination, operator, vessel_type). Merge if overlap. |
| Staleness | Show "last verified" date on every route. Auto-flag if >6 months stale. |
| Conflict resolution | If scraper and manual data disagree, prefer scraper for PELNI/ASDP, prefer manual for small boats. Flag for review. |
| Community trust | Implement reputation system — verified submitters' data gets auto-approved. |

---

## Phased Rollout

### Phase 1 — Static Route Map
- Seed harbour database from Kemenhub / OSM
- Scrape PELNI and ASDP schedules
- Build map UI with route selection
- No booking, just information

### Phase 2 — Community Data
- Launch submission form
- Add moderation dashboard
- Partner with travel communities for initial data seeding
- Focus on popular tourism routes (Labuan Bajo, Raja Ampat, Karimunjawa, Gili Islands)

### Phase 3 — Live Data & Alerts
- Real-time schedule updates where possible
- Weather-based route status (integrate BMKG data)
- Push notifications for schedule changes
- Deep linking to PELNI/Ferizy for booking

### Phase 4 — Booking & Monetization
- Direct booking for partner operators
- Commission-based model for small boat operators
- Promoted routes for tourism boards

---

## Tech Stack (Suggestion)

- **Frontend**: Next.js or Astro + Leaflet/Mapbox for map
- **Backend**: Node.js or Go for API + scrapers
- **Database**: PostgreSQL + PostGIS (for geospatial queries)
- **Scraping**: Playwright or Puppeteer (for JS-rendered sites), scheduled via cron or job queue
- **Hosting**: VPS in Jakarta/Singapore for low latency to Indonesian users

---

## Open Questions

- Legal: Is scraping PELNI/ASDP schedule data legally safe? (Likely yes for publicly available schedule info, but worth checking ToS)
- Naming: "laoet" is old-spelling Malay for "laut" (sea) — distinctive and memorable
- Scope: Start with Java + Bali + NTT corridor? Or go nationwide from day one?
- Language: Bahasa Indonesia primary, English secondary?
