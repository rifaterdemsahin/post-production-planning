# Test Case: Bulk Generation Workflow

**Objective**: Verify that the Bulk Generation feature correctly identifies verified items, queues them, and processes them sequentially.

## Pre-requisites

- The `post_prod_artifact_plan.html` file is open in a browser.
- A valid Google API Key is entered and verified.
- At least one scene or line prompt has been marked as "Verified" in the UI.

## Test Steps

1. **Verify Items**:
   - Scroll to a scene.
   - Toggle the "Verified" checkbox for a specific prompt (e.g., Image or Text).
   - Ensure the UI reflects the verified state.

2. **Open Bulk Modal**:
   - Click the **⚡ Bulk Generate** button in the top right action bar.
   - Verify the "Bulk Generation" modal opens.

3. **Check Queue**:
   - Confirm that the modal lists the items you marked as verified.
   - Check the count summary (e.g., "Found 1 verified items").

4. **Start Generation**:
   - Click **🚀 Start Generation**.
   - Observe the progress bar and log output.

## Expected Result

- The modal should correctly aggregate all verified items.
- The generation process should iterate through items without errors (assuming valid API key).
- Logs should show "Starting" and "Completed" for each item.
- The "Done" state should be reached when finished.

## Pass/Fail Criteria

- **PASS**: Verified items appear in queue, generation starts and completes, logs update.
- **FAIL**: Modal is empty despite verified items, generation hangs, or API errors are not handled gracefully.
