# SmartBuilding AI

SmartBuilding AI is a React/Vite application with a Flask/SQLite backend and a Capacitor Android shell. The Android app reuses the existing web UI and APIs; it does not replace the backend or business logic.

## Features

- Resident and service-provider accounts with JWT authentication
- Historical public water and electricity charts, separated from resident-specific readings
- Utility anomaly analysis based on recorded resident readings
- Issue classification, resident confirmation, location-aware requests, and provider matching
- Provider accept, dismiss, availability, and job status workflows
- Native Android location and local notifications through Capacitor

## Backend Setup

```powershell
cd backend
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env
python app.py
```

The backend listens on port `5000`. SQLite is stored in `backend/database/smartbuilding.db`. Set real, private `SECRET_KEY` and `JWT_SECRET_KEY` values outside development.

For a phone browser, include the computer-facing Vite origin in `FRONTEND_ORIGINS`, for example `http://192.168.1.20:5173`. For the Capacitor Android WebView, `https://localhost` is already allowed. Never expose Flask's development server directly to the public internet.

## Public Utility Data

Import the sourced historical datasets from the `backend` directory:

```powershell
.venv\Scripts\python.exe -m services.public_utility_data
```

The importer stores daily aggregates from UCI's [Individual Household Electric Power Consumption](https://archive.ics.uci.edu/dataset/235/individual+household+electric+power+consumption) dataset and annual per-capita figures from NYC DEP's [Water Consumption in the City of New York](https://data.cityofnewyork.us/Environment/Water-Consumption-in-the-New-York-City/ia2d-e54m) dataset. The UCI series is one household in Sceaux, France and is licensed CC BY 4.0. NYC Open Data lists the water dataset license as unspecified. Those geography, cadence, and license details are shown with the charts. This is historical public data, not live smart-meter data and not a proxy for the resident's home.

The UCI archive is approximately 127 MB; import it only when needed. `--electricity` and `--water` import one dataset at a time. Importing replaces that dataset's public-history records; it does not touch accounts, personal utility readings, or service requests.

## Web Frontend

```powershell
cd client
npm install
Copy-Item .env.example .env.local
npm run dev
```

By default the web frontend uses `http://localhost:5000/api`. Set `VITE_API_BASE_URL` in `client/.env.local` to override it. Vite binds to `0.0.0.0` so a phone on the same Wi-Fi can reach the frontend.

## Android Setup

Requirements: Android Studio, Android SDK platform/tools, and JDK 17 or 21. This project was verified with Temurin JDK 21; the installed Android Studio JDK 25 is not compatible with its Gradle 8.14.3 wrapper. The Capacitor project lives at `client/android/`.

For an Android emulator, `10.0.2.2` maps to the development computer:

```dotenv
VITE_API_BASE_URL=http://10.0.2.2:5000/api
```

For a physical Android phone on the same Wi-Fi, set `VITE_API_BASE_URL` to the computer's LAN address, such as `http://192.168.1.20:5000/api`, and allow the phone's Vite origin in backend `FRONTEND_ORIGINS`. The phone and computer must be on the same network, and the computer firewall must allow the configured ports. Rebuild/sync after changing Vite environment values.

```powershell
cd client
npm install
npm run android:sync
npm run android:open
```

In Android Studio, select a device and run the `app` configuration. To build a debug APK from PowerShell:

```powershell
cd client/android
$env:JAVA_HOME = 'C:\Path\To\JDK-21'
$env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"
$gradle = Join-Path (Get-Location) 'gradlew.bat'
& $gradle assembleDebug
```

The APK is written to `client/android/app/build/outputs/apk/debug/app-debug.apk`. Install it on a connected device with:

```powershell
adb install -r app/build/outputs/apk/debug/app-debug.apk
```

Use HTTPS for any deployed backend. Cleartext traffic is enabled in this development prototype so an Android device can reach a LAN Flask server; remove that allowance and use TLS before production distribution.

## End-to-End Checklist

1. Import the historical datasets and confirm each Insights/Overview chart shows its source, geography, cadence, and license.
2. Register a resident, sign in, enter actual utility measurements, and confirm personal metrics remain separate from public data.
3. Run issue analysis, review its category/priority, use the explicit current-location action, and submit a request.
4. Confirm nearby results use the request coordinates and expose no resident address before assignment.
5. Register a real provider with a service category and location; accept the request and update it through In Progress to Completed.
6. Confirm the resident sees status updates and alerts. On Android, allow local notifications and open Alerts to receive newly fetched unread alerts.
7. Repeat on a physical Android device with a LAN `VITE_API_BASE_URL`; verify location permission denial, GPS timeout, backend offline, and empty-data states.

## Limitations

- UCI electricity history is from one household in France; NYC water history is a city-wide per-capita series, not household water data. The sources are not comparable to one another or to the resident's location.
- NYC's publisher does not specify a dataset license; attribution is shown, but verify reuse terms before redistribution.
- Utility readings entered by residents are stored as personal records. Public history remains a separate dataset and does not create resident readings.
- Personal anomaly analysis waits for at least three readings and compares the newest reading with the resident's previous values; it does not infer a specific cause.
- Local notifications are scheduled when new unread server alerts are fetched in the Alerts screen. Push/background delivery requires a separate push service.
- Photos are stored as data URLs in SQLite and limited to 2 MB; production deployments should use managed object storage.
- Android emulator and browser builds can be tested locally; actual device location and notification behavior require an Android device or emulator with permissions enabled.