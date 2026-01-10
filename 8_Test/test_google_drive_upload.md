# Test Case: Google Drive Artifact Upload

**Objective**: Verify that generated artifacts (images, audio) can be uploaded directly to a Google Drive folder.

## Pre-requisites

- The `post_prod_artifact_plan.html` file is open.
- You have an artifact generated (e.g., an image or audio clip visible in the UI).
- You have a Google Cloud Project with Drive API enabled and a Client ID.

## Test Steps

1. **Configure Drive**:
   - Only needed if not already set. The app uses `localStorage`.
   - If prompted during upload, enter your **Google Client ID**.
   - Ensure the Target Folder ID is correct.

2. **Trigger Upload**:
   - Locate a generated artifact in the UI.
   - Click the **☁️ Upload to Drive** button next to it.

3. **Authenticate**:
   - If not signed in, a Google Auth popup will appear.
   - Select your account and grant permission.

4. **Verify Upload**:
   - Watch the button text change to "Uploading..." then "✅ Uploaded!".
   - Go to the Google Drive folder.
   - Verify that a folder structure (Project -> Scene -> Artifact) has been created and the file exists.

## Expected Result

- The authentication flow proceeds smoothly.
- The file is uploaded to the correct nested folder path in Google Drive.
- The button provides visual feedback of success.

## Pass/Fail Criteria

- **PASS**: File appears in Google Drive in the correct location.
- **FAIL**: Auth popup blocked, API error (403/500), or file not found in Drive.
