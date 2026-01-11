# ELEVENLABS_API_KEY

## Value
```
ELEVENLABS_API_KEY=your_elevenlabs_key_here
```

## Description
The ElevenLabs API Key authenticates requests to ElevenLabs' text-to-speech and audio generation services. Used for:
- **Voiceover generation** - Converting script text to spoken audio
- **Sound effects** - Generating audio effects
- **Music generation** - Creating background music

## How It's Used in This Project

### 1. Voiceover Generation
Converts script text to speech using ElevenLabs' voice models:

```javascript
// Model used for voiceovers
model: 'eleven_turbo_v2'
```

### 2. Sound Effect Generation
Creates sound effects based on prompts:

```javascript
// Model used for SFX
model: 'eleven_turbo_v2_sfx'
```

### 3. API Verification
The app validates the API key on entry:

```javascript
async function verifyElevenApiKey(key, isManual = false) {
    const response = await fetch('https://api.elevenlabs.io/v1/user', {
        headers: { 'xi-api-key': key }
    });
    // Check if valid...
}
```

## Where It's Stored
- **Browser Cookie**: `elevenlabs_api_key`
- **localStorage**: `elevenlabs_api_key`

```javascript
// Retrieved in the app
const elevenKey = getCookie('elevenlabs_api_key') || localStorage.getItem('elevenlabs_api_key');
```

## How to Get This Key

1. Go to: https://elevenlabs.io/
2. Sign up or log in to your account
3. Navigate to your Profile/Settings
4. Find "API Keys" section
5. Click "Create API Key" or copy existing key

## How to Add to the App

1. Open the app (`post_prod_artifact_plan.html`)
2. Click "⚙️ Actions" → "🔑 Manage API Keys"
3. Paste the API key in the "ElevenLabs API Key" field
4. The key is automatically verified

## API Usage in Generation

When generating audio content, the key is included in requests:

```javascript
const response = await fetch('https://api.elevenlabs.io/v1/text-to-speech/{voice_id}', {
    method: 'POST',
    headers: {
        'xi-api-key': ELEVENLABS_API_KEY,
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({
        text: scriptText,
        model_id: 'eleven_turbo_v2',
        voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75
        }
    })
});
```

## Prompt Types Using ElevenLabs

| Prompt Type | Model | Purpose |
|-------------|-------|---------|
| Music | `eleven_turbo_v2` | Background music |
| Sound Effect | `eleven_turbo_v2_sfx` | Sound effects |
| Voiceover | `eleven_turbo_v2` | Script narration |

## Pricing Considerations

ElevenLabs uses a credit-based system:
- Free tier: Limited characters/month
- Paid tiers: More characters and features
- Check your usage at: https://elevenlabs.io/subscription

## Security Notes

- The key is stored locally in the browser only
- Never commit actual API keys to version control
- The key is only sent to ElevenLabs' APIs
- Consider using a separate key for development vs production

## Troubleshooting

**Error: "Invalid API Key"**
- Verify the key is correct (no extra spaces)
- Check if the key has been revoked
- Generate a new key if needed

**Error: "Quota Exceeded"**
- Check your subscription limits
- Upgrade plan or wait for quota reset

**No audio generated**
- Ensure the script text is not empty
- Check browser console for error details
