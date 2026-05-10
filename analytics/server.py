"""
Trika GA4 Analytics Dashboard — Flask server

Reads data from the GA4 Data API and serves a simple dashboard.

Required environment variables:
  GA4_PROPERTY_ID              — numeric GA4 property ID (no "properties/" prefix)
  GOOGLE_APPLICATION_CREDENTIALS — path to service-account JSON key file
"""

import os
from flask import Flask, render_template, jsonify
from google.analytics.data_v1beta import BetaAnalyticsDataClient
from google.analytics.data_v1beta.types import (
    DateRange,
    Dimension,
    Filter,
    FilterExpression,
    Metric,
    OrderBy,
    RunReportRequest,
    StringFilter,
)

app = Flask(__name__)

PROPERTY_ID = os.environ.get('GA4_PROPERTY_ID', 'YOUR_PROPERTY_ID')


def _client():
    # Credentials are picked up automatically from GOOGLE_APPLICATION_CREDENTIALS
    return BetaAnalyticsDataClient()


def _run(request: RunReportRequest):
    return _client().run_report(request)


# ── Routes ────────────────────────────────────────────────────────────────────

@app.route('/')
def dashboard():
    return render_template('dashboard.html')


@app.route('/api/metrics')
def metrics():
    prop = f'properties/{PROPERTY_ID}'

    # --- Overview: sessions, pageviews, users (last 7 days) ---
    overview_resp = _run(RunReportRequest(
        property=prop,
        date_ranges=[DateRange(start_date='7daysAgo', end_date='today')],
        metrics=[
            Metric(name='sessions'),
            Metric(name='screenPageViews'),
            Metric(name='totalUsers'),
            Metric(name='bounceRate'),
        ],
    ))

    overview = {}
    if overview_resp.rows:
        mv = overview_resp.rows[0].metric_values
        overview = {
            'sessions':   int(mv[0].value),
            'pageviews':  int(mv[1].value),
            'users':      int(mv[2].value),
            'bounce_rate': round(float(mv[3].value) * 100, 1),
        }

    # --- Add-to-cart events by rod series (last 30 days) ---
    cart_resp = _run(RunReportRequest(
        property=prop,
        date_ranges=[DateRange(start_date='30daysAgo', end_date='today')],
        dimensions=[Dimension(name='customEvent:item_name')],
        metrics=[Metric(name='eventCount')],
        dimension_filter=FilterExpression(
            filter=Filter(
                field_name='eventName',
                string_filter=StringFilter(
                    value='add_to_cart',
                    match_type=StringFilter.MatchType.EXACT,
                ),
            )
        ),
        order_bys=[OrderBy(metric=OrderBy.MetricOrderBy(metric_name='eventCount'), desc=True)],
    ))

    cart_by_series = [
        {'series': row.dimension_values[0].value, 'count': int(row.metric_values[0].value)}
        for row in cart_resp.rows
    ]

    # --- Daily sessions trend (last 14 days) ---
    trend_resp = _run(RunReportRequest(
        property=prop,
        date_ranges=[DateRange(start_date='13daysAgo', end_date='today')],
        dimensions=[Dimension(name='date')],
        metrics=[Metric(name='sessions')],
        order_bys=[OrderBy(dimension=OrderBy.DimensionOrderBy(dimension_name='date'))],
    ))

    trend = [
        {'date': row.dimension_values[0].value, 'sessions': int(row.metric_values[0].value)}
        for row in trend_resp.rows
    ]

    # --- Top pages (last 7 days) ---
    pages_resp = _run(RunReportRequest(
        property=prop,
        date_ranges=[DateRange(start_date='7daysAgo', end_date='today')],
        dimensions=[Dimension(name='pagePath')],
        metrics=[Metric(name='screenPageViews')],
        order_bys=[OrderBy(metric=OrderBy.MetricOrderBy(metric_name='screenPageViews'), desc=True)],
        limit=5,
    ))

    top_pages = [
        {'path': row.dimension_values[0].value, 'views': int(row.metric_values[0].value)}
        for row in pages_resp.rows
    ]

    return jsonify({
        'overview':       overview,
        'cart_by_series': cart_by_series,
        'trend':          trend,
        'top_pages':      top_pages,
    })


if __name__ == '__main__':
    app.run(debug=True, port=5001)
