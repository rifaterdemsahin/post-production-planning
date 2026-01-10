# Test Case: GitHub Save Integration

**Objective**: Verify that the application can save the current YAML state back to the GitHub repository.

## Pre-requisites

- The `post_prod_artifact_plan.html` file is open in a browser.
- You have a GitHub Personal Access Token (PAT) with `repo` scope.
- You have the correct repository details (Owner, Repo, Path, Branch).

## Test Steps

1. **Configure GitHub**:
   - Click **🔗 Links** -> **🔑 GitHub Tokens** to generate a token if needed.
   - Click **💾 Save** (or the save icon) in the top action bar.
   - If prompted, enter your GitHub details and Token in the configuration modal.
   - Click **Save Configuration**.

2. **Make a Change**:
   - Modify a prompt or toggle a verification checkbox in the UI to change the state.

3. **Execute Save**:
   - Click the **Save** button.
   - Confirm the dialog "Save changes to...?"
   - Observe the "Saving to GitHub" progress modal.

## Expected Result

- The progress modal should show steps: "Generating YAML", "Fetching file info", "Uploading new content".
- A "Success" message should appear upon completion.
- Verify on GitHub.com that the file `6_Symbols/scenes.yaml` (or configured path) has been updated with a recent commit message.

## Pass/Fail Criteria

- **PASS**: Success message appears, and GitHub commit history shows the update.
- **FAIL**: Authentication error (401), path error (404), or network failure.
