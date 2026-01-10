# 📂 Error: Wrong Folder Upload

It is common to accidentally upload files to the **Root Project Folder** instead of the specific **Scene Folder**. This creates clutter and confuses the editors.

## 🚨 Symbols (Symptoms)
- Files appear in the main "Post Production" lists but not inside "Scene 1", "Scene 2", etc.
- Organization becomes impossible.

## 🛠️ Semblance (Solution)

### 1. Check the ID
Ensure your `uniqueId` is correctly parsed.
- ✅ `s0_l1` -> Scene 0, Line 1
- ❌ `undefined` -> Will dump in root.

### 2. Use the Automation
Use the **"Upload to Drive"** button in the dashboard.
- It automatically creates `Scene X` folders.
- It renames files to `LineX_Type_Date`.

### 3. Manual Fix
If you uploaded manually:
1. Go to [Google Drive](https://drive.google.com/drive/u/0/folders/1E_ctpNSyieC_fr2xowbg_RfXZDVWbgzJ).
2. Create a folder named `Scene [ID]`.
3. **Move** the loose files into that folder.

> [!IMPORTANT]
> The dashboard tries to be smart, but it depends on the **Scenes YAML** being loaded correctly!
