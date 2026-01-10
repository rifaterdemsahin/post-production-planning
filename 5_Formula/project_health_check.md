# 🏥 Project Health Check Report

**Date:** 2026-01-10
**Scope:** Technical Sanity Check of `post-production-planning`

## 🏗️ Structure Analysis

### Directory Layout

The project follows a numbered directory structure (`1_Journey` to `8_Test`), which aids in ordering but can be opaque.

- **Good:** Clear progression from idea to environment to formulas.
- **Concern:** `6_Symbols` contains the main application logic (`post_prod_artifact_plan.html`) and data (`scenes.yaml`), which is an unusual naming convention for "Source" or "App".
- **Concern:** `proccesed_voiceover_v1.mp3` has a typo in the filename ("proccesed" vs "processed").

### Key Files

- `post_prod_artifact_plan.html`: The core of the application. It acts as a Single Page Application (SPA).
- `scenes.yaml`: The database. Good use of YAML for human-readable data.

## 💻 Code Quality Analysis

### `post_prod_artifact_plan.html`

- **Monolithic Architecture:** The file is large (~3400 lines) containing HTML, CSS, and Client-Side Logic.
  - *Risk:* Hard to maintain, debug, and version control specific sections.
  - *Recommendation:* Split into `index.html`, `styles.css`, and `app.js`.
- **Hardcoded Paths:** The menu links (`docData`) rely on relative paths (e.g., `../2_Real/...`).
  - *Risk:* Moving the HTML file will break all links.
- **DOM Manipulation:** Heavy reliance on manual DOM manipulation (e.g., constructing HTML strings in JS).
  - *Risk:* XSS vulnerabilities and performance issues with large datasets.
  - *Recommendation:* Consider a lightweight framework (Vue, Alpine.js) or Web Components for reusable parts like "Scene Cards".
- **Global Variables:** Extensive use of window-scoped global variables (`scenes`, `currentSceneIndex`).
  - *Risk:* Variable collisions and state management bugs.

## 💾 Data Integrity

### `scenes.yaml`

- **Format:** The data structure is consistent (Scenes -> Lines -> Prompts).
- **Validation:** The application has basic error handling for YAML loading, but no schema validation.
  - *Risk:* A typo in YAML keys (e.g., `script` vs `scrpt`) could silently break features.

## 🚀 Actionable Recommendations

### 1. High Priority (Immediate Fixes)

- [ ] **Fix Typos:** Rename `proccesed_voiceover_v*.mp3` to `processed_...`.
- [ ] **Backup:** Ensure `scenes.yaml` is committed frequently, as the "Save" button overwrites the remote file.

### 2. Medium Priority (Refactoring)

- [ ] **Externalize Config:** Move the `docData` (menu links) into a `config.json` or a separate JS file to declutter the main logic.
- [ ] **Extract CSS:** Move the `<style>` block to `styles.css`.
- [ ] **Extract JS:** Move the main logic to `app.js`.

### 3. Low Priority (Long-term)

- [ ] **Schema Validation:** Implement a JSON/YAML schema validator to check `scenes.yaml` structure on load.
- [ ] **Component Framework:** Refactor the "Scene" and "Line" renderers into small, testable function components.
