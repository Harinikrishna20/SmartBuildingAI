from models import ServiceRequest, UtilityUsage
from services.ai_prediction import build_prediction_for_user


def compute_health_score(resident_id):
    water_usage = UtilityUsage.query.filter_by(resident_id=resident_id, utility_type="water").all()
    power_usage = UtilityUsage.query.filter_by(resident_id=resident_id, utility_type="electricity").all()

    active_requests = ServiceRequest.query.filter_by(resident_id=resident_id).filter(ServiceRequest.status != "Completed").count()
    water_prediction = build_prediction_for_user(resident_id, "water")
    power_prediction = build_prediction_for_user(resident_id, "electricity")
    has_utility_data = water_prediction["has_prediction"] and power_prediction["has_prediction"]
    water_efficiency = water_prediction["anomaly_percentage"] if water_prediction["has_prediction"] else None
    energy_efficiency = power_prediction["anomaly_percentage"] if power_prediction["has_prediction"] else None
    maintenance = max(0, 100 - active_requests * 20)
    if has_utility_data:
        anomaly_level = min(100, max(water_prediction["anomaly_percentage"], power_prediction["anomaly_percentage"]))
        score = int((max(0, 100 - water_efficiency) + max(0, 100 - energy_efficiency) + maintenance) / 3)
        message = "AI-assisted building health indicator based on personal readings and open requests; not a scientific certification."
    else:
        anomaly_level = None
        score = None
        message = "AI-assisted building health indicator: at least three water and electricity readings are needed for utility status."

    return {
        "score": max(0, min(score, 100)) if score is not None else None,
        "water_efficiency": round(water_efficiency, 1) if water_efficiency is not None else None,
        "energy_efficiency": round(energy_efficiency, 1) if energy_efficiency is not None else None,
        "water_status": ("Elevated" if water_prediction["is_anomaly"] else "Within range") if water_prediction["has_prediction"] else "Needs readings",
        "electricity_status": ("Elevated" if power_prediction["is_anomaly"] else "Within range") if power_prediction["has_prediction"] else "Needs readings",
        "maintenance_status": "Active requests" if active_requests else "Normal",
        "maintenance": round(maintenance, 1),
        "anomaly_level": anomaly_level,
        "message": message,
    }
