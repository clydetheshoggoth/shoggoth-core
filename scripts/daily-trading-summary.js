#!/usr/bin/env node

/**
 * Daily Trading Summary Dashboard
 * Compiles all trading signals, patterns, and market conditions into one daily report
 */

const fs = require('fs');
const path = require('path');

// Load SPX 0DTE patterns
function loadPatterns() {
  try {
    const patternsPath = path.join(__dirname, '../data/spx-0dte-patterns.json');
    if (fs.existsSync(patternsPath)) {
      const data = fs.readFileSync(patternsPath, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error loading patterns:', error.message);
  }
  return null;
}

// Get current date context
function getDateContext() {
  const now = new Date();
  return {
    date: now.toISOString().split('T')[0],
    dayOfWeek: now.toLocaleDateString('en-US', { weekday: 'long' }),
    dayOfWeekIndex: now.getDay(), // 0 = Sunday, 1 = Monday, etc.
    month: now.toLocaleDateString('en-US', { month: 'long' }),
    monthIndex: now.getMonth(),
    hour: now.getHours()
  };
}

// Assess day-of-week favorability
function assessDayOfWeek(dateContext, patterns) {
  if (!patterns || !patterns.byDayOfWeek) {
    return { signal: 'NEUTRAL', reason: 'No pattern data available' };
  }

  const dayPattern = patterns.byDayOfWeek.find(
    d => d.day === dateContext.dayOfWeek
  );

  if (!dayPattern || dayPattern.total === 0) {
    return { signal: 'NEUTRAL', reason: 'Weekend - no trading' };
  }

  const winRate = parseFloat(dayPattern.winRate);
  const avgPnL = parseFloat(dayPattern.avgPnL);

  if (winRate >= 22 || avgPnL >= 1.0) {
    return { signal: 'FAVORABLE', winRate, avgPnL, reason: `Historically strong: ${winRate}% win rate` };
  } else if (winRate <= 17 || avgPnL < 0) {
    return { signal: 'UNFAVORABLE', winRate, avgPnL, reason: `Historically weak: ${winRate}% win rate` };
  } else {
    return { signal: 'NEUTRAL', winRate, avgPnL, reason: 'Average historical performance' };
  }
}

// Assess month favorability
function assessMonth(dateContext, patterns) {
  if (!patterns || !patterns.byMonth) {
    return { signal: 'NEUTRAL', reason: 'No pattern data available' };
  }

  const monthPattern = patterns.byMonth.find(
    m => m.month === dateContext.month
  );

  if (!monthPattern) {
    return { signal: 'NEUTRAL', reason: 'No month data' };
  }

  const winRate = parseFloat(monthPattern.winRate);
  const avgPnL = parseFloat(monthPattern.avgPnL);

  if (winRate >= 25 || avgPnL >= 3.0) {
    return { signal: 'FAVORABLE', winRate, avgPnL, reason: `Strong seasonal month: ${winRate}% win rate` };
  } else if (winRate <= 14 || avgPnL < -2.0) {
    return { signal: 'UNFAVORABLE', winRate, avgPnL, reason: `Weak seasonal month: ${winRate}% win rate` };
  } else {
    return { signal: 'NEUTRAL', winRate, avgPnL, reason: 'Average seasonal performance' };
  }
}

// Check if it's trading hours (US market)
function isTradingHours(dateContext) {
  const day = dateContext.dayOfWeekIndex;
  const hour = dateContext.hour;

  // Monday-Friday, 9:30 AM - 4:00 PM EST (convert to UTC)
  // EST is UTC-5, so 9:30 AM EST = 14:30 UTC, 4:00 PM EST = 21:00 UTC
  const isWeekday = day >= 1 && day <= 5;
  const isMarketHours = hour >= 14 && hour < 21;

  return isWeekday && isMarketHours;
}

// Get 0DTE entry checklist
function get0DTEChecklist(dateContext, dayAssessment, monthAssessment) {
  const checklist = {
    canTrade: true,
    items: [
      {
        item: 'Day of Week',
        status: dayAssessment.signal !== 'UNFAVORABLE' ? '✅' : '❌',
        detail: `${dateContext.dayOfWeek}: ${dayAssessment.reason}`
      },
      {
        item: 'Month Seasonality',
        status: monthAssessment.signal !== 'UNFAVORABLE' ? '✅' : '⚠️',
        detail: `${dateContext.month}: ${monthAssessment.reason}`
      },
      {
        item: 'Trading Hours',
        status: isTradingHours(dateContext) ? '✅' : '⏰',
        detail: isTradingHours(dateContext) ? 'Market is open' : 'Market is closed'
      },
      {
        item: 'Gap Check',
        status: '⏳',
        detail: 'Check at open (9:30 AM EST)'
      },
      {
        item: 'Range Check',
        status: '⏳',
        detail: 'Check after 30 min (10:00 AM EST)'
      }
    ]
  };

  // Overall assessment
  const hasUnfavorable = dayAssessment.signal === 'UNFAVORABLE' || monthAssessment.signal === 'UNFAVORABLE';
  const hasFavorable = dayAssessment.signal === 'FAVORABLE' || monthAssessment.signal === 'FAVORABLE';

  if (hasUnfavorable) {
    checklist.canTrade = false;
    checklist.overall = 'AVOID 0DTE today - unfavorable conditions';
  } else if (hasFavorable && isTradingHours(dateContext)) {
    checklist.overall = 'FAVORABLE - good setup for 0DTE RIC';
  } else {
    checklist.overall = 'NEUTRAL - wait for gap and range checks';
  }

  return checklist;
}

// Format summary
function formatSummary(dateContext, dayAssessment, monthAssessment, checklist) {
  const lines = [];

  lines.push('📊 **DAILY TRADING SUMMARY**');
  lines.push('');
  lines.push(`📅 ${dateContext.dayOfWeek}, ${dateContext.month} ${dateContext.date}`);
  lines.push('');

  lines.push('## Pattern Analysis');
  lines.push('');
  lines.push(`**Day of Week:** ${dayAssessment.signal} ${dayAssessment.signal === 'FAVORABLE' ? '🟢' : dayAssessment.signal === 'UNFAVORABLE' ? '🔴' : '🟡'}`);
  lines.push(`  ${dayAssessment.reason}`);
  lines.push('');

  lines.push(`**Month Seasonality:** ${monthAssessment.signal} ${monthAssessment.signal === 'FAVORABLE' ? '🟢' : monthAssessment.signal === 'UNFAVORABLE' ? '🔴' : '🟡'}`);
  lines.push(`  ${monthAssessment.reason}`);
  lines.push('');

  lines.push('## 0DTE RIC Entry Checklist');
  lines.push('');
  checklist.items.forEach(item => {
    lines.push(`${item.status} **${item.item}** - ${item.detail}`);
  });
  lines.push('');
  lines.push(`**Overall:** ${checklist.overall}`);
  lines.push('');

  // Add action items
  lines.push('## Action Items');
  lines.push('');
  if (checklist.canTrade) {
    lines.push('✅ Monitor for gap up at open (favorable)');
    lines.push('✅ Check intraday range after 30 min (target >1%)');
    lines.push('✅ If conditions align: Consider RIC with +/- 50pt wings');
  } else {
    lines.push('❌ Skip 0DTE trading today');
    lines.push('📋 Review market conditions for better setup tomorrow');
  }
  lines.push('');

  lines.push('---');
  lines.push('*Based on 10-year backtest of SPX 0DTE RIC strategy*');
  lines.push('*Data: 2,531 trading days (2016-2026)*');

  return lines.join('\n');
}

// Main function
async function main() {
  console.error('📊 Generating daily trading summary...');

  const dateContext = getDateContext();
  const patterns = loadPatterns();

  const dayAssessment = assessDayOfWeek(dateContext, patterns);
  const monthAssessment = assessMonth(dateContext, patterns);
  const checklist = get0DTEChecklist(dateContext, dayAssessment, monthAssessment);

  const summary = formatSummary(dateContext, dayAssessment, monthAssessment, checklist);

  console.log(summary);

  // Save summary to file
  const summaryPath = path.join(__dirname, '../data/daily-trading-summary.md');
  fs.writeFileSync(summaryPath, summary, 'utf8');
  console.error(`✅ Saved summary to ${summaryPath}`);
}

if (require.main === module) {
  main().catch(error => {
    console.error('Error:', error);
    process.exit(1);
  });
}

module.exports = { getDateContext, assessDayOfWeek, assessMonth, get0DTEChecklist };
