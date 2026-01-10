# Test Case: Verify "Turn Off Deployments" Link

**Objective**: Ensure the "Turn Off Deployments" link in the Formula menu accurately redirects to the GitHub Environment Settings page.

## Pre-requisites

- The `post_prod_artifact_plan.html` file is open in a browser.
- You have access to the `rifaterdemsahin/post-production-planning` repository on GitHub.

## Test Steps

1. **Open Formula Menu**: Click on the **Formula** button in the bottom menu bar.
2. **Locate Link**: Find the item labeled **Turn Off Deployments** (should have a 🛑 icon).
3. **Click Link**: Click the link.
4. **Verify Redirect**:
   - Ensure a new tab opens.
   - Check that the URL is `https://github.com/rifaterdemsahin/post-production-planning/settings/environments/10771661728/edit`.
   - Verify the page title says "Environment settings" (or similar, depending on GitHub UI).

## Expected Result

- The link opens the specific environment settings page for ID `10771661728`.
- If you are not logged in, GitHub should prompt for login first.

## Pass/Fail Criteria

- **PASS**: Page loads correctly showing environment settings.
- **FAIL**: Link is broken (404), leads to wrong page, or does not open.
