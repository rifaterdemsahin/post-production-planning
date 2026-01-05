# YAML <-> HTML Logic Formula

This document explains the bi-directional relationship between the data source (`scenes.yaml`) and the frontend application (`post_prod_artifact_plan.html`).

## 1. Data Schema (`scenes.yaml`)

The `scenes.yaml` file acts as the Single Source of Truth for the project.

### Root Object
| Field | Type | Description |
| :--- | :--- | :--- |
| `main_context` | String | Global context applied to all generations. |
| `verified_main_context` | Boolean | **[New]** Toggle to indicate if the main context is finalized/verified. |
| `scenes` | Array | List of Scene objects. |

### Scene Object
Each item in the `scenes` array represents a distinct segment of the video.

| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | String | Unique identifier (e.g., "SCENE 01"). |
| `title` | String | Human-readable title. |
| `context` | String | Scene-specific context (mood, setting). |
| `verified_context` | Boolean | **[New]** Toggle to indicate if the scene context is verified. |
| `transition` | String | Description of transition to the next scene. |
| `verified_transition` | Boolean | **[New]** Toggle to indicate if transition is verified. |
| `lines` | Array | List of Line/Shot objects containing scripts and prompts. |

### Line Object (Prompts)
Within `lines`, the `verified_prompts` object mirrors the `prompts` object keys (image, graphic, music, etc.), storing a Boolean `true/false` for each prompt type.

---

## 2. Application Flow (`post_prod_artifact_plan.html`)

The HTML file is a single-page application that loads, renders, modifies, and saves this data.

### Initialization & Loading
1.  **`downloadYAML()` / File Upload**: The user provides the YAML content.
2.  **`parseAndLoadData(yamlText)`**:
    - Uses `jsyaml.load()` to parse the string.
    - **State Hydration**:
        - `window.mainContext` is set from `data.main_context`.
        - `window.verifiedMainContext` is set from `data.verified_main_context` (defaults to `false` if missing).
        - Global `scenes` variable is populated with `data.scenes`.

### Rendering
-   **`renderScenes()`**: Clears the DOM and rebuilds the UI based on the `scenes` array.
-   **Bindings**:
    -   **Main Context**: Textarea value bound to `window.mainContext`. Checkbox "Verified for Bulk" bound to `window.verifiedMainContext`.
    -   **Scene Context**: Textarea value bound to `scene.context`. Checkbox bound to `scene.verified_context`.
    -   **Transitions**: Textarea value bound to `scene.transition`. Checkbox bound to `scene.verified_transition`.

### Reactivity (User Actions)
When a user interacts with the UI, specific handler functions update the in-memory data model immediately:

-   **`handleMainContextVerify(checked)`**: Updates `window.verifiedMainContext`.
-   **`handleSceneContextVerify(index, checked)`**: Updates `scenes[index].verified_context`.
-   **`handleTransitionVerify(index, checked)`**: Updates `scenes[index].verified_transition`.

### Persistence (Saving)
When "Save YAML" is clicked:
1.  **`saveChanges()`**:
    -   Constructs a new export object:
        ```javascript
        const exportData = {
            main_context: window.mainContext,
            verified_main_context: window.verifiedMainContext,
            scenes: scenes
        };
        ```
    -   **Note**: The individual scene properties (`verified_context`, `verified_transition`) are already inside the `scenes` array objects because JavaScript objects are passed by reference and updated live by the handlers.
2.  **Serialization**: `jsyaml.dump()` converts the object back to a YAML string.
3.  **Transport**: The Base64-encoded string is sent to the GitHub API via `PUT` request.

---

## 3. Workflow Goals & Sanity Check

### Workflow Goals
The goal of this system is to streamline the post-production process for high-value documentary videos.
- **Multimodal Planning**: Defining Image, Graphic, Music, Animation, and Sound Effects for every single line of script *before* generation.
- **Verification First**: Using the "Verified for Bulk" toggles ensures that contexts and prompts are reviewed and locked in. This prevents wasting API credits or render time on unrefined ideas.
- **Bulk Generation**: Once verified, the YAML serves as a machine-readable instruction set for automated generation tools (e.g., Gemini Scene Creator), producing consistent assets at scale.

### Sanity Check
- **Data Integrity**: The `scenes` array in memory is a direct reference to the UI. Changes are immediate. The `saveChanges()` function dumps the *entire* state back to YAML, ensuring no "partial saves" where some prompt updates are lost.
- **Context Propagation**: The `main_context` is applied globally, while `scene.context` allows for local overrides or specific mood setting, ensuring coherent video generation.
- **Verification Logic**: The system now explicitly tracks verification for:
    - Main Context (Global)
    - Scene Context (Local)
    - Transitions (Flow)
    - Individual Prompts (Asset Details)
    *If a field is marked `verified: true`, it signals to the generation pipeline that it is safe to process.*
