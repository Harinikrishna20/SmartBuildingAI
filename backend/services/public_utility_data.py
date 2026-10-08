import argparse
import csv
import io
import json
import shutil
import tempfile
import zipfile
from collections import defaultdict
from datetime import date, datetime
from urllib.request import Request, urlopen

from app import create_app
from models import PublicUtilityUsage, db

UCI_DATASET_KEY = "uci_household_power_consumption"
UCI_SOURCE_URL = "https://archive.ics.uci.edu/static/public/235/individual+household+electric+power+consumption.zip"
NYC_DATASET_KEY = "nyc_water_consumption"
NYC_SOURCE_URL = "https://data.cityofnewyork.us/resource/ia2d-e54m.json?$limit=500"
NYC_DATASET_PAGE = "https://data.cityofnewyork.us/Environment/Water-Consumption-in-the-New-York-City/ia2d-e54m"
GALLONS_TO_LITERS = 3.785411784


def parse_uci_daily_usage(text_file):
    totals = defaultdict(float)
    counts = defaultdict(int)
    reader = csv.DictReader(text_file, delimiter=";")
    for row in reader:
        power = (row.get("Global_active_power") or "").strip()
        if not power or power == "?":
            continue
        try:
            usage_date = datetime.strptime(row["Date"], "%d/%m/%Y").date()
            kilowatts = float(power)
        except (KeyError, TypeError, ValueError):
            continue
        totals[usage_date] += kilowatts / 60
        counts[usage_date] += 1

    return [
        {"date": usage_date, "usage_value": round(total, 3), "observation_count": counts[usage_date]}
        for usage_date, total in sorted(totals.items())
    ]


def parse_nyc_water_rows(rows):
    parsed = []
    for row in rows:
        try:
            year = int(row["year"])
            gallons_per_person = float(row["per_capita_gallons_per_person_per_day"])
        except (KeyError, TypeError, ValueError):
            continue
        parsed.append({
            "date": date(year, 1, 1),
            "usage_value": round(gallons_per_person * GALLONS_TO_LITERS, 2),
            "observation_count": None,
        })
    return sorted(parsed, key=lambda row: row["date"])


def _download_request(url):
    return Request(url, headers={"User-Agent": "SmartBuildingAI/1.0 (historical public utility data importer)"})


def _replace_dataset(dataset_key, utility_type, unit, source_name, source_url, license_name, geographic_scope, granularity, rows):
    if not rows:
        raise ValueError(f"No valid rows were parsed for {dataset_key}.")
    PublicUtilityUsage.query.filter_by(dataset_key=dataset_key).delete(synchronize_session=False)
    db.session.add_all([
        PublicUtilityUsage(
            dataset_key=dataset_key,
            utility_type=utility_type,
            usage_date=row["date"],
            usage_value=row["usage_value"],
            unit=unit,
            source_name=source_name,
            source_url=source_url,
            license_name=license_name,
            geographic_scope=geographic_scope,
            granularity=granularity,
            observation_count=row["observation_count"],
        )
        for row in rows
    ])
    db.session.commit()
    return len(rows)


def import_uci_electricity():
    with tempfile.TemporaryFile() as download:
        with urlopen(_download_request(UCI_SOURCE_URL), timeout=90) as response:
            shutil.copyfileobj(response, download)
        download.seek(0)
        with zipfile.ZipFile(download) as archive:
            member = next(name for name in archive.namelist() if name.endswith("household_power_consumption.txt"))
            with archive.open(member) as source:
                text_file = io.TextIOWrapper(source, encoding="utf-8", errors="replace")
                rows = parse_uci_daily_usage(text_file)

    return _replace_dataset(
        UCI_DATASET_KEY,
        "electricity",
        "kWh/day",
        "Individual Household Electric Power Consumption (UCI)",
        "https://archive.ics.uci.edu/dataset/235/individual+household+electric+power+consumption",
        "CC BY 4.0",
        "One household, Sceaux, France",
        "daily",
        rows,
    )


def import_nyc_water():
    with urlopen(_download_request(NYC_SOURCE_URL), timeout=30) as response:
        rows = json.load(response)
    parsed = parse_nyc_water_rows(rows)
    return _replace_dataset(
        NYC_DATASET_KEY,
        "water",
        "L/person/day",
        "Water Consumption in the City of New York (NYC Open Data / DEP)",
        NYC_DATASET_PAGE,
        "Unspecified by publisher",
        "New York City, per capita",
        "annual",
        parsed,
    )


def main():
    parser = argparse.ArgumentParser(description="Import attributed public historical utility datasets into SQLite.")
    parser.add_argument("--electricity", action="store_true", help="Import the UCI household electricity dataset.")
    parser.add_argument("--water", action="store_true", help="Import the NYC Open Data water dataset.")
    args = parser.parse_args()
    import_electricity = args.electricity or not (args.electricity or args.water)
    import_water = args.water or not (args.electricity or args.water)

    with create_app().app_context():
        if import_electricity:
            print(f"Imported {import_uci_electricity()} daily electricity records.")
        if import_water:
            print(f"Imported {import_nyc_water()} annual water records.")


if __name__ == "__main__":
    main()