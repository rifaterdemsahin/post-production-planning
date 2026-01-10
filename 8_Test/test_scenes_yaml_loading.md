# Test Case: Scenes YAML Loading

**Objective**: Verify that the application correctly loads, parses, and renders data from `scenes.yaml`, and handles errors gracefully.

## Pre-requisites

- The `post_prod_artifact_plan.html` file is being served via a local web server (because of CORS restrictions on `fetch`).
- `scenes.yaml` exists in the same directory.

## Test Steps

### 1. Happy Path: Successful Load
1.  **Start Server**: Run `python3 -m http.server` in `6_Symbols/`.
2.  **Open App**: Navigate to `http://localhost:8000/post_prod_artifact_plan.html`.
3.  **Observe**:
    - The "Scene" cards should appear instantly or after a brief load.
    - Check the first scene title is "The New Age".
    - Check the first prompt contains "Cinematic medium shot".

### 2. Error Case: Missing File
1.  **Rename File**: Temporarily rename `scenes.yaml` to `scenes.yaml.bak`.
2.  **Refresh App**: Reload the page.
3.  **Observe error**:
    - The UI should display a red error box.
    - Message should likely say "HTTP error! status: 404".

### 3. Error Case: Invalid YAML
1.  **Restore File**: Rename `scenes.yaml.bak` back to `scenes.yaml`.
2.  **Corrupt File**: Edit `scenes.yaml` and add a syntax error (e.g., remove a colon key separator or add random text at the top).
    ```yaml
    scenes
      - id "BROKEN"
    ```
3.  **Refresh App**: Reload the page.
4.  **Observe error**:
    - The UI should display a red error box.
    - Message should mention a parsing error (e.g., from `js-yaml`).

### 4. CSV Download
1.  **Click Download**: Click the "📥 Download CSV Plan" button.
2.  **Verify**:
    - A file named `nanabanana_prompts.csv` is downloaded.
    - Open it and verify the content matches the YAML data.

## Expected Result

- **Success**: Scenes render with correct styling (Blue/Green/Orange/Red borders). Generative buttons are visible.
- **Failure**: Clear, user-friendly error messages are shown when data cannot be loaded.

## Pass/Fail Criteria

- **PASS**: All steps behave as described.
- **FAIL**: App hangs, shows blank screen, or console errors appear without UI feedback.
