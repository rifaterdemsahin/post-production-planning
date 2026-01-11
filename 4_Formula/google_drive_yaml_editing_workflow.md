# Editing YAML Files in Google Drive

**Problem:** Google Drive does not have a native, built-in text editor for `.yaml` files. Clicking them usually opens a preview or asks to download them.

This document outlines the formulas (methods) to edit `scenes.yaml` directly in the cloud.

## Formula 1: The "Connected App" Method (Easiest for Users)
Google Drive allows third-party web apps to act as file editors.

1.  **Right-click** the `scenes.yaml` file in Google Drive.
2.  Select **Open with > Connect more apps**.
3.  Search for **"Text Editor"** (e.g., *Text Editor for Google Drive* by texteditor.co or similar).
4.  Install/Connect it.
5.  Now, you can double-click the YAML file, and it will open in that browser-based editor. Saving there updates the file in Drive directly.

## Formula 2: The "Google Colab" Method (Developer Friendly)
If you are already using Colab for generation, you can edit files there.

1.  Open a Colab notebook.
2.  Mount Drive:
    ```python
    from google.colab import drive
    drive.mount('/content/drive')
    ```
3.  Navigate to the file in the sidebar file explorer.
4.  Double-click `scenes.yaml`. An editor panel opens on the right.
5.  Edit and press `Ctrl+S` to save.

## Formula 3: The "Custom Dashboard Editor" Method (The Project Goal)
Since our application (`post_prod_artifact_plan.html`) already integrates with Google Services, the most seamless "Formula" is to build the editor into our own tool.

**Workflow:**
1.  **Auth:** User authorizes the app (Scopes: `https://www.googleapis.com/auth/drive.file`).
2.  **Load:** App uses the Drive API (`files.get` with `alt=media`) to fetch the current string content of `scenes.yaml`.
3.  **Edit:** Display this content in the existing "YAML Modal" (currently read-only) or a dedicated "Edit" tab.
4.  **Save:** App uses the Drive API (`files.update`) to send the modified string back to the same File ID.

**Technical Implementation Steps:**
*   Update `script.js` to handle the `update` API call.
*   Add a "Save to Drive" button in the YAML Modal.
*   Ensure the `drive-file-id` is stored in `localStorage` so the app knows which file to update.

---
**Recommendation:** For immediate quick edits, use **Formula 1**. For the long-term project vision, we should implement **Formula 3** to keep the user inside our ecosystem.
