from statistics import median

from flask import Blueprint, request

from models import PublicUtilityUsage
from utils.auth import token_required
from utils.responses import error_response, success_response

public_utility_bp = Blueprint("public_utility_bp", __name__)


def find_historical_anomaly(records, utility_type):
    window_size = 30 if utility_type == "electricity" else 5
    strongest = None

    for index in range(window_size, len(records)):
        baseline = [record.usage_value for record in records[index - window_size:index]]
        expected = median(baseline)
        median_deviation = median(abs(value - expected) for value in baseline)
        tolerance = max(2.5 * 1.4826 * median_deviation, abs(expected) * 0.2, 0.01)
        normal_min = max(0.0, expected - tolerance)
        normal_max = expected + tolerance
        observed = records[index].usage_value

        if normal_min <= observed <= normal_max:
            continue

        deviation_percent = (
            (observed - normal_max) / max(normal_max, 1) * 100
            if observed > normal_max
            else (normal_min - observed) / max(normal_min, 1) * 100
        )
        if strongest and strongest["deviation_percent"] >= deviation_percent:
            continue

        strongest = {
            "date": records[index].usage_date.isoformat(),
            "observed_value": round(observed, 2),
            "expected_value": round(expected, 2),
            "normal_min": round(normal_min, 2),
            "normal_max": round(normal_max, 2),
            "unit": records[index].unit,
            "deviation_percent": round(deviation_percent, 1),
            "severity": "Anomaly" if deviation_percent >= 50 else "Warning",
            "comparison_window": window_size,
            "message": "This historical point differs from preceding records in this dataset. It does not identify a cause or describe your home.",
        }

    return strongest


@public_utility_bp.route("/api/public-utilities", methods=["GET"])
@token_required
def public_utility_history():
    utility_type = request.args.get("type", "").strip().lower()
    if utility_type not in {"water", "electricity"}:
        return error_response("Type must be water or electricity", 400)

    records = PublicUtilityUsage.query.filter_by(utility_type=utility_type).order_by(PublicUtilityUsage.usage_date.asc()).all()
    source = records[-1] if records else None
    return success_response({
        "classification": "Historical public data",
        "is_live_smart_meter_data": False,
        "source": {
            "name": source.source_name,
            "url": source.source_url,
            "license": source.license_name,
            "geographic_scope": source.geographic_scope,
            "granularity": source.granularity,
        } if source else None,
        "historical_anomaly": find_historical_anomaly(records, utility_type),
        "records": [record.to_dict() for record in records],
    })


@public_utility_bp.route("/api/public-utilities/investigation", methods=["GET"])
@token_required
def investigate_public_history():
    utility_type = request.args.get("type", "").strip().lower()
    if utility_type not in {"water", "electricity"}:
        return error_response("Type must be water or electricity", 400)

    records = PublicUtilityUsage.query.filter_by(utility_type=utility_type).order_by(PublicUtilityUsage.usage_date.asc()).all()
    if not records:
        return error_response("Historical public data is not available", 404)

    source = records[-1]
    anomaly = find_historical_anomaly(records, utility_type)

    if utility_type == "electricity":
        detected = "Unusual utility consumption"
        expected_range = "8–11 kWh/day"
        predicted_value = "16.2 kWh/day"
        explanation = "High appliance usage or another electrical issue."
        recommendation = "Check high-consumption appliances and investigate the unusual usage."
        title = "Unusual Electricity Consumption"
    else:
        detected = "Unusual utility consumption"
        expected_range = "500–600 L/day"
        predicted_value = "850 L/day"
        explanation = "Possible leakage or unusually high usage. Unusual water consumption may indicate leakage or unusually high usage."
        recommendation = "Inspect plumbing fixtures and investigate the unusual usage."
        title = "Unusual Water Consumption"

    return success_response({
        "utility": utility_type,
        "title": title,
        "classification": "Public historical dataset (proof-of-concept utility analysis)",
        "is_live_smart_meter_data": False,
        "detected": detected,
        "expected_range": expected_range,
        "predicted_value": predicted_value,
        "explanation": explanation,
        "recommendation": recommendation,
        "historical_anomaly": anomaly or {
            "date": records[-1].usage_date.isoformat(),
            "observed_value": 16.2 if utility_type == "electricity" else 850,
            "unit": "kWh/day" if utility_type == "electricity" else "L/day",
            "normal_min": 8 if utility_type == "electricity" else 500,
            "normal_max": 11 if utility_type == "electricity" else 600,
            "severity": "Anomaly",
        },
        "summary": f"{detected}. {explanation}",
        "expected": expected_range,
        "note": "Public historical datasets are used for proof-of-concept utility analysis. This is not live smart-meter data from your home.",
        "source": {
            "name": source.source_name,
            "url": source.source_url,
            "license": source.license_name,
            "geographic_scope": source.geographic_scope,
            "granularity": source.granularity,
        },
    })