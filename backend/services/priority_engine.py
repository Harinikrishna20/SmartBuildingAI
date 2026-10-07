class PriorityEngine:
    @staticmethod
    def calculate_priority(issue_type=None, description=None, utility_anomaly=0, waiting_hours=0):
        score = 25
        description_text = (description or issue_type or "").lower()

        if issue_type in ["Electrical Issue", "Electrical Fault"]:
            score += 45
        elif issue_type in ["Water Leakage", "Plumbing"]:
            score += 35
        elif issue_type == "Structural Damage":
            score += 28
        elif issue_type == "Appliance Repair":
            score += 20

        if any(keyword in description_text for keyword in ["continuous", "burst", "overflow", "spark", "smell", "flood"]):
            score += 20
        elif any(keyword in description_text for keyword in ["slow", "drip", "minor", "intermittent"]):
            score += 10

        score += min(20, utility_anomaly)
        score += min(10, waiting_hours // 6)

        score = max(10, min(99, score))

        if score >= 90:
            level = "Critical"
        elif score >= 75:
            level = "High"
        elif score >= 45:
            level = "Medium"
        else:
            level = "Low"

        reason = "Issue seriousness, utility anomaly, and time delay suggest this should be addressed promptly."
        if issue_type == "Water Leakage":
            reason = "Continuous water leakage can cause property damage and water wastage."
        elif issue_type == "Electrical Fault":
            reason = "Electrical faults present safety and service disruption risk."
        elif issue_type == "Structural Damage":
            reason = "Structural concerns may affect safety and building integrity."

        return {
            "priority_score": int(score),
            "priority_level": level,
            "reason": reason,
        }
