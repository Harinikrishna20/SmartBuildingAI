from utils.location import distance_km

CATEGORY_LOOKUP = {
    "Plumbing": ["Plumber", "plumber", "Plumbing", "plumbing"],
    "Water Leakage": ["Plumber", "plumber", "Plumbing", "plumbing"],
    "Electrical Issue": ["Electrician", "electrician", "Electrical", "electrical"],
    "Electrical": ["Electrician", "electrician", "Electrical", "electrical"],
    "Electrician": ["Electrician", "electrician", "Electrical", "electrical"],
    "Appliance Repair": ["Appliance Repair", "appliance repair"],
    "Structural Damage": ["Carpenter", "carpenter"],
    "Other": ["General", "general"],
}


def service_category_match(request_category, provider_category):
    if not request_category or not provider_category:
        return False
    provider_norm = provider_category.lower().strip()
    request_norm = request_category.lower().strip()
    if request_norm == provider_norm or request_norm in provider_norm or provider_norm in request_norm:
        return True
    lookup = CATEGORY_LOOKUP.get(request_category, [])
    if provider_norm in [item.lower() for item in lookup]:
        return True
    for key, aliases in CATEGORY_LOOKUP.items():
        all_names = [key.lower()] + [a.lower() for a in aliases]
        if request_norm in all_names and provider_norm in all_names:
            return True
    return False


def score_provider_match(provider, request, resident):
    category_match = 1 if service_category_match(request.category, provider.service_category) else 0
    km = distance_km(resident.latitude, resident.longitude, provider.latitude, provider.longitude)

    availability_score = 25 if provider.availability == "Available" else 8
    distance_score = max(0, 35 - km * 10)
    category_score = 30 if category_match else 0
    workload_score = max(0, 15 - (provider.current_workload if hasattr(provider, "current_workload") else 0))

    total = int(category_score + distance_score + availability_score + workload_score)
    total = max(0, min(total, 99))
    service_display = "Plumber" if provider.service_category in ["Plumber", "Plumbing"] else "Electrician" if provider.service_category in ["Electrician", "Electrical"] else provider.service_category
    return {
        "provider_id": provider.id,
        "id": provider.id,
        "name": provider.name,
        "service": service_display,
        "service_category": provider.service_category,
        "distance_km": round(km, 2),
        "availability": provider.availability,
        "available": provider.availability == "Available",
        "match_score": total,
        "is_demo": bool(getattr(provider, "is_demo", False)),
        "demo_label": "Demo provider" if getattr(provider, "is_demo", False) else None,
    }
