# Mayra Human Avatar Runtime

Mayra is a voice-first human avatar layer for Nexus. This layer deliberately does not generate a procedural/geometric character.

## Visual target

- Human-looking female character
- Dark wavy hair tied back with loose tendrils
- Direct expressive gaze
- Realistic skin and facial detail
- Futuristic editorial styling
- Purple/electric-blue cinematic lighting
- Metallic silver coat

## Runtime

The renderer is based on `@met4citizen/talkinghead`, which provides Three.js-based real-time avatar animation and lip-sync for compatible full-body GLB/VRM-style assets.

The actual Mayra character asset is intentionally not fabricated or bundled here. Put a properly licensed rigged human avatar at:

`public/avatars/mayra.glb`

The asset must expose facial blendshapes/visemes or compatible Ready Player Me-style targets for speech animation.

## State contract

The Nexus/Gemini layer should drive these states:

- `idle`
- `listening`
- `thinking`
- `speaking`
- `interrupted`
- `offline`

The renderer owns visual animation. Gemini owns conversation. Nexus owns orchestration and Android tools.
