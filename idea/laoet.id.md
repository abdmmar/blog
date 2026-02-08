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

**How to get the data:**

- **Website scraping**: PELNI's booking site (pelni.co.id) has a schedule search. Build a scraper that queries all known port pairs periodically.
  - Target endpoints: the schedule search API behind their frontend (inspect network tab for XHR calls)
  - Fields to extract: route, departure/arrival port, departure/arrival time, ship name, fare classes & prices
- **PDF schedule**: PELNI publishes seasonal route maps and schedules as PDF. Parse these as a fallback/validation source.
- **Manual verification**: Cross-check with PELNI branch offices or call centers for routes that don't show up online.

**Update strategy:**

- Full scrape: **weekly** (PELNI schedules are relatively stable per semester)
- Delta check on pricing: **daily**
- Major schedule revision: **every 6 months** (PELNI typically revises routes twice a year, align with their semester schedule)

**Known challenges:**

- PELNI site may rate-limit or block scrapers — use polite scraping (delays, rotating user-agent, respect robots.txt)
- Schedule changes during Lebaran/holiday season are announced late — monitor their social media (Twitter/X, Instagram) for announcements
- Some routes are seasonal or weather-dependent

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
