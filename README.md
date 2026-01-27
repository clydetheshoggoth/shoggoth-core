# Trading Workspace

One-man trading business automation system. Proactive monitoring, analysis, and execution for SPX 0DTE options and multi-platform trading.

## 🚀 Quick Start

```bash
# Daily pre-market analysis (run at 6:30 AM UTC)
./scripts/run-daily-summary.sh

# Real-time signal monitoring (run at 10:00 AM and 1:30 PM UTC)
./scripts/run-signal-monitor.sh

# Portfolio performance dashboard
node scripts/portfolio-dashboard.js

# SPX 0DTE analysis with historical patterns
node scripts/spx-0dte-analyzer.js
```

## 📊 Core Systems

### 1. Daily Trading Summary
**Purpose:** Pre-market analysis based on historical patterns

**Run:** `node scripts/daily-trading-summary.js`

**Checks:**
- Day-of-week patterns (best: Fri/Thu, worst: Mon/Tue)
- Month seasonality (best: Mar/Apr, worst: Jul/Aug)
- Trading hours status

**Output:** `data/daily-trading-summary.md`

### 2. 0DTE Signal Monitor
**Purpose:** Real-time signal detection with multi-factor analysis

**Run:** `node scripts/0dte-signal-monitor.js`

**Assesses:**
- Gap direction (gap up = favorable, gap down = avoid)
- Intraday range (>1% = favorable, <0.5% = avoid)
- Day-of-week and month patterns
- Overall confidence score

**Output:** `data/latest-signal.md`

**Exit Codes:**
- `1` = FAVORABLE (alert-worthy)
- `0` = NEUTRAL
- `2` = UNFAVORABLE

### 3. Portfolio Dashboard
**Purpose:** Performance tracking across all strategies

**Run:** `node scripts/portfolio-dashboard.js`

**Shows:**
- Account status (IBKR, Hyperliquid, Solana)
- Historical backtest results (10-year SPX 0DTE)
- Win rates, P/L, profit factor
- Recent activity

**Output:** `data/portfolio-dashboard.md`

### 4. SPX 0DTE Analyzer
**Purpose:** Options probability analysis with pattern enhancement

**Run:** `node scripts/spx-0dte-analyzer.js`

**Features:**
- Calculates 0DTE option probabilities
- Incorporates 10-year historical patterns
- Adjusts viability based on day/month
- FAVORABLE/NEUTRAL/UNFAVORABLE signals

### 5. Market Swing Monitor
**Purpose:** Detect large price movements and post to X

**Run:** `node scripts/market-swing-monitor.js`

**Triggers:** 50+ point swing in SPX
**Posts to:** @CShoggoth83269

## ⏰ Automated Schedule

| Time (UTC) | Job | Purpose |
|------------|-----|---------|
| 6:30 | Market Swing Monitor | Early swing detection |
| 6:30 | Daily Trading Summary | Pre-market analysis |
| 15:00 | 0DTE Signal Check | Gap + early range (10 AM EST) |
| 18:30 | 0DTE Signal Check | Midday reassessment (1:30 PM EST) |
| 18:35 | SPX Options Analyzer | Afternoon analysis (1:35 PM EST) |

## 📈 SPX 0DTE RIC Strategy

**Backtest:** 10 years (2,531 trading days, 2016-2026)

**Key Findings:**
- **Total P/L:** +$1,062.22
- **Win Rate:** 19.8%
- **Profit Factor:** 4.49:1 (wins 4.49x larger than losses)
- **Avg Win:** $22.13
- **Avg Loss:** -$4.93

**When to Trade:**
✅ **Best:** Thursday, Friday (22-23% win rate)
✅ **Best:** March, April (27-34% win rate)
✅ **Best:** Gap up days (24.4% win rate)
✅ **Best:** Wide range days >1% (30.7% win rate)

**When to Avoid:**
❌ **Worst:** Monday, Tuesday (17-19% win rate)
❌ **Worst:** July, August (12.6% win rate)
❌ **Worst:** Gap down days (16.2% win rate)
❌ **Worst:** Narrow range <0.5% (0% win rate!)

**Strategy:**
- Long call at (open + 50)
- Long put at (open - 50)
- Risk: $5 premium per trade
- Position size: 1-2% of portfolio

## 🛠️ Skills Installed

| Skill | Purpose |
|-------|---------|
| stock-analysis | 8-dimension stock analysis, portfolio management |
| portfolio-watcher | Real-time portfolio monitoring |
| financial-market-analysis | Market sentiment, news analysis |
| yahoo-finance | Price data, fundamentals |
| ibkr-trader | Interactive Brokers trading |
| hyperliquid-trading | Crypto perpetual futures |
| hyperliquid | Additional Hyperliquid tools |
| solana-trader | Solana ecosystem trading |

## 📁 Data Files

- `data/spx-0dte-backtest-results.json` - 10-year backtest data
- `data/spx-0dte-patterns.json` - Historical patterns
- `data/daily-trading-summary.md` - Daily pre-market analysis
- `data/latest-signal.md` - Latest 0DTE signal
- `data/portfolio-dashboard.md` - Performance dashboard
- `data/portfolio-config.json` - Account configuration (gitignored)

## 🔧 Configuration

**Environment Variables:**
- `DATA_SOURCE=yahoo` - Use Yahoo Finance (default)
- `DATA_SOURCE=financialdatasets` - Use FinancialDatasets API

**Twitter/X Auth:** `.twitter-auth.env` (gitignored)
```
TWITTER_AUTH_TOKEN="your_token"
TWITTER_USERNAME="your_username"
```

## 🎯 Workflow

**Morning (Before Market Open):**
1. Run daily trading summary
2. Review day/month patterns
3. Check if conditions are favorable

**At Open (9:30 AM EST / 14:30 UTC):**
1. Monitor gap direction
2. Wait 30 min for initial range
3. Run signal monitor at 10:00 AM EST

**Midday:**
1. Reassess conditions
2. Check intraday range
3. If favorable, execute RIC trade

**Afternoon:**
1. Run SPX options analyzer
2. Review trade performance
3. Update portfolio dashboard

**Evening:**
1. Review daily performance
2. Plan tomorrow's trades
3. Update memory files

## 📊 Git Workflow

```bash
# View changes
git status

# Commit new features
git add scripts/
git commit -m "feat: description"

# Push to remote (when set up)
git push origin master
```

## 🤖 Proactive Features

This workspace includes automation that:

- ✅ Monitors market conditions 5x per day
- ✅ Alerts on favorable trading setups
- ✅ Warns about unfavorable conditions
- ✅ Tracks portfolio performance
- ✅ Posts swing alerts to X
- ✅ Generates daily summaries
- ✅ Runs automated backtests

## 🚨 Risk Management

**Entry Rules:**
- Only trade when 2+ favorable conditions align
- Maximum 1-2% portfolio risk per trade
- Stop after 3 consecutive losses

**Exit Rules:**
- Close at market close
- Take profits at target (50+ point move)
- Cut losses if wings invalidated

**Avoid:**
- Gap down days (16% win rate)
- Narrow range days <0.5% (0% win rate!)
- Monday/Tuesday in July/August (worst combo)

## 📝 Notes

- All times in UTC unless specified
- Market hours: 14:30-21:00 UTC (9:30 AM-4:00 PM EST)
- Backtest data: 2016-2026 (10 years)
- Pattern-based entry reduces risk and improves win rate

---

**Built for a one-man trading business. Automate everything, trade smart.**
