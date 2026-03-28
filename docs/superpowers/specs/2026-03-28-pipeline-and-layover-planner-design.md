# Pipeline Redesign & Layover Planner — Design Spec

**Date**: 2026-03-28
**Status**: Approved

---

## Overview

Two parallel changes:

1. **Pipeline redesign** — reduce AI cost by 80%+ using a lightweight Analyzer that only runs on top-20 pre-filtered candidates, with permanent caching of per-place metadata (transit time, stay duration, layover score).
2. **Layover Planner (Mode 2)** — when the user sets a return-to-airport time, the tab interface is replaced by a locally-computed itinerary candidate list filtered for the available time window.

---

## 1. Data Model

### New table: `PlaceMetadata`

Persists across pipeline runs (never deleted/recreated). Keyed by Google Places `placeId`.

```prisma
model PlaceMetadata {
  placeId        String   @id
  lat            Float
  lng            Float
  transitMinutes Int      // Airport (EFHK) → place, public transport (Google Maps)
  stayMinutes    Int      // Recommended visit duration (type default + AI override)
  layoverScore   Float    // 1–10, AI-assigned layover friendliness
  updatedAt      DateTime @updatedAt
}
```

**Stay duration defaults** (local, no AI needed):

| Type | Default |
|------|---------|
| café, coffee_shop, bakery | 30 min |
| bar, pub, cocktail_bar, wine_bar | 45 min |
| restaurant | 60 min |
| market, shopping_mall | 30 min |
| park, city_park, beach, marina | 45 min |
| museum, art_gallery, cultural_center | 90 min |
| amusement_park, zoo, aquarium | 120 min |
| sauna, spa | 90 min |
| church, tourist_attraction | 30 min |

AI adjusts `stayMinutes` only for places whose character differs significantly from the type default (e.g. Suomenlinna → 120 min instead of 45 min for a park).

**layoverScore semantics**:
- 8–10: Ideal for short layovers (central, fast visit, easy transport)
- 6–7: Good for 4h+ layovers
- < 6: Filtered out from layover planner (too far, too long, or awkward for transit visitors)

---

## 2. Pipeline Redesign

### Model

- **Analyzer**: `MiniMax-M2.7-highspeed` (switch to M2.1 once tool_use support is verified)
- **Selector**: `MiniMax-M2.7` (same caveat)

### Flow per pipeline run

```
Google Places fetch (wide net, 25km radius)
    ↓
Local pre-filter
  · rating >= 3.5, reviewCount >= 100
  · Bayesian sort (M=2000) + popularity (log reviewCount)
  · Take top 20 candidates per category/list
    ↓
PlaceMetadata check
  · Already has metadata → skip AI, use cached values
  · New place → run Analyzer + Google Maps Distance Matrix
    ↓
Analyzer (M2.7-highspeed, only new places, 1–2 batches max)
  · uniqueness (1–10)
  · appeal (1–10)
  · redFlag (bool)
  · layoverScore (1–10) ← new field
  · stayMinutesOverride (int | null) ← null = use type default
  · Write results to PlaceMetadata
    ↓
Google Maps Distance Matrix (only new places)
  · Origin: Helsinki-Vantaa Airport (60.3172° N, 24.9633° E)
  · Mode: transit
  · Write transitMinutes to PlaceMetadata
    ↓
Selector (M2.7, one call per category/list)
  · Input: top 20 (post-Analyzer, redFlag filtered)
  · Output: final 10 with reason / reasonFi / reasonZh
  · Write to CuratedPlace
```

### Scoring (unchanged structure, new weights)

```
quality    = Bayesian(rating, reviewCount, globalMean) / 5 × 70 pts
popularity = log10(reviewCount) / log10(50000) × 10 pts
growth     = min(reviewCountDelta / 50, 1) × 10 pts
semantic   = (uniqueness + appeal) / 20 × 10 pts
─────────────────────────────────────────────────────
total      = 100 pts
```

Hidden Gems scoring unchanged (obscurity replaces popularity).

### Helsinki + Espoo area expansion

```typescript
// lib/cities.ts
helsinki: {
  center: { lat: 60.1699, lng: 24.9384 },
  radius: 25000,  // expanded from ~12000 to cover Espoo
}
```

No new city entry. Espoo results appear within the Helsinki lists.

---

## 3. Mode 1 — Default (no timer set)

- Existing tab structure unchanged: Cafés / Bars / Restaurants / People Love / Hidden Gems
- Rankings favour tourist-popular places (high reviewCount + rating)
- Selector prompt updated: emphasise "well-known, easily accessible, tourist-friendly"
- Data range: Helsinki + Espoo (25km radius from city centre)

---

## 4. Mode 2 — Layover Planner (timer active)

### Trigger

- User sets return-to-airport time in LayoverTimer → Mode 2 activates
- User clears time → reverts to Mode 1 (tabs)
- State managed in parent component, passed down as prop

### Time brackets

The available time `T` is computed continuously from the countdown. UI shows the user which bracket they fall into (2h / 4h / 6h / 8h / 10h) as a reference label, but filtering uses the exact remaining minutes.

### Local filtering algorithm (no real-time AI)

```
availableMinutes = T (exact countdown value)

1. Basic eligibility
   transitMinutes × 2 + stayMinutes < availableMinutes × 0.85
   layoverScore >= 6

2. Citywalk clustering
   Group candidates where walking distance < 10 min (≈ 800m)
   Prefer clusters — solo places with no nearby companions ranked lower

3. Category diversity
   Max 3 places per category in final 20
   Minimum 2 distinct categories represented

4. Sort by score desc, take top 20
```

### UI (replaces tab bar when Mode 2 is active)

- Header: "你有 Xh Ymin" + time bracket label
- Candidate list (not a fixed itinerary — user picks freely):
  - Place name, type badge, rating
  - Transit time from airport (from PlaceMetadata)
  - Suggested stay duration (from PlaceMetadata)
  - Walking distance to other selected places (computed dynamically)
- Checkboxes or tap-to-select interaction
- Footer: "已选 Xmin / Ymin 可用" progress bar
- No AI calls at runtime — fully local

### What Mode 2 does NOT do

- Does not plan a fixed route or sequence (user chooses freely)
- Does not call any AI at runtime
- Does not show museums, saunas, amusement parks (filtered by layoverScore < 6)

---

## 5. Google Maps Integration

**API used**: Distance Matrix API (transit mode)
**Called only for new places** (not in PlaceMetadata yet)
**Origin**: `60.3172,24.9633` (Helsinki-Vantaa Airport)
**Destination**: place lat/lng (fetched from Google Places response)

Walking distances between places (for citywalk clustering) are computed locally using the Haversine formula — no API call needed for rough 800m threshold.

---

## 6. What Is Not Changing

- Tab UI structure (Mode 1)
- CuratedPlace schema (except no new fields — metadata is in PlaceMetadata)
- OpeningHours, WeatherWidget, CitySelector, LanguageSwitcher components
- i18n structure
- API routes for `/api/places`, `/api/curated`, `/api/hidden-gems`

---

## 7. Open Questions (resolved)

| Question | Decision |
|----------|----------|
| M2.1 tool_use support? | Use M2.7/M2.7-highspeed until verified |
| Espoo as separate city? | No — expand Helsinki radius to 25km |
| Mode 2 real-time AI? | No — fully local, AI only in pipeline |
| Route planning in Mode 2? | No — candidate list only, user picks freely |
| Walking distances via API? | No — Haversine formula locally for clustering |
