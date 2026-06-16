# BigQuery Release Notes Monitor

A modern, responsive web dashboard built with Python Flask and vanilla HTML, CSS, and JavaScript. This application fetches, caches, parses, and formats the Google Cloud BigQuery Release Notes RSS feed, allowing you to easily browse updates and share them on Twitter/X.

## 🚀 Features

- **Dynamic XML Feed Parsing:** Fetches the BigQuery Atom feed and automatically splits daily entries into individual, clean update cards.
- **Resilient 1-Hour Caching:** Saves the XML locally to speed up page loads and prevent rate-limiting, with automatic fallback to expired cache if the internet is down.
- **Advanced Filtering & Searching:** Real-time search indexing and dynamic category filter pills (Features, Fixes, Issues, Announcements) alongside sorting.
- **Tweet Composer Modal:** Click "Tweet" on any card to open a custom, native `<dialog>` composer. It features a character limit checker (280 characters) and a live post card preview.
- **Clean Space Aesthetics:** Modern, responsive dark-themed dashboard incorporating glassmorphic UI elements and shimmer loading skeletons.

---

## 🛠️ Project Structure

```text
├── app.py                  # Python Flask server & XML parsing engine
├── templates/
│   └── index.html          # HTML5 SPA structure & dialog composer markup
├── static/
│   ├── css/
│   │   └── style.css       # HSL theme system, glassmorphic styles, & animations
│   └── js/
│       └── main.js         # API binder, filter state machine, & tweet handler
├── .gitignore              # Ignores local environments, pycache, & cache XML
└── README.md               # Project guide and instructions
```

---

## 💻 Getting Started

### Prerequisites

Ensure you have Python 3.8+ installed on your system.

### Setup and Installation

1. **Clone/Open the project directory:**
   ```bash
   cd bq-releases-notes
   ```

2. **Set up a Python Virtual Environment:**
   ```bash
   python3 -m venv .venv
   source .venv/bin/activate  # On Windows: .venv\Scripts\activate
   ```

3. **Install Dependencies:**
   ```bash
   pip install flask requests
   ```

4. **Run the Application:**
   ```bash
   python3 app.py
   ```

5. **Open in browser:**
   Go to [http://127.0.0.1:5001](http://127.0.0.1:5001) in your browser.

---

## 📡 API Reference

### Get Release Notes

Returns the list of parsed, individual release note items.

- **URL:** `/api/release-notes`
- **Method:** `GET`
- **URL Parameters:** 
  - `refresh=true` *(optional)*: Bypasses the local XML cache and forces a fresh request to Google Cloud.
- **Success Response Code:** `200 OK`
- **Sample JSON Output:**
  ```json
  {
    "success": true,
    "last_updated": "2026-06-16 12:43:40",
    "types": ["Announcement", "Breaking", "Change", "Feature", "Issue"],
    "updates": [
      {
        "id": "2026-06-15-feature-905453123",
        "date": "June 15, 2026",
        "short_date": "2026-06-15",
        "type": "Feature",
        "content": "<p>Use Gemini Cloud Assist to analyze your SQL queries...</p>",
        "link": "https://docs.cloud.google.com/bigquery/docs/release-notes#June_15_2026"
      }
    ]
  }
  ```
