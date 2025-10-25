# FitMate Backend

This is the backend API server for the FitMate outfit recommendation app.

## Features

- **AI Event Classification**: Uses Google's Gemini AI to classify events into style categories (sporty, casual, smart-casual, professional, formal)
- **Outfit Matching**: Matches clothing items from a mock wardrobe based on the classified style
- **RESTful API**: Simple POST endpoint for outfit recommendations

## Setup

1. Install dependencies:
```bash
npm install
```

2. Start the server:
```bash
npm start
```

The server will run on port 5001 by default.

## API Endpoints

### POST /api/outfit-for-event

Get outfit recommendations for a specific event.

**Request Body:**
```json
{
  "eventName": "Spring Formal"
}
```

**Response:**
```json
{
  "outfit": {
    "top": "White Button-Down",
    "pants": "Black Slacks"
  }
}
```

### GET /api/health

Health check endpoint.

**Response:**
```json
{
  "status": "OK",
  "message": "FitMate Backend is running"
}
```

## Mock Wardrobe

The server includes a hardcoded mock wardrobe with 6 items across different style categories:

- **Tops**: Red Hoodie, White Button-Down, Team Jersey
- **Pants**: Blue Jeans, Black Slacks, Running Shorts

Each item has tags for style classification (casual, sporty, smart-casual, professional, formal).
