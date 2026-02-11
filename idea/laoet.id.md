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

#### Site Architecture (Confirmed)

pelni.co.id is a **Laravel** application. The reservation page at `/reservasi-tiket` uses a **server-rendered form** with **AJAX-powered dependent dropdowns**. No SPA framework — just jQuery + Select2.

**Form flow:**

1. User selects **departure port** (`ticket_org`) — static `<select>` with ~340 `<option>` elements, pre-rendered in HTML
2. On change → AJAX `POST /getdes` fetches valid **destination ports** for that origin
3. User selects **destination port** (`ticket_des`)
4. User picks **departure date** (`ticket_month`) — datepicker, format `DD/MM/YYYY`, max 2 months ahead
5. On date/destination change → AJAX `POST /getclass` fetches available **cabin classes**
6. Submit → `POST /reservasi-tiket` → server returns full page with **embedded JSON schedule data**

The site also has a **sandbox environment** at `sandbox.pelni.co.id` (currently shows "Layanan Dalam Perbaikan").

#### Discovered API Endpoints

All endpoints are `POST` requests to `https://www.pelni.co.id/...` and require a `_token` (CSRF) parameter.

| Endpoint | Purpose | Parameters | Returns |
|---|---|---|---|
| `POST /getdes` | Get valid destinations for an origin | `ticket_org`, `_token` | HTML `<option>` elements |
| `POST /getorg` | Get valid origins for a destination | `ticket_des`, `_token` | HTML `<option>` elements |
| `POST /getclass` | Get available cabin classes for a route+date | `ticket_org`, `ticket_des`, `ticket_month`, `ticket_male`, `ticket_female`, `_token` | HTML `<option>` elements |
| `POST /reservasi-tiket` | Search schedules | `ticket_org`, `ticket_des`, `ticket_month`, `ticket_class`, `ticket_male`, `ticket_female`, `ticket_baby`, `_token` | Full HTML page with embedded `jsonData` |
| `POST /checkavb` | Check seat availability | `org`, `org_call`, `des`, `des_call`, `dep_date`, `ship_no`, `subclass`, `female_pax`, `male_pax`, `_token` | JSON `{ availability: number }` |
| `POST /reservasi-tiket/pick-schedule` | Select a specific schedule for booking | All trip details (hidden form fields) | Redirect to booking page |

**Key insight**: The schedule search results are **embedded as a JavaScript variable** `var jsonData = [...]` in the HTML response. This is the richest data source — it contains everything we need.

#### Schedule Response Data Structure

Each item in `jsonData` contains:

```json
{
  "ship": "(NP-131-H8) KM.LABOBAR",
  "ship_no": "NP-131-H8",
  "ship_name": "KM.LABOBAR",
  "fare_class": "KELAS EKONOMI / E",
  "deptime_plain": "21:00",
  "depdate_plain": "Friday, 13 February 2026",
  "arrtime_plain": "22:00",
  "arrdate_plain": "Tuesday, 17 February 2026",
  "duration_plain": "04 hari 01 jam 00 menit",
  "price": "Rp. 808.000",
  "price_original": "Rp. 808.000",
  "discount": null,
  "discount_amount": "0,00",
  "org_name": "TANJUNG PRIOK",
  "des_name": "AMBON",
  "rpdetail": {
    "route": "Rute",
    "route_arr": ["431/1", "563/1", "893/1", "921/1", "946/1"],
    "route_arr_arv_date": ["", "202602142200", "202602160400", "202602162200", "202602172200"],
    "route_arr_dep_date": ["202602132100", "202602150200", "202602160800", "202602162359", ""],
    "split_route": "<div>SURABAYA 22:00-02:00 15 Feb 2026</div>..."
  },
  "form": {
    "org": "431",
    "des": "946",
    "dep_date": "20260213",
    "code_class": "EKO",
    "subclass": "E",
    "pdprice_adult": "808.000",
    "pdprice_infant": "81.700"
  }
}
```

**Critical fields for laoet.id:**
- `rpdetail.route_arr` — Array of port IDs with call number (e.g. `"431/1"` = port 431, call 1). This is the **full route with all intermediate stops**.
- `rpdetail.route_arr_arv_date` / `route_arr_dep_date` — Arrival/departure timestamps at each stop (`YYYYMMDDHHmm` format)
- `ship_no` — Internal ship identifier (e.g. `NP-131-H8`)
- `form.pdprice_adult` / `form.pdprice_infant` — Per-person prices

#### Port Database (340+ Ports)

Ports are **statically rendered** in the `<select>` dropdown (not loaded via AJAX). Format:

```
<option value="431">JAKARTA UTARA, DKI JAKARTA | TPR - TANJUNG PRIOK</option>
<option value="946">AMBON, MALUKU | AMQ - AMBON</option>
<option value="563">SURABAYA, JAWA TIMUR | SUB - TANJUNG PERAK</option>
```

**Parsed structure**: `value=PORT_ID` → `KABUPATEN, PROVINSI | IATA_CODE - PORT_NAME`

Total: ~340 ports (not 90-100 as initially estimated). This includes major ports and small remote islands.

Sample port codes (major hubs):
| Port ID | Code | Name | Region |
|---|---|---|---|
| 431 | TPR | Tanjung Priok | DKI Jakarta |
| 563 | SUB | Tanjung Perak | Jawa Timur |
| 893 | MAK | Makassar | Sulawesi Selatan |
| 946 | AMQ | Ambon | Maluku |
| 835 | BIT | Bitung | Sulawesi Utara |
| 971 | SOQ | Sorong | Papua Barat |
| 972 | MKW | Manokwari | Papua Barat |
| 974 | DJJ | Jayapura | Papua |
| 681 | TQP | Kupang | NTT |
| 144 | BLW | Belawan | Sumatera Utara |
| 256 | BUR | Batam | Kepulauan Riau |
| 662 | LBO | Labuan Bajo | NTT |

**Destination filtering**: When user selects an origin, `POST /getdes` returns only the valid destinations for that port. This means **not all port pairs have routes** — we can use `/getdes` to discover the actual route graph.

#### Port Coordinates (From Ship Schedule Visualizer)

We have lat/lng coordinates for ~80 key ports from an existing PELNI schedule visualization:

```json
{
  "Tg.Priok": [-6.1030, 106.8851],
  "Surabaya": [-7.2093, 112.7331],
  "Makassar": [-5.1310, 119.4121],
  "Ambon": [-3.6961, 128.1812],
  "Sorong": [-0.8809, 131.2589],
  "Jayapura": [-2.5333, 140.7167],
  "Kupang": [-10.1652, 123.6062],
  "Labuan Bajo": [-8.4965, 119.8785],
  "Bitung": [1.4428, 125.1873],
  "Ternate": [0.7891, 127.3789],
  "Batam": [1.1671, 103.9968],
  "Belawan": [3.7841, 98.6888]
}
```

Remaining ~260 ports can be geocoded from OpenStreetMap or Google Geocoding API.

#### Known PELNI Ships

**Regular passenger ships** (from website search results):

| Ship ID | Ship Name |
|---|---|
| NP-131-H8 | KM. Labobar |
| NP-132-B16 | KM. Gunung Dempo |
| ... | (more discovered via scraping) |

**Ships with confirmed route data** (from schedule visualizer):

| Ship | Route Pattern | Cycle |
|---|---|---|
| KM. Awu | Kumai - Surabaya - Benoa - Bima - Waingapu - Ende - Kupang - Kalabahi (and back) | ~14 days |
| KM. Dobonsolo | Tg.Priok - Surabaya - Makassar - Bau-Bau - Sorong - Manokwari - (Nabire - Biak - Jayapura) (and back) | 12-16 days (2 route variants) |
| KM. Kelimutu | Tg.Priok - Tg.Pandan - Pontianak - Semarang - Kumai (and back, 2 route variants) | 11-17 days |
| KM. Lambelu | Makassar - Pare-Pare - Balikpapan - Tarakan - Nunukan - Pantoloan (and back, + NTT loop) | ~14 days |
| KM. Nggapulu | Tg.Priok - Surabaya - Makassar - Bau-Bau - Namlea - Ambon - Ternate - Jailolo - Bitung (and back) | ~14 days |
| KM. Sinabung | Surabaya - Makassar - Bau-Bau - Banggai - Bitung - Ternate - Bacan - Sorong - Manokwari - Nabire - Biak - Jayapura (and back) | ~17 days |
| KM. Tatamailau | Bitung - Tidore - Sorong - Fak-Fak - Kaimana - Tual - Timika - Agats - Merauke (and back) | ~16 days |
| KM. Tidar | Kijang - Tg.Priok - Surabaya - Makassar - Bau-Bau - Maumere - Larantuka - Lewoleba - Kupang (and back) | ~14 days |
| KM. Wilis | Batulicin - Makassar - Labuan Bajo - Bima - Waikelo - Waingapu - Ende - Kupang - Kalabahi (and back) | ~14 days |
| KM. Kelud | Tg.Priok - Batam - Tg. Balai Karimun - Belawan (and back) | ~7 days |
| KM. Sabuk Nusantara 95 | Tahuna - Kawaluso - Matutuang - Kawio - Marore (and back) | ~5 days |
| KM. Sabuk Nusantara 97 | Kwandang - Paleleh - Leok - Toli Toli - Tarakan - Nunukan - P. Sebatik (and back) | ~11 days |
| KM. Sabuk Nusantara 69 | Bitung - Makalehi - Para - Ngalipaeng - ... - Miangas - ... - Tahuna - Likupang - Bitung | ~9 days |

**Key insight**: Ships have voyage numbers (e.g. `13.2025`, `14.2025`) and some ships alternate between 2 route variants (Rute A / Rute B).

#### Cabin Classes

Available classes from the website:

| Code | Name |
|---|---|
| EKO | Kelas Ekonomi |
| ENS | Ekonomi Non Seat |
| EWA | Ekonomi Khusus Wanita |
| EK1-EK4 | Ekonomi Eks Kabin Kls 1-4 |
| 2, 2A, 2B | Kelas 2 / 2A / 2B |
| 1, 1A, 1B | Kelas 1 / 1A / 1B |
| BSN | Kelas Bisnis |
| EXC | Kelas Eksekutif |
| VIP | Kelas VIP |

#### Data Acquisition Strategy

**Approach A: Scrape via form submission (PRIMARY — confirmed working)**

The most reliable approach. Submit the search form and extract `jsonData` from the response.

```
Step 1: GET /reservasi-tiket
        → Parse _token from: <input type="hidden" name="_token" value="...">
        → Parse all port options from <select name="ticket_org">
        → Store cookies (laravel_session, XSRF-TOKEN)

Step 2: POST /getdes  (for each origin port)
        → body: { ticket_org: PORT_ID, _token: TOKEN }
        → Returns HTML <option> list of valid destinations
        → This maps the entire route graph: which ports connect to which

Step 3: POST /reservasi-tiket  (for each origin-destination pair)
        → body: {
            ticket_org: "431",
            ticket_des: "946",
            ticket_month: "11/02/2026",
            ticket_class: "",       // empty = all classes
            ticket_male: 1,
            ticket_female: 0,
            ticket_baby: 0,
            _token: TOKEN
          }
        → Parse response HTML for: var jsonData = [...];
        → Extract schedule, prices, transit stops, ship info

Step 4: Store extracted data in database
```

**Approach B: Discover route graph via `/getdes` endpoint (RECOMMENDED FIRST STEP)**

Instead of brute-forcing all ~340×340 port pairs, call `/getdes` for each of the 340 origin ports. This reveals the actual connectivity graph.

```
for each port_id in ALL_PORTS:
    destinations = POST /getdes { ticket_org: port_id }
    store_edges(port_id, destinations)
    sleep(1000)

// Result: adjacency list of all valid routes
// Then only scrape schedules for known valid pairs
```

Estimated: ~340 requests to map the full graph. At 1 req/sec = ~6 minutes.

**Approach C: Reverse-engineer the PELNI Mobile App API**

1. PELNI has an official app: `id.co.pelni.superapp` ([Play Store](https://play.google.com/store/apps/details?id=id.co.pelni.superapp))
2. Use **mitmproxy** to intercept the app's HTTP traffic
3. May expose cleaner REST API endpoints returning pure JSON

**Approach D: Third-party reseller APIs**

- **Darmawisata Indonesia** offers a reseller API that includes PELNI tickets
- Contact: `it.devel@pelni.co.id` for official API access

#### Scraper Implementation Plan

```
pelni-scraper/
├── src/
│   ├── session.ts        # GET /reservasi-tiket, extract CSRF token + cookies
│   ├── ports.ts          # Parse all <option> from HTML, store port master list
│   ├── graph.ts          # POST /getdes for each port → build route adjacency list
│   ├── schedule.ts       # POST /reservasi-tiket for each valid pair → extract jsonData
│   ├── parser.ts         # Parse jsonData JSON: routes, stops, prices, ships
│   ├── normalize.ts      # Normalize port names (Tg.Priok = Tanjung Priok = TPR)
│   └── store.ts          # Upsert to PostgreSQL
├── cron/
│   ├── weekly-graph.ts   # Weekly: refresh route graph via /getdes
│   ├── daily-schedule.ts # Daily: scrape next 2 months of schedules for all valid pairs
│   └── semester-full.ts  # Semester: full rescrape all routes × all months
├── data/
│   ├── ports.json        # Cached port master list (340+ ports)
│   ├── coordinates.json  # Port lat/lng (80 known + geocoded rest)
│   └── graph.json        # Route adjacency list from /getdes
└── config.ts             # Rate limits, CSRF refresh logic, headers
```

**CSRF handling:**

```ts
// 1. GET /reservasi-tiket → extract _token from hidden input
//    <input type="hidden" name="_token" value="M0kTraOuq7ZzH3L6iJ9AV5Fg1xhsPR36pS9HmXfj">
// 2. Store laravel_session and XSRF-TOKEN cookies
// 3. Include _token in all POST request bodies
// 4. Refresh session on 419 (token expired) or every ~30 minutes
```

**Key scraping logic:**

```ts
// Phase 1: Build route graph (run weekly)
const session = await getSession() // GET /reservasi-tiket, extract token
const ports = parsePortOptions(session.html) // ~340 ports

for (const port of ports) {
  const destinations = await postGetDes(session, port.id)
  storeRouteEdges(port.id, destinations)
  await sleep(1000)
}

// Phase 2: Scrape schedules for known routes (run daily)
const edges = getRouteEdges() // from Phase 1
for (const [origin, destination] of edges) {
  const html = await postSearch(session, origin, destination, dateRange)
  const jsonData = extractJsonData(html) // regex: var jsonData = (\[.*?\]);
  for (const trip of jsonData) {
    upsertSchedule({
      ship_no: trip.ship_no,
      ship_name: trip.ship_name,
      origin_port: trip.form.org,
      dest_port: trip.form.des,
      departure: parseDateTime(trip.form.dep_date, trip.deptime_plain),
      arrival: parseDateTime(trip.arrdate_plain, trip.arrtime_plain),
      duration: trip.duration_plain,
      stops: parseRouteStops(trip.rpdetail),
      price_adult: parsePrice(trip.form.pdprice_adult),
      price_infant: parsePrice(trip.form.pdprice_infant),
      cabin_class: trip.form.code_class,
      discount: trip.discount,
    })
  }
  await sleep(2000) // polite delay
}
```

#### Update Strategy

| What | Frequency | Method |
|---|---|---|
| Port list | Monthly | Re-parse `<select>` from `/reservasi-tiket` |
| Route graph | Weekly | `POST /getdes` for all 340 ports (~6 min) |
| Schedules (next 2 months) | Daily | `POST /reservasi-tiket` for all valid route pairs |
| Prices | Daily | Included in schedule response |
| Full schedule (6 months) | Every 2 weeks | All pairs × extended date range |
| Holiday changes | On-demand | Monitor @pelni162 social media |

#### Known Challenges

- **CSRF + session handling**: All POST endpoints require `_token`. Must maintain session cookies and refresh on 419 response.
- **Rate limiting**: pelni.co.id returns 403 on aggressive requests. Use 1-2 second delays between requests.
- **HTML response parsing**: Schedule data is embedded as `var jsonData = [...]` in server-rendered HTML — need regex or DOM parsing to extract.
- **Destination filtering**: Not all port pairs have routes. Must use `/getdes` to discover valid pairs first, otherwise wasting requests.
- **Route variants**: Some ships alternate between 2 routes (Rute A / Rute B). The schedule data includes this but need to track which variant is active.
- **Date limitation**: The datepicker only allows searching 2 months ahead (`maxDate:"+2m"`). For longer-term schedules, need the separate ship schedule data.
- **Holiday chaos**: Lebaran/Natal schedules change late. PELNI announces via social media before updating the website.
- **Sandbox environment**: `sandbox.pelni.co.id` exists but is currently down — worth monitoring.

#### Reference Architecture

The [comuline/api](https://github.com/comuline/api) project (KRL commuter line schedule API) uses a similar approach:
- Daily cron job scrapes PT. KAI's website
- Two-phase sync: stations first, then schedules (same pattern we need: ports first, then routes)
- PostgreSQL + Redis cache + Hono API on Cloudflare Workers
- This is the closest open-source reference for Indonesian transport data scraping

#### Supplementary Data: Ship Schedule Visualizer

A separate data source exists with **pre-compiled ship schedules** including:
- Full voyage-by-voyage schedules with ETA/ETD at every port
- Port coordinates (lat/lng) for ~80 ports
- Ship metadata and route patterns

This data can **seed the database** before the scraper runs, giving us historical route patterns and port coordinates. It covers 13+ ships with multiple voyages each.

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
