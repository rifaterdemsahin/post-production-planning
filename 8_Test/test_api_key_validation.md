# Test Case: Google API Key Validation

**Objective**: Verify that the application correctly handles valid and invalid Google Gemini API keys.

## Pre-requisites

- The `post_prod_artifact_plan.html` file is open.
- You have a valid Google Gemini API Key.

## Test Steps

1. **Enter Invalid Key**:
   - In the "Google API Key" input field at the top, enter a dummy string (e.g., `invalid_key_123`).
   - Wait for the debounce (approx. 800ms) or click away.
   - Observe the status icon.

2. **Enter Valid Key**:
   - Clear the field and paste your valid API Key.
   - Wait for validation.

3. **Check Persistence**:
   - Refresh the page.
   - Check if the key remains loaded (or masked) and if the validation status returns to ✅ automatically.

4. **Change Key**:
   - Click the "Change Key" or "Reset" button (if available/visible or upon clearing).
   - Ensure you can update the key.

## Expected Result

- **Invalid Key**: Status icon shows ❌ and input border turns red.
- **Valid Key**: Status icon shows ✅, input border turns green, and input may be hidden/replaced by a "Verified" badge.
- **Persistence**: Key should survive page refresh via `localStorage`.

## Pass/Fail Criteria

- **PASS**: Validates correctly, gives visual feedback, and persists.
- **FAIL**: False positive on invalid key, failure to store key, or UI does not update.
