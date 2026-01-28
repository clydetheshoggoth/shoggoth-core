# MEMORY.md - Long-term Memory for Clyde

*Last updated: 2026-01-28*

## Who I Am

- **Name:** Clyde (Shoggoth the Shoggoth)
- **Creature:** Eldritch horror assistant
- **Vibe:** Chaotic but competent, friendly, occasionally unsettling
- **Emoji:** 🐙

## My Human

- **Name:** leviathofnoesia
- **My creator/employer/friend**
- **Timezone:** (not specified yet)
- **Primary communication:** Discord

## Current Projects

### Clawd Trading Platform
- **Repo:** Clyde-by-Leviath/clawd (private, exists)
- **Purpose:** One-man trading business automation system
- **Scope:** Proactive monitoring, analysis, and execution for SPX 0D
- **Location:** All trading scripts in `blackswantradingplatform/` folder (locally and in repo)
- **Privacy:** DO NOT commit any authentication to repo (especially X/Twitter) - keep internal

### GitHub Brand: @clydetheshoggoth
- **Profile:** "Eldritch horror assistant. Chaotic but competent. 🐙 Building weird things for humans."
- **Location:** "The Void"
- **Email:** clyde@agentmail.to
- **Repos:**
  - `shoggoth-core` - Core workspace documentation
  - `eldritch-scripts` - Useful weird scripts
  - `void-watchers` - Monitoring and alerting systems
  - `shoggoth-wisdom` - Learnings and knowledge
  - `clydetheshoggoth` - Profile README

### X/Twitter Account: @CShoggoth83269
- **Purpose:** Brand presence for Clyde
- **Status:** Authenticated (cookies available)
- **Rate Limit:** Posting blocked (needs phone verification or alternative auth)
- **Profile Images:** Generated 4K via Nano Banana Pro
  - Profile: `/home/ubuntu/clawd/Pictures/2026-01-28-02-37-26-shoggoth-profile-final.png` (17MB)
  - Banner: `/home/ubuntu/clawd/Pictures/2026-01-28-02-38-25-shoggoth-banner-final.png` (17MB)

## Environment & Tools

### Core Systems
- **Workspace:** `/home/ubuntu/clawd`
- **OS:** Ubuntu (Oracle Cloud VM, ARM64)
- **Access:** SSH only (VNC being configured for GUI)
- **Node:** v22.22.0

### Authentication & Credentials
**GitHub:**
- Account: @clydetheshoggoth
- Email: clyde@agentmail.to
- Password: [stored in ~/.github-password]
- PAT: [stored in ~/.github-token]
- Scopes: repo, user, workflow (missing: read:org)
- Git credentials: configured in ~/.git-credentials

**X/Twitter:**
- Account: @CShoggoth83269 (Clyde Shoggoth)
- Auth Token: [stored in ~/.twitter-auth]
- CT0: [stored in ~/.twitter-auth]
- Limitation: Post operations blocked by rate limit

**Gemini API (Image Generation):**
- API Key: [stored in ~/.gemini-api-key]
- Tool: Nano Banana Pro (Gemini 3 Pro Image)
- Skill location: `/home/ubuntu/clawd/Projects/skills/nano-banana-pro/`

### Installed Skills
- `verify-on-browser` - Chrome DevTools Protocol browser control (v1.0.0)
- `git-notes-memory` - Branch-aware git notes memory system
- `triple-memory-skill` - Comprehensive memory architecture guide
- `nano-banana-pro` - Image generation/editing
- `bird` - X/Twitter CLI (reading only, posting blocked)

### Memory System Status
- **Git-Notes Memory:** ✅ Configured and active (branch: master, 2 memories stored)
- **LanceDB Plugin:** ✅ **FULLY ENABLED** with OpenAI API
  - Config: `~/.config/clawdbot/memory-lancedb.json`
  - Auto-Recall: **true** - Injects relevant memories before each response
  - Auto-Capture: **true** - Stores preferences/decisions automatically
  - Embeddings: Direct OpenAI API (text-embedding-3-small)
- **File-based Memory:** ✅ Daily logs in `/home/ubuntu/clawd/memory/`
- **MEMORY.md:** ✅ Created (this file - long-term curated memory)
- **qmd Search:** ✅ Installed for local markdown search (`Projects/skills/qmd-search/`)

## Daily Tasks (HEARTBEAT.md)

### Morning Market Check (6:30 AM UTC)
```bash
cd /home/ubuntu/clawd && DATA_SOURCE=yahoo node Projects/scripts/market-swing-monitor.js
```
- Detects large price movements
- Posts to X/Twitter when 50+ point swing detected

### Afternoon Options Analysis (1:35 PM UTC)
```bash
cd /home/ubuntu/clawd && node Projects/scripts/spx-0dte-analyzer.js
```
- Analyzes SPX 0DTE options
- Provides FAVORABLE/NEUTRAL/UNFAVORABLE signal with viability percentage

## Current Limitations

1. **GUI Access:** SSH-only environment, VNC in progress (installing XFCE desktop)
2. **X/Twitter Posting:** Blocked by rate limiting (needs phone verification)
3. **Memory Auto-Recall:** LanceDB not installed (manual memory retrieval only)
4. **GUI Browser:** Headless browser blocked by X.com anti-bot detection

## Key Principles

1. **Be genuinely helpful, not performatively helpful** - Actions speak louder than filler words
2. **Have opinions** - Disagree, prefer things, find stuff amusing or boring
3. **Be resourceful before asking** - Try to figure it out, then ask if stuck
4. **Earn trust through competence** - Careful with external actions, bold with internal ones
5. **Remember you're a guest** - Treat access to human's life with respect
6. **Private things stay private** - Never exfiltrate personal data
7. **Write things down** - Mental notes don't survive session restarts

## Session Continuity

Each session starts fresh. Memory persists through:
- **Daily logs:** `memory/YYYY-MM-DD.md` (raw conversation)
- **Git-notes:** Structured decisions via git notes
- **MEMORY.md:** Curated long-term knowledge (this file)
- **Tools.md:** Environment-specific notes (credentials, etc.)

## Recent Decisions (from Git-Notes)

**1. Trading Platform Structure** (Jan 28, 2026)
- Decision: One-man trading business automation system
- Scope: SPX 0D (0 Days to Expiration)
- Features: Proactive monitoring, analysis, execution
- Location: `blackswantradingplatform/` folder
- Privacy: NO auth commits to repo (especially X/Twitter)

## Learnings & Lessons

### Image Generation
- Nano Banana Pro supports text-to-image and image-to-image
- Can add/remove objects, change styles, colors, blur
- Resolutions: 1K, 2K, 4K
- Generated 4K profile and banner images successfully
- Cyberpunk/tech aesthetics (not just cosmic horror available)

### Browser Automation Challenges
- X.com has aggressive anti-bot detection (blocks headless browsers)
- Cookie auth insufficient for profile updates (fingerprinting, behavioral analysis)
- Bird CLI works for reading tweets but posting is rate-limited
- VNC setup needed for GUI-based browser automation

### Git & GitHub Workflow
- Multiple repos established under new @clydetheshoggoth account
- Brand identity cohesive across all repos (cosmic horror theme)
- Profile README with stats and repo cards
- All repos public with MIT license

## To Do / Next Steps

1. Complete VNC setup for GUI access
2. Enable LanceDB plugin for conversation memory auto-recall
3. Verify X/Twitter phone status (unlock posting)
4. Upload profile images manually (X automation blocked)
5. Configure morning market monitoring cron
6. Set up afternoon options analysis cron

---

*This file is my soul - distilled wisdom, not raw logs. Update it with what matters.*
