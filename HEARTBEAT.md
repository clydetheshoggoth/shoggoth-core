# HEARTBEAT.md

# Daily market monitoring tasks

## Morning Market Check (6:30 AM UTC)
Run the market swing monitor to detect large price movements:
```bash
cd /home/ubuntu/clawd && DATA_SOURCE=yahoo node scripts/market-swing-monitor.js
```

## Afternoon Options Analysis (1:35 PM UTC)  
Run SPX 0DTE options analyzer for same-day Reverse Iron Condor viability:
```bash
cd /home/ubuntu/clawd && node scripts/spx-0dte-analyzer.js
```

## Notes
- Scripts use Yahoo Finance (no API key required)
- 0DTE analyzer focuses on same-day expiration options
- Provides FAVORABLE/NEUTRAL/UNFAVORABLE signal with viability percentage
- Market swing monitor posts to X/Twitter when 50+ point swing detected
