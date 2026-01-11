# Data Persistence Evolution: From YAML to Google Sheets

## Phase 1: The YAML Era (Developer Centric)
**Rationale:**
*   **Structure:** YAML is excellent for nested data structures (Scenes -> Lines -> Prompts).
*   **Version Control:** Text-based format allowed granular Git tracking for every change in prompt wording.
*   **Validation:** Strict schema validation ensured the app never crashed due to missing fields.

**The Roadblock:**
*   **Access Barrier:** Non-technical team members (Producers, Writers) could not easily edit the file without using a code editor or risking syntax errors.
*   **Friction:** "Commit & Push" workflow was too slow for rapid content iteration.

## Phase 2: The Google Sheets Era (User Centric)
**Rationale:**
*   **Accessibility:** Everyone knows how to use a spreadsheet. No learning curve.
*   **Collaboration:** Real-time editing allow multiple people to work on the script and prompts simultaneously.
*   **LLM Integration:** It is significantly easier to ask an LLM (Gemini/ChatGPT) to "Generate a table of 5 scenes" and paste it into Sheets than to generate valid nested YAML.
*   **Dynamic Loading:** We configured the app to fetch the "Published CSV" directly, meaning content updates happen without a code deployment.

**The Trade-off:**
*   **Loss of Nesting:** We had to flatten the data structure (repeating Scene IDs for every line).
*   **Loss of Git History:** We rely on Drive's revision history instead of Git's robust diffs.
*   **Speed:** We trade instant local loading for a ~1s network fetch.

**Conclusion:**
The shift prioritizes **content velocity** over **technical purity**. By removing the "Git" step from the content creation loop, we empower the creative team to iterate faster, even if the underlying data structure is less elegant.