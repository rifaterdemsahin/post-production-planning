---
description: Start a local web server to view the Simple Recorder
---
To serve the `simple-recorder.html` file, we use Python's built-in HTTP server.

1. Ensure you are in the project root.

// turbo
2. Start the server for the 6_Symbols directory
   ```bash
   cd 6_Symbols && python3 -m http.server 8000
   ```
   
3. Access the recorder at:
   http://localhost:8000/simple-recorder.html

> [!NOTE]
> The server will run in the foreground. Press `Ctrl+C` to stop it.
