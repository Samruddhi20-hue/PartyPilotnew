
# PartyPilot

PartyPilot is a customer-side event venue discovery and planning platform.

It helps customers discover venues for corporate events and celebrations, compare options, shortlist favourites, estimate event budgets and submit enquiries.

## Features

- Venue discovery by location
- Guest capacity and category filters
- Venue details and ratings
- Google Places integration
- Venue shortlisting
- Venue comparison
- Event budget calculator
- Customer enquiry submission
- Responsive frontend

## Technology Stack

Frontend:
- HTML
- CSS
- JavaScript

Backend:
- Python
- Flask
- Flask-SQLAlchemy
- Flask-Migrate

Database:
- SQLite for local development
- Supabase planned for later integration

External services:
- Google Places API (New) for nearby discovery, business-name search and venue details
- Geoapify for location geocoding/autocomplete only

## Project Structure

```text
PARTYPILOT/
├── app/
│   ├── models/
│   ├── routes/
│   ├── services/
│   ├── static/
│   ├── templates/
│   ├── config.py
│   ├── extensions.py
│   └── __init__.py
├── tests/
├── instance/
├── migrations/
├── .env
├── .env.example
├── .gitignore
├── requirements.txt
└── run.py
```

## Local Setup

### 1. Clone the repository

```bash
git clone YOUR_REPOSITORY_URL
cd PARTYPILOT
```

### 2. Create a virtual environment

```bash
python -m venv venv
```

### 3. Activate the environment

Windows PowerShell:

```powershell
.\venv\Scripts\Activate.ps1
```

### 4. Install dependencies

```bash
pip install -r requirements.txt
```

### 5. Configure environment variables

Create a `.env` file in the project root.

Copy the contents of `.env.example` and add your own private credentials.

### 6. Run the application

```bash
python run.py
```

Open:

http://127.0.0.1:5000

## Run Tests

```bash
python -m pytest -v
```

## Render Deployment

- Build command: `pip install -r requirements.txt`
- Start command: `gunicorn --bind 0.0.0.0:$PORT run:app`
- Add all API keys, `SECRET_KEY`, and `DATABASE_URL` in Render Environment.
- Do not upload `.env`, virtual environments, caches, or local database files to GitHub.

## API Endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| GET | /health | Application health |
| GET | /api/venues | Discover venues |
| GET | /api/locations | Location suggestions |
| GET | /api/venues/{venue_id} | Venue details |
| GET | /api/favourites | List favourites |
| POST | /api/favourites | Add favourite |
| DELETE | /api/favourites/{id} | Remove favourite |
| POST | /api/enquiries | Submit enquiry |
| GET | /api/enquiries/{id} | Get enquiry |

## Development Notes

- Demo venue records are illustrative and are not verified businesses.
- Google Places API (New) is used for business-name search and place details when GOOGLE_PLACES_API_KEY is configured. Google API usage is subject to the project's billing, quotas, field-level pricing and Google Maps Platform terms.
- Google Places is the sole venue search and details provider. No TomTom fallback is used.
- Geoapify is retained only for location geocoding/autocomplete; it does not supply venue listings.
- Configure GOOGLE_PLACES_API_KEY, GEOAPIFY_API_KEY (for geocoding), SECRET_KEY and DATABASE_URL as environment variables locally and on Render. Never commit .env.
- The Google demo key is for prototyping and has usage limitations; use an appropriately configured production key for public deployment.
- Authentication and production security must be completed before public launch.

## License

All rights reserved unless a separate license is added.
