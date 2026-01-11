# 🛡️ Semblance Resolution Report

This document tracks recent errors documented in the `7_Semblance` folder and details their resolution status, related git commits, and verification steps (test cases).

## 1. 🎵 Audio/SFX Generation Issues

**Error Files**: `error_embed_music.md`, `error_missing_audio.md`
**Issue**: The Gemini API was originally being used for Sound Effect generation, but it is a Text-to-Speech (TTS) model. This resulted in it speaking the description of the sound rather than generating the sound itself, or returning empty audio data in some cases.
**Resolution**:
- Switched strategy: Gemini is strictly for TTS (Narration/Dialogue).
- Integrated **ElevenLabs API** for dedicated Sound Effect (SFX) generation.
- Added API Key management for ElevenLabs in the UI.
**Related Commits**:
- `a81cdfa` elevenlens keys
- `d981ca4` Integrating ElevenLabs Audio
**Test Cases (Verification)**:
1. **Setup**: Open "Actions" -> "API Keys" and enter a valid ElevenLabs API key.
2. **Action**: Select a line item with "SFX" type (or manually select "Sound Effect" generation).
3. **Execution**: Click "Generate Audio".
4. **Validation**: 
   - Check the Network tab to ensure a request is sent to `https://api.elevenlabs.io/v1/sound-generation`.
   - Verify the response contains valid audio data (blob).
   - Verify the audio plays a sound effect, not a spoken voice.

## 2. ⏳ Loading & Initialization Errors

**Error Files**: `error_loading.md`
**Issue**: Application frequently failed to load data on initial startup or required a hard refresh. Debugging was difficult due to lack of visibility into the state.
**Resolution**:
- Implemented `reloadApp` function to clear state and re-fetch `scenes.yaml` without full page reload.
- Enhanced debug logging with color-coded levels (INFO, ERROR, WARN).
- Added "Reload" (↻) and "Clear" buttons to the Debug Panel.
- Fixed CSS references for debug panel visibility (`translate-y-full`).
**Related Commits**:
- `277dcdc` loading fix
- `a00a74a` lading errir
**Test Cases (Verification)**:
1. **Setup**: Open the application.
2. **Action**: If the spinner hangs or data is missing, toggle the Debug Panel (Bottom Right).
3. **Execution**: Click the "Reload" (↻) button.
4. **Validation**:
   - Verify console logs "Reloading...".
   - Verify `scenes.yaml` is re-fetched (Network tab).
   - Verify the Scene Cards populate correctly after reload.

## 3. 📝 Text Length Constraints

**Error Files**: `error_sound_error_too_long.md`
**Issue**: The external API (ElevenLabs or Gemini) returned a **400 Bad Request** when the prompt text exceeded 450 characters (specifically received 633 characters in one instance).
**Resolution**:
- Implemented automatic truncation logic in `generateAudioContent` to ensure prompts are <= 450 characters.
- Added character count indicators and warnings in the user interface.
**Related Commits**:
- `255af49` constraints
- `28f9cc6` updates
**Test Cases (Verification)**:
1. **Setup**: Create a new Scene/Line with a very long description (> 500 chars).
2. **Action**: Click "Generate Audio".
3. **Validation**:
   - Inspect the outgoing API request payload.
   - **Pass Condition**: The `text` field in the payload is truncated to 450 characters or less.
   - **Pass Condition**: The API returns `200 OK` (or at least `400` is NOT due to length).
   - Verify the UI does not crash or show an unhandled exception.

## 4. 📂 File Upload Organization

**Error Files**: `wrong_foldername_upload.md`
**Issue**: Generated files were being uploaded to the root project folder in Google Drive instead of their specific Scene folders, creating disorganization.
**Resolution**:
- Enforced `uniqueId` checks to safely determine the target folder.
- The automation logic now creates `Scene [ID]` folders if they don't exist and places files there.
- Documented manual fix workflow for existing misplaced files.
**Related Commits**:
- `abe6bea` Update scenes.yaml (likely related to correct structure)
- `89fec8a` Update scenes.yaml via Gemini Scene Creator
**Test Cases (Verification)**:
1. **Setup**: Have a generated asset (Image/Audio/Video) ready.
2. **Action**: Click the "Upload to Drive" button on the asset card.
3. **Validation**:
   - Go to the Google Drive folder.
   - **Pass Condition**: A folder named `Scene X` (corresponding to the scene) exists.
   - **Pass Condition**: The file is inside that folder, not in the root.

## 5. 📺 Media Playback

**Error Files**: `error_mps_play.md`
**Issue**: Generic playback errors for media files, likely due to format incompatibility or incorrect path resolution for Drive-hosted files.
**Resolution**:
- Implemented Google Drive API-based playback (authenticated fetching).
- Enhanced Video and Audio preview modals to handle blobs and Drive URLs.
**Related Commits**:
- `e62e52d` play videos
- `2cb912a` embed works
**Test Cases (Verification)**:
1. **Setup**: Ensure the asset list contains a video or audio file hosted on Google Drive.
2. **Action**: Click the thumbnail/play button.
3. **Validation**:
   - The media modal opens.
   - The media buffers and plays successfully.
   - No "Format not supported" or 403 Forbidden errors in the console.
