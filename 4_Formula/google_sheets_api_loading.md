# Google Sheets API Loading Formula

## Overview

This document explains how the Post-Production Planning app loads data from Google Sheets API.

---

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           USER BROWSER                                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────┐    ┌──────────────────┐    ┌─────────────────────┐       │
│  │ 🔑 API Key   │───▶│ loadFromGoogle   │───▶│ transformSheetsTo   │       │
│  │ (cookie/     │    │ Sheets()         │    │ Data()              │       │
│  │  localStorage)│    └────────┬─────────┘    └──────────┬──────────┘       │
│  └──────────────┘              │                         │                  │
│                                ▼                         ▼                  │
│                    ┌───────────────────────┐   ┌─────────────────────┐     │
│                    │ 3 Parallel API Calls  │   │ App Data Structure  │     │
│                    │ via fetch()           │   │ {title, scenes[]}   │     │
│                    └───────────┬───────────┘   └──────────┬──────────┘     │
│                                │                          │                 │
└────────────────────────────────┼──────────────────────────┼─────────────────┘
                                 │                          │
                                 ▼                          ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        GOOGLE SHEETS API                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Spreadsheet ID: 19Oof1uMH-fh5Lt8_thltIoUOCufWbY0tY-gM88GEO30               │
│                                                                              │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐             │
│  │ Overview!B3     │  │ Overview!A1:B10 │  │ All Lines!      │             │
│  │ (Project Title) │  │ (Metadata)      │  │ A1:Z1000        │             │
│  └─────────────────┘  └─────────────────┘  │ (Scene Data)    │             │
│                                            └─────────────────┘             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## API URL Formula

```
BASE_URL = https://sheets.googleapis.com/v4/spreadsheets/{SPREADSHEET_ID}/values/{RANGE}?key={API_KEY}
```

### Components:

| Component | Value | Description |
|-----------|-------|-------------|
| `SPREADSHEET_ID` | `19Oof1uMH-fh5Lt8_thltIoUOCufWbY0tY-gM88GEO30` | Unique ID from Google Sheet URL |
| `RANGE` | `SheetName!CellRange` | e.g., `Overview!B3` or `All Lines!A1:Z1000` |
| `API_KEY` | User's Google API Key | Stored in browser cookie/localStorage |

### Example URLs:

```
# Project Title (single cell)
https://sheets.googleapis.com/v4/spreadsheets/19Oof1uMH-fh5Lt8_thltIoUOCufWbY0tY-gM88GEO30/values/Overview!B3?key=AIza...

# Metadata (range)
https://sheets.googleapis.com/v4/spreadsheets/19Oof1uMH-fh5Lt8_thltIoUOCufWbY0tY-gM88GEO30/values/Overview!A1:B10?key=AIza...

# All Lines Data (large range)
https://sheets.googleapis.com/v4/spreadsheets/19Oof1uMH-fh5Lt8_thltIoUOCufWbY0tY-gM88GEO30/values/All%20Lines!A1:Z1000?key=AIza...
```

---

## Data Transformation Formula

### Step 1: Raw API Response

Google Sheets API returns data in this format:

```json
{
  "range": "All Lines!A1:Z1000",
  "majorDimension": "ROWS",
  "values": [
    ["scene_id", "scenetitle", "line_id", "time", "script", ...],  // Row 1: Headers
    ["SCENE 1", "Introduction", "1", "0:00", "Welcome to...", ...], // Row 2: Data
    ["SCENE 1", "Introduction", "2", "0:15", "Today we...", ...],   // Row 3: Data
    ...
  ]
}
```

### Step 2: Header Normalization

```javascript
// Formula: Normalize headers to lowercase with underscores
headers = row[0].map(h => h.toLowerCase().trim().replace(/\s+/g, '_'))

// Example:
"Scene Title" → "scene_title"
"SceneID"     → "sceneid"
"Image Prompt" → "image_prompt"
```

### Step 3: Column Index Mapping

```javascript
// Formula: Create lookup object for column positions
colIndex = {}
headers.forEach((header, index) => {
    colIndex[header] = index
    colIndex[header.replace(/_/g, '')] = index  // Also map without underscores
})

// Example result:
colIndex = {
    "scene_id": 0,
    "sceneid": 0,
    "scenetitle": 1,
    "scene_title": 1,
    "line_id": 2,
    "lineid": 2,
    ...
}
```

### Step 4: Property Extraction Formula

```javascript
// Formula: Get value with fallback columns
value = row[colIndex['primary_column']] 
     || row[colIndex['alternate_column']] 
     || row[colIndex['another_alternate']] 
     || 'default_value'

// Example for scene title:
sceneTitle = row[colIndex['scenetitle']] 
          || row[colIndex['scene_title']] 
          || row[colIndex['scene_name']] 
          || row[colIndex['title']] 
          || 'Untitled Scene'
```

### Step 5: Scene Grouping Formula

```javascript
// Formula: Group rows by scene_id using Map
scenesMap = new Map()

dataRows.forEach(row => {
    sceneId = extractSceneId(row)
    
    if (!scenesMap.has(sceneId)) {
        // Create new scene entry
        scenesMap.set(sceneId, {
            id: sceneId,
            title: extractSceneTitle(row),
            lines: []
        })
    }
    
    // Add line to existing scene
    scenesMap.get(sceneId).lines.push(extractLineData(row))
})

// Convert Map to Array
scenes = Array.from(scenesMap.values())
```

---

## Column Mapping Reference

| App Property | Primary Column | Fallback Columns |
|--------------|----------------|------------------|
| `scene.id` | `scene_id` | `sceneid`, `scene` |
| `scene.title` | `scenetitle` | `scene_title`, `scene_name`, `title` |
| `line.id` | `line_id` | `id` |
| `line.time` | `time` | - |
| `line.script` | `script` | `line`, `text` |
| `prompts.image` | `image_prompt` | `image` |
| `prompts.graphic` | `graphic_prompt` | `graphic` |
| `prompts.music` | `music_prompt` | `music` |
| `prompts.animation` | `animation_prompt` | `animation` |
| `prompts.sound_effect` | `sound_effect_prompt` | `sound_effect` |
| `prompts.diagram` | `diagram_prompt` | `diagram` |
| `prompts.html` | `html_prompt` | `html` |

---

## Output Data Structure

```javascript
{
    title: "Project Title from Overview!B3",
    main_context: "From metadata",
    version: 1,
    last_updated: "2026-01-11T...",
    scenes: [
        {
            id: "SCENE 1",
            title: "Introduction",
            color: "border-l-4 border-blue-500",
            context: "Scene context...",
            verified_context: false,
            transition: "fade",
            verified_transition: false,
            lines: [
                {
                    id: "1",
                    time: "0:00",
                    script: "Welcome to our presentation...",
                    negative_prompt: "",
                    prompts: {
                        image: "A professional office setting...",
                        graphic: "",
                        music: "Corporate background music",
                        animation: "",
                        motion_graphics: "",
                        sound_effect: "",
                        diagram: "",
                        html: "",
                        prompt_outputs: {
                            image_output: "https://...",
                            // ... other outputs
                        }
                    },
                    verified_prompts: {
                        image: true,
                        graphic: false,
                        // ...
                    },
                    uploaded_assets: {}
                }
            ]
        }
    ]
}
```

---

## Error Handling Formula

```javascript
// Formula: Handle API errors gracefully
try {
    response = await fetch(url)
    
    if (!response.ok) {
        errorJson = await response.json()
        errorMessage = errorJson.error?.message || `HTTP ${response.status}`
        throw new Error(errorMessage)
    }
    
    data = await response.json()
    return processData(data)
    
} catch (error) {
    console.error("API Error:", error.message)
    showToast("❌ Failed to load: " + error.message)
    return null
}
```

---

## Key Setup Links

| Purpose | URL |
|---------|-----|
| Enable Sheets API | https://console.cloud.google.com/apis/library/sheets.googleapis.com?project=gen-lang-client-0369583419 |
| API Credentials | https://console.cloud.google.com/apis/credentials?project=gen-lang-client-0369583419 |
| Get Gemini API Key | https://aistudio.google.com/app/apikey |
| Your Spreadsheet | https://docs.google.com/spreadsheets/d/19Oof1uMH-fh5Lt8_thltIoUOCufWbY0tY-gM88GEO30 |

---

## Summary

1. **API Key** is retrieved from browser storage (cookie or localStorage)
2. **3 parallel API calls** fetch title, metadata, and scene data
3. **Headers are normalized** to lowercase with underscores
4. **Column index mapping** allows flexible column name matching
5. **Rows are grouped by scene_id** to create the scene structure
6. **Final data structure** matches the app's expected format
7. **Direct edit links** open Google Sheets at the exact cell for quick editing

---

## Direct Edit Links to Google Sheets

The app provides "📝" edit buttons that open Google Sheets directly at the specific cell for editing.

### URL Formula for Direct Cell Editing

```
BASE_URL = https://docs.google.com/spreadsheets/d/{SPREADSHEET_ID}/edit?gid={SHEET_GID}#gid={SHEET_GID}&range={COLUMN}{ROW}
```

### Components:

| Component | Value | Description |
|-----------|-------|-------------|
| `SPREADSHEET_ID` | `19Oof1uMH-fh5Lt8_thltIoUOCufWbY0tY-gM88GEO30` | Unique ID from Google Sheet URL |
| `SHEET_GID` | `864826077` | GID of the "All Lines" sheet tab |
| `COLUMN` | Letter (A-Z) | Column letter for the field being edited |
| `ROW` | Number | Row number = dataRowIndex + 2 (header row + 1-indexed) |

### Column Mapping Configuration

```javascript
columnMap: {
    script: 'E',              // Script/voiceover column
    image_prompt: 'H',        // Image prompt
    graphic_prompt: 'I',      // Graphic prompt  
    music_prompt: 'J',        // Music prompt
    animation_prompt: 'K',    // Animation prompt
    motion_graphics_prompt: 'L', // Motion graphics prompt
    sound_effect_prompt: 'M', // Sound effect prompt
    diagram_prompt: 'N',      // Diagram prompt
    html_prompt: 'O'          // HTML prompt
}
```

### Example URLs:

```
# Edit script for row 2 (first data row)
https://docs.google.com/spreadsheets/d/19Oof1uMH-fh5Lt8_thltIoUOCufWbY0tY-gM88GEO30/edit?gid=864826077#gid=864826077&range=E2

# Edit image_prompt for row 3 (second data row)
https://docs.google.com/spreadsheets/d/19Oof1uMH-fh5Lt8_thltIoUOCufWbY0tY-gM88GEO30/edit?gid=864826077#gid=864826077&range=H3

# Edit music_prompt for row 5
https://docs.google.com/spreadsheets/d/19Oof1uMH-fh5Lt8_thltIoUOCufWbY0tY-gM88GEO30/edit?gid=864826077#gid=864826077&range=J5
```

### Row Calculation Formula

```javascript
// Formula: Calculate Google Sheets row number from data index
sheetRowNumber = globalRowIndex + 2

// Why +2?
// Row 1: Header row (scene_id, scenetitle, line_id, ...)
// Row 2: First data row (index 0)
// Row 3: Second data row (index 1)
// etc.
```

### Global Row Index Calculation

Since lines are spread across scenes, the global row index is calculated as:

```javascript
// Formula: Count all lines in previous scenes + current line index
globalRowIndex = sum(lines in scenes 0..currentSceneIndex-1) + lineIndex

// Example:
// Scene 0 has 5 lines, Scene 1 has 3 lines
// Line 2 of Scene 1 = 5 + 2 = globalRowIndex 7
// Sheet row = 7 + 2 = 9
```
