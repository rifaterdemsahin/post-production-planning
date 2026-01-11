# GOOGLE_API_KEY

## Value
```
GOOGLE_API_KEY=your_api_key_here
```

## Description
The Google API Key authenticates requests to Google's APIs, primarily used for:
- **Google Sheets API** - Reading project data from the spreadsheet
- **Gemini AI API** - Generating content (images, text, prompts)

## How It's Used in This Project

### 1. Loading Data from Google Sheets
The API key is required to fetch data from the Google Sheets spreadsheet:

```javascript
// In script.js - buildSheetsApiUrl()
function buildSheetsApiUrl(range, apiKey) {
    const { spreadsheetId } = GOOGLE_SHEETS_CONFIG;
    return `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}?key=${apiKey}`;
}
```

### 2. Fetching Project Data
Used in `loadFromGoogleSheets()` to fetch:
- Project title from `Overview!B3`
- Main context from `Scenes Summary!B4`
- Scene/line data from `All Lines!A1:Z1000`

### 3. Gemini AI Content Generation
Used for generating:
- Image prompts
- Script regeneration
- Diagram generation
- HTML generation

## Where It's Stored
- **Browser Cookie**: `google_api_key`
- **localStorage**: `google_api_key`

```javascript
// Retrieved in script.js
function getSheetsApiKey() {
    return getCookie('google_api_key') || localStorage.getItem('google_api_key') || '';
}
```

## How to Get This Key

### Option A: Gemini API Key (Recommended)
1. Go to: https://aistudio.google.com/app/apikey
2. Click "Create API Key"
3. Copy the key

### Option B: Google Cloud Console
1. Go to: https://console.cloud.google.com/apis/credentials?project=gen-lang-client-0369583419
2. Click "Create Credentials" → "API Key"
3. Copy the key

## Required API Enablement
The key must have **Google Sheets API** enabled:
1. Go to: https://console.cloud.google.com/apis/library/sheets.googleapis.com?project=gen-lang-client-0369583419
2. Click "ENABLE"

## How to Add to the App
1. Open the app (`post_prod_artifact_plan.html`)
2. Click "⚙️ Actions" → "🔑 Manage API Keys"
3. Paste the API key in the "Google API Key" field
4. Click "Test Key" to verify

## Security Notes
- The key is stored locally in the browser only
- Never commit actual API keys to version control
- The key is only sent to Google's APIs, not to any other server
