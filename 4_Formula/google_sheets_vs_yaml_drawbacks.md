# Formula: The Downsides of Switching from YAML to Google Sheets

While Google Sheets offers easier editing for non-developers, replacing a structured `YAML` file with a flat Spreadsheet introduces several technical and workflow drawbacks.

## 1. Loss of Data Structure (The "Flattening" Problem)
*   **YAML** is designed for **nested** data.
    *   *Example:* A `Scene` has `Lines`. A `Line` has `Prompts`. A `Prompt` has `Outputs`.
*   **Sheets** is **flat** (2D rows and columns).
*   **The Downside:** To represent nested data in Sheets, you have to duplicate data (repeating the "Scene Name" for every single line) or create complex multi-table relational logic. This makes the data **harder to read** and **harder to parse** programmatically.

## 2. Weak Version Control
*   **YAML (in Git):** Every change is tracked line-by-line. You can see exactly *who* changed *what* word in a prompt and *when*. You can revert to the version from 10 minutes ago or 10 days ago.
*   **Sheets:** Has "Version History," but it is not connected to your code. You cannot tag a specific version of the Sheet to a specific version of your code release. If someone breaks the sheet, the live app breaks immediately.

## 3. Data Integrity & Schema Validation
*   **YAML:** We can run a "Validator" script that screams if a required field like `id` is missing or if `time` is in the wrong format.
*   **Sheets:** It's just text cells. A user can accidentally type "0:04" in one row and "4 seconds" in the next. They might delete a critical column header. There is no automatic guardrail to prevent "breaking changes" from being published.

## 4. Offline & Latency Dependencies
*   **YAML:** Local file. Loads instantly (0ms latency). Works without internet.
*   **Sheets:** Requires an HTTP request to Google's servers.
    *   **Latency:** Adds 0.5s - 1s to the app load time.
    *   **Offline:** The app will **not work** if the user has no internet connection or if Google Drive is down.

## 5. Development Friction
*   **YAML:** You edit the file, hit save, and the app reloads instantly (hot reload).
*   **Sheets:** You edit a cell, wait for Google to auto-save (seconds), wait for the "Publish to Web" cache to update (can take up to 5 minutes!), and *then* reload the app. The feedback loop is much slower.

---

## Summary Decision Matrix

| Feature | YAML (Current) | Google Sheets (Proposed) |
| :--- | :--- | :--- |
| **Editing** | Harder (Code Editor) | **Easiest (Excel-like)** |
| **Structure** | **Excellent (Nested)** | Poor (Flat) |
| **History** | **Perfect (Git)** | Okay (Drive History) |
| **Speed** | **Instant** | Slow (Network fetch) |
| **Safety** | **High (Validation)** | Low (User error prone) |

**Conclusion:** Switch to Sheets *only* if the **non-technical editing convenience** outweighs the risks of **instability and slower development**.
