# Alternative Data Hosting: Where to hold your data?

**Problem:** You need a place to store your "Scenes" data where:
1.  **You can manually edit it easily** (no complex editors).
2.  **The LLM (Gemini) can help generate content** for it.
3.  **The App can load it dynamically** (without git commits).
4.  **Google Drive/Docs** is proving difficult for the specific "YAML" format or permissions.

Here are the best alternatives:

## Formula 1: Google Sheets (Recommended) 🏆
Instead of a YAML file, use a Spreadsheet.

*   **Why:** Everyone knows how to edit a spreadsheet. LLMs are *excellent* at generating tables that you can just copy-paste into Sheets.
*   **Workflow:**
    1.  **Setup:** Create a Google Sheet with columns: `Scene ID`, `Description`, `Visual Prompt`, `Audio Script`.
    2.  **LLM Generation:** Ask Gemini: *"Generate 5 scenes for a video about [Topic] in a table format with columns: ID, Description, Visual, Audio."*
    3.  **Manual Edit:** Copy the table from Gemini, paste it into Sheets. Edit cell content freely.
    4.  **Dynamic Load:**
        *   In Sheets: `File > Share > Publish to web`.
        *   Select "Comma-separated values (.csv)".
        *   Copy the URL.
        *   **App Update:** We update the app to read this CSV URL and convert it to the internal JSON format on the fly.

## Formula 2: GitHub Gist (The "Code Snippet" Way)
A Gist is a single file hosted by GitHub, but separate from a full repository.

*   **Why:** It keeps the data in `YAML` or `JSON` format (which is cleaner for nested data) but offers a simple web interface to edit.
*   **Workflow:**
    1.  **Setup:** Go to [gist.github.com](https://gist.github.com). Create a file named `scenes.yaml`.
    2.  **LLM Generation:** Ask Gemini to generate the YAML code.
    3.  **Manual Edit:** Click "Edit" on the Gist website, paste the code, or type changes. Update.
    4.  **Dynamic Load:** Click the "Raw" button on the Gist. Use that URL in the app.

## Formula 3: Notion Page (The "Doc" Way)
*   **Why:** Rich text editing, very user-friendly.
*   **Workflow:**
    1.  **Setup:** Create a Database (Table view) in Notion.
    2.  **LLM Generation:** Ask Gemini to generate the content, paste it in.
    3.  **Manual Edit:** Edit directly in Notion.
    4.  **Dynamic Load:** This is harder. You would need the Notion API (more complex setup) or export to CSV and host it somewhere. **Not recommended for dynamic loading unless you use a specialized "Notion to API" wrapper.**

---

## Recommendation: Switch to Google Sheets
If you want the easiest "Manual Edit" experience where the LLM can still help you, **Google Sheets** is the standard solution.

**Next Step if you choose Sheets:**
We would need to write a small "adapter" in your `script.js` to read CSV data and format it like the current `scenes.yaml` structure.
