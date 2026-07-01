#!/usr/bin/env python3
"""Aggregate Amazon DSP exports into per-client dashboard metrics.

Two source exports feed the dashboard, each used for what it measures reliably:

  * Inventory report (by campaign / supply source / site) -> TRUE delivery.
    Each impression is counted once against the site it served on, so
    impressions, clicks, CTR and conversions here are de-duplicated totals.

  * Audience segment report -> RELATIVE audience performance only.
    One impression can match many segments at once, so segment impression
    counts overlap; they are never summed into delivery totals. They rank
    which audiences engage (CTR) and convert.

Usage:
    python build_data.py INVENTORY.csv REPORT.csv > data/dsp-metrics.json
"""
import csv
import json
import sys
from collections import defaultdict

CLASS_LABEL = {
    "BEHAVIOR": "In-market & Lifestyle (Behavior)",
    "USER_AGENT": "Device / OS",
    "CUSTOM_ASIN": "Custom (ASIN)",
    "": "Other",
    "OTHER": "Other",
}


def num(x):
    if not x:
        return 0.0
    x = x.strip().replace("%", "").replace(",", "")
    try:
        return float(x)
    except ValueError:
        return 0.0


def new_client():
    return {
        "impr": 0.0, "clicks": 0.0, "conv": 0.0,
        "campaigns": defaultdict(lambda: {"impr": 0.0, "clicks": 0.0, "conv": 0.0}),
        "supply": defaultdict(lambda: {"impr": 0.0, "clicks": 0.0}),
        "sites": defaultdict(lambda: {"impr": 0.0, "clicks": 0.0}),
        "segs": defaultdict(lambda: {"impr": 0.0, "clicks": 0.0, "conv": 0.0, "cls": ""}),
        "clsmix": defaultdict(float),
    }


def load(inventory_path, report_path):
    C = defaultdict(new_client)

    # Inventory = real, de-duplicated delivery.
    with open(inventory_path, newline="", encoding="utf-8-sig") as f:
        for r in csv.DictReader(f):
            d = C[r["Advertiser account name"].strip()]
            imp, clk = num(r["Impressions"]), num(r["Clicks"])
            cv = num(r["Conversions (off-Amazon)"])
            d["impr"] += imp; d["clicks"] += clk; d["conv"] += cv
            ca = d["campaigns"][r["Campaign name"].strip()]
            ca["impr"] += imp; ca["clicks"] += clk; ca["conv"] += cv
            s = d["supply"][r["Supply source"].strip()]
            s["impr"] += imp; s["clicks"] += clk
            st = d["sites"][r["Site or app"].strip()]
            st["impr"] += imp; st["clicks"] += clk

    # Audience segment report = relative audience performance only.
    with open(report_path, newline="", encoding="utf-8-sig") as f:
        for r in csv.DictReader(f):
            d = C[r["Advertiser account name"].strip()]
            imp = num(r["Impressions"])
            seg = d["segs"][r["Audience segment name"].strip()]
            seg["impr"] += imp
            seg["clicks"] += num(r["CTR"]) / 100.0 * imp   # reconstruct clicks from CTR
            seg["conv"] += num(r["Conversions (off-Amazon)"])
            cls = r["Audience segment class code"].strip() or "OTHER"
            seg["cls"] = cls
            d["clsmix"][cls] += imp
    return C


def ctr(v):
    return round(v["clicks"] / v["impr"] * 100, 3) if v["impr"] else 0


def top(dic, key, n, min_impr=0):
    items = [(k, v) for k, v in dic.items() if v["impr"] >= min_impr]
    items.sort(key=key, reverse=True)
    return items[:n]


def build(C):
    out = {}
    for name, d in C.items():
        impr = d["impr"]
        camps = [{"name": k, "impr": round(v["impr"]), "clicks": round(v["clicks"]),
                  "ctr": ctr(v), "conv": round(v["conv"])}
                 for k, v in sorted(d["campaigns"].items(), key=lambda x: -x[1]["impr"])]
        supply = [{"name": k, "impr": round(v["impr"]), "clicks": round(v["clicks"]),
                   "ctr": ctr(v), "share": round(v["impr"] / impr * 100, 1) if impr else 0}
                  for k, v in top(d["supply"], lambda x: x[1]["impr"], 8)]
        sites = [{"name": k, "impr": round(v["impr"]), "clicks": round(v["clicks"]), "ctr": ctr(v)}
                 for k, v in top(d["sites"], lambda x: x[1]["impr"], 10) if k]

        def seg_rows(items):
            return [{"name": k, "impr": round(v["impr"]), "ctr": ctr(v),
                     "conv": round(v["conv"]), "cls": v["cls"]} for k, v in items]

        seg_reach = seg_rows(top(d["segs"], lambda x: x[1]["impr"], 8))
        seg_ctr = seg_rows(top(d["segs"], lambda x: ctr(x[1]), 8, min_impr=2000))
        seg_conv = seg_rows([kv for kv in top(d["segs"], lambda x: x[1]["conv"], 6) if kv[1]["conv"] > 0])
        clsmix = [{"label": CLASS_LABEL.get(k, k), "impr": round(v)}
                  for k, v in sorted(d["clsmix"].items(), key=lambda x: -x[1])]

        out[name] = {
            "kpi": {"impr": round(impr), "clicks": round(d["clicks"]),
                    "ctr": round(d["clicks"] / impr * 100, 3) if impr else 0,
                    "conv": round(d["conv"]),
                    "segments": len(d["segs"]),
                    "sites": len([1 for k in d["sites"] if k])},
            "campaigns": camps, "supply": supply, "sites": sites,
            "seg_reach": seg_reach, "seg_ctr": seg_ctr, "seg_conv": seg_conv, "clsmix": clsmix,
        }
    order = sorted(out, key=lambda c: -out[c]["kpi"]["impr"])
    return {"period": "June 2026", "generated": "July 1, 2026", "order": order, "clients": out}


if __name__ == "__main__":
    if len(sys.argv) != 3:
        sys.exit("usage: python build_data.py INVENTORY.csv REPORT.csv > data/dsp-metrics.json")
    print(json.dumps(build(load(sys.argv[1], sys.argv[2])), indent=1))
