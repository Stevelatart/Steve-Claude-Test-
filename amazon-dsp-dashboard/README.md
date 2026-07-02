# Amazon DSP Performance Dashboard

An interactive, self-contained performance dashboard for Brandography's four
Amazon DSP clients, covering **June 2026**. Open `index.html` in any browser
(no server or build step required) and switch between clients with the tabs.

Live version: https://claude.ai/code/artifact/d7d92c68-2ee1-4979-9634-98e8250e6709

## Clients

| Client | Impressions | CTR | Conversions |
|---|--:|--:|--:|
| Yates Astro | 285,331 | 0.99% | 4,381 |
| Bell's Appliances | 183,079 | 0.37% | 972 |
| Parrott Academy | 156,454 | 0.39% | — |
| Furniture Distributors | 105,031 | 0.19% | — |

## What each panel shows

- **KPI row** — delivered impressions, clicks, CTR, off-Amazon conversions,
  number of audience segments targeted, and unique sites/apps reached.
- **Campaign performance** — every active campaign with impressions, clicks,
  CTR and conversions.
- **Supply source mix** — top 8 exchanges/publishers by volume.
- **Audience intelligence** — highest-engaging segments (by CTR) and
  top-converting segments, plus the split of segment exposure by targeting type.
- **Category audience focus** *(Yates Astro only)* — curated pest-control and
  homeowner audience groups, defined in `FOCUS_RULES` in `build_data.py`.
- **Audience explorer** — every targeted segment for the client, with free-text
  search (e.g. "residency", "pest", "home"), a type filter (In-market /
  Lifestyle · Device / OS · Custom · Inventory), and click-to-sort columns.
  Matched text is highlighted and above-account-average CTR is flagged green.
- **Where ads ran** — top 10 sites and apps by impressions.

## Methodology (important)

The dashboard is built from two Amazon DSP exports, each used only for what it
measures reliably:

- **Inventory report** (by campaign / supply source / site) → **true delivery.**
  Each impression is counted once against the site it served on, so
  impressions, clicks, CTR and conversions are de-duplicated totals. All KPI
  and delivery figures come from here.
- **Audience segment report** → **relative audience performance only.**
  A single impression can match many segments simultaneously, so segment-level
  impression counts overlap and are **never summed** into delivery totals. These
  rank *which* audiences engage and convert, not *how much* was delivered.

This is why the largest single audience segment for each client closely matches
that client's total delivered impressions — the segment report describes the
same delivery sliced many overlapping ways.

## Regenerating the data

```bash
python build_data.py INVENTORY.csv REPORT.csv > data/dsp-metrics.json
```

`data/dsp-metrics.json` is the aggregated dataset; the same object is embedded
inline in `index.html` (as `const DATA = …`) so the page stays fully portable.
After regenerating, re-embed the JSON in place of that constant.

## Files

```
amazon-dsp-dashboard/
├── index.html            # the dashboard (self-contained, data embedded)
├── build_data.py         # aggregation script (CSV exports → metrics JSON)
├── data/dsp-metrics.json # aggregated per-client metrics
└── README.md
```
