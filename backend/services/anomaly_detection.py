def assess_anomaly(utility_type, current_usage, average_usage, predicted_usage, normal_min, normal_max):
    is_anomaly = predicted_usage > normal_max or current_usage > normal_max
    anomaly_percentage = 0
    if normal_max:
        anomaly_percentage = round(max(0, ((predicted_usage - normal_max) / normal_max) * 100), 1)

    if utility_type == "water":
        message = (
            "Water consumption is unusually high. This may indicate a leakage or unusually high usage. "
            "Please check your water fixtures and report a problem if necessary."
        )
    else:
        message = (
            "Electricity consumption is significantly above the normal range. This may be caused by unusually high "
            "appliance usage or another electrical issue."
        )

    return {
        "utility": utility_type,
        "actual_usage": current_usage,
        "average_usage": average_usage,
        "predicted_usage": predicted_usage,
        "normal_min": normal_min,
        "normal_max": normal_max,
        "is_anomaly": is_anomaly,
        "anomaly_percentage": anomaly_percentage,
        "message": message,
    }
