# Formula: Scenes Configuration (`scenes.yaml`)

## Overview
The `scenes.yaml` file serves as the central data source for the **Gemini Nanabanana Production Dashboard**. It defines the narrative structure, script, and generative prompts for the entire video production workflow. This file is designed to be human-readable and easily editable, allowing creative teams to iterate on the story and visual direction without touching the code.

## File Location
`6_Symbols/scenes.yaml`

## Structure
The YAML file is structured as a hierarchical list of scenes, each containing a sequence of lines.

### Root Object
- **`scenes`**: A list of scene objects.

### Scene Object
Each item in the `scenes` list represents a distinct segment of the video.
- **`id`**: Unique identifier for the scene (e.g., "SCENE 01").
- **`title`**: Descriptive title of the scene (e.g., "The New Age").
- **`color`**: CSS class string for UI styling (e.g., "border-l-4 border-blue-500").
- **`lines`**: A list of line objects belonging to this scene.

### Line Object
Each item in the `lines` list represents a specific moment or line of dialogue.
- **`id`**: Sequential identifier for the line within the scene.
- **`time`**: Timestamp for the line (e.g., "0:00").
- **`script`**: The actual spoken dialogue or narration.
- **`prompts`**: An object containing generative AI prompts for various modalities.

### Prompts Object
This object maps specific artifact types to the prompts used to generate them.
- **`image`**: Prompt for generating a static image (e.g., Midjourney, Gemini Image).
- **`graphic`**: Prompt for on-screen graphics or lower thirds.
- **`music`**: Description for background music generation.
- **`animation`**: Prompt for video generation (e.g., Veo).
- **`overlay_text`**: Text to be displayed on screen.
- **`sound_effect`**: Description for sound effects (SFX).

## Usage in Application

The `scenes.yaml` file is consumed by `6_Symbols/post_prod_artifact_plan.html`.

1.  **Loading**: The web application fetches `scenes.yaml` at runtime using `fetch('scenes.yaml')` and parses it using `jsyaml.load()`.
2.  **Rendering**: The parsed data is used to dynamically generate the "Gemini Scene Creator" dashboard. Each scene and line is rendered as a card, populated with the script and prompt data.
3.  **Generation**:
    *   **Image/Graphic**: Prompts are sent to **Gemini 2.0 Flash** or **Gemini 3 Pro** (via the API) to generate visual assets.
    *   **Animation**: Prompts are sent to **Veo 2.0** to generate video clips.
    *   **Audio**: Prompts are sent to **Gemini 2.5 Pro (TTS)** to generate music or sound effects.
4.  **Editing & Persistence**: Users can edit prompts directly in the dashboard. The **"Save YAML"** button regenerates the YAML structure from the current UI state and triggers a file download, allowing changes to be saved back to `scenes.yaml`.

## Example Snippet

```yaml
scenes:
  - id: "SCENE 01"
    title: "The New Age"
    color: "border-l-4 border-blue-500"
    lines:
      - id: "1"
        time: "0:00"
        script: "Alright, let's dive right in..."
        prompts:
          image: "Cinematic medium shot of a confident tech presenter..."
          graphic: "Sleek, modern lower third..."
          music: "Low, pulsing synth pad..."
          animation: "Subtle slow zoom in on the presenter..."
          overlay_text: "THE NEW AGE"
          sound_effect: "Subtle high-tech whoosh..."
```

## Key Benefits
*   **Separation of Concerns**: Content (script/prompts) is separated from logic (HTML/JS).
*   **Iterative Workflow**: Prompts can be refined in the UI and saved back to the source.
*   **Multi-Modal**: Supports a wide range of asset types for a complete production plan.
