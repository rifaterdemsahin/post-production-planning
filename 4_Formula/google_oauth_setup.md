# Formula: Creating a Google OAuth Client ID

**Goal**: Obtain a `Client ID` to allow your web application to authenticate with Google services (like Google Drive) on behalf of a user.

## 1. Create a Project

1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Click the project dropdown in the top bar.
3. Click **"New Project"**.
4. Enter a name (e.g., `Post-Production-App`) and click **"Create"**.
5. Wait for the notification and click **"Select Project"**.

## 2. Enable Google Drive API

1. Open the **Navigation Menu** (☰) > **APIs & Services** > **Enabled APIs & services**.
2. Click **"+ ENABLE APIS AND SERVICES"** at the top.
3. Search for **"Google Drive API"**.
4. Click on the result and click **"Enable"**.

## 3. Configure Consent Screen

1. Go to **APIs & Services** > **OAuth consent screen**.
2. Select **"External"** (accessible to any Google account) and click **"Create"**.
   * *Note: While in "Testing" status, you can only access it with emails you specifically add.*
3. **App Information**:
   * **App name**: `Post Prod Planner`
   * **User support email**: Select your email.
   * **Developer contact information**: Enter your email.
4. Click **"Save and Continue"** through the scopes section (default scopes are fine for now, or add `.../auth/drive.file` manually).
5. **Test Users**:
   * Click **"+ ADD USERS"**.
   * Enter your own email address (and any others who need to test).
   * Click **"Save and Continue"**.

## 4. Create Credentials (Client ID)

1. Go to **APIs & Services** > **Credentials**.
2. Click **"+ CREATE CREDENTIALS"** > **OAuth client ID**.
3. **Application type**: Select **"Web application"**.
4. **Name**: `Local Client` (or similar).
5. **Authorized JavaScript origins**:
   * Click **"+ ADD URI"**.
   * Add: `http://127.0.0.1:5500` (VS Code Live Server default).
   * Add: `http://localhost:5500` (Why not both? just in case).
6. **Authorized redirect URIs**:
   * Leave blank (not needed for the "Popup" flow we are using).
7. Click **"Create"**.

## 5. Get Your Client ID

1. A modal will appear with your Key/Secret.
2. Copy the **"Client ID"** (it looks like `123456789-abcdefg...apps.googleusercontent.com`).
3. *Ignore the Client Secret (do not use it in client-side code).*

## 6. Use in Application

1. Open your web app.
2. Click **"Upload to Drive"**.
3. Paste the **Client ID** into the configuration modal.
