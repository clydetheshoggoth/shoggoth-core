#!/usr/bin/env node

/**
 * Automated 0DTE Trade Signal Monitor
 * Monitors market conditions and sends alerts when favorable RIC setups appear
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Load SPX 0DTE patterns
function loadPatterns() {
  try {
    const patternsPath = path.join(__dirname, '../data/spx-0dte-patterns.json');
    if (fs.existsSync(patternsPath)) {
      return JSON.parse(fs.readFileSync(patternsPath, 'utf8'));
    }
  } catch (error) {
    console.error('Error loading patterns:', error.message);
  }
  return null;
}

// Get current SPX data
async function getSPXData() {
  try {
    const url = 'https://query1.finance.yahoo.com/v8/finance/chart/%5EGSPC?interval=1d&range=2d';
    const response = await axios.get(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
    });

    const result = response.data.chart.result[0];
    const meta = result.meta;
    const quote = result.indicators.quote[0];

    return {
      current: meta.regularMarketPrice,
      previousClose: meta.previousClose,
      open: quote.open[1] || meta.previousClose, // Today's open
      high: quote.high[1] || meta.regularMarketPrice,
      low: quote.low[1] || meta.regularMarketPrice,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error fetching SPX data:', error.message);
    throw error;
  }
}

// Calculate gap
function calculateGap(spxData) {
  const gap = spxData.open - spxData.previousClose;
  const gapPercent = (gap / spxData.previousClose) * 100;
  return {
    gap,
    gapPercent,
    direction: gap > 0 ? 'UP' : gap < 0 ? 'DOWN' : 'NONE'
  };
}

// Calculate intraday range
function calculateRange(spxData) {
  const range = spxData.high - spxData.low;
  const rangePercent = (range / spxData.open) * 100;
  return { range, rangePercent };
}

// Get date context
function getDateContext() {
  const now = new Date();
  return {
    dayOfWeek: now.toLocaleDateString('en-US', { weekday: 'long' }),
    month: now.toLocaleDateString('en-US', { month: 'long' }),
    hour: now.getHours(),
    isTradingDay: now.getDay() >= 1 && now.getDay() <= 5
  };
}

// Assess all conditions
function assessConditions(spxData, gap, range, dateContext, patterns) {
  const conditions = {
    dayOfWeek: { name: 'Day of Week', signal: 'NEUTRAL', score: 0 },
    month: { name: 'Month Seasonality', signal: 'NEUTRAL', score: 0 },
    gap: { name: 'Gap Direction', signal: 'NEUTRAL', score: 0 },
    range: { name: 'Intraday Range', signal: 'NEUTRAL', score: 0 },
    overall: { signal: 'NEUTRAL', confidence: 0, reasons: [] }
  };

  // Day of week assessment
  if (patterns && patterns.byDayOfWeek) {
    const dayPattern = patterns.byDayOfWeek.find(d => d.day === dateContext.dayOfWeek);
    if (dayPattern) {
      const winRate = parseFloat(dayPattern.winRate);
      if (winRate >= 22) {
        conditions.dayOfWeek.signal = 'FAVORABLE';
        conditions.dayOfWeek.score = 2;
        conditions.overall.reasons.push(`${dateContext.dayOfWeek}: ${winRate}% win rate`);
      } else if (winRate <= 17) {
        conditions.dayOfWeek.signal = 'UNFAVORABLE';
        conditions.dayOfWeek.score = -2;
        conditions.overall.reasons.push(`${dateContext.dayOfWeek}: ${winRate}% win rate (weak)`);
      }
    }
  }

  // Month assessment
  if (patterns && patterns.byMonth) {
    const monthPattern = patterns.byMonth.find(m => m.month === dateContext.month);
    if (monthPattern) {
      const winRate = parseFloat(monthPattern.winRate);
      if (winRate >= 25) {
        conditions.month.signal = 'FAVORABLE';
        conditions.month.score = 2;
        conditions.overall.reasons.push(`${dateContext.month}: ${winRate}% win rate`);
      } else if (winRate <= 14) {
        conditions.month.signal = 'UNFAVORABLE';
        conditions.month.score = -2;
        conditions.overall.reasons.push(`${dateContext.month}: ${winRate}% win rate (weak)`);
      }
    }
  }

  // Gap assessment
  if (gap.direction === 'UP' && Math.abs(gap.gapPercent) >= 0.3) {
    conditions.gap.signal = 'FAVORABLE';
    conditions.gap.score = 2;
    conditions.overall.reasons.push(`Gap up ${gap.gapPercent.toFixed(2)}%`);
  } else if (gap.direction === 'DOWN' && Math.abs(gap.gapPercent) >= 0.3) {
    conditions.gap.signal = 'UNFAVORABLE';
    conditions.gap.score = -2;
    conditions.overall.reasons.push(`Gap down ${gap.gapPercent.toFixed(2)}% (avoid)`);
  }

  // Range assessment
  if (range.rangePercent >= 1.0) {
    conditions.range.signal = 'FAVORABLE';
    conditions.range.score = 3;
    conditions.overall.reasons.push(`Wide range ${range.rangePercent.toFixed(2)}%`);
  } else if (range.rangePercent < 0.5) {
    conditions.range.signal = 'UNFAVORABLE';
    conditions.range.score = -3;
    conditions.overall.reasons.push(`Narrow range ${range.rangePercent.toFixed(2)}% (avoid)`);
  }

  // Calculate overall
  const totalScore = conditions.dayOfWeek.score + conditions.month.score +
                     conditions.gap.score + conditions.range.score;

  if (totalScore >= 4) {
    conditions.overall.signal = 'FAVORABLE';
    conditions.overall.confidence = Math.min(95, 60 + totalScore * 5);
  } else if (totalScore <= -3) {
    conditions.overall.signal = 'UNFAVORABLE';
    conditions.overall.confidence = Math.min(95, 60 + Math.abs(totalScore) * 5);
  } else {
    conditions.overall.confidence = Math.max(30, 50 - Math.abs(totalScore) * 5);
  }

  return conditions;
}

// Format alert
function formatAlert(spxData, gap, range, conditions, dateContext) {
  const emoji = conditions.overall.signal === 'FAVORABLE' ? '🟢' :
                conditions.overall.signal === 'UNFAVORABLE' ? '🔴' : '🟡';

  const lines = [];
  lines.push(`${emoji} **0DTE TRADE SIGNAL**`);
  lines.push('');
  lines.push(`**Signal:** ${conditions.overall.signal} (${conditions.overall.confidence}% confidence)`);
  lines.push('');
  lines.push(`**SPX:** ${spxData.current.toFixed(2)} (${(spxData.current - spxData.previousClose).toFixed(2)})`);
  lines.push(`**Gap:** ${gap.direction} ${Math.abs(gap.gapPercent).toFixed(2)}%`);
  lines.push(`**Range:** ${range.rangePercent.toFixed(2)}% (${range.range.toFixed(2)} pts)`);
  lines.push('');

  lines.push('**Conditions:**');
  Object.entries(conditions).forEach(([key, condition]) => {
    if (key !== 'overall') {
      const emoji = condition.signal === 'FAVORABLE' ? '✅' :
                    condition.signal === 'UNFAVORABLE' ? '❌' : '⚪';
      lines.push(`  ${emoji} ${condition.name}: ${condition.signal}`);
    }
  });

  if (conditions.overall.reasons.length > 0) {
    lines.push('');
    lines.push('**Why:**');
    conditions.overall.reasons.forEach(reason => {
      lines.push(`  • ${reason}`);
    });
  }

  lines.push('');

  if (conditions.overall.signal === 'FAVORABLE') {
    lines.push('**Action:** Consider 0DTE RIC with +/- 50pt wings');
    lines.push('**Risk:** 1-2% of portfolio per trade');
  } else if (conditions.overall.signal === 'UNFAVORABLE') {
    lines.push('**Action:** Skip 0DTE trading today');
    lines.push('**Reason:** Unfavorable conditions detected');
  } else {
    lines.push('**Action:** Wait for more favorable setup');
    lines.push('**Monitor:** Gap and range conditions');
  }

  return lines.join('\n');
}

// Main function
async function main() {
  console.error('🔍 Checking market conditions...');

  const patterns = loadPatterns();
  const dateContext = getDateContext();

  if (!dateContext.isTradingDay) {
    console.log('⏰ Market closed - weekend');
    process.exit(0);
  }

  const spxData = await getSPXData();
  const gap = calculateGap(spxData);
  const range = calculateRange(spxData);
  const conditions = assessConditions(spxData, gap, range, dateContext, patterns);

  const alert = formatAlert(spxData, gap, range, conditions, dateContext);

  console.log(alert);

  // Save last alert
  const alertPath = path.join(__dirname, '../data/latest-signal.md');
  fs.writeFileSync(alertPath, alert, 'utf8');

  // Exit with signal code (1 for favorable, 0 for neutral, 2 for unfavorable)
  if (conditions.overall.signal === 'FAVORABLE') {
    console.error('✅ FAVORABLE setup detected!');
    process.exit(1);
  } else if (conditions.overall.signal === 'UNFAVORABLE') {
    console.error('❌ UNFAVORABLE conditions - skip trading');
    process.exit(2);
  } else {
    console.error('⏸️  NEUTRAL conditions - wait');
    process.exit(0);
  }
}

if (require.main === module) {
  main().catch(error => {
    console.error('Error:', error);
    process.exit(1);
  });
}

module.exports = { assessConditions, formatAlert };
