from models import ServiceRequest, UtilityUsage


def compute_health_score(resident_id):
    water_usage = UtilityUsage.query.filter_by(resident_id=resident_id, utility_type="water").all()
    power_usage = UtilityUsage.query.filter_by(resident_id=resident_id, utility_type="electricity").all()

    water_values = [entry.usage_value for entry in water_usage]
    power_values = [entry.usage_value for entry in power_usage]
    total_requests = ServiceRequest.query.filter_by(resident_id=resident_id).count()

    if water_values:
        water_efficiency = max(40, 100 - (max(water_values) - 500) * 0.4)
    else:
        water_efficiency = 82

    if power_values:
        energy_efficiency = max(45, 100 - (max(power_values) - 8) * 4)
    else:
        energy_efficiency = 88

    maintenance = max(60, 100 - total_requests * 5)
    anomaly_level = 78
    score = int((water_efficiency + energy_efficiency + maintenance + anomaly_level) / 4)

    return {
        "score": max(0, min(score, 100)),
        "water_efficiency": round(water_efficiency, 1),
        "energy_efficiency": round(energy_efficiency, 1),
        "maintenance": round(maintenance, 1),
        "anomaly_level": anomaly_level,
        "message": "Good building health with some utility anomalies requiring attention.",
    }
