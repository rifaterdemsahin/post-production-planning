# 🌊 Post-Production Workflow Flow

Understanding the path of data is crucial to avoiding errors.

## 1. 🎬 Conception (Human)

- **Input**: Scripts, basic ideas, director's notes.
- **Action**: Writing the `scenes.yaml` file.
- **Tools**: [Scenes YAML](file:///Users/rifaterdemsahin/projects/post-production-planning/6_Symbols/scenes.yaml)

## 2. 🤖 Generation (AI)

- **Input**: The initialized dashboard loading the YAML.
- **Action**: Generating images, audio, and video assets using Gemini & Veo.
- **Output**: Temporary artifacts in the browser.

## 3. ☁️ Storage (Cloud)

- **Action**: Uploading artifacts to Google Drive.
- **Structure**: `Project -> Scene -> Asset`
- **Verification**: Ensuring files land in the *specific* scene folder, not the root.

## 4. 🎞️ Assembly (Editor)

- **Input**: Assets from Drive.
- **Action**: Final editing in Premiere/Resolve.
- **Result**: The final polished video.

---

> [!TIP]
> Always check the **Environment** tab for specific editor roadmaps!
