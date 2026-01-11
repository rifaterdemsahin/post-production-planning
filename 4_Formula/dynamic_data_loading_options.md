# Dynamic Data Loading Options (No Git Pull Required)

This document outlines options for loading project data (like `scenes.yaml`) dynamically at runtime, removing the need for users to pull the git repository to get content updates.

## 1. Google Drive (Direct Fetch)
**Concept:** Store the `scenes.yaml` file in a specific Google Drive folder. The application fetches the file content using the Google Drive API.

*   **Pros:**
    *   Leverages existing Google integration.
    *   Familiar interface for producers/editors.
    *   Permissions handled by Drive.
*   **Cons:**
    *   Requires Google Sign-In and appropriate OAuth scopes.
    *   Drive API can be slower than static file hosting.
*   **Implementation:**
    *   Use the existing `drive-modal` logic.
    *   Instead of just uploading, add a "Load from Drive" feature that looks for `scenes.yaml` in the configured folder ID.

## 2. Google Sheets (Published CSV/JSON)
**Concept:** Maintain the scenes data in a Google Sheet. Publish the sheet to the web as CSV or JSON and fetch that URL.

*   **Pros:**
    *   Extremely easy editing interface (spreadsheet).
    *   Real-time collaboration built-in.
    *   No manual "save/commit" step for the data source (auto-saves).
*   **Cons:**
    *   Structure is flat (rows/cols), might be harder to map to complex nested YAML structures (though `scenes` list is flat enough).
    *   Requires mapping logic (CSV columns -> Object properties).
*   **Implementation:**
    *   `File > Share > Publish to web`.
    *   Fetch the CSV URL.
    *   Parse CSV to JSON in `script.js`.

## 3. GitHub Raw URL / Gist
**Concept:** Keep the file in GitHub, but the app fetches the *Raw* URL directly (e.g., `https://raw.githubusercontent.com/...`).

*   **Pros:**
    *   Version control is maintained.
    *   Fast CDN delivery.
*   **Cons:**
    *   Caching issues (changes might take a few minutes to propagate).
    *   Requires the repo to be Public OR a Personal Access Token (PAT) for private repos (which is tricky to manage securely in a client-side app).
*   **Implementation:**
    *   Construct the raw URL based on the repo/branch config.
    *   `fetch(rawUrl)` on app load.

## 4. Cloud Storage (S3 / Google Cloud Storage)
**Concept:** Upload the YAML file to a public (or pre-signed) bucket.

*   **Pros:**
    *   Very fast.
    *   Decoupled from source code.
*   **Cons:**
    *   Requires an extra deployment step (uploading the file).
    *   CORS configuration needed.
*   **Implementation:**
    *   Configure a bucket with CORS enabled.
    *   Fetch the public URL.

## 5. Firebase Remote Config / Realtime Database
**Concept:** Use a dedicated backend-as-a-service to host the configuration.

*   **Pros:**
    *   True real-time updates (sockets).
    *   Robust SDKs.
*   **Cons:**
    *   Higher complexity to set up.
    *   Overkill for a simple file load.

---

## Recommendation
**Option 1 (Google Drive)** or **Option 2 (Google Sheets)** are the best fits for "Production Planning" workflows where non-technical users need to edit data without touching Git.
