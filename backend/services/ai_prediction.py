from statistics import median

import numpy as np

from models import UtilityUsage


def build_prediction_for_user(resident_id, utility_type):
    entries = UtilityUsage.query.filter_by(resident_id=resident_id, utility_type=utility_type).order_by(UtilityUsage.usage_date.asc()).all()
    values = [float(item.usage_value) for item in entries]
    history = [
        {"date": item.usage_date.isoformat(), "usage": float(item.usage_value)}
        for item in entries
    ]
    if not values:
        return {
            "utility": utility_type,
            "has_data": False,
            "has_prediction": False,
            "current_usage": None,
            "average_usage": None,
            "predicted_usage": None,
            "normal_min": None,
            "normal_max": None,
            "is_anomaly": False,
            "anomaly_percentage": None,
            "explanation": f"No recorded {utility_type} readings are available yet.",
            "history": [],
        }

    arr = np.array(values, dtype=float)
    average = float(np.mean(arr))
    current = float(arr[-1])
    if len(values) < 3:
        return {
            "utility": utility_type,
            "has_data": True,
            "has_prediction": False,
            "current_usage": round(current, 2),
            "average_usage": round(average, 2),
            "predicted_usage": None,
            "normal_min": None,
            "normal_max": None,
            "is_anomaly": False,
            "anomaly_percentage": None,
            "explanation": "At least three recorded readings are needed to establish a personal baseline.",
            "history": history,
        }

    baseline = values[:-1]
    predicted = median(baseline)
    median_deviation = median(abs(value - predicted) for value in baseline)
    tolerance = max(2.5 * 1.4826 * median_deviation, abs(predicted) * 0.2, 0.01)
    normal_min = max(0.0, predicted - tolerance)
    normal_max = predicted + tolerance

    is_anomaly = current < normal_min or current > normal_max
    if current > normal_max:
        anomaly_percentage = round(((current - normal_max) / max(normal_max, 1)) * 100, 1)
    elif current < normal_min:
        anomaly_percentage = round(((normal_min - current) / max(normal_min, 1)) * 100, 1)
    else:
        anomaly_percentage = 0.0

    utility_label = "water" if utility_type == "water" else "electricity"
    if current > normal_max:
        explanation = f"The latest recorded {utility_label} usage is above the range of your previous readings. This does not identify the cause."
    elif current < normal_min:
        explanation = f"The latest recorded {utility_label} usage is below the range of your previous readings."
    else:
        explanation = f"The latest recorded {utility_label} usage is within the range of your previous readings."

    return {
        "utility": utility_type,
        "has_data": True,
        "has_prediction": True,
        "current_usage": round(current, 2),
        "average_usage": round(average, 2),
        "predicted_usage": round(predicted, 2),
        "normal_min": round(normal_min, 2),
        "normal_max": round(normal_max, 2),
        "is_anomaly": is_anomaly,
        "anomaly_percentage": anomaly_percentage,
        "explanation": explanation,
        "history": history,
    }
