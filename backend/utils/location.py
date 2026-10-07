from geopy.distance import geodesic


def distance_km(lat1, lon1, lat2, lon2):
    if lat1 is None or lon1 is None or lat2 is None or lon2 is None:
        return 9999.0
    try:
        return geodesic((lat1, lon1), (lat2, lon2)).km
    except Exception:
        return 9999.0
