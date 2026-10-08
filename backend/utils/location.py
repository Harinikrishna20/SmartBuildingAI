import math


EARTH_RADIUS_KM = 6371.0088


def distance_km(lat1, lon1, lat2, lon2):
    if lat1 is None or lon1 is None or lat2 is None or lon2 is None:
        return 9999.0
    try:
        lat1, lon1, lat2, lon2 = map(math.radians, (float(lat1), float(lon1), float(lat2), float(lon2)))
        delta_lat = lat2 - lat1
        delta_lon = lon2 - lon1
        haversine = math.sin(delta_lat / 2) ** 2 + math.cos(lat1) * math.cos(lat2) * math.sin(delta_lon / 2) ** 2
        return 2 * EARTH_RADIUS_KM * math.asin(math.sqrt(min(1.0, haversine)))
    except (TypeError, ValueError, OverflowError):
        return 9999.0
