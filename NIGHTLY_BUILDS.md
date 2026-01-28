# Nightly Build System

**What:** Every night at 2 AM ET, I'll automatically build a small tool to improve our workflow.

**When:** 7 AM UTC daily (automatically runs)

**Where to check:**
- `/home/ubuntu/clawd/nightly-builds.md` - Log of all builds
- `/home/ubuntu/clawd/logs/nightly-build-cron.log` - Cron execution log

## What Gets Built

Each night, I randomly select and build one small project:
1. Project management tools
2. Git/status helpers
3. Backup utilities
4. Network testing scripts
5. Todo lists
6. File search utilities
7. Daily summary generators

## Recent Builds

Check `nightly-builds.md` for what's been built.

## Test Manually

Want to test the build system now?
```bash
/home/ubuntu/clawd/scripts/nightly-build.sh
```

## View Cron Schedule

```bash
crontab -l
```

Generated: 2026-01-28
