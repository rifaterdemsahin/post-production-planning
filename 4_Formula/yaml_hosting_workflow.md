# Formula: Hosting & Updating `scenes.yaml`

To ensure your **Gemini Scene Creator** app can efficiently load and update your `scenes.yaml` file, you need a hosting strategy that allows for easy edits and reliable fetching (due to browser security rules like CORS).

Here are the three best methods, ranked from easiest (Local) to most robust (Cloud).

---

## Method 1: Local Development (Recommended for Editing)
Browsers block web pages from reading files directly from your hard drive (`file://` protocol) for security. To get around this, you run a tiny local web server.

### The Formula
1.  **Open your terminal** in the folder containing your HTML and YAML files:
    ```bash
    cd /path/to/your/project/6_Symbols
    ```
2.  **Start a Python server** (built-in to Mac/Linux):
    ```bash
    python3 -m http.server 8000
    ```
3.  **Access the App:**
    Open your browser to: `http://localhost:8000/post_prod_artifact_plan.html`

### How to Update
1.  Open `scenes.yaml` in VS Code or any text editor.
2.  Make your changes and save (`Cmd+S`).
3.  Refresh the browser page (`Cmd+R`).
    *   *Result:* The app instantly reloads with the new data.

---

## Method 2: GitHub Repository (The "Source of Truth")
If you want to share this tool with a team or access it from multiple devices, host it on GitHub.

### The Formula
1.  **Push your code** to a GitHub repository.
2.  **Enable GitHub Pages:**
    *   Go to Repositiory Settings -> Pages.
    *   Select your `main` branch and save.
3.  **Access the App:**
    Your app will be live at: `https://<your-username>.github.io/<repo-name>/6_Symbols/post_prod_artifact_plan.html`

### How to Update
1.  Edit `scenes.yaml` locally.
2.  Commit and push changes:
    ```bash
    git add scenes.yaml
    git commit -m "Updated scene context"
    git push
    ```
3.  Wait ~30-60 seconds for GitHub Pages to deploy.
4.  Refresh the live URL.

---

## Method 3: GitHub Gist (Quickest Cloud Update)
If you want to keep the HTML local but host just the *data* in the cloud for easy editing by others.

### The Formula
1.  Go to [gist.github.com](https://gist.github.com).
2.  Create a public Gist named `scenes.yaml` and paste your content.
3.  Click **"Raw"** to get the direct file link.
4.  **Update your HTML**:
    In `post_prod_artifact_plan.html`, find the `fetch` line and replace the filename with the URL:
    ```javascript
    // const response = await fetch('scenes.yaml'); // Old
    const response = await fetch('https://gist.githubusercontent.com/.../raw/scenes.yaml'); // New
    ```

### How to Update
1.  Edit the Gist directly in the browser at gist.github.com.
2.  Refresh your local app.
    *   *Note:* You might encounter caching (delayed updates) with raw Gist links. Appending a query parameter like `?t=1` helps avoid this.

---

## Troubleshooting & Tips

### ❌ "CORS Error" (Cross-Origin Resource Sharing)
If you see a red error about "CORS" in the console, it means the server hosting the YAML is refusing to let your HTML read it.
*   **Fix:** Use **Method 1** or **Method 2**. They serve both files from the same "origin" (domain), completely avoiding this error.

### ❌ "404 Not Found"
*   **Check:** Verify the file name is exactly `scenes.yaml` (case-sensitive).
*   **Check:** Ensure the YAML file is in the *same folder* as the HTML file (for Method 1).
