import re


class IssueClassifier:
    CATEGORY_KEYWORDS = {
        "Plumbing": [
            "leak", "leaking", "pipe", "sink", "toilet", "drain", "water", "plumbing",
            "faucet", "sewer", "tap", "bathroom"
        ],
        "Electrical Issue": [
            "light", "switch", "socket", "power", "electric", "wiring", "circuit", "short",
            "breaker", "fan", "outlet", "sparking", "electrical"
        ],
        "Appliance Repair": [
            "ac", "air conditioner", "fridge", "refrigerator", "washing machine", "dryer",
            "microwave", "appliance", "oven", "dishwasher"
        ],
        "Structural Damage": [
            "wall", "ceiling", "crack", "roof", "window", "door", "structural", "damage"
        ],
        "Water Leakage": [
            "water leak", "leaking water", "water damage", "overflow", "pipe burst", "dripping"
        ],
    }

    SEVERITY_KEYWORDS = {
        "high": ["continuous", "burst", "major", "overflow", "sparking", "smell", "flood"],
        "medium": ["slow", "minor", "leak", "dripping", "weak", "intermittent"],
        "low": ["noisy", "small", "slight", "minor issue"]
    }

    @classmethod
    def detect_category(cls, description):
        text = (description or "").lower()
        scores = {}
        for category, keywords in cls.CATEGORY_KEYWORDS.items():
            score = sum(1 for keyword in keywords if keyword in text)
            if score:
                scores[category] = score
        if not scores:
            return "Other", "Other"
        top_category = max(scores, key=scores.get)
        if top_category == "Plumbing":
            issue = "Water Leakage" if "leak" in text or "drip" in text else "Plumbing"
        elif top_category == "Electrical Issue":
            issue = "Electrical Fault" if any(x in text for x in ["spark", "power", "short", "smell"]) else "Electrical Issue"
        elif top_category == "Appliance Repair":
            issue = "Appliance Repair"
        elif top_category == "Structural Damage":
            issue = "Structural Damage"
        else:
            issue = "Other"
        return top_category, issue

    @classmethod
    def classify_issue(cls, description):
        category, issue = cls.detect_category(description)
        text = (description or "").lower()
        severity = "low"
        if any(word in text for word in cls.SEVERITY_KEYWORDS["high"]):
            severity = "high"
        elif any(word in text for word in cls.SEVERITY_KEYWORDS["medium"]):
            severity = "medium"

        score_map = {"low": 25, "medium": 52, "high": 87}
        score = score_map.get(severity, 35)
        if category == "Electrical Issue":
            score = max(score, 92)
        if category == "Structural Damage":
            score = max(score, 72)

        reason = cls._reason(category, issue, severity)
        return {
            "suggested_category": category,
            "possible_issue": issue,
            "priority_score": score,
            "priority_level": cls._level(score),
            "reason": reason,
        }

    @staticmethod
    def _reason(category, issue, severity):
        if category == "Plumbing":
            return "The description matches plumbing-related terms. Confirm the affected fixture and severity during inspection."
        if category == "Electrical Issue":
            return "The description matches electrical-related terms. Treat exposed wiring, sparks, or burning smells as urgent safety concerns."
        if category == "Appliance Repair":
            return "The description matches appliance-related terms. A technician should confirm the cause."
        if category == "Structural Damage":
            return "The description matches structural-damage terms. A qualified inspection is needed to assess risk."
        return "The description could not be confidently categorized. Review the issue details before assigning a provider."

    @staticmethod
    def _level(score):
        if score >= 85:
            return "High"
        if score >= 60:
            return "Medium"
        if score >= 35:
            return "Low"
        return "Low"
