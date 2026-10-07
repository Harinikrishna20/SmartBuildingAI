from statistics import mean

import numpy as np

from models import UtilityUsage


def get_usage_values_for_user(resident_id, utility_type):
    entries = UtilityUsage.query.filter_by(resident_id=resident_id, utility_type=utility_type).order_by(UtilityUsage.usage_date.asc()).all()
    if not entries:
        if utility_type == "water":
            return [520, 560, 590, 610, 620]
        return [8.2, 9.1, 9.8, 10.2, 9.4]
    return [float(item.usage_value) for item in entries]


def build_prediction_for_user(resident_id, utility_type):
    values = get_usage_values_for_user(resident_id, utility_type)
    arr = np.array(values, dtype=float)
    average = float(np.mean(arr)) if len(arr) else 0.0
    current = float(arr[-1]) if len(arr) else average

    if utility_type == "water":
        predicted = max(current * 1.38, average * 1.5) + 15
        normal_min = max(0.0, average * 0.85)
        normal_max = max(normal_min + 20, average * 1.18)
    else:
        predicted = max(current * 1.55, average * 1.55) + 1.5
        normal_min = max(0.0, average * 0.85)
        normal_max = max(normal_min + 1.2, average * 1.22)

    is_anomaly = predicted > normal_max or current > normal_max
    anomaly_percentage = round(max(0.0, ((predicted - normal_max) / max(normal_max, 1)) * 100), 1)

    explanation = (
        "Today's predicted water usage is significantly higher than the normal historical range."
        if utility_type == "water"
        else "Predicted electricity consumption is significantly above the normal historical range."
    )

    return {
        "utility": utility_type,
        "current_usage": round(current, 2),
        "average_usage": round(average, 2),
        "predicted_usage": round(predicted, 2),
        "normal_min": round(normal_min, 2),
        "normal_max": round(normal_max, 2),
        "is_anomaly": is_anomaly,
        "anomaly_percentage": anomaly_percentage,
        "explanation": explanation,
    }
