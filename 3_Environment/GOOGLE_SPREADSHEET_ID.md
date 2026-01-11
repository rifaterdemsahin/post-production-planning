# GOOGLE_SPREADSHEET_ID

## Value
```
GOOGLE_SPREADSHEET_ID=19Oof1uMH-fh5Lt8_thltIoUOCufWbY0tY-gM88GEO30
```

## Description
The unique identifier for the Google Sheets spreadsheet that serves as the **single source of truth** for all project data. This ID is extracted from the spreadsheet URL.

## How to Find the Spreadsheet ID
From any Google Sheets URL:
```
https://docs.google.com/spreadsheets/d/19Oof1uMH-fh5Lt8_thltIoUOCufWbY0tY-gM88GEO30/edit#gid=0
                                      └──────────────────────────────────────────────┘
                                                    This is the Spreadsheet ID
```

## How It's Used in This Project

### 1. Configuration in script.js
```javascript
const GOOGLE_SHEETS_CONFIG = {
    spreadsheetId: '19Oof1uMH-fh5Lt8_thltIoUOCufWbY0tY-gM88GEO30',
    // ...
};
```

### 2. Building API URLs
```javascript
function buildSheetsApiUrl(range, apiKey) {
    const { spreadsheetId } = GOOGLE_SHEETS_CONFIG;
    return `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?key=${apiKey}`;
}
```

### 3. Direct Edit Links
Used to build URLs that open Google Sheets at specific cells:
```javascript
function buildSheetsEditUrl(promptType, rowIndex) {
    const { spreadsheetId, sheets, columnMap } = GOOGLE_SHEETS_CONFIG;
    return `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit?gid=${gid}#gid=${gid}&range=${column}${row}`;
}
```

## Spreadsheet Structure

The spreadsheet has these sheets (tabs):

| Sheet Name | GID | Purpose |
|------------|-----|---------|
| Overview | 0 | Project title (B3), metadata |
| Scenes Summary | 440551049 | Main project context (B4) |
| All Lines | 864826077 | All scene/line data with prompts |
| Uploaded Assets | - | Asset tracking |

### Data Fetched from Spreadsheet

| Data | Cell/Range | Sheet |
|------|------------|-------|
| Project Title | B3 | Overview |
| Main Context | B4 | Scenes Summary |
| Scene/Line Data | A1:Z1000 | All Lines |

## Required Columns in "All Lines" Sheet

Row 1 must contain these headers:
- `scene_id` - Scene identifier
- `scenetitle` - Scene title
- `line_id` - Line identifier
- `time` - Duration
- `script` - Voiceover text
- `image_prompt`, `graphic_prompt`, `music_prompt`, etc.

## Spreadsheet Access Requirements

The spreadsheet must be shared publicly:
1. Open the spreadsheet
2. Click "Share" (top right)
3. Under "General access", change to "Anyone with the link"
4. Set permission to "Viewer"
5. Click "Done"

## Direct Links

| Purpose | URL |
|---------|-----|
| Full Spreadsheet | https://docs.google.com/spreadsheets/d/19Oof1uMH-fh5Lt8_thltIoUOCufWbY0tY-gM88GEO30 |
| Overview Sheet | https://docs.google.com/spreadsheets/d/19Oof1uMH-fh5Lt8_thltIoUOCufWbY0tY-gM88GEO30/edit?gid=0 |
| Scenes Summary | https://docs.google.com/spreadsheets/d/19Oof1uMH-fh5Lt8_thltIoUOCufWbY0tY-gM88GEO30/edit?gid=440551049 |
| All Lines | https://docs.google.com/spreadsheets/d/19Oof1uMH-fh5Lt8_thltIoUOCufWbY0tY-gM88GEO30/edit?gid=864826077 |

## Changing to a Different Spreadsheet

To use a different spreadsheet:
1. Create a new Google Sheet with the required structure
2. Update `GOOGLE_SHEETS_CONFIG.spreadsheetId` in `script.js`
3. Update the sheet GIDs in `GOOGLE_SHEETS_CONFIG.sheets`
4. Ensure the new spreadsheet is shared publicly
