# SmartBuilding AI

SmartBuilding AI is a full-stack hackathon project for intelligent building maintenance and smart service coordination.

## Overview
- Resident dashboard for utility monitoring and issue reporting
- Service provider dashboard for nearby request handling and job management
- AI-powered issue classification and priority estimation
- JWT-based authentication and SQLite-backed persistence

## Tech Stack
- Frontend: React + Vite
- Backend: Flask + Python
- Database: SQLite

## Run locally

### Backend
```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
python app.py
```

### Frontend
```bash
cd client
npm install
npm run dev -- --host 0.0.0.0 --port 4173
```

## Demo accounts
- Resident: harini@example.com / password123
- Provider: raj@example.com / password123

## Project structure
- `client/` - React frontend
- `backend/` - Flask backend and SQLite app

## License
This project is for demonstration and hackathon use.
