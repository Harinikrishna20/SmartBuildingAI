from utils.location import distance_km

CATEGORY_LOOKUP = {
    "Plumbing": ["Plumber", "plumber"],
    "Electrical Issue": ["Electrician", "electrician"],
    "Appliance Repair": ["Appliance Repair", "appliance repair"],
    "Structural Damage": ["Carpenter", "carpenter"],
    "Other": ["General", "general"],
}


def service_category_match(request_category, provider_category):
    if not request_category or not provider_category:
        return False
    provider_norm = provider_category.lower()
    request_norm = request_category.lower()
    if request_norm in provider_norm or provider_norm in request_norm:
        return True
    lookup = CATEGORY_LOOKUP.get(request_category, [])
    return provider_norm in [item.lower() for item in lookup]


def score_provider_match(provider, request, resident):
    category_match = 1 if service_category_match(request.category, provider.service_category) else 0
    km = distance_km(resident.latitude, resident.longitude, provider.latitude, provider.longitude)

    availability_score = 25 if provider.availability == "Available" else 8
    distance_score = max(0, 35 - km * 10)
    category_score = 30 if category_match else 0
    workload_score = max(0, 15 - (provider.current_workload if hasattr(provider, "current_workload") else 0))

    total = int(category_score + distance_score + availability_score + workload_score)
    return {
        "id": provider.id,
        "name": provider.name,
        "service_category": provider.service_category,
        "distance_km": round(km, 2),
        "availability": provider.availability,
        "match_score": max(0, min(total, 99)),
    }
