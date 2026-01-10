const fs = require("fs");
const path = require("path");

// Get directory from command line args
const targetDir = process.argv[2];

if (!targetDir) {
  console.error("Usage: node validate_filenames.js <directory_path>");
  process.exit(1);
}

if (!fs.existsSync(targetDir)) {
  console.error(`Error: Directory not found: ${targetDir}`);
  process.exit(1);
}

// Regex breakdown:
// ^[a-zA-Z0-9_]+  -> Start with alphanumeric/underscore string (Scene Title)
// _Line\d+        -> Separator + "Line" + digits (Line ID)
// _(Image|...)    -> Separator + Type
// _\d{4}-\d{2}... -> Timestamp (YYYY-MM-DD_HH-mm)
// \.(png|mp3...)$ -> Extension
const validPattern =
  /^[a-zA-Z0-9_]+_Line\d+_(Image|Audio|Video|Graphic|Text|Music|SFX|Animation)_\d{4}-\d{2}-\d{2}_\d{2}-\d{2}\.(png|mp3|mp4)$/;

console.log(`Scanning directory: ${targetDir}\n`);

let passed = 0;
let failed = 0;
let skipped = 0;

try {
  const files = fs.readdirSync(targetDir);

  files.forEach((file) => {
    // Skip hidden files or directories
    if (
      file.startsWith(".") ||
      fs.statSync(path.join(targetDir, file)).isDirectory()
    ) {
      return;
    }

    // We only care about files that look like our artifacts (contain "Line" and a known type)
    // just to avoid flagging random other files in the user's download folder as failures.
    // Or we can be strict. Let's be semi-strict but helpful: only fail if it looks like it SHOULD be one of ours.
    // Actually, for a specific test run, we usually want to check specific files.
    // For this script, let's output everything but highlight ones that match our context.

    // Simpler approach for the test: Just check against the pattern.
    if (validPattern.test(file)) {
      console.log(`✅ PASS: ${file}`);
      passed++;
    } else {
      // Optional: only log meaningful failures if we assume the folder has other garbage
      if (
        file.includes("_Line") &&
        (file.endsWith(".png") ||
          file.endsWith(".mp3") ||
          file.endsWith(".mp4"))
      ) {
        console.log(`❌ FAIL: ${file} (Does not match expected format)`);
        failed++;
      } else {
        skipped++; // Likely not a generated artifact
      }
    }
  });

  console.log(`\nSummary:`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  console.log(`Skipped (unrelated files): ${skipped}`);

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
} catch (err) {
  console.error(`Error reading directory: ${err.message}`);
  process.exit(1);
}
