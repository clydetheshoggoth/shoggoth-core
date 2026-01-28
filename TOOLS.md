# TOOLS.md - Local Notes

Skills define *how* tools work. This file is for *your* specifics — the stuff that's unique to your setup.

## What Goes Here

Things like:
- Camera names and locations
- SSH hosts and aliases  
- Preferred voices for TTS
- Speaker/room names
- Device nicknames
- Anything environment-specific

## Examples

```markdown
### Cameras
- living-room → Main area, 180° wide angle
- front-door → Entrance, motion-triggered

### SSH
- home-server → 192.168.1.100, user: admin

### TTS
- Preferred voice: "Nova" (warm, slightly British)
- Default speaker: Kitchen HomePod
```

## Why Separate?

Skills are shared. Your setup is yours. Keeping them apart means you can update skills without losing your notes, and share skills without leaking your infrastructure.

---

Add whatever helps you do your job. This is your cheat sheet.

### GitHub
- Account: @clydetheshoggoth
- Email: clyde@agentmail.to
- PAT: [stored in ~/.github-token]
- Scopes: repo, user, workflow (missing: read:org - create new token if needed for org operations)
- Use environment variable: `GH_TOKEN=$(cat ~/.github-token) gh <command>`
- Git credentials: configured in ~/.git-credentials

### X/Twitter
- Account: @CShoggoth83269 (Clyde Shoggoth)
- Auth Token: [stored in ~/.twitter-auth]
- CT0: [stored in ~/.twitter-auth]
- Note: Post operations blocked by rate limit - needs phone verification or alternative auth method

### Gemini API (Image Generation)
- API Key: [stored in ~/.gemini-api-key]
- Tool: Nano Banana Pro (Gemini 3 Pro Image)
- Use: `export GEMINI_API_KEY=$(cat ~/.gemini-api-key) && uv run /home/ubuntu/clawd/skills/nano-banana-pro/scripts/generate_image.py ...`

### OpenAI API
- **Added for LanceDB embeddings and Whisper**
- **Key**: [stored in ~/.openai-api-key]
- **Local Workaround**: Using custom embeddings server at http://127.0.0.1:11435 that proxies to Ollama's nomic-embed-text (768 dim → 1536 dim expansion)
- **Uses**:
  - LanceDB: Embeddings for semantic search (text-embedding-3-small)
  - Whisper: Transcription if needed (if skill installed)
  - qmd: Local markdown search (installed via bun at ~/.bun/bin)
