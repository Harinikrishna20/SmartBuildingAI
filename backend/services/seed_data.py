from models import User, db

DEMO_PASSWORD = "password123"

DEMO_PROVIDERS = [
    {
        "name": "Raj Kumar",
        "email": "raj@example.com",
        "phone": "9876543210",
        "role": "provider",
        "service_category": "Plumbing",
        "availability": "Available",
        "experience": 7,
        "location": "Bengaluru (Demo Provider)",
        "latitude": 12.6857,
        "longitude": 77.7208,
        "is_demo": True,
    },
    {
        "name": "Suresh Kumar",
        "email": "suresh@example.com",
        "phone": "9876543211",
        "role": "provider",
        "service_category": "Plumbing",
        "availability": "Available",
        "experience": 5,
        "location": "Bengaluru (Demo Provider)",
        "latitude": 12.6917,
        "longitude": 77.7258,
        "is_demo": True,
    },
    {
        "name": "Anil Kumar",
        "email": "anil@example.com",
        "phone": "9876543212",
        "role": "provider",
        "service_category": "Electrical",
        "availability": "Available",
        "experience": 6,
        "location": "Bengaluru (Demo Provider)",
        "latitude": 12.6877,
        "longitude": 77.7188,
        "is_demo": True,
    },
]

DEMO_RESIDENT = {
    "name": "Hari Krishna",
    "email": "hari@example.com",
    "phone": "9876543200",
    "role": "resident",
    "location": "Bengaluru",
    "latitude": 12.6827,
    "longitude": 77.7158,
    "is_demo": False,
}


def seed_demo_data():
    """Seed or update demo providers and resident in the database."""
    # Seed or update demo resident
    resident = User.query.filter_by(email=DEMO_RESIDENT["email"]).first()
    if not resident:
        resident = User(
            name=DEMO_RESIDENT["name"],
            email=DEMO_RESIDENT["email"],
            phone=DEMO_RESIDENT["phone"],
            role=DEMO_RESIDENT["role"],
            location=DEMO_RESIDENT["location"],
            latitude=DEMO_RESIDENT["latitude"],
            longitude=DEMO_RESIDENT["longitude"],
            is_demo=DEMO_RESIDENT["is_demo"],
        )
        resident.set_password(DEMO_PASSWORD)
        db.session.add(resident)
    else:
        resident.set_password(DEMO_PASSWORD)
        if resident.latitude is None:
            resident.latitude = DEMO_RESIDENT["latitude"]
        if resident.longitude is None:
            resident.longitude = DEMO_RESIDENT["longitude"]
        if not resident.location:
            resident.location = DEMO_RESIDENT["location"]

    # Seed or update demo providers
    for provider_spec in DEMO_PROVIDERS:
        provider = User.query.filter_by(email=provider_spec["email"]).first()
        if not provider:
            provider = User(
                name=provider_spec["name"],
                email=provider_spec["email"],
                phone=provider_spec["phone"],
                role=provider_spec["role"],
                service_category=provider_spec["service_category"],
                availability=provider_spec["availability"],
                experience=provider_spec["experience"],
                location=provider_spec["location"],
                latitude=provider_spec["latitude"],
                longitude=provider_spec["longitude"],
                is_demo=provider_spec["is_demo"],
            )
            provider.set_password(DEMO_PASSWORD)
            db.session.add(provider)
        else:
            provider.name = provider_spec["name"]
            provider.role = "provider"
            provider.service_category = provider_spec["service_category"]
            provider.availability = provider_spec["availability"]
            provider.experience = provider_spec["experience"]
            provider.is_demo = True
            provider.set_password(DEMO_PASSWORD)
            if provider.latitude is None:
                provider.latitude = provider_spec["latitude"]
            if provider.longitude is None:
                provider.longitude = provider_spec["longitude"]

    db.session.commit()

