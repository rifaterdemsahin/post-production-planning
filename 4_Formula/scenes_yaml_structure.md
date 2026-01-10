# Formula: Scenes YAML Structure

**Purpose**: Defines the data schema for `scenes.yaml`, which drives the `post_prod_artifact_plan.html` application.

## File Location
`6_Symbols/scenes.yaml`

## Schema Overview

The YAML file consists of a root object `scenes` which is a list of Scene objects.

### Root Object
| Field | Type | Description |
|-------|------|-------------|
| `scenes` | Array | List of scene objects. |

### Scene Object
| Field | Type | Description |
|-------|------|-------------|
| `id` | String | Unique Scene ID (e.g., "SCENE 01"). |
| `title` | String | Title of the scene. |
| `color` | String | Tailwind CSS keys for border color styling (e.g., "border-l-4 border-blue-500"). |
| `lines` | Array | List of Line objects in this scene. |

### Line Object
| Field | Type | Description |
|-------|------|-------------|
| `id` | String | Line ID relative to the scene (e.g., "1"). |
| `time` | String | Timecode string (e.g., "0:00"). |
| `script` | String | The spoken script or narration text. |
| `prompt` | String | The generative AI prompt for creating the visual artifact. |

## Example

```yaml
scenes:
  - id: "SCENE 01"
    title: "The New Age"
    color: "border-l-4 border-blue-500"
    lines:
      - id: "1"
        time: "0:00"
        script: "Alright, let's dive right in..."
        prompt: "Cinematic medium shot of a confident tech..."
```

## Usage

This file is fetched asynchronously by `post_prod_artifact_plan.html` using:
```javascript
const response = await fetch('scenes.yaml');
const data = jsyaml.load(yamlText);
```

## JSON-Compatible Structure

Since `js-yaml` parses this into a JavaScript Object, direct array access is used in `post_prod_artifact_plan.html`:
- `data.scenes[0].id` -> "SCENE 01"
- `data.scenes[0].lines[0].prompt` -> "Cinematic medium shot..."
