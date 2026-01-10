# Test Case: Project Statistics & Verification Tracking

**Objective**: Ensure that global project statistics and verification progress are accurately calculated and displayed.

## Pre-requisites

- The `post_prod_artifact_plan.html` file is loaded with data (default or uploaded YAML).

## Test Steps

1. **View Initial Stats**:
   - Click the **Stats** button (or 📊 icon) in the bottom menu.
   - Note the total number of Scenes, Lines, and Prompts.

2. **Modify Verification State**:
   - Close the modal.
   - Mark several items as "Verified" (Scene Context, Transition, or specific prompts).
   - Change a prompt verification verified status (check/uncheck).

3. **Re-check Stats**:
   - Open the **Stats** modal again.
   - Verify that the **Verified Stats Section** numbers have updated.
   - Check the "Verified Prompts by Type" breakdown.

## Expected Result

- The stats should reflect the exact count of items in the loaded YAML.
- Toggling a checkbox in the UI should immediately (or upon re-opening modal) update the verified counts.
- Word/Sentence counts should look reasonable based on text content.

## Pass/Fail Criteria

- **PASS**: Numbers match manual count of checked items.
- **FAIL**: Counts do not update or show incorrect values (e.g., negative numbers or NaN).
