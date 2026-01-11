# Formula: Converting YAML Data to Google Sheets & App Integration

This document outlines the formula for migrating your data from `scenes.yaml` to Google Sheets and updating the application to read from it dynamically.

## Part 1: Converting YAML to Google Sheets

Since your YAML structure is nested (Scenes -> Lines -> Prompts), we need to flatten it into a table structure that a Spreadsheet can handle.

### The Table Structure
Create a new Google Sheet with the following headers (columns):

| Scene ID | Scene Title | Scene Context | Line ID | Line Time | Script | Visual Prompt | Negative Prompt | Verified (Visual) | Uploaded Asset URL |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| SCENE 01 | The New Age | This scene introduces... | 1 | 0:00 | Alright, let's dive... | Cinematic medium shot... | blurry, low quality... | TRUE | https://drive... |
| SCENE 01 | The New Age | This scene introduces... | 2 | 0:04 | ...for, well, surviving... | A chaotic but artistic... | blurry, low quality... | FALSE | |

**Migration Steps:**
1.  **Manual Copy:** For now, manually copy the data from your `scenes.yaml` into this row-by-row format.
    *   *Note:* Repeate `Scene ID`, `Title`, and `Context` for every line belonging to that scene.
2.  **Publish to Web:**
    *   Go to `File > Share > Publish to web`.
    *   Select the specific Sheet (Tab).
    *   Choose **Comma-separated values (.csv)** as the format.
    *   Click **Publish** and copy the URL.

---

## Part 2: Code Changes Required

We need to modify the application to fetch this CSV and "re-inflate" it back into the nested JSON structure the app expects.

### 1. New Configuration
We need a place to store the CSV URL.
*   **Where:** `6_Symbols/script.js` (at the top with other constants) or in a config modal.
*   **Code:**
    ```javascript
    const DATA_SOURCE_URL = "https://docs.google.com/spreadsheets/d/e/.../pub?output=csv"; // Your CSV Link
    ```

### 2. CSV Parser Function
We need a helper to turn CSV text into an array of objects.
*   **Where:** `6_Symbols/script.js` (Helper functions section).
*   **Code:**
    ```javascript
    function parseCSV(csvText) {
        const rows = csvText.split('\n').map(row => row.split(',')); // Simplified splitter
        const headers = rows[0];
        // ... logic to map rows to objects ...
        return data;
    }
    ```

### 3. Data Transformation Logic
We need a function to convert the flat CSV rows back into the nested `scenes` object.
*   **Where:** `6_Symbols/script.js` (inside `loadYaml` or a new `loadData` function).
*   **Logic:**
    ```javascript
    const scenesMap = {};
    
    csvRows.forEach(row => {
        // Group by Scene ID
        if (!scenesMap[row.SceneID]) {
             scenesMap[row.SceneID] = { 
                 id: row.SceneID, 
                 title: row.SceneTitle, 
                 lines: [] 
             };
        }
        
        // Add Line to Scene
        scenesMap[row.SceneID].lines.push({
            id: row.LineID,
            script: row.Script,
            prompts: { image: row.VisualPrompt }
            // ... map other fields
        });
    });
    
    return Object.values(scenesMap);
    ```

### 4. Update the Load Function
Replace the current `fetch('scenes.yaml')` logic.
*   **Change:**
    *   **From:** `fetch('scenes.yaml').then(res => res.text()).then(yaml => jsyaml.load(yaml))`
    *   **To:** `fetch(DATA_SOURCE_URL).then(res => res.text()).then(csv => parseAndTransformCSV(csv))`

## Execution Plan
1.  **Create Sheet:** Set up the Google Sheet with the headers above.
2.  **Populate:** Copy one scene's worth of data to test.
3.  **Publish:** Get the CSV link.
4.  **Dev:** Update `script.js` to fetch that link and log the parsed object to console to verify the structure matches the old YAML structure.
5.  **Switch:** Once verified, point the main app render loop to use this new data source.

https://docs.google.com/spreadsheets/d/19Oof1uMH-fh5Lt8_thltIoUOCufWbY0tY-gM88GEO30/edit?usp=sharing