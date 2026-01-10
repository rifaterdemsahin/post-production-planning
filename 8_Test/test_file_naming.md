# Test: Artifact File Naming Convention

## Goal
Verify that all generated artifacts (images, audio, video) are automatically downloaded with filenames that strictly follow the project's naming convention.

## Naming Convention
The expected format is:
`[SceneTitle]_Line[LineID]_[Type]_[YYYY-MM-DD_HH-mm].[extension]`

**Examples:**
- `Intro_Scene_Line1_Image_2026-01-10_14-30.png`
- `Battle_Sequence_Line5_Audio_2026-01-10_14-35.mp3`
- `Ending_Credits_Line10_Video_2026-01-10_14-40.mp4`

## Prerequisites
1.  Access to `post_prod_artifact_plan.html`.
2.  A valid Google Gemini API Key.
3.  A specific folder designated for downloads (optional, otherwise check default Downloads folder).

## Test Steps

1.  **Launch the Application**: Open `post_prod_artifact_plan.html` in your browser.
2.  **Enter API Key**: Input your valid API key.
3.  **Generate Image**:
    -   Select a scene line.
    -   Choose the "🖼️ Image" content type.
    -   Click "Generate Artifact".
    -   Wait for completion and automatic download.
4.  **Generate Audio**:
    -   Select a scene line.
    -   Choose "🎵 Music" or "🔊 SFX".
    -   Click "Generate Artifact".
    -   Wait for completion and automatic download.
5.  **Generate Video** (if applicable):
    -   Select a scene line.
    -   Choose "🎬 Animation".
    -   Click "Generate Artifact".
    -   Wait for completion and automatic download.
6.  **Run Validation Script**:
    -   Open a terminal.
    -   Navigate to the `8_Test` directory.
    -   Run the validation script pointing to your downloads folder:
        ```bash
        node validate_filenames.js /path/to/your/downloads/folder
        ```

## Expected Results
-   The script should output `PASS` for each of the newly generated files.
-   If any filename format is incorrect, the script should output `FAIL` with the specific filename.

## Troubleshooting
-   **Script not found**: Ensure you are in the `8_Test` directory.
-   **No files checked**: Ensure the path provided to the script contains the downloaded files.
